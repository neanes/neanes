// Run outside the agent command sandbox; this starts a disposable Electron app.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { createSmokeApp } from './smokeApp.mjs';
import { connectEditorClient, createToolCaller } from './smokeClient.mjs';

const app = await createSmokeApp('neanes-metadata-');
// Hold a real font request open so document.fonts.ready cannot settle.
const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let client;
let deadline;
try {
  app.start({ args: ['--remote-debugging-port=0'] });
  const { evaluate } = await app.debugger();
  client = await connectEditorClient('metadata-smoke', await app.ready());
  const call = createToolCaller(client, (await client.listTools()).tools);
  const created = await call('create_document', {
    title: 'Metadata regression',
  });
  const args = { documentId: created.documentId };
  const inserted = await call('edit_elements', {
    ...args,
    expectedRevision: created.revision,
    actions: [
      {
        action: 'insert',
        index: 0,
        elements: [
          {
            elementType: 'TextBox',
            clientId: 'text',
            properties: { content: 'Stored content regression' },
          },
        ],
      },
    ],
  });
  const elementRef = inserted.created.find(
    (item) => item.clientId === 'text',
  ).elementRef;
  const current = await call('get_document_properties', args);
  // Ensure there is a genuinely stale revision for the conflict checks below.
  const edited = await call('replace_document_properties', {
    ...args,
    expectedRevision: current.revision,
    properties: { title: 'Updated metadata', author: '' },
  });
  assert.ok(edited.revision > current.revision);
  await evaluate(`(() => {
    const face = new FontFace('MetadataPendingFont', 'url(http://127.0.0.1:${server.address().port}/pending.woff2)');
    document.fonts.add(face);
    void face.load().catch(() => {});
  })()`);
  assert.equal(await evaluate('document.fonts.status'), 'loading');
  const reads = [
    'get_document_properties',
    'get_page_setup',
    'get_header_footer_settings',
    'get_staff_lyrics',
    'get_selection',
    'find_text',
    'get_element_content',
  ];
  await Promise.race([
    (async () => {
      for (const tool of reads) {
        const result = await call(tool, {
          ...args,
          ...(tool === 'find_text' ? { query: 'Stored content' } : {}),
          ...(tool === 'get_element_content'
            ? { elementRef, property: 'content' }
            : {}),
          expectedRevision: edited.revision,
        });
        assert.equal(result.revision, edited.revision);
        if (tool === 'find_text') {
          assert.equal(result.matches[0].elementRef, elementRef);
        }
        if (tool === 'get_element_content') {
          assert.equal(result.content, 'Stored content regression');
        }
        if (tool === 'get_document_properties') {
          assert.equal(result.properties.title, 'Updated metadata');
        }
        await call(
          tool,
          {
            ...args,
            ...(tool === 'find_text' ? { query: 'Stored content' } : {}),
            ...(tool === 'get_element_content'
              ? { elementRef, property: 'content' }
              : {}),
            expectedRevision: current.revision,
          },
          'REVISION_CONFLICT',
        );
      }
      await call(
        'replace_document_properties',
        {
          ...args,
          expectedRevision: current.revision,
          properties: { title: 'Stale update', author: '' },
        },
        'REVISION_CONFLICT',
      );
      const replaced = await call('replace_document_properties', {
        ...args,
        expectedRevision: edited.revision,
        properties: { title: 'Updated while fonts pending', author: 'Author' },
      });
      assert.ok(replaced.revision > edited.revision);
      assert.equal(replaced.properties.author, 'Author');
      const styles = await call('get_paragraph_styles', args);
      assert.equal(styles.revision, replaced.revision);
      await call(
        'close_document',
        {
          ...args,
          expectedRevision: current.revision,
          discardUnsavedChanges: true,
        },
        'REVISION_CONFLICT',
      );
      await call(
        'close_document',
        { ...args, expectedRevision: replaced.revision },
        'UNSAVED_CHANGES',
      );
      await call('close_document', {
        ...args,
        expectedRevision: replaced.revision,
        discardUnsavedChanges: true,
      });
      assert.equal(await evaluate('document.fonts.status'), 'loading');
      assert.ok(
        !(await call('list_documents')).some(
          (document) => document.documentId === created.documentId,
        ),
      );
    })(),
    new Promise((_, reject) => {
      deadline = setTimeout(
        () =>
          reject(new Error('Metadata operations waited for font settlement.')),
        10_000,
      );
    }),
  ]);
  console.log(
    'Metadata smoke passed: content reads, metadata edits and close bypass pending fonts and retain revision/unsaved checks.',
  );
} finally {
  clearTimeout(deadline);
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await client?.close();
  await app.close();
}
