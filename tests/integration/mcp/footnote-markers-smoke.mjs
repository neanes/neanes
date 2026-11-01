// Run outside the agent sandbox on macOS; this launches a disposable Electron app.
import assert from 'node:assert/strict';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';

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
    const point = await evaluate(
      `(() => {const n=document.querySelector(${JSON.stringify(selector)}); n.scrollIntoView({block:'center'}); const r=n.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};})()`,
    );
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
  console.log(
    `PASS: marker properties, context menus, numbering, previews, Undo/Redo, save/reopen, rendering. Artifacts: ${app.directory}`,
  );
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  await client?.close();
  await app.close();
}
