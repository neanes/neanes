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
  // Keyboard and toolbar stay native, including after Save and blur.
  for (const route of ['keyboard', 'toolbar']) {
    const replay = route === 'keyboard' ? shortcut : toolbar;
    const doc = await call('create_document', {
      documentScope: 'editor',
      title: `Separate text history: ${route}`,
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
            { elementType: 'RichTextBox', properties: { content: '<p>B</p>' } },
          ],
        },
      ],
    });
    const filePath = path.join(app.directory, `${route}.byzx`);
    await call('save_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      filePath,
    });
    await focusRich(firstEditor, 1);
    const index = await evaluate(`${history}.index`);
    await socket.send('Input.insertText', { text: 'X' });
    await evaluate(`(() => {
      const {buffer}=${firstEditor}.commands.get('insertText');
      buffer.input(buffer.limit);
    })()`);
    await socket.send('Input.insertText', { text: 'Y' });
    await replay('undo');
    await eventually(async () => {
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BX</p>');
      assert.equal(
        await evaluate(`${history}.index`),
        index,
        'Ordinary typing and native Undo must not commit score commands',
      );
    });
    await menu('FileMenuSave');
    await eventually(async () => {
      assert.equal(
        JSON.parse(await readFile(filePath, 'utf8')).staff.elements[0].content,
        '<p>BX</p>',
      );
      assert.equal(
        await evaluate(`${firstEditor}.commands.get('redo').isEnabled`),
        true,
        'Save must preserve unapplied native Redo',
      );
    });
    await replay('redo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BXY</p>'),
    );
    await evaluate(`${firstEditor}.ui.getEditableElement().blur()`);
    await eventually(async () =>
      assert.equal(
        await evaluate(`${workspace}.score.staff.elements[0].content`),
        '<p>BXY</p>',
      ),
    );
    await focusRich(firstEditor, 3);
    await replay('undo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BX</p>'),
    );
    await replay('undo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>B</p>'),
    );
    const committedIndex = await evaluate(`${history}.index`);
    // A real shortcut at the native boundary must not fall back to score Undo.
    await shortcut('undo');
    await eventually(async () => {
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>B</p>');
      assert.equal(await evaluate(`${history}.index`), committedIndex);
    });
    await replay('redo');
    await replay('redo');
    await eventually(async () =>
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BXY</p>'),
    );
    // The application menu targets score history even with native Undo available.
    await menu('FileMenuUndo');
    await eventually(async () => {
      assert.equal(
        await evaluate(`${workspace}.score.staff.elements[0].content`),
        '<p>BX</p>',
      );
      assert.equal(await evaluate(`${history}.index`), committedIndex - 1);
      assert.equal(await evaluate(`${firstEditor}.getData()`), '<p>BX</p>');
    });
    await menu('FileMenuRedo');
    await eventually(async () =>
      assert.equal(
        await evaluate(`${workspace}.score.staff.elements[0].content`),
        '<p>BXY</p>',
      ),
    );
    await call('close_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      discardUnsavedChanges: true,
    });
    console.log(
      `PASS: ${route} preserves master's separate text and score histories.`,
    );
  }
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  await client?.close();
  await app.close();
}
