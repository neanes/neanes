// Drives real editor input against a build with VITE_LAYOUT_VERIFY_ENABLED and
// fails if any interactive layout differs from a fresh full layout.
//
// Usage: node tests/integration/layout/verify-edits.mjs [--skip-build]
//        [--only <fixture name>] [--list]
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const committedFixture = path.join(here, 'fixtures', 'verify-layout.byzx');
const scrollTest =
  process.env.NEANES_LAYOUT_VERIFY_SCROLL_TEST ??
  path.resolve(process.cwd(), '..', '..', '..', 'scroll-test.byz');
const generatedTypes = [
  'Gorgon',
  'FthoraTop',
  'FthoraBottom',
  'Accidentals',
  'Measures',
  'Ison',
  'Random',
  'DropCaps',
];

const argv = process.argv.slice(2);
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;

const fixtures = [
  { name: 'scroll-test', file: scrollTest, copy: true },
  { name: 'verify-layout', file: committedFixture, copy: true },
  { name: 'verify-layout-rtl', file: committedFixture, rtl: true },
  ...generatedTypes.map((type) => ({ name: `generated-${type}`, type })),
];

if (argv.includes('--list')) {
  for (const fixture of fixtures) {
    console.log(fixture.name);
  }
  process.exit(0);
}

if (!argv.includes('--skip-build')) {
  const build = spawnSync('npx', ['vite', 'build'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_LAYOUT_VERIFY_ENABLED: 'true' },
  });
  assert.equal(build.status, 0, 'vite build failed');
}

const work = await mkdtemp(path.join(tmpdir(), 'neanes-layout-verify-'));

async function prepareFile(fixture) {
  if (fixture.type) {
    return null;
  }
  if (!existsSync(fixture.file)) {
    return undefined;
  }
  const target = path.join(
    work,
    `${fixture.name}${path.extname(fixture.file)}`,
  );
  if (fixture.rtl) {
    const score = JSON.parse(await readFile(fixture.file, 'utf8'));
    score.pageSetup.melkiteRtl = true;
    await writeFile(target, JSON.stringify(score));
  } else {
    await copyFile(fixture.file, target);
  }
  return target;
}

function createDriver(socket, main) {
  const { send, evaluate } = socket;
  const editor = (expression) =>
    evaluate(`(() => { const e = window._editor; ${expression} })()`);

  async function frame() {
    await evaluate(
      'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
    );
  }

  async function key(code, { key: keyName, text, modifiers = 0 } = {}) {
    const keyValue =
      keyName ?? (code.startsWith('Key') ? code.slice(3).toLowerCase() : code);
    await send('Input.dispatchKeyEvent', {
      type: text ? 'keyDown' : 'rawKeyDown',
      code,
      key: keyValue,
      text,
      modifiers,
      windowsVirtualKeyCode:
        keyCodes[code] ?? keyValue.toUpperCase().charCodeAt(0),
    });
    await send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      code,
      key: keyValue,
      modifiers,
      windowsVirtualKeyCode:
        keyCodes[code] ?? keyValue.toUpperCase().charCodeAt(0),
    });
  }

  async function clickAt(point, clickCount = 1) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', {
        type,
        ...point,
        button: 'left',
        clickCount,
      });
    }
  }

  // Click the center of the first element matching an expression that
  // returns a DOM element.
  async function click(elementExpression, label) {
    const point = await eventually(async () => {
      const result = await evaluate(`(() => {
        const node = ${elementExpression};
        if (!node) return null;
        node.scrollIntoView({ block: 'center', inline: 'center' });
        const r = node.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      })()`);
      assert.ok(result, `Could not find ${label}`);
      return result;
    });
    await frame();
    // Measure again after scrolling settles.
    const settled = await evaluate(`(() => {
      const r = (${elementExpression}).getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`);
    await clickAt(settled ?? point);
  }

  async function verifyState() {
    return evaluate('window.__neanesLayoutVerify ?? null');
  }

  let lastChecks = 0;

  // Run one edit and require at least one new verified layout without a
  // difference.
  async function edit(label, action) {
    const before = (await verifyState())?.checks ?? 0;
    await action();
    let state;
    try {
      state = await eventually(
        async () => {
          const current = await verifyState();
          assert.ok(
            current && current.checks > before,
            `${label}: no interactive layout ran`,
          );
          return current;
        },
        { timeoutMs: 10_000, intervalMs: 50 },
      );
    } catch (error) {
      throw new Error(`${label}: ${error.message}`);
    }
    // Let debounced follow-up layouts run as well.
    await frame();
    await delay(400);
    await frame();
    state = await verifyState();
    if (state.failures > 0) {
      throw new Error(
        `${label}: layout differs from a full layout: ${JSON.stringify(state.firstDifference)}`,
      );
    }
    console.log(`  ok ${label} (${state.checks - before} checks)`);
    lastChecks = state.checks;
  }

  async function select(indexExpression) {
    await editor(`
      const elements = e.elements.value;
      const index = ${indexExpression};
      e.selectedElement.value = elements[Math.max(0, Math.min(index, elements.length - 1))];
    `);
    await frame();
  }

  async function entryMode() {
    return editor('return e.selectedWorkspace.value.entryMode;');
  }

  async function setInsertMode() {
    for (let attempt = 0; attempt < 3; attempt++) {
      if ((await entryMode()) === 'Insert') {
        return;
      }
      await key('KeyI', { modifiers: CTRL });
      await frame();
    }
    assert.equal(
      await entryMode(),
      'Insert',
      'Could not switch to Insert mode',
    );
  }

  async function elementCount() {
    return editor('return e.elements.value.length;');
  }

  async function menu(channel, ...args) {
    await main(
      `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('index.html')).webContents.send(${[
        channel,
        ...args,
      ]
        .map((value) => JSON.stringify(value))
        .join(',')})`,
    );
  }

  return {
    evaluate,
    editor,
    key,
    click,
    clickAt,
    frame,
    edit,
    select,
    setInsertMode,
    elementCount,
    menu,
    verifyState,
    get lastChecks() {
      return lastChecks;
    },
  };
}

