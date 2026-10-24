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
import {
  type PrivateDocumentHooks,
  PrivateDocumentStore,
} from '../documents/privateDocumentStore';
import { AutomationIpcClient } from '../ipc/AutomationIpcClient';

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
  const privateHooks: PrivateDocumentHooks = {
    ...options.hooks,
    fonts: () => options.documents.fonts(),
    ensureFonts: (families) => options.documents.ensureFonts(families),
  };
  const privateStore = options.privateStore;
  const mode = privateStore ? 'headless' : 'interactive';
  let activeBatchStore: PrivateDocumentStore | undefined;
  onBeforeUnmount(() => {
    privateStore?.clear();
    activeBatchStore?.clear();
  });
  const documentTools = new McpDocumentAdapter(
    options.documents,
    ipc,
    exportAutomationPdf,
    options.renderPages,
    (workspace, pageNumber, maxEdge) =>
      ipc.previewPage(options.snapshot(workspace), pageNumber, maxEdge),
    mode,
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
        const batchStore = new PrivateDocumentStore(privateHooks);
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
      } else {
        result = await documentTools.execute(request);
      }
      reply = { requestId: message.requestId, success: true, result };
    } catch (error) {
      reply = {
        requestId: message.requestId,
        success: false,
        error: automationError(error),
      };
    }
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
      privateStore?.clear();
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
      (privateStore?.owns(workspace) ?? false) ||
      (activeBatchStore?.owns(workspace) ?? false),
  };
}
