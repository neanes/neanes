// Runs seeded edits through the editor's normal command and layout paths.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFile, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';
import { arabicRtlScore } from './arabicRtl.mjs';

const { values } = parseArgs({
  options: {
    help: { type: 'boolean' },
    'skip-build': { type: 'boolean' },
    incremental: { type: 'boolean' },
    facing: { type: 'boolean' },
    seed: { type: 'string', multiple: true },
    steps: { type: 'string' },
    score: { type: 'string', multiple: true },
    replay: { type: 'string' },
    sequence: { type: 'string', multiple: true },
  },
});

if (values.help) {
  console.log(
    'Usage: node tests/integration/layout/random-edits.mjs [--skip-build] [--incremental] [--facing]\n' +
      '       [--seed <uint32>] [--steps <count>] [--score <file.byz|file.byzx>]\n' +
      '       or [--replay <failure.json>]. Repeat --seed or --score for a matrix.\n' +
      '       --incremental --sequence <name> runs only that scripted sequence.',
  );
  process.exit(0);
}

function integer(value, name, min, max) {
  const number = Number(value);
  assert.ok(
    /^\d+$/.test(value) &&
      Number.isSafeInteger(number) &&
      number >= min &&
      number <= max,
    `${name} must be an integer from ${min} to ${max}`,
  );
  return number;
}

const steps = integer(
  values.steps ?? '200',
  '--steps',
  1,
  Number.MAX_SAFE_INTEGER,
);
const seeds = (values.seed ?? ['1']).map((seed) =>
  integer(seed, '--seed', 0, 0xffffffff),
);
const fixture = fileURLToPath(
  new URL('./fixtures/verify-layout.byzx', import.meta.url),
);
const replay = values.replay
  ? JSON.parse(await readFile(values.replay, 'utf8'))
  : null;
if (replay) {
  assert.equal(replay.version, 1, 'Unsupported replay format');
  assert.ok(Array.isArray(replay.edits), 'Missing replay edits');
  assert.ok(
    !values.seed && !values.score && !values.steps,
    '--replay supplies its own score and edit sequence',
  );
}
const fixtures = replay
  ? [
      {
        name: replay.fixture,
        file: path.resolve(path.dirname(values.replay), replay.score),
      },
    ]
  : (values.score?.map((file) => ({ name: path.resolve(file), file })) ?? [
      { name: 'verify-layout', file: fixture },
      { name: 'verify-layout-rtl', file: fixture, rtl: true },
    ]);

if (!values['skip-build']) {
  const build = spawnSync('npx', ['vite', 'build'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_LAYOUT_VERIFY_ENABLED: 'true',
      VITE_LAYOUT_FORCE_FULL: String(!values.incremental),
    },
  });
  if (build.error) {
    throw build.error;
  }
  assert.equal(build.status, 0, 'Vite build failed');
}

// Mulberry32. All rolls are generated in the runner so replay needs no RNG.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
  };
}

