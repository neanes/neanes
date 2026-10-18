import { onBeforeUnmount, onMounted } from 'vue';

import { EventBus } from '@/eventBus';
import { IpcMainChannels, IpcRendererChannels } from '@/ipc/ipcChannels';
import type { Page } from '@/models/Page';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import type { DocumentService } from '@/services/documents/DocumentService';
import type { ScoreRenderSnapshot } from '@/services/documents/scoreRenderSnapshot';
import { Unit } from '@/utils/Unit';

import { AutomationError, automationError } from '../contracts/errors';
import {
  type AutomationMessage,
  type AutomationReply,
  parseAutomationRequest,
} from '../contracts/protocol';
import { McpDocumentAdapter } from '../documents/McpDocumentAdapter';
import { AutomationIpcClient } from '../ipc/AutomationIpcClient';
import { IsolatedSessions } from '../sessions/isolatedSessions';

export function useEditorAutomation(options: {
  enabled: boolean;
  requireSessions?: boolean;
  documents: DocumentService;
  isBusy(): boolean;
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
  const isolatedSessionTimer = setInterval(() => {
    isolatedSessions.expire();
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
    options.requireSessions ? 'headless' : 'interactive',
  );

  async function onAutomationRequest(message: AutomationMessage) {
    ipc.requestId = message.requestId;
    let reply: AutomationReply;
    try {
      await ipc.authorizeRequest();
      if (options.isBusy()) {
        throw new Error('EDITOR_BUSY');
      }
      const request = parseAutomationRequest(message.request);
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
  onMounted(() => EventBus.$on(IpcMainChannels.AutomationRequest, enqueue));
  onBeforeUnmount(() =>
    EventBus.$off(IpcMainChannels.AutomationRequest, enqueue),
  );
  return {
    ready: () => EventBus.$emit(IpcRendererChannels.AutomationReady),
    ownsPrivateWorkspace: (workspace: Workspace) =>
      isolatedSessions.owns(workspace),
  };
}
