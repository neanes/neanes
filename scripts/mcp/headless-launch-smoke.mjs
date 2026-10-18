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

import { checkSettings } from './settingsChecks.mjs';

const directory = await mkdtemp(path.join(tmpdir(), 'neanes-headless-smoke-'));
const policyPath = path.join(directory, 'agent-access.json');
const files = path.join(directory, 'files');
await mkdir(files);
const policy = {
  enabled: true,
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
    () => call(first, 'list_documents', { documentScope: 'editor' }),
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
      .properties.documentScope.enum,
    ['private', 'editor'],
  );
  const { sessionId } = await call(first, 'create_session');
  await checkSettings(first);
  await checkSettings(first, { sessionId });
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
  const layout = await call(first, 'get_pages', {
    sessionId,
    documentId: document.documentId,
  });
  const preview = await first.callTool({
    name: 'preview_page',
    arguments: {
      sessionId,
      documentId: document.documentId,
      expectedRevision: layout.revision,
      expectedLayoutId: layout.layoutId,
      pageNumber: 1,
      maxEdge: 512,
    },
  });
  assert.ok(!preview.isError, JSON.stringify(preview.structuredContent));
  assert.equal(preview.content[1].type, 'image');
  assert.equal(preview.content[1].mimeType, 'image/png');
  assert.ok(
    Math.max(
      preview.structuredContent.result.width,
      preview.structuredContent.result.height,
    ) <= 512,
  );
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
  // Revocation stops existing workers and does not undo saved files.
  const saved = await readFile(scorePath, 'utf8');
  await writeFile(policyPath, JSON.stringify({ ...policy, enabled: false }));
  await assert.rejects(() => connect());
  await setTimeout(1500);
  await assert.rejects(() => call(first, 'get_capabilities'));
  await assert.rejects(() => call(second, 'get_capabilities'));
  assert.equal(await readFile(scorePath, 'utf8'), saved);
  // Re-enabling starts a fresh host without reviving private drafts.
  await writeFile(
    policyPath,
    JSON.stringify({ enabled: true, token: randomBytes(32).toString('hex') }),
  );
  const fresh = await connect();
  assert.deepEqual(await call(fresh, 'list_documents'), []);
  await fresh.close();
  // Neither the bridge nor --headless-mcp may bootstrap permission.
  await rm(policyPath);
  await assert.rejects(() => connect());
  await assert.rejects(() => stat(policyPath), { code: 'ENOENT' });
  for (const content of [
    JSON.stringify({ token: policy.token }),
    JSON.stringify({ ...policy, enabled: false }),
    '{invalid',
  ]) {
    await writeFile(policyPath, content);
    await assert.rejects(() => connect());
    const workerProfile = path.join(directory, 'refused-worker');
    await mkdir(workerProfile, { recursive: true });
    const env = {
      ...process.env,
      IS_TEST: '1',
      NEANES_HEADLESS_PROFILE: workerProfile,
      NEANES_HEADLESS_POLICY: policyPath,
    };
    delete env.ELECTRON_RUN_AS_NODE;
    await assert.rejects(() =>
      promisify(execFile)(
        process.env.NEANES_TEST_EXECUTABLE || electron,
        [
          ...(process.env.NEANES_TEST_EXECUTABLE ? [] : [process.cwd()]),
          '--headless-mcp',
        ],
        { env, timeout: 15000 },
      ),
    );
    assert.equal(await readFile(policyPath, 'utf8'), content);
  }
  console.log(
    'Headless bridge smoke passed: private workers, save/reopen, PDF, revocation, fresh reconnect, and disabled/missing/invalid policy refusal.',
  );
} finally {
  await Promise.allSettled(clients.map((client) => client.close()));
  await rm(directory, { recursive: true, force: true });
}
