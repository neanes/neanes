import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import electron from 'electron';

const directory = process.argv[2];
if (
  !directory ||
  !path.isAbsolute(directory) ||
  !process.env.NEANES_MCP_TOKEN ||
  !process.env.NEANES_DEV_USER_DATA_DIR
) {
  throw new Error(
    'Set NEANES_MCP_TOKEN and NEANES_DEV_USER_DATA_DIR for the running dev instance, then pass an absolute allowed output directory.',
  );
}
const client = new Client({
  name: 'neanes-interactive-open-smoke',
  version: '1.0.0',
});
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp'),
    {
      requestInit: {
        headers: { Authorization: `Bearer ${process.env.NEANES_MCP_TOKEN}` },
      },
    },
  ),
);
async function call(name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  assert.ok(!result.isError, JSON.stringify(result));
  assert.deepEqual(
    result.structuredContent,
    JSON.parse(result.content[0].text),
  );
  assert.equal(result.structuredContent.success, true);
  return result.structuredContent.result;
}
try {
  const initial = await call('list_documents');
  const unique = Date.now();
  const sourcePath = path.join(directory, `interactive-source-${unique}.byzx`);
  const targetPath = path.join(directory, `interactive-target-${unique}.byzx`);
  const aliasDirectory = path.join(directory, `interactive-alias-${unique}`);
  await fs.symlink(directory, aliasDirectory, 'dir');
  const aliasPath =
    process.platform === 'darwin' && targetPath.startsWith('/private/tmp/')
      ? targetPath.replace('/private/tmp/', '/tmp/')
      : path.join(aliasDirectory, path.basename(targetPath));
  const created = await call('create_document', {
    title: 'Interactive open smoke',
  });
  await call('save_document', {
    documentId: created.documentId,
    expectedRevision: created.revision,
    filePath: sourcePath,
  });
  await fs.copyFile(sourcePath, targetPath);
  // A second Electron invocation exercises the real external-open entry point.
  const child = spawn(electron, ['.', aliasPath], { stdio: 'ignore' });
  await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Second instance exited with ${code}`)),
    );
  });
  let interactive;
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const response = await client.callTool({
      name: 'list_documents',
      arguments: {},
    });
    if (
      response.isError &&
      ['EDITOR_NOT_READY', 'EDITOR_BUSY'].includes(
        response.structuredContent.error.code,
      )
    ) {
      await setTimeout(50);
      continue;
    }
    assert.ok(!response.isError, JSON.stringify(response));
    interactive = response.structuredContent.result.find(
      (document) => document.filePath === aliasPath,
    );
    if (interactive) {
      break;
    }
    await setTimeout(50);
  }
  assert.ok(
    interactive,
    'External open did not arrive in the running instance.',
  );
  const changed = await call('replace_document_properties', {
    documentId: interactive.documentId,
    expectedRevision: interactive.revision,
    properties: { title: 'Unsaved interactive edit', author: '' },
  });
  const opened = await call('open_document', { filePath: targetPath });
  assert.equal(opened.documentId, interactive.documentId);
  assert.equal(opened.created, false);
  assert.equal(opened.hasUnsavedChanges, true);
  assert.equal(opened.title, 'Unsaved interactive edit');
  assert.equal(opened.revision, changed.revision);
  assert.equal((await call('list_documents')).length, initial.length + 2);
  await call('save_document', {
    documentId: opened.documentId,
    expectedRevision: opened.revision,
  });
  const originalIds = new Set(initial.map((document) => document.documentId));
  for (const document of await call('list_documents')) {
    if (!originalIds.has(document.documentId)) {
      await call('close_document', {
        documentId: document.documentId,
        expectedRevision: document.revision,
      });
    }
  }
  assert.equal((await call('list_documents')).length, initial.length);
  console.log(
    'Interactive alias smoke passed; existing workspace and unsaved edits were preserved.',
  );
} finally {
  await client.close();
}
