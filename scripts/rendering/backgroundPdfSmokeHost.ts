import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { app, BrowserWindow } from 'electron';

import { renderPdf } from '../../electron/main/export/renderPdf';
import type { ScoreRenderSnapshot } from '../../src/services/rendering/scoreRenderSnapshot';
import { checkPdfSettling } from './backgroundPdfSettlingChecks';

const root = process.env.NEANES_PDF_SMOKE_ROOT!;
const output = process.env.NEANES_PDF_SMOKE_OUTPUT!;
const profile = process.env.NEANES_PDF_SMOKE_PROFILE!;
mkdirSync(profile, { recursive: true });
app.setPath('userData', profile);
app.setPath('sessionData', profile);
app.on('window-all-closed', () => {});

async function snapshot(fileName: string): Promise<ScoreRenderSnapshot> {
  const filePath = path.join(root, 'examples', fileName);
  return {
    score: JSON.parse(await readFile(filePath, 'utf8')),
    filePath,
    fileName,
    title: path.basename(fileName, '.byzx'),
    editorLanguage: 'en',
    systemFonts: [],
    overlays: {
      showDeveloperPanels: false,
      overlaysEnabled: false,
      printOverlays: false,
      showGuides: false,
      showAdjustmentRatios: false,
      showAnonymousBoxes: false,
      showElementBoxes: false,
      showInkBoundingBoxes: false,
      showGlueWidths: false,
      showLyricBaselines: false,
      showLyricBoundingBoxes: false,
      showNeumeBoundingBoxes: false,
      showCollisionRegions: false,
    },
  };
}

async function run() {
  await app.whenReady();
  const owner = new BrowserWindow({ show: false });
  await owner.loadURL('about:blank');
  const startCount = BrowserWindow.getAllWindows().length;
  const render = (
    score: ScoreRenderSnapshot,
    signal = new AbortController().signal,
    parent = owner,
  ) =>
    renderPdf({
      args: {
        snapshot: score,
        landscape: score.score.pageSetup.landscape ?? false,
      },
      parent,
      preload: path.join(root, 'dist-electron/preload/index.js'),
      entry: path.join(root, 'dist/export.html'),
      pageSize: 'Letter',
      signal,
    });
  const english = await snapshot(
    'English - Lord I Have Cried - First Mode.byzx',
  );
  const arabic = await snapshot(
    'Arabic - RTL - Resurrectional Apolytikion - Plagal of the Fourth Mode.byzx',
  );
  const rich = await snapshot('Rich Text.byzx');
  const original = JSON.stringify(english);
  const results = await Promise.all([render(english), render(arabic)]);
  const richPdf = await render(rich);
  for (const [index, data] of [...results, richPdf].entries()) {
    assert.equal(data.subarray(0, 5).toString(), '%PDF-');
    await writeFile(path.join(output, `${index + 1}.pdf`), data);
  }
  assert.equal(JSON.stringify(english), original);
  assert.equal(BrowserWindow.getAllWindows().length, startCount);
  console.log(
    'PASS: concurrent PDF renders, rich text, immutable snapshots, cleanup',
  );

  await checkPdfSettling({ snapshot: english, root, output, owner });
  assert.equal(BrowserWindow.getAllWindows().length, startCount);

  const canceled = new AbortController();
  canceled.abort();
  await assert.rejects(render(english, canceled.signal));
  assert.equal(BrowserWindow.getAllWindows().length, startCount);

  const interrupted = new AbortController();
  const pending = render(english, interrupted.signal);
  assert.equal(BrowserWindow.getAllWindows().length, startCount + 1);
  interrupted.abort();
  await assert.rejects(pending);
  assert.equal(BrowserWindow.getAllWindows().length, startCount);
  console.log('PASS: cancellation before and during rendering');

  const closingOwner = new BrowserWindow({ show: false });
  await closingOwner.loadURL('about:blank');
  const closing = render(english, new AbortController().signal, closingOwner);
  closingOwner.destroy();
  await assert.rejects(closing, /EXPORT_RENDER_FAILED/);
  assert.equal(BrowserWindow.getAllWindows().length, startCount);
  console.log('PASS: owner closure cancels rendering and disposes resources');

  const invalid = structuredClone(english);
  invalid.score.version = 'invalid';
  await assert.rejects(render(invalid), /EXPORT_RENDER_FAILED/);
  assert.equal(BrowserWindow.getAllWindows().length, startCount);
  const recovered = await render(english);
  assert.equal(recovered.subarray(0, 5).toString(), '%PDF-');
  assert.equal(BrowserWindow.getAllWindows().length, startCount);
  owner.destroy();
  console.log(
    'PASS: renderer failure cleanup and subsequent successful export',
  );
}

void run().then(
  () => app.exit(0),
  (error: unknown) => {
    console.error(error);
    app.exit(1);
  },
);