// This function and applyEdit run in the disposable renderer. Only the chosen
// edit and compact diagnostics cross CDP, even on book-length scores.
function chooseEdit(editor, rolls, lastIndex) {
  const [kindRoll, startRoll, directionRoll, variantRoll, localityRoll] = rolls;
  const elements = editor.elements.value;
  // Melkite RTL takes only Arabic lyrics, with tatweel for melismas.
  const rtl = editor.score.value.pageSetup.melkiteRtl;
  const words = rtl
    ? [
        '\u0622\u0645\u064a\u0646',
        '\u0631\u0628\u0651',
        '\u0647\u0644\u0644\u064a\u0644\u0648\u064a\u0627',
      ]
    : ['amen', 'kyrie', 'alleluia'];
  const history = editor.layoutTest.history();
  const editKinds = [
    'neume',
    'fthora',
    'lyrics',
    'melisma',
    'ison',
    'bar',
    'lineBreak',
    'pageBreak',
    'insert',
    'append',
    'delete',
    'martyria',
    'modeKey',
    'footnote',
    'footnoteBody',
    'footnoteMarker',
    'undo',
    'redo',
  ];
  let kind = editKinds[Math.floor(kindRoll * editKinds.length)];
  if (
    (kind === 'footnoteBody' || kind === 'footnoteMarker') &&
    !elements.some(
      (element) => element.elementType === 'Note' && element.footnoteId != null,
    )
  ) {
    // Body and marker edits need a footnote; add one instead.
    kind = 'footnote';
  }
  const needsFootnote = kind === 'footnoteBody' || kind === 'footnoteMarker';
  const neumes = ['Ison', 'Oligon', 'Apostrophos', 'Petasti'];
  const variant = Math.floor(variantRoll * neumes.length);
  if (
    (kind === 'undo' && history.canUndo) ||
    (kind === 'redo' && history.canRedo)
  ) {
    return { kind };
  }
  if (kind === 'append') {
    return { kind, value: neumes[variant] };
  }

  const start =
    localityRoll < 0.5
      ? Math.min(
          elements.length - 1,
          Math.max(0, lastIndex + Math.floor(startRoll * 25) - 12),
        )
      : Math.floor(startRoll * elements.length);
  const direction = directionRoll < 0.5 ? -1 : 1;
  const type =
    {
      martyria: 'Martyria',
      modeKey: 'ModeKey',
    }[kind] ?? 'Note';
  for (let offset = 0; offset < elements.length; offset++) {
    const index =
      (start + direction * offset + elements.length) % elements.length;
    const element = elements[index];
    if (
      element.elementType !== type ||
      (needsFootnote && element.footnoteId == null)
    ) {
      continue;
    }

    const target = { index, type };
    switch (kind) {
      case 'neume':
        return {
          kind,
          target,
          value:
            neumes[variant] === element.quantitativeNeume
              ? neumes[(variant + 1) % neumes.length]
              : neumes[variant],
        };
      case 'fthora':
        return {
          kind,
          target,
          value: element.fthora == null ? 'DiatonicPa_Top' : null,
        };
      case 'lyrics':
        return {
          kind,
          target,
          // The editor can keep a tatweel joining an Arabic lyric.
          value:
            element.lyrics.replaceAll('\u0640', '') === words[0]
              ? words[1]
              : words[0],
        };
      case 'melisma': {
        const marker = rtl ? '\u0640' : directionRoll < 0.5 ? '_' : '-';
        // A word ending in the marker starts a melisma; LTR also covers Greek.
        const word = rtl
          ? words[2]
          : '\u03b1\u03bb\u03bb\u03b7\u03bb\u03bf\u03c5\u03ca';
        return {
          kind,
          target,
          value: element.isMelisma
            ? words[2]
            : variantRoll < 0.5
              ? marker
              : `${word}${marker}`,
        };
      }
      case 'modeKey':
        return {
          kind,
          target,
          value: element.scaleNote === 'Pa' ? 'Ni' : 'Pa',
        };
      case 'insert':
      case 'footnoteBody':
        return { kind, target, value: neumes[variant] };
      case 'footnoteMarker':
        return {
          kind,
          target,
          value:
            editor.score.value.footnotes.find(
              ({ id }) => id === element.footnoteId,
            ).marker === null
              ? '*'
              : null,
        };
      case 'martyria':
      case 'ison':
      case 'bar':
      case 'lineBreak':
      case 'pageBreak':
      case 'delete':
      case 'footnote':
        return { kind, target };
    }

    // An unavailable history operation becomes a real edit.
    return { kind: 'insert', target, value: neumes[variant] };
  }

  if (kind === 'modeKey' || kind === 'martyria') {
    return {
      kind: kind === 'modeKey' ? 'insertModeKey' : 'insertMartyria',
      target: { index: start, type: elements[start].elementType },
    };
  }
  return { kind: 'append', value: neumes[variant] };
}

