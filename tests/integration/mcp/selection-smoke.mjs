import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';
import { connectCdp, editorTarget } from './smokeCdp.mjs';
import {
  closeDocument,
  connectStdioClient,
  createToolCaller,
} from './smokeClient.mjs';

assert.ok(
  process.env.NEANES_DEV_USER_DATA_DIR,
  'Run against a disposable app with remote debugging.',
);
const socket = await connectCdp(
  (await editorTarget(process.env.NEANES_DEBUG_URL ?? 'http://127.0.0.1:9334'))
    .webSocketDebuggerUrl,
);
const { send, evaluate } = socket;
async function click(selector, modifiers = 0) {
  for (let i = 0; i < 100; i++) {
    if (
      await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`)
    ) {
      break;
    }
    await setTimeout(20);
  }
  const point = await evaluate(
    `(() => { const element = document.querySelector(${JSON.stringify(selector)}); element.scrollIntoView({block:'center'}); const r = element.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`,
  );
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type,
      ...point,
      button: 'left',
      clickCount: 1,
      modifiers,
    });
  }
}
const client = await connectStdioClient('neanes-selection-smoke');
const tools = (await client.listTools()).tools;
const call = createToolCaller(client, tools);
const introduced = [];
try {
  const created = await call('create_document', {
    documentScope: 'editor',
    title: 'Selection regression',
  });
  const args = { documentScope: 'editor', documentId: created.documentId };
  introduced.push(args);
  const inserted = await call('edit_elements', {
    ...args,
    expectedRevision: created.revision,
    actions: [
      {
        action: 'insert',
        index: 0,
        elements: [
          { elementType: 'Note', clientId: 'first' },
          { elementType: 'Note', clientId: 'second' },
        ],
      },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@first',
          collection: 'annotations',
        },
        elements: [
          {
            elementType: 'Annotation',
            clientId: 'annotation',
            properties: {
              text: '<p class="neanes-paragraph-style-annotation">Selection</p>',
              x: 100,
              y: -40,
            },
          },
        ],
      },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@first',
          collection: 'alternateLines',
        },
        elements: [
          {
            elementType: 'AlternateLine',
            clientId: 'alternate',
            properties: { x: 100, y: -80 },
          },
        ],
      },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@alternate',
          collection: 'elements',
        },
        elements: [{ elementType: 'Note' }],
      },
    ],
  });
  const refs = Object.fromEntries(
    inserted.created.map((element) => [element.clientId, element.elementRef]),
  );
  let baseline = await readScoreSnapshot(call, args);
  let state = await evaluate(
    'JSON.stringify({dirty:window._editor.selectedWorkspace.value.hasUnsavedChanges,history:window._editor.selectedWorkspace.value.commandService.commandHistory.length})',
  );
  const ids = await evaluate(
    'window._editor.elements.value.slice(0,2).map(e=>e.id)',
  );
  await click(`#element-${ids[0]} > .neume-box > .syllable-box`);
  const selected = await call('get_selection', args);
  baseline = await readScoreSnapshot(call, args);
  state = await evaluate(
    'JSON.stringify({dirty:window._editor.selectedWorkspace.value.hasUnsavedChanges,history:window._editor.selectedWorkspace.value.commandService.commandHistory.length})',
  );
  assert.equal(selected.status, 'active');
  assert.equal(selected.selection.kind, 'element');
  assert.equal(selected.selection.target.elementRef, refs.first);
  await click(`#element-${ids[1]} > .neume-box > .syllable-box`, 8);
  const range = await call('get_selection', {
    ...args,
    expectedRevision: baseline.revision,
  });
  assert.deepEqual(range.selection, {
    kind: 'range',
    collection: { kind: 'staff' },
    start: 0,
    end: 2,
    anchorRef: refs.first,
    focusRef: refs.second,
  });
  // Exercise live nested/lyric/template state, without replacing the editor model.
  for (const [kind, operation, ref] of [
    ['lyrics', 'w.selectedLyrics=w.score.staff.elements[0]', refs.first],
    [
      'annotation',
      'w.selectedElement=w.score.staff.elements[0];w.selectedAnnotationElement=w.selectedElement.annotations[0]',
      refs.annotation,
    ],
    [
      'alternateLine',
      'w.selectedElement=w.score.staff.elements[0];w.selectedAlternateLineElement=w.selectedElement.alternateLines[0]',
      refs.alternate,
    ],
    [
      'headerFooter',
      'w.selectedHeaderFooterElement=w.score.headers.odd.elements[0]',
      null,
    ],
  ]) {
    await evaluate(
      `(() => {const w=window._editor.selectedWorkspace.value;w.selectionRange=null;w.selectedElement=null;w.selectedLyrics=null;w.selectedAnnotationElement=null;w.selectedAlternateLineElement=null;w.selectedHeaderFooterElement=null;${operation};})()`,
    );
    const result = await call('get_selection', {
      ...args,
      expectedRevision: baseline.revision,
    });
    assert.equal(result.selection.kind, kind);
    if (ref) {
      assert.equal(result.selection.target.elementRef, ref);
    } else {
      assert.deepEqual(result.selection.target.collection, {
        kind: 'headers',
        variant: 'odd',
      });
    }
    assert.equal(
      (
        await call('get_element', {
          ...args,
          elementRef: result.selection.target.elementRef,
          properties: [],
        })
      ).elements[0].elementRef,
      result.selection.target.elementRef,
    );
  }
  assert.deepEqual(await readScoreSnapshot(call, args), baseline);
  assert.equal(
    await evaluate(
      'JSON.stringify({dirty:window._editor.selectedWorkspace.value.hasUnsavedChanges,history:window._editor.selectedWorkspace.value.commandService.commandHistory.length})',
    ),
    state,
  );
  const control = await call('create_document', {
    title: 'Selection background control',
    documentScope: 'editor',
  });
  introduced.push({ documentId: control.documentId, documentScope: 'editor' });
  const remembered = await call('get_selection', args);
  assert.equal(remembered.status, 'remembered');
  assert.equal(remembered.selection.kind, 'headerFooter');
  assert.equal(
    await evaluate('window._editor.selectedWorkspace.value.id'),
    control.documentId,
  );
  const privateDocument = await call('create_document');
  const privateArgs = { documentId: privateDocument.documentId };
  introduced.push(privateArgs);
  const unavailable = await call('get_selection', privateArgs);
  assert.equal(unavailable.status, 'unavailable');
  assert.equal(unavailable.selection, null);
  await call(
    'get_selection',
    { documentScope: 'editor', documentId: privateDocument.documentId },
    'DOCUMENT_NOT_FOUND',
  );
  await call(
    'get_selection',
    { ...args, documentScope: 'private' },
    'DOCUMENT_NOT_FOUND',
  );
  const current = await call('get_document_properties', args);
  await call('replace_document_properties', {
    ...args,
    expectedRevision: current.revision,
    properties: { title: 'Changed content', author: '' },
  });
  await call(
    'get_selection',
    { ...args, expectedRevision: baseline.revision },
    'REVISION_CONFLICT',
  );
  console.log(
    'Selection regression passed: UI clicks/ranges, nested/lyric/template state, remembered tabs, private-worker access, revisions and read-only state.',
  );
} finally {
  for (const args of introduced.reverse()) {
    await closeDocument(call, args);
  }
  socket.close();
  await client.close();
}
