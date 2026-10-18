import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { promisify } from 'node:util';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import electron from 'electron';

const directory = await mkdtemp(path.join(tmpdir(), 'neanes-headless-smoke-'));
const policyPath = path.join(directory, 'agent-access.json');
const files = path.join(directory, 'files');
await mkdir(files);
const policy = {
  enabled: false,
  token: randomBytes(32).toString('hex'),
};
await writeFile(policyPath, JSON.stringify(policy), { mode: 0o600 });
const clients = [];
async function connect(
  executable = process.env.NEANES_TEST_EXECUTABLE || electron,
) {
  const client = new Client({ name: 'neanes-headless-smoke', version: '1' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.resolve('scripts/mcp/bridge.mjs'),
      '--executable',
      executable,
      ...(process.env.NEANES_TEST_EXECUTABLE ? [] : ['--app', process.cwd()]),
      '--policy',
      policyPath,
    ],
    stderr: 'inherit',
  });
  clients.push(client);
  await client.connect(transport, { timeout: 70_000 });
  return client;
}
async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  assert.ok(!result.isError, JSON.stringify(result));
  return result.structuredContent.result;
}
try {
  const [first, second] = await Promise.all([connect(), connect()]);
  // Each bridge owns a worker; sessions never resolve in a different worker.
  const capabilities = await call(first, 'get_capabilities');
  assert.equal(capabilities.mode, 'headless');
  assert.deepEqual(await call(first, 'list_documents'), []);
  await assert.rejects(
    () => call(first, 'list_documents', { scope: 'editor' }),
    /No editor is open/,
  );
  const privateDocument = await call(first, 'create_document', {
    title: 'Automatic private document',
  });
  assert.equal(privateDocument.selected, false);
  assert.equal((await call(first, 'list_documents')).length, 1);
  assert.deepEqual(await call(second, 'list_documents'), []);
  const definitions = await first.listTools();
  assert.deepEqual(
    definitions.tools.find((tool) => tool.name === 'list_documents').inputSchema
      .properties.scope.enum,
    ['private', 'editor'],
  );
  const { sessionId } = await call(first, 'create_session');
  const foreign = await second.callTool({
    name: 'list_documents',
    arguments: { sessionId },
  });
  assert.equal(foreign.structuredContent.error.code, 'SESSION_NOT_FOUND');
  let document = await call(first, 'create_document', {
    sessionId,
    title: 'Headless smoke',
  });
  document = await call(first, 'edit_elements', {
    sessionId,
    documentId: document.documentId,
    expectedRevision: document.revision,
    actions: [
      {
        action: 'insert',
        index: 0,
        elements: [
          {
            elementType: 'RichTextBox',
            properties: { content: '<p>Headless rich text</p>' },
          },
          {
            elementType: 'Note',
            properties: { quantitativeNeume: 'Ison', lyrics: 'Test' },
          },
        ],
      },
    ],
  });
  const scorePath = path.join(files, 'headless.byzx');
  document = await call(first, 'save_document', {
    sessionId,
    documentId: document.documentId,
    expectedRevision: document.revision,
    filePath: scorePath,
  });
  assert.ok((await readFile(scorePath, 'utf8')).includes('Headless smoke'));
  await call(first, 'export_pdf', {
    sessionId,
    documentId: document.documentId,
    expectedRevision: document.revision,
    filePath: path.join(files, 'headless.pdf'),
  });
  assert.ok((await stat(path.join(files, 'headless.pdf'))).size > 1000);
  const reopened = await call(second, 'create_session');
  await call(second, 'open_document', {
    sessionId: reopened.sessionId,
    filePath: scorePath,
  });
  await assert.rejects(() =>
    connect(path.join(directory, 'missing-executable')),
  );
  if (process.platform === 'darwin' || process.platform === 'linux') {
    const doomed = await connect();
    const { stdout } = await promisify(execFile)('pgrep', [
      '-P',
      String(doomed.transport.pid),
    ]);
    const children = stdout.trim().split(/\s+/).map(Number);
    assert.equal(children.length, 1);
    process.kill(children[0], 'SIGKILL');
    await setTimeout(500);
    await assert.rejects(() => call(doomed, 'get_capabilities'));
  }
  // Missing credentials are regenerated internally, without an enable flag.
  await rm(policyPath);
  const fresh = await connect();
  const credentials = JSON.parse(await readFile(policyPath, 'utf8'));
  assert.ok(credentials.token.length >= 32);
  assert.equal('enabled' in credentials, false);
  assert.equal((await call(fresh, 'get_capabilities')).mode, 'headless');
  assert.equal((await call(first, 'get_capabilities')).mode, 'headless');
  console.log(
    'Headless bridge smoke passed: concurrent private workers, sessions, save/reopen, PDF, failed startup, worker crash, automatic credentials, legacy disabled settings.',
  );
} finally {
  await Promise.allSettled(clients.map((client) => client.close()));
  await rm(directory, { recursive: true, force: true });
}