// Resolves a scripted target from the current layout, so the page-move
// sequence does not depend on fixed staff indices. `lines` lists each page's
// lines as staff index ranges; a negative line counts from the page end.
function resolveTarget(editor, { at, page, line, after = 0 }) {
  const elements = editor.elements.value;
  const lines = [];
  for (const [index, element] of elements.entries()) {
    if (element.page !== page) {
      continue;
    }
    const last = lines.at(-1);
    if (last?.line === element.line) {
      last.end = index;
    } else {
      lines.push({ line: element.line, start: index, end: index });
    }
  }
  const pick = (number) => lines.at(number > 0 ? number - 1 : number);
  const isNote = (index) => elements[index]?.elementType === 'Note';
  let index;
  switch (at) {
    case 'middle': {
      // A note inside the line, so a break there splits a paragraph.
      const { start, end } = pick(line);
      for (let offset = 0; offset <= end - start; offset++) {
        const candidate = start + Math.floor((end - start) / 2) + offset;
        if (
          candidate < end &&
          isNote(candidate) &&
          !elements[candidate].lineBreak
        ) {
          index = candidate;
          break;
        }
      }
      break;
    }
    case 'end':
      index = pick(line).end;
      break;
    case 'pageStart':
      // The first page start after `after` that is a note after a note with
      // no break, so a left bar there transfers to the previous page.
      index = elements.findIndex(
        (element, candidate) =>
          candidate > after &&
          element.page !== elements[candidate - 1].page &&
          isNote(candidate) &&
          isNote(candidate - 1) &&
          !elements[candidate - 1].lineBreak &&
          !elements[candidate - 1].pageBreak,
      );
      if (index < 0) {
        index = undefined;
      }
      break;
  }
  if (index === undefined) {
    throw new Error(`No target for ${JSON.stringify({ at, page, line })}`);
  }
  return { index, type: elements[index].elementType };
}

// Staff indices where a new page starts, and whether that page boundary
// falls between two notes with no explicit break (inside a paragraph).
function pageStarts(editor) {
  const elements = editor.elements.value;
  const starts = [];
  for (let index = 1; index < elements.length; index++) {
    const previous = elements[index - 1];
    if (elements[index].page !== previous.page) {
      starts.push({
        index,
        inParagraph:
          previous.elementType === 'Note' &&
          elements[index].elementType === 'Note' &&
          !previous.lineBreak &&
          !previous.pageBreak,
      });
    }
  }
  return starts;
}

// The notes of the martyriae in every footnote body.
function footnoteMartyriae(editor) {
  return editor.score.value.footnotes.flatMap(({ staff }) =>
    staff.elements
      .filter(({ elementType }) => elementType === 'Martyria')
      .map(({ note, scale, rootSign }) => `${note}/${scale}/${rootSign}`),
  );
}

function isFirstOnPage(editor, index) {
  const elements = editor.elements.value;
  const element = elements[index];
  return element.line === 1 && elements[index - 1]?.page === element.page - 1;
}

