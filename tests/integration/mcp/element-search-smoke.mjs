import assert from 'node:assert/strict';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';
import {
  closeDocument,
  connectStdioClient,
  createToolCaller,
} from './smokeClient.mjs';

const client = await connectStdioClient('neanes-element-search-smoke');
const tools = (await client.listTools()).tools;
const call = createToolCaller(client, tools);
const introduced = [];
try {
  for (const name of ['find_elements', 'get_element']) {
    assert.equal(
      tools.find((tool) => tool.name === name).annotations.readOnlyHint,
      true,
    );
  }
  for (const scope of [
    { documentScope: 'editor' },
    { documentScope: 'private' },
  ]) {
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
      `Element search passed: ${scope.documentScope === 'private' ? 'private' : 'editor'}`,
    );
  }
} finally {
  for (const args of introduced.reverse()) {
    await closeDocument(call, args);
  }
  await client.close();
}