const CTRL = 2;
const SHIFT = 8;
const keyCodes = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Escape: 27,
  Delete: 46,
};

async function runEdits(driver) {
  const { editor, key, click, edit, select, setInsertMode, elementCount } =
    driver;
  const noteIndex = (which) => `(() => {
    const elements = e.elements.value;
    const notes = elements.map((x, i) => [x, i]).filter(([x]) => x.elementType === 'Note');
    if (notes.length === 0) return 0;
    const pick = ${which};
    return notes[Math.max(0, Math.min(notes.length - 1, pick(notes.length)))][1];
  })()`;
  const selectedNote = () =>
    editor(
      `const s = e.selectedElement.value; return s && { type: s.elementType, gorgon: s.gorgonNeume ?? null, lineBreak: s.lineBreak, lyrics: s.lyrics ?? null, alignRight: s.alignRight ?? null };`,
    );

  // Gorgon on a note in the middle of the score. Prefer a plain neume that
  // accepts a gorgon; random fixtures contain neumes that do not.
  const gorgonIndex = await editor(`
    const elements = e.elements.value;
    const plain = elements.map((x, i) => [x, i]).filter(([x]) => x.elementType === 'Note' && ['Oligon', 'Ison', 'Apostrophos'].includes(x.quantitativeNeume));
    return plain.length ? plain[Math.floor(plain.length / 2)][1] : ${noteIndex('(n) => Math.floor(n / 2)')};
  `);
  await select(String(gorgonIndex));
  assert.equal((await selectedNote()).type, 'Note');
  const gorgonBefore = (await selectedNote()).gorgon;
  await edit('toggle gorgon', () => key('KeyG'));
  assert.notEqual(
    (await selectedNote()).gorgon,
    gorgonBefore,
    'Gorgon did not change',
  );
  await edit('toggle gorgon back', () => key('KeyG'));

  // Insert at the start, middle and end.
  await setInsertMode();
  for (const [label, position] of [
    ['start', noteIndex('() => 0')],
    ['middle', noteIndex('(n) => Math.floor(n / 2)')],
    ['end', noteIndex('(n) => n - 1')],
  ]) {
    await select(position);
    const before = await elementCount();
    await edit(`insert neume at ${label}`, () => key('KeyK'));
    assert.equal(await elementCount(), before + 1, `Insert at ${label} failed`);
    await edit(`insert second neume at ${label}`, () => key('KeyK'));
    const afterInsert = await elementCount();
    await edit(`delete at ${label}`, () => key('Backspace'));
    assert.equal(
      await elementCount(),
      afterInsert - 1,
      `Delete at ${label} failed`,
    );
  }

  // Undo and redo.
  const beforeUndo = await elementCount();
  await edit('undo', () => key('KeyZ', { modifiers: CTRL }));
  assert.notEqual(
    await elementCount(),
    beforeUndo,
    'Undo did not change the score',
  );
  await edit('redo', () =>
    driver
      .evaluate("navigator.platform.startsWith('Mac')")
      .then((mac) =>
        mac
          ? key('KeyZ', { modifiers: CTRL | SHIFT })
          : key('KeyY', { modifiers: CTRL }),
      ),
  );
  assert.equal(
    await elementCount(),
    beforeUndo,
    'Redo did not restore the score',
  );

  // Commit lyrics on a visible note.
  const lyricIndex = await editor(`return ${noteIndex('() => 1')};`);
  await select(String(lyricIndex));
  await click(
    `(() => { const s = window._editor.selectedElement.value; const page = document.querySelectorAll('.page')[s.page - 1]; return [...(page?.querySelectorAll('.neume-box .lyrics') ?? [])].find((n) => n.closest('.neume-box').querySelector('.selected')) ?? page?.querySelector('.neume-box .lyrics'); })()`,
    'lyrics of the selected note',
  );
  await eventually(async () =>
    assert.ok(
      await driver.evaluate(
        "document.activeElement?.isContentEditable || document.activeElement?.tagName === 'INPUT'",
      ),
      'Lyrics did not take focus',
    ),
  );
  await driver.evaluate(
    '(() => { const n = document.activeElement; const r = document.createRange(); r.selectNodeContents(n); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()',
  );
  await edit('commit lyrics', async () => {
    for (const character of 'καλλιφωνότατα') {
      await driver.key('KeyA', { key: character, text: character });
    }
    await key('Tab', { key: 'Tab' });
  });
  assert.ok(
    await editor(
      "return e.elements.value.some((x) => x.lyrics === 'καλλιφωνότατα');",
    ),
    'Lyrics were not committed',
  );
  await key('Escape', { key: 'Escape' });
  await driver.evaluate('document.activeElement?.blur()');

  // Toggle a line break from the toolbar on a note in the middle.
  await select(noteIndex('(n) => Math.floor(n / 3)'));
  const lineBreakButton =
    "document.querySelector('.toolbar-rest button.toolbar-icon')";
  const lineBreakBefore = (await selectedNote()).lineBreak;
  await edit('toggle line break', () =>
    click(lineBreakButton, 'line break button'),
  );
  assert.notEqual(
    (await selectedNote()).lineBreak,
    lineBreakBefore,
    'Line break did not change',
  );
  await edit('toggle line break back', () =>
    click(lineBreakButton, 'line break button'),
  );

  // Edit a martyria: toggle right alignment from its toolbar.
  const martyriaIndex = await editor(
    "const elements = e.elements.value; const all = elements.map((x, i) => [x, i]).filter(([x]) => x.elementType === 'Martyria'); return all.length ? all[Math.floor(all.length / 2)][1] : -1;",
  );
  if (martyriaIndex < 0) {
    // Insert one with the martyria key so every fixture edits a martyria.
    await select(noteIndex('(n) => Math.floor(n / 2)'));
    await edit('insert martyria', () => key('KeyY'));
  } else {
    await select(String(martyriaIndex));
  }
  assert.equal((await selectedNote()).type, 'Martyria');
  const alignRightButton =
    "[...document.querySelectorAll('button[aria-label]')].find((b) => b.getAttribute('aria-label').startsWith('Align Right'))";
  const alignBefore = (await selectedNote()).alignRight;
  await edit('toggle martyria right alignment', () =>
    click(alignRightButton, 'martyria align right button'),
  );
  assert.notEqual(
    (await selectedNote()).alignRight,
    alignBefore,
    'Martyria did not change',
  );
  await edit('toggle martyria right alignment back', () =>
    click(alignRightButton, 'martyria align right button'),
  );

  // Page setup: change the neume spacing in the dialog.
  const pageSetup = () =>
    editor('return JSON.stringify(e.score.value.pageSetup);');
  const pageSetupBefore = await pageSetup();
  await driver.menu('FileMenuPageSetup');
  const spacing = "document.querySelector('#page-setup-dialog-neume-spacing')";
  await eventually(async () =>
    assert.ok(
      await driver.evaluate("!!document.querySelector('#page-setup-form')"),
      'Page setup did not open',
    ),
  );
  await click(
    "[...document.querySelectorAll('[role=tab]')].find((tab) => tab.getAttribute('aria-controls') && tab.id.endsWith('spacing')) ?? document.querySelectorAll('[role=tab]')[2]",
    'spacing tab',
  );
  await eventually(async () =>
    assert.ok(
      await driver.evaluate(`!!${spacing}`),
      'Spacing tab did not open',
    ),
  );
  await click(spacing, 'neume spacing input');
  await driver.evaluate(`${spacing}.select()`);
  const current = Number(await driver.evaluate(`${spacing}.value`));
  const next = String(Math.round((current + 0.5) * 100) / 100);
  for (const character of next) {
    await key(character === '.' ? 'Period' : `Digit${character}`, {
      key: character,
      text: character,
    });
  }
  await key('Tab', { key: 'Tab' });
  await edit('change page setup', () =>
    click(
      "document.querySelector('button[type=submit][form=page-setup-form]')",
      'page setup update button',
    ),
  );
  assert.notEqual(
    await pageSetup(),
    pageSetupBefore,
    'Page setup did not change',
  );
  await edit('undo page setup', () => key('KeyZ', { modifiers: CTRL }));
  assert.equal(await pageSetup(), pageSetupBefore, 'Page setup undo failed');
}