async function applyEdit(editor, { kind, target, value }) {
  const test = editor.layoutTest;
  const workspace = editor.selectedWorkspace.value;
  const oracle = window.__neanesLayoutVerify;
  const revision = workspace.contentRevision;
  const layouts = editor.layoutDiagnostics.results;
  layouts.length = 0;
  const describe = (element) =>
    element && {
      id: element.id,
      index: element.index,
      page: element.page,
      line: element.line,
      lyrics: element.lyrics,
      isMelisma: element.isMelisma,
      isMelismaStart: element.isMelismaStart,
    };
  const element = target ? editor.elements.value[target.index] : null;
  if (target && element?.elementType !== target.type) {
    throw new Error(`Expected ${target.type} at staff index ${target.index}`);
  }
  const historyEdit = kind === 'undo' || kind === 'redo';
  const before = describe(historyEdit ? editor.selectedElement.value : element);
  if (!historyEdit) {
    editor.selectedElement.value = element;
  }
  switch (kind) {
    case 'neume':
      test.setEntryMode('Edit');
      test.addQuantitativeNeume(value);
      break;
    case 'fthora':
      test.updateNoteFthora(element, value);
      break;
    case 'lyrics':
    case 'melisma':
      test.updateLyrics(element, value, true);
      break;
    case 'ison':
      test.setIson(element, 'Ison.Ni');
      break;
    case 'bar':
      test.setMeasureBarNote(element, 'MeasureBarRight');
      break;
    case 'barParagraph':
      // Two commands: a line break before the note, then a left bar on it.
      editor.selectedElement.value = editor.elements.value[target.index - 1];
      test.toggleLineBreak(null);
      test.setMeasureBarNote(element, 'MeasureBarRight');
      break;
    case 'lineBreak':
      test.toggleLineBreak(null);
      break;
    case 'pageBreak':
      test.togglePageBreak();
      break;
    case 'insert':
    case 'append':
      if (kind === 'append') {
        workspace.insertAtStart = false;
      }
      test.setEntryMode('Insert');
      test.addQuantitativeNeume(value);
      break;
    case 'delete':
      test.deleteSelectedElement();
      break;
    case 'martyria':
      test.updateMartyria(element, { alignRight: !element.alignRight });
      break;
    case 'insertMartyria':
      test.setEntryMode('Insert');
      test.addAutoMartyria();
      break;
    case 'modeKey':
      test.updateModeKey(element, { scaleNote: value, showAmbitus: true });
      break;
    case 'insertModeKey':
      test.insertModeKeyWithAmbitus();
      break;
    case 'footnote':
      // Adds an empty body, or removes the reference and its body.
      test.toggleFootnote(element);
      break;
    case 'footnoteBody':
      test.appendToFootnote(element.footnoteId, value);
      break;
    case 'footnoteMarker':
      test.setFootnoteMarker(element.footnoteId, value);
      break;
    case 'undo':
    case 'redo':
      test.replayHistory(kind);
      break;
    default:
      throw new Error(`Unknown edit kind: ${kind}`);
  }
  await test.flushRender();
  const state = window.__neanesLayoutVerify;
  const differenceId = state.firstDifference?.elementId;
  return {
    changed: workspace.contentRevision > revision,
    checks: state.checks - oracle.checks,
    layouts: [...layouts],
    difference: state.firstDifference,
    before,
    after: describe(editor.selectedElement.value),
    differenceElement:
      differenceId == null
        ? null
        : describe(
            editor.elements.value.find((entry) => entry.id === differenceId),
          ),
  };
}

