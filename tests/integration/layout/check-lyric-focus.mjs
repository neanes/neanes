// Check focus and caret after a lyric edit re-breaks the first paragraph.
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
  const target = await eventually(async () => {
    const result = await evaluate(`(() => {
      const e = window._editor;
      if (e?.selectedWorkspace.value.filePath !== ${JSON.stringify(score)}) {
        return null;
      }
      const elements = e.elements.value;
      const index = elements.findIndex(
        (item, i) =>
          item.elementType === 'Note' &&
          item.page === 1 &&
          elements[i - 1]?.line === item.line &&
          elements[i + 1]?.line === item.line &&
          elements[i + 2]?.line === item.line,
      );
      return {
        index,
        id: elements[index].id,
        line: elements[index].line,
        nextLine: elements[index + 1].line,
        laterPlacement: [elements.at(-1).page, elements.at(-1).line, elements.at(-1).y],
      };
    })()`);
    assert.ok(result, 'Score has not opened');
    return result;
  });
  await eventually(async () => {
    const focused = await evaluate(`(() => {
      const note = document.getElementById('element-${target.id}');
      const lyric = note?.querySelector('.lyrics[contenteditable="plaintext-only"]');
      if (!lyric) {
        note?.scrollIntoView({ block: 'center' });
        return false;
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
  // Space commits the lyric and moves to the next note's lyric.
  await send('Input.insertText', { text });
  await press('Space', ' ', 32);
  const state = () =>
    evaluate(`(() => {
      const e = window._editor;
      const elements = e.elements.value;
      const active = document.activeElement;
      return {
        laterPlacement: [elements.at(-1).page, elements.at(-1).line, elements.at(-1).y],
        lyrics: elements[${target.index}].lyrics,
        line: elements[${target.index}].line,
        next: { id: elements[${target.index + 1}].id, line: elements[${target.index + 1}].line, lyrics: elements[${target.index + 1}].lyrics },
        focused: active?.closest('.element-box')?.id ?? null,
        activeText: active?.innerText ?? null,
      };
    })()`);
  const committed = await eventually(async () => {
    const result = await state();
    assert.ok(result.lyrics.endsWith(text), 'Lyric was not committed');
    return result;
  });
  console.log(JSON.stringify({ target, committed }));
  assert.notDeepEqual(
    committed.laterPlacement,
    target.laterPlacement,
    'The edit did not move later notation',
  );
  assert.equal(
    committed.focused,
    `element-${committed.next.id}`,
    'Focus did not move to the next lyric',
  );
  await send('Input.insertText', { text: 'abc' });
  await press('Space', ' ', 32);
  const typed = await eventually(async () => {
    const result = await state();
    assert.ok(result.next.lyrics.endsWith('abc'), 'Next lyric not typed');
    return result;
  });
  console.log(JSON.stringify(typed.next));
  console.log('PASS lyric focus kept across re-broken and shifted lines');
} finally {
  await app.close();
}
