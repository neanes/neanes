import { randomUUID } from 'node:crypto';

import type { BrowserWindow } from 'electron';
import { PDFDocument } from 'pdf-lib';

import type { ExportWorkspaceAsPdfArgs } from '../../../src/ipc/ipcChannels';
import { resolvePdfElementLinks } from './pdfElementLinks';
import { renderSnapshot } from './renderSnapshot';

const PDF_BATCH_SIZE = 25;

export function renderPdf(options: {
  args: Pick<ExportWorkspaceAsPdfArgs, 'snapshot' | 'landscape'>;
  parent: BrowserWindow;
  preload: string;
  entry: string;
  devServerUrl?: string;
  pageSize: Electron.PrintToPDFOptions['pageSize'];
  signal: AbortSignal;
}): Promise<Buffer> {
  let document: PDFDocument | undefined;
  const elementLinkBaseUrl = `https://neanes.invalid/${randomUUID()}/`;
  return renderSnapshot({
    ...options,
    snapshot: options.args.snapshot,
    pdf: {
      batchSize: PDF_BATCH_SIZE,
      elementLinkBaseUrl,
      async printBatch(window, signal) {
        const data = await window.webContents.printToPDF({
          pageSize: options.pageSize,
          landscape: options.args.landscape,
          // Score colors are preserved by print-color-adjust in the shared CSS.
          printBackground: false,
        });
        signal.throwIfAborted();
        const batch = await PDFDocument.load(data, { updateMetadata: false });
        signal.throwIfAborted();
        if (!document) {
          // Use Chromium's first PDF as the base to keep its document metadata.
          document = batch;
          return;
        }
        const pages = await document.copyPages(batch, batch.getPageIndices());
        signal.throwIfAborted();
        for (const page of pages) {
          document.addPage(page);
        }
      },
    },
    async complete() {
      // The renderer reports success only after printing at least one batch.
      const pdf = document!;
      resolvePdfElementLinks(pdf, elementLinkBaseUrl);
      const bytes = await pdf.save();
      return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    },
  });
}
