import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';

import electron from 'electron';

import compatibility from '../../../electron/main/automation/compatibility.json' with { type: 'json' };

async function runScenario(protocolVersion, expectedVersion) {
  const directory = await mkdtemp(
    path.join(tmpdir(), 'neanes-bridge-protocol-'),
  );
  const env = {
    ...process.env,
    IS_TEST: '1',
    NEANES_DEV_USER_DATA_DIR: path.join(directory, 'profile'),
  };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(
    process.env.NEANES_TEST_EXECUTABLE || electron,
    [...(process.env.NEANES_TEST_EXECUTABLE ? [] : [process.cwd()]), '--mcp'],
    { env, stdio: ['pipe', 'pipe', 'pipe'] },
  );
  let logs = '';
  child.stderr.on('data', (data) => {
    logs += data;
  });
  const exited = new Promise((resolve) =>
    child.once('exit', (code, signal) => resolve({ code, signal })),
  );
  const lines = createInterface({ input: child.stdout });
  const replies = [];
  let awaitingReply;
  lines.on('line', (line) => {
    const reply = JSON.parse(line);
    if (awaitingReply) {
      const resolve = awaitingReply;
      awaitingReply = undefined;
      resolve(reply);
    } else {
      replies.push(reply);
    }
  });
  async function exchange(line) {
    child.stdin.write(line + '\n');
    let timer;
    try {
      return await Promise.race([
        replies.length
          ? Promise.resolve(replies.shift())
          : new Promise((resolve) => {
              awaitingReply = resolve;
            }),
        exited.then((outcome) => {
          throw new Error(`Bridge exited ${JSON.stringify(outcome)}: ${logs}`);
        }),
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`Bridge response timed out: ${logs}`)),
            70_000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  let id = 0;
  const rpc = (method, params) =>
    exchange(
      JSON.stringify({
        jsonrpc: '2.0',
        id: ++id,
        method,
        ...(params ? { params } : {}),
      }),
    );
  try {
    const initialized = await rpc('initialize', {
      protocolVersion,
      capabilities: {},
      clientInfo: { name: 'bridge-protocol-smoke', version: '1' },
    });
    assert.equal(initialized.result.protocolVersion, expectedVersion);
    assert.equal(
      initialized.result.capabilities.experimental['neanes/automation']
        .contractVersion,
      compatibility.contractVersion,
    );
    child.stdin.write(
      JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) +
        '\n',
    );
    assert.ok(
      (await rpc('tools/list')).result.tools.some(
        (tool) => tool.name === 'create_document',
      ),
    );
    const created = await rpc('tools/call', {
      name: 'create_document',
      arguments: { title: 'Survives malformed input' },
    });
    const documentId = created.result.structuredContent.result.documentId;
    for (const input of [
      'null',
      '[]',
      JSON.stringify([
        { jsonrpc: '2.0', id: 'batch-a', method: 'ping' },
        { jsonrpc: '2.0', id: 'batch-b', method: 'tools/list' },
      ]),
      '{}',
      'true',
      '1',
      '"ping"',
      '{"jsonrpc":"2.0","id":{},"method":"ping"}',
      '{"jsonrpc":"2.0","id":42,"method":"ping","params":null}',
    ]) {
      const reply = await exchange(input);
      assert.equal(reply.error.code, -32600, input);
      assert.equal(reply.id, input.includes('42') ? 42 : null);
    }
    assert.equal((await exchange('{')).error.code, -32700);
    const listed = await rpc('tools/call', {
      name: 'list_documents',
      arguments: {},
    });
    assert.equal(
      listed.result.structuredContent.result[0].documentId,
      documentId,
    );
  } finally {
    child.stdin.end();
    const kill = setTimeout(() => child.kill('SIGKILL'), 10_000);
    const outcome = await exited;
    clearTimeout(kill);
    assert.deepEqual(outcome, { code: 0, signal: null }, logs);
    lines.close();
    await rm(directory, { recursive: true, force: true });
  }
}

for (const protocolVersion of compatibility.protocolVersions) {
  await runScenario(protocolVersion, protocolVersion);
}
for (const protocolVersion of [
  '2025-03-26',
  '2024-11-05',
  '2024-10-07',
  'unknown',
]) {
  await runScenario(protocolVersion, compatibility.protocolVersions[0]);
}
console.log(
  'Bridge protocol smoke passed: fresh-session negotiation, unsupported revision fallback, batch rejection, contract publication, and private draft survival.',
);
