// Measure layout and renderer updates when a line break moves later lines.
// Build with VITE_LAYOUT_PROFILING_ENABLED=true (add
// VITE_LAYOUT_VERIFY_ENABLED=true to also check every edit with the oracle).
import assert from 'node:assert/strict';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';

const [scorePath, repeatArg] = process.argv.slice(2);
assert.ok(scorePath, 'Usage: profile-line-shifts.mjs score.byz [toggles]');
const toggles = Number(repeatArg ?? 8);
assert.ok(
  Number.isSafeInteger(toggles) && toggles > 0 && toggles % 2 === 0,
  'Use a positive even number of toggles',
);
const source = path.resolve(scorePath);
const app = await createSmokeApp('neanes-layout-shifts-');

// Runs in the renderer. Toggles a line break on the target note and reports
// the layout record and the element wrappers on mounted pages.
async function toggle(editor, { noteIndex, viewPage }) {
  const scrollTo = (page) =>
    document
      .querySelectorAll('.page')
      [page - 1]?.scrollIntoView({ block: 'center' });
  const frame = () =>
    new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
  scrollTo(viewPage);
  await frame();
  await frame();
  const snapshot = () => {
    const boxes = new Map();
    for (const node of document.querySelectorAll('.element-box[id]')) {
      boxes.set(node.id, { node, style: node.getAttribute('style') });
    }
    return boxes;
  };
  const mountedPages = () =>
    [...document.querySelectorAll('.page')]
      .map((page, index) => [page, index + 1])
      .filter(([page]) => page.querySelector('.element-box'))
      .map(([, number]) => number);
  const before = snapshot();
  const pagesBefore = mountedPages();
  const note = editor.elements.value[noteIndex];
  editor.selectedElement.value = note;
  const previousBreak = note.lineBreak;
  const start = performance.now();
  editor.layoutProfile.toggleLineBreak(null);
  await editor.layoutProfile.flushRender();
  const flushed = performance.now();
  await frame();
  const painted = performance.now();
  const after = snapshot();
  const counts = { kept: 0, moved: 0, replaced: 0, added: 0, removed: 0 };
  for (const [id, { node, style }] of after) {
    const old = before.get(id);
    if (old === undefined) {
      counts.added++;
    } else if (old.node !== node) {
      counts.replaced++;
    } else if (old.style !== style) {
      counts.moved++;
    } else {
      counts.kept++;
    }
  }
  for (const id of before.keys()) {
    if (!after.has(id)) {
      counts.removed++;
    }
  }
  const verify = window.__neanesLayoutVerify;
  return {
    changed: note.lineBreak !== previousBreak,
    layout: window.__neanesLayoutProfile.find(
      (entry) => entry.name === 'processPages' && entry.start >= start,
    ),
    counts,
    pagesBefore,
    pagesAfter: mountedPages(),
    flush: flushed - start,
    paint: painted - start,
    failures: verify?.failures ?? null,
    difference: verify?.firstDifference ?? null,
  };
}

try {
  const score = path.join(app.directory, path.basename(source));
  await copyFile(source, score);
  app.start({ appArgs: [process.cwd(), score] });
  const { evaluate } = await app.debugger('renderer');
  await app.ready();
  const inEditor = (fn, ...args) =>
    evaluate(
      `(${fn})(window._editor, ${args.map((arg) => JSON.stringify(arg)).join(', ')})`,
      { timeoutMs: 120_000 },
    );
  const targets = await eventually(async () => {
    const result = await evaluate(`(() => {
      const e = window._editor;
      if (e?.selectedWorkspace.value.filePath !== ${JSON.stringify(score)}) {
        return null;
      }
      if (!e.layoutProfile) {
        return 'missing';
      }
      const elements = e.elements.value;
      // A note in the middle of a line, so a line break adds a line.
      const pick = (from) => elements.findIndex(
        (item, index) =>
          index >= from &&
          item.elementType === 'Note' &&
          !item.lineBreak &&
          !item.pageBreak &&
          elements[index - 1]?.line === item.line &&
          elements[index + 1]?.line === item.line,
      );
      const first = pick(0);
      const middle = pick(Math.floor(elements.length / 2));
      return {
        elements: elements.length,
        pages: elements.at(-1).page,
        first: { noteIndex: first, page: elements[first].page },
        middle: { noteIndex: middle, page: elements[middle].page },
      };
    })()`);
    assert.notEqual(
      result,
      'missing',
      'Build with VITE_LAYOUT_PROFILING_ENABLED=true',
    );
    assert.ok(result, 'Score has not opened');
    return result;
  });
  console.log(JSON.stringify(targets));
  const scenarios = [
    {
      name: 'edit on page 1, viewing page 1',
      noteIndex: targets.first.noteIndex,
      viewPage: targets.first.page,
    },
    {
      name: `edit on page 1, viewing page ${targets.middle.page}`,
      noteIndex: targets.first.noteIndex,
      viewPage: targets.middle.page,
    },
    {
      name: `edit on page ${targets.middle.page}, viewing it`,
      noteIndex: targets.middle.noteIndex,
      viewPage: targets.middle.page,
    },
  ];
  const median = (values) => {
    const sorted = values.toSorted((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  for (const scenario of scenarios) {
    const samples = [];
    // Two warm-up toggles, then an even number so the score ends unchanged.
    for (let i = 0; i < toggles + 2; i++) {
      const sample = await inEditor(toggle, scenario);
      assert.ok(sample.changed, 'Line-break toggle did not change the note');
      assert.ok(sample.layout, 'Line-break toggle did not run layout');
      assert.equal(sample.failures ?? 0, 0, JSON.stringify(sample.difference));
      if (i >= 2) {
        samples.push(sample);
      }
    }
    const field = (get) => median(samples.map(get));
    console.log(
      `${scenario.name}: layout ${field(({ layout }) => layout.duration).toFixed(1)} ms, ` +
        `flush ${field(({ flush }) => flush).toFixed(1)} ms, ` +
        `paint ${field(({ paint }) => paint).toFixed(1)} ms`,
    );
    console.log(
      `  wrappers (median per edit): ${Object.keys(samples[0].counts)
        .map((key) => `${key} ${field(({ counts }) => counts[key])}`)
        .join(
          ', ',
        )}; mounted pages ${samples.at(-1).pagesBefore.join(',')} -> ${samples.at(-1).pagesAfter.join(',')}`,
    );
  }
} finally {
  await app.close();
}
