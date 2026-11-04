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
  const { evaluate } = await app.debugger();
  const { evaluate: evaluateMain } = await app.debugger('main');
  await app.ready();
  client = await connectStdioClient('footnotes-smoke', {
    profile: app.profile,
  });
  const call = createToolCaller(client, (await client.listTools()).tools);
  for (const documentScope of ['private', 'editor']) {
    let doc = await call('create_document', {
      documentScope,
      title: 'Footnote proof of concept',
    });
    const args = { documentScope, documentId: doc.documentId };
    const edit = async (actions) => {
      const current = await call('get_document_properties', args);
      return call('edit_elements', {
        ...args,
        expectedRevision: current.revision,
        actions,
      });
    };
    doc = await call('update_page_setup', {
      ...args,
      expectedRevision: doc.revision,
      changes: {
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
      });
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
      await evaluate(`(() => {
        const text = document.getElementById('lyrics-pane-text');
        text.value = 'Changed words';
        text.dispatchEvent(new Event('input', {bubbles:true}));
      })()`);
      await evaluateMain(
        `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('/index.html')).webContents.send('FileMenuUndo')`,
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
      await evaluate(`document.querySelector('.footnote-label').click()`);
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
      const overflow = await evaluate(`(() => {
        const box = document.querySelector('[data-footnote-id="${bodySelector.footnoteId}"] .text-box');
        const page = box.closest('.page');
        return { overflow: getComputedStyle(page).overflow, editable: box.isContentEditable, belowPage: box.getBoundingClientRect().top >= page.getBoundingClientRect().bottom };
      })()`);
      assert.deepEqual(overflow, {
        overflow: 'visible',
        editable: true,
        belowPage: true,
      });
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
