import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';

const directory = process.argv[2];
const token = process.env.NEANES_MCP_TOKEN;
assert.ok(
  directory && path.isAbsolute(directory) && token,
  'Pass an allowed output directory and NEANES_MCP_TOKEN.',
);
const client = new Client({
  name: 'neanes-element-edit-smoke',
  version: '1.0.0',
});
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp'),
    { requestInit: { headers: { Authorization: `Bearer ${token}` } } },
  ),
);
let inputValidators;
async function call(name, args = {}, error) {
  // Deliberately invalid calls must reach runtime validation below.
  if (inputValidators && !error) {
    assert.equal(
      inputValidators.get(name)(args).valid,
      true,
      `Published input schema rejects ${name}`,
    );
  }
  const reply = await client.callTool({ name, arguments: args });
  const outcome = reply.structuredContent;
  assert.deepEqual(outcome, JSON.parse(reply.content[0].text));
  if (error) {
    assert.equal(outcome.success, false, JSON.stringify(outcome));
    assert.equal(outcome.error.code, error);
  } else {
    assert.equal(outcome.success, true, JSON.stringify(outcome));
    return outcome.result;
  }
}
let socket;
let nextId = 0;
async function evaluate(expression) {
  if (!socket) {
    const targets = await (
      await fetch(`${process.env.NEANES_DEBUG_URL}/json/list`)
    ).json();
    const target = targets.find(
      (target) =>
        target.type === 'page' &&
        !target.url.includes('export.html') &&
        !target.url.startsWith('devtools:'),
    );
    assert.ok(target);
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) =>
      socket.addEventListener('open', resolve, { once: true }),
    );
  }
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const handler = (event) => {
      const reply = JSON.parse(event.data);
      if (reply.id !== id) {
        return;
      }
      socket.removeEventListener('message', handler);
      if (reply.error || reply.result?.exceptionDetails) {
        reject(new Error(JSON.stringify(reply)));
      } else {
        resolve(reply.result.result.value);
      }
    };
    socket.addEventListener('message', handler);
    socket.send(
      JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression, awaitPromise: true, returnByValue: true },
      }),
    );
  });
}
const image =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
const introduced = new Map();
const output = [];
let sessionId;
let primaryError;
const stamp = Date.now();
try {
  const inventory = await call('get_element_catalog');
  assert.ok(JSON.stringify(inventory).length < 2000);
  assert.ok(inventory.elementTypes.every((type) => !('properties' in type)));
  const tools = await client.listTools();
  assert.ok(JSON.stringify(tools).length < 97500);
  const capabilities = await call('get_capabilities', {
    includeErrorCodes: true,
  });
  assert.ok(capabilities.errorCodes.includes('REVISION_CONFLICT'));
  const validator = new AjvJsonSchemaValidator();
  inputValidators = new Map(
    tools.tools.map((tool) => [
      tool.name,
      validator.getValidator(tool.inputSchema),
    ]),
  );
  assert.ok(
    JSON.stringify(
      tools.tools.find((tool) => tool.name === 'edit_elements').inputSchema,
    ).length < 12000,
  );
  assert.equal(inventory.tempoBpmDefaults.Quick, 168);
  const catalog = await call('get_element_catalog', {
    elementTypes: ['Note'],
    view: 'edit',
  });
  assert.ok(
    catalog.elementTypes.find((type) => type.elementType === 'Note')
      .editProperties,
  );
  const control = await call('create_document', {
    title: 'Interactive control',
  });
  const controlArgs = { documentId: control.documentId };
  introduced.set(control.documentId, controlArgs);
  const controlPath = path.join(directory, `edit-${stamp}-control.byzx`);
  output.push(controlPath);
  await call('save_document', {
    ...controlArgs,
    expectedRevision: control.revision,
    filePath: controlPath,
  });
  sessionId = (await call('create_session')).sessionId;
  for (const scope of [{}, { sessionId }]) {
    const unrelatedBefore = await call('get_document', controlArgs);
    const controlState = process.env.NEANES_DEBUG_URL
      ? await evaluate(
          `JSON.stringify(window._editor.workspaces.value.find(w => w.id === ${JSON.stringify(control.documentId)}))`,
        )
      : null;
    const created = await call('create_document', {
      ...scope,
      title: 'Transactions',
    });
    const args = { ...scope, documentId: created.documentId };
    introduced.set(created.documentId, args);
    const before = await call('get_document', args);
    const metadataOnly = await call('get_document', { ...args, sections: [] });
    assert.equal(metadataOnly.revision, before.revision);
    assert.deepEqual(Object.keys(metadataOnly.score).sort(), [
      'appVersion',
      'version',
    ]);
    assert.equal(metadataOnly.nextOffset, null);
    const elementSection = await call('get_document', {
      ...args,
      sections: ['staffElements'],
      limit: 1,
      expectedRevision: before.revision,
    });
    assert.deepEqual(Object.keys(elementSection.score.staff), ['elements']);
    await call(
      'edit_elements',
      {
        ...args,
        expectedRevision: before.revision,
        actions: [
          {
            action: 'insert',
            elements: [{ elementType: 'Note', clientId: 'bad' }],
          },
          {
            action: 'update',
            elementRef: '@bad',
            elementType: 'Note',
            properties: { internalThing: true },
          },
        ],
      },
      'VALIDATION_ERROR',
    );
    assert.deepEqual(await call('get_document', args), before);
    const header = await call('get_elements', {
      ...args,
      collection: { kind: 'headers', variant: 'default' },
    });
    const inserted = await call('edit_elements', {
      ...args,
      expectedRevision: before.revision,
      actions: [
        {
          action: 'insert',
          index: 0,
          elements: [
            { elementType: 'ModeKey', clientId: 'mode' },
            {
              elementType: 'Note',
              clientId: 'first',
              properties: {
                quantitativeNeume: 'Oligon',
                lyricsFontSize: 21,
                fthora: 'SoftChromaticPa_Top',
                chromaticFthoraNote: 'Thi',
              },
            },
            { elementType: 'Note', clientId: 'second' },
            {
              elementType: 'Tempo',
              clientId: 'tempo',
              properties: { neume: 'Quick' },
            },
            {
              elementType: 'TextBox',
              clientId: 'text',
              properties: { content: 'Plain text', lineHeight: null },
            },
            {
              elementType: 'RichTextBox',
              clientId: 'rich',
              properties: { content: '<p>Rich text</p>' },
            },
            {
              elementType: 'DropCap',
              clientId: 'drop',
              properties: { content: 'A' },
            },
            {
              elementType: 'ImageBox',
              clientId: 'image',
              properties: { data: image, imageWidth: 20, imageHeight: 20 },
            },
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
              properties: { text: '<p>Annotation</p>', x: 3 },
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
        { action: 'assign_lyrics', start: 1, end: 3, text: 'Al- le' },
        {
          action: 'replace',
          elementRef: header.elements[0].elementRef,
          element: {
            elementType: 'TextBox',
            clientId: 'header',
            properties: { content: 'Header', multipanel: true },
          },
        },
      ],
    });
    assert.equal(inserted.applied, true);
    assert.equal(inserted.created.length, 12);
    const refs = Object.fromEntries(
      inserted.created.map((element) => [element.clientId, element.elementRef]),
    );
    let current = await call('get_document', args);
    assert.equal(current.score.staff.elements[1].lyrics, 'Al');
    assert.equal(current.score.staff.elements[1].lyricsFontSize, 21);
    assert.equal(current.score.staff.elements[1].annotations.length, 1);
    const staff = await call('get_elements', args);
    assert.equal(staff.elements[1].elementRef, refs.first);
    assert.equal(staff.elements[3].properties.bpm, 168);
    assert.equal(staff.elements[4].properties.lineHeight, null);
    if (!scope.sessionId && process.env.NEANES_DEBUG_URL) {
      await evaluate(
        `document.querySelector('.main-toolbar button[aria-label^="Undo"]').click()`,
      );
      const undone = await call('get_document', args);
      assert.deepEqual(
        undone.score,
        before.score,
        'One undo must restore the whole transaction.',
      );
      await evaluate(
        `document.querySelector('.main-toolbar button[aria-label^="Redo"]').click()`,
      );
      current = await call('get_document', args);
      assert.equal(current.score.staff.elements[1].lyrics, 'Al');
      assert.equal(
        (await call('get_elements', args)).elements[1].elementRef,
        refs.first,
      );
    }
    await call(
      'edit_elements',
      {
        ...args,
        expectedRevision: before.revision,
        actions: [{ action: 'remove', elementRef: refs.second }],
      },
      'REVISION_CONFLICT',
    );
    const invalidBefore = await call('get_document', args);
    for (const action of [
      { action: 'assign_lyrics', text: 'one two three four five six' },
      { action: 'assign_lyrics', text: 'nonempty', start: 0, end: 0 },
    ]) {
      await call(
        'edit_elements',
        {
          ...args,
          expectedRevision: invalidBefore.revision,
          actions: [action],
        },
        'INVALID_ELEMENT_RANGE',
      );
      assert.deepEqual(await call('get_document', args), invalidBefore);
    }

    await call(
      'edit_elements',
      {
        ...args,
        expectedRevision: invalidBefore.revision,
        actions: [
          {
            action: 'update',
            elementRef: refs.first,
            elementType: 'Note',
            properties: { lyrics: 'partial' },
          },
          { action: 'remove_range', start: 0, end: invalidBefore.elementCount },
        ],
      },
      'INVALID_ELEMENT_EDIT',
    );
    assert.deepEqual(await call('get_document', args), invalidBefore);
    await call(
      'edit_elements',
      {
        ...args,
        expectedRevision: invalidBefore.revision,
        actions: [
          {
            action: 'update',
            elementRef: refs.first,
            elementType: 'Note',
            properties: { lyricsParagraphStyleId: 'missing' },
          },
        ],
      },
      'STYLE_NOT_FOUND',
    );
    const allElements = await call('get_elements', args);
    const projected = await call('get_elements', {
      ...args,
      properties: ['lyrics', 'quantitativeNeume'],
      includeContent: false,
      expectedRevision: allElements.revision,
    });
    assert.equal(projected.revision, allElements.revision);
    assert.deepEqual(
      projected.elements.map((element) => element.elementRef),
      allElements.elements.map((element) => element.elementRef),
    );
    for (const element of projected.elements) {
      assert.ok(
        Object.keys(element.properties).every((key) =>
          ['lyrics', 'quantitativeNeume'].includes(key),
        ),
      );
    }
    const withoutContent = await call('get_elements', {
      ...args,
      includeContent: false,
    });
    assert.ok(
      withoutContent.elements.every(
        (element) =>
          !('data' in element.properties) && !('content' in element.properties),
      ),
    );
    await call(
      'get_document',
      {
        ...args,
        sections: ['staffElements'],
        expectedRevision: before.revision,
      },
      'REVISION_CONFLICT',
    );
    const styles = await call('get_paragraph_styles', args);
    const focusedStyles = await call('get_paragraph_styles', {
      ...args,
      ids: ['lyrics'],
      includeResolved: false,
    });
    assert.deepEqual(
      focusedStyles.styles,
      styles.styles.filter((style) => style.id === 'lyrics'),
    );
    assert.ok(!('resolvedStyles' in focusedStyles));
    await call(
      'get_paragraph_styles',
      { ...args, ids: ['missing'] },
      'STYLE_NOT_FOUND',
    );
    const lyricsStyle = styles.styles.find((style) => style.id === 'lyrics');
    const compactStyleEdit = await call('edit_paragraph_styles', {
      ...args,
      expectedRevision: styles.revision,
      changes: [
        {
          action: 'replace',
          style: {
            ...lyricsStyle,
            overrides: { ...lyricsStyle.overrides, fontSize: 30 },
          },
        },
      ],
    });
    assert.deepEqual(compactStyleEdit.affectedStyleIds, ['lyrics']);
    assert.ok(!('styles' in compactStyleEdit));
    assert.ok(!('resolvedStyles' in compactStyleEdit));
    current = await call('get_document', args);
    assert.equal(current.score.staff.elements[1].lyricsFontSize, 21);
    await call('edit_elements', {
      ...args,
      expectedRevision: current.revision,
      actions: [
        {
          action: 'update',
          elementRef: refs.first,
          elementType: 'Note',
          properties: { fthora: 'SoftChromaticPa_Top' },
        },
      ],
    });
    current = await call('get_document', args);
    const notes = await call('get_elements', args);
    assert.equal(notes.elements[1].properties.chromaticFthoraNote, 'Thi');
    const locked = await call('edit_elements', {
      ...args,
      expectedRevision: current.revision,
      actions: [
        { action: 'set_staff_lyrics', text: 'Ky- ri- e', locked: true },
      ],
    });
    await call(
      'edit_elements',
      {
        ...args,
        expectedRevision: locked.revision,
        actions: [{ action: 'assign_lyrics', text: 'wrong' }],
      },
      'LYRICS_LOCKED',
    );
    const alternateEdit = await call('edit_elements', {
      ...args,
      expectedRevision: locked.revision,
      actions: [
        {
          action: 'update',
          elementRef: refs.altNote,
          elementType: 'Note',
          properties: { lyrics: 'direct' },
        },
        {
          action: 'assign_lyrics',
          collection: {
            kind: 'children',
            parentRef: refs.alternate,
            collection: 'elements',
          },
          text: 'alternate',
        },
      ],
    });
    const alternateNotes = await call('get_elements', {
      ...args,
      collection: {
        kind: 'children',
        parentRef: refs.alternate,
        collection: 'elements',
      },
    });
    assert.equal(alternateNotes.elements[0].properties.lyrics, 'alternate');
    let revision = alternateEdit.revision;
    for (const suffix of ['byzx', 'byz']) {
      const filePath = path.join(
        directory,
        `edit-${stamp}-${scope.sessionId ? 'isolated' : 'interactive'}.${suffix}`,
      );
      output.push(filePath);
      const result = await call('save_document', {
        ...args,
        expectedRevision: revision,
        filePath,
      });
      revision = result.revision;
    }
    const pdf = path.join(
      directory,
      `edit-${stamp}-${scope.sessionId ? 'isolated' : 'interactive'}.pdf`,
    );
    output.push(pdf);
    const exported = await call('export_pdf', {
      ...args,
      expectedRevision: revision,
      filePath: pdf,
    });
    assert.ok((await fs.stat(pdf)).size > 1000);
    const sourcePath = exported.filePath;
    const savedScore = (await call('get_document', args)).score;
    await call('close_document', {
      ...args,
      expectedRevision: exported.revision,
      discardUnsavedChanges: true,
    });
    introduced.delete(args.documentId);
    const reopened = await call('open_document', {
      ...scope,
      filePath: sourcePath,
    });
    const reopenArgs = { ...scope, documentId: reopened.documentId };
    introduced.set(reopened.documentId, reopenArgs);
    const reloaded = await call('get_document', reopenArgs);
    assert.deepEqual(
      reloaded.score.staff.elements.map((element) => element.elementType),
      savedScore.staff.elements.map((element) => element.elementType),
    );
    assert.equal(reloaded.score.staff.elements[1].lyricsFontSize, 21);
    await call('close_document', {
      ...reopenArgs,
      expectedRevision: reloaded.revision,
      discardUnsavedChanges: true,
    });
    introduced.delete(reopened.documentId);
    assert.deepEqual(
      (await call('get_document', controlArgs)).score,
      unrelatedBefore.score,
    );
    if (scope.sessionId && process.env.NEANES_DEBUG_URL) {
      assert.equal(
        await evaluate(
          `JSON.stringify(window._editor.workspaces.value.find(w => w.id === ${JSON.stringify(control.documentId)}))`,
        ),
        controlState,
      );
    }
  }
  console.log(
    'Element edit transactions passed for interactive and isolated documents, save/reopen, PDF and optional UI undo/redo.',
  );
} catch (error) {
  primaryError = error;
  throw error;
} finally {
  try {
    for (const args of [...introduced.values()].reverse()) {
      const current = await call('get_document', args);
      await call('close_document', {
        ...args,
        expectedRevision: current.revision,
        discardUnsavedChanges: true,
      });
    }
    if (sessionId) {
      await call('close_session', { sessionId, discardUnsavedChanges: true });
    }
    for (const file of output) {
      await fs.rm(file, { force: true });
    }
  } catch (error) {
    if (!primaryError) {
      throw error;
    }
    console.error('Cleanup failed:', error);
  } finally {
    socket?.close();
    await client.close();
  }
}
