import { promises as fs } from 'node:fs';
import path from 'node:path';

import { app, BrowserWindow, ipcMain } from 'electron';

import { IpcRendererChannels } from '../../../src/ipc/ipcChannels';
import type { PdfExportOptions } from '../../../src/services/documents/fileTypes';
import { executeInEditor, startEditorConnection } from './editorConnection';
import { createAutomationHost } from './host';
import { renderPagePreview } from './preview';
import { createMcpServer } from './server';
import { McpStdioTransport } from './stdio';

export function installAutomation(options: {
  headless: boolean;
  isMac: boolean;
  normalUserData: string;
  privateProfile: string | null;
  preload: string;
  getDevServerUrl(): string | undefined;
  setWindow(window: BrowserWindow): void;
  runExclusive<T>(operation: () => Promise<T>): Promise<T>;
  withFileLock<T>(operation: () => Promise<T>): Promise<T>;
  printPdf(args: PdfExportOptions, signal: AbortSignal): Promise<Buffer>;
}) {
  const { headless, isMac, preload } = options;
  const discoveryFile = path.join(options.normalUserData, 'mcp-editor.json');
  let win: BrowserWindow | null = null;
  let host: ReturnType<typeof createAutomationHost> | null = null;
  let connection: Awaited<ReturnType<typeof startEditorConnection>> | null =
    null;
  let server: ReturnType<typeof createMcpServer> | null = null;
  let stopping = false;

  let closing: Promise<void> | undefined;
  function close() {
    return (closing ??= (async () => {
      stopping = true;
      await server?.close();
      await connection?.close();
      await host?.close();
    })());
  }
  let exiting = false;
  async function stop(code = 0) {
    if (exiting) {
      return;
    }
    exiting = true;
    await close();
    // Chromium must release its profile before it can be removed on Windows.
    win?.destroy();
    if (options.privateProfile) {
      await fs
        .rm(options.privateProfile, {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 100,
        })
        .catch(console.error);
    }
    app.exit(code);
  }
  function makeHost() {
    return createAutomationHost({
      mode: headless ? 'headless' : 'interactive',
      getWindow: () => win,
      runExclusive: options.runExclusive,
      withFileLock: options.withFileLock,
      previewPage: (args, signal) =>
        renderPagePreview({
          args,
          signal,
          parent: win ?? undefined,
          preload,
          entry: path.join(process.env.DIST!, 'export.html'),
          devServerUrl: options.getDevServerUrl(),
        }),
      printPdf: options.printPdf,
    });
  }

  async function launchStdio() {
    if (isMac) {
      app.dock!.hide();
    }
    host = makeHost();
    win = new BrowserWindow({
      show: false,
      webPreferences: {
        preload,
        spellcheck: false,
        backgroundThrottling: false,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    options.setWindow(win);
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    host.attach(win, false);
    const startup = setTimeout(() => void stop(1), 60_000);
    win.webContents.once('render-process-gone', () => void stop(1));
    const onReady = (event: Electron.IpcMainEvent) => {
      if (event.sender !== win?.webContents) {
        return;
      }
      ipcMain.removeListener(IpcRendererChannels.AutomationReady, onReady);
      clearTimeout(startup);
      if (stopping) {
        return;
      }
      server = createMcpServer({
        version: app.getVersion(),
        execute: host!.execute,
        executeEditor: (request, signal) =>
          executeInEditor(discoveryFile, request, signal),
      });
      server.server.onerror = (error) => console.error('MCP error', error);
      server.server.onclose = () => void stop();
      void server.connect(new McpStdioTransport()).catch((error) => {
        console.error(error);
        void stop(1);
      });
    };
    ipcMain.on(IpcRendererChannels.AutomationReady, onReady);
    process.stdin.once('end', () => void stop());
    process.stdin.once('error', () => void stop(1));
    // Preserve input sent before the renderer is ready; consuming stdin starts
    // only when the stdio transport has installed its reader.
    process.stdin.pause();
    process.stdout.once('error', () => void stop(1));
    process.once('SIGTERM', () => void stop());
    process.once('SIGINT', () => void stop());
    const url = options.getDevServerUrl();
    if (url) {
      await win.loadURL(new URL('automation.html', url).href);
    } else {
      await win.loadFile(path.join(process.env.DIST!, 'automation.html'));
    }
  }

  return {
    attach(window: BrowserWindow) {
      win = window;
      host?.attach(window, false);
    },
    detach() {
      win = null;
    },
    close,
    async start() {
      try {
        if (headless) {
          await launchStdio();
        } else {
          host = makeHost();
          connection = await startEditorConnection(
            discoveryFile,
            host.execute,
            app.isPackaged ? undefined : options.getDevServerUrl(),
          );
        }
      } catch (error) {
        console.error('Could not start automation', error);
        if (headless) {
          await stop(1);
        }
      }
    },
  };
}
