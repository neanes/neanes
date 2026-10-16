import { BrowserWindow, ipcMain, type IpcMainEvent } from 'electron';

import {
  IpcMainChannels,
  IpcRendererChannels,
} from '../../../src/ipc/ipcChannels';
import type { PdfExportOptions } from '../../../src/services/documents/fileTypes';

// One disposable renderer per snapshot. It has no editor/workspace lifecycle.
export async function renderPdf(options: {
  args: Pick<PdfExportOptions, 'snapshot' | 'landscape'>;
  preload: string;
  entry: string;
  devServerUrl?: string;
  pageSize: Electron.PrintToPDFOptions['pageSize'];
  signal: AbortSignal;
}): Promise<Buffer> {
  options.signal.throwIfAborted();
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: options.preload,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const outcome = Promise.withResolvers<Buffer>();
  let started = false;
  const fail = (message: string) =>
    outcome.reject(new Error(`EXPORT_RENDER_FAILED: ${message}`));
  const onReady = (event: IpcMainEvent) => {
    if (event.sender === window.webContents && !started) {
      started = true;
      event.sender.send(
        IpcMainChannels.ExportRendererSnapshot,
        options.args.snapshot,
      );
    }
  };
  const onResult = (
    event: IpcMainEvent,
    result: { success: boolean; message?: string },
  ) => {
    if (event.sender !== window.webContents || !started) {
      return;
    }
    if (!result.success) {
      fail(result.message ?? 'Renderer failed');
      return;
    }
    // Only a fully ready renderer is allowed to print.
    started = false;
    void window.webContents
      .printToPDF({
        pageSize: options.pageSize,
        landscape: options.args.landscape,
        printBackground: false,
      })
      .then(outcome.resolve, (error: unknown) => fail(String(error)));
  };
  const onAbort = () => outcome.reject(options.signal.reason);
  const onGone = () => fail('Renderer disconnected');
  const onNavigation = (event: Electron.Event) => event.preventDefault();
  const timer = setTimeout(() => fail('Renderer timed out'), 45_000);
  ipcMain.on(IpcRendererChannels.ExportRendererReady, onReady);
  ipcMain.on(IpcRendererChannels.ExportRendererResult, onResult);
  options.signal.addEventListener('abort', onAbort, { once: true });
  window.webContents.on('render-process-gone', onGone);
  window.webContents.on('will-navigate', onNavigation);
  window.on('closed', onGone);
  try {
    // Start loading without delaying observation of crashes or cancellation.
    void (
      options.devServerUrl
        ? window.loadURL(new URL('export.html', options.devServerUrl).href)
        : window.loadFile(options.entry)
    ).catch((error: unknown) => fail(String(error)));
    return await outcome.promise;
  } finally {
    clearTimeout(timer);
    ipcMain.removeListener(IpcRendererChannels.ExportRendererReady, onReady);
    ipcMain.removeListener(IpcRendererChannels.ExportRendererResult, onResult);
    options.signal.removeEventListener('abort', onAbort);
    window.removeListener('closed', onGone);
    if (!window.isDestroyed()) {
      window.destroy();
    }
  }
}
