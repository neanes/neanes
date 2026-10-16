import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const directory = process.argv[2];
const token = process.env.NEANES_MCP_TOKEN;
assert.ok(directory && path.isAbsolute(directory) && token);
const debugUrl = process.env.NEANES_DEBUG_URL ?? 'http://127.0.0.1:9334';
const targets = async () => (await fetch(`${debugUrl}/json/list`)).json();
const editorTarget = (await targets()).find(
  (target) =>
    target.type === 'page' &&
    !target.url.includes('export.html') &&
    !target.url.startsWith('devtools:'),
);
assert.ok(
  editorTarget,
  'Start an isolated Electron instance with --remote-debugging-port=9334.',
);
const socket = new WebSocket(editorTarget.webSocketDebuggerUrl);
await new Promise((resolve) =>
  socket.addEventListener('open', resolve, { once: true }),
);
let nextId = 0;
const requests = new Map();
socket.addEventListener('message', (event) => {
  const reply = JSON.parse(event.data);
  if (requests.has(reply.id)) {
    const { resolve, reject } = requests.get(reply.id);
    requests.delete(reply.id);
    if (reply.error || reply.result.exceptionDetails) {
      reject(new Error(JSON.stringify(reply)));
    } else {
      resolve(reply.result);
    }
  }
});
function send(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    requests.set(id, { resolve, reject });
    socket.send(
      JSON.stringify({
        id,
        method,
        params,
      }),
    );
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.result.value;
}
const client = new Client({ name: 'neanes-isolation-smoke', version: '1.0.0' });
const transport = () =>
  new StreamableHTTPClientTransport(
    new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp'),
    { requestInit: { headers: { Authorization: `Bearer ${token}` } } },
  );