let failures = 0;
const selected = fixtures.filter(
  (fixture) => only === null || fixture.name === only,
);
assert.ok(selected.length > 0, `No fixture named ${only}`);
try {
  for (const fixture of selected) {
    const file = await prepareFile(fixture);
    if (file === undefined) {
      console.log(`SKIP ${fixture.name}: ${fixture.file} does not exist`);
      continue;
    }
    console.log(`${fixture.name}`);
    const app = await createSmokeApp('neanes-layout-verify-');
    try {
      app.start({
        appArgs: file === null ? [process.cwd()] : [process.cwd(), file],
        args: ['--remote-debugging-port=0', '--inspect=0'],
      });
      const socket = await app.debugger('renderer');
      const { evaluate: main } = await app.debugger('main');
      await app.ready();
      await socket.send('Emulation.setFocusEmulationEnabled', {
        enabled: true,
      });
      const driver = createDriver(socket, main);
      if (fixture.type) {
        await driver.menu('GenerateTestFile', fixture.type);
      }
      const expectedName = file === null ? null : path.basename(file);
      await eventually(
        async () => {
          const state = await driver.editor(
            'return { path: e.selectedWorkspace.value.filePath, count: e.elements.value.length, loading: document.querySelector(".page") === null };',
          );
          assert.ok(
            !state.loading && state.count > 1,
            'Document is not loaded',
          );
          if (expectedName !== null) {
            assert.ok(
              state.path?.endsWith(expectedName),
              `Opened ${state.path}`,
            );
          }
        },
        { timeoutMs: 60_000, intervalMs: 200 },
      );
      // Let text box heights and fonts settle before the first edit.
      await delay(1000);
      const initial = await driver.verifyState();
      if (initial?.failures) {
        throw new Error(
          `initial layout differs from a full layout: ${JSON.stringify(initial.firstDifference)}`,
        );
      }
      await runEdits(driver);
      const final = await driver.verifyState();
      console.log(`PASS ${fixture.name}: ${final.checks} verified layouts`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${fixture.name}: ${error.stack ?? error}`);
      const errors = app
        .log()
        .split('\n')
        .filter((line) => line.includes('Layout verification failed'))
        .slice(0, 3);
      if (errors.length) {
        console.error(errors.join('\n'));
      }
    } finally {
      await app.close();
    }
  }
} finally {
  await rm(work, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`${failures} fixture(s) failed`);
  process.exit(1);
}
console.log('All fixtures passed.');
