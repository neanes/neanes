import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';
import { connectCdp, editorTarget } from './smokeCdp.mjs';
import {
  closeDocument,
  connectStdioClient,
  createToolCaller,
} from './smokeClient.mjs';

const directory = process.argv[2];
assert.ok(
  directory && path.isAbsolute(directory),
  'Pass an allowed absolute output directory.',
);
const client = await connectStdioClient('neanes-element-edit-smoke');
let call = createToolCaller(client);
let socket;
async function evaluate(expression) {
  socket ??= await connectCdp(
    (await editorTarget(process.env.NEANES_DEBUG_URL)).webSocketDebuggerUrl,
  );
  return socket.evaluate(expression);
}
const image =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
const introduced = new Map();
const output = [];
let primaryError;
const stamp = Date.now();
try {
  const inventory = await call('get_element_catalog');
  assert.ok(JSON.stringify(inventory).length < 2000);
  assert.ok(inventory.elementTypes.every((type) => !('properties' in type)));
  const tools = await client.listTools();
  assert.ok(JSON.stringify(tools).length < 153000);
  const capabilities = await call('get_capabilities', {
    includeErrorCodes: true,
  });
  assert.ok(capabilities.errorCodes.includes('REVISION_CONFLICT'));
  call = createToolCaller(client, tools.tools);
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
    documentScope: 'editor',
    title: 'Interactive control',
  });
  const controlArgs = {
    documentScope: 'editor',
    documentId: control.documentId,
  };
  introduced.set(control.documentId, controlArgs);
  const controlPath = path.join(directory, `edit-${stamp}-control.byzx`);
  output.push(controlPath);
  await call('save_document', {
    ...controlArgs,
    expectedRevision: control.revision,
    filePath: controlPath,
  });
  for (const scope of [
    { documentScope: 'editor' },
    { documentScope: 'private' },
  ]) {
    const unrelatedBefore = await readScoreSnapshot(call, controlArgs);
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
    const before = await readScoreSnapshot(call, args);
    const metadataOnly = await call('get_document_properties', args);
    assert.equal(metadataOnly.revision, before.revision);
    assert.deepEqual(metadataOnly.properties, {
      title: 'Transactions',
      author: '',
    });
    const elementSection = await call('get_elements', {
      ...args,
      limit: 1,
      properties: [],
      expectedRevision: before.revision,
    });
    assert.equal(elementSection.elements.length, 1);
    assert.deepEqual(elementSection.elements[0].properties, {});
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
    assert.deepEqual(await readScoreSnapshot(call, args), before);
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
            {
              elementType: 'ModeKey',
              clientId: 'mode',
              properties: {
                templateId: 100,
                useOptionalDiatonicFthoras: false,
              },
            },
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
    let current = await readScoreSnapshot(call, args);
    assert.equal(current.score.staff.elements[1].lyrics, 'Al');
    assert.equal(current.score.staff.elements[1].lyricsFontSize, 21);
    assert.equal(current.score.staff.elements[1].annotations.length, 1);
    const staff = await call('get_elements', args);
    assert.equal(staff.elements[1].elementRef, refs.first);
    assert.equal(staff.elements[3].properties.bpm, 168);
    assert.equal(staff.elements[4].properties.lineHeight, null);
    if (scope.documentScope === 'editor' && process.env.NEANES_DEBUG_URL) {
      await evaluate(
        `document.querySelector('.main-toolbar button[aria-label^="Undo"]').click()`,
      );
      const undone = await readScoreSnapshot(call, args);
      assert.deepEqual(
        undone.score,
        before.score,
        'One undo must restore the whole transaction.',
      );
      await evaluate(
        `document.querySelector('.main-toolbar button[aria-label^="Redo"]').click()`,
      );
      current = await readScoreSnapshot(call, args);
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
    const invalidBefore = await readScoreSnapshot(call, args);
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
      assert.deepEqual(await readScoreSnapshot(call, args), invalidBefore);
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
    assert.deepEqual(await readScoreSnapshot(call, args), invalidBefore);
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
          !('data' in element.properties) &&
          (element.elementType === 'DropCap' ||
            !('content' in element.properties)),
      ),
    );
    assert.equal(
      withoutContent.elements.find(
        (element) => element.elementType === 'DropCap',
      ).properties.content,
      'A',
    );
    await call(
      'get_document_properties',
      {
        ...args,
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
    current = await readScoreSnapshot(call, args);
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
    current = await readScoreSnapshot(call, args);
    const notes = await call('get_elements', args);
    assert.equal(notes.elements[1].properties.chromaticFthoraNote, 'Thi');
    const locked = await call('edit_elements', {
      ...args,
      expectedRevision: current.revision,
      actions: [
        { action: 'set_staff_lyrics', text: 'Ky- ri- e', locked: true },
      ],
    });
    let managerText = '';
    let lyricsOffset = 0;
    while (true) {
      const chunk = await call('get_staff_lyrics', {
        ...args,
        offset: lyricsOffset,
        limit: 2,
        expectedRevision: locked.revision,
      });
      assert.equal(chunk.locked, true);
      managerText += chunk.text;
      if (chunk.nextOffset === null) {
        break;
      }
      lyricsOffset = chunk.nextOffset;
    }
    assert.equal(managerText, 'Ky- ri- e');
    await call(
      'get_staff_lyrics',
      {
        ...args,
        expectedRevision: locked.revision + 1,
      },
      'REVISION_CONFLICT',
    );
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
        `edit-${stamp}-${scope.documentScope === 'private' ? 'private' : 'editor'}.${suffix}`,
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
      `edit-${stamp}-${scope.documentScope === 'private' ? 'private' : 'editor'}.pdf`,
    );
    output.push(pdf);
    const exported = await call('export_pdf', {
      ...args,
      expectedRevision: revision,
      filePath: pdf,
    });
    assert.ok((await fs.stat(pdf)).size > 1000);
    const sourcePath = exported.filePath;
    const savedScore = (await readScoreSnapshot(call, args)).score;
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
    const reloaded = await readScoreSnapshot(call, reopenArgs);
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
      (await readScoreSnapshot(call, controlArgs)).score,
      unrelatedBefore.score,
    );
    if (scope.documentScope === 'private' && process.env.NEANES_DEBUG_URL) {
      assert.equal(
        await evaluate(
          `JSON.stringify(window._editor.workspaces.value.find(w => w.id === ${JSON.stringify(control.documentId)}))`,
        ),
        controlState,
      );
    }
  }
  console.log(
    'Element edit transactions passed for editor and private-worker documents, save/reopen, PDF and optional UI undo/redo.',
  );
} catch (error) {
  primaryError = error;
  throw error;
} finally {
  try {
    for (const args of [...introduced.values()].reverse()) {
      await closeDocument(call, args);
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
