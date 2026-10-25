// Run outside the agent command sandbox; starts disposable Electron processes.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import path from 'node:path';

import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-editor-access-');
const clients = [];
async function connect() {
  const client = await connectStdioClient('editor-access-smoke', {
    profile: app.profile,
  });
  clients.push(client);
  return {
    client,
    call: createToolCaller(client, (await client.listTools()).tools),
  };
}
try {
  // A connection established before editor startup discovers it later.
  const first = await connect();
  const draft = await first.call('create_document', { title: 'Private draft' });
  await first.call(
    'list_documents',
    { documentScope: 'editor' },
    'INTERNAL_ERROR',
  );
  const editor = app.start({
    args: ['--remote-debugging-port=0', '--inspect=0'],
  });
  await app.ready();
  const { evaluate } = await app.debugger();
  const { evaluate: evaluateMain } = await app.debugger('main');
  await eventually(async () =>
    assert.equal(
      await evaluate(
        'Boolean(window._editor?.workspaces.value.length && !document.querySelector(".loading-overlay"))',
      ),
      true,
    ),
  );
  const original = await first.call('list_documents', {
    documentScope: 'editor',
  });
  assert.equal(original.length, 1);
  const second = await connect();
  assert.deepEqual(await second.call('list_documents'), []);
  await second.call(
    'get_document_properties',
    { documentId: draft.documentId },
    'DOCUMENT_NOT_FOUND',
  );
  assert.equal(
    (await first.call('list_documents'))[0].documentId,
    draft.documentId,
  );

  const live = await first.call('create_document', {
    documentScope: 'editor',
    title: 'Live tab',
  });
  await second.call('replace_document_properties', {
    documentScope: 'editor',
    documentId: live.documentId,
    expectedRevision: live.revision,
    properties: { title: 'Edited through socket', author: '' },
  });
  assert.equal(
    (
      await first.call('get_document_properties', {
        documentScope: 'editor',
        documentId: live.documentId,
      })
    ).properties.title,
    'Edited through socket',
  );
  assert.equal(await evaluate('window._editor.workspaces.value.length'), 2);
  assert.equal(
    await evaluate(
      'window._editor.selectedWorkspace.value.score.documentProperties.title',
    ),
    'Edited through socket',
  );

  // Discovery credentials authenticate the connection, independent of app signing.
  const discovery = path.join(app.profile, 'mcp-editor.json');
  const connection = JSON.parse(await readFile(discovery, 'utf8'));
  const refused = await new Promise((resolve, reject) => {
    const socket = createConnection(connection.socket);
    let text = '';
    socket.setTimeout(5000, () =>
      socket.destroy(new Error('Authentication test timed out')),
    );
    socket.on('error', reject);
    socket.on('data', (data) => {
      text += data;
    });
    socket.on('end', () => resolve(JSON.parse(text)));
    socket.on('connect', () =>
      socket.write(
        JSON.stringify({
          ...connection,
          token: 'wrong-token',
          request: { tool: 'list_documents', arguments: {} },
        }) + '\n',
      ),
    );
  });
  assert.equal(refused.success, false);
  assert.equal(refused.error.code, 'PERMISSION_DENIED');

  // Preferences still blocks editor mutations but cannot block private documents.
  const root =
    "process.getBuiltinModule('module').createRequire(process.cwd() + '/package.json')('electron')";
  await evaluateMain(
    `(() => { const { Menu, BrowserWindow } = ${root}; const find = menu => { for (const item of menu.items) { if (item.label.includes('Preferences')) return item; if (item.submenu) { const found = find(item.submenu); if (found) return found; } } }; const item = find(Menu.getApplicationMenu()); item.click(item, BrowserWindow.getAllWindows()[0]); })()`,
  );
  await eventually(async () =>
    assert.ok(
      await evaluate("Boolean(document.querySelector('[role=dialog]'))"),
    ),
  );
  assert.deepEqual(
    await evaluate(
      "Array.from(document.querySelectorAll('[role=dialog] [role=tab]')).map(e=>e.textContent.trim())",
    ),
    ['General', 'Appearance', 'Editing', 'Advanced'],
  );
  await first.call('create_document', {
    title: 'Independent while editor is busy',
  });
  await first.call(
    'list_documents',
    { documentScope: 'editor' },
    'EDITOR_BUSY',
  );
  await evaluate(
    "Array.from(document.querySelectorAll('[role=dialog] button')).find(e=>e.textContent.trim()==='Close').click()",
  );
  await eventually(async () =>
    assert.equal(
      await evaluate("document.querySelector('[role=dialog]') === null"),
      true,
    ),
  );

  // Disconnecting one MCP process never closes the editor or another client's drafts.
  await second.client.close();
  assert.equal(editor.exitCode, null);
  assert.equal((await first.call('list_documents')).length, 2);
  assert.equal(
    (await first.call('list_documents', { documentScope: 'editor' })).length,
    2,
  );
  const fresh = await connect();
  assert.deepEqual(await fresh.call('list_documents'), []);
  await fresh.client.close();
  // A stale discovery file after an editor crash fails without replay/fallback.
  editor.kill('SIGKILL');
  await new Promise((resolve) => editor.once('exit', resolve));
  await first.call(
    'list_documents',
    { documentScope: 'editor' },
    'INTERNAL_ERROR',
  );
  assert.equal((await first.call('list_documents')).length, 2);
  console.log(
    'Editor access smoke passed: both launch orders, shared tab edits, private isolation, authentication, preferences, independent shutdown, and editor crash.',
  );
} finally {
  await Promise.allSettled(clients.map((client) => client.close()));
  await app.close();
}
