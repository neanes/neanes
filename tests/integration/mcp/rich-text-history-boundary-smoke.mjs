// Run outside the agent sandbox on macOS. All Electron data is disposable.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-rich-history-boundary-');
let client;
try {
  app.start({ args: ['--remote-debugging-port=0', '--inspect=0'] });
  const socket = await app.debugger();
  const { evaluate } = socket;
  const { evaluate: main } = await app.debugger('main');
  await app.ready();
  client = await connectStdioClient('rich-history-boundary', {
    profile: app.profile,
  });
  const call = createToolCaller(client, (await client.listTools()).tools);
  const workspace = 'window._editor.selectedWorkspace.value';
  const firstEditor = `document.querySelector('.page .rich-text-editor.single')?.ckeditorInstance`;
  const history = `${workspace}.commandService`;
  async function menu(channel) {
    await main(
      `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/index.html')).webContents.send(${JSON.stringify(channel)})`,
    );
  }
  async function shortcut(action) {
    const redo = action === 'redo';
    const key = redo && process.platform !== 'darwin' ? 'y' : 'z';
    const modifiers =
      (process.platform === 'darwin' ? 4 : 2) |
      (redo && process.platform === 'darwin' ? 8 : 0);
    for (const type of ['keyDown', 'keyUp']) {
      await socket.send('Input.dispatchKeyEvent', {
        type,
        modifiers,
        key,
        code: key === 'z' ? 'KeyZ' : 'KeyY',
        windowsVirtualKeyCode: key === 'z' ? 90 : 89,
      });
    }
  }
  async function toolbar(action) {
    const selector = `[data-testid="rich-text-${action}"]`;
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `document.querySelector(${JSON.stringify(selector)})?.disabled`,
        ),
        false,
        `Rich-text toolbar ${action} must be enabled`,
      ),
    );
    const point = await evaluate(
      `(() => {const n=document.querySelector(${JSON.stringify(selector)});n.scrollIntoView({block:'nearest'});const r=n.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`,
    );
    for (const type of ['mousePressed', 'mouseReleased']) {
      await socket.send('Input.dispatchMouseEvent', {
        type,
        ...point,
        button: 'left',
        clickCount: 1,
      });
    }
  }
  async function focusRich(editor, offset) {
    await main(
      `(() => {const w=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/index.html'));w.show();w.focus();w.webContents.focus();})()`,
    );
    await socket.send('Page.bringToFront');
    await eventually(async () =>
      assert.equal(await evaluate('document.hasFocus()'), true),
    );
    await eventually(async () =>
      assert.equal(await evaluate(`${editor}?.state`), 'ready'),
    );
    await evaluate(
      `${editor}.ui.getEditableElement().click();${editor}.editing.view.focus();${editor}.editing.view.forceRender()`,
    );
    // Let browser focus/selection events and the preceding history replay finish
    // before placing the caret for the next real input event.
    await evaluate(
      'new Promise(resolve => requestAnimationFrame(() => resolve()))',
    );
    await evaluate(
      `(() => {const e=${editor};e.model.change(w=>w.setSelection(e.model.document.getRoot().getChild(0),${offset}));e.editing.view.forceRender();})()`,
    );
    try {
      await eventually(async () =>
        assert.equal(
          await evaluate(
            `(() => {const e=${editor};const s=window.getSelection();return e.ui.focusTracker.isFocused && e.ui.getEditableElement().contains(s.focusNode) && s.focusOffset === ${offset};})()`,
          ),
          true,
        ),
      );
    } catch (error) {
      console.error(
        await evaluate(
          `(() => {const e=${editor}; return {html:e.getData(),selection:e.model.document.selection.focus?.path,selected:e.model.document.selection.getSelectedElement()?.name,active:document.activeElement?.outerHTML.slice(0,400),activeFootnote:${workspace}.activeFootnoteId};})()`,
        ),
      );
      throw error;
    }
  }
  // No footnotes: Save must hand typing to score history without overlapping
  // native entries. Keep the same live editor and caret throughout Save.
  for (const savedRoute of ['keyboard', 'toolbar']) {
    const replay = (action) =>
      savedRoute === 'toolbar' ? toolbar(action) : shortcut(action);
    const doc = await call('create_document', {
      documentScope: 'editor',
      title: `Save history handoff: ${savedRoute}`,
    });
    const args = { documentScope: 'editor', documentId: doc.documentId };
    const initial = await call('get_elements', args);
    await call('edit_elements', {
      ...args,
      expectedRevision: initial.revision,
      actions: [
        { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
        {
          action: 'insert',
          elements: [
            { elementType: 'RichTextBox', properties: { content: '<p>A</p>' } },
          ],
        },
      ],
    });
    const elements = await call('get_elements', args);
    await call('edit_elements', {
      ...args,
      expectedRevision: elements.revision,
      actions: [
        {
          action: 'update',
          elementRef: elements.elements[0].elementRef,
          elementType: 'RichTextBox',
          properties: { content: '<p>B</p>' },
        },
      ],
    });
    const filePath = path.join(
      app.directory,
      `${savedRoute}-save-history.byzx`,
    );
    await call('save_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      filePath,
    });
    await focusRich(firstEditor, 1);
    await evaluate(`void(window._historyCheckpointEditor=${firstEditor})`);
    await socket.send('Input.insertText', { text: 'Y' });
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BY</p>'),
    );
    assert.equal(
      await evaluate(`${firstEditor}.commands.get('undo').isEnabled`),
      true,
    );
    await menu('FileMenuSave');
    await eventually(async () =>
      assert.equal(
        JSON.parse(await readFile(filePath, 'utf8')).staff.elements[0].content,
        '<p>BY</p>',
      ),
    );
    await eventually(async () => {
      assert.equal(
        await evaluate(
          `${firstEditor} === window._historyCheckpointEditor && ${firstEditor}.ui.focusTracker.isFocused`,
        ),
        true,
      );
      assert.deepEqual(
        await evaluate(`${firstEditor}.model.document.selection.focus.path`),
        [0, 2],
      );
      assert.equal(
        await evaluate(
          `${firstEditor}.commands.get('undo').isEnabled || ${firstEditor}.commands.get('redo').isEnabled`,
        ),
        false,
      );
    });
    await eventually(async () => {
      assert.equal(
        await evaluate(
          `document.querySelector('[data-testid="rich-text-undo"]')?.disabled`,
        ),
        false,
        'Toolbar Undo must use score availability after Save',
      );
      assert.equal(
        await evaluate(
          `document.querySelector('[data-testid="rich-text-redo"]')?.disabled`,
        ),
        true,
      );
    });
    // Undo the saved edit immediately, with native history empty.
    await replay('undo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>B</p>'),
    );
    await replay('redo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BY</p>'),
    );
    await focusRich(firstEditor, 2);
    // Typing after Save must start a fresh native undo group.
    await socket.send('Input.insertText', { text: 'Z' });
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BYZ</p>'),
    );
    assert.equal(
      await evaluate(`${firstEditor}.commands.get('undo').isEnabled`),
      true,
    );
    await replay('undo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BY</p>'),
    );
    for (const [channel, expected] of [
      ['FileMenuUndo', '<p>B</p>'],
      ['FileMenuUndo', '<p>A</p>'],
      ['FileMenuRedo', '<p>B</p>'],
      ['FileMenuRedo', '<p>BY</p>'],
    ]) {
      await replay(channel === 'FileMenuUndo' ? 'undo' : 'redo');
      await eventually(async () => {
        assert.equal(await evaluate(`${firstEditor}.getData()`), expected);
        assert.equal(
          await evaluate(`${workspace}.score.staff.elements[0].content`),
          expected,
        );
        assert.equal(await evaluate(`${workspace}.score.footnotes.length`), 0);
      });
    }
    // Native keyboard Undo/Redo still handles typing before flush.
    await focusRich(firstEditor, 2);
    await socket.send('Input.insertText', { text: '!' });
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BY!</p>'),
    );
    await replay('undo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BY</p>'),
    );
    await replay('redo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BY!</p>'),
    );
    assert.equal(
      await evaluate(`${workspace}.score.staff.elements[0].content`),
      '<p>BY</p>',
      'Local keyboard history must not flush typing',
    );
    // After blur/refocus, the same shortcuts must use committed score history.
    await evaluate(`${firstEditor}.ui.getEditableElement().blur()`);
    await eventually(async () =>
      assert.equal(
        await evaluate(`${workspace}.score.staff.elements[0].content`),
        '<p>BY!</p>',
      ),
    );
    await focusRich(firstEditor, 3);
    assert.equal(
      await evaluate(`${firstEditor}.commands.get('undo').isEnabled`),
      false,
    );
    await replay('undo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BY</p>'),
    );
    await replay('redo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BY!</p>'),
    );
    await evaluate('delete window._historyCheckpointEditor');
    await call('close_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      discardUnsavedChanges: true,
    });
    console.log(
      `PASS: ${savedRoute} Undo/Redo uses shared history after Save and blur/refocus.`,
    );
  }
  // Crossing from B's native Undo into A's committed history must reverse
  // in the same order: score Redo first, then B's native Redo.
  for (const route of ['menu', 'keyboard', 'toolbar']) {
    const doc = await call('create_document', {
      documentScope: 'editor',
      title: `Two textbox Redo: ${route}`,
    });
    const args = { documentScope: 'editor', documentId: doc.documentId };
    const initial = await call('get_elements', args);
    await call('edit_elements', {
      ...args,
      expectedRevision: initial.revision,
      actions: [
        { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
        {
          action: 'insert',
          elements: [
            { elementType: 'RichTextBox', properties: { content: '<p>A</p>' } },
            { elementType: 'RichTextBox', properties: { content: '<p>B</p>' } },
          ],
        },
      ],
    });
    const a = firstEditor;
    const b = `document.querySelectorAll('.page .rich-text-editor.single')[1]?.ckeditorInstance`;
    const replay = (action) =>
      route === 'keyboard'
        ? shortcut(action)
        : route === 'toolbar'
          ? toolbar(action)
          : menu(action === 'undo' ? 'FileMenuUndo' : 'FileMenuRedo');
    const model = (index) =>
      evaluate(`${workspace}.score.staff.elements[${index}].content`);
    await focusRich(a, 1);
    await socket.send('Input.insertText', { text: 'X' });
    await eventually(async () =>
      assert.equal(await evaluate(`${a}.getData()`), '<p>AX</p>'),
    );
    await focusRich(b, 1);
    await eventually(async () => assert.equal(await model(0), '<p>AX</p>'));
    const committedIndex = await evaluate(`${history}.index`);
    await socket.send('Input.insertText', { text: 'Y' });
    await eventually(async () =>
      assert.equal(await evaluate(`${b}.getData()`), '<p>BY</p>'),
    );
    await replay('undo');
    await eventually(async () =>
      assert.equal(await evaluate(`${b}.getData()`), '<p>B</p>'),
    );
    assert.equal(await model(1), '<p>B</p>');
    await replay('undo');
    await eventually(async () => assert.equal(await model(0), '<p>A</p>'));
    assert.equal(await evaluate(`${b}.commands.get('redo').isEnabled`), true);
    await replay('redo');
    await eventually(async () => {
      assert.equal(
        await model(0),
        '<p>AX</p>',
        'Redo must restore the most recently undone committed edit first',
      );
      assert.equal(
        await evaluate(`${b}.getData()`),
        '<p>B</p>',
        'B must wait until score Redo is complete',
      );
    });
    // Blur at this boundary must not append B's undone typing or lose history.
    await evaluate(`${b}.ui.getEditableElement().blur()`);
    await eventually(async () =>
      assert.equal(await evaluate(`${b}.ui.focusTracker.isFocused`), false),
    );
    assert.equal(await model(1), '<p>B</p>');
    assert.equal(await evaluate(`${history}.index`), committedIndex);
    await focusRich(b, 1);
    await replay('redo');
    await eventually(async () =>
      assert.equal(await evaluate(`${b}.getData()`), '<p>BY</p>'),
    );
    assert.equal(await model(0), '<p>AX</p>');
    assert.equal(
      await model(1),
      '<p>B</p>',
      'Native Redo should stay local until flush',
    );
    await evaluate(`${b}.ui.getEditableElement().blur()`);
    await eventually(async () => assert.equal(await model(1), '<p>BY</p>'));
    await replay('undo');
    await eventually(async () => assert.equal(await model(1), '<p>B</p>'));
    await replay('undo');
    await eventually(async () =>
      assert.equal(
        await model(0),
        '<p>A</p>',
        'A must remain reachable after B is committed',
      ),
    );
    await call('close_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      discardUnsavedChanges: true,
    });
    console.log(
      `PASS: ${route} Redo restores score history before native typing across two textboxes.`,
    );
  }
  for (const [name, definition, selector] of [
    [
      'ordinary rich',
      { elementType: 'RichTextBox', properties: { content: '<p>B</p>' } },
      '.rich-text-editor.single',
    ],
    [
      'multipanel rich',
      {
        elementType: 'RichTextBox',
        properties: { multipanel: true, contentRight: '<p>B</p>' },
      },
      '.rich-text-editor.right',
    ],
    [
      'plain',
      { elementType: 'TextBox', properties: { content: 'B' } },
      '.text-box.single',
    ],
  ]) {
    const doc = await call('create_document', {
      documentScope: 'editor',
      title: `History boundary: ${name}`,
    });
    const args = { documentScope: 'editor', documentId: doc.documentId };
    const initial = await call('get_elements', args);
    await call('edit_elements', {
      ...args,
      expectedRevision: initial.revision,
      actions: [
        { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
        {
          action: 'insert',
          elements: [
            {
              elementType: 'RichTextBox',
              clientId: 'a',
              properties: { content: '<p>A</p>' },
            },
            definition,
          ],
        },
        {
          action: 'insert_footnote',
          elementRef: '@a',
          contentKey: 'content',
          htmlOffset: 4,
        },
      ],
    });
    const sourceKey = name === 'multipanel rich' ? 'contentRight' : 'content';
    const bNode = `document.querySelectorAll('.page ${selector}')[${name === 'ordinary rich' ? 1 : 0}]`;
    const bEditor = `${bNode}?.ckeditorInstance`;
    await focusRich(firstEditor, 1);
    await socket.send('Input.insertText', { text: 'X' });
    await eventually(async () =>
      assert.ok((await evaluate(`${firstEditor}.getData()`)).includes('AX')),
    );
    assert.equal(
      await evaluate(
        `${workspace}.score.staff.elements[0].content.includes('AX')`,
      ),
      false,
      'Typing stays local until flush',
    );
    async function focusB() {
      if (name === 'plain') {
        await eventually(async () =>
          assert.ok(await evaluate(`${bNode} !== undefined`)),
        );
        await evaluate(
          `(() => {const n=${bNode};n.click();n.focus();const r=document.createRange();r.selectNodeContents(n);r.collapse(false);const s=window.getSelection();s.removeAllRanges();s.addRange(r);})()`,
        );
      } else {
        await focusRich(bEditor, 1);
      }
    }
    await focusB();
    await socket.send('Input.insertText', { text: 'Y' });
    const bContent = () =>
      evaluate(
        name === 'plain' ? `${bNode}?.textContent` : `${bEditor}?.getData()`,
      );
    await eventually(async () => assert.ok((await bContent()).includes('BY')));
    assert.equal(
      await evaluate(
        `${workspace}.score.staff.elements[1][${JSON.stringify(sourceKey)}]`,
      ),
      name === 'plain' ? 'B' : '<p>B</p>',
      'B must have pending typing before native menu Undo',
    );
    // No MCP reads: those would flush pending edits and mask the boundary.
    if (name !== 'plain') {
      await shortcut('undo');
      await eventually(async () => assert.equal(await bContent(), '<p>B</p>'));
      await shortcut('redo');
      await eventually(async () => assert.equal(await bContent(), '<p>BY</p>'));
    }
    // Leaving the editor commits B once. Score history never restores focus to A.
    await evaluate('document.activeElement.blur()');
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `${workspace}.score.staff.elements[1][${JSON.stringify(sourceKey)}]`,
        ),
        name === 'plain' ? 'BY' : '<p>BY</p>',
      ),
    );
    await menu('FileMenuUndo');
    await eventually(async () =>
      assert.equal(await bContent(), name === 'plain' ? 'B' : '<p>B</p>'),
    );
    assert.equal(
      await evaluate(
        `${workspace}.score.staff.elements[0].content.includes('AX')`,
      ),
      true,
    );
    await menu('FileMenuUndo');
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `${workspace}.score.staff.elements[0].content.includes('AX')`,
        ),
        false,
      ),
    );
    assert.equal(
      await evaluate(`${firstEditor}.ui.focusTracker.isFocused`),
      false,
    );
    assert.equal(
      await evaluate(`${history}.index < ${history}.commandHistory.length-1`),
      true,
      'No blur transaction may discard Redo',
    );
    await menu('FileMenuRedo');
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `${workspace}.score.staff.elements[0].content.includes('AX')`,
        ),
        true,
      ),
    );
    await menu('FileMenuRedo');
    await eventually(async () =>
      assert.equal(await bContent(), name === 'plain' ? 'BY' : '<p>BY</p>'),
    );
    // New typing before score Redo must branch before replay, never after it.
    await menu('FileMenuUndo');
    await eventually(async () =>
      assert.equal(await bContent(), name === 'plain' ? 'B' : '<p>B</p>'),
    );
    await focusB();
    await socket.send('Input.insertText', { text: 'Z' });
    await eventually(async () => assert.ok((await bContent()).includes('BZ')));
    await menu('FileMenuRedo');
    await eventually(async () => {
      assert.equal(
        await evaluate(
          `${workspace}.score.staff.elements[1][${JSON.stringify(sourceKey)}]`,
        ),
        name === 'plain' ? 'BZ' : '<p>BZ</p>',
      );
      assert.equal(
        await evaluate(`${history}.index < ${history}.commandHistory.length-1`),
        false,
      );
    });
    await evaluate('document.activeElement.blur()');
    if (name !== 'plain') {
      await eventually(async () =>
        assert.equal(
          await evaluate(`${bEditor}.ui.focusTracker.isFocused`),
          false,
        ),
      );
    }
    await menu('FileMenuUndo');
    await eventually(async () =>
      assert.equal(await bContent(), name === 'plain' ? 'B' : '<p>B</p>'),
    );
    await menu('FileMenuRedo');
    await eventually(async () =>
      assert.equal(await bContent(), name === 'plain' ? 'BZ' : '<p>BZ</p>'),
    );
    await call('close_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      discardUnsavedChanges: true,
    });
    console.log(
      `PASS: ${name} native textbox history and flushed score history preserve Redo.`,
    );
  }
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  await client?.close();
  await app.close();
}
