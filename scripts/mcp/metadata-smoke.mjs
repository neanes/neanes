// Run outside the agent command sandbox; this starts a disposable Electron app.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { createSmokeApp } from './smokeApp.mjs';
import { connectHttpClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-metadata-');
// Hold a real font request open so document.fonts.ready cannot settle.
const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let client;
let deadline;
try {
  app.start({ args: ['--remote-debugging-port=0'] });
  const { evaluate } = await app.debugger();
  await eventually(async () =>
    assert.ok(
      await evaluate(
        'Boolean(window._editor?.workspaces.value.length && !document.querySelector(".loading-overlay"))',
      ),
    ),
  );
  client = await connectHttpClient('metadata-smoke', await app.endpoint());
  const call = createToolCaller(client, (await client.listTools()).tools);
  const created = await call('create_document', {
    title: 'Metadata regression',
  });
  const args = { documentId: created.documentId };
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
  ];
  await Promise.race([
    (async () => {
      for (const tool of reads) {
        const result = await call(tool, {
          ...args,
          expectedRevision: edited.revision,
        });
        assert.equal(result.revision, edited.revision);
        if (tool === 'get_document_properties') {
          assert.equal(result.properties.title, 'Updated metadata');
        }
        await call(
          tool,
          { ...args, expectedRevision: current.revision },
          'REVISION_CONFLICT',
        );
      }
      const styles = await call('get_paragraph_styles', args);
      assert.equal(styles.revision, edited.revision);
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
        { ...args, expectedRevision: edited.revision },
        'UNSAVED_CHANGES',
      );
      await call('close_document', {
        ...args,
        expectedRevision: edited.revision,
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
    'Metadata smoke passed: reads and close bypass pending fonts and retain revision/unsaved checks.',
  );
} finally {
  clearTimeout(deadline);
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await client?.close();
  await app.close();
}
