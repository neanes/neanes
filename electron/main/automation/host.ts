import { randomUUID } from 'node:crypto';

import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { ipcMain } from 'electron';

import { batchQuerySchema } from '../../../src/automation/contracts/batch';
import {
  AutomationError,
  automationOutcome,
} from '../../../src/automation/contracts/errors';
import type { PreviewPageResult } from '../../../src/automation/contracts/preview';
import type {
  AutomationMessage,
  AutomationReply,
  AutomationRequest,
} from '../../../src/automation/contracts/protocol';
import {
  IpcMainChannels,
  IpcRendererChannels,
} from '../../../src/ipc/ipcChannels';
import type {
  PdfExportOptions,
  WorkspaceFile,
  WriteScoreFileArgs,
} from '../../../src/services/documents/fileTypes';
import { withAbortDeadline } from './abortDeadline';
import { registerAgentHost } from './access';
import { discoverScoreFiles } from './fileDiscovery';
import { AutomationFiles } from './files';
import type { PreviewPageOptions } from './preview';
import { startMcpServer } from './server';

export async function startAutomationHost(options: {
  mode?: 'interactive' | 'headless';
  getWindow(): BrowserWindow | null;
  policyFile: string;
  policyToken: string;
  authorize(): Promise<unknown>;
  config?: { token: string; port: number };
  initiallyReady?: boolean;
  onStateChange?(): void;
  version: string;
  previewPage(
    args: PreviewPageOptions,
    signal: AbortSignal,
  ): Promise<PreviewPageResult>;
  printPdf(args: PdfExportOptions, signal: AbortSignal): Promise<Buffer>;
  withFileLock<T>(operation: () => Promise<T>): Promise<T>;
  runExclusive<T>(operation: () => Promise<T>): Promise<T>;
}) {
  const files = new AutomationFiles();
  let ready = options.initiallyReady ?? false;
  let closed = false;
  let failure: string | null = null;
  const detach = new Set<() => void>();
  let pending: {
    requestId: string;
    tool: AutomationRequest['tool'];
    resolve(value: unknown): void;
    reject(error: Error): void;
  } | null = null;
  const record = await registerAgentHost(
    options.policyFile,
    options.policyToken,
  );
  let dirty = false;
  const fileOperations = new Set<Promise<unknown>>();
  async function finishFileOperation<T>(operation: () => Promise<T>) {
    const result = operation();
    fileOperations.add(result);
    try {
      return await result;
    } finally {
      fileOperations.delete(result);
    }
  }
  await record.update(false, false);
  const onDraftsChanged = (event: Electron.IpcMainEvent, value: boolean) => {
    if (isSender(event) && typeof value === 'boolean' && !closed) {
      dirty = value;
      void record.update(dirty, pending !== null).catch(console.error);
    }
  };
  ipcMain.on(IpcRendererChannels.AutomationDraftsChanged, onDraftsChanged);
  let exportController: AbortController | null = null;

  function isSender(event: { sender: Electron.WebContents }) {
    return event.sender === options.getWindow()?.webContents;
  }
  function requireRequest(
    event: IpcMainInvokeEvent,
    tool: AutomationRequest['tool'],
    requestId: string,
  ) {
    if (
      closed ||
      !isSender(event) ||
      (pending?.tool !== tool &&
        !(
          pending?.tool === 'batch_update_files' &&
          [
            'open_document',
            'save_document',
            'export_pdf',
            'batch_update_files',
          ].includes(tool)
        )) ||
      pending.requestId !== requestId
    ) {
      throw new Error('AUTOMATION_REQUEST_REQUIRED');
    }
    if (pending.tool === 'batch_update_files') {
      exportController?.signal.throwIfAborted();
    }
  }

  const onReady = (event: Electron.IpcMainEvent) => {
    if (isSender(event)) {
      ready = true;
      failure = null;
      options.onStateChange?.();
    }
  };
  ipcMain.on(IpcRendererChannels.AutomationReady, onReady);
  const onReply = (event: Electron.IpcMainEvent, reply: AutomationReply) => {
    if (!isSender(event) || pending?.requestId !== reply.requestId) {
      return;
    }
    if (reply.success) {
      pending.resolve(reply.result);
    } else {
      pending.reject(new AutomationError(reply.error));
    }
  };
  ipcMain.on(IpcRendererChannels.AutomationReply, onReply);
  ipcMain.handle(
    IpcRendererChannels.AutomationAuthorizeRequest,
    (event, requestId: string) =>
      automationOutcome(async () => {
        if (closed || !isSender(event) || pending?.requestId !== requestId) {
          throw new Error('AUTOMATION_REQUEST_REQUIRED');
        }
        await options.authorize();
        if (pending?.tool === 'batch_update_files') {
          exportController?.signal.throwIfAborted();
        }
        return null;
      }),
  );
  ipcMain.handle(
    IpcRendererChannels.AutomationPlanBatch,
    (event, requestId: string, query: unknown) =>
      automationOutcome(async () => {
        await options.authorize();
        requireRequest(event, 'batch_update_files', requestId);
        await files.planBatch(batchQuerySchema.parse(query));
        return null;
      }),
  );
  ipcMain.handle(
    IpcRendererChannels.AutomationReadScore,
    (event, requestId: string, filePath: string, workspaces: WorkspaceFile[]) =>
      automationOutcome(async () => {
        await options.authorize();
        requireRequest(event, 'open_document', requestId);
        return files.open(filePath, workspaces);
      }),
  );
  ipcMain.handle(
    IpcRendererChannels.AutomationWriteScore,
    (event, requestId: string, args: WriteScoreFileArgs) =>
      automationOutcome(async () => {
        await options.authorize();
        requireRequest(event, 'save_document', requestId);
        return options.withFileLock(async () => {
          await options.authorize();
          requireRequest(event, 'save_document', requestId);
          return finishFileOperation(() => files.write(args));
        });
      }),
  );
  ipcMain.handle(
    IpcRendererChannels.AutomationExportPdf,
    (event, requestId: string, args: PdfExportOptions) =>
      automationOutcome(async () => {
        await options.authorize();
        requireRequest(event, 'export_pdf', requestId);
        await options.withFileLock(async () => {
          const filePath = await files.resolve(args.filePath, 'pdf', true);
          const signal = exportController!.signal;
          const data = await options.printPdf(args, signal);
          signal.throwIfAborted();
          await options.authorize();
          requireRequest(event, 'export_pdf', requestId);
          await finishFileOperation(() =>
            files.writeOutput(filePath, data, args.overwrite),
          );
        });
        return null;
      }),
  );

  ipcMain.handle(
    IpcRendererChannels.AutomationPreviewPage,
    (event, requestId: string, args: PreviewPageOptions) =>
      automationOutcome(async () => {
        await options.authorize();
        requireRequest(event, 'preview_page', requestId);
        const signal = exportController!.signal;
        signal.throwIfAborted();
        const image = await options.previewPage(args, signal);
        signal.throwIfAborted();
        await options.authorize();
        requireRequest(event, 'preview_page', requestId);
        return image;
      }),
  );

  function invalidate() {
    ready = false;
    failure = 'EDITOR_DISCONNECTED';
    options.onStateChange?.();
    exportController?.abort(new Error('EDITOR_DISCONNECTED'));
    pending?.reject(
      new AutomationError({
        code: 'EDITOR_DISCONNECTED',
        message:
          'The request may have partially completed. Inspect before retrying.',
        details: { outcome: 'unknown' },
      }),
    );
  }

  function removeHandlers() {
    ipcMain.removeListener(IpcRendererChannels.AutomationReady, onReady);
    ipcMain.removeListener(
      IpcRendererChannels.AutomationDraftsChanged,
      onDraftsChanged,
    );
    ipcMain.removeListener(IpcRendererChannels.AutomationReply, onReply);
    for (const channel of [
      IpcRendererChannels.AutomationAuthorizeRequest,
      IpcRendererChannels.AutomationPlanBatch,
      IpcRendererChannels.AutomationReadScore,
      IpcRendererChannels.AutomationWriteScore,
      IpcRendererChannels.AutomationExportPdf,
      IpcRendererChannels.AutomationPreviewPage,
    ]) {
      ipcMain.removeHandler(channel);
    }
  }
  const server = await startMcpServer({
    mode: options.mode,
    token: options.config?.token ?? process.env.NEANES_MCP_TOKEN ?? '',
    port: options.config?.port ?? Number(process.env.NEANES_MCP_PORT ?? 38765),
    version: options.version,
    authorize: options.authorize,
    async execute(request, signal) {
      if (request.tool === 'discover_score_files') {
        return withAbortDeadline(async (discoverySignal) => {
          const checkpoint = async () => {
            if (closed) {
              throw new Error('AGENT_ACCESS_DISABLED');
            }
            discoverySignal.throwIfAborted();
            await options.authorize();
            discoverySignal.throwIfAborted();
          };
          await checkpoint();
          const result = await discoverScoreFiles(
            request.arguments,
            discoverySignal,
          );
          await checkpoint();
          return result;
        }, signal);
      }
      if (closed || !ready) {
        throw new Error('EDITOR_NOT_READY');
      }
      let rejectTimeout: (error: Error) => void;
      const timeout = new Promise<never>((_resolve, reject) => {
        rejectTimeout = reject;
      });
      const operation = async () => {
        await options.authorize();
        const win = options.getWindow();
        if (closed || !ready || win == null || win.isDestroyed()) {
          throw new Error('EDITOR_NOT_READY');
        }
        const requestId = randomUUID();
        const cancellable =
          request.tool === 'export_pdf' ||
          request.tool === 'preview_page' ||
          request.tool === 'batch_update_files';
        if (cancellable && signal.aborted) {
          throw new Error('EXPORT_CANCELLED');
        }
        exportController = cancellable ? new AbortController() : null;
        const onCancel = () =>
          exportController?.abort(new Error('EXPORT_CANCELLED'));
        signal.addEventListener('abort', onCancel, { once: true });
        const timer = setTimeout(() => {
          ready = false;
          failure = 'AUTOMATION_TIMEOUT';
          options.onStateChange?.();
          exportController?.abort(new Error('AUTOMATION_TIMEOUT'));
          rejectTimeout(
            new AutomationError({
              code: 'AUTOMATION_TIMEOUT',
              message:
                'Inspect the document and output before retrying; reload the editor to reconnect.',
              details: { outcome: 'unknown', requiresReload: true },
            }),
          );
        }, 60_000);
        try {
          await record.update(dirty, true);
          await options.authorize();
          if (closed) {
            throw new Error('AGENT_ACCESS_DISABLED');
          }
          return await new Promise((resolve, reject) => {
            pending = { requestId, tool: request.tool, resolve, reject };
            win.webContents.send(IpcMainChannels.AutomationRequest, {
              requestId,
              request,
            } satisfies AutomationMessage);
          });
        } finally {
          clearTimeout(timer);
          signal.removeEventListener('abort', onCancel);
          pending = null;
          if (!closed) {
            await record.update(dirty, false);
          }
          exportController = null;
        }
      };
      // Interactive close still shares the native file-operation queue.
      const runOperation = () =>
        request.tool === 'close_document'
          ? options.withFileLock(operation)
          : operation();
      const result =
        request.tool === 'close_document'
          ? options.runExclusive(runOperation)
          : runOperation();
      return Promise.race([result, timeout]);
    },
  }).catch(async (error) => {
    removeHandlers();
    await record.close();
    throw error;
  });

  console.log(`Neanes MCP listening at http://127.0.0.1:${server.port}/mcp`);
  return {
    port: server.port,
    isReady: () => ready,
    error: () => failure,
    // The caller supplies the renderer's current readiness. The creation-time
    // value is stale once a later window attaches.
    attach(win: BrowserWindow, isReady: boolean) {
      const { webContents } = win;
      ready = isReady;
      const onNavigation = (
        _event: Electron.Event,
        _url: string,
        isInPlace: boolean,
        isMainFrame: boolean,
      ) => {
        if (isMainFrame && !isInPlace) {
          invalidate();
        }
      };
      const cleanup = () => {
        if (!detach.delete(cleanup)) {
          return;
        }
        webContents.removeListener('did-start-navigation', onNavigation);
        webContents.removeListener('render-process-gone', invalidate);
        webContents.removeListener('destroyed', onDestroyed);
      };
      const onDestroyed = () => {
        try {
          invalidate();
        } finally {
          cleanup();
        }
      };
      detach.add(cleanup);
      webContents.on('did-start-navigation', onNavigation);
      webContents.on('render-process-gone', invalidate);
      webContents.on('destroyed', onDestroyed);
    },
    async close() {
      closed = true;
      invalidate();
      for (const remove of detach) {
        remove();
      }
      detach.clear();
      removeHandlers();
      await server.close();
      await Promise.allSettled([...fileOperations]);
      const win = options.getWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send(IpcMainChannels.AutomationReset);
      }
      await record.close();
    },
  };
}
