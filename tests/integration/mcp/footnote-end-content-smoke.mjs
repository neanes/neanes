// Launch outside the agent sandbox on macOS. Uses a disposable Electron profile.
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-footnote-end-content-');
let client;
try {
  app.start({ args: ['--remote-debugging-port=0', '--inspect=0'] });
  const socket = await app.debugger();
  const { evaluate } = socket;
  const { evaluate: main } = await app.debugger('main');
  const menu = (channel) =>
    main(
      `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('index.html')).webContents.send(${JSON.stringify(channel)})`,
    );
  await app.ready();
  client = await connectStdioClient('footnote-end-content', {
    profile: app.profile,
  });
  const call = createToolCaller(client, (await client.listTools()).tools);
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Footnote end of content',
  });
  const args = { documentScope: 'editor', documentId: doc.documentId };
  const properties = () => call('get_document_properties', args);
  const edit = async (actions) =>
    call('edit_elements', {
      ...args,
      expectedRevision: (await properties()).revision,
      actions,
    });
  const initial = await call('get_elements', args);
  const note = {
    elementType: 'Note',
    properties: { quantitativeNeume: 'Ison', lyrics: 'Chant' },
  };
  const text = {
    elementType: 'RichTextBox',
    properties: { content: '<p>A short explanation.</p>' },
  };
  await edit([
    { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
    {
      action: 'insert',
      elements: Array.from({ length: 5 }, (_, i) => ({
        ...note,
        clientId: `anchor${i}`,
      })),
    },
    ...[[text], [note], [text, note], [note, text], []].map((elements, i) => ({
      action: 'insert_footnote',
      elementRef: `@anchor${i}`,
      elements,
    })),
  ]);
  await call('get_pages', args);
  const ws = 'window._editor.selectedWorkspace.value';
  const geometry = () =>
    evaluate(`(() => {
    const w=${ws}; return w.score.footnotes.map((f,i,all) => {
      const label=id=>document.querySelector('.footnote-label[data-footnote-id="'+id+'"]');
      const top=f=>parseFloat(getComputedStyle(label(f.id)).top)/w.zoom;
      const lines=[...document.querySelectorAll('.line[data-footnote-id="'+f.id+'"]')];
      return {height:i+1<all.length ? top(all[i+1])-top(f) : f.staff.elements.at(-1).height,
        lines:lines.length,
        emptyBoxes:lines.reduce((sum,l)=>sum+l.querySelectorAll('.empty-neume-box').length,0),
        terminal:f.staff.elements.at(-1).elementType,
        terminalWidth:f.staff.elements.at(-1).width,
        terminalHeight:f.staff.elements.at(-1).height,
        contentHeight:f.staff.elements.slice(0,-1).reduce((h,e)=>h+e.height+(e.marginTop||0)+(e.marginBottom||0),0)};
    }); })()`);
  await eventually(async () => {
    const g = await geometry();
    assert.deepEqual(
      g.map((b) => b.lines),
      [1, 1, 2, 2, 1],
    );
    assert.deepEqual(
      g.map((b) => b.emptyBoxes),
      [0, 0, 0, 0, 1],
    );
    for (const b of g.slice(0, 4)) {
      assert.equal(b.terminal, 'Empty');
      assert.equal(b.terminalWidth, 0);
      assert.equal(b.terminalHeight, 0);
    }
    assert.ok(
      Math.abs(g[0].height - g[0].contentHeight) < 0.1,
      'Text-only height contains no music line',
    );
    assert.ok(g[4].height > 0, 'Empty body reserves its insertion target');
  });
  await main(
    `(() => {const w=process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('index.html'));w.show();w.focus();w.webContents.focus();})()`,
  );
  async function open(index) {
    await evaluate(
      `document.querySelectorAll('.footnote-reference')[${index}].parentElement.dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, button:2, clientX:200, clientY:150}))`,
    );
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `!![...document.querySelectorAll('[role="menuitem"]')].find(item => item.textContent.includes('Edit footnote'))`,
        ),
        true,
      ),
    );
    const point = await eventually(async () => {
      const result = await evaluate(`(() => {
        const item = [...document.querySelectorAll('[role="menuitem"]')].find(item => item.textContent.includes('Edit footnote'));
        const r = item.getBoundingClientRect();
        const x = r.x + r.width / 2, y = r.y + r.height / 2;
        return {x, y, hit: item.contains(document.elementFromPoint(x, y))};
      })()`);
      assert.ok(result.hit, 'Waiting for the edit menu item to receive clicks');
      return { x: result.x, y: result.y };
    });
    for (const type of ['mousePressed', 'mouseReleased']) {
      await socket.send('Input.dispatchMouseEvent', {
        type,
        ...point,
        button: 'left',
        clickCount: 1,
      });
    }
    await eventually(async () => {
      const state = await evaluate(`(() => {
        const workspace = ${ws};
        const target = workspace.score.footnotes[${index}].staff.elements.at(${index === 4 ? -1 : -2});
        const active = document.activeElement;
        const element = document.getElementById('element-' + target.id);
        return {
          selected: workspace.selectedElement === target,
          // Selection changes before the menu's deferred navigation focuses
          // the new editor. Focus in a previous footnote is not readiness.
          focused: target.elementType === 'RichTextBox'
            ? Boolean(element?.contains(active) && active?.isContentEditable)
            : !active?.isContentEditable,
          menuClosed: document.querySelector('[role="menu"][data-state="open"]') === null,
        };
      })()`);
      assert.deepEqual(state, {
        selected: true,
        focused: true,
        menuClosed: true,
      });
    });
  }
  async function key(key, code = key, windowsVirtualKeyCode = 0) {
    await socket.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code,
      windowsVirtualKeyCode,
    });
    await socket.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode,
    });
  }
  const types = () =>
    evaluate(`${ws}.activeStaff.elements.map(e=>e.elementType)`);
  await open(2);
  await open(3);
  await open(0);
  await key('Escape', 'Escape', 27);
  await key('End', 'End', 35);
  await eventually(async () =>
    assert.equal(await evaluate(`${ws}.selectedElement.elementType`), 'Empty'),
  );
  const beforeSelection = await geometry();
  assert.deepEqual(
    beforeSelection.map((b) => b.emptyBoxes),
    [0, 0, 0, 0, 1],
  );
  await key('ArrowLeft', 'ArrowLeft', 37);
  await eventually(async () =>
    assert.equal(
      await evaluate(`${ws}.selectedElement.elementType`),
      'RichTextBox',
    ),
  );
  await key('Escape', 'Escape', 27);
  // Auto music entry moves to the internal endpoint and appends after the text.
  await key('j', 'KeyJ', 74);
  await eventually(async () =>
    assert.deepEqual(await types(), ['RichTextBox', 'Note', 'Empty']),
  );
  await key('k', 'KeyK', 75);
  await eventually(async () =>
    assert.deepEqual(await types(), ['RichTextBox', 'Note', 'Note', 'Empty']),
  );
  // Insert mode after a final neume appends without replacing it.
  await evaluate(`${ws}.entryMode='Insert'; true`);
  await key('j', 'KeyJ', 74);
  await eventually(async () =>
    assert.deepEqual(await types(), [
      'RichTextBox',
      'Note',
      'Note',
      'Note',
      'Empty',
    ]),
  );
  await menu('FileMenuInsertTextBox');
  await eventually(async () =>
    assert.deepEqual(await types(), [
      'RichTextBox',
      'Note',
      'Note',
      'Note',
      'TextBox',
      'Empty',
    ]),
  );
  await menu('FileMenuInsertRichTextBox');
  await eventually(async () =>
    assert.deepEqual(await types(), [
      'RichTextBox',
      'Note',
      'Note',
      'Note',
      'TextBox',
      'RichTextBox',
      'Empty',
    ]),
  );
  // Delete final content repeatedly; an empty body restores the visible target.
  for (let remaining = 5; remaining >= 0; remaining--) {
    await evaluate('document.activeElement?.blur(); true');
    if (await evaluate(`${ws}.selectedElement.elementType === 'TextBox'`)) {
      await key('Tab', 'Tab', 9);
    } else {
      await key('End', 'End', 35);
    }
    await eventually(async () =>
      assert.equal(
        await evaluate(`${ws}.selectedElement.elementType`),
        'Empty',
      ),
    );
    await key('Backspace', 'Backspace', 8);
    await eventually(async () =>
      assert.equal((await types()).length, remaining + 1),
    );
  }
  await eventually(async () =>
    assert.equal((await geometry())[0].emptyBoxes, 1),
  );
  await menu('FileMenuUndo');
  await eventually(async () =>
    assert.deepEqual(await types(), ['RichTextBox', 'Empty']),
  );
  await eventually(async () =>
    assert.equal((await geometry())[0].emptyBoxes, 0),
  );
  await menu('FileMenuRedo');
  await eventually(async () => assert.deepEqual(await types(), ['Empty']));
  await open(4);
  await evaluate(`${ws}.entryMode='Auto'; true`);
  await key('j', 'KeyJ', 74);
  await eventually(async () =>
    assert.deepEqual(await types(), ['Note', 'Empty']),
  );
  await key('Delete', 'Delete', 46);
  await eventually(async () => assert.deepEqual(await types(), ['Empty']));
  await eventually(async () =>
    assert.equal((await geometry())[4].emptyBoxes, 1),
  );
  await menu('FileMenuUndo');
  await eventually(async () =>
    assert.deepEqual(await types(), ['Note', 'Empty']),
  );
  await evaluate('document.activeElement?.blur(); true');
  await key('End', 'End', 35);
  await eventually(async () =>
    assert.equal(await evaluate(`${ws}.selectedElement.elementType`), 'Empty'),
  );
  await key('Backspace', 'Backspace', 8);
  await eventually(async () => assert.deepEqual(await types(), ['Empty']));
  await eventually(async () =>
    assert.equal((await geometry())[4].emptyBoxes, 1),
  );
  // Main score retains its familiar empty staff regardless of footnote selection.
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.line:not([data-footnote-id]) .empty-neume-box').length",
    ),
    1,
  );
  const pages = await call('get_pages', args);
  const baseline = (await geometry()).map((b) => b.height);
  await open(1);
  await key('End', 'End', 35);
  assert.deepEqual(
    (await geometry()).map((b) => b.height),
    baseline,
    'Selection cannot change pagination',
  );
  assert.equal((await call('get_pages', args)).pageCount, pages.pageCount);
  const pdf = path.join(app.directory, 'end-content.pdf');
  await call('export_pdf', {
    ...args,
    expectedRevision: (await properties()).revision,
    filePath: pdf,
  });
  assert.ok((await stat(pdf)).size > 1000);
  assert.equal(
    (await readFile(pdf, 'latin1')).match(/\/Type\s*\/Page\b/g).length,
    pages.pageCount,
  );
  const preview = await call('preview_page', {
    ...args,
    expectedRevision: (await properties()).revision,
    pageNumber: 1,
  });
  assert.ok((await stat(preview.outputFilePath)).size > 1000);
  // A reference and text-only body fit on a deliberately tight page. A phantom
  // trailing music line would make this reference group overflow.
  for (const documentScope of ['private', 'editor']) {
    const tight = await call('create_document', {
      documentScope,
      title: 'Tight footnote page',
    });
    const target = { documentScope, documentId: tight.documentId };
    const props = () => call('get_document_properties', target);
    const current = await call('get_elements', target);
    await call('edit_elements', {
      ...target,
      expectedRevision: (await props()).revision,
      actions: [
        { action: 'remove_range', start: 0, end: current.collectionSize - 1 },
        { action: 'insert', elements: [{ ...note, clientId: 'tightAnchor' }] },
        {
          action: 'insert_footnote',
          elementRef: '@tightAnchor',
          elements:
            documentScope === 'private'
              ? [text]
              : [
                  {
                    elementType: 'TextBox',
                    properties: { content: 'A short explanation.' },
                  },
                ],
        },
      ],
    });
    const mainElements = await call('get_elements', target);
    const collection = {
      kind: 'footnote',
      footnoteId: mainElements.elements[0].properties.footnoteId,
    };
    const body = await call('get_elements', { ...target, collection });
    const box = body.elements[0].properties;
    const height = box.height + box.marginTop + box.marginBottom;
    await call('update_page_setup', {
      ...target,
      expectedRevision: (await props()).revision,
      changes: {
        pageSize: 'Custom',
        pageWidthCustom: 600,
        pageHeightCustom: 100 + 200 + height + 21,
        topMargin: 50,
        bottomMargin: 50,
        leftMargin: 50,
        rightMargin: 50,
        lineHeight: 200,
      },
    });
    const tightPages = await call('get_pages', target);
    assert.equal(
      tightPages.pageCount,
      1,
      'Only actual body content reserves page space',
    );
    assert.equal(
      tightPages.pages[0].lineCount,
      2,
      'One main line plus one body line',
    );
    const tightPdf = path.join(app.directory, `tight-${documentScope}.pdf`);
    await call('export_pdf', {
      ...target,
      expectedRevision: (await props()).revision,
      filePath: tightPdf,
    });
    assert.equal(
      (await readFile(tightPdf, 'latin1')).match(/\/Type\s*\/Page\b/g).length,
      1,
    );
  }
  console.log(
    'PASS: footnote content heights, hidden endpoints, reference focus, append/insert, keyboard navigation, deletion, undo/redo, and PDF/PNG export.',
  );
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  await client?.close();
  await app.close();
}
