import { BrowserWindow, ipcMain, type IpcMainEvent } from 'electron';

import {
  IpcMainChannels,
  IpcRendererChannels,
} from '../../../src/ipc/ipcChannels';
import type { ScoreRenderSnapshot } from '../../../src/services/rendering/scoreRenderSnapshot';

// One disposable renderer per snapshot, independent of editor workspace state.
export async function renderSnapshot<T>(options: {
  snapshot: ScoreRenderSnapshot;
  parent?: BrowserWindow;
  complete: (window: BrowserWindow) => Promise<T>;
  preload: string;
  entry: string;
  devServerUrl?: string;
  signal: AbortSignal;
}): Promise<T> {
  options.signal.throwIfAborted();
  const window = new BrowserWindow({
    show: false,
    parent: options.parent,
    webPreferences: {
      preload: options.preload,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const outcome = Promise.withResolvers<T>();
  let started = false;
  let completing = false;
  const fail = (message: string) =>
    outcome.reject(new Error(`EXPORT_RENDER_FAILED: ${message}`));
  const onReady = (event: IpcMainEvent) => {
    if (event.sender === window.webContents && !started) {
      started = true;
      event.sender.send(
        IpcMainChannels.ExportRendererSnapshot,
        options.snapshot,
      );
    }
  };
  const onResult = (
    event: IpcMainEvent,
    result: { success: boolean; message?: string },
  ) => {
    if (event.sender !== window.webContents || !started || completing) {
      return;
    }
    completing = true;
    if (!result.success) {
      fail(result.message ?? 'Renderer failed');
      return;
    }
    void Promise.resolve()
      .then(() => options.complete(window))
      .then(outcome.resolve, (error: unknown) => fail(String(error)));
  };
  const onAbort = () => outcome.reject(options.signal.reason);
  const onGone = () => fail('Renderer disconnected');
  const onNavigation = (event: Electron.Event) => event.preventDefault();
  const onOwnerNavigation = (
    _event: Electron.Event,
    _url: string,
    isInPlace: boolean,
    isMainFrame: boolean,
  ) => {
    if (isMainFrame && !isInPlace) {
      onGone();
    }
  };
  const owner = options.parent?.webContents;
  const timer = setTimeout(() => fail('Renderer timed out'), 45_000);
  ipcMain.on(IpcRendererChannels.ExportRendererReady, onReady);
  ipcMain.on(IpcRendererChannels.ExportRendererResult, onResult);
  options.signal.addEventListener('abort', onAbort, { once: true });
  window.webContents.on('render-process-gone', onGone);
  window.webContents.on('will-navigate', onNavigation);
  window.on('closed', onGone);
  owner?.on('destroyed', onGone);
  owner?.on('render-process-gone', onGone);
  owner?.on('did-start-navigation', onOwnerNavigation);
  try {
    // Observe crashes and cancellation while the page is still loading.
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
    owner?.removeListener('destroyed', onGone);
    owner?.removeListener('render-process-gone', onGone);
    owner?.removeListener('did-start-navigation', onOwnerNavigation);
    if (!window.isDestroyed()) {
      window.destroy();
    }
  }
}
