import assert from 'node:assert/strict';
import { access, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BrowserWindow } from 'electron';
import { PDFDocument } from 'pdf-lib';

import { getNativePrintPageSize } from '../../../electron/main/export/pageSize';
import { printPdf } from '../../../electron/main/export/printPdf';
import { renderPdf } from '../../../electron/main/export/renderPdf';
import type { ScoreRenderSnapshot } from '../../../src/services/rendering/scoreRenderSnapshot';

export async function checkPrintPreparation(options: {
  snapshot: ScoreRenderSnapshot;
  root: string;
  output: string;
  owner: BrowserWindow;
}) {
  const original = JSON.stringify(options.snapshot);
  const sourceUrl = options.owner.webContents.getURL();
  const data = await renderPdf({
    args: { snapshot: options.snapshot, landscape: false },
    parent: options.owner,
    preload: path.join(options.root, 'dist-electron/preload/index.js'),
    entry: path.join(options.root, 'dist/export.html'),
    pageSize: 'Letter',
    signal: new AbortController().signal,
  });
  const document = await PDFDocument.load(data);
  assert.equal(document.getPageCount(), 2);
  await writeFile(path.join(options.output, 'native-print-prepared.pdf'), data);

  let viewerFile = '';
  const result = await printPdf({
    data,
    fileName: 'Score: "draft"/1',
    parent: options.owner,
    async print(window) {
      assert.notEqual(window, options.owner);
      assert.equal(window.getParentWindow(), options.owner);
      assert.equal(window.isVisible(), false);
      viewerFile = fileURLToPath(window.webContents.getURL());
      assert.equal(path.basename(viewerFile), 'Score_ _draft__1.pdf');
      await access(viewerFile);
      // The native dialog is not opened here, so no print job is submitted.
      return 'ready';
    },
  });
  assert.equal(result, 'ready');
  await assert.rejects(access(viewerFile));

  // The next character would cross the byte limit by one byte.
  const longTitlePrefix = 'a' + '\u00e9'.repeat(97);
  await assert.rejects(
    printPdf({
      data,
      fileName: longTitlePrefix + '\u00e9'.repeat(40),
      parent: options.owner,
      async print(window) {
        viewerFile = fileURLToPath(window.webContents.getURL());
        assert.equal(path.basename(viewerFile), longTitlePrefix + '.pdf');
        throw new Error('print failed');
      },
    }),
    /print failed/,
  );
  await assert.rejects(access(viewerFile));

  assert.equal(
    getNativePrintPageSize({
      pageSize: 'Letter',
      pageWidthInches: 8.5,
      pageHeightInches: 11,
    }),
    'Letter',
  );
  assert.equal(options.owner.webContents.getURL(), sourceUrl);
  assert.equal(JSON.stringify(options.snapshot), original);
  console.log(
    'PASS: native print through the PDF viewer, readiness, viewer parenting, temporary file cleanup',
  );
}
