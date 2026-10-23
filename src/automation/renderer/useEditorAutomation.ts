import { onBeforeUnmount, onMounted } from 'vue';

import { EventBus } from '@/eventBus';
import { IpcMainChannels, IpcRendererChannels } from '@/ipc/ipcChannels';
import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import type { DocumentService } from '@/services/documents/DocumentService';
import type { ScoreRenderSnapshot } from '@/services/rendering/scoreRenderSnapshot';
import { OperationQueue } from '@/utils/OperationQueue';
import { Unit } from '@/utils/Unit';

import { editorBusyError, type EditorBusyState } from '../contracts/editorBusy';
import { automationError } from '../contracts/errors';
import {
  type AutomationMessage,
  type AutomationReply,
  parseAutomationRequest,
} from '../contracts/protocol';
import { canRunWhileEditorBusy } from '../contracts/toolBehavior';
import { batchUpdateFiles } from '../documents/batchFiles';
import { McpDocumentAdapter } from '../documents/McpDocumentAdapter';
import { AutomationIpcClient } from '../ipc/AutomationIpcClient';
import { IsolatedSessions } from '../sessions/isolatedSessions';
import {
  type PrivateDocumentHooks,
  PrivateDocumentStore,
} from '../sessions/privateDocumentStore';

export function useEditorAutomation(options: {
  enabled: boolean;
  documents: DocumentService;
  privateStore?: PrivateDocumentStore;
  busyState(): EditorBusyState | null;
  hooks: Omit<PrivateDocumentHooks, 'fonts' | 'ensureFonts'>;
  snapshot(workspace: Workspace): ScoreRenderSnapshot;
  renderPages(workspace: Workspace): Promise<Page[]>;
}) {
  if (!options.enabled) {
    return { ready() {}, ownsPrivateWorkspace: () => false };
  }
  const ipc = new AutomationIpcClient();
  const sessionHooks: PrivateDocumentHooks = {
    ...options.hooks,
    fonts: () => options.documents.fonts(),
    ensureFonts: (families) => options.documents.ensureFonts(families),
  };
  const privateStore = options.privateStore;
  const mode = privateStore ? 'headless' : 'interactive';
  const isolatedSessions = privateStore
    ? undefined
    : new IsolatedSessions(sessionHooks);
  let activeBatchStore: PrivateDocumentStore | undefined;
  const isolatedTools = new Map<DocumentService, McpDocumentAdapter>();
  const publishDrafts = () =>
    EventBus.$emit(
      IpcRendererChannels.AutomationDraftsChanged,
      privateStore
        ? privateStore.hasUnsavedDrafts()
        : isolatedSessions!.hasUnsavedDrafts(),
    );
  const isolatedSessionTimer =
    isolatedSessions &&
    setInterval(() => {
      isolatedSessions.expire();
      publishDrafts();
      for (const service of isolatedTools.keys()) {
        if (
          !service.list().some((workspace) => isolatedSessions.owns(workspace))
        ) {
          isolatedTools.delete(service);
        }
      }
    }, 30_000);
  onBeforeUnmount(() => {
    if (isolatedSessionTimer) {
      clearInterval(isolatedSessionTimer);
    }
    isolatedSessions?.clear();
    privateStore?.clear();
    activeBatchStore?.clear();
    isolatedTools.clear();
  });
  const createAdapter = (service: DocumentService) =>
    new McpDocumentAdapter(
      service,
      ipc,
      exportAutomationPdf,
      options.renderPages,
      (workspace, pageNumber, maxEdge) =>
        ipc.previewPage(options.snapshot(workspace), pageNumber, maxEdge),
      mode,
    );
  const documentTools = createAdapter(
    privateStore?.documents ?? options.documents,
  );

  async function onAutomationRequest(message: AutomationMessage) {
    ipc.requestId = message.requestId;
    let reply: AutomationReply;
    try {
      await ipc.authorizeRequest();
      const request = parseAutomationRequest(message.request);
      if (!canRunWhileEditorBusy(request.tool)) {
        const busy = options.busyState();
        if (busy) {
          throw editorBusyError(busy);
        }
      }
      let result: unknown;
      if (request.tool === 'discover_score_files') {
        throw new Error(
          'AUTOMATION_REQUEST_REQUIRED: Discovery runs in the main process.',
        );
      } else if (request.tool === 'batch_update_files') {
        const batchStore = new PrivateDocumentStore(sessionHooks);
        activeBatchStore = batchStore;
        try {
          result = await batchUpdateFiles(
            request.arguments,
            batchStore.documents,
            ipc,
            exportAutomationPdf,
          );
        } finally {
          batchStore.clear();
          activeBatchStore = undefined;
        }
      } else if (request.tool === 'create_session') {
        if (!isolatedSessions) {
          throw new Error('TOOL_NOT_FOUND');
        }
        result = isolatedSessions.create();
      } else if (request.tool === 'close_session') {
        if (!isolatedSessions) {
          throw new Error('TOOL_NOT_FOUND');
        }
        const service = isolatedSessions.get(request.arguments.sessionId);
        result = isolatedSessions.close(
          request.arguments.sessionId,
          request.arguments.discardUnsavedChanges,
        );
        isolatedTools.delete(service);
      } else {
        let adapter = documentTools;
        if ('sessionId' in request.arguments && request.arguments.sessionId) {
          if (!isolatedSessions) {
            throw new Error('VALIDATION_ERROR');
          }
          const service = isolatedSessions.get(request.arguments.sessionId);
          const existing = isolatedTools.get(service);
          if (existing) {
            adapter = existing;
          } else {
            adapter = createAdapter(service);
            isolatedTools.set(service, adapter);
          }
        }
        result = await adapter.execute(request);
      }
      reply = { requestId: message.requestId, success: true, result };
    } catch (error) {
      reply = {
        requestId: message.requestId,
        success: false,
        error: automationError(error),
      };
    }
    publishDrafts();
    EventBus.$emit(IpcRendererChannels.AutomationReply, reply);
  }

  async function exportAutomationPdf(
    workspace: Workspace,
    filePath: string,
    overwrite: boolean,
  ) {
    const setup = workspace.score.pageSetup;
    await ipc.automationExportPdf({
      filePath,
      overwrite,
      pageSize: setup.pageSize,
      pageWidthInches: Unit.toInch(setup.pageWidthCustom),
      pageHeightInches: Unit.toInch(setup.pageHeightCustom),
      landscape: setup.landscape,
      snapshot: options.snapshot(workspace),
    });
  }

  // Keep renderer operations serialized across server disable/re-enable cycles.
  const requestQueue = new OperationQueue();
  const enqueue = (message: AutomationMessage) => {
    void requestQueue
      .run(() => onAutomationRequest(message))
      .catch((error) => console.error(error));
  };
  const reset = () => {
    void requestQueue.run(async () => {
      isolatedSessions?.clear();
      privateStore?.clear();
      isolatedTools.clear();
      publishDrafts();
    });
  };
  onMounted(() => {
    EventBus.$on(IpcMainChannels.AutomationRequest, enqueue);
    EventBus.$on(IpcMainChannels.AutomationReset, reset);
  });
  onBeforeUnmount(() => EventBus.$off(IpcMainChannels.AutomationReset, reset));
  onBeforeUnmount(() =>
    EventBus.$off(IpcMainChannels.AutomationRequest, enqueue),
  );
  return {
    ready: () => EventBus.$emit(IpcRendererChannels.AutomationReady),
    ownsPrivateWorkspace: (workspace: Workspace) =>
      (privateStore?.owns(workspace) ?? isolatedSessions!.owns(workspace)) ||
      (activeBatchStore?.owns(workspace) ?? false),
  };
}
