import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';

const token = process.env.NEANES_MCP_TOKEN;
assert.ok(
  token,
  'Run against a disposable app with NEANES_MCP_TOKEN and remote debugging.',
);
const targets = await (
  await fetch(
    `${process.env.NEANES_DEBUG_URL ?? 'http://127.0.0.1:9334'}/json/list`,
  )
).json();
const target = targets.find(
  (entry) =>
    entry.type === 'page' &&
    !entry.url.includes('export.html') &&
    !entry.url.startsWith('devtools:'),
);
assert.ok(target);
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) =>
  socket.addEventListener('open', resolve, { once: true }),
);
let nextId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const result = JSON.parse(event.data);
  const request = pending.get(result.id);
  if (!request) {
    return;
  }
  pending.delete(result.id);
  if (result.error || result.result?.exceptionDetails) {
    request.reject(new Error(JSON.stringify(result)));
  } else {
    request.resolve(result.result);
  }
});
function send(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  return (
    await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
  ).result.value;
}
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
const client = new Client({ name: 'neanes-selection-smoke', version: '1.0.0' });
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp'),
    { requestInit: { headers: { Authorization: `Bearer ${token}` } } },
  ),
);
const tools = (await client.listTools()).tools;
const validator = new AjvJsonSchemaValidator();
const inputs = new Map(
  tools.map((tool) => [tool.name, validator.getValidator(tool.inputSchema)]),
);
const outputs = new Map(
  tools.map((tool) => [tool.name, validator.getValidator(tool.outputSchema)]),
);
async function call(name, args = {}, error) {
  if (!error) {
    assert.equal(inputs.get(name)(args).valid, true);
  }
  const result = await client.callTool({ name, arguments: args });
  const outcome = result.structuredContent;
  assert.deepEqual(outcome, JSON.parse(result.content[0].text));
  assert.equal(outputs.get(name)(outcome).valid, true);
  assert.equal(outcome.success, !error, JSON.stringify(outcome));
  if (error) {
    assert.equal(outcome.error.code, error);
  } else {
    return outcome.result;
  }
}
const introduced = [];
let sessionId;
try {
  const created = await call('create_document', {
    title: 'Selection regression',
  });
  const args = { documentId: created.documentId };
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
  let baseline = await call('get_document', args);
  let state = await evaluate(
    'JSON.stringify({dirty:window._editor.selectedWorkspace.value.hasUnsavedChanges,history:window._editor.selectedWorkspace.value.commandService.commandHistory.length})',
  );
  const ids = await evaluate(
    'window._editor.elements.value.slice(0,2).map(e=>e.id)',
  );
  await click(`#element-${ids[0]} > .neume-box > .syllable-box`);
  const selected = await call('get_selection', args);
  baseline = await call('get_document', args);
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
  assert.deepEqual(await call('get_document', args), baseline);
  assert.equal(
    await evaluate(
      'JSON.stringify({dirty:window._editor.selectedWorkspace.value.hasUnsavedChanges,history:window._editor.selectedWorkspace.value.commandService.commandHistory.length})',
    ),
    state,
  );
  const control = await call('create_document', {
    title: 'Selection background control',
  });
  introduced.push({ documentId: control.documentId });
  const remembered = await call('get_selection', args);
  assert.equal(remembered.status, 'remembered');
  assert.equal(remembered.selection.kind, 'headerFooter');
  assert.equal(
    await evaluate('window._editor.selectedWorkspace.value.id'),
    control.documentId,
  );
  sessionId = (await call('create_session')).sessionId;
  const privateDocument = await call('create_document', { sessionId });
  const privateArgs = { sessionId, documentId: privateDocument.documentId };
  introduced.push(privateArgs);
  const unavailable = await call('get_selection', privateArgs);
  assert.equal(unavailable.status, 'unavailable');
  assert.equal(unavailable.selection, null);
  await call(
    'get_selection',
    { documentId: privateDocument.documentId },
    'DOCUMENT_NOT_FOUND',
  );
  await call('get_selection', { ...args, sessionId }, 'DOCUMENT_NOT_FOUND');
  const current = await call('get_document', { ...args, sections: [] });
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
    'Selection regression passed: UI clicks/ranges, nested/lyric/template state, remembered tabs, isolated access, revisions and read-only state.',
  );
} finally {
  for (const args of introduced.reverse()) {
    const current = await call('get_document', { ...args, sections: [] });
    await call('close_document', {
      ...args,
      expectedRevision: current.revision,
      discardUnsavedChanges: true,
    });
  }
  if (sessionId) {
    await call('close_session', { sessionId, discardUnsavedChanges: true });
  }
  socket.close();
  await client.close();
}
