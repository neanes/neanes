// B4: how often measured text box heights are written outside commands while
// opening, scrolling, editing and zooming, what layouts they cause, and
// whether measuring every box off screen up front gives the same heights.
// Build with VITE_LAYOUT_PROFILING_ENABLED=true.
//
//   node tests/integration/layout/profile-text-box-heights.mjs score.byz
import assert from 'node:assert/strict';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';

const [scorePath] = process.argv.slice(2);
assert.ok(scorePath, 'Usage: profile-text-box-heights.mjs score.byz');
const source = path.resolve(scorePath);

async function openApp(file) {
  const app = await createSmokeApp('neanes-text-box-heights-');
  try {
    const score = path.join(app.directory, path.basename(file));
    await copyFile(file, score);
    app.start({ appArgs: [process.cwd(), score] });
    const { evaluate } = await app.debugger('renderer');
    await app.ready();
    const inEditor = (fn, ...args) =>
      evaluate(
        `(${fn})(window._editor, ${args.map((arg) => JSON.stringify(arg)).join(', ')})`,
        { timeoutMs: 600_000 },
      );
    await eventually(async () => {
      const result = await evaluate(`(() => {
      const e = window._editor;
      if (e?.selectedWorkspace.value.filePath !== ${JSON.stringify(score)}) {
        return null;
      }
      if (!e.layoutProfile) {
        return 'missing';
      }
      return performance.now();
    })()`);
      assert.notEqual(
        result,
        'missing',
        'Build with VITE_LAYOUT_PROFILING_ENABLED=true',
      );
      assert.ok(result, 'Score has not opened');
      return result;
    });
    return { app, score, inEditor };
  } catch (error) {
    await app.close();
    throw error;
  }
}

// Runs in the renderer: a mark for slicing writes and layouts.
function mark() {
  return {
    time: performance.now(),
  };
}

// Runs in the renderer: everything recorded since the mark.
async function since(editor, start, idleMs) {
  await new Promise((resolve) => setTimeout(resolve, idleMs));
  const entries = (name) =>
    performance
      .getEntriesByName(name)
      .filter((entry) => entry.startTime >= start.time);
  const writes = entries('editor.textBoxHeightWrite');
  const layouts = entries('editor.layout');
  const boxes = editor.elements.value.filter(
    (element) => element.elementType === 'TextBox' && !element.inline,
  );
  return {
    writes: writes.length,
    distinctBoxes: new Set(writes.map(({ detail }) => detail)).size,
    durations: layouts.map(({ duration }) => Math.round(duration)),
    unmeasured: boxes.filter((box) => box.height === 20).length,
    pages: document.querySelectorAll('.page').length,
    boxes: boxes.length,
  };
}

// Runs in the renderer: scroll page by page at a fixed pace. Measured
// heights add pages, so the page count is read on every step.
async function sweep(_editor, { from, to, paceMs }) {
  const pages = () => document.querySelectorAll('.page');
  const frame = () =>
    new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
  let page = from;
  for (; page <= Math.min(to, pages().length); page++) {
    pages()[page - 1].scrollIntoView({ block: 'start' });
    await frame();
    await new Promise((resolve) => setTimeout(resolve, paceMs));
  }
  return page - 1;
}

