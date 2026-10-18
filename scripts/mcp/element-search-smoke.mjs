import assert from 'node:assert/strict';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';

const token = process.env.NEANES_MCP_TOKEN;
if (!token) {
  throw new Error(
    'NEANES_MCP_TOKEN is required. Run against a disposable app profile.',
  );
}
const client = new Client({
  name: 'neanes-element-search-smoke',
  version: '1.0.0',
});
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp'),
    {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    },
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
    assert.equal(
      inputs.get(name)(args).valid,
      true,
      `Invalid published input for ${name}`,
    );
  }
  const reply = await client.callTool({ name, arguments: args });
  const outcome = reply.structuredContent;
  assert.deepEqual(outcome, JSON.parse(reply.content[0].text));
  assert.equal(
    outputs.get(name)(outcome).valid,
    true,
    `Invalid published output for ${name}`,
  );
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
  for (const name of ['find_elements', 'get_element']) {
    assert.equal(
      tools.find((tool) => tool.name === name).annotations.readOnlyHint,
      true,
    );
  }
  sessionId = (await call('create_session')).sessionId;
  for (const scope of [{}, { sessionId }]) {
    const created = await call('create_document', {
      ...scope,
      title: 'Element search regression',
    });
    const args = { ...scope, documentId: created.documentId };
    introduced.push(args);
    const inserted = await call('edit_elements', {
      ...args,
      expectedRevision: created.revision,
      actions: [
        {
          action: 'insert',
          elements: [
            {
              elementType: 'Note',
              clientId: 'note',
              properties: { measureBarLeft: 'MeasureBarRight' },
            },
            {
              elementType: 'TextBox',
              clientId: 'box',
              properties: { content: 'Search content', lineHeight: null },
            },
            {
              elementType: 'DropCap',
              clientId: 'drop',
              properties: { content: 'A', fontSize: 80 },
            },
          ],
        },
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: '@note',
            collection: 'annotations',
          },
          elements: [
            {
              elementType: 'Annotation',
              clientId: 'annotation',
              properties: { text: '<p>Search annotation</p>' },
            },
          ],
        },
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: '@note',
            collection: 'alternateLines',
          },
          elements: [{ elementType: 'AlternateLine', clientId: 'alternate' }],
        },
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: '@alternate',
            collection: 'elements',
          },
          elements: [{ elementType: 'Note', clientId: 'altNote' }],
        },
      ],
    });
    const refs = Object.fromEntries(
      inserted.created.map((element) => [element.clientId, element.elementRef]),
    );
    const before = await readScoreSnapshot(call, args);
    const searchArgs = { ...args, expectedRevision: before.revision };
    const bars = await call('find_elements', {
      ...searchArgs,
      where: {
        or: [
          { field: 'measureBarLeft', op: 'isNotNull' },
          { field: 'measureBarRight', op: 'isNotNull' },
        ],
      },
    });
    assert.deepEqual(
      bars.elements.map((element) => element.elementRef),
      [refs.note],
    );
    assert.deepEqual(bars.elements[0].properties, {});
    const drops = await call('find_elements', {
      ...searchArgs,
      elementTypes: ['DropCap'],
      where: {
        and: [
          { field: 'fontSize', op: 'in', values: [70, 80] },
          { field: 'content', op: 'eq', value: 'A' },
        ],
      },
      properties: ['fontSize', 'content'],
    });
    assert.deepEqual(
      drops.elements.map((element) => element.elementRef),
      [refs.drop],
    );
    assert.deepEqual(drops.elements[0].properties, {
      fontSize: 80,
      content: 'A',
    });
    const notes = await call('find_elements', {
      ...searchArgs,
      elementTypes: ['Note'],
      limit: 1,
    });
    const second = await call('find_elements', {
      ...searchArgs,
      elementTypes: ['Note'],
      limit: 1,
      offset: notes.nextOffset,
    });
    assert.equal(notes.elements[0].elementRef, refs.note);
    assert.equal(second.elements[0].elementRef, refs.altNote);
    assert.equal(second.nextOffset, null);
    assert.deepEqual(second.elements[0].collection, {
      kind: 'children',
      parentRef: refs.alternate,
      collection: 'elements',
    });
    const staff = { kind: 'collection', collection: { kind: 'staff' } };
    const unset = await call('find_elements', {
      ...searchArgs,
      scope: staff,
      where: {
        and: [
          { field: 'lineHeight', op: 'isNull' },
          { field: 'content', op: 'in', values: ['Search content', 'A'] },
        ],
      },
    });
    assert.deepEqual(
      unset.elements.map((element) => element.elementRef),
      [refs.box, refs.drop],
    );
    const normal = await call('find_elements', {
      ...searchArgs,
      scope: staff,
      where: {
        and: [
          { field: 'lineHeight', op: 'eq', value: null },
          { field: 'content', op: 'in', values: ['Search content', 'A'] },
        ],
      },
    });
    assert.deepEqual(
      normal.elements.map((element) => element.elementRef),
      [refs.box],
    );
    const window = await call('get_element', {
      ...searchArgs,
      elementRef: refs.box,
      before: 1,
      after: 1,
      properties: [],
    });
    assert.deepEqual(
      window.elements.map((element) => element.elementRef),
      [refs.note, refs.box, refs.drop],
    );
    const child = await call('get_element', {
      ...searchArgs,
      elementRef: refs.annotation,
      before: 10,
      after: 10,
    });
    assert.equal(child.elements.length, 1);
    assert.deepEqual(child.collection, {
      kind: 'children',
      parentRef: refs.note,
      collection: 'annotations',
    });
    const header = await call('find_elements', {
      ...searchArgs,
      scope: {
        kind: 'collection',
        collection: { kind: 'headers', variant: 'odd' },
      },
    });
    assert.equal(header.elements.length, 1);
    assert.deepEqual(
      (
        await call('get_element', {
          ...searchArgs,
          elementRef: header.elements[0].elementRef,
        })
      ).collection,
      header.elements[0].collection,
    );
    assert.deepEqual(await readScoreSnapshot(call, args), before);
    await call(
      'find_elements',
      { ...args, where: { field: 'fontSize', op: 'eq', value: 'invalid' } },
      'VALIDATION_ERROR',
    );
    let deep = { field: 'fontSize', op: 'isNull' };
    for (let i = 0; i < 1000; i++) {
      deep = { and: [deep] };
    }
    await call('find_elements', { ...args, where: deep }, 'VALIDATION_ERROR');
    const edited = await call('edit_elements', {
      ...args,
      expectedRevision: before.revision,
      actions: [{ action: 'remove', elementRef: refs.drop }],
    });
    await call('find_elements', searchArgs, 'REVISION_CONFLICT');
    await call(
      'get_element',
      { ...searchArgs, elementRef: refs.box },
      'REVISION_CONFLICT',
    );
    await call(
      'get_element',
      { ...args, expectedRevision: edited.revision, elementRef: refs.drop },
      'ELEMENT_NOT_FOUND',
    );
    console.log(
      `Element search passed: ${scope.sessionId ? 'isolated' : 'interactive'}`,
    );
  }
} finally {
  for (const args of introduced.reverse()) {
    const current = await readScoreSnapshot(call, { ...args, sections: [] });
    await call('close_document', {
      ...args,
      expectedRevision: current.revision,
      discardUnsavedChanges: true,
    });
  }
  if (sessionId) {
    await call('close_session', { sessionId, discardUnsavedChanges: true });
  }
  await client.close();
}
