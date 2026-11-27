// Check focus and caret after a lyric edit re-breaks the first paragraph:
// once where later lines only move, and once where the next lyric's own line
// is replaced by a line that starts with another element.
import assert from 'node:assert/strict';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from '../mcp/smokeApp.mjs';
import { eventually } from '../mcp/smokePolling.mjs';

const [scorePath] = process.argv.slice(2);
assert.ok(scorePath, 'Usage: check-lyric-focus.mjs score.byz');
const source = path.resolve(scorePath);
const app = await createSmokeApp('neanes-layout-lyric-focus-');
try {
  const score = path.join(app.directory, path.basename(source));
  await copyFile(source, score);
  app.start({ appArgs: [process.cwd(), score] });
  const { evaluate, send } = await app.debugger('renderer');
  await app.ready();
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await eventually(async () => {
    const opened = await evaluate(
      `window._editor?.selectedWorkspace.value.filePath === ${JSON.stringify(score)}`,
    );
    assert.ok(opened, 'Score has not opened');
  });
  const press = (code, key, windowsVirtualKeyCode) =>
    Promise.all(
      ['rawKeyDown', 'keyUp'].map((type) =>
        send('Input.dispatchKeyEvent', {
          type,
          code,
          key,
          windowsVirtualKeyCode,
        }),
      ),
    );

  // `remount`: the next note ends its line, so widening the target's lyric
  // carries both notes to a line that starts with the target.
  for (const remount of [false, true]) {
    const target = await evaluate(`(() => {
      const elements = window._editor.elements.value;
      const index = elements.findIndex(
        (item, i) =>
          item.elementType === 'Note' &&
          elements[i + 1]?.elementType === 'Note' &&
          item.page === 1 &&
          elements[i - 1]?.line === item.line &&
          elements[i + 1].line === item.line &&
          (${remount}
            ? elements[i + 2]?.line !== item.line
            : elements[i + 2]?.line === item.line),
      );
      return {
        index,
        id: elements[index]?.id,
        laterPlacement: [elements.at(-1).page, elements.at(-1).line, elements.at(-1).y],
      };
    })()`);
    assert.ok(target.index >= 0, `No target note (remount: ${remount})`);
    await eventually(async () => {
      const focused = await evaluate(`(() => {
        const note = document.getElementById('element-${target.id}');
        const lyric = note?.querySelector('.lyrics[contenteditable="plaintext-only"]');
        if (!lyric) {
          note?.scrollIntoView({ block: 'center' });
          return false;
        }
        // Mark every mounted line wrapper to tell kept wrappers from new ones.
        for (const line of document.querySelectorAll('.line')) {
          line.dataset.focusProbe = '1';
        }
        lyric.focus();
        const range = document.createRange();
        range.selectNodeContents(lyric);
        range.collapse(false);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
        return document.activeElement === lyric;
      })()`);
      assert.ok(focused, 'Lyric did not take focus');
    });
    const text = 'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww';
    // Space commits the lyric and moves to the next note's lyric. Lyric
    // navigation is throttled, so leave time after the previous case.
    await new Promise((resolve) => setTimeout(resolve, 500));
    await send('Input.insertText', { text });
    await press('Space', ' ', 32);
    const state = () =>
      evaluate(`(() => {
        const elements = window._editor.elements.value;
        const active = document.activeElement;
        const lines = [...document.querySelectorAll('.line')];
        const next = elements[${target.index + 1}];
        return {
          laterPlacement: [elements.at(-1).page, elements.at(-1).line, elements.at(-1).y],
          lyrics: elements[${target.index}].lyrics,
          next: {
            id: next.id,
            lyrics: next.lyrics,
            firstOnLine: elements.find(
              (item) => item.page === next.page && item.line === next.line,
            ).id,
            lineKept:
              document.getElementById('element-' + next.id)?.closest('.line')
                ?.dataset.focusProbe === '1',
          },
          keptLines: lines.filter((line) => line.dataset.focusProbe === '1').length,
          newLines: lines.filter((line) => line.dataset.focusProbe !== '1').length,
          focused: active?.closest('.element-box')?.id ?? null,
        };
      })()`);
    const committed = await eventually(async () => {
      const result = await state();
      assert.ok(result.lyrics.endsWith(text), 'Lyric was not committed');
      return result;
    });
    console.log(JSON.stringify({ remount, target, committed }));
    assert.notDeepEqual(
      committed.laterPlacement,
      target.laterPlacement,
      'The edit did not move later notation',
    );
    assert.ok(committed.keptLines > 0, 'No moved line kept its wrapper');
    if (remount) {
      assert.equal(
        committed.next.firstOnLine,
        target.id,
        "The next lyric's line does not start with the edited note",
      );
      assert.equal(
        committed.next.lineKept,
        false,
        "The next lyric's line was not replaced",
      );
    }
    // Known issue, also at 22fac9a9 before lines were keyed by element:
    // when the edited note wraps to a new line, focus stays in its lyric
    // instead of moving on. Require that focus survives and typing lands.
    const movedOn = committed.focused === `element-${committed.next.id}`;
    if (remount && !movedOn) {
      assert.equal(
        committed.focused,
        `element-${target.id}`,
        'Focus left the edited and next lyrics',
      );
      console.log('WARN focus stayed on the edited lyric after it wrapped');
    } else {
      assert.ok(movedOn, 'Focus did not move to the next lyric');
    }
    await send('Input.insertText', { text: 'abc' });
    await press('Space', ' ', 32);
    const typed = await eventually(async () => {
      const result = await state();
      assert.ok(
        (movedOn ? result.next.lyrics : result.lyrics).endsWith('abc'),
        'Focused lyric not typed',
      );
      return result;
    });
    console.log(JSON.stringify(typed.next));
  }
  console.log(
    'PASS lyric focus kept across re-broken, shifted and replaced lines',
  );
} finally {
  await app.close();
}