async function runSequence(fixture, seed) {
  const app = await createSmokeApp('neanes-layout-random-');
  const trace = { version: 1, fixture: fixture.name, seed, edits: [] };
  const file = path.join(app.directory, `input${path.extname(fixture.file)}`);
  let result;
  let snapshotReady = false;
  try {
    // A replay's saved input already includes its page setup variant.
    const facing = !replay && values.facing;
    if (
      fixture.rtl ||
      facing ||
      fixture.checkIncremental ||
      fixture.openingModeKey ||
      fixture.pageMoves ||
      fixture.footnotes ||
      fixture.melismaLookahead
    ) {
      assert.equal(
        path.extname(fixture.file),
        '.byzx',
        'Page setup variants need a .byzx score',
      );
      const score = JSON.parse(await readFile(fixture.file, 'utf8'));
      if (fixture.rtl) {
        arabicRtlScore(score);
      }
      if (facing) {
        // Unequal inside/outside margins move lines that change page parity.
        score.pageSetup.facingPages = true;
        score.pageSetup.leftMargin = 120;
        score.pageSetup.rightMargin = 72.5;
      }
      if (fixture.pageMoves) {
        // About six pages. Without headers, a page break moves every later
        // line by one page and nothing else; with them, content tops also
        // differ: a tall first page header and taller even page headers.
        const notes = score.staff.elements.filter(
          ({ elementType }) => elementType !== 'Empty',
        );
        score.staff.elements = [...notes, ...notes, ...notes];
      }
      if (fixture.pageMoves === 'headers') {
        Object.assign(score.pageSetup, {
          showHeader: true,
          headerDifferentFirstPage: true,
          headerDifferentOddEven: true,
        });
        for (const [key, height] of [
          ['firstPage', 110],
          ['odd', 20],
          ['even', 70],
        ]) {
          Object.assign(score.headers[key].elements[0], {
            height,
            customHeight: height,
          });
        }
      }
      if (fixture.checkIncremental) {
        score.staff.elements.unshift({
          elementType: 'TextBox',
          content: 'Opening paragraph',
          height: 24,
          customHeight: 24,
        });
      }
      if (fixture.openingModeKey) {
        // Starts the music on Ga instead of the score default.
        score.staff.elements.unshift({
          elementType: 'ModeKey',
          alignment: 'center',
          mode: 3,
          scale: 'Diatonic',
          scaleNote: 'Ga',
          martyria: 'Alpha',
        });
      }
      if (fixture.footnotes) {
        // Reset the context just after the anchor's opening paragraph.
        const firstBreak = score.staff.elements.findIndex(
          ({ lineBreak }) => lineBreak,
        );
        assert.ok(firstBreak >= 0, 'Expected an opening line break');
        score.staff.elements.splice(firstBreak + 1, 0, {
          elementType: 'ModeKey',
          alignment: 'center',
          mode: 1,
          scale: 'Diatonic',
          scaleNote: 'Pa',
          martyria: 'Alpha',
        });
      }
      if (fixture.melismaLookahead) {
        // A melisma before a right-aligned martyria, which ends its
        // paragraph, then a tempo and a continuation note in the next one.
        // The melisma ends at the martyria, so editing the note after the
        // tempo must not change the earlier paragraph.
        const note = (fields) => ({
          elementType: 'Note',
          quantitativeNeume: 'Ison',
          lyrics: 'la',
          ...fields,
        });
        const fillers = Array.from({ length: 4 }, () => note());
        // Paragraphs around it keep the edit below the bulk-edit cutoff.
        const paragraphs = Array.from({ length: 3 }, () => [
          ...fillers,
          note({ lineBreak: true }),
        ]).flat();
        score.staff.elements = [
          ...paragraphs,
          ...fillers,
          note({ lyrics: 'glorified', isMelisma: true, isMelismaStart: true }),
          note({ quantitativeNeume: 'Oligon', lyrics: '', isMelisma: true }),
          { elementType: 'Martyria', auto: true, alignRight: true },
          { elementType: 'Tempo', neume: 'Moderate' },
          note({ quantitativeNeume: 'Oligon', lyrics: '', isMelisma: true }),
          ...fillers,
          note({ lineBreak: true }),
          ...paragraphs,
        ];
        if (fixture.rtl) {
          arabicRtlScore(score);
        }
      }
      await writeFile(file, JSON.stringify(score));
    } else {
      await copyFile(fixture.file, file);
    }
    snapshotReady = true;
    app.start({ appArgs: [process.cwd(), file] });
    const { evaluate } = await app.debugger('renderer');
    await app.ready();
    const inEditor = (fn, ...args) =>
      evaluate(
        `(${fn})(window._editor, ${args.map((arg) => JSON.stringify(arg)).join(', ')})`,
        { timeoutMs: 60_000 },
      );
    const initial = await eventually(
      async () => {
        const status = await evaluate(`({
        file: window._editor?.selectedWorkspace.value.filePath,
        hook: !!window._editor?.layoutTest,
        forceFull: window._editor?.layoutDiagnostics?.forceFull,
        state: window.__neanesLayoutVerify,
      })`);
        assert.equal(status.file, file, 'Awaiting fixture load');
        assert.ok(
          status.hook && status.state?.checks > 0,
          'Build with VITE_LAYOUT_VERIFY_ENABLED=true',
        );
        assert.equal(
          status.forceFull,
          !values.incremental,
          'Build with VITE_LAYOUT_FORCE_FULL=true for full layout or VITE_LAYOUT_FORCE_FULL=false for --incremental',
        );
        return status.state;
      },
      { timeoutMs: 60_000 },
    );
    if (initial.failures > 0) {
      result = { difference: initial.firstDifference };
      throw new Error('Initial layout differs from a fresh full layout');
    }

    const random = createRandom(seed);
    let lastIndex = 0;
    let checks = 0;
    const kinds = {};
    const statuses = {};
    // Reused layouts by the number of paragraphs added at range boundaries.
    const boundaries = {};
    let maxShiftedLines = 0;
    // Layouts whose musical pass walked only the edited mode-key spans.
    const musicalSpans = { layouts: 0, maxElements: 0 };
    let barTarget = null;
    const pageMoves = { later: 0, earlier: 0, parity: 0 };
    const middle = { at: 'middle', page: 1, line: 2 };
    // `again` repeats the edit with that id on the same target, undoing it.
    const pageMoveEdits = [
      // Splits a paragraph on page 1: later lines, including whole
      // paragraphs, move to later pages and the page splits move.
      {
        id: 'split',
        kind: 'lineBreak',
        select: middle,
        expect: ['later', 'split'],
      },
      { kind: 'lineBreak', again: 'split', expect: ['earlier', 'split'] },
      // Pushes the rest of the score by most of a page.
      {
        id: 'push',
        kind: 'pageBreak',
        select: { at: 'end', page: 1, line: 1 },
        expect: ['later', 'parity'],
      },
      // Splits the now single-line page 1, which moves every later line by
      // exactly one page with the same line number (and, without headers,
      // the same top).
      {
        id: 'onePage',
        kind: 'pageBreak',
        select: { at: 'middle', page: 1, line: 1 },
        expect: ['later', 'parity'],
      },
      { kind: 'pageBreak', again: 'onePage', expect: ['earlier', 'parity'] },
      { kind: 'pageBreak', again: 'push', expect: ['earlier', 'parity'] },
      // A left bar on a note that starts both a page and a paragraph
      // transfers to the last line of the previous page. Moving both lines
      // and back re-applies the transfer to re-placed lines; editing the
      // paragraph before it re-prepares the line that takes the bar while
      // the barred line is reused.
      { kind: 'barParagraph', select: { at: 'pageStart' }, bar: true },
      { id: 'barMove', kind: 'lineBreak', select: middle, expect: ['later'] },
      {
        kind: 'lineBreak',
        again: 'barMove',
        expect: ['earlier', 'barAcrossPage'],
      },
      {
        kind: 'ison',
        beforeBar: true,
        expect: ['barAcrossPage'],
        expectReuse: true,
      },
    ].map((edit) => ({
      expectReuse: edit.kind === 'lineBreak' || edit.kind === 'pageBreak',
      ...edit,
    }));
    // A footnote on a page-1 note: an empty body, body notes and a martyria
    // that inherits the anchor's musical context, a context change at the
    // anchor, marker changes, removal and undo.
    const footnoteEdits = [
      { id: 'ref', kind: 'footnote', select: middle },
      { kind: 'footnoteBody', again: 'ref', value: 'Oligon' },
      { kind: 'footnoteBody', again: 'ref', value: 'Martyria' },
      {
        kind: 'fthora',
        again: 'ref',
        value: 'HardChromaticPa_Top',
        expect: ['bodyChanged'],
      },
      { kind: 'footnoteMarker', again: 'ref', value: '*' },
      { kind: 'footnoteMarker', again: 'ref', value: null },
      { kind: 'undo' },
      { kind: 'footnoteBody', again: 'ref', value: 'Apostrophos' },
      { kind: 'undo' },
      { kind: 'footnote', again: 'ref' },
      { kind: 'undo' },
    ].map((edit) => ({ expectReuse: true, ...edit }));
    // The note after the tempo gets a syllable, then is a continuation again.
    const lookahead = { index: 23, type: 'Note' };
    const melismaLookaheadEdits = [
      {
        kind: 'lyrics',
        target: lookahead,
        value: fixture.rtl ? '\u0646\u0627' : 'have',
      },
      { kind: 'undo' },
      { kind: 'redo' },
      { kind: 'undo' },
    ].map((edit) => ({ expectReuse: true, ...edit }));
    const scriptedEdits = fixture.pageMoves
      ? pageMoveEdits
      : fixture.melismaLookahead
        ? melismaLookaheadEdits
        : fixture.footnotes
          ? footnoteEdits
          : fixture.checkIncremental
            ? [
                {
                  kind: 'ison',
                  target: { index: 3, type: 'Note' },
                  expectReuse: true,
                },
                { kind: 'delete', target: { index: 0, type: 'TextBox' } },
              ]
            : fixture.openingModeKey
              ? // The music after the deleted key starts from the score default.
                [{ kind: 'delete', target: { index: 0, type: 'ModeKey' } }]
              : null;
    const edits = replay?.edits ?? scriptedEdits;
    const count = () => edits?.length ?? steps;
    for (let i = 0; i < count(); i++) {
      result = null;
      const edit =
        edits?.[i] ??
        (await inEditor(
          chooseEdit,
          Array.from({ length: 5 }, random),
          lastIndex,
        ));
      const template = edit.bar && edit.select ? { ...edit } : null;
      if (edit.again) {
        edit.target = trace.edits.find(({ id }) => id === edit.again).target;
        delete edit.again;
      } else if (edit.beforeBar) {
        edit.target = { index: barTarget - 1, type: 'Note' };
        delete edit.beforeBar;
      } else if (edit.select) {
        // Replays keep the resolved target.
        edit.target = await inEditor(resolveTarget, edit.select);
        delete edit.select;
      }
      if (edit.bar) {
        barTarget = edit.target.index;
      }
      const startsBefore = edit.expect ? await inEditor(pageStarts) : null;
      const bodiesBefore = edit.expect
        ? await inEditor(footnoteMartyriae)
        : null;
      trace.edits.push(edit);
      result = await inEditor(applyEdit, edit);
      assert.equal(
        result.difference,
        null,
        'Layout differs from a fresh full layout',
      );
      assert.ok(result.changed, 'Edit did not change score content');
      assert.ok(result.checks > 0, 'Edit did not run a verified layout');
      assert.ok(result.layouts.length > 0, 'Missing layout diagnostics');
      if (template && !(await inEditor(isFirstOnPage, barTarget))) {
        // The new break or bar re-broke the page, so the note no longer
        // starts it. Undo both and try the next page start.
        edits.splice(
          i + 1,
          0,
          { kind: 'undo' },
          { kind: 'undo' },
          { ...template, select: { at: 'pageStart', after: barTarget } },
        );
      }
      for (const expectation of edit.expect ?? []) {
        const total = (field) =>
          result.layouts.reduce((sum, layout) => sum + layout[field], 0);
        switch (expectation) {
          case 'later':
            assert.ok(
              total('linesToLaterPage') > 0,
              `Expected lines moved to a later page: ${JSON.stringify(result.layouts)}`,
            );
            break;
          case 'earlier':
            assert.ok(
              total('linesToEarlierPage') > 0,
              `Expected lines moved to an earlier page: ${JSON.stringify(result.layouts)}`,
            );
            break;
          case 'parity':
            assert.ok(
              total('parityChangedLines') > 0,
              `Expected lines that changed page parity: ${JSON.stringify(result.layouts)}`,
            );
            break;
          case 'split': {
            const startsAfter = await inEditor(pageStarts);
            assert.notDeepEqual(
              startsAfter,
              startsBefore,
              'Expected page splits to move',
            );
            assert.ok(
              startsAfter.some(({ inParagraph }) => inParagraph),
              `Expected a page split inside a paragraph: ${JSON.stringify(startsAfter)}`,
            );
            break;
          }
          case 'bodyChanged': {
            const bodiesAfter = await inEditor(footnoteMartyriae);
            assert.ok(
              bodiesAfter.length > 0,
              'Expected a martyria in a footnote body',
            );
            assert.notDeepEqual(
              bodiesAfter,
              bodiesBefore,
              'Expected the footnote body to follow the anchor context',
            );
            break;
          }
          case 'barAcrossPage':
            assert.ok(
              await inEditor(isFirstOnPage, barTarget),
              'Expected the barred note to start a page',
            );
            break;
          default:
            throw new Error(`Unknown expectation: ${expectation}`);
        }
      }
      if (edit.expectReuse) {
        assert.ok(
          result.layouts.some(
            ({ status, prepared, totalParagraphs }) =>
              status === 'reused' && prepared < totalParagraphs,
          ),
          `Expected paragraph reuse for the ${edit.kind} edit: ${JSON.stringify(result.layouts)}`,
        );
      }
      for (const {
        status,
        boundaryParagraphs,
        shiftedLines,
        linesToLaterPage,
        linesToEarlierPage,
        parityChangedLines,
        musicalSpanElements,
      } of result.layouts) {
        statuses[status] = (statuses[status] ?? 0) + 1;
        if (musicalSpanElements != null) {
          musicalSpans.layouts++;
          musicalSpans.maxElements = Math.max(
            musicalSpans.maxElements,
            musicalSpanElements,
          );
        }
        if (status === 'reused') {
          boundaries[boundaryParagraphs] =
            (boundaries[boundaryParagraphs] ?? 0) + 1;
          maxShiftedLines = Math.max(maxShiftedLines, shiftedLines);
          // Layouts that moved reused lines to a later or earlier page.
          pageMoves.later += linesToLaterPage > 0 ? 1 : 0;
          pageMoves.earlier += linesToEarlierPage > 0 ? 1 : 0;
          pageMoves.parity += parityChangedLines > 0 ? 1 : 0;
        }
      }
      checks += result.checks;
      kinds[edit.kind] = (kinds[edit.kind] ?? 0) + 1;
      lastIndex = result.after?.index ?? result.before?.index ?? lastIndex;
      if ((i + 1) % 250 === 0 && i + 1 < count()) {
        console.log(
          `${fixture.name} seed=${seed}: ${i + 1}/${count()} edits checked`,
        );
      }
    }
    console.log(
      `PASS ${fixture.name} seed=${seed}: ${count()} edits, ${checks} checks ${JSON.stringify(kinds)}; layouts ${JSON.stringify(statuses)}; boundary paragraphs ${JSON.stringify(boundaries)}; max shifted lines ${maxShiftedLines}; layouts with page moves ${JSON.stringify(pageMoves)}; musical span passes ${JSON.stringify(musicalSpans)}`,
    );
    return true;
  } catch (error) {
    console.error(
      `FAIL ${fixture.name} seed=${seed} step=${trace.edits.length}: ${error.message}`,
    );
    if (result?.difference) {
      console.error(JSON.stringify(result));
    }
    if (snapshotReady) {
      const output = await mkdtemp(
        path.join(tmpdir(), 'neanes-layout-failure-'),
      );
      const score = path.basename(file);
      await copyFile(file, path.join(output, score));
      const report = path.join(output, 'failure.json');
      await writeFile(
        report,
        JSON.stringify(
          { ...trace, score, error: error.message, result },
          null,
          2,
        ) + '\n',
      );
      console.error(
        `Replay: node tests/integration/layout/random-edits.mjs --skip-build ${values.incremental ? '--incremental ' : ''}--replay "${report}"`,
      );
    }
    return false;
  } finally {
    await app.close();
  }
}

