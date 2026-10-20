import type { BrowserWindow } from 'electron';

import type { ExportWorkspaceAsPdfArgs } from '../../../src/ipc/ipcChannels';
import { renderSnapshot } from './renderSnapshot';

export function renderPdf(options: {
  args: Pick<ExportWorkspaceAsPdfArgs, 'snapshot' | 'landscape'>;
  parent: BrowserWindow;
  preload: string;
  entry: string;
  devServerUrl?: string;
  pageSize: Electron.PrintToPDFOptions['pageSize'];
  signal: AbortSignal;
}): Promise<Buffer> {
  return renderSnapshot({
    ...options,
    snapshot: options.args.snapshot,
    complete: (window) =>
      window.webContents.printToPDF({
        pageSize: options.pageSize,
        landscape: options.args.landscape,
        // Score colors are preserved by print-color-adjust in the shared CSS.
        printBackground: false,
      }),
  });
}
