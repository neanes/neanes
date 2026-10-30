import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { ReadBuffer } from '@modelcontextprotocol/sdk/shared/stdio.js';

import compatibility from '../../../electron/main/automation/compatibility.json' with { type: 'json' };
import { stdioConfiguration } from './smokeClient.mjs';

async function runScenario(protocolVersion, expectedVersion) {
  const directory = await mkdtemp(
    path.join(tmpdir(), 'neanes-bridge-protocol-'),
  );
  const configuration = stdioConfiguration(path.join(directory, 'profile'));
  const child = spawn(configuration.command, configuration.args, {
    env: configuration.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let logs = '';
  child.stderr.on('data', (data) => {
    logs += data;
  });
  const exited = new Promise((resolve) =>
    child.once('exit', (code, signal) => resolve({ code, signal })),
  );
  const buffer = new ReadBuffer();
  const protocolFailure = Promise.withResolvers();
  const replies = [];
  let awaitingReply;
  const onData = (chunk) => {
    try {
      buffer.append(chunk);
      let reply;
      while ((reply = buffer.readMessage()) !== null) {
        if (awaitingReply) {
          const resolve = awaitingReply;
          awaitingReply = undefined;
          resolve(reply);
        } else {
          replies.push(reply);
        }
      }
    } catch (error) {
      protocolFailure.reject(
        new Error(
          `Invalid bridge stdout: ${JSON.stringify(chunk.toString('utf8').slice(0, 512))}; stderr: ${logs}`,
          { cause: error },
        ),
      );
    }
  };
  // Use the same framing and message validation as production MCP clients.
  child.stdout.on('data', onData);
  async function exchange(line) {
    child.stdin.write(line + '\n');
    let timer;
    try {
      return await Promise.race([
        protocolFailure.promise,
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
  let lastRequest;
  const rpc = (method, params) => {
    lastRequest = params?.name ? `${method}: ${params.name}` : method;
    return exchange(
      JSON.stringify({
        jsonrpc: '2.0',
        id: ++id,
        method,
        ...(params ? { params } : {}),
      }),
    );
  };
  const failures = [];
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
      '{',
    ]) {
      child.stdin.write(input + '\n');
      const reply = await rpc('ping');
      assert.equal(reply.id, id, input);
      assert.deepEqual(reply.result, {}, input);
    }
    const listed = await rpc('tools/call', {
      name: 'list_documents',
      arguments: {},
    });
    assert.equal(
      listed.result.structuredContent.result[0].documentId,
      documentId,
    );
  } catch (error) {
    failures.push(
      new Error(
        `Bridge protocol ${protocolVersion} failed during ${lastRequest}`,
        { cause: error },
      ),
    );
  } finally {
    child.stdin.end();
    const kill = setTimeout(() => child.kill('SIGKILL'), 10_000);
    try {
      const outcome = await exited;
      assert.deepEqual(
        outcome,
        { code: 0, signal: null },
        `Bridge protocol ${protocolVersion}: stdin EOF shutdown failed; last request: ${lastRequest}; stderr: ${logs}`,
      );
    } catch (error) {
      failures.push(error);
    } finally {
      clearTimeout(kill);
      child.stdout.off('data', onData);
      try {
        await rm(directory, {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 100,
        });
      } catch (error) {
        failures.push(error);
      }
    }
  }
  if (failures.length) {
    throw new AggregateError(
      failures,
      `Bridge protocol ${protocolVersion} failed (including any cleanup errors)`,
    );
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
  'Bridge protocol smoke passed: fresh-session negotiation, unsupported revision fallback, malformed input recovery, contract publication, and private draft survival.',
);
