// Page-dependent measured inputs (A5, C1.4, C1.5): a reused line whose
// scrollable rich-text cap changes, header/footer templates whose token
// expansion changes, and a block rich-text box whose footnote label changes.
// The synchronous oracle cannot see the new heights measured by the DOM.
// Each scenario runs twice in a disposable editor, once with paragraph reuse
// and once with full layout forced, and compares settled geometry.
// Build with VITE_LAYOUT_VERIFY_ENABLED=true.
//
//   node tests/integration/layout/check-page-inputs.mjs [--skip-build] [--only <name>]
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';
import { arabicRtlScore } from './arabicRtl.mjs';

const { values } = parseArgs({
  options: {
    'skip-build': { type: 'boolean' },
    only: { type: 'string', multiple: true },
  },
});

const boxFootnote = '00000000-0000-4000-8000-000000000099';
const symbolRepetitions = 40;
const narrowMarker = '\u00a7'.repeat(symbolRepetitions);
const wideMarker = '\u00b6'.repeat(symbolRepetitions);

// Each edit names a target resolved in the live editor before editing.
const scenarios = [
  {
    name: 'scrollable-cap',
    score: () => scrollableScore(false),
    edits: scrollableEdits(),
  },
  {
    name: 'scrollable-cap-rtl',
    score: () => scrollableScore(true),
    edits: scrollableEdits(),
  },
  {
    name: 'footnote-marker',
    score: () => footnoteScore(false),
    edits: footnoteEdits(),
  },
  {
    name: 'footnote-marker-rtl',
    score: () => footnoteScore(true),
    edits: footnoteEdits(),
  },
  {
    name: 'header-tokens-plain',
    score: () => headerScore(false),
    edits: headerEdits(),
  },
  {
    name: 'header-tokens-rich',
    score: () => headerScore(true),
    edits: headerEdits(),
  },
];
const requestedScenarios = values.only;
const scenarioNames = scenarios.map(({ name }) => name);
for (const name of requestedScenarios ?? []) {
  assert.ok(
    scenarioNames.includes(name),
    `Unknown --only scenario ${JSON.stringify(name)}. Choose from ${scenarioNames.join(', ')}.`,
  );
}
const selectedScenarios = requestedScenarios
  ? scenarios.filter(({ name }) => requestedScenarios.includes(name))
  : scenarios;

if (!values['skip-build']) {
  const build = spawnSync('npx', ['vite', 'build'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_LAYOUT_VERIFY_ENABLED: 'true',
      VITE_LAYOUT_FORCE_FULL: 'false',
    },
  });
  if (build.error) {
    throw build.error;
  }
  assert.equal(build.status, 0, 'Vite build failed');
}

const fixture = JSON.parse(
  await readFile(
    fileURLToPath(new URL('./fixtures/verify-layout.byzx', import.meta.url)),
    'utf8',
  ),
);
const notes = fixture.staff.elements.filter(
  ({ elementType }) => elementType === 'Note',
);
const clone = (value) => JSON.parse(JSON.stringify(value));
// Short explicit-break paragraphs, so that edits stay under the preparation
// limit of half the paragraphs.
const plainNotes = (count, from = 0, perParagraph = 4) =>
  Array.from({ length: count }, (_, i) => {
    const note = clone(notes[(from + i) % notes.length]);
    delete note.pageBreak;
    note.lineBreak = i % perParagraph === perParagraph - 1 || undefined;
    return note;
  });

function scrollableScore(rtl) {
  const score = clone(fixture);
  const lines = Array.from(
    { length: 80 },
    (_, i) => `<p>${rtl ? 'سطر' : 'Line'} ${i + 1}</p>`,
  ).join('');
  score.staff.elements = [
    ...plainNotes(24),
    {
      elementType: 'RichTextBox',
      content: lines,
      scrollable: true,
      // Saved below its measured height, like a box that never rendered.
      height: 20,
    },
    ...plainNotes(24, 24),
  ];
  if (rtl) {
    arabicRtlScore(score);
  }
  return score;
}

