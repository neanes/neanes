import { randomUUID } from 'node:crypto';

import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import { ipcMain } from 'electron';

import {
  IpcMainChannels,
  IpcRendererChannels,
} from '../../../src/ipc/ipcChannels';
import {
  AutomationError,
  automationOutcome,
} from '../../../src/services/automation/errors';
import type {
  AutomationMessage,
  AutomationReply,
  AutomationRequest,
} from '../../../src/services/automation/protocol';
import type {
  PdfExportOptions,
  WorkspaceFile,
  WriteScoreFileArgs,
} from '../../../src/services/documents/fileTypes';
import { AutomationFiles } from './files';
import { startMcpServer } from './server';

export async function startAutomationHost(options: {
  getWindow(): BrowserWindow | null;
  version: string;
  printPdf(args: PdfExportOptions, signal: AbortSignal): Promise<Buffer>;
  withFileLock<T>(operation: () => Promise<T>): Promise<T>;
  runExclusive<T>(operation: () => Promise<T>): Promise<T>;
}) {
  const files = await AutomationFiles.create(
    JSON.parse(process.env.NEANES_MCP_ROOTS ?? '[]'),
  );
  let ready = false;
  let pending: {
    requestId: string;
    tool: AutomationRequest['tool'];
    resolve(value: unknown): void;
    reject(error: Error): void;
  } | null = null;
  let exportController: AbortController | null = null;

  function isSender(event: { sender: Electron.WebContents }) {
    return event.sender === options.getWindow()?.webContents;
  }
  function requireRequest(
    event: IpcMainInvokeEvent,
    tool: AutomationRequest['tool'],
  ) {
    if (!isSender(event) || pending?.tool !== tool) {
      throw new Error('AUTOMATION_REQUEST_REQUIRED');
    }
  }

  ipcMain.on(IpcRendererChannels.AutomationReady, (event) => {
    if (isSender(event)) {
      ready = true;
    }
  });
  ipcMain.on(
    IpcRendererChannels.AutomationReply,
    (event, reply: AutomationReply) => {
      if (!isSender(event) || pending?.requestId !== reply.requestId) {
        return;
      }
      if (reply.success) {
        pending.resolve(reply.result);
      } else {
        pending.reject(new AutomationError(reply.error));
      }
    },
  );
  ipcMain.handle(
    IpcRendererChannels.AutomationReadScore,
    (event, filePath: string, workspaces: WorkspaceFile[]) =>
      automationOutcome(() => {
        requireRequest(event, 'open_document');
        return files.open(filePath, workspaces);
      }),
  );
  ipcMain.handle(
    IpcRendererChannels.AutomationWriteScore,
    (event, args: WriteScoreFileArgs) =>
      automationOutcome(() => {
        requireRequest(event, 'save_document');
        return options.withFileLock(() => files.write(args));
      }),
  );
  ipcMain.handle(
    IpcRendererChannels.AutomationExportPdf,
    (event, args: PdfExportOptions) =>
      automationOutcome(async () => {
        requireRequest(event, 'export_pdf');
        await options.withFileLock(async () => {
          const filePath = await files.resolve(args.filePath, 'pdf', true);
          const signal = exportController!.signal;
          const data = await options.printPdf(args, signal);
          signal.throwIfAborted();
          await files.writeOutput(filePath, data, args.overwrite);
        });
        return null;
      }),
  );

  function invalidate() {
    ready = false;
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

  const server = await startMcpServer({
    token: process.env.NEANES_MCP_TOKEN ?? '',
    port: Number(process.env.NEANES_MCP_PORT ?? 38765),
    version: options.version,
    async execute(request, signal) {
      if (!ready) {
        throw new Error('EDITOR_NOT_READY');
      }
      let rejectTimeout: (error: Error) => void;
      const timeout = new Promise<never>((_resolve, reject) => {
        rejectTimeout = reject;
      });
      const operation = async () => {
        const win = options.getWindow();
        if (!ready || win == null || win.isDestroyed()) {
          throw new Error('EDITOR_NOT_READY');
        }
        const requestId = randomUUID();
        if (request.tool === 'export_pdf' && signal.aborted) {
          throw new Error('EXPORT_CANCELLED');
        }
        exportController =
          request.tool === 'export_pdf' ? new AbortController() : null;
        const onCancel = () =>
          exportController?.abort(new Error('EXPORT_CANCELLED'));
        signal.addEventListener('abort', onCancel, { once: true });
        const timer = setTimeout(() => {
          ready = false;
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
  });

  console.log(`Neanes MCP listening at http://127.0.0.1:${server.port}/mcp`);
  return {
    attach(win: BrowserWindow) {
      ready = false;
      win.webContents.on(
        'did-start-navigation',
        (_event, _url, isInPlace, isMainFrame) => {
          if (isMainFrame && !isInPlace) {
            invalidate();
          }
        },
      );
      win.webContents.on('render-process-gone', invalidate);
      win.webContents.on('destroyed', invalidate);
    },
    async close() {
      invalidate();
      await server.close();
    },
  };
}
