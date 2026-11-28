// Check focus and caret after a lyric edit re-breaks a paragraph: once where
// later lines only move, once where the next lyric's own line is replaced by
// a line that starts with another element, and once where the edited and next
// notes stay on one line but that line's wrapper, and so the edited lyric's
// control, is replaced.
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

  // Focus the note's lyric with the caret at its end, and record the lyric
  // control and every mounted line wrapper, keyed by the line's first element.
  const focusLyric = (id) =>
    eventually(async () => {
      const focused = await evaluate(`(() => {
        const note = document.getElementById('element-${id}');
        const lyric = note?.querySelector('.lyrics[contenteditable="plaintext-only"]');
        if (!lyric) {
          note?.scrollIntoView({ block: 'center' });
          return false;
        }
        const elements = window._editor.elements.value;
        const lines = new Map();
        for (const wrapper of document.querySelectorAll('.line')) {
          const id = wrapper.querySelector('.element-box')?.id.slice('element-'.length);
          const first = elements.find((item) => String(item.id) === id);
          if (first !== undefined) {
            lines.set(id, { wrapper, page: first.page, y: first.y });
          }
        }
        window.__lyricFocusProbe = { lyric, lines };
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

  const state = (index) =>
    evaluate(`(() => {
      const elements = window._editor.elements.value;
      const probe = window.__lyricFocusProbe;
      const firstOnLine = (item) =>
        elements.find((x) => x.page === item.page && x.line === item.line).id;
      const wrapperOf = (id) =>
        document.getElementById('element-' + id)?.closest('.line') ?? null;
      const target = elements[${index}];
      const next = elements[${index + 1}];
      // Recorded lines that still start with the same element on the same
      // page, but moved within it.
      const movedLines = [...probe.lines].flatMap(([id, line]) => {
        const first = elements.find((item) => String(item.id) === id);
        return first !== undefined &&
          firstOnLine(first) === first.id &&
          first.page === line.page &&
          first.y !== line.y
          ? [{ id, kept: wrapperOf(id) === line.wrapper }]
          : [];
      });
      return {
        laterPlacement: [elements.at(-1).page, elements.at(-1).line, elements.at(-1).y],
        lyrics: target.lyrics,
        placement: [target.page, target.line],
        sameLine: target.page === next.page && target.line === next.line,
        lyricReplaced: !probe.lyric.isConnected,
        next: {
          id: next.id,
          lyrics: next.lyrics,
          firstOnLine: firstOnLine(next),
          lineKept: [...probe.lines.values()].some(
            (line) => line.wrapper === wrapperOf(next.id),
          ),
        },
        movedLines: movedLines.length,
        keptMovedLines: movedLines.filter((line) => line.kept).length,
        focused: document.activeElement?.closest('.element-box')?.id ?? null,
      };
    })()`);

  // Space commits the lyric and moves to the next note's lyric. Lyric
  // navigation is throttled, so leave time after the previous edit.
  const commit = async (target, text) => {
    await focusLyric(target.id);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await send('Input.insertText', { text });
    await press('Space', ' ', 32);
    return eventually(async () => {
      const result = await state(target.index);
      assert.ok(result.lyrics.endsWith(text), 'Lyric was not committed');
      return result;
    });
  };

  // Focus must have moved to the next lyric, and typing must land there.
  const checkAdvanced = async (target, committed) => {
    assert.equal(
      committed.focused,
      `element-${committed.next.id}`,
      'Focus did not move to the next lyric',
    );
    await send('Input.insertText', { text: 'abc' });
    await press('Space', ' ', 32);
    const typed = await eventually(async () => {
      const result = await state(target.index);
      assert.ok(result.next.lyrics.endsWith('abc'), 'Next lyric not typed');
      return result;
    });
    console.log(JSON.stringify(typed.next));
  };

  const findNote = (predicate) =>
    evaluate(`(() => {
      const elements = window._editor.elements.value;
      const index = elements.findIndex((item, i) =>
        item.elementType === 'Note' &&
        elements[i + 1]?.elementType === 'Note' &&
        (${predicate})(item, i, elements),
      );
      return {
        index,
        id: elements[index]?.id,
        placement: [elements[index]?.page, elements[index]?.line],
        laterPlacement: [elements.at(-1).page, elements.at(-1).line, elements.at(-1).y],
      };
    })()`);

  // `remount`: the next note ends its line, so widening the target's lyric
  // carries both notes to a line that starts with the target.
  for (const remount of [false, true]) {
    const target = await findNote(`(item, i, elements) =>
      item.page === 1 &&
      elements[i - 1]?.line === item.line &&
      elements[i + 1].line === item.line &&
      (${remount}
        ? elements[i + 2]?.line !== item.line
        : elements[i + 2]?.line === item.line)`);
    assert.ok(target.index >= 0, `No target note (remount: ${remount})`);
    const text = 'wwwwwwwwwwwwwwwwwwwwwwwwwwwwww';
    const committed = await commit(target, text);
    console.log(JSON.stringify({ remount, target, committed }));
    assert.notDeepEqual(
      committed.laterPlacement,
      target.laterPlacement,
      'The edit did not move later notation',
    );
    // Tie the movement to DOM identity: a line keyed by its first element
    // keeps its wrapper, where a positional key would hand it another's.
    assert.ok(committed.movedLines > 0, 'No line moved within its page');
    assert.equal(
      committed.keptMovedLines,
      committed.movedLines,
      'A line that moved within its page did not keep its wrapper',
    );
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
    await checkAdvanced(target, committed);
  }

  // Make short edits, away from the pages the cases above changed, until one
  // replaces the edited lyric's control while the edited and next notes stay
  // on their line, because reflow changed which element starts that line.
  const tried = [];
  let sameLine;
  while (sameLine === undefined && tried.length < 40) {
    const target = await findNote(`(item, i, elements) =>
      !${JSON.stringify(tried)}.includes(item.id) &&
      item.page >= 2 &&
      item.page <= 3 &&
      elements[i - 1]?.line === item.line &&
      elements[i + 1].page === item.page &&
      elements[i + 1].line === item.line`);
    assert.ok(target.index >= 0, 'No candidate note for the same-line case');
    tried.push(target.id);
    const committed = await commit(target, 'ww');
    if (
      committed.sameLine &&
      committed.lyricReplaced &&
      committed.placement.join() === target.placement.join()
    ) {
      sameLine = { target, committed };
      console.log(
        JSON.stringify({ sameLine: true, tries: tried.length, ...sameLine }),
      );
      await checkAdvanced(target, committed);
    }
  }
  assert.ok(
    sameLine !== undefined,
    `No same-line edit replaced the edited lyric in ${tried.length} tries`,
  );
  console.log(
    'PASS lyric focus kept across re-broken, shifted and replaced lines',
  );
} finally {
  await app.close();
}