function footnoteScore(rtl) {
  const score = clone(fixture);
  // The fourth standard symbol is narrower than the fifth. Repeating them
  // leaves enough room for the first label and forces the second to wrap.
  score.pageSetup.footnoteFormat = 'symbols';
  score.pageSetup.firstFootnoteNumber = 6 * (symbolRepetitions - 1) + 4;
  const words = Array.from({ length: rtl ? 9 : 7 }, () =>
    rtl ? 'سطر' : 'word',
  ).join(' ');
  const text = rtl
    ? `<span style="font-family:'Noto Naskh Arabic'">${words}</span>`
    : words;
  score.staff.elements = [
    ...plainNotes(24),
    {
      elementType: 'RichTextBox',
      content: `<p>${text} <span class="neanes-footnote" data-footnote-id="${boxFootnote}"></span></p>`,
      height: 20,
    },
    ...plainNotes(24, 24),
  ];
  score.footnotes = [
    { id: boxFootnote, staff: { elements: [], lyrics: { text: '' } } },
  ];
  if (rtl) {
    arabicRtlScore(score);
  }
  return score;
}

function footnoteEdits() {
  // An earlier reference advances the box to the wider automatic symbol.
  return [
    {
      label: 'footnote before the box (wider automatic symbol)',
      kind: 'footnote',
      at: 10,
      boxLabel: wideMarker,
      expectBoxReuse: true,
    },
    {
      label: 'wide custom marker',
      kind: 'marker',
      value: 'WWWWWWWWWWWWWWWW',
      boxLabel: 'WWWWWWWWWWWWWWWW',
    },
    {
      label: 'automatic marker again',
      kind: 'marker',
      value: null,
      boxLabel: wideMarker,
    },
    {
      label: 'remove the footnote (narrower automatic symbol)',
      kind: 'footnote',
      at: 10,
      boxLabel: narrowMarker,
    },
    { label: 'note in the box footnote body', kind: 'footnoteBody' },
  ];
}

function headerScore(rich) {
  const score = clone(fixture);
  const chapter = (text) => ({
    elementType: 'TextBox',
    content: text,
    runningMarkerRole: 'chapter',
    paragraphStyleId: 'default-text',
  });
  // Titles of one width, so that a template measures the same on every page
  // and settles. (A template has one height, taken from the page that measured
  // it last, so wrapping that differs by page never settles, with either
  // layout path.)
  score.staff.elements = [
    chapter('Chapter 1'),
    ...plainNotes(90, 0, 6),
    chapter('Chapter 2'),
    ...plainNotes(90, 90, 6),
    chapter('Chapter 3'),
    ...plainNotes(60, 20, 6),
  ];
  Object.assign(score.pageSetup, { showHeader: true, showFooter: true });
  const template = (center) =>
    rich
      ? {
          elementType: 'RichTextBox',
          multipanel: true,
          contentLeft: '',
          contentCenter: `<p>${center} $:chapter</p>`,
          contentRight: '<p>$p / $n</p>',
          height: 20,
        }
      : {
          elementType: 'TextBox',
          paragraphStyleId: 'default-text',
          multipanel: true,
          contentLeft: '',
          contentCenter: `${center} $:chapter`,
          contentRight: '$p / $n',
          height: 20,
        };
  for (const key of Object.keys(score.headers)) {
    score.headers[key].elements = [template('Header')];
  }
  for (const key of Object.keys(score.footers)) {
    score.footers[key].elements = [template('Footer')];
  }
  return score;
}

function scrollableEdits() {
  // The box's capped height fills its page, so it is re-placed higher on its
  // page (larger cap) or pushed to the next one (full-page cap). Notes 3, 7,
  // ... end their paragraphs.
  return [
    { label: 'join two lines (box moves up)', kind: 'lineBreak', at: 3 },
    { label: 'join two more (box moves up)', kind: 'lineBreak', at: 11 },
    { label: 'split again (box to next page)', kind: 'lineBreak', at: 3 },
    { label: 'page break after it (box moves)', kind: 'pageBreak', at: 15 },
    { label: 'remove it', kind: 'pageBreak', at: 15 },
    { label: 'line break after the box', kind: 'lineBreak', at: 26 },
  ];
}