await client.connect(transport());
async function call(name, args = {}) {
  const reply = await client.callTool({ name, arguments: args });
  assert.ok(!reply.isError, `${name}: ${JSON.stringify(reply)}`);
  return reply.structuredContent.result;
}
async function fails(name, args, code) {
  const reply = await client.callTool({ name, arguments: args });
  assert.equal(
    reply.structuredContent.error?.code,
    code,
    JSON.stringify(reply),
  );
}
let primaryError;
const sessions = new Set();
const introduced = [];
const sourcePath = path.join(directory, `isolated-${Date.now()}.byzx`);
const state = () =>
  evaluate(`(() => {
  const e = window._editor;
  return {
    selected: e.selectedWorkspace.value.id,
    undoDisabled: document.querySelector('.main-toolbar button[aria-label^="Undo"]')?.disabled,
    redoDisabled: document.querySelector('.main-toolbar button[aria-label^="Redo"]')?.disabled,
    workspaces: e.workspaces.value.map(w => ({
      id: w.id, score: JSON.stringify(w.score),
      dirty: w.hasUnsavedChanges,
      selectedElement: w.selectedElement?.id,
      selectionRange: w.selectionRange,
      history: w.commandService,
    })),
    storage: Object.fromEntries(Object.entries(localStorage)),
  };
})()`);
try {
  const interactive = await call('create_document', {
    title: 'Saved disk title',
  });
  introduced.push(interactive.documentId);
  await call('save_document', {
    documentId: interactive.documentId,
    expectedRevision: interactive.revision,
    filePath: sourcePath,
  });
  let current = await call('get_document', {
    documentId: interactive.documentId,
  });
  await call('replace_document_properties', {
    documentId: interactive.documentId,
    expectedRevision: current.revision,
    properties: { title: 'Interactive unsaved title', author: '' },
  });
  // Allow the existing interactive recovery timer to finish before the control snapshot.
  await setTimeout(2500);
  const before = await state();
  const recoveryDirectory = process.env.NEANES_DEV_USER_DATA_DIR;
  async function recoveryFiles() {
    if (!recoveryDirectory) {
      return null;
    }
    const files = await fs.readdir(recoveryDirectory, { recursive: true });
    const recovery = files.filter((file) => /recovery/i.test(file)).sort();
    return Promise.all(
      recovery.map(async (file) => {
        const stats = await fs.stat(path.join(recoveryDirectory, file));
        return [
          file,
          stats.isFile()
            ? await fs.readFile(path.join(recoveryDirectory, file), 'utf8')
            : null,
        ];
      }),
    );
  }
  const recoveryBefore = await recoveryFiles();
  const session = await call('create_session');
  const sessionId = session.sessionId;
  sessions.add(sessionId);
  const second = await call('create_session');
  sessions.add(second.sessionId);
  const isolated = await call('open_document', {
    sessionId,
    filePath: sourcePath,
  });
  assert.equal(isolated.created, true);
  assert.equal(isolated.title, 'Saved disk title');
  assert.equal(isolated.selected, false);
  assert.notEqual(isolated.documentId, interactive.documentId);
  assert.deepEqual(
    await call('list_documents', { sessionId: second.sessionId }),
    [],
  );
  await fails(
    'get_document',
    { documentId: isolated.documentId },
    'DOCUMENT_NOT_FOUND',
  );
  await fails(
    'get_document',
    { sessionId, documentId: interactive.documentId },
    'DOCUMENT_NOT_FOUND',
  );
  await fails(
    'get_document',
    { sessionId: second.sessionId, documentId: isolated.documentId },
    'DOCUMENT_NOT_FOUND',
  );
  const alias = sourcePath.startsWith('/private/tmp/')
    ? sourcePath.replace('/private/tmp/', '/tmp/')
    : sourcePath;
  const reused = await call('open_document', { sessionId, filePath: alias });
  assert.equal(reused.documentId, isolated.documentId);
  assert.equal(reused.created, false);
  current = await call('get_document', {
    sessionId,
    documentId: isolated.documentId,
  });
  const changed = await call('replace_document_properties', {
    sessionId,
    documentId: isolated.documentId,
    expectedRevision: current.revision,
    properties: { title: 'Isolated title', author: 'Automation' },
  });
  await fails(
    'replace_document_properties',
    {
      sessionId,
      documentId: isolated.documentId,
      expectedRevision: current.revision,
      properties: { title: 'Stale', author: '' },
    },
    'REVISION_CONFLICT',
  );
  await fails('close_session', { sessionId }, 'UNSAVED_CHANGES');
  assert.equal((await call('list_documents', { sessionId })).length, 1);
  const styles = await call('get_paragraph_styles', {
    sessionId,
    documentId: isolated.documentId,
  });
  const style = styles.styles.find((style) => style.id === 'default-text');
  current = await call('edit_paragraph_styles', {
    sessionId,
    documentId: isolated.documentId,
    expectedRevision: changed.revision,
    changes: [
      {
        action: 'replace',
        style: { ...style, overrides: { ...style.overrides, fontSize: 28 } },
      },
    ],
  });
  const saved = await call('save_document', {
    sessionId,
    documentId: isolated.documentId,
    expectedRevision: current.revision,
    filePath: sourcePath.replace('.byzx', '.byz'),
  });
  const reopened = await call('open_document', {
    sessionId: second.sessionId,
    filePath: saved.filePath,
  });
  assert.equal(reopened.title, 'Isolated title');
  await call('export_pdf', {
    sessionId,
    documentId: isolated.documentId,
    expectedRevision: saved.revision,
    filePath: sourcePath.replace('.byzx', '.pdf'),
  });
  assert.ok((await fs.stat(sourcePath.replace('.byzx', '.pdf'))).size > 1000);
  await fs.appendFile(saved.filePath, 'external change');
  await fails(
    'save_document',
    {
      sessionId,
      documentId: isolated.documentId,
      expectedRevision: saved.revision,
      overwrite: true,
    },
    'SOURCE_FILE_CONFLICT',
  );
  await fs.writeFile(sourcePath.replace('.byzx', '-invalid.byzx'), '{}');
  await fails(
    'open_document',
    { sessionId, filePath: sourcePath.replace('.byzx', '-invalid.byzx') },
    'INVALID_SCORE',
  );
  assert.equal((await call('list_documents', { sessionId })).length, 1);
  // Rendering failures and HTTP cancellation retain the private source and lease.
  const brokenScore = (
    await call('get_document', { sessionId, documentId: isolated.documentId })
  ).score;
  brokenScore.pageSetup.showHeader = false;
  brokenScore.pageSetup.showFooter = false;
  brokenScore.staff.elements = [
    {
      elementType: 'ImageBox',
      data: 'data:image/png;base64,broken',
      imageWidth: 50,
      imageHeight: 50,
    },
    { elementType: 'Empty' },
  ];
  const brokenPath = sourcePath.replace('.byzx', '-broken.byzx');
  await fs.writeFile(brokenPath, JSON.stringify(brokenScore));
  const broken = await call('open_document', {
    sessionId: second.sessionId,
    filePath: brokenPath,
  });
  const brokenBefore = await call('get_document', {
    sessionId: second.sessionId,
    documentId: broken.documentId,
  });
  const failurePath = sourcePath.replace('.byzx', '-failed.pdf');
  await fails(
    'export_pdf',
    {
      sessionId: second.sessionId,
      documentId: broken.documentId,
      expectedRevision: brokenBefore.revision,
      filePath: failurePath,
    },
    'EXPORT_RENDER_FAILED',
  );
  await assert.rejects(fs.access(failurePath), { code: 'ENOENT' });
  assert.deepEqual(
    await call('get_document', {
      sessionId: second.sessionId,
      documentId: broken.documentId,
    }),
    brokenBefore,
  );
  const hiddenTargets = async () =>
    (await targets()).filter((target) => target.url.includes('export.html'));
  assert.equal((await hiddenTargets()).length, 0);
  const controller = new AbortController();
  const cancelledPath = sourcePath.replace('.byzx', '-cancelled.pdf');
  const cancelled = fetch(
    process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'cancel-isolated',
        method: 'tools/call',
        params: {
          name: 'export_pdf',
          arguments: {
            sessionId,
            documentId: isolated.documentId,
            expectedRevision: saved.revision,
            filePath: cancelledPath,
          },
        },
      }),
    },
  );
  const rejected = assert.rejects(cancelled, { name: 'AbortError' });
  async function waitFor(predicate) {
    for (let i = 0; i < 300; i++) {
      if (await predicate()) {
        return;
      }
      await setTimeout(20);
    }
    throw new Error('Renderer lifecycle timed out');
  }
  await waitFor(async () => (await hiddenTargets()).length === 1);
  controller.abort();
  await rejected;
  await waitFor(async () => (await hiddenTargets()).length === 0);
  await assert.rejects(fs.access(cancelledPath), { code: 'ENOENT' });
  assert.equal(
    (await call('get_document', { sessionId, documentId: isolated.documentId }))
      .revision,
    saved.revision,
  );
  // Capacity failures must preserve the documents already owned by the session.
  for (let i = 1; i < session.maxDocuments; i++) {
    await call('create_document', { sessionId, title: `Capacity ${i}` });
  }
  await fails('create_document', { sessionId }, 'DOCUMENT_LIMIT_REACHED');
  assert.equal(
    (await call('list_documents', { sessionId })).length,
    session.maxDocuments,
  );
  const limits = (await call('get_capabilities')).isolatedSessions;
  for (let i = 2; i < limits.maxSessions; i++) {
    sessions.add((await call('create_session')).sessionId);
  }
  await fails('create_session', {}, 'SESSION_LIMIT_REACHED');
  assert.deepEqual(await state(), before);
  assert.deepEqual(await recoveryFiles(), recoveryBefore);
  assert.equal(
    (await call('list_documents')).find(
      (doc) => doc.documentId === interactive.documentId,
    ).title,
    'Interactive unsaved title',
  );
  await call('close_session', { sessionId, discardUnsavedChanges: true });
  sessions.delete(sessionId);
  await fails('list_documents', { sessionId }, 'SESSION_NOT_FOUND');
  const replacement = await call('create_session');
  sessions.add(replacement.sessionId);
  const blank = await call('create_document', {
    sessionId: replacement.sessionId,
  });
  const closed = await call('close_document', {
    sessionId: replacement.sessionId,
    documentId: blank.documentId,
    expectedRevision: blank.revision,
    discardUnsavedChanges: true,
  });
  assert.equal(closed.selectedDocumentId, null);
  assert.deepEqual(
    await call('list_documents', { sessionId: replacement.sessionId }),
    [],
  );
  console.log(
    'Isolated session lifecycle, ownership, capacity, file conflicts, export, and interactive preservation passed.',
  );
} catch (error) {
  primaryError = error;
  throw error;
} finally {
  const cleanupErrors = [];
  for (const sessionId of sessions) {
    try {
      await call('close_session', { sessionId, discardUnsavedChanges: true });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  for (const documentId of introduced) {
    try {
      const current = await call('get_document', { documentId });
      await call('close_document', {
        documentId,
        expectedRevision: current.revision,
        discardUnsavedChanges: true,
      });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  socket.close();
  await client.close();
  if (cleanupErrors.length > 0 && primaryError == null) {
    throw new AggregateError(cleanupErrors, 'Smoke cleanup failed');
  }
}
