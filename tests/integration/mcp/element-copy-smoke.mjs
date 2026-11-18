// Run outside the agent command sandbox; this starts disposable Electron apps.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';

const app = await createSmokeApp('neanes-element-copy-');
let client;
try {
  app.start({ args: ['--remote-debugging-port=0'] });
  const { evaluate } = await app.debugger();
  await app.ready();
  client = await connectStdioClient('element-copy-smoke', {
    profile: app.profile,
  });
  const call = createToolCaller(client, (await client.listTools()).tools);
  const imagePath = path.join(app.directory, 'image.png');
  const image = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
    'base64',
  );
  await writeFile(imagePath, image);
  for (const documentScope of ['private', 'editor']) {
    const scope = { documentScope };
    let source = await call('create_document', {
      ...scope,
      title: 'Copy source',
    });
    let destination = await call('create_document', {
      ...scope,
      title: 'Copy destination',
    });
    const src = { ...scope, documentId: source.documentId };
    const dst = { ...scope, documentId: destination.documentId };
    // New scores include the normal default title and mode key. Start this
    // fixture with only the terminal sentinel in each document.
    for (const args of [src, dst]) {
      const page = await call('get_elements', args);
      const cleared = await call('edit_elements', {
        ...args,
        expectedRevision: page.revision,
        actions: [
          { action: 'remove_range', start: 0, end: page.collectionSize - 1 },
        ],
      });
      if (args === src) {
        source = cleared;
      } else {
        destination = cleared;
      }
    }
    const styled = await call('edit_paragraph_styles', {
      ...src,
      expectedRevision: source.revision,
      changes: [
        {
          action: 'create',
          style: {
            id: 'copy-style',
            displayName: 'Copy style',
            parentStyleId: 'default-text',
            overrides: { fontSize: 24 },
          },
        },
      ],
    });
    const html = '<p class="neanes-paragraph-style-copy-style">Copied text</p>';
    const inserted = await call('edit_elements', {
      ...src,
      expectedRevision: styled.revision,
      actions: [
        {
          action: 'insert',
          elements: [
            {
              elementType: 'Note',
              clientId: 'note',
              properties: {
                lyrics: 'Test',
                lyricsParagraphStyleId: 'copy-style',
                lineBreak: true,
              },
            },
            {
              elementType: 'RichTextBox',
              properties: { content: html, contentRight: html },
            },
            { elementType: 'ImageBox', properties: { imagePath } },
          ],
        },
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: '@note',
            collection: 'annotations',
          },
          elements: [{ elementType: 'Annotation', properties: { text: html } }],
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
          elements: [
            {
              elementType: 'Note',
              properties: {
                lyrics: 'Alternate',
                lyricsParagraphStyleId: 'copy-style',
              },
            },
          ],
        },
      ],
    });
    const sourceRead = await call('get_elements', {
      ...src,
      includeContent: true,
    });
    const sourceStyles = await call('get_paragraph_styles', src);
    const sourceBytes = path.join(
      app.directory,
      `${documentScope}-source.byzx`,
    );
    const sourceSaved = await call('save_document', {
      ...src,
      expectedRevision: inserted.revision,
      filePath: sourceBytes,
    });
    const before = await readFile(sourceBytes);
    const target = await call('get_document_properties', dst);
    const copyArgs = {
      ...dst,
      expectedRevision: target.revision,
      sourceDocumentId: source.documentId,
      expectedSourceRevision: sourceSaved.revision,
      start: 0,
      end: 3,
      index: 0,
    };
    await call(
      'copy_elements',
      { ...copyArgs, expectedSourceRevision: styled.revision },
      'REVISION_CONFLICT',
    );
    await call(
      'copy_elements',
      { ...copyArgs, sourceDocumentId: 'missing' },
      'DOCUMENT_NOT_FOUND',
    );
    await call(
      'copy_elements',
      { ...copyArgs, end: 4 },
      'INVALID_ELEMENT_RANGE',
    );
    const copied = await call('copy_elements', copyArgs);
    assert.equal(copied.createdCount, 3);
    assert.equal(copied.sourceRevision, sourceSaved.revision);
    assert.equal(copied.hasUnsavedChanges, true);
    assert.ok(
      copied.created.every(
        (entry) =>
          !sourceRead.elements.some(
            (original) => original.elementRef === entry.elementRef,
          ),
      ),
    );
    await call('copy_elements', copyArgs, 'REVISION_CONFLICT');
    const styles = await call('get_paragraph_styles', dst);
    const imported = styles.styles.find(
      (style) => style.displayName === 'Copy style',
    );
    assert.ok(imported);
    assert.notEqual(imported.id, 'copy-style');
    const elements = await call('get_elements', {
      ...dst,
      includeContent: true,
    });
    assert.equal(elements.elements[0].properties.lyrics, 'Test');
    assert.equal(elements.elements[0].properties.lineBreak, true);
    assert.equal(
      elements.elements[0].properties.lyricsParagraphStyleId,
      imported.id,
    );
    assert.ok(elements.elements[1].properties.content.includes(imported.id));
    assert.ok(
      elements.elements[1].properties.contentRight.includes(imported.id),
    );
    const annotations = await call('get_elements', {
      ...dst,
      collection: {
        kind: 'children',
        parentRef: copied.created[0].elementRef,
        collection: 'annotations',
      },
      includeContent: true,
    });
    assert.ok(annotations.elements[0].properties.text.includes(imported.id));
    const alternates = await call('get_elements', {
      ...dst,
      collection: {
        kind: 'children',
        parentRef: copied.created[0].elementRef,
        collection: 'alternateLines',
      },
    });
    const alternateNotes = await call('get_elements', {
      ...dst,
      collection: {
        kind: 'children',
        parentRef: alternates.elements[0].elementRef,
        collection: 'elements',
      },
    });
    assert.equal(alternateNotes.elements[0].properties.lyrics, 'Alternate');
    assert.equal(
      alternateNotes.elements[0].properties.lyricsParagraphStyleId,
      imported.id,
    );
    const exportedImage = await call('get_element_image', {
      ...dst,
      elementRef: copied.created[2].elementRef,
    });
    assert.deepEqual(await readFile(exportedImage.outputFilePath), image);
    assert.deepEqual(await readFile(sourceBytes), before);
    assert.deepEqual(
      (await call('get_paragraph_styles', src)).styles,
      sourceStyles.styles,
    );
    assert.equal(
      (await call('get_document_properties', src)).revision,
      sourceSaved.revision,
    );
    assert.deepEqual(
      (await call('get_elements', { ...src, includeContent: true })).elements,
      sourceRead.elements,
    );
    if (documentScope === 'editor') {
      // Exercise real editor history: the styles and passage undo together.
      const targetWorkspace = `window._editor.workspaces.value.find(w => w.id === ${JSON.stringify(destination.documentId)})`;
      await evaluate(`${targetWorkspace}.commandService.undo()`);
      assert.equal((await call('get_elements', dst)).elements.length, 1);
      assert.ok(
        !(await call('get_paragraph_styles', dst)).styles.some(
          (style) => style.id === imported.id,
        ),
      );
      await evaluate(`${targetWorkspace}.commandService.redo()`);
      assert.equal((await call('get_elements', dst)).elements.length, 4);
    }
    const current = await call('get_document_properties', dst);
    const withoutLyrics = await call('copy_elements', {
      ...copyArgs,
      expectedRevision: current.revision,
      end: 1,
      index: 3,
      includeLyrics: false,
    });
    const withoutLyricsRef = withoutLyrics.created[0].elementRef;
    const copiedNote = await call('get_element', {
      ...dst,
      elementRef: withoutLyricsRef,
    });
    assert.equal(copiedNote.elements[0].properties.lyrics, '');
    assert.equal(
      copiedNote.elements[0].properties.lyricsParagraphStyleId,
      'lyrics',
    );
    const copiedAlternates = await call('get_elements', {
      ...dst,
      collection: {
        kind: 'children',
        parentRef: withoutLyricsRef,
        collection: 'alternateLines',
      },
    });
    const copiedAlternateNotes = await call('get_elements', {
      ...dst,
      collection: {
        kind: 'children',
        parentRef: copiedAlternates.elements[0].elementRef,
        collection: 'elements',
      },
    });
    assert.equal(copiedAlternateNotes.elements[0].properties.lyrics, '');
    assert.equal(
      copiedAlternateNotes.elements[0].properties.lyricsParagraphStyleId,
      'lyrics',
    );
    const copiedAnnotations = await call('get_elements', {
      ...dst,
      collection: {
        kind: 'children',
        parentRef: withoutLyricsRef,
        collection: 'annotations',
      },
      includeContent: true,
    });
    assert.ok(
      copiedAnnotations.elements[0].properties.text.includes('Copied text'),
    );
    const duplicate = await call('copy_elements', {
      ...dst,
      expectedRevision: withoutLyrics.revision,
      sourceDocumentId: destination.documentId,
      expectedSourceRevision: withoutLyrics.revision,
      start: 0,
      end: 1,
      index: 1,
      includeCreated: false,
    });
    assert.equal(duplicate.createdCount, 1);
    assert.equal('created' in duplicate, false);
    const locked = await call('edit_elements', {
      ...dst,
      expectedRevision: duplicate.revision,
      actions: [
        { action: 'set_staff_lyrics', text: 'Test Test', locked: true },
      ],
    });
    await call(
      'copy_elements',
      { ...copyArgs, expectedRevision: locked.revision },
      'LYRICS_LOCKED',
    );
  }
  console.log('Element copy passed in private and editor scopes.');
} finally {
  await client?.close();
  await app.close();
}