function headerEdits() {
  // Page breaks early on page 1 move the chapter markers to other pages, so
  // reused pages show other chapter titles and page totals.
  return [
    { label: 'page break on page 1', kind: 'pageBreak', at: 20 },
    { label: 'second page break', kind: 'pageBreak', at: 40 },
    { label: 'remove the first', kind: 'pageBreak', at: 20 },
    { label: 'remove the second', kind: 'pageBreak', at: 40 },
    { label: 'join two lines on page 1', kind: 'lineBreak', at: 5 },
  ];
}

// Runs in the renderer. Visits every page so each mounts and reports its
// measured heights, then waits until no layout or height write happens.
async function settle(editor) {
  const workspace = editor.selectedWorkspace.value;
  const layouts = editor.layoutDiagnostics.results;
  const frame = () =>
    new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const quiet = async () => {
    let seen = -1;
    let heights = '';
    for (let i = 0; i < 100; i++) {
      await wait(400);
      const current = JSON.stringify([
        ...editor.elements.value.map((element) => element.height),
        ...editor.score.value.headersAndFooters.map(
          (element) => element.height,
        ),
      ]);
      if (layouts.length === seen && current === heights) {
        return;
      }
      seen = layouts.length;
      heights = current;
    }
    throw new Error('Layout did not settle');
  };
  for (let sweep = 0; sweep < 4; sweep++) {
    const before = layouts.length;
    await quiet();
    const pages = document.querySelectorAll('.page');
    for (const page of pages) {
      page.scrollIntoView({ block: 'start' });
      await frame();
      await wait(250);
    }
    document.querySelectorAll('.page')[0]?.scrollIntoView({ block: 'start' });
    await frame();
    await quiet();
    if (layouts.length === before) {
      return { sweeps: sweep + 1, revision: workspace.contentRevision };
    }
  }
  return { sweeps: 'unsettled', revision: workspace.contentRevision };
}

// Runs in the renderer: geometry after settling, per page.
async function snapshot(editor) {
  const frame = () =>
    new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const round = (value) =>
    typeof value === 'number' ? Math.round(value * 1000) / 1000 : value;
  const elements = editor.elements.value.map((element) => ({
    id: element.id,
    type: element.elementType,
    page: element.page,
    line: element.line,
    x: round(element.x),
    y: round(element.y),
    width: round(element.width),
    height: ['TextBox', 'RichTextBox'].includes(element.elementType)
      ? round(element.height)
      : undefined,
  }));
  const templates = editor.score.value.headersAndFooters.map((element) =>
    round(element.height),
  );
  const dom = [];
  for (const page of document.querySelectorAll('.page')) {
    page.scrollIntoView({ block: 'start' });
    await frame();
    await wait(150);
    const top = page.getBoundingClientRect().top;
    dom.push(
      [
        ...page.querySelectorAll(
          '.rich-text-box-container, .text-box-container',
        ),
      ].map((box) => {
        const rect = box.getBoundingClientRect();
        const scroller = box.querySelector('.rich-text-editor.scrollable');
        return {
          top: round(rect.top - top),
          height: round(rect.height),
          // Catches stale token expansions on reused pages.
          text: box.textContent.trim(),
          maxHeight: scroller ? getComputedStyle(scroller).maxHeight : null,
          scrollHeight: scroller ? round(scroller.clientHeight) : null,
        };
      }),
    );
  }
  document.querySelectorAll('.page')[0]?.scrollIntoView({ block: 'start' });
  // A settled scrollable box is capped at the page bottom from its current y.
  const { pageHeight, bottomMargin, topMargin } = editor.score.value.pageSetup;
  const staleCaps = [];
  const seen = new Map();
  for (const element of editor.elements.value) {
    if (
      element.elementType !== 'RichTextBox' ||
      !element.scrollable ||
      element.multipanel ||
      element.inline
    ) {
      continue;
    }
    const index = seen.get(element.page) ?? 0;
    seen.set(element.page, index + 1);
    const box = dom[element.page - 1].filter(
      ({ maxHeight }) => maxHeight !== null,
    )[index];
    const cap = pageHeight - element.y - bottomMargin;
    // A missing scroller or an uncapped one (`none`) parses as NaN.
    const rendered = parseFloat(box?.maxHeight);
    if (!Number.isFinite(rendered) || Math.abs(rendered - cap) > 0.01) {
      staleCaps.push({ id: element.id, cap: round(cap), dom: box?.maxHeight });
    }
  }
  const headers = dom.map((boxes) =>
    boxes.filter(({ top }) => top < topMargin).map(({ height }) => height),
  );
  return { pages: dom.length, elements, templates, dom, staleCaps, headers };
}

