import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const profile = process.env.NEANES_DEV_USER_DATA_DIR;
const token = process.env.NEANES_MCP_TOKEN;
if (!profile || !path.isAbsolute(profile) || !token) {
  throw new Error(
    'Use the same token, URL, and isolated NEANES_DEV_USER_DATA_DIR as the test app.',
  );
}
const client = new Client({ name: 'neanes-close-smoke', version: '1.0.0' });
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp'),
    {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    },
  ),
);
async function call(name, args = {}) {
  const reply = await client.callTool({ name, arguments: args });
  assert.ok(!reply.isError, JSON.stringify(reply));
  assert.equal(reply.structuredContent.success, true);
  return reply.structuredContent.result;
}
try {
  const initial = await call('list_documents');
  assert.equal(
    initial.length,
    1,
    'Run against an isolated profile with only its blank startup document.',
  );
  assert.equal(initial[0].filePath, null);
  assert.equal(initial[0].hasUnsavedChanges, false);
  assert.equal(initial[0].title, '');

  const draft = await call('create_document', {
    title: 'Recovery cleanup check',
  });
  const recoveryDirectory = path.join(profile, 'recovery');
  const recoveryPath = path.join(recoveryDirectory, `${draft.documentId}.json`);
  let snapshotExists = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      await fs.access(recoveryPath);
      snapshotExists = true;
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    await setTimeout(50);
  }
  assert.ok(
    snapshotExists,
    'The real recovery snapshot should exist before close.',
  );
  const current = await call('get_document_properties', {
    documentId: draft.documentId,
  });
  const closedDraft = await call('close_document', {
    documentId: draft.documentId,
    expectedRevision: current.revision,
    discardUnsavedChanges: true,
  });
  assert.equal(closedDraft.selectedDocumentId, initial[0].documentId);
  assert.ok(
    !(await fs.readdir(recoveryDirectory)).some((name) =>
      name.startsWith(draft.documentId),
    ),
  );
  // Wait longer than the recovery debounce to ensure closing canceled pending writes.
  await setTimeout(1700);
  assert.ok(
    !(await fs.readdir(recoveryDirectory)).some((name) =>
      name.startsWith(draft.documentId),
    ),
  );

  // A real invalid recovery path exercises partial cleanup failure without filesystem mocks.
  const failedDraft = await call('create_document', {
    title: 'Cleanup failure check',
  });
  const failedRecoveryPath = path.join(
    recoveryDirectory,
    `${failedDraft.documentId}.json`,
  );
  await fs.mkdir(failedRecoveryPath);
  await fs.writeFile(
    path.join(failedRecoveryPath, 'unexpected-entry'),
    'invalid recovery state',
  );
  try {
    const failure = await client.callTool({
      name: 'close_document',
      arguments: {
        documentId: failedDraft.documentId,
        expectedRevision: failedDraft.revision,
        discardUnsavedChanges: true,
      },
    });
    assert.equal(failure.isError, true);
    assert.equal(
      failure.structuredContent.error.code,
      'RECOVERY_CLEANUP_FAILED',
    );
    assert.equal(failure.structuredContent.error.details.closed, true);
    assert.equal(
      failure.structuredContent.error.details.documentId,
      failedDraft.documentId,
    );
    assert.ok(
      !(await call('list_documents')).some(
        (document) => document.documentId === failedDraft.documentId,
      ),
    );
  } finally {
    await fs.rm(failedRecoveryPath, { recursive: true, force: true });
  }
  const only = (await call('list_documents'))[0];
  const lastClosed = await call('close_document', {
    documentId: only.documentId,
    expectedRevision: only.revision,
  });
  assert.equal(lastClosed.documentId, only.documentId);
  const remaining = await call('list_documents');
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].documentId, lastClosed.selectedDocumentId);
  assert.notEqual(remaining[0].documentId, only.documentId);
  assert.equal(remaining[0].filePath, null);
  assert.equal(remaining[0].hasUnsavedChanges, false);
  await call('get_capabilities');
  console.log(
    'Close smoke passed: recovery removed, last tab replaced, server remains available.',
  );
} finally {
  await client.close();
}
