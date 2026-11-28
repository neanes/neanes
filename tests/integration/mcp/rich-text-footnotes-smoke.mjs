// Launch outside the command sandbox on macOS. Uses a disposable Electron profile.
import assert from 'node:assert/strict';
import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';

import { checkRichTextHistory } from './richTextHistoryChecks.mjs';
import { checkRichTextScorePaste } from './richTextScorePasteChecks.mjs';
import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

async function checkFootnoteLineBreaks({ call, edit, evaluate }) {
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Rich footnote line breaks',
  });
  const args = { documentScope: 'editor', documentId: doc.documentId };
  const initial = await call('get_elements', args);
  const lines = [
    'Earlier words before',
    'alpha-alpha-alpha-alpha-alpha',
    'alpha&shy;alpha&shy;alpha&shy;alpha&shy;alpha',
    '春夏秋冬春夏秋冬春夏秋冬春夏秋冬',
    'Earlier words together',
    'Earlier words before&shy;',
    'Earlier words before&#8203;',
    'Earlier words before<span style="white-space: pre-wrap">   </span>',
    'Earlier words <span class="neanes-ck-neume" neumetype="single" neume="Ison"></span>',
  ];
  const groupIndex = 4;
  const content = lines
    .map((line, index) => `<p>${line}${index > groupIndex ? ' after' : ''}</p>`)
    .join('');
  const offsets = lines.map((line) => content.indexOf(line) + line.length);
  await edit(args, [
    { action: 'remove_range', start: 0, end: initial.collectionSize },
    {
      action: 'insert',
      elements: [
        {
          elementType: 'RichTextBox',
          clientId: 'wrap',
          properties: { content },
        },
      ],
    },
    ...[...offsets, offsets[groupIndex]]
      .sort((a, b) => b - a)
      .map((htmlOffset) => ({
        action: 'insert_footnote',
        elementRef: '@wrap',
        contentKey: 'content',
        htmlOffset,
        elements: [{ elementType: 'Note' }],
      })),
  ]);
  await eventually(async () =>
    assert.equal(
      await evaluate(
        "document.querySelectorAll('.page .neanes-footnote').length",
      ),
      lines.length + 1,
    ),
  );
  const result = await evaluate(`(async () => {
    await document.fonts.ready;
    const markers = [...document.querySelectorAll('.page .neanes-footnote')];
    const paragraphs = [...new Set(markers.map(marker => marker.closest('p')))];
    const editor = markers[0].closest('.rich-text-editor').ckeditorInstance;
    function measure(paragraph) {
      const marker = paragraph.querySelector('.neanes-footnote');
      const wrapper = marker.closest('.neanes-footnote-nowrap');
      const text = document.createRange();
      text.selectNodeContents(wrapper.firstChild);
      const textTop = text.getBoundingClientRect().top;
      return {
        textTop,
        markerOffset: marker.getBoundingClientRect().top - textTop,
        height: paragraph.getBoundingClientRect().height,
        overflow: paragraph.scrollWidth > paragraph.clientWidth + 1,
      };
    }
    function measureOrphan(paragraph, wide) {
      for (let width = paragraph.clientWidth; width > 10; width--) {
        paragraph.style.width = width + 'px';
        const trial = measure(paragraph);
        if (trial.markerOffset > wide.markerOffset + 2) {
          return trial;
        }
      }
    }
    const groupIndex = ${groupIndex};
    const [ordinary, ...breakable] = paragraphs.slice(0, groupIndex);
    ordinary.style.width = '600px';
    const wide = measure(ordinary);
    const wrapper = ordinary.querySelector('.neanes-footnote-nowrap');
    wrapper.style.textWrapMode = 'wrap';
    const orphan = measureOrphan(ordinary, wide);
    wrapper.style.removeProperty('text-wrap-mode');
    const joined = measure(ordinary);
    const wordStart = document.createRange();
    const precedingText = wrapper.previousSibling;
    const wordOffset = precedingText.data.lastIndexOf(' ');
    wordStart.setStart(precedingText, wordOffset + 1);
    wordStart.setEnd(precedingText, wordOffset + 2);
    const wordStartTop = wordStart.getBoundingClientRect().top;
    const wraps = breakable.map(paragraph => {
      paragraph.style.width = '600px';
      const wide = measure(paragraph);
      paragraph.style.width = '80px';
      const narrow = measure(paragraph);
      return { wide, narrow };
    });
    const anchors = paragraphs.slice(groupIndex + 1).map(paragraph => {
      paragraph.style.width = '600px';
      const wide = measure(paragraph);
      const marker = paragraph.querySelector('.neanes-footnote');
      const wrapper = marker.closest('.neanes-footnote-nowrap');
      const anchor = wrapper.firstChild;
      const gap = wrapper.querySelector('[style*="white-space"]');
      const spaceCollapse = gap && getComputedStyle(gap).whiteSpaceCollapse;
      const spaces = gap?.textContent.length;
      wrapper.style.textWrapMode = 'wrap';
      gap?.style.setProperty('text-wrap-mode', 'wrap', 'important');
      const orphan = measureOrphan(paragraph, wide);
      wrapper.style.removeProperty('text-wrap-mode');
      gap?.style.removeProperty('text-wrap-mode');
      return { wide, orphan, joined: measure(paragraph), anchorText: anchor.textContent,
        neume: anchor instanceof HTMLElement && anchor.classList.contains('neanes-ck-neume'),
        spaceCollapse, spaces };
    });
    const root = editor.model.document.getRoot();
    const group = root.getChild(groupIndex);
    const second = [...group.getChildren()].filter(node => node.is('element', 'footnoteReference'))[1];
    const groupParagraph = paragraphs[groupIndex];
    const wrappedCount = () => groupParagraph
      .querySelectorAll('.neanes-footnote-nowrap .neanes-footnote').length;
    const separators = [' ', String.fromCodePoint(0x200b), String.fromCodePoint(0xad)];
    const separated = separators.map(separator => {
      editor.model.change(writer => writer.insertText(separator, group, second.startOffset));
      const wrapper = groupParagraph.querySelector('.neanes-footnote-nowrap');
      const [left, right] = groupParagraph.querySelectorAll('.neanes-footnote');
      const sameLine = () => Math.abs(left.getBoundingClientRect().top - right.getBoundingClientRect().top) < 2;
      const count = wrappedCount();
      wrapper.style.textWrapMode = 'wrap';
      for (let width = 600; width > 10; width--) {
        groupParagraph.style.width = width + 'px';
        if (!sameLine()) break;
      }
      const split = !sameLine();
      wrapper.style.removeProperty('text-wrap-mode');
      const joined = sameLine();
      editor.execute('undo');
      return { count, split, joined };
    });
    editor.model.change(writer => writer.insertElement('softBreak', group, second.startOffset));
    const explicitBreak = wrappedCount();
    const neume = [...root.getChild(paragraphs.length - 1).getChildren()]
      .find(node => node.is('element', 'neume'));
    editor.model.change(writer => writer.setAttribute('alignRight', true, neume));
    const wrapsAlignedNeume = !!paragraphs.at(-1).querySelector('.neanes-footnote-nowrap');
    return { wide, orphan, joined, wordStartTop, wraps, anchors, separated, explicitBreak, wrapsAlignedNeume };
  })()`);
  assert.ok(result.orphan, 'The old break can strand an ordinary marker');
  assert.ok(result.joined.textTop > result.orphan.textTop);
  assert.equal(result.joined.textTop, result.wordStartTop);
  assert.equal(result.joined.markerOffset, result.wide.markerOffset);
  for (const [index, { wide, narrow }] of result.wraps.entries()) {
    const label = lines[index + 1];
    assert.ok(narrow.height > wide.height, label);
    assert.ok(!narrow.overflow, label);
    assert.equal(narrow.markerOffset, wide.markerOffset, label);
  }
  for (const [index, label] of [
    'space',
    'zero-width space',
    'soft hyphen',
  ].entries()) {
    assert.deepEqual(
      result.separated[index],
      { count: 2, split: true, joined: true },
      label,
    );
  }
  assert.equal(result.explicitBreak, 1, 'An explicit line break ends the run');
  for (const [index, { wide, orphan, joined }] of result.anchors.entries()) {
    const label = lines[groupIndex + 1 + index];
    assert.ok(orphan, label);
    assert.equal(joined.markerOffset, wide.markerOffset, label);
  }
  assert.equal(result.anchors[0].anchorText, 'e\u00ad');
  assert.equal(result.anchors[1].anchorText, 'e\u200b');
  assert.equal(result.anchors[2].spaceCollapse, 'preserve');
  assert.equal(result.anchors[2].spaces, 3);
  assert.ok(result.anchors[3].neume);
  assert.ok(!result.wrapsAlignedNeume);
  const malformedIds = await evaluate(`(async () => {
    const active = document.querySelector('.page .rich-text-editor').ckeditorInstance;
    const editor = await active.constructor.create('', {
      licenseKey: active.config.get('licenseKey'),
      fontSize: active.config.get('fontSize'),
    });
    try {
      const reference = '<span class="neanes-footnote" data-footnote-id="75d4d7b3-7561-41fe-a6d3-e8c53f4a3bc1"></span>';
      editor.setData('<p>First' + reference + '</p><p>Second' + reference + '</p>');
      const editable = editor.ui.getEditableElement();
      const wrapperParagraphs = () => [...editable.querySelectorAll('.neanes-footnote-nowrap')]
        .map(wrapper => wrapper.closest('p').textContent);
      const duplicateCount = editable.querySelectorAll('.neanes-footnote').length;
      const duplicateWraps = wrapperParagraphs();
      const root = editor.model.document.getRoot();
      editor.model.change(writer => writer.remove(root.getChild(0)));
      const remainingWraps = wrapperParagraphs();
      editor.setData('<p>First</p><p>Second</p>');
      // The HTML upcast requires the ID attribute. Insert missing IDs at the
      // model level to verify the post-fixer can also handle them.
      editor.model.change(writer => {
        for (const paragraph of root.getChildren()) {
          writer.appendElement('footnoteReference', paragraph);
        }
      });
      const missingCount = editable.querySelectorAll('.neanes-footnote').length;
      return { duplicateCount, duplicateWraps, remainingWraps, missingCount, missingWraps: wrapperParagraphs() };
    } finally {
      await editor.destroy();
    }
  })()`);
  assert.deepEqual(malformedIds, {
    duplicateCount: 2,
    duplicateWraps: ['First?'],
    remainingWraps: ['Second?'],
    missingCount: 2,
    missingWraps: [],
  });
  await call('close_document', {
    ...args,
    expectedRevision: (await call('get_document_properties', args)).revision,
    discardUnsavedChanges: true,
  });
}

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
  async function click(selector, clickCount = 1) {
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `document.querySelector(${JSON.stringify(selector)}) !== null`,
        ),
        true,
      ),
    );
    await evaluate(
      `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center', inline:'center'})`,
    );
    const point = await eventually(async () => {
      const result = await evaluate(`(async () => {
        // Wait for scrolling and layout to reach Chromium's rendered frame
        // before sending pointer coordinates through the debugger connection.
        await new Promise(resolve => requestAnimationFrame(resolve));
        const n = document.querySelector(${JSON.stringify(selector)});
        const before = n.getBoundingClientRect();
        await new Promise(resolve => requestAnimationFrame(resolve));
        const r = n.getBoundingClientRect();
        const x = r.x + r.width / 2, y = r.y + r.height / 2;
        const hit = document.elementFromPoint(x, y);
        let settled = true;
        for (let p = n; p; p = p.parentElement) {
          if (p.getAnimations().some(a => a.playState === 'running')) settled = false;
        }
        return {
          x, y, hit: n.contains(hit), settled, disabled: n.matches(':disabled'),
          stable: n.isConnected && ['x', 'y', 'width', 'height'].every(key => Math.abs(before[key] - r[key]) < 0.01),
          hitElement: hit?.outerHTML.slice(0, 400),
        };
      })()`);
      assert.ok(
        result.hit && result.stable && result.settled && !result.disabled,
        `Waiting for ${selector} to receive pointer events: ${JSON.stringify(result)}`,
      );
      return { x: result.x, y: result.y };
    });
    for (const type of ['mousePressed', 'mouseReleased']) {
      await socket.send('Input.dispatchMouseEvent', {
        type,
        ...point,
        button: 'left',
        clickCount,
      });
    }
  }
  await checkRichTextScorePaste({ call, evaluate, menu });
  await checkFootnoteLineBreaks({ call, edit, evaluate });
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
      { action: 'remove_range', start: 0, end: initial.collectionSize },
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
    await evaluate(
      `${e}.execute('fontSize', {value:'24pt'});${e}.execute('fontColor', {value:'#112233'})`,
    );
    try {
      await click('[data-testid="insert-rich-text-footnote"]');
      await eventually(async () =>
        assert.equal(await evaluate(`${ws}.score.footnotes.length`), 1),
      );
    } catch (error) {
      console.error(
        await evaluate(
          `(() => {const e=${e};return {selected:${ws}.selectedElement?.elementType, active:${ws}.activeFootnoteId, state:e.state, focus:e.ui.focusTracker.isFocused, focusedElement:document.activeElement?.outerHTML.slice(0,500), command:e.commands.get('insertFootnote').isEnabled, selection:e.model.document.selection.focus?.path, html:e.getData(), owner:${ws}.score.staff.elements[0].elementType};})()`,
        ),
      );
      throw error;
    }
    const id = await evaluate(`${ws}.score.footnotes[0].id`);
    const markerAttributes = await evaluate(
      `(() => {const e=${e};const n=[...e.model.createRangeIn(e.model.document.getRoot()).getItems()].find(n=>n.is('element','footnoteReference'));return Object.fromEntries(n.getAttributes());})()`,
    );
    assert.equal(markerAttributes.superscript, undefined);
    assert.equal(markerAttributes.fontSize, '24pt');
    assert.equal(markerAttributes.fontColor, '#112233');

    assert.equal(
      await evaluate(`${ws}.score.footnotes[0].staff.elements[0].elementType`),
      'RichTextBox',
    );
    assert.match(
      await evaluate(`${ws}.score.footnotes[0].staff.elements[0].content`),
      /neanes-paragraph-style-footnote-text/,
    );
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `document.querySelector('.page [data-footnote-id="${id}"] .rich-text-editor')?.ckeditorInstance?.ui.focusTracker.isFocused`,
        ),
        true,
      ),
    );

    assert.equal(
      await evaluate(`${ws}.activeFootnoteId`),
      id,
      'Insertion navigates to the body',
    );
    assert.match(
      await evaluate(`${ws}.score.staff.elements[0][${JSON.stringify(key)}]`),
      /Before[\s\S]*data-footnote-id=/,
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
    assert.deepEqual(
      await evaluate(`(() => {
        const marker = document.querySelector('.page .neanes-footnote');
        const wrapper = marker.closest('.neanes-footnote-nowrap');
        return wrapper && { text: wrapper.textContent, wrapMode: getComputedStyle(wrapper).textWrapMode };
      })()`),
      { text: 'e1', wrapMode: 'nowrap' },
      'Only the end of the word and the rendered marker share a no-wrap span',
    );
    assert.doesNotMatch(
      await evaluate(`${e}.getData()`),
      /neanes-footnote-nowrap/,
    );
    await click('.page .neanes-footnote');
    await evaluate('new Promise(resolve => setTimeout(resolve, 0))');
    assert.equal(
      await evaluate(`${e}.ui.focusTracker.isFocused`),
      true,
      'A single click keeps focus in the rich text editor',
    );
    await click('.page .neanes-footnote', 2);
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
      0,
      'Marker deletion removes its body immediately',
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
    // Blur preserves native history; reinstating the marker restores its retained body.
    await focus(e);
    assert.equal(await evaluate(`${e}.commands.get('undo').isEnabled`), true);
    assert.equal(await evaluate(`${e}.commands.get('redo').isEnabled`), false);
    await evaluate(`${e}.execute('undo')`);
    await eventually(async () => {
      assert.equal(await evaluate(`${ws}.score.footnotes[0]?.id`), id);
      assert.equal((await evaluate(`${e}.getData()`)).includes(id), true);
    });
    await evaluate(`${e}.execute('redo')`);
    await eventually(async () =>
      assert.equal(await evaluate(`${ws}.score.footnotes.length`), 0),
    );
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
      await evaluate(
        `${ws}.score.footnotes[0].staff.elements.find(e=>e.elementType==='Note').spaceAfter`,
      ),
      37,
    );
    assert.equal(
      await evaluate(
        `${ws}.score.footnotes[0].staff.elements.find(e=>e.elementType==='Note').lyricsParagraphStyleId`,
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
    assert.equal(
      saved.footnotes[0].staff.elements.find((e) => e.elementType === 'Note')
        .spaceAfter,
      37,
    );
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
    assert.equal(
      body.elements.find((element) => element.elementType === 'Note').properties
        .spaceAfter,
      37,
    );
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
          end: initialTarget.collectionSize,
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
        await evaluate(
          `${ws}.score.footnotes[0].staff.elements.find(e=>e.elementType==='Note').spaceAfter`,
        ),
        37,
      );
      const importedStyle = await evaluate(
        `${ws}.score.paragraphStyles.find(style=>style.displayName==='Footnote lyrics')?.id`,
      );
      assert.ok(importedStyle);
      assert.equal(
        await evaluate(
          `${ws}.score.footnotes[0].staff.elements.find(e=>e.elementType==='Note').lyricsParagraphStyleId`,
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
      const bodyEditor = `[...document.querySelectorAll('[data-footnote-id="${pastedId}"] .rich-text-editor.single')].at(-1)?.ckeditorInstance`;
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
      await call('update_page_setup', {
        ...targetArgs,
        expectedRevision: (await call('get_document_properties', targetArgs))
          .revision,
        changes: { footnoteNumbering: 'page' },
      });
      await edit(targetArgs, [
        { action: 'update_footnote', footnoteId: pastedId, marker: null },
      ]);
      const targetEditor = editorFor('single');
      await focus(targetEditor);
      const targetHeight = () =>
        evaluate(`${ws}.score.staff.elements[0].height`);
      const previousHeight = await targetHeight();
      await socket.send('Input.insertText', { text: ' ordinary'.repeat(70) });
      await eventually(async () =>
        assert.ok((await targetHeight()) > previousHeight),
      );
      const layout = () =>
        evaluate(`JSON.stringify(${ws}.score.staff.elements.map(
        ({ page, line, height }) => [page, line, height],
      ))`);
      await evaluate(`(() => {
        const editor = ${targetEditor};
        const marker = [...editor.model.createRangeIn(editor.model.document.getRoot()).getItems()]
          .find(item => item.is('element', 'footnoteReference'));
        editor.model.change(writer => writer.setSelection(marker, 'on'));
        editor.editing.view.forceRender();
      })()`);
      await main(`${nativeContents}.copy()`);
      await eventually(async () =>
        assert.match(
          await main(
            `(async () => {const items=await process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').clipboard.read(); const item=items.find(i=>i.types.includes('text/html')); return item ? (await item.getType('text/html')).text() : '';})()`,
          ),
          /data-neanes-footnote-body=/,
        ),
      );
      await focus(targetEditor);
      await evaluate(`(() => {
        const editor = ${targetEditor};
        editor.model.change(writer => {
          const position = editor.model.document.selection.getFirstPosition();
          writer.insertText(' buffered', position);
          writer.setSelection(position.getShiftedBy(' buffered'.length));
        });
        editor.editing.view.forceRender();
      })()`);
      const beforePaste = await layout();
      await main(`(() => {
        globalThis.footnotePasteErrors = [];
        globalThis.recordFootnotePasteError = ({message}) => {
          if (message.includes('INVALID_FOOTNOTE_REFERENCE')) {
            globalThis.footnotePasteErrors.push(message);
          }
        };
        ${nativeContents}.on('console-message', globalThis.recordFootnotePasteError);
      })()`);
      await main(`${nativeContents}.paste()`);
      const stagedId = await eventually(async () => {
        const html = await evaluate(`${targetEditor}.getData()`);
        const ids = [...html.matchAll(/data-footnote-id="([^"]+)"/g)].map(
          (match) => match[1],
        );
        assert.equal(ids.length, 2);
        return ids.find((id) => id !== pastedId);
      });
      // Let the live-layout debounce run while the pasted body is still staged.
      await evaluate('new Promise(resolve => setTimeout(resolve, 400))');
      assert.equal(await evaluate(`${ws}.score.footnotes.length`), 1);
      assert.equal(await layout(), beforePaste);
      assert.equal(
        await evaluate(`${targetEditor}.ui.focusTracker.isFocused`),
        true,
      );
      await evaluate(`${targetEditor}.execute('undo')`);
      await evaluate('document.activeElement.blur()');
      await eventually(async () => {
        const html = await evaluate(`${ws}.score.staff.elements[0].content`);
        assert.match(html, /buffered/);
        assert.ok(!html.includes(stagedId));
        assert.equal(await evaluate(`${ws}.score.footnotes.length`), 1);
      });
      await focus(targetEditor);
      await evaluate(`${targetEditor}.execute('redo')`);
      assert.ok(
        (await evaluate(`${targetEditor}.getData()`)).includes(stagedId),
      );
      await evaluate('document.activeElement.blur()');
      await eventually(async () => {
        assert.equal(await evaluate(`${ws}.score.footnotes.length`), 2);
        assert.equal(
          await evaluate(
            `${ws}.score.staff.elements[0].footnoteMarkers[${JSON.stringify(stagedId)}]?.label`,
          ),
          '2',
        );
      });
      assert.match(
        await evaluate(`${ws}.score.staff.elements[0].content`),
        /buffered/,
      );
      assert.deepEqual(
        await main(`(() => {
          ${nativeContents}.off('console-message', globalThis.recordFootnotePasteError);
          return globalThis.footnotePasteErrors;
        })()`),
        [],
      );
      console.log(
        'Page-restarted rich-text paste: typing settles while focused and the staged footnote settles after blur.',
      );
      await focus(targetEditor);
      await evaluate(`${targetEditor}.execute('insertFootnote')`);
      await eventually(async () => {
        const active = await evaluate(`${ws}.activeFootnoteId`);
        assert.ok(active && active !== pastedId && active !== stagedId);
        assert.equal(
          await evaluate(
            `document.getElementById(${JSON.stringify(`footnote-${active}`)})?.isConnected`,
          ),
          true,
        );
      });
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
