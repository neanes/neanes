import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { type BrowserWindow, nativeImage } from 'electron';

import { renderSnapshot } from '../../../electron/main/export/renderSnapshot';
import type {
  PngRenderOptions,
  ScoreRenderSnapshot,
} from '../../../src/services/rendering/scoreRenderSnapshot';

export async function checkBackgroundPng(options: {
  rich: ScoreRenderSnapshot;
  arabic: ScoreRenderSnapshot;
  root: string;
  output: string;
  owner: BrowserWindow;
}) {
  const original = JSON.stringify(options.rich);
  async function render(
    snapshot: ScoreRenderSnapshot,
    png: PngRenderOptions,
    label: string,
    stopAfterFirst = false,
  ) {
    const pages: number[] = [];
    await renderSnapshot({
      snapshot,
      png,
      parent: options.owner,
      preload: path.join(options.root, 'dist-electron/preload/index.js'),
      entry: path.join(options.root, 'dist/export.html'),
      signal: new AbortController().signal,
      async writeImage(pageNumber, data, signal) {
        signal.throwIfAborted();
        const buffer = Buffer.from(data, 'base64');
        const scale = png.dpi / 96;
        assert.equal(
          buffer.readUInt32BE(16),
          Math.round(snapshot.score.pageSetup.pageWidth) * scale,
        );
        assert.equal(
          buffer.readUInt32BE(20),
          Math.round(snapshot.score.pageSetup.pageHeight) * scale,
        );
        const bitmap = nativeImage.createFromBuffer(buffer).toBitmap();
        assert.equal(bitmap[3], png.transparentBackground ? 0 : 255);
        assert(
          bitmap.some((value, i) =>
            png.transparentBackground
              ? i % 4 === 3 && value > 0
              : i % 4 !== 3 && value < 200,
          ),
          'PNG must contain visible score content.',
        );
        await writeFile(
          path.join(options.output, `${label}-${pageNumber}.png`),
          buffer,
        );
        pages.push(pageNumber);
        return !stopAfterFirst;
      },
      complete: async () => pages,
    });
    return pages;
  }
  assert.deepEqual(
    await render(
      options.rich,
      { dpi: 96, pageNumbers: [2], transparentBackground: true },
      'rich-transparent',
    ),
    [2],
  );
  assert.deepEqual(
    await render(
      options.rich,
      { dpi: 192, pageNumbers: null, transparentBackground: false },
      'rich-192dpi',
    ),
    [1, 2],
  );
  assert.deepEqual(
    await render(
      options.arabic,
      { dpi: 96, pageNumbers: null, transparentBackground: false },
      'arabic',
    ),
    [1],
  );
  assert.deepEqual(
    await render(
      options.rich,
      { dpi: 96, pageNumbers: [], transparentBackground: false },
      'empty-range',
    ),
    [],
  );
  await assert.rejects(
    render(
      options.arabic,
      { dpi: 96, pageNumbers: null, transparentBackground: false },
      'missing-directory/image',
    ),
    /ENOENT/,
  );
  assert.deepEqual(
    await render(
      options.arabic,
      { dpi: 96, pageNumbers: null, transparentBackground: false },
      'recovered',
    ),
    [1],
  );
  assert.deepEqual(
    await render(
      options.rich,
      { dpi: 96, pageNumbers: null, transparentBackground: false },
      'partial',
      true,
    ),
    [1],
  );
  assert.equal(JSON.stringify(options.rich), original);
  console.log(
    'PASS: PNG page ranges, DPI, transparency, visible rich/RTL content, partial cancellation, write failure/recovery, immutable snapshots',
  );
}
