// Starts a real Vite server and disposable Electron processes; run unsandboxed on macOS.
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import electron from 'electron';
import { createServer } from 'vite';

import { createSmokeApp } from './smokeApp.mjs';
import { createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

// Let Vite build main/preload without launching an editor of its own.
process.env.VSCODE_DEBUG = '1';
const app = await createSmokeApp('neanes-dev-mcp-');
let client, server;
let failed = false;
let logs = '';
try {
  server = await createServer({ server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  await eventually(async () => {
    await access('dist-electron/main/index.js');
    await access('dist-electron/preload/index.js');
  });
  process.env.VITE_DEV_SERVER_URL = url;
  app.start({ args: ['--remote-debugging-port=0'] });
  await app.ready();
  const discovery = JSON.parse(
    await readFile(path.join(app.profile, 'mcp-editor.json'), 'utf8'),
  );
  assert.equal(discovery.devServerUrl, url);

  const env = { ...process.env, NEANES_DEV_USER_DATA_DIR: app.profile };
  delete env.VITE_DEV_SERVER_URL;
  delete env.ELECTRON_RUN_AS_NODE;
  // This is the normal direct Electron registration, with no renderer URL option.
  const transport = new StdioClientTransport({
    command: electron,
    args: [process.cwd(), '--mcp', '--remote-debugging-port=0'],
    env,
    stderr: 'pipe',
  });
  transport.stderr.on('data', (data) => {
    logs += data;
  });
  client = new Client({ name: 'dev-server-smoke', version: '1' });
  await client.connect(transport, { timeout: 70_000 });
  const call = createToolCaller(client);
  const match = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(logs);
  assert.ok(match, logs);
  const targets = await (
    await fetch(`http://127.0.0.1:${match[1]}/json/list`)
  ).json();
  assert.ok(
    targets.some(
      (target) => target.url === new URL('automation.html', url).href,
    ),
  );
  const { evaluate } = await app.debugger();
  await eventually(async () =>
    assert.equal(
      await evaluate(
        'Boolean(window._editor?.workspaces.value.length && !document.querySelector(".loading-overlay"))',
      ),
      true,
    ),
  );
  let draft = await call('create_document', {
    title: 'Discovered development server',
  });
  const editor = await call('list_documents', { documentScope: 'editor' });
  assert.equal(editor.length, 1);
  draft = await call('edit_elements', {
    documentId: draft.documentId,
    expectedRevision: draft.revision,
    actions: [
      {
        action: 'insert',
        elements: [
          {
            elementType: 'Note',
            properties: { quantitativeNeume: 'Ison', lyrics: 'Development' },
          },
        ],
      },
    ],
  });
  const preview = await call('preview_page', {
    documentId: draft.documentId,
    expectedRevision: draft.revision,
    pageNumber: 1,
    maxEdge: 256,
  });
  assert.ok(preview.width > 0 && preview.height > 0);
  const pdfPath = path.join(app.directory, 'dev.pdf');
  await call('export_pdf', {
    documentId: draft.documentId,
    expectedRevision: draft.revision,
    filePath: pdfPath,
  });
  assert.equal((await readFile(pdfPath)).subarray(0, 5).toString(), '%PDF-');
  console.log(
    'Development MCP smoke passed: URL discovery, Vite renderer, editor tabs, private preview, and PDF without a URL environment override.',
  );
} catch (error) {
  failed = true;
  console.error(error, logs);
} finally {
  await client?.close();
  await app.close();
  await server?.close();
}
// Vite's Electron main/preload watchers outlive its HTTP server.
process.exit(failed ? 1 : 0);
