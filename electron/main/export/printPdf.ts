import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { BrowserWindow } from 'electron';

// Electron emits this private event once its built-in PDF viewer has loaded a
// document and webContents.print() will print the PDF rather than the viewer
// chrome. There is no public equivalent. The rendering integration checks load
// a PDF through this helper so that an Electron upgrade that removes the event
// fails there rather than in the field.
const PDF_READY_TO_PRINT = '-pdf-ready-to-print';
const PDF_READY_TIMEOUT_MS = 60_000;

// Loads an already rendered PDF into a hidden built-in PDF viewer and hands the
// ready viewer to `print`. Chromium's PDF viewer streams pages to the print
// pipeline, so this handles scores whose HTML is too large to print directly.
export async function printPdf<T>(options: {
  data: Uint8Array;
  // Shown by the native dialog as the job name and the Save as PDF default.
  fileName: string;
  parent: BrowserWindow;
  print: (window: BrowserWindow) => Promise<T>;
}): Promise<T> {
  const directory = await mkdtemp(path.join(tmpdir(), 'neanes-print-'));
  const window = new BrowserWindow({
    show: false,
    parent: options.parent,
    webPreferences: {
      plugins: true,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const owner = options.parent.webContents;
  const gone = Promise.withResolvers<never>();
  // Rejections are observed through Promise.race below.
  gone.promise.catch(() => {});
  const onGone = () => gone.reject(new Error('PDF print viewer disconnected'));
  window.webContents.on('render-process-gone', onGone);
  window.on('closed', onGone);
  owner.on('destroyed', onGone);
  owner.on('render-process-gone', onGone);
  let timer: NodeJS.Timeout | undefined;
  try {
    const filePath = path.join(directory, sanitizeFileName(options.fileName));
    await writeFile(filePath, options.data);
    const ready = new Promise<void>((resolve, reject) => {
      timer = setTimeout(
        () => reject(new Error('PDF print viewer timed out')),
        PDF_READY_TIMEOUT_MS,
      );
      window.webContents.once(PDF_READY_TO_PRINT as never, () => resolve());
    });
    await Promise.race([
      Promise.all([window.loadFile(filePath), ready]),
      gone.promise,
    ]);
    clearTimeout(timer);
    return await Promise.race([options.print(window), gone.promise]);
  } finally {
    clearTimeout(timer);
    window.removeListener('closed', onGone);
    owner.removeListener('destroyed', onGone);
    owner.removeListener('render-process-gone', onGone);
    if (!window.isDestroyed()) {
      window.destroy();
    }
    await rm(directory, { recursive: true, force: true });
  }
}

function sanitizeFileName(fileName: string) {
  const base = fileName
    .replace(/\.pdf$/i, '')
    // Path separators, characters Windows rejects, and control characters.
    .replace(/[/\\:*?"<>|\u0000-\u001f]/g, '_')
    .trim();
  const extension = '.pdf';
  // Leave room in the path for the temporary directory and the extension.
  const maxBaseBytes = 200 - Buffer.byteLength(extension);
  let bytes = 0;
  let end = 0;
  for (const character of base) {
    bytes += Buffer.byteLength(character);
    if (bytes > maxBaseBytes) {
      break;
    }
    end += character.length;
  }
  return `${base.slice(0, end) || 'score'}${extension}`;
}
