// Run outside the agent sandbox on macOS; this launches a disposable Electron app.
import assert from 'node:assert/strict';
import { copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { checkFootnoteMarkerCollisionSpacing } from './footnoteMarkerChecks.mjs';
import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-footnote-markers-', {
  keepArtifacts: true,
});
let client;
try {
  app.start({ args: ['--remote-debugging-port=0', '--inspect=0'] });
  const socket = await app.debugger();
  const { evaluate } = socket;
  const { evaluate: main } = await app.debugger('main');
  await app.ready();
  client = await connectStdioClient('footnote-markers', {
    profile: app.profile,
  });
  const call = createToolCaller(client, (await client.listTools()).tools);
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Footnote marker properties',
  });
  const args = { documentScope: 'editor', documentId: doc.documentId };
  const edit = async (actions) =>
    call('edit_elements', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      actions,
    });
  const initial = await call('get_elements', args);
  await edit([
    { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
    {
      action: 'insert',
      elements: [
        { elementType: 'Note', clientId: 'a' },
        { elementType: 'Note', clientId: 'b' },
        {
          elementType: 'RichTextBox',
          clientId: 'c',
          properties: { content: '<p>Rich text</p>' },
        },
        { elementType: 'Note', clientId: 'd' },
      ],
    },
    ...['a', 'b', 'c', 'd'].map((id) => ({
      action: 'insert_footnote',
      elementRef: `@${id}`,
      ...(id === 'c' ? { contentKey: 'content', htmlOffset: 7 } : {}),
      elements: [{ elementType: 'Note', properties: { lyrics: `Body ${id}` } }],
    })),
  ]);
  await call('update_page_setup', {
    ...args,
    expectedRevision: (await call('get_document_properties', args)).revision,
    changes: { firstFootnoteNumber: 98 },
  });
  const elements = await call('get_elements', {
    ...args,
    includeContent: true,
  });
  const ids = elements.elements
    .slice(0, 4)
    .map(
      (entry) =>
        entry.properties.footnoteId ??
        entry.properties.content.match(/data-footnote-id="([^"]+)"/)[1],
    );
  const marker = (id, rich = false) =>
    `.page ${rich ? '.neanes-footnote' : '.footnote-reference'}[data-footnote-id="${id}"]`;
  const label = (id) => `.page .footnote-label[data-footnote-id="${id}"]`;
  async function text(selector) {
    return evaluate(
      `document.querySelector(${JSON.stringify(selector)})?.textContent.trim()`,
    );
  }
  async function click(selector, button = 'left') {
    await eventually(async () =>
      assert.ok(
        await evaluate(`document.querySelector(${JSON.stringify(selector)})`),
      ),
    );
    const point = await eventually(async () => {
      const result = await evaluate(
        `(() => {const n=document.querySelector(${JSON.stringify(selector)}); n.scrollIntoView({block:'center'}); const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2; return {x,y,hit:n.contains(document.elementFromPoint(x,y))};})()`,
      );
      assert.ok(
        result.hit,
        `Waiting for ${selector} to receive pointer events`,
      );
      return { x: result.x, y: result.y };
    });
    for (const type of ['mousePressed', 'mouseReleased']) {
      await socket.send('Input.dispatchMouseEvent', {
        type,
        ...point,
        button,
        clickCount: 1,
      });
    }
  }
  async function open(selector) {
    await click(selector, 'right');
    await click(
      '[role="menu"][data-state="open"] [data-testid="footnote-properties-menu"]',
    );
    await eventually(async () =>
      assert.equal(await text('[role="dialog"] h2'), 'Footnote Properties'),
    );
  }
  async function choose(value) {
    await click('#footnote-marker-type');
    const index = await evaluate(
      `[...document.querySelectorAll('[role="option"]')].findIndex(n=>n.textContent.includes(${JSON.stringify(value)}))`,
    );
    assert.ok(index >= 0);
    await click(`[role="option"]:nth-child(${index + 1})`);
  }
  async function input(value) {
    await evaluate(
      `(() => {const n=document.querySelector('#footnote-custom-marker');n.focus();n.select();})()`,
    );
    await socket.send('Input.insertText', { text: value });
  }
  async function update() {
    await click('button[form="footnote-properties-form"]');
    await eventually(async () =>
      assert.equal(
        await evaluate(`!!document.querySelector('#footnote-properties-form')`),
        false,
      ),
    );
  }
  async function undo(channel) {
    await main(
      `process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron').BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/index.html')).webContents.send(${JSON.stringify(channel)})`,
    );
  }
  const beforeRejectedAnnotation = await call('get_document_properties', args);
  await call(
    'edit_elements',
    {
      ...args,
      expectedRevision: beforeRejectedAnnotation.revision,
      actions: [
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: elements.elements[0].elementRef,
            collection: 'annotations',
          },
          elements: [
            {
              elementType: 'Annotation',
              properties: {
                text: '<p><span class="neanes-footnote" data-footnote-id="00000000-0000-4000-8000-000000000001"></span></p>',
              },
            },
          ],
        },
      ],
    },
    'INVALID_ELEMENT_EDIT',
  );
  assert.equal(
    (await call('get_document_properties', args)).revision,
    beforeRejectedAnnotation.revision,
    'Rejected annotation references must not change the document',
  );
  await eventually(async () =>
    assert.equal(await text(marker(ids[0])), '(98)'),
  );
  assert.equal(
    await text(marker(ids[2], true)),
    '100',
    'Rich text automatic numbers have no parentheses',
  );
  await open(marker(ids[1]));
  await choose('Asterisk');
  assert.equal(await text('[data-testid="footnote-marker-preview"]'), '(*)');
  assert.equal(await text('[data-testid="footnote-body-preview"]'), '*');
  assert.equal(
    await evaluate(
      'document.querySelector(\'[data-testid="footnote-marker-preview"]\').tagName',
    ),
    'SPAN',
  );
  assert.equal(
    await evaluate(
      'document.querySelector(\'[data-testid="footnote-body-preview"]\').tagName',
    ),
    'SPAN',
  );
  await update();
  await eventually(async () => assert.equal(await text(marker(ids[1])), '(*)'));
  assert.equal(await text(label(ids[1])), '*');
  assert.equal(await text(marker(ids[2], true)), '99');
  assert.equal(await text(marker(ids[3])), '(100)');
  await undo('FileMenuUndo');
  await eventually(async () =>
    assert.equal(await text(marker(ids[1])), '(99)'),
  );
  assert.equal(await text(marker(ids[2], true)), '100');
  await undo('FileMenuRedo');
  await eventually(async () => assert.equal(await text(marker(ids[1])), '(*)'));
  // Body labels open the same dialog without replacing element properties.
  await open(label(ids[1]));
  await choose('Custom');
  await input('x'.repeat(17));
  assert.equal(
    await evaluate(
      `document.querySelector('button[form="footnote-properties-form"]').disabled`,
    ),
    true,
  );
  await input('Ref A');
  assert.equal(
    await text('[data-testid="footnote-marker-preview"]'),
    '(Ref A)',
  );
  await update();
  await eventually(async () =>
    assert.equal(await text(marker(ids[1])), '(Ref A)'),
  );
  assert.equal(await text(label(ids[1])), 'Ref A');
  // Right-click a rich text widget, keeping ordinary rich text context menus intact.
  await open(marker(ids[2], true));
  await choose('Dagger');
  assert.equal(await text('[data-testid="footnote-marker-preview"]'), '\u2020');
  await update();
  await eventually(async () =>
    assert.equal(await text(marker(ids[2], true)), '\u2020'),
  );
  assert.equal(await text(label(ids[2])), '\u2020');
  assert.equal(await text(marker(ids[3])), '(99)');
  await open(marker(ids[1]));
  await choose('Automatic');
  assert.equal(await text('[data-testid="footnote-marker-preview"]'), '(99)');
  await update();
  await eventually(async () =>
    assert.equal(await text(marker(ids[1])), '(99)'),
  );
  assert.equal(await text(marker(ids[3])), '(100)');
  // Cancel must leave the existing marker untouched.
  await open(label(ids[1]));
  await choose('Double dagger');
  await evaluate(
    `[...document.querySelectorAll('[role="dialog"] button')].find(n=>n.textContent.trim()==='Cancel').click()`,
  );
  assert.equal(await text(marker(ids[1])), '(99)');
  await edit([
    { action: 'update_footnote', footnoteId: ids[3], marker: '\u2021' },
  ]);
  await eventually(async () =>
    assert.equal(await text(marker(ids[3])), '(\u2021)'),
  );
  const metadata = await call('get_elements', {
    ...args,
    collection: { kind: 'footnote', footnoteId: ids[2] },
  });
  assert.deepEqual(metadata.footnote, {
    id: ids[2],
    marker: '\u2020',
    label: '\u2020',
    number: null,
  });
  for (const extension of ['byz', 'byzx']) {
    const filePath = path.join(app.directory, `custom-markers.${extension}`);
    await call('save_document', {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      filePath,
    });
    const reopened = await call('open_document', {
      documentScope: 'private',
      filePath,
    });
    for (const [id, value] of [
      [ids[2], '\u2020'],
      [ids[3], '\u2021'],
    ]) {
      const body = await call('get_elements', {
        documentScope: 'private',
        documentId: reopened.documentId,
        collection: { kind: 'footnote', footnoteId: id },
      });
      assert.equal(body.footnote.marker, value);
    }
    const pages = await call('get_pages', {
      documentScope: 'private',
      documentId: reopened.documentId,
    });
    const preview = await call('preview_page', {
      documentScope: 'private',
      documentId: reopened.documentId,
      expectedRevision: pages.revision,
      pageNumber: 1,
    });
    await copyFile(
      preview.outputFilePath,
      path.join(app.directory, `${extension}-markers.png`),
    );
  }
  // Forward navigation is unchanged for numeric and symbolic references.
  await click(marker(ids[2], true));
  await eventually(async () =>
    assert.equal(
      await evaluate(`window._editor.selectedWorkspace.value.activeFootnoteId`),
      ids[2],
    ),
  );
  // Musical placement, tempo footnote rejection, and offsets before clearance.
  const placement = await call('create_document', {
    documentScope: 'editor',
    title: 'Marker positioning',
  });
  const placementArgs = {
    documentScope: 'editor',
    documentId: placement.documentId,
  };
  const placementEdit = async (actions) =>
    call('edit_elements', {
      ...placementArgs,
      expectedRevision: (await call('get_document_properties', placementArgs))
        .revision,
      actions,
    });
  const placementInitial = await call('get_elements', placementArgs);
  await placementEdit([
    {
      action: 'remove_range',
      start: 0,
      end: placementInitial.collectionSize - 1,
    },
    {
      action: 'insert',
      elements: [
        { elementType: 'Note', clientId: 'plain' },
        {
          elementType: 'Note',
          clientId: 'gorgon',
          properties: { gorgonNeume: 'Gorgon_Top' },
        },
        { elementType: 'Martyria', clientId: 'martyria' },
        { elementType: 'Tempo', clientId: 'tempo' },
      ],
    },
    ...['plain', 'gorgon', 'martyria'].map((id) => ({
      action: 'insert_footnote',
      elementRef: `@${id}`,
    })),
  ]);
  const placementElements = (await call('get_elements', placementArgs))
    .elements;
  const anchors = placementElements.slice(0, 3);
  const tempo = placementElements[3];
  assert.equal(tempo.elementType, 'Tempo');
  assert.ok(!Object.hasOwn(tempo.properties, 'footnoteOffsetX'));
  await call(
    'edit_elements',
    {
      ...placementArgs,
      expectedRevision: (await call('get_document_properties', placementArgs))
        .revision,
      actions: [{ action: 'insert_footnote', elementRef: tempo.elementRef }],
    },
    'INVALID_ELEMENT_EDIT',
  );
  const tempoId = await evaluate(
    'window._editor.selectedWorkspace.value.score.staff.elements[3].id',
  );
  await click(`#element-${tempoId}`, 'right');
  await eventually(async () =>
    assert.ok(
      await evaluate(
        `!!document.querySelector('[role="menu"][data-state="open"]')`,
      ),
    ),
  );
  assert.equal(
    await evaluate(
      `[...document.querySelectorAll('[role="menu"][data-state="open"] [role="menuitem"]')].some(n=>n.textContent.toLowerCase().includes('footnote'))`,
    ),
    false,
  );
  await socket.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  await socket.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Escape',
    code: 'Escape',
    windowsVirtualKeyCode: 27,
  });
  const positions = () =>
    evaluate(
      `window._editor.selectedWorkspace.value.score.staff.elements.slice(0,3).map(n=>({left:n.footnoteMarkerOffset,top:n.footnoteMarkerTop,x:n.footnoteOffsetX,y:n.footnoteOffsetY}))`,
    );
  await eventually(async () =>
    assert.equal(
      await evaluate(`document.querySelectorAll('.footnote-reference').length`),
      3,
    ),
  );
  const initialPositions = await positions();
  assert.ok(
    initialPositions[1].top < initialPositions[0].top,
    'Gorgon raises the marker',
  );
  await placementEdit([
    {
      action: 'update',
      elementType: 'Note',
      elementRef: anchors[1].elementRef,
      properties: { gorgonNeumeOffsetY: -0.3 },
    },
  ]);
  const raised = await positions();
  assert.ok(
    raised[1].top < initialPositions[1].top,
    'Collision clearance uses the gorgon user offset',
  );
  await placementEdit([
    {
      action: 'update',
      elementType: 'Note',
      elementRef: anchors[1].elementRef,
      properties: { footnoteOffsetY: 0.05 },
    },
  ]);
  assert.ok(
    Math.abs((await positions())[1].top - raised[1].top) < 0.01,
    'A downward user offset cannot force a collision',
  );
  await placementEdit([
    {
      action: 'update',
      elementType: 'Note',
      elementRef: anchors[1].elementRef,
      properties: { footnoteOffsetX: 1.5, footnoteOffsetY: 0 },
    },
  ]);
  assert.ok(
    (await positions())[1].top > raised[1].top,
    'Moving horizontally clear of the gorgon lets the marker sit lower',
  );
  // Restore the displaced marker before exercising each marker's context menu.
  await placementEdit([
    {
      action: 'update',
      elementType: 'Note',
      elementRef: anchors[1].elementRef,
      properties: { footnoteOffsetX: 0, footnoteOffsetY: 0 },
    },
  ]);
  for (const anchor of anchors) {
    await open(marker(anchor.properties.footnoteId));
    assert.ok(await evaluate(`!!document.querySelector('#footnote-offset-x')`));
    await evaluate(
      `[...document.querySelectorAll('[role="dialog"] button')].find(n=>n.textContent.trim()==='Cancel').click()`,
    );
    await eventually(async () =>
      assert.equal(
        await evaluate(`!!document.querySelector('#footnote-properties-form')`),
        false,
      ),
    );
  }
  await open(marker(anchors[2].properties.footnoteId));
  await evaluate(
    `(() => {const n=document.querySelector('#footnote-offset-x');n.focus();n.select();})()`,
  );
  await socket.send('Input.insertText', { text: '0.25' });
  await click('#footnote-offset-y');
  await eventually(async () =>
    assert.equal(
      await evaluate(`document.querySelector('#footnote-offset-x').value`),
      '0.25',
    ),
  );
  const screenshot = await socket.send('Page.captureScreenshot', {
    format: 'png',
  });
  await writeFile(
    path.join(app.directory, 'position-dialog.png'),
    Buffer.from(screenshot.data, 'base64'),
  );
  await update();
  await eventually(async () => assert.equal((await positions())[2].x, 0.25));
  await undo('FileMenuUndo');
  await eventually(async () => assert.equal((await positions())[2].x, 0));
  await undo('FileMenuRedo');
  await eventually(async () => assert.equal((await positions())[2].x, 0.25));
  await open(marker(anchors[2].properties.footnoteId));
  await evaluate(
    `[...document.querySelectorAll('[role="dialog"] button')].find(n=>n.textContent.trim()==='Reset position').click()`,
  );
  await update();
  await eventually(async () => assert.equal((await positions())[2].x, 0));
  // A narrow marker can sit beside the ypsili; a wide one must clear it.
  await placementEdit([
    {
      action: 'update',
      elementType: 'Note',
      elementRef: anchors[0].elementRef,
      properties: { quantitativeNeume: 'OligonPlusHypsiliRight' },
    },
    {
      action: 'update_footnote',
      footnoteId: anchors[0].properties.footnoteId,
      marker: '*',
    },
  ]);
  const narrowMarkerTop = (await positions())[0].top;
  await placementEdit([
    {
      action: 'update_footnote',
      footnoteId: anchors[0].properties.footnoteId,
      marker: '********',
    },
  ]);
  assert.ok(
    narrowMarkerTop > (await positions())[0].top,
    'Only markers overlapping the right ypsili must clear its tall collision region',
  );
  await placementEdit([
    {
      action: 'update_footnote',
      footnoteId: anchors[0].properties.footnoteId,
      marker: '*',
    },
  ]);
  // Page Setup keeps the checkbox pending until Update, and ink clearance is
  // independent of the whitespace above/below different marker glyphs.
  await undo('FileMenuPageSetup');
  await eventually(async () =>
    assert.ok(await evaluate(`document.querySelector('#page-setup-form')`)),
  );
  const footnotesTabIndex = await evaluate(
    `[...document.querySelectorAll('[role="dialog"] [role="tab"]')].findIndex(n=>n.textContent.trim()==='Footnotes')`,
  );
  assert.ok(footnotesTabIndex >= 0);
  await click(
    `[role="dialog"] [role="tab"]:nth-child(${footnotesTabIndex + 1})`,
  );
  await click('#page-setup-footnote-parentheses');
  assert.equal(
    await evaluate(
      `window._editor.selectedWorkspace.value.score.pageSetup.footnoteReferenceParentheses`,
    ),
    true,
  );
  await click('button[form="page-setup-form"]');
  await eventually(async () =>
    assert.equal(
      (await call('get_page_setup', placementArgs)).settings
        .footnoteReferenceParentheses,
      false,
    ),
  );
  for (const [index, anchor] of anchors.entries()) {
    assert.equal(
      await text(marker(anchor.properties.footnoteId)),
      index === 0 ? '*' : String(index),
    );
  }
  await open(marker(anchors[0].properties.footnoteId));
  assert.equal(await text('[data-testid="footnote-position-preview"]'), '*');
  await evaluate(
    `[...document.querySelectorAll('[role="dialog"] button')].find(n=>n.textContent.trim()==='Cancel').click()`,
  );
  await placementEdit([
    {
      action: 'update',
      elementType: 'Note',
      elementRef: anchors[0].elementRef,
      properties: { quantitativeNeume: 'Oligon' },
    },
    {
      action: 'update_footnote',
      footnoteId: anchors[0].properties.footnoteId,
      marker: 'g',
    },
  ]);
  const inkBottom = () =>
    evaluate(`(() => {
    const n=document.querySelector(${JSON.stringify(marker(anchors[0].properties.footnoteId))}),s=getComputedStyle(n),r=n.getBoundingClientRect();
    const c=document.createElement('canvas').getContext('2d');
    c.font=s.fontStyle+' '+s.fontWeight+' '+s.fontSize+' '+s.fontFamily;
    c.fontVariantCaps=s.fontVariantCaps;
    const m=c.measureText(n.textContent.trim());
    return r.top+(r.height-m.fontBoundingBoxAscent-m.fontBoundingBoxDescent)/2+m.fontBoundingBoxAscent+m.actualBoundingBoxDescent;
  })()`);
  const descenderBottom = await inkBottom();
  await placementEdit([
    {
      action: 'update_footnote',
      footnoteId: anchors[0].properties.footnoteId,
      marker: '*',
    },
  ]);
  assert.ok(
    Math.abs((await inkBottom()) - descenderBottom) < 1,
    'Visible ink keeps the same clearance for asterisk and descender glyphs',
  );
  const oligonMarkerTop = (await positions())[0].top;
  await placementEdit([
    {
      action: 'update',
      elementType: 'Note',
      elementRef: anchors[0].elementRef,
      properties: { quantitativeNeume: 'Ison' },
    },
  ]);
  assert.ok(
    Math.abs((await positions())[0].top - oligonMarkerTop) < 0.01,
    'Unobstructed markers keep the same baseline-relative height on different neumes',
  );
  await placementEdit([
    {
      action: 'update',
      elementType: 'Note',
      elementRef: anchors[0].elementRef,
      properties: { quantitativeNeume: 'OligonPlusHypsiliRight' },
    },
  ]);
  const savedPath = path.join(app.directory, 'positioned-martyria.byzx');
  await call('save_document', {
    ...placementArgs,
    expectedRevision: (await call('get_document_properties', placementArgs))
      .revision,
    filePath: savedPath,
  });
  const reopenedPlacement = await call('open_document', {
    documentScope: 'private',
    filePath: savedPath,
  });
  assert.equal(
    (
      await call('get_page_setup', {
        documentScope: 'private',
        documentId: reopenedPlacement.documentId,
      })
    ).settings.footnoteReferenceParentheses,
    false,
  );
  const reopenedAnchors = await call('get_elements', {
    documentScope: 'private',
    documentId: reopenedPlacement.documentId,
  });
  assert.equal(
    reopenedAnchors.elements[2].properties.footnoteId,
    anchors[2].properties.footnoteId,
  );
  const placementPages = await call('get_pages', placementArgs);
  const placementPreview = await call('preview_page', {
    ...placementArgs,
    expectedRevision: placementPages.revision,
    pageNumber: 1,
  });
  await copyFile(
    placementPreview.outputFilePath,
    path.join(app.directory, 'positioned-markers.png'),
  );
  await checkFootnoteMarkerCollisionSpacing(call, evaluate);
  console.log(
    `PASS: marker properties, context menus, numbering, previews, Undo/Redo, save/reopen, rendering. Artifacts: ${app.directory}`,
  );
} catch (error) {
  console.error(app.log());
  const debug = await app.debugger();
  const shot = await debug.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(
    path.join(app.directory, 'failure.png'),
    Buffer.from(shot.data, 'base64'),
  );
  console.error(app.directory);
  throw error;
} finally {
  await client?.close();
  await app.close();
}
