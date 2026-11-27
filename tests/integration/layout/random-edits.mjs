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
  },
});

if (values.help) {
  console.log(
    'Usage: node tests/integration/layout/random-edits.mjs [--skip-build] [--incremental] [--facing]\n' +
      '       [--seed <uint32>] [--steps <count>] [--score <file.byz|file.byzx>]\n' +
      '       or [--replay <failure.json>]. Repeat --seed or --score for a matrix.',
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
    'undo',
    'redo',
  ];
  const kind = editKinds[Math.floor(kindRoll * editKinds.length)];
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
    if (element.elementType !== type) {
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
        return { kind, target, value: neumes[variant] };
      case 'martyria':
      case 'ison':
      case 'bar':
      case 'lineBreak':
      case 'pageBreak':
      case 'delete':
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
    if (fixture.rtl || facing || fixture.checkIncremental) {
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
      if (fixture.checkIncremental) {
        score.staff.elements.unshift({
          elementType: 'TextBox',
          content: 'Opening paragraph',
          height: 24,
          customHeight: 24,
        });
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
    const scriptedEdits = fixture.checkIncremental
      ? [
          {
            kind: 'ison',
            target: { index: 3, type: 'Note' },
            expectReuse: true,
          },
          { kind: 'delete', target: { index: 0, type: 'TextBox' } },
        ]
      : null;
    const edits = replay?.edits ?? scriptedEdits;
    const count = edits?.length ?? steps;
    for (let i = 0; i < count; i++) {
      result = null;
      const edit =
        edits?.[i] ??
        (await inEditor(
          chooseEdit,
          Array.from({ length: 5 }, random),
          lastIndex,
        ));
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
      if (edit.expectReuse) {
        assert.ok(
          result.layouts.some(
            ({ status, prepared, totalParagraphs }) =>
              status === 'reused' && prepared < totalParagraphs,
          ),
          `Expected paragraph reuse for the ison edit: ${JSON.stringify(result.layouts)}`,
        );
      }
      for (const { status } of result.layouts) {
        statuses[status] = (statuses[status] ?? 0) + 1;
      }
      checks += result.checks;
      kinds[edit.kind] = (kinds[edit.kind] ?? 0) + 1;
      lastIndex = result.after?.index ?? result.before?.index ?? lastIndex;
      if ((i + 1) % 250 === 0 && i + 1 < count) {
        console.log(
          `${fixture.name} seed=${seed}: ${i + 1}/${count} edits checked`,
        );
      }
    }
    console.log(
      `PASS ${fixture.name} seed=${seed}: ${count} edits, ${checks} checks ${JSON.stringify(kinds)}; layouts ${JSON.stringify(statuses)}`,
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
  const passed = await runSequence(
    {
      name: 'opening-paragraph',
      file: fixture,
      checkIncremental: true,
    },
    1,
  );
  if (!passed) {
    process.exitCode = 1;
  }
}

for (const score of fixtures) {
  for (const seed of replay ? [replay.seed] : seeds) {
    if (!(await runSequence(score, seed))) {
      process.exitCode = 1;
    }
  }
}
