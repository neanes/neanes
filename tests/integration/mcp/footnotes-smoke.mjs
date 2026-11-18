// Launch with unsandboxed execution on macOS; all app data is disposable.
import assert from 'node:assert/strict';
import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';

import { checkFootnoteMarkers } from './footnoteMarkerChecks.mjs';
import { createSmokeApp } from './smokeApp.mjs';
import {
  closeDocument,
  connectStdioClient,
  createToolCaller,
} from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-footnotes-', { keepArtifacts: true });
let client;
try {
  app.start({ args: ['--remote-debugging-port=0', '--inspect=0'] });
  const { evaluate, send } = await app.debugger();
  const { evaluate: evaluateMain } = await app.debugger('main');
  await app.ready();
  client = await connectStdioClient('footnotes-smoke', {
    profile: app.profile,
  });
  const call = createToolCaller(client, (await client.listTools()).tools);
  const { guide } = await call('get_rich_text_format', {
    topics: ['footnotes'],
  });
  assert.ok(guide.includes('insert_footnote'));
  assert.ok(guide.includes('footnotePositionOverride:true'));
  for (const documentScope of ['private', 'editor']) {
    const probe = await call('create_document', {
      documentScope,
      title: 'Compact footnote references',
    });
    const probeArgs = { documentScope, documentId: probe.documentId };
    const created = await call('edit_elements', {
      ...probeArgs,
      expectedRevision: probe.revision,
      actions: [
        {
          action: 'insert',
          elements: [
            {
              elementType: 'RichTextBox',
              clientId: 'box',
              properties: {
                inline: true,
                content: '<p>Top</p>',
                contentBottom: '<p>Bottom</p>',
              },
            },
          ],
        },
        {
          action: 'insert_footnote',
          elementRef: '@box',
          contentKey: 'content',
          htmlOffset: 3,
        },
        {
          action: 'insert_footnote',
          elementRef: '@box',
          contentKey: 'contentBottom',
          htmlOffset: 3,
        },
      ],
    });
    assert.deepEqual(
      created.createdFootnotes.map((reference) => reference.contentKey),
      ['content', 'contentBottom'],
    );
    const projected = await call('find_elements', {
      ...probeArgs,
      properties: ['footnoteReferences'],
      where: { field: 'footnoteReferences', op: 'isNotNull' },
    });
    assert.equal(projected.elements.length, 1);
    assert.deepEqual(projected.elements[0].properties, {
      footnoteReferences: created.createdFootnotes.map(
        ({ footnoteId, contentKey }) => ({ footnoteId, contentKey }),
      ),
    });
    for (const reference of created.createdFootnotes) {
      assert.equal(reference.elementRef, projected.elements[0].elementRef);
    }
    await call('edit_elements', {
      ...probeArgs,
      expectedRevision: projected.revision,
      actions: [
        {
          action: 'update_footnote',
          footnoteId: created.createdFootnotes[0].footnoteId,
          marker: '*',
        },
      ],
    });
    const probeBody = await call('get_elements', {
      ...probeArgs,
      collection: {
        kind: 'footnote',
        footnoteId: created.createdFootnotes[0].footnoteId,
      },
      properties: [],
    });
    assert.equal(probeBody.footnote.marker, '*');
    await closeDocument(call, probeArgs);
    let doc = await call('create_document', {
      documentScope,
      title: 'Footnote proof of concept',
    });
    const args = { documentScope, documentId: doc.documentId };
    await call(
      'edit_elements',
      {
        ...args,
        expectedRevision: doc.revision,
        actions: [
          {
            action: 'update_footnote',
            footnoteId: '00000000-0000-4000-8000-000000000001',
            marker: '*',
          },
        ],
      },
      'INVALID_FOOTNOTE_REFERENCE',
    );
    assert.equal(
      (await call('get_document_properties', args)).revision,
      doc.revision,
      'Invalid footnote edits leave the document unchanged',
    );
    const edit = async (actions) => {
      const current = await call('get_document_properties', args);
      return call('edit_elements', {
        ...args,
        expectedRevision: current.revision,
        actions,
      });
    };
    const spacing = {
      footnoteSpaceAboveRule: 10,
      footnoteSpaceBelowRule: 4,
      footnoteRuleThickness: 1,
      footnoteRuleColor: '#800000',
    };
    doc = await call('update_page_setup', {
      ...args,
      expectedRevision: doc.revision,
      changes: {
        ...spacing,
        pageSize: 'Custom',
        pageWidthCustom: 600,
        pageHeightCustom: 900,
        topMargin: 50,
        bottomMargin: 50,
        leftMargin: 50,
        rightMargin: 50,
        lineHeight: 70,
        firstFootnoteNumber: 98,
        footnoteHorizontalRuleLength: 40,
      },
    });
    const { settings } = await call('get_page_setup', args);
    for (const [key, value] of Object.entries(spacing)) {
      assert.equal(settings[key], value);
    }
    const existing = await call('get_elements', args);
    const notes = Array.from({ length: 15 }, (_, index) => ({
      elementType: 'Note',
      clientId: `n${index}`,
      properties: {
        quantitativeNeume: 'Ison',
        lyrics: `Main ${index}`,
        lineBreak: index % 3 === 2,
      },
    }));
    const inserted = await edit([
      { action: 'remove_range', start: 0, end: existing.collectionSize - 1 },
      { action: 'insert', elements: notes },
      {
        action: 'insert_footnote',
        elementRef: '@n0',
        elements: [
          {
            elementType: 'TextBox',
            clientId: 'explanation',
            properties: {
              content: 'An explanation with chant below.',
              lineBreak: true,
            },
          },
          {
            elementType: 'Note',
            properties: {
              quantitativeNeume: 'Oligon',
              lyrics: 'First',
              lineBreak: true,
            },
          },
          {
            elementType: 'Note',
            properties: { quantitativeNeume: 'Ison', lyrics: 'Second' },
          },
        ],
      },
      {
        action: 'insert_footnote',
        elementRef: '@n1',
        elements: [
          {
            elementType: 'Note',
            properties: {
              quantitativeNeume: 'Ison',
              lyrics: 'Another footnote',
            },
          },
        ],
      },
    ]);
    const footerActions = [];
    for (const variant of [
      'default',
      'firstPage',
      'odd',
      'even',
      'chapterOpening',
    ]) {
      const footer = await call('get_elements', {
        ...args,
        collection: { kind: 'footers', variant },
      });
      footerActions.push({
        action: 'update',
        elementRef: footer.elements[0].elementRef,
        elementType: 'TextBox',
        properties: { contentCenter: 'Footer below the footnotes' },
      });
    }
    await edit(footerActions);
    const footerRevision = await call('get_document_properties', args);
    await call('update_header_footer_settings', {
      ...args,
      expectedRevision: footerRevision.revision,
      changes: { showFooter: true, footerMargin: 15 },
    });
    let main = await call('get_elements', args);
    const anchors = main.elements.slice(0, 2);
    assert.deepEqual(
      inserted.createdFootnotes,
      anchors.map((anchor) => ({
        footnoteId: anchor.properties.footnoteId,
        elementRef: anchor.elementRef,
      })),
    );
    assert.deepEqual(
      anchors.map((entry) => entry.properties.footnoteNumber),
      [98, 99],
    );
    const bodySelector = {
      kind: 'footnote',
      footnoteId: anchors[0].properties.footnoteId,
    };
    let body = await call('get_elements', {
      ...args,
      collection: bodySelector,
      includeContent: true,
    });
    assert.deepEqual(
      body.elements.map((entry) => entry.elementType),
      ['TextBox', 'Note', 'Note', 'Empty'],
    );
    const otherBody = await call('get_elements', {
      ...args,
      collection: {
        kind: 'footnote',
        footnoteId: anchors[1].properties.footnoteId,
      },
    });
    assert.notDeepEqual(
      body.elements[1].properties.scaleNotes,
      anchors[0].properties.scaleNotes,
    );
    assert.deepEqual(
      otherBody.elements[0].properties.scaleNotes,
      anchors[0].properties.scaleNotes,
    );
    const footnoteLyrics = await call('get_staff_lyrics', {
      ...args,
      collection: bodySelector,
    });
    assert.equal(footnoteLyrics.locked, false);
    assert.ok(footnoteLyrics.text.includes('First'));
    const bodyTextRef = inserted.created.find(
      (entry) => entry.clientId === 'explanation',
    ).elementRef;
    const beforeMain = main.elements.map((entry) => entry.properties.lyrics);
    if (documentScope === 'editor') {
      await eventually(async () => {
        assert.equal(
          await evaluate(
            `document.querySelectorAll('.footnote-reference').length`,
          ),
          2,
        );
        assert.equal(
          await evaluate(
            `getComputedStyle(document.querySelector('.footnote-rule')).borderTopColor`,
          ),
          'rgb(128, 0, 0)',
        );
      });
      await send('Emulation.setEmulatedMedia', {
        features: [{ name: 'forced-colors', value: 'active' }],
      });
      try {
        await eventually(async () => {
          const colors = await evaluate(`(() => {
            const rule = document.querySelector('.footnote-rule');
            const probe = document.createElement('span');
            probe.style.cssText = 'forced-color-adjust:none;color:CanvasText;background:Canvas';
            rule.append(probe);
            const { color: text, backgroundColor: canvas } = getComputedStyle(probe);
            const { borderTopColor: separator, borderTopWidth: width } = getComputedStyle(rule);
            probe.remove();
            return { text, canvas, separator, width };
          })()`);
          assert.equal(colors.separator, colors.text);
          assert.notEqual(colors.separator, colors.canvas);
          assert.ok(parseFloat(colors.width) > 0);
        });
      } finally {
        await send('Emulation.setEmulatedMedia', { features: [] });
      }
      await evaluateMain(
        `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/index.html')).webContents.send('FileMenuViewPaneVisibility', {paneId:'lyrics', visible:true})`,
      );
      await eventually(async () =>
        assert.equal(
          await evaluate(`!!document.getElementById('lyrics-pane-text')`),
          true,
        ),
      );
      const mainLyricsLabel = await evaluate(
        `document.querySelector('label[for="lyrics-pane-text"]').textContent.trim()`,
      );
      assert.equal(
        await evaluate(`(() => {
          const marker = document.querySelector('.footnote-reference');
          marker.click();
          const style = getComputedStyle(marker);
          const rect = marker.getBoundingClientRect();
          return style.pointerEvents === 'none' && style.userSelect === 'none' && style.cursor === 'default'
            && document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) !== marker
            && !document.querySelector('[role="menu"][data-state="open"]')
            && marker.tagName === 'SPAN' && marker.tabIndex === -1
            && window._editor.selectedWorkspace.value.activeFootnoteId === null;
        })()`),
        true,
        'Neume footnote markers are non-interactive',
      );
      await evaluate(
        `document.querySelector('.footnote-reference').parentElement.dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, button:2, clientX:200, clientY:150}))`,
      );
      await eventually(async () =>
        assert.equal(
          await evaluate(
            `!![...document.querySelectorAll('[role="menuitem"]')].find(item => item.textContent.includes('Edit footnote'))`,
          ),
          true,
        ),
      );
      await evaluate(
        `[...document.querySelectorAll('[role="menuitem"]')].find(item => item.textContent.includes('Edit footnote')).click()`,
      );
      assert.equal(
        await evaluate(
          `window._editor.selectedWorkspace.value.activeFootnoteId`,
        ),
        bodySelector.footnoteId,
      );
      await eventually(async () => {
        assert.equal(
          await evaluate(
            `document.querySelector('label[for="lyrics-pane-text"]').textContent.trim()`,
          ),
          'Footnote 98 Lyrics',
        );
      });
      assert.ok(
        (
          await evaluate(`document.getElementById('lyrics-pane-text').value`)
        ).includes('First'),
      );
      await evaluate(`document.getElementById('lyrics-pane-locked').click()`);
      assert.deepEqual(
        await evaluate(
          `(() => { const w=window._editor.selectedWorkspace.value; return [w.score.staff.lyrics.locked, w.score.footnotes[0].staff.lyrics.locked]; })()`,
        ),
        [false, true],
      );
      await evaluate(`document.getElementById('lyrics-pane-locked').click()`);
      assert.deepEqual(
        await evaluate(`(async () => {
        const text = document.getElementById('lyrics-pane-text');
        text.value = 'Changed words';
        text.dispatchEvent(new Event('input', {bubbles:true}));
        // Let the textarea's Vue model emit, before the assignment timer runs.
        await Promise.resolve();
        const typedLyrics = window._editor.selectedWorkspace.value.activeStaff.lyrics.text;
        document.activeElement?.blur();
        const shortcut = new KeyboardEvent('keydown', {
          code: 'KeyZ', key: 'z', ctrlKey: true, metaKey: true,
          bubbles: true, cancelable: true,
        });
        window.dispatchEvent(shortcut);
        return { typedLyrics, handled: shortcut.defaultPrevented };
      })()`),
        { typedLyrics: 'Changed words', handled: true },
      );
      await eventually(async () => {
        assert.equal(
          await evaluate(
            `window._editor.selectedWorkspace.value.score.footnotes[0].staff.lyrics.locked`,
          ),
          false,
        );
        assert.ok(
          (
            await call('get_staff_lyrics', {
              ...args,
              collection: bodySelector,
            })
          ).text.includes('First'),
        );
      });

      await evaluateMain(
        `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/index.html')).webContents.send('FileMenuRedo')`,
      );
      await eventually(async () => {
        assert.ok(
          (
            await call('get_staff_lyrics', {
              ...args,
              collection: bodySelector,
            })
          ).text.includes('Changed'),
        );
      });
      await evaluateMain(
        `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/index.html')).webContents.send('FileMenuUndo')`,
      );
      await eventually(async () => {
        assert.ok(
          (
            await call('get_staff_lyrics', {
              ...args,
              collection: bodySelector,
            })
          ).text.includes('First'),
        );
      });
      await evaluate(
        `document.querySelector('[data-footnote-id="${bodySelector.footnoteId}"] .text-box').focus()`,
      );
      await evaluate(`(() => {
        const box = document.querySelector('[data-footnote-id="${bodySelector.footnoteId}"] .text-box');
        box.innerText = 'Edited footnote text';
        box.dispatchEvent(new FocusEvent('blur'));
      })()`);
      await eventually(async () => {
        assert.equal(
          (
            await call('get_element_content', {
              ...args,
              elementRef: bodyTextRef,
              property: 'content',
            })
          ).content,
          'Edited footnote text',
        );
      });
      // Use keyboard end navigation and append without a visible empty staff.
      await evaluate(
        `document.activeElement?.blur(); document.dispatchEvent(new KeyboardEvent('keydown', {code:'End', key:'End', bubbles:true}));`,
      );
      await evaluate(
        `document.activeElement?.blur(); document.dispatchEvent(new KeyboardEvent('keydown', {code:'KeyJ', key:'j', bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup', {code:'KeyJ', key:'j', bubbles:true}));`,
      );
      await eventually(async () => {
        body = await call('get_elements', {
          ...args,
          collection: bodySelector,
        });
        assert.equal(body.collectionSize, 5);
      });
      assert.deepEqual(
        (await call('get_elements', args)).elements.map(
          (entry) => entry.properties.lyrics,
        ),
        beforeMain,
      );
      const returnNavigation = await evaluate(`(() => {
        const viewport = document.querySelector('.page-background');
        const previousMaxHeight = viewport.style.maxHeight;
        viewport.style.maxHeight = '180px';
        document.querySelector('.footnote-label').scrollIntoView({block:'nearest'});
        const reference = document.querySelector('.footnote-reference').parentElement;
        const bounds = viewport.getBoundingClientRect();
        const offscreen = reference.getBoundingClientRect().bottom < bounds.top;
        return {previousMaxHeight, offscreen, scrollTop: viewport.scrollTop};
      })()`);
      assert.equal(returnNavigation.offscreen, true);
      await evaluate(`document.querySelector('.footnote-label').click()`);
      assert.equal(
        await evaluate(
          `window._editor.selectedWorkspace.value.activeFootnoteId`,
        ),
        bodySelector.footnoteId,
        'A single click does not return to the reference',
      );
      assert.equal(
        await evaluate(`document.querySelector('.page-background').scrollTop`),
        returnNavigation.scrollTop,
      );
      await evaluate(
        `document.querySelector('.footnote-label').dispatchEvent(new MouseEvent('dblclick', {bubbles:true, detail:2}))`,
      );
      await eventually(async () => {
        assert.equal(
          await evaluate(`(() => {
            const viewport = document.querySelector('.page-background').getBoundingClientRect();
            const reference = document.querySelector('.footnote-reference').parentElement;
            const bounds = reference.getBoundingClientRect();
            return window._editor.selectedWorkspace.value.selectedElement.id === Number(reference.id.slice('element-'.length))
              && bounds.top >= viewport.top && bounds.bottom <= viewport.bottom;
          })()`),
          true,
          'Double-click selects the reference and scrolls it into view',
        );
      });
      await evaluate(
        `document.querySelector('.page-background').style.maxHeight = ${JSON.stringify(returnNavigation.previousMaxHeight)}`,
      );
      assert.equal(
        await evaluate(
          `document.querySelector('label[for="lyrics-pane-text"]').textContent.trim()`,
        ),
        mainLyricsLabel,
      );
      assert.equal(
        await evaluate(
          `window._editor.selectedWorkspace.value.activeFootnoteId`,
        ),
        null,
      );
      // Real editor history removes and restores the inserted footnote neume.
      await evaluate(
        `window._editor.selectedWorkspace.value.commandService.undo()`,
      );
      assert.equal(
        (await call('get_elements', { ...args, collection: bodySelector }))
          .collectionSize,
        4,
      );
      await evaluate(
        `window._editor.selectedWorkspace.value.commandService.redo()`,
      );
      assert.equal(
        (await call('get_elements', { ...args, collection: bodySelector }))
          .collectionSize,
        5,
      );
      await evaluate(
        `window._editor.selectedWorkspace.value.commandService.undo()`,
      );
      await evaluate(`(() => {
        const w = window._editor.selectedWorkspace.value;
        document.getElementById('element-' + w.score.staff.elements[2].id).dispatchEvent(new MouseEvent('contextmenu', {bubbles:true, button:2, clientX:200, clientY:150}));
      })()`);
      await eventually(async () => {
        assert.equal(
          await evaluate(
            `!![...document.querySelectorAll('[role="menuitem"]')].find(item => item.textContent.includes('Insert Footnote'))`,
          ),
          true,
        );
      });
      await evaluate(
        `[...document.querySelectorAll('[role="menuitem"]')].find(item => item.textContent.includes('Insert Footnote')).click()`,
      );
      await eventually(async () => {
        assert.equal(
          await evaluate(
            `window._editor.selectedWorkspace.value.score.footnotes.length`,
          ),
          3,
        );
      });
      assert.equal(
        await evaluate(
          `window._editor.selectedWorkspace.value.score.staff.elements[2].footnoteNumber`,
        ),
        100,
      );
      await evaluate(
        `window._editor.selectedWorkspace.value.commandService.undo()`,
      );
      assert.equal(
        await evaluate(
          `window._editor.selectedWorkspace.value.activeFootnoteId`,
        ),
        null,
      );
      await evaluate(
        `window._editor.selectedWorkspace.value.commandService.redo()`,
      );
      assert.equal(
        await evaluate(
          `window._editor.selectedWorkspace.value.score.footnotes.length`,
        ),
        3,
      );
      await evaluate(
        `window._editor.selectedWorkspace.value.commandService.undo()`,
      );
    }
    doc = await call('get_document_properties', args);
    await call('update_page_setup', {
      ...args,
      expectedRevision: doc.revision,
      changes: { pageHeightCustom: 450 },
    });
    const pages = await call('get_pages', args);
    assert.equal((await call('get_pages', args)).layoutId, pages.layoutId);
    assert.ok(
      pages.pageCount > 1,
      'Footnote space must move main content to later pages.',
    );
    const first = await call('get_page_elements', { ...args, pageNumber: 1 });
    for (const anchor of anchors) {
      assert.ok(
        first.occurrences.some(
          (entry) =>
            entry.elementRef === anchor.elementRef && entry.region === 'staff',
        ),
      );
    }
    assert.ok(
      first.occurrences.some(
        (entry) => entry.region === 'footnote' && entry.elementType === 'Note',
      ),
    );
    assert.ok(
      first.occurrences.some(
        (entry) =>
          entry.elementRef === bodyTextRef && entry.region === 'footnote',
      ),
    );
    const preview = await call('preview_page', {
      ...args,
      expectedRevision: pages.revision,
      pageNumber: 1,
    });
    await copyFile(
      preview.outputFilePath,
      path.join(app.directory, `${documentScope}-footnotes.png`),
    );
    await call('export_pdf', {
      ...args,
      expectedRevision: pages.revision,
      filePath: path.join(app.directory, `${documentScope}-footnotes.pdf`),
    });
    // A whole footnote too tall for its anchor page must fail explicitly, then recover.
    await edit([
      {
        action: 'update',
        elementRef: bodyTextRef,
        elementType: 'TextBox',
        properties: { customHeight: 600 },
      },
    ]);
    await call('get_pages', args, 'LAYOUT_SETTLEMENT_FAILED');
    if (documentScope === 'editor') {
      const selector = `.page [data-footnote-id="${bodySelector.footnoteId}"] .text-box`;
      // Exercise lazy page mounting independently of the host screen size.
      const previousMaxHeight = await evaluate(`(() => {
        const viewport = document.querySelector('.page-background');
        const previous = viewport.style.maxHeight;
        viewport.style.maxHeight = '180px';
        [...viewport.querySelectorAll('.page')].at(-1).scrollIntoView({block:'start'});
        return previous;
      })()`);
      await eventually(async () =>
        assert.equal(
          await evaluate(
            `document.querySelector(${JSON.stringify(selector)}) === null`,
          ),
          true,
          'Offscreen footnote content is unmounted',
        ),
      );
      // Detached page discovery does not bring the editor's source page into view.
      await evaluate(
        `document.querySelector('.page-background .page').scrollIntoView({block:'start'})`,
      );
      await eventually(async () => {
        const overflow = await evaluate(`(() => {
          const box = document.querySelector(${JSON.stringify(selector)});
          if (box === null) return null;
          const page = box.closest('.page');
          return { overflow: getComputedStyle(page).overflow, editable: box.isContentEditable, belowPage: box.getBoundingClientRect().top >= page.getBoundingClientRect().bottom };
        })()`);
        assert.deepEqual(
          overflow,
          {
            overflow: 'visible',
            editable: true,
            belowPage: true,
          },
          'Oversized footnote content mounts below its page and stays editable',
        );
      });
      await evaluate(
        `document.querySelector('.page-background').style.maxHeight = ${JSON.stringify(previousMaxHeight)}`,
      );
    }

    await edit([
      {
        action: 'update',
        elementRef: bodyTextRef,
        elementType: 'TextBox',
        properties: { customHeight: null },
      },
    ]);
    assert.equal((await call('get_pages', args)).pageCount, pages.pageCount);
    for (const extension of ['byzx', 'byz']) {
      doc = await call('get_document_properties', args);
      const filePath = path.join(
        app.directory,
        `${documentScope}-footnotes.${extension}`,
      );
      doc = await call('save_document', {
        ...args,
        expectedRevision: doc.revision,
        filePath,
      });
      if (extension === 'byzx') {
        const saved = JSON.parse(await readFile(filePath, 'utf8'));
        assert.equal(saved.footnotes.length, 2);
        assert.equal(saved.pageSetup.firstFootnoteNumber, 98);
        assert.equal(saved.footnotes[0].staff.elements[1].elementType, 'Note');
      }
    }
    const copied = await call('create_document', {
      documentScope,
      title: 'Footnote copy',
    });
    await call('copy_elements', {
      documentScope,
      documentId: copied.documentId,
      expectedRevision: copied.revision,
      sourceDocumentId: doc.documentId,
      expectedSourceRevision: doc.revision,
      start: 0,
      end: 1,
      index: 0,
    });
    const copyMain = await call('get_elements', {
      documentScope,
      documentId: copied.documentId,
    });
    assert.notEqual(
      copyMain.elements[0].properties.footnoteId,
      bodySelector.footnoteId,
    );
    const copiedBody = await call('get_elements', {
      documentScope,
      documentId: copied.documentId,
      collection: {
        kind: 'footnote',
        footnoteId: copyMain.elements[0].properties.footnoteId,
      },
    });
    assert.equal(copiedBody.collectionSize, 4);
    await closeDocument(call, args);
    for (const extension of ['byzx', 'byz']) {
      const reopened = await call('open_document', {
        documentScope,
        filePath: path.join(
          app.directory,
          `${documentScope}-footnotes.${extension}`,
        ),
      });
      const reopenedArgs = { documentScope, documentId: reopened.documentId };
      const reopenedMain = await call('get_elements', reopenedArgs);
      assert.equal(
        reopenedMain.elements[0].properties.footnoteId,
        bodySelector.footnoteId,
      );
      assert.equal(reopenedMain.elements[0].properties.footnoteNumber, 98);
      const reopenedBody = await call('get_elements', {
        ...reopenedArgs,
        collection: bodySelector,
      });
      assert.equal(reopenedBody.collectionSize, 4);
      await closeDocument(call, reopenedArgs);
    }
    console.log(
      `PASS: ${documentScope} footnote editing, numbering, pagination, persistence, copying, and rendering`,
    );
  }
  await checkFootnoteMarkers(call, evaluate, app.directory);
  console.log(`Footnote artifacts: ${app.directory}`);
} finally {
  await client?.close();
  await app.close();
}