// Runs in the renderer: toggle a line break twice on a note on `page`
// while viewing `viewPage`.
async function editTwice(editor, { page, viewPage }) {
  document
    .querySelectorAll('.page')
    [viewPage - 1].scrollIntoView({ block: 'start' });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const elements = editor.elements.value;
  const index = elements.findIndex(
    (item, i) =>
      item.page === page &&
      item.elementType === 'Note' &&
      !item.lineBreak &&
      !item.pageBreak &&
      elements[i - 1]?.line === item.line &&
      elements[i + 1]?.line === item.line,
  );
  for (let i = 0; i < 2; i++) {
    editor.selectedElement.value = elements[index];
    editor.layoutProfile.toggleLineBreak(null);
    await editor.layoutProfile.flushRender();
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

function report(name, result) {
  console.log(
    `${name}: ${result.writes} height writes (${result.distinctBoxes} boxes), ` +
      `${result.durations.length} layouts, ms [${result.durations.join(',')}]; ` +
      `still at 20 px: ${result.unmeasured}/${result.boxes}; ` +
      `pages ${result.pages}`,
  );
}

const output = await mkdtemp(path.join(tmpdir(), 'neanes-measured-book-'));
try {
  const saved = path.join(output, path.basename(source));
  {
    const { app, score, inEditor } = await openApp(source);
    try {
      let start;
      report('open (first 3 s)', await inEditor(since, { time: 0 }, 3000));

      const measured = await inEditor((editor) =>
        editor.layoutProfile.measureAllTextBoxes(),
      );
      console.log(
        `measure all ${measured.boxes} boxes off screen: ${measured.duration.toFixed(0)} ms`,
      );
      const offscreen = new Map(measured.heights);

      start = await inEditor(mark);
      await inEditor(sweep, { from: 2, to: 100, paceMs: 100 });
      report(
        'fast scroll pages 2-100 (100 ms/page)',
        await inEditor(since, start, 1000),
      );

      start = await inEditor(mark);
      await inEditor(sweep, { from: 101, to: 130, paceMs: 600 });
      report(
        'reading scroll pages 101-130 (600 ms/page)',
        await inEditor(since, start, 1000),
      );

      start = await inEditor(mark);
      await inEditor(sweep, { from: 1, to: 130, paceMs: 100 });
      report(
        're-scroll visited pages 1-130',
        await inEditor(since, start, 1000),
      );

      start = await inEditor(mark);
      await inEditor(editTwice, { page: 50, viewPage: 50 });
      report(
        '2 line-break toggles on page 50 (visited)',
        await inEditor(since, start, 1000),
      );

      start = await inEditor(mark);
      await inEditor(editTwice, { page: 400, viewPage: 120 });
      report(
        '2 toggles on page 400, viewing 120',
        await inEditor(since, start, 1000),
      );

      start = await inEditor(mark);
      await inEditor(async (editor) => {
        editor.layoutProfile.updateZoom(1.25);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        editor.layoutProfile.updateZoom(1);
      });
      report(
        'zoom 1 -> 1.25 -> 1 on page 120',
        await inEditor(since, start, 1500),
      );

      start = await inEditor(mark);
      await inEditor(sweep, { from: 131, to: 10_000, paceMs: 60 });
      report(
        'fast scroll pages 131-end (60 ms/page)',
        await inEditor(since, start, 1500),
      );

      const comparison = await inEditor(
        (editor, entries) => {
          const offscreen = new Map(entries);
          let equal = 0;
          let maxDiff = 0;
          for (const element of editor.elements.value) {
            if (offscreen.has(element.id)) {
              const diff = Math.abs(offscreen.get(element.id) - element.height);
              maxDiff = Math.max(maxDiff, diff);
              if (diff <= 0.001) {
                equal++;
              }
            }
          }
          return { equal, total: offscreen.size, maxDiff };
        },
        [...offscreen],
      );
      console.log(
        `off-screen vs on-page heights: ${comparison.equal}/${comparison.total} within 0.001 px, max diff ${comparison.maxDiff}`,
      );

      const ok = await inEditor((editor) => editor.layoutProfile.saveFile());
      assert.ok(ok.success, 'Saving failed');
      await copyFile(score, saved);
    } finally {
      await app.close();
    }
  }
  const { app, inEditor } = await openApp(saved);
  try {
    report(
      'reopen saved file (first 3 s)',
      await inEditor(since, { time: 0 }, 3000),
    );
    const start = await inEditor(mark);
    await inEditor(sweep, { from: 2, to: 10_000, paceMs: 60 });
    report('reopened: scroll pages 2-end', await inEditor(since, start, 1500));
  } finally {
    await app.close();
  }
} finally {
  await rm(output, { recursive: true, force: true });
}
