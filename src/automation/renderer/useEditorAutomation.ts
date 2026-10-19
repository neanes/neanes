import { onBeforeUnmount, onMounted } from 'vue';

import { EventBus } from '@/eventBus';
import { IpcMainChannels, IpcRendererChannels } from '@/ipc/ipcChannels';
import type { Page } from '@/models/Page';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import type { DocumentService } from '@/services/documents/DocumentService';
import type { ScoreRenderSnapshot } from '@/services/documents/scoreRenderSnapshot';
import { Unit } from '@/utils/Unit';

import { editorBusyError, type EditorBusyState } from '../contracts/editorBusy';
import { AutomationError, automationError } from '../contracts/errors';
import {
  type AutomationMessage,
  type AutomationReply,
  parseAutomationRequest,
} from '../contracts/protocol';
import { canRunWhileEditorBusy } from '../contracts/toolBehavior';
import { McpDocumentAdapter } from '../documents/McpDocumentAdapter';
import { AutomationIpcClient } from '../ipc/AutomationIpcClient';
import { IsolatedSessions } from '../sessions/isolatedSessions';

export function useEditorAutomation(options: {
  enabled: boolean;
  requireSessions?: boolean;
  documents: DocumentService;
  busyState(): EditorBusyState | null;
  createScore(): Score;
  prepare(workspace: Workspace): void;
  dispose(workspace: Workspace): void;
  settle(workspace: Workspace): Promise<void>;
  snapshot(workspace: Workspace): ScoreRenderSnapshot;
  renderPages(workspace: Workspace): Promise<Page[]>;
}) {
  if (!options.enabled) {
    return { ready() {}, ownsPrivateWorkspace: () => false };
  }
  const ipc = new AutomationIpcClient();
  const isolatedSessions = new IsolatedSessions({
    createScore: options.createScore,
    prepare: options.prepare,
    dispose: options.dispose,
    fonts: () => options.documents.fonts(),
    ensureFonts: (families) => options.documents.ensureFonts(families),
    settle: options.settle,
  });
  const isolatedTools = new Map<DocumentService, McpDocumentAdapter>();
  const publishDrafts = () =>
    EventBus.$emit(
      IpcRendererChannels.AutomationDraftsChanged,
      isolatedSessions.hasUnsavedDrafts(),
    );
  const isolatedSessionTimer = setInterval(() => {
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
    clearInterval(isolatedSessionTimer);
    isolatedSessions.clear();
    isolatedTools.clear();
  });
  const documentTools = new McpDocumentAdapter(
    options.documents,
    ipc,
    exportAutomationPdf,
    options.renderPages,
    (workspace, pageNumber, maxEdge, expectedGeometry) =>
      ipc.previewPage(
        options.snapshot(workspace),
        pageNumber,
        maxEdge,
        expectedGeometry,
      ),
    options.requireSessions ? 'headless' : 'interactive',
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
      if (request.tool === 'create_session') {
        result = isolatedSessions.create();
      } else if (request.tool === 'close_session') {
        const service = isolatedSessions.get(request.arguments.sessionId);
        result = isolatedSessions.close(
          request.arguments.sessionId,
          request.arguments.discardUnsavedChanges,
        );
        isolatedTools.delete(service);
      } else {
        if (
          options.requireSessions &&
          request.tool !== 'get_capabilities' &&
          request.tool !== 'get_element_catalog' &&
          request.tool !== 'get_mode_key_templates' &&
          request.tool !== 'get_rich_text_format' &&
          (!('sessionId' in request.arguments) || !request.arguments.sessionId)
        ) {
          throw new AutomationError({
            code: 'SESSION_REQUIRED',
            message:
              'Headless documents require a session. Call create_session and pass sessionId to document tools.',
            details: {},
          });
        }
        let adapter = documentTools;
        if ('sessionId' in request.arguments && request.arguments.sessionId) {
          const service = isolatedSessions.get(request.arguments.sessionId);
          const existing = isolatedTools.get(service);
          if (existing) {
            adapter = existing;
          } else {
            adapter = new McpDocumentAdapter(
              service,
              ipc,
              exportAutomationPdf,
              options.renderPages,
              (workspace, pageNumber, maxEdge, expectedGeometry) =>
                ipc.previewPage(
                  options.snapshot(workspace),
                  pageNumber,
                  maxEdge,
                  expectedGeometry,
                ),
              options.requireSessions ? 'headless' : 'interactive',
            );
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
  let requestQueue = Promise.resolve();
  const enqueue = (message: AutomationMessage) => {
    requestQueue = requestQueue
      .then(() => onAutomationRequest(message))
      .catch((error) => console.error(error));
  };
  const reset = () => {
    requestQueue = requestQueue.then(() => {
      isolatedSessions.clear();
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
      isolatedSessions.owns(workspace),
  };
}