if (values.incremental && !replay) {
  for (const scripted of [
    { name: 'opening-paragraph', file: fixture, checkIncremental: true },
    { name: 'opening-mode-key', file: fixture, openingModeKey: true },
    { name: 'page-moves', file: fixture, pageMoves: 'plain' },
    { name: 'footnotes', file: fixture, footnotes: true },
    { name: 'melisma-lookahead', file: fixture, melismaLookahead: true },
    {
      name: 'melisma-lookahead-rtl',
      file: fixture,
      melismaLookahead: true,
      rtl: true,
    },
    { name: 'footnotes-rtl', file: fixture, footnotes: true, rtl: true },
    { name: 'page-moves-headers', file: fixture, pageMoves: 'headers' },
    { name: 'page-moves-rtl', file: fixture, pageMoves: 'plain', rtl: true },
    {
      name: 'page-moves-headers-rtl',
      file: fixture,
      pageMoves: 'headers',
      rtl: true,
    },
  ].filter(
    ({ name }) =>
      values.sequence === undefined || values.sequence.includes(name),
  )) {
    if (!(await runSequence(scripted, 1))) {
      process.exitCode = 1;
    }
  }
}

for (const score of values.sequence === undefined ? fixtures : []) {
  for (const seed of replay ? [replay.seed] : seeds) {
    if (!(await runSequence(score, seed))) {
      process.exitCode = 1;
    }
  }
}
