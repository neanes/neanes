import assert from 'node:assert/strict';

import { createSmokeApp } from './smokeApp.mjs';
import { connectEditorClient, createToolCaller } from './smokeClient.mjs';

const app = await createSmokeApp('neanes-inline-rich-text-');
let client;
try {
  app.start({ args: ['--remote-debugging-port=0'] });
  const socket = await app.debugger();
  client = await connectEditorClient('inline-rich-text', await app.ready());
  const call = createToolCaller(client);
  const doc = await call('create_document', { title: 'Fill-width rich text' });
  const args = { documentId: doc.documentId };
  const initial = await call('get_elements', args);
  const { created, revision } = await call('edit_elements', {
    ...args,
    expectedRevision: doc.revision,
    actions: [
      { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
      {
        action: 'insert',
        elements: [
          { elementType: 'Note' },
          { elementType: 'Note' },
          {
            elementType: 'RichTextBox',
            properties: { inline: true, content: '<p>Short</p>' },
          },
          { elementType: 'Martyria', properties: { alignRight: true } },
          { elementType: 'Note' },
        ],
      },
    ],
  });
  const layout = () =>
    socket.evaluate(`(() => {
      const [first, second, box, martyria, next] =
        window._editor.score.value.staff.elements;
      return {
        sameLine: first.line === second.line && second.line === box.line &&
          box.line === martyria.line && next.line > martyria.line,
        fillsToMartyria: Math.abs(box.x + box.width - martyria.x) < 0.01,
        positions: [first.x, second.x, box.x, box.width, martyria.x],
      };
    })()`);
  const short = await layout();
  assert.ok(short.sameLine && short.fillsToMartyria, JSON.stringify(short));
  await call('edit_elements', {
    ...args,
    expectedRevision: revision,
    actions: [
      {
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: created[2].elementRef,
        properties: { content: `<p>${'Long inline text '.repeat(60)}</p>` },
      },
    ],
  });
  assert.deepEqual(await layout(), short);
  console.log(
    'Fill-width rich text preserves musical line breaks and positions.',
  );
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  try {
    await client?.close();
  } finally {
    await app.close();
  }
}
