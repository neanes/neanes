// Launch outside the command sandbox on macOS. Uses a disposable Electron profile.
import assert from 'node:assert/strict';
import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';

import { checkRichTextHistory } from './richTextHistoryChecks.mjs';
import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-rich-text-footnotes-', {
  keepArtifacts: true,
});
let client;
try {
  app.start({ args: ['--remote-debugging-port=0', '--inspect=0'] });
  const socket = await app.debugger();
  const { evaluate } = socket;
  const { evaluate: main } = await app.debugger('main');
  await app.ready();
  client = await connectStdioClient('rich-text-footnotes', {
    profile: app.profile,
  });
  const call = createToolCaller(client, (await client.listTools()).tools);
  const ws = 'window._editor.selectedWorkspace.value';
  const editorFor = (panel) =>
    `document.querySelector('.page .rich-text-editor.${panel}')?.ckeditorInstance`;
  const edit = async (args, actions) =>
    call('edit_elements', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      actions,
    });
  const menu = async (channel) =>
    main(
      `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w => !w.isDestroyed() && w.webContents.getURL().includes('index.html')).webContents.send(${JSON.stringify(channel)})`,
    );
  async function focus(expression) {
    await eventually(async () =>
      assert.equal(await evaluate(`${expression}?.state`), 'ready'),
    );
    await main(
      `(() => {const w=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/index.html'));w.show();w.focus();w.webContents.focus();})()`,
    );
    await socket.send('Page.bringToFront');
    await eventually(async () =>
      assert.equal(await evaluate('document.hasFocus()'), true),
    );
    await evaluate(
      `${expression}.ui.getEditableElement().click();${expression}.editing.view.focus();${expression}.editing.view.forceRender()`,
    );
    await evaluate(
      'new Promise(resolve => requestAnimationFrame(() => resolve()))',
    );
    await evaluate(
      `(() => {const e=${expression};e.model.change(w=>w.setSelection(e.model.document.getRoot().getChild(0),'end'));e.editing.view.forceRender();})()`,
    );
    try {
      await eventually(async () => {
        assert.equal(
          await evaluate(
            `${expression}.ui.focusTracker.isFocused && document.activeElement === ${expression}.ui.getEditableElement()`,
          ),
          true,
        );
      });
    } catch (error) {
      console.error(
        'Focus diagnostic',
        await evaluate(
          `(() => {const e=${expression},n=e.ui.getEditableElement();return {focused:e.ui.focusTracker.isFocused,viewFocused:e.editing.view.document.isFocused,documentFocused:document.hasFocus(),active:document.activeElement?.outerHTML.slice(0,200),connected:n.isConnected,rects:n.getClientRects().length,html:e.getData(),selected:${ws}.selectedElement?.elementType,activeFootnote:${ws}.activeFootnoteId,selection:e.model.document.selection.focus?.path};})()`,
        ),
      );
      throw error;
    }
  }
  async function click(selector) {
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `document.querySelector(${JSON.stringify(selector)}) !== null`,
        ),
        true,
      ),
    );
    const point = await evaluate(
      `(() => {const n=document.querySelector(${JSON.stringify(selector)}); n.scrollIntoView({block:'center'}); const r=n.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};})()`,
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
  for (const [name, layout, panel, key] of [
    ['ordinary', {}, 'single', 'content'],
    ['inline-top', { inline: true }, 'inline-top', 'content'],
    ['inline-bottom', { inline: true }, 'inline-bottom', 'contentBottom'],
    ['multipanel-left', { multipanel: true }, 'left', 'contentLeft'],
    ['multipanel-center', { multipanel: true }, 'center', 'contentCenter'],
    ['multipanel-right', { multipanel: true }, 'right', 'contentRight'],
  ]) {
    console.log('Checking rich footnotes:', name);
    const doc = await call('create_document', {
      documentScope: 'editor',
      title: `Rich footnotes ${name}`,
    });
    const args = { documentScope: 'editor', documentId: doc.documentId };
    const initial = await call('get_elements', args);
    await edit(args, [
      { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
    ]);
    await edit(args, [
      {
        action: 'insert',
        elements: [
          {
            elementType: 'RichTextBox',
            properties: { ...layout, [key]: '<p>Before after</p>' },
          },
        ],
      },
    ]);
    const e = editorFor(panel);
    await focus(e);
    await evaluate(
      `(() => {const e=${e}; e.model.change(w=>w.setSelection(e.model.document.getRoot().getChild(0),6));})()`,
    );
    try {
      await click('[data-testid="insert-rich-text-footnote"]');
    } catch (error) {
      console.error(
        await evaluate(
          `(() => {const e=${e};return {selected:${ws}.selectedElement?.elementType, active:${ws}.activeFootnoteId, focus:e.ui.focusTracker.isFocused, command:e.commands.get('insertFootnote').isEnabled, selection:e.model.document.selection.focus?.path, html:e.getData(), owner:${ws}.score.staff.elements[0].elementType, toolbar:document.querySelector('.rich-text-toolbar')?.outerHTML.slice(0,500)};})()`,
        ),
      );
      throw error;
    }
    await eventually(async () =>
      assert.equal(await evaluate(`${ws}.score.footnotes.length`), 1),
    );
    const id = await evaluate(`${ws}.score.footnotes[0].id`);
    assert.equal(
      await evaluate(`${ws}.activeFootnoteId`),
      id,
      'Insertion navigates to the body',
    );
    assert.match(
      await evaluate(`${ws}.score.staff.elements[0][${JSON.stringify(key)}]`),
      /Before<span[^>]*data-footnote-id=/,
    );
    await menu('FileMenuUndo');
    await eventually(async () =>
      assert.equal(await evaluate(`${ws}.score.footnotes.length`), 0),
    );
    assert.equal(
      await evaluate(`${ws}.score.staff.elements[0][${JSON.stringify(key)}]`),
      '<p>Before after</p>',
    );
    await menu('FileMenuRedo');
    await eventually(async () =>
      assert.equal(await evaluate(`${ws}.score.footnotes[0]?.id`), id),
    );
    await focus(e);
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `document.querySelector('.page .neanes-footnote')?.textContent`,
        ),
        '1',
      ),
    );
    await click('.page .neanes-footnote');
    await eventually(async () =>
      assert.equal(await evaluate(`${ws}.activeFootnoteId`), id),
    );
    // Give the body musical data and a custom lyric style to preserve across copies.
    await call('edit_paragraph_styles', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      changes: [
        {
          action: 'create',
          style: {
            id: 'footnote-lyrics',
            displayName: 'Footnote lyrics',
            parentStyleId: 'lyrics',
            overrides: { fontSize: 19 },
          },
        },
      ],
    });
    await edit(args, [
      {
        action: 'insert',
        collection: { kind: 'footnote', footnoteId: id },
        elements: [
          {
            elementType: 'Note',
            properties: {
              spaceAfter: 37,
              lyrics: 'Body',
              lyricsParagraphStyleId: 'footnote-lyrics',
            },
          },
        ],
      },
    ]);
    await focus(e);
    await evaluate(
      `(() => {const e=${e}; const marker=[...e.model.createRangeIn(e.model.document.getRoot()).getItems()].find(n=>n.is('element','footnoteReference')); e.model.change(w=>w.setSelection(marker,'on'));})()`,
    );
    await evaluate(`${e}.editing.view.focus()`);
    await eventually(async () =>
      assert.equal(await evaluate(`${e}.ui.focusTracker.isFocused`), true),
    );
    await socket.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Backspace',
      code: 'Backspace',
      windowsVirtualKeyCode: 8,
    });
    await socket.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Backspace',
      code: 'Backspace',
      windowsVirtualKeyCode: 8,
    });
    await eventually(async () =>
      assert.equal(
        (await evaluate(`${e}.getData()`)).includes('data-footnote-id'),
        false,
      ),
    );
    assert.equal(
      await evaluate(`${ws}.score.footnotes.length`),
      1,
      'Deletion stays local until flush',
    );
    await evaluate(`${e}.execute('undo')`);
    await eventually(async () =>
      assert.equal((await evaluate(`${e}.getData()`)).includes(id), true),
    );
    await evaluate(`${e}.execute('redo')`);
    await eventually(async () =>
      assert.equal((await evaluate(`${e}.getData()`)).includes(id), false),
    );
    await focus(e);
    await evaluate(`${e}.ui.getEditableElement().blur()`);
    await eventually(async () =>
      assert.equal(await evaluate(`${ws}.score.footnotes.length`), 0),
    );
    // A flush hands ownership to score history, including the complete body.
    await focus(e);
    assert.equal(await evaluate(`${e}.commands.get('undo').isEnabled`), false);
    assert.equal(await evaluate(`${e}.commands.get('redo').isEnabled`), false);
    await menu('FileMenuUndo');
    await eventually(async () => {
      assert.equal(await evaluate(`${ws}.score.footnotes[0]?.id`), id);
      assert.equal((await evaluate(`${e}.getData()`)).includes(id), true);
    });
    await menu('FileMenuRedo');
    await eventually(async () =>
      assert.equal(await evaluate(`${ws}.score.footnotes.length`), 0),
    );
    await menu('FileMenuUndo');
    await eventually(async () =>
      assert.equal(await evaluate(`${ws}.score.footnotes[0]?.id`), id),
    );
    assert.equal(
      await evaluate(`${ws}.score.footnotes[0].staff.elements[0].spaceAfter`),
      37,
    );
    assert.equal(
      await evaluate(
        `${ws}.score.footnotes[0].staff.elements[0].lyricsParagraphStyleId`,
      ),
      'footnote-lyrics',
    );
    await focus(e);
    await socket.send('Input.insertText', { text: ' extra' });
    await eventually(async () =>
      assert.ok((await evaluate(`${e}.getData()`)).includes('extra')),
    );
    await evaluate(`${e}.execute('undo')`);
    await eventually(async () =>
      assert.equal((await evaluate(`${e}.getData()`)).includes('extra'), false),
    );
    assert.equal(
      await evaluate(`${ws}.score.footnotes[0].id`),
      id,
      'Undoing surrounding text must retain the footnote',
    );
    await checkRichTextHistory({
      focusEditor: () => focus(e),
      call,
      evaluate,
      socket,
      args,
      editor: e,
      key,
    });
    // Save/reopen and selected-element cross-document copying use the real services.
    const filePath = path.join(app.directory, `${name}.byzx`);
    await call('save_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      filePath,
    });
    const saved = JSON.parse(await readFile(filePath, 'utf8'));
    assert.match(saved.staff.elements[0][key], new RegExp(id));
    assert.equal(saved.footnotes[0].staff.elements[0].spaceAfter, 37);
    const reopened = await call('open_document', {
      documentScope: 'private',
      filePath,
    });
    const reopenedArgs = {
      documentScope: 'private',
      documentId: reopened.documentId,
    };
    const content = await call('get_elements', {
      ...reopenedArgs,
      includeContent: true,
    });
    assert.match(content.elements[0].properties[key], new RegExp(id));
    const destination = await call('create_document', {
      documentScope: 'private',
      title: 'Copied rich footnotes',
    });
    await call('copy_elements', {
      sourceDocumentId: reopened.documentId,
      expectedSourceRevision: content.revision,
      documentScope: 'private',
      documentId: destination.documentId,
      expectedRevision: destination.revision,
      start: 0,
      end: 1,
    });
    const copied = await call('get_elements', {
      documentScope: 'private',
      documentId: destination.documentId,
      includeContent: true,
    });
    const copiedId = copied.elements[0].properties[key].match(
      /data-footnote-id="([^"]+)"/,
    )[1];
    assert.notEqual(copiedId, id);
    const body = await call('get_elements', {
      documentScope: 'private',
      documentId: destination.documentId,
      collection: { kind: 'footnote', footnoteId: copiedId },
    });
    assert.equal(body.elements[0].properties.spaceAfter, 37);
    await call('get_pages', reopenedArgs);
    const setupRevision = (await call('get_document_properties', reopenedArgs))
      .revision;
    await call('update_page_setup', {
      ...reopenedArgs,
      expectedRevision: setupRevision,
      changes: {
        pageSize: 'Custom',
        pageWidthCustom: 600,
        pageHeightCustom: 450,
        topMargin: 40,
        bottomMargin: 40,
        leftMargin: 40,
        rightMargin: 40,
      },
    });
    await edit(reopenedArgs, [
      {
        action: 'insert',
        index: 0,
        elements: [
          {
            elementType: 'TextBox',
            properties: { content: 'Preceding content', customHeight: 300 },
          },
        ],
      },
    ]);
    const fitted = await call('get_pages', reopenedArgs);
    assert.equal(
      fitted.pageCount,
      2,
      'Footnote reservation should move the whole rich textbox to page two',
    );
    const second = await call('get_page_elements', {
      ...reopenedArgs,
      pageNumber: 2,
    });
    assert.ok(
      second.occurrences.some(
        (entry) =>
          entry.elementType === 'RichTextBox' && entry.region === 'staff',
      ),
    );
    assert.ok(
      second.occurrences.some(
        (entry) => entry.elementType === 'Note' && entry.region === 'footnote',
      ),
    );
    const preview = await call('preview_page', {
      ...reopenedArgs,
      expectedRevision: fitted.revision,
      pageNumber: 2,
    });
    await copyFile(
      preview.outputFilePath,
      path.join(app.directory, `${name}.png`),
    );
    if (name === 'ordinary') {
      await edit(args, [
        { action: 'update_footnote', footnoteId: id, marker: '\u2020' },
      ]);
      await focus(e);
      await evaluate(
        `(() => {const e=${e}; const marker=[...e.model.createRangeIn(e.model.document.getRoot()).getItems()].find(n=>n.is('element','footnoteReference')); e.model.change(w=>w.setSelection(marker,'on'));})()`,
      );
      const nativeContents = `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('index.html')).webContents`;
      await main(`${nativeContents}.copy()`);
      await eventually(async () =>
        assert.match(
          await main(
            `(async () => {const items=await process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').clipboard.read(); const item=items.find(i=>i.types.includes('text/html')); return item ? (await item.getType('text/html')).text() : '';})()`,
          ),
          /data-neanes-footnote-body=/,
        ),
      );
      const targetDoc = await call('create_document', {
        documentScope: 'editor',
        title: 'Inline clipboard target',
      });
      const targetArgs = {
        documentScope: 'editor',
        documentId: targetDoc.documentId,
      };
      const initialTarget = await call('get_elements', targetArgs);
      await edit(targetArgs, [
        {
          action: 'remove_range',
          start: 0,
          end: initialTarget.collectionSize - 1,
        },
        {
          action: 'insert',
          elements: [
            {
              elementType: 'RichTextBox',
              properties: { content: '<p>Target</p>' },
            },
          ],
        },
      ]);
      await focus(editorFor('single'));
      await socket.send('Input.insertText', { text: ' pending' });
      await main(`${nativeContents}.paste()`);
      await eventually(async () =>
        assert.equal(await evaluate(`${ws}.score.footnotes.length`), 1),
      );
      const pastedId = await evaluate(`${ws}.score.footnotes[0].id`);
      assert.notEqual(pastedId, id);
      assert.equal(await evaluate(`${ws}.score.footnotes[0].marker`), '\u2020');
      assert.equal(
        await evaluate(`${ws}.score.footnotes[0].staff.elements[0].spaceAfter`),
        37,
      );
      const importedStyle = await evaluate(
        `${ws}.score.paragraphStyles.find(style=>style.displayName==='Footnote lyrics')?.id`,
      );
      assert.ok(importedStyle);
      assert.equal(
        await evaluate(
          `${ws}.score.footnotes[0].staff.elements[0].lyricsParagraphStyleId`,
        ),
        importedStyle,
      );
      assert.equal(
        await evaluate(
          `${ws}.score.staff.elements[0].content.includes('data-neanes-footnote-body')`,
        ),
        false,
        'Clipboard payload must never enter saved content',
      );
      // Importing new paragraph-style definitions rebuilds CKEditor, as for
      // ordinary rich text. The complete paste remains one score transaction.
      await evaluate('document.activeElement.blur()');
      await menu('FileMenuUndo');
      await eventually(async () =>
        assert.equal(await evaluate(`${ws}.score.footnotes.length`), 0),
      );
      assert.ok(
        (await evaluate(`${ws}.score.staff.elements[0].content`)).includes(
          'pending',
        ),
        'Undoing paste preserves preceding typing',
      );
      await menu('FileMenuRedo');
      await eventually(async () =>
        assert.equal(await evaluate(`${ws}.score.footnotes[0]?.id`), pastedId),
      );
      await edit(targetArgs, [
        {
          action: 'insert',
          collection: { kind: 'footnote', footnoteId: pastedId },
          elements: [
            {
              elementType: 'RichTextBox',
              properties: { content: '<p>Body text</p>' },
            },
          ],
        },
      ]);
      const bodyEditor = `document.querySelector('[data-footnote-id="${pastedId}"] .rich-text-editor.single')?.ckeditorInstance`;
      await focus(bodyEditor);
      assert.equal(
        await evaluate(
          `${bodyEditor}.commands.get('insertFootnote').isEnabled`,
        ),
        false,
      );
      await main(`${nativeContents}.paste()`);
      await eventually(async () =>
        assert.ok(
          await evaluate(
            `document.body.textContent.includes('Footnote references can only be pasted')`,
          ),
        ),
      );
      assert.equal(
        await evaluate(`${bodyEditor}.getData()`),
        '<p>Body text</p>',
      );
      assert.equal(await evaluate(`${ws}.score.footnotes.length`), 1);
      await call('close_document', {
        ...targetArgs,
        expectedRevision: (await call('get_document_properties', targetArgs))
          .revision,
        discardUnsavedChanges: true,
      });
      console.log(
        'Real rich text clipboard: independent body, lyric style import, Undo/Redo passed.',
      );
    }
    await call('close_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      discardUnsavedChanges: true,
    });
    console.log(
      `Rich footnote ${name}: insert, navigate, delete, Undo/Redo with caret and range restoration, save/reopen, copy, layout passed.`,
    );
  }
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  await client?.close();
  await app.close();
}
