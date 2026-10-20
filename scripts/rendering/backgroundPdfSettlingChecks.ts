import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { inflateSync } from 'node:zlib';

import type { BrowserWindow } from 'electron';

import { renderPdf } from '../../electron/main/export/renderPdf';
import { renderSnapshot } from '../../electron/main/export/renderSnapshot';
import {
  EmptyElement,
  RichTextBoxElement,
  TextBoxElement,
} from '../../src/models/save/v1/Element';
import type { ScoreRenderSnapshot } from '../../src/services/rendering/scoreRenderSnapshot';

interface BoxGeometry {
  text: string;
  top: number;
  bottom: number;
  height: number;
  panelHeights: number[];
}

// Compare native PDF drawing commands, excluding timestamps and document IDs.
function drawingStreams(pdf: Buffer) {
  const source = pdf.toString('latin1');
  const streams: string[] = [];
  for (const match of source.matchAll(/\/Contents (\d+) 0 R/g)) {
    const object = source.indexOf(`\n${match[1]} 0 obj\n`);
    assert(object >= 0, 'Missing PDF page content object.');
    const start = source.indexOf('stream\n', object) + 'stream\n'.length;
    const dictionary = source.slice(object, start);
    assert(dictionary.includes('/Filter /FlateDecode'));
    const length = Number(dictionary.match(/\/Length (\d+)/)![1]);
    const decoded = inflateSync(pdf.subarray(start, start + length)).toString(
      'latin1',
    );
    assert(decoded.includes('\nBT\n'), 'PDF page must contain text.');
    streams.push(decoded);
  }
  assert.equal(streams.length, 2, 'Both PDF pages must contain text.');
  return streams;
}

export async function checkPdfSettling(options: {
  snapshot: ScoreRenderSnapshot;
  root: string;
  output: string;
  owner: BrowserWindow;
}) {
  const snapshot = structuredClone(options.snapshot);
  const plain = new TextBoxElement();
  plain.content = Array.from(
    { length: 24 },
    (_, i) => `Plain body line ${i + 1}`,
  ).join('\n');
  plain.fontFamily = 'Source Serif';
  plain.fontSize = 24;
  plain.height = 1;
  const rich = new RichTextBoxElement();
  rich.content = Array.from(
    { length: 14 },
    (_, i) =>
      `<p><span style="font-size:18pt;">Rich body line ${i + 1}</span></p>`,
  ).join('');
  rich.height = 1;
  const footer = new RichTextBoxElement();
  footer.multipanel = true;
  footer.contentLeft = '<p>Page $p / $n</p>';
  footer.contentCenter =
    '<p>Footer center</p><p>Second line</p><p>Third line</p>';
  footer.contentRight =
    '<p>Footer right</p><p>Second line</p><p>Third line</p><p>Fourth line</p>';
  footer.height = 1;
  snapshot.score.staff.elements = [plain, rich, new EmptyElement()];
  Object.assign(snapshot.score.pageSetup, {
    pageSize: 'Letter',
    pageWidth: 816,
    pageHeight: 1056,
    landscape: false,
    topMargin: 96,
    bottomMargin: 96,
    showHeader: false,
    showFooter: true,
    richHeaderFooter: true,
    footerMargin: 48,
    headerDifferentFirstPage: false,
    headerDifferentOddEven: false,
    headerFooterDifferentChapterOpening: false,
  });
  for (const variant of Object.values(snapshot.score.footers)) {
    variant.elements = [structuredClone(footer)];
  }
  const original = JSON.stringify(snapshot);
  const shared = {
    parent: options.owner,
    preload: path.join(options.root, 'dist-electron/preload/index.js'),
    entry: path.join(options.root, 'dist/export.html'),
    signal: new AbortController().signal,
  };
  const measured = await renderSnapshot({
    ...shared,
    snapshot,
    async complete(window) {
      // Read the actual export DOM at the production readiness boundary.
      const pages: BoxGeometry[][] = await window.webContents
        .executeJavaScript(`
        [...document.querySelectorAll('.page')].map(page => {
          const origin = page.getBoundingClientRect().top;
          return [...page.querySelectorAll('.text-box-container, .rich-text-box-container')].map(box => {
            const rect = box.getBoundingClientRect();
            return {
              text: box.textContent,
              top: rect.top - origin,
              bottom: rect.bottom - origin,
              height: rect.height,
              panelHeights: [...box.querySelectorAll('.ck-content')].map(panel => panel.getBoundingClientRect().height),
            };
          });
        })
      `);
      assert.equal(
        pages.length,
        2,
        'Measured body text must reflow onto two pages.',
      );
      const bodies = pages.map((boxes, i) => {
        const prefix = i === 0 ? 'Plain body line 1' : 'Rich body line 1';
        const body = boxes.find((box) => box.text.startsWith(prefix))!;
        assert(body, `Missing ${prefix} on page ${i + 1}.`);
        assert(
          body.height > 300,
          'Saved height 1 must be replaced by real geometry.',
        );
        assert.equal(body.top, 96);
        assert(body.bottom <= 960, 'Body must fit inside the page margins.');
        const footer = boxes.find((box) => box.text.startsWith('Page '))!;
        assert(footer.text.includes(`Page ${i + 1} / 2`));
        assert.equal(footer.panelHeights.length, 3);
        assert(footer.panelHeights[1] > footer.panelHeights[0]);
        assert(footer.panelHeights[2] > footer.panelHeights[1]);
        assert.equal(footer.height, Math.max(...footer.panelHeights));
        assert(footer.top >= body.bottom, 'Footer must not overlap body text.');
        return body;
      });
      return {
        pages,
        bodies,
        pdf: await window.webContents.printToPDF({
          pageSize: 'Letter',
          landscape: false,
          printBackground: false,
        }),
      };
    },
  });
  assert.equal(
    JSON.stringify(snapshot),
    original,
    'Rendering must not mutate its input.',
  );
  await writeFile(
    path.join(options.output, 'settling-stale.pdf'),
    measured.pdf,
  );
  await writeFile(
    path.join(options.output, 'settling-geometry.json'),
    JSON.stringify(measured.pages, null, 2),
  );

  const expected = drawingStreams(measured.pdf);
  for (const oversized of [false, true]) {
    const reference = structuredClone(snapshot);
    reference.score.staff.elements.slice(0, 2).forEach((element, i) => {
      (element as TextBoxElement | RichTextBoxElement).height = oversized
        ? 2000
        : measured.bodies[i].height;
    });
    for (const variant of Object.values(reference.score.footers)) {
      (variant.elements[0] as RichTextBoxElement).height = oversized
        ? 2000
        : measured.pages[0].find((box) => box.text.startsWith('Page '))!.height;
    }
    const pdf = await renderPdf({
      ...shared,
      args: { snapshot: reference, landscape: false },
      pageSize: 'Letter',
    });
    assert.deepEqual(
      drawingStreams(pdf),
      expected,
      'PDF geometry must be independent of undersized or oversized saved heights.',
    );
    await writeFile(
      path.join(
        options.output,
        `settling-${oversized ? 'oversized' : 'measured'}.pdf`,
      ),
      pdf,
    );
  }
  console.log(
    'PASS: stale heights, two-page reflow, multipanel token footers, identical PDF geometry',
  );
}
