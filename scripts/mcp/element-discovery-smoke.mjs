import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';
import { connectCdp, editorTarget } from './smokeCdp.mjs';
import {
  closeDocument,
  connectHttpClient,
  createToolCaller,
} from './smokeClient.mjs';

const directory = process.argv[2];
const token = process.env.NEANES_MCP_TOKEN;
if (!directory || !path.isAbsolute(directory) || !token) {
  throw new Error(
    'Usage: NEANES_MCP_TOKEN=... node scripts/mcp/element-discovery-smoke.mjs /absolute/allowed/directory',
  );
}
const client = await connectHttpClient('neanes-element-discovery-smoke');
const call = createToolCaller(client);
// Optional renderer access exercises live edits that the save format omits.
// Restrict this to a disposable Electron profile.
let debugSocket;
async function mutateChildren(documentId, operation) {
  debugSocket ??= await connectCdp(
    (await editorTarget(process.env.NEANES_DEBUG_URL)).webSocketDebuggerUrl,
  );
  return debugSocket.evaluate(`(() => {
    const workspace = window._editor.workspaces.value.find(w => w.id === ${JSON.stringify(documentId)});
    const note = workspace.score.staff.elements[0];
    ${operation}
  })()`);
}

const documents = [];
let sessionId;
const fixture = path.join(directory, `element-discovery-${Date.now()}.byzx`);
try {
  const tools = await client.listTools();
  for (const name of ['get_element_catalog', 'get_elements']) {
    assert.equal(
      tools.tools.find((t) => t.name === name)?.annotations.readOnlyHint,
      true,
    );
  }
  const catalog = await call('get_element_catalog', { includeNeumes: true });
  assert.equal(catalog.elementTypes.length, 11);
  assert.ok(catalog.neumes.QuantitativeNeume.includes('Oligon'));
  sessionId = (await call('create_session')).sessionId;
  const seed = await call('create_document', { sessionId });
  const { score } = await readScoreSnapshot(call, {
    sessionId,
    documentId: seed.documentId,
  });
  await call('close_document', {
    sessionId,
    documentId: seed.documentId,
    expectedRevision: seed.revision,
    discardUnsavedChanges: true,
  });
  score.staff.elements = [
    {
      elementType: 'Note',
      quantitativeNeume: 'Oligon',
      lyrics: 'word',
      lyricsFontSize: 19,
      annotations: [
        { elementType: 'Annotation', text: 'annotation', x: 5, y: -6 },
      ],
      alternateLines: [
        {
          elementType: 'AlternateLine',
          x: 0,
          y: 10,
          elements: [{ elementType: 'Note', quantitativeNeume: 'Ison' }],
        },
      ],
    },
    {
      elementType: 'Martyria',
      note: 'Pa',
      rootSign: 'Alpha',
      scale: 'Diatonic',
    },
    { elementType: 'Tempo', neume: 'Moderate', bpm: 100 },
    ...['TextBox', 'DropCap'].flatMap((elementType) => {
      const element = {
        elementType,
        content: 'Line height',
        ...(elementType === 'TextBox' ? { height: 20 } : {}),
      };
      return [
        { ...element, lineHeight: null },
        { ...element },
        { ...element, lineHeight: 1.2 },
      ];
    }),
    { elementType: 'Empty' },
  ];
  await fs.writeFile(fixture, JSON.stringify(score));
  for (const scope of [{}, { sessionId }]) {
    const opened = await call('open_document', { ...scope, filePath: fixture });
    assert.equal(opened.created, true);
    const args = { ...scope, documentId: opened.documentId };
    documents.push(args);
    const before = await readScoreSnapshot(call, args);
    const first = await call('get_elements', {
      ...args,
      start: 0,
      end: 3,
      limit: 1,
    });
    assert.equal(first.elements[0].properties.lyrics, 'word');
    assert.equal(first.elements[0].properties.lyricsFontSize, 19);
    assert.equal(
      Object.hasOwn(first.elements[0].properties, 'accidental'),
      false,
    );
    assert.equal(first.elements[0].properties.noteIndicator, false);
    assert.equal(first.elements[0].properties.spaceAfter, 0);
    assert.ok(
      Object.values(first.elements[0].properties).every(
        (value) => value != null,
      ),
    );
    assert.equal(first.elements[0].properties.computedColor, undefined);
    assert.deepEqual(first.elements[0].children, {
      annotations: 1,
      alternateLines: 1,
    });
    const ref = first.elements[0].elementRef;
    const next = await call('get_elements', {
      ...args,
      expectedRevision: first.revision,
      start: 0,
      end: 3,
      offset: first.nextOffset,
      limit: 2,
    });
    assert.deepEqual(
      next.elements.map((e) => e.elementType),
      ['Martyria', 'Tempo'],
    );
    assert.equal(next.nextOffset, null);
    const children = (collection) => ({
      kind: 'children',
      parentRef: ref,
      collection,
    });
    const annotations = await call('get_elements', {
      ...args,
      collection: children('annotations'),
    });
    assert.equal(annotations.elements[0].properties.text, 'annotation');
    const contentArgs = {
      ...args,
      elementRef: annotations.elements[0].elementRef,
      property: 'text',
      limit: 2,
    };
    let contentOffset = 0;
    let annotationText = '';
    while (true) {
      const chunk = await call('get_element_content', {
        ...contentArgs,
        offset: contentOffset,
        expectedRevision: annotations.revision,
      });
      annotationText += chunk.content;
      if (chunk.nextOffset === null) {
        break;
      }
      contentOffset = chunk.nextOffset;
    }
    assert.equal(annotationText, 'annotation');
    await call(
      'get_element_content',
      {
        ...contentArgs,
        expectedRevision: annotations.revision + 1,
      },
      'REVISION_CONFLICT',
    );
    const alternates = await call('get_elements', {
      ...args,
      collection: children('alternateLines'),
    });
    const nested = await call('get_elements', {
      ...args,
      collection: {
        kind: 'children',
        parentRef: alternates.elements[0].elementRef,
        collection: 'elements',
      },
    });
    assert.equal(nested.elements[0].properties.quantitativeNeume, 'Ison');
    for (const kind of ['headers', 'footers']) {
      for (const variant of catalog.headerFooterVariants) {
        const template = await call('get_elements', {
          ...args,
          collection: { kind, variant },
        });
        assert.equal(template.elements[0].elementType, 'TextBox');
      }
    }
    const lineHeights = await call('get_elements', {
      ...args,
      start: 3,
      end: 9,
    });
    for (const offset of [0, 3]) {
      assert.equal(lineHeights.elements[offset].properties.lineHeight, null);
      assert.equal(
        Object.hasOwn(
          lineHeights.elements[offset + 1].properties,
          'lineHeight',
        ),
        false,
      );
      assert.equal(lineHeights.elements[offset + 2].properties.lineHeight, 1.2);
    }
    const after = await readScoreSnapshot(call, args);
    assert.deepEqual(after, before);
    await call('get_elements', { ...args, end: 999 }, 'INVALID_ELEMENT_RANGE');
    await call(
      'get_elements',
      { ...args, collection: children('elements') },
      'INVALID_ELEMENT_COLLECTION',
    );
    await call(
      'get_elements',
      { ...args, expectedRevision: after.revision + 1 },
      'REVISION_CONFLICT',
    );
    const changed = await call('replace_document_properties', {
      ...args,
      expectedRevision: after.revision,
      properties: { title: 'Updated metadata', author: '' },
    });
    assert.ok(changed.revision > after.revision);
    await call(
      'get_elements',
      { ...args, expectedRevision: after.revision },
      'REVISION_CONFLICT',
    );
    assert.equal(
      (await call('get_elements', args)).elements[0].elementRef,
      ref,
    );
    await call(
      'get_elements',
      { ...args, sessionId: scope.sessionId ? undefined : sessionId },
      'DOCUMENT_NOT_FOUND',
    );
    if (!scope.sessionId && process.env.NEANES_DEBUG_URL) {
      // Keep blank annotation editors unmounted: focusing/blurring them can
      // legitimately delete blank drafts before the revision check runs.
      const foreground = await call('create_document', {
        title: 'Revision regression control',
      });
      documents.push({ documentId: foreground.documentId });
      await mutateChildren(
        args.documentId,
        `
        const blank = note.annotations[0].clone();
        blank.text = '';
        note.annotations.push(blank, blank.clone());
      `,
      );
      const collection = children('annotations');
      for (const operation of ['insert', 'update', 'remove', 'replace']) {
        const page = await call('get_elements', {
          ...args,
          collection,
          limit: 1,
        });
        const first = page.elements[0];
        const definition = {
          elementType: 'Annotation',
          properties: { text: '<p>Revision check</p>', x: 5, y: -6 },
        };
        const action =
          operation === 'insert'
            ? {
                action: operation,
                collection,
                index: 0,
                elements: [definition],
              }
            : operation === 'update'
              ? {
                  action: operation,
                  elementRef: first.elementRef,
                  elementType: 'Annotation',
                  properties: { x: first.properties.x + 10 },
                }
              : operation === 'replace'
                ? {
                    action: operation,
                    elementRef: first.elementRef,
                    element: definition,
                  }
                : { action: operation, elementRef: first.elementRef };
        // Exercise actual application commands, including structural changes.
        // Direct mutations bypass the revision invariant by design.
        await call('edit_elements', {
          ...args,
          expectedRevision: page.revision,
          actions: [action],
        });
        const after = await call('get_document_properties', args);
        assert.ok(after.revision > page.revision);
        await call(
          'get_elements',
          {
            ...args,
            collection,
            offset: page.nextOffset,
            expectedRevision: page.revision,
          },
          'REVISION_CONFLICT',
        );
      }
      console.log('Live child edits invalidate stale discovery revisions.');
    }
    if (scope.sessionId) {
      const other = await call('get_elements', documents[0]);
      await call(
        'get_elements',
        {
          ...args,
          collection: {
            kind: 'children',
            parentRef: other.elements[0].elementRef,
            collection: 'annotations',
          },
        },
        'ELEMENT_NOT_FOUND',
      );
    }
  }
  console.log(
    'Element discovery passed for interactive and isolated documents.',
  );
} finally {
  for (const args of documents.reverse()) {
    await closeDocument(call, args);
  }
  if (sessionId) {
    await call('close_session', { sessionId, discardUnsavedChanges: true });
  }
  await fs.rm(fixture, { force: true });
  debugSocket?.close();
  await client.close();
}
