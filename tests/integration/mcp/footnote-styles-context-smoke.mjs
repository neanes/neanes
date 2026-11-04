// Launch outside the agent sandbox on macOS. Uses a disposable Electron profile.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-footnote-styles-context-');
let client;
try {
  app.start({ args: ['--remote-debugging-port=0'] });
  const { evaluate } = await app.debugger();
  await app.ready();
  client = await connectStdioClient('footnote-styles-context', {
    profile: app.profile,
  });
  const call = createToolCaller(client, (await client.listTools()).tools);
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Footnote styles and musical context',
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
  await edit([
    { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
    {
      action: 'insert',
      elements: [
        {
          elementType: 'Martyria',
          properties: { auto: false, note: 'Ga', scale: 'Diatonic' },
        },
        {
          elementType: 'Note',
          clientId: 'note',
          properties: { quantitativeNeume: 'Ison' },
        },
        { elementType: 'Martyria', properties: { auto: true } },
        {
          elementType: 'Martyria',
          clientId: 'martyria',
          properties: { auto: false, note: 'Ga', alignRight: true },
        },
      ],
    },
    {
      action: 'insert_footnote',
      elementRef: '@note',
      elements: [
        { elementType: 'Martyria', properties: { auto: true } },
        { elementType: 'Note', properties: { quantitativeNeume: 'Oligon' } },
        { elementType: 'Martyria', properties: { auto: true } },
      ],
    },
    {
      action: 'insert_footnote',
      elementRef: '@martyria',
      elements: [{ elementType: 'Martyria', properties: { auto: true } }],
    },
  ]);
  let main = await call('get_elements', args);
  const note = main.elements[1];
  const martyria = main.elements[3];
  const noteBody = { kind: 'footnote', footnoteId: note.properties.footnoteId };
  const martyriaBody = {
    kind: 'footnote',
    footnoteId: martyria.properties.footnoteId,
  };
  const body = () => call('get_elements', { ...args, collection: noteBody });
  let elements = await body();
  assert.equal(elements.elements[0].properties.note, 'Ga');
  assert.equal(elements.elements[2].properties.note, 'Thi');
  assert.equal(
    main.elements[2].properties.note,
    'Ga',
    'Footnote intervals must not affect the main melody',
  );
  assert.equal(
    (await call('get_elements', { ...args, collection: martyriaBody }))
      .elements[0].properties.note,
    'Ga',
  );
  await edit([
    {
      action: 'update',
      elementRef: note.elementRef,
      elementType: 'Note',
      properties: { quantitativeNeume: 'Oligon' },
    },
  ]);
  elements = await body();
  assert.equal(elements.elements[0].properties.note, 'Thi');
  assert.equal(elements.elements[2].properties.note, 'Ke');
  main = await call('get_elements', args);
  assert.equal(main.elements[2].properties.note, 'Thi');
  await eventually(async () =>
    assert.equal(
      await evaluate("document.querySelectorAll('.footnote-reference').length"),
      2,
    ),
  );
  const workspace = 'window._editor.selectedWorkspace.value';
  const labelSelector = `.footnote-label[data-footnote-id="${noteBody.footnoteId}"]`;
  const labelMetrics = () =>
    evaluate(
      `(() => {const n=document.querySelector(${JSON.stringify(labelSelector)}), marker=n.firstElementChild, s=getComputedStyle(marker),w=${workspace};return {size:parseFloat(s.fontSize)/w.zoom,top:marker.getBoundingClientRect().top/w.zoom,color:s.color,tag:marker.tagName};})()`,
    );
  assert.ok(
    Math.abs((await labelMetrics()).size - (10 * 96) / 72) < 0.1,
    'Default body marker inherits the 10pt footnote text size',
  );
  assert.equal((await labelMetrics()).tag, 'SPAN');
  async function styles(changes) {
    await call('edit_paragraph_styles', {
      ...args,
      expectedRevision: (await properties()).revision,
      changes,
    });
  }
  await styles([
    {
      action: 'update',
      id: 'footnote-body-marker',
      changes: {
        overrides: { fontSize: 32, color: '#123456' },
      },
    },
    {
      action: 'update',
      id: 'footnote-reference',
      changes: { overrides: { fontSize: 26, color: '#654321' } },
    },
  ]);
  await eventually(async () => {
    const actual = await labelMetrics();
    assert.ok(Math.abs(actual.size - 32) < 0.1);
    assert.equal(actual.color, 'rgb(18, 52, 86)');
    assert.equal(actual.tag, 'SPAN');
  });
  for (const alignRight of [false, true]) {
    await edit([
      {
        action: 'update',
        elementRef: martyria.elementRef,
        elementType: 'Martyria',
        properties: { alignRight },
      },
    ]);
    for (const rtl of [false, true]) {
      await call('update_page_setup', {
        ...args,
        expectedRevision: (await properties()).revision,
        changes: { melkiteRtl: rtl },
      });
      await properties();
      await eventually(async () => {
        const metrics = await evaluate(
          `(() => {const w=${workspace},anchor=w.score.staff.elements[3],n=document.getElementById('element-'+anchor.id),m=n.querySelector('.footnote-reference'),r=m.getBoundingClientRect(),p=n.closest('.page').getBoundingClientRect();return {top:parseFloat(getComputedStyle(m).top),sup:m.querySelector('sup')!==null,size:parseFloat(getComputedStyle(m).fontSize)/w.zoom,left:r.left,right:r.right,anchorCenter:w.score.pageSetup.melkiteRtl ? p.right-(anchor.x+anchor.neumeWidth/2)*w.zoom : p.left+(anchor.x+anchor.neumeWidth/2)*w.zoom,zoom:w.zoom};})()`,
        );
        assert.ok(
          Math.abs(metrics.size - 26) < 0.1,
          'Music reference uses the configured size without superscript scaling',
        );
        assert.equal(
          Number.isFinite(metrics.top),
          true,
          'Music references have a calculated vertical position',
        );
        assert.equal(metrics.sup, false);
        // A wide marker may overhang a margin: it is centered on the martyria
        // and does not reserve any horizontal line-breaking space.
        assert.ok(
          Math.abs((metrics.left + metrics.right) / 2 - metrics.anchorCenter) <
            metrics.zoom * 2,
          `RTL=${rtl}: marker is centered over the martyria`,
        );
      });
    }
  }
  const filePath = path.join(app.directory, 'footnote-styles-context.byzx');
  await call('save_document', {
    ...args,
    expectedRevision: (await properties()).revision,
    filePath,
  });
  const saved = JSON.parse(await readFile(filePath, 'utf8'));
  assert.equal(saved.staff.elements[3].footnoteId, martyriaBody.footnoteId);
  for (const style of saved.paragraphStyles) {
    assert.equal(Object.hasOwn(style, 'superscript'), false);
  }
  console.log(
    'PASS: note and martyria musical context, configured marker sizes, baseline body labels, and ordinary/right-aligned LTR/RTL marker bounds.',
  );
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  await client?.close();
  await app.close();
}