// Runs in the renderer.
async function edit(editor, { kind, at, value, expectBoxReuse }, boxFootnote) {
  const test = editor.layoutTest;
  const layouts = editor.layoutDiagnostics.results;
  layouts.length = 0;
  const note = editor.elements.value.filter(
    ({ elementType }) => elementType === 'Note',
  )[at];
  const box = expectBoxReuse
    ? editor.elements.value.find(
        ({ elementType }) => elementType === 'RichTextBox',
      )
    : undefined;
  const previousBoxLine = box && test.lineForElement(box);
  editor.selectedElement.value = note ?? null;
  if (kind === 'lineBreak') {
    test.toggleLineBreak(null);
  } else if (kind === 'pageBreak') {
    test.togglePageBreak();
  } else if (kind === 'footnote') {
    test.toggleFootnote(note);
  } else if (kind === 'marker') {
    test.setFootnoteMarker(boxFootnote, value);
  } else {
    test.appendToFootnote(boxFootnote, 'Oligon');
  }
  // Compare the published lines before the DOM reports the new height.
  const boxLineReused =
    !!previousBoxLine && previousBoxLine === test.lineForElement(box);
  await test.flushRender();
  const result = layouts[0];
  return {
    status: result?.status,
    prepared: result?.prepared,
    total: result?.totalParagraphs,
    shiftedLines: result?.shiftedLines,
    boxLineReused,
  };
}

function compare(a, b, prefix = '') {
  if (Object.is(a, b)) {
    return null;
  }
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return `${prefix}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`;
  }
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const difference = compare(a[key], b[key], `${prefix}.${key}`);
    if (difference) {
      return difference;
    }
  }
  return null;
}

async function run(scenario, forceFull) {
  const app = await createSmokeApp('neanes-page-inputs-');
  try {
    const file = path.join(app.directory, `${scenario.name}.byzx`);
    await writeFile(file, JSON.stringify(scenario.score()));
    app.start({ appArgs: [process.cwd(), file] });
    const { evaluate } = await app.debugger('renderer');
    await app.ready();
    const inEditor = (fn, ...args) =>
      evaluate(
        `(${fn})(window._editor, ${args.map((arg) => JSON.stringify(arg)).join(', ')})`,
        { timeoutMs: 120_000 },
      );
    await eventually(
      async () => {
        const status = await evaluate(`({
          file: window._editor?.selectedWorkspace.value.filePath,
          hook: !!window._editor?.layoutTest,
        })`);
        assert.equal(status.file, file, 'Awaiting fixture load');
        assert.ok(status.hook, 'Build with VITE_LAYOUT_VERIFY_ENABLED=true');
      },
      { timeoutMs: 60_000 },
    );
    await inEditor(
      (editor, value) => editor.layoutTest.setForceFullLayout(value),
      forceFull,
    );
    const opened = await inEditor(settle);
    const steps = [
      { label: 'open', settled: opened, geometry: await inEditor(snapshot) },
    ];
    for (const step of scenario.edits) {
      const layout = await inEditor(edit, step, boxFootnote);
      if (forceFull) {
        assert.equal(
          layout?.status,
          'forced full',
          `${scenario.name}, ${step.label}: expected a forced full layout`,
        );
      }
      const settled = await inEditor(settle);
      steps.push({
        label: step.label,
        layout,
        settled,
        geometry: await inEditor(snapshot),
      });
    }
    // Cumulative, so it includes layouts that ran while settling.
    const oracle = await evaluate(`(({ checks, failures, firstDifference }) =>
      ({ checks, failures, firstDifference }))(window.__neanesLayoutVerify)`);
    return { steps, oracle };
  } finally {
    await app.close();
  }
}

