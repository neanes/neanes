import assert from 'node:assert/strict';

import { eventually } from './smokePolling.mjs';

export async function checkRichTextHistory({
  call,
  evaluate,
  socket,
  focusEditor,
  args,
  editor,
  key,
}) {
  const current = () => evaluate(`${editor}?.getData()`);
  const selection = () =>
    evaluate(
      `(() => {const s=${editor}.model.document.selection; return {anchor:s.anchor.path,focus:s.focus.path,backward:s.isBackward};})()`,
    );
  const caret = (offset) => ({
    anchor: [1, offset],
    focus: [1, offset],
    backward: false,
  });
  const original = await current();
  const discovered = await call('get_elements', args);
  const elementRef = discovered.elements[0].elementRef;
  async function content(html) {
    await call('edit_elements', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      actions: [
        {
          action: 'update',
          elementRef,
          elementType: 'RichTextBox',
          properties: { [key]: html },
        },
      ],
    });
    await eventually(async () => assert.equal(await current(), html));
  }
  async function selectSecond(backward = false) {
    await focusEditor();
    await eventually(async () =>
      assert.equal(await evaluate(`${editor}?.state`), 'ready'),
    );
    await evaluate(
      `(() => {const e=${editor};e.ui.getEditableElement().click();})()`,
    );
    await evaluate(`(() => {const e=${editor}; e.model.change(w=>{
      const p=e.model.document.getRoot().getChild(1);
      if(${backward})w.setSelection(w.createRange(w.createPositionAt(p,0),w.createPositionAt(p,6)),{backward:true});
      else w.setSelection(p,6);
    });e.editing.view.focus();e.editing.view.forceRender();})()`);
    await eventually(async () =>
      assert.equal(await evaluate(`${editor}.ui.focusTracker.isFocused`), true),
    );
  }
  async function replay(direction, expected) {
    await evaluate(`${editor}.execute(${JSON.stringify(direction)})`);
    await eventually(async () => assert.deepEqual(await selection(), expected));
  }
  const html = original + '<p>Second paragraph</p>';
  await content(html);
  await selectSecond();
  await socket.send('Input.insertText', { text: 'X' });
  await socket.send('Input.insertText', { text: 'Y' });
  await eventually(async () =>
    assert.ok((await current()).includes('SecondXY paragraph')),
  );
  await replay('undo', caret(6));
  assert.equal(await current(), html, 'Merged typing must undo as one entry');
  await replay('redo', caret(8));
  assert.ok((await current()).includes('SecondXY paragraph'));
  await replay('undo', caret(6));
  await socket.send('Input.insertText', { text: 'Z' });
  await eventually(async () =>
    assert.ok(
      (await current()).includes('<p>SecondZ paragraph</p>'),
      'Typing after Undo must stay in paragraph two',
    ),
  );
  assert.ok((await current()).startsWith(original));

  await content(html);
  await selectSecond(true);
  await socket.send('Input.insertText', { text: 'R' });
  await eventually(async () =>
    assert.ok((await current()).includes('<p>R paragraph</p>')),
  );
  await replay('undo', { anchor: [1, 6], focus: [1, 0], backward: true });
  assert.equal(await current(), html);
  await replay('redo', caret(1));
  await content(original);
}
