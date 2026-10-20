import { BrowserWindow, ipcMain, type IpcMainEvent } from 'electron';

import {
  IpcMainChannels,
  IpcRendererChannels,
} from '../../../src/ipc/ipcChannels';
import type {
  PngRenderOptions,
  ScoreRenderSnapshot,
} from '../../../src/services/rendering/scoreRenderSnapshot';

// One disposable renderer per snapshot. It has no editor/workspace lifecycle.
export async function renderSnapshot<T>(options: {
  snapshot: ScoreRenderSnapshot;
  png?: PngRenderOptions;
  parent?: BrowserWindow;
  completeHasDialog?: boolean;
  writeImage?: (
    pageNumber: number,
    data: string,
    signal: AbortSignal,
  ) => Promise<boolean>;
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
  const rendering = new AbortController();
  let started = false;
  let disposed = false;
  let completing = false;
  const fail = (message: string) => {
    const error = new Error(`EXPORT_RENDER_FAILED: ${message}`);
    rendering.abort(error);
    outcome.reject(error);
  };
  const onReady = (event: IpcMainEvent) => {
    if (event.sender === window.webContents && !started) {
      started = true;
      event.sender.send(IpcMainChannels.ExportRendererSnapshot, {
        snapshot: options.snapshot,
        png: options.png,
      });
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
    // Rendering is ready; a native dialog can remain open without a deadline.
    if (options.completeHasDialog) {
      clearTimeout(timer);
    }
    void Promise.resolve()
      .then(() => options.complete(window))
      .then(outcome.resolve, (error: unknown) => fail(String(error)));
  };
  const onAbort = () => {
    rendering.abort(options.signal.reason);
    outcome.reject(options.signal.reason);
  };
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
  let timer = setTimeout(() => fail('Renderer timed out'), 45_000);
  window.webContents.ipc.handle(
    IpcRendererChannels.ExportRendererImage,
    async (_event, pageNumber: number, data: string) => {
      if (!started || !options.writeImage) {
        throw new Error('Unexpected export image');
      }
      clearTimeout(timer);
      try {
        return await options.writeImage(pageNumber, data, rendering.signal);
      } catch (error) {
        fail(String(error));
        throw error;
      } finally {
        if (!disposed) {
          timer = setTimeout(() => fail('Renderer timed out'), 45_000);
        }
      }
    },
  );
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
    // Start loading without delaying observation of crashes or cancellation.
    void (
      options.devServerUrl
        ? window.loadURL(new URL('export.html', options.devServerUrl).href)
        : window.loadFile(options.entry)
    ).catch((error: unknown) => fail(String(error)));
    return await outcome.promise;
  } finally {
    disposed = true;
    clearTimeout(timer);
    ipcMain.removeListener(IpcRendererChannels.ExportRendererReady, onReady);
    ipcMain.removeListener(IpcRendererChannels.ExportRendererResult, onResult);
    options.signal.removeEventListener('abort', onAbort);
    if (!window.isDestroyed()) {
      window.webContents.ipc.removeHandler(
        IpcRendererChannels.ExportRendererImage,
      );
    }
    window.removeListener('closed', onGone);
    owner?.removeListener('destroyed', onGone);
    owner?.removeListener('render-process-gone', onGone);
    owner?.removeListener('did-start-navigation', onOwnerNavigation);
    if (!window.isDestroyed()) {
      window.destroy();
    }
  }
}