let failed = false;
for (const scenario of selectedScenarios) {
  const reused = await run(scenario, false);
  const full = await run(scenario, true);
  console.log(`${scenario.name}:`);
  for (const [mode, { oracle }] of [
    ['reuse', reused],
    ['full', full],
  ]) {
    if (oracle.failures) {
      failed = true;
      console.log(
        `  ORACLE ${mode}: ${oracle.failures}/${oracle.checks} layouts differ\n` +
          `    ${JSON.stringify(oracle.firstDifference)}`,
      );
    }
  }
  if (!reused.steps.some(({ layout }) => layout?.status === 'reused')) {
    failed = true;
    console.log('  NO REUSE: every edit ran a full layout');
  }
  for (const [index, step] of reused.steps.entries()) {
    const reference = full.steps[index];
    const difference = compare(step.geometry, reference.geometry);
    const unsettled = [step, reference].some(
      ({ settled }) => settled.sweeps === 'unsettled',
    );
    const layout = step.layout
      ? ` [${step.layout.status}, ${step.layout.prepared}/${step.layout.total} prepared, ` +
        `${step.layout.shiftedLines} re-placed; full: ${reference.layout.status}; ` +
        `settled in ${step.settled.sweeps}/${reference.settled.sweeps} sweeps]`
      : '';
    const boxes = step.geometry.dom
      .flat()
      .filter(({ maxHeight }) => maxHeight !== null && maxHeight !== 'none')
      .map(({ top, height, maxHeight }) => `top ${top} ${height}/${maxHeight}`);
    const stale = [...step.geometry.staleCaps, ...reference.geometry.staleCaps];
    const headers = step.geometry.headers.some((page) => page.length)
      ? `, header/footer heights by page ${JSON.stringify(step.geometry.headers)}`
      : '';
    const verdict = unsettled ? 'UNSETTLED' : difference ? 'DIFF' : 'same';
    console.log(
      `  ${verdict} ${step.label}${layout}; ` +
        `${step.geometry.pages} pages, templates [${step.geometry.templates.join(', ')}]` +
        (boxes.length ? `, capped boxes ${boxes.join(' ')}` : '') +
        headers +
        (stale.length ? `\n    stale caps ${JSON.stringify(stale)}` : '') +
        (difference ? `\n    ${difference}` : ''),
    );
    if (unsettled || difference || stale.length) {
      failed = true;
    }
    const expected = scenario.edits[index - 1];
    if (expected?.boxLabel) {
      // Both modes share the renderer, so also check the label it shows.
      const text = step.geometry.dom
        .flat()
        .find(({ text }) => /word|سطر/.test(text))?.text;
      if (!text?.endsWith(expected.boxLabel)) {
        failed = true;
        console.log(`    BOX LABEL: expected ${expected.boxLabel} in ${text}`);
      }
    }
    if (expected?.expectBoxReuse) {
      if (step.layout.status !== 'reused' || !step.layout.boxLineReused) {
        failed = true;
        console.log('    BOX LINE WAS NOT REUSED');
      }
      const boxHeight = (geometry) =>
        geometry.elements.find(({ type }) => type === 'RichTextBox').height;
      const before = boxHeight(reused.steps[index - 1].geometry);
      const after = boxHeight(step.geometry);
      if (!(after > before)) {
        failed = true;
        console.log(`    BOX DID NOT GROW: ${before} -> ${after}`);
      }
    }
  }
}
assert.ok(!failed, 'Page-dependent inputs differ from full layout');
