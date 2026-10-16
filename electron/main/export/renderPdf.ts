import type { PdfExportOptions } from '../../../src/services/documents/fileTypes';
import { renderSnapshot } from './renderSnapshot';

export function renderPdf(options: {
  args: Pick<PdfExportOptions, 'snapshot' | 'landscape'>;
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
        printBackground: false,
      }),
  });
}
