import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { BrowserWindow } from 'electron';

import { getNativePrintPageSize } from '../../../electron/main/export/pageSize';
import { renderSnapshot } from '../../../electron/main/export/renderSnapshot';
import type { ScoreRenderSnapshot } from '../../../src/services/rendering/scoreRenderSnapshot';

export async function checkPrintPreparation(options: {
  snapshot: ScoreRenderSnapshot;
  root: string;
  output: string;
  owner: BrowserWindow;
}) {
  const original = JSON.stringify(options.snapshot);
  const sourceUrl = options.owner.webContents.getURL();
  await renderSnapshot({
    snapshot: options.snapshot,
    parent: options.owner,
    completeHasDialog: true,
    preload: path.join(options.root, 'dist-electron/preload/index.js'),
    entry: path.join(options.root, 'dist/export.html'),
    signal: new AbortController().signal,
    async complete(window) {
      assert.notEqual(window, options.owner);
      assert.equal(window.getParentWindow(), options.owner);
      const prepared = await window.webContents.executeJavaScript(`(() => {
        const root = document.querySelector('.score-print-pages');
        return {
          zoom: getComputedStyle(root).getPropertyValue('--zoom').trim(),
          residue: getComputedStyle(root).getPropertyValue('--zoom-residue').trim(),
          title: document.title,
          pages: [...root.querySelectorAll('.page')].map(page => ({
            width: page.getBoundingClientRect().width,
            height: page.getBoundingClientRect().height,
            text: page.textContent,
          })),
        };
      })()`);
      assert.equal(prepared.zoom, '1');
      assert.equal(prepared.residue, '0');
      assert.equal(prepared.title, options.snapshot.title);
      assert.equal(prepared.pages.length, 2);
      for (const page of prepared.pages) {
        assert.equal(page.width, 816);
        assert.equal(page.height, 1056);
        assert(page.text.length > 100);
      }
      assert.equal(
        getNativePrintPageSize({
          pageSize: 'Letter',
          pageWidthInches: 8.5,
          pageHeightInches: 11,
        }),
        'Letter',
      );
      // Capture the prepared pages without submitting a physical print job.
      const pdf = await window.webContents.printToPDF({ pageSize: 'Letter' });
      await writeFile(
        path.join(options.output, 'native-print-prepared.pdf'),
        pdf,
      );
    },
  });
  assert.equal(options.owner.webContents.getURL(), sourceUrl);
  assert.equal(JSON.stringify(options.snapshot), original);
  console.log(
    'PASS: detached native-print preparation, canonical geometry, owner/snapshot preservation',
  );
}
