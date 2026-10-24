import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import electron from 'electron';

import { createSmokeApp } from './smokeApp.mjs';
import { callTool } from './smokeClient.mjs';
import { eventually as poll } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-agent-access-');
const { directory, policyPath } = app;
const files = path.join(directory, 'files');
await mkdir(files);
const executable = process.env.NEANES_TEST_EXECUTABLE || electron;
const appArgs = process.env.NEANES_TEST_EXECUTABLE ? [] : [process.cwd()];
const clients = [];
let editor;
const startupFailure = process.env.NEANES_TEST_MCP_FAILURE === '1';
let occupiedPort;
if (startupFailure) {
  occupiedPort = createServer();
  await new Promise((resolve) => occupiedPort.listen(0, '127.0.0.1', resolve));
}
const eventually = (operation) =>
  poll(operation, { timeoutMs: 30_000, intervalMs: 250 });
async function connect(configuration) {
  const client = new Client({ name: 'neanes-access-smoke', version: '1' });
  clients.push(client);
  await client.connect(
    new StdioClientTransport({
      command: configuration?.command ?? process.execPath,
      args: configuration?.args ?? [
        path.resolve('electron/mcp/bridge.mjs'),
        '--executable',
        executable,
        ...(!process.env.NEANES_TEST_EXECUTABLE
          ? ['--app', process.cwd()]
          : []),
        '--policy',
        policyPath,
      ],
      stderr: 'inherit',
    }),
    { timeout: 70_000 },
  );
  return client;
}
async function call(client, name, args = {}) {
  return (await callTool(client, name, args)).structuredContent.result;
}
try {
  // Worker first, then editor; another worker after editor startup covers the opposite order.
  const first = await connect();
  await call(first, 'create_document', { title: 'Background draft' });
  editor = app.start({
    executable,
    appArgs,
    args: ['--remote-debugging-port=0', '--inspect=0'],
    port: occupiedPort?.address().port ?? 0,
  });
  const { send: renderer, evaluate } = await app.debugger();
  const { evaluate: evaluateMain } = await app.debugger('main');
  await eventually(async () =>
    assert.equal(
      (await evaluate("window.ipcRenderer.invoke('AgentAccessGet')")).status,
      startupFailure ? 'error' : 'ready',
    ),
  );
  await eventually(async () =>
    assert.equal(
      await evaluate(
        "Boolean(window._editor?.workspaces.value.length === 1 && !document.querySelector('.loading-overlay'))",
      ),
      true,
    ),
  );
  const before = await evaluate(
    'JSON.stringify(window._editor.workspaces.value.map(w => ({id:w.id,metadata:w.score.documentProperties,pageSetup:w.score.pageSetup,styles:w.score.paragraphStyles,elements:w.score.staff.elements.map(e=>e.elementType === "Empty" ? {elementType:"Empty"} : e.getClipboardProperties(true)),dirty:w.hasUnsavedChanges,history:w.commandService,selection:w.selectedElement?.id})))',
  );
  const configured = await evaluate(
    "window.ipcRenderer.invoke('AgentAccessGet')",
  );
  assert.equal(configured.enabled, true);
  assert.equal('token' in configured, false);
  const originalToken = JSON.parse(await readFile(policyPath, 'utf8')).token;
  assert.ok(!configured.configuration.includes(originalToken));
  const configuration = JSON.parse(configured.configuration).mcpServers.neanes;
  assert.ok(!configuration.args.includes('--target'));
  const second = await connect(configuration);
  assert.equal(
    (await second.callTool({ name: 'get_capabilities', arguments: {} }))
      .structuredContent.result.mode,
    'headless',
  );
  assert.deepEqual(
    (await second.callTool({ name: 'list_documents', arguments: {} }))
      .structuredContent.result,
    [],
  );
  const created = await second.callTool({
    name: 'create_document',
    arguments: { title: 'Private by default' },
  });
  assert.ok(!created.isError, JSON.stringify(created));
  assert.equal(created.structuredContent.result.selected, false);
  if (startupFailure) {
    await assert.rejects(
      () =>
        first.callTool({
          name: 'list_documents',
          arguments: { documentScope: 'editor' },
        }),
      /could not start agent access/,
    );
  } else {
    const liveFromWorker = await first.callTool({
      name: 'list_documents',
      arguments: { documentScope: 'editor' },
    });
    assert.ok(!liveFromWorker.isError, JSON.stringify(liveFromWorker));
    assert.equal(liveFromWorker.structuredContent.result.length, 1);
    const batchSeed = await call(second, 'edit_elements', {
      documentId: created.structuredContent.result.documentId,
      expectedRevision: created.structuredContent.result.revision,
      actions: [
        {
          action: 'insert',
          elements: [
            {
              elementType: 'RichTextBox',
              properties: {
                content: `<p class="neanes-paragraph-style-default-text">${'LONG WRAPPING TEXT FOR BATCH FONT SIZE MEASUREMENT. '.repeat(12)}</p>`,
              },
            },
          ],
        },
      ],
    });
    const batchPath = path.join(files, 'interactive-batch.byzx');
    await call(second, 'save_document', {
      documentId: batchSeed.documentId,
      expectedRevision: batchSeed.revision,
      filePath: batchPath,
    });
    const beforeBatch = JSON.parse(await readFile(batchPath, 'utf8'));
    const beforeBatchHeight = beforeBatch.staff.elements.find(
      (element) => element.elementType === 'RichTextBox',
    ).height;
    assert.ok(Number.isFinite(beforeBatchHeight) && beforeBatchHeight > 0);
    const batchResponse = await fetch(configured.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${originalToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'interactive-batch',
        method: 'tools/call',
        params: {
          name: 'batch_update_files',
          arguments: {
            files: [{ filePath: batchPath }],
            edits: {
              paragraphStyles: [
                {
                  action: 'update',
                  id: 'default-text',
                  changes: { overrides: { fontSize: 40 } },
                },
              ],
            },
          },
        },
      }),
    });
    const batchReply = await batchResponse.json();
    assert.equal(
      batchReply.result.structuredContent.success,
      true,
      JSON.stringify(batchReply),
    );
    assert.equal(
      batchReply.result.structuredContent.result.results[0].status,
      'completed',
    );
    const afterBatch = JSON.parse(await readFile(batchPath, 'utf8'));
    const afterBatchHeight = afterBatch.staff.elements.find(
      (element) => element.elementType === 'RichTextBox',
    ).height;
    assert.ok(
      afterBatchHeight > beforeBatchHeight,
      `Batch font-size edits must persist remeasured height: ${beforeBatchHeight} -> ${afterBatchHeight}`,
    );
  }
  assert.equal(
    (await first.callTool({ name: 'get_capabilities', arguments: {} }))
      .structuredContent.result.mode,
    'headless',
  );
  const root =
    "process.getBuiltinModule('module').createRequire(process.cwd() + '/package.json')('electron')";
  await evaluateMain(
    `(() => { const { Menu, BrowserWindow } = ${root}; const search = menu => { for (const item of menu.items) { if (item.label.includes('Preferences')) return item; if (item.submenu) { const found = search(item.submenu); if (found) return found; } } }; const item = search(Menu.getApplicationMenu()); item.click(item, BrowserWindow.getAllWindows()[0]); })()`,
  );
  await eventually(async () =>
    assert.ok(await evaluate("document.querySelector('[role=dialog]')")),
  );
  // Private worker documents must work while Preferences blocks the editor.
  const whileBusy = await connect(configuration);
  assert.equal((await call(whileBusy, 'get_capabilities')).mode, 'headless');
  await call(whileBusy, 'create_document', {
    title: 'Private document while Preferences is open',
  });
  assert.equal((await call(whileBusy, 'list_documents')).length, 1);
  if (!startupFailure) {
    const busyEditor = await whileBusy.callTool({
      name: 'list_documents',
      arguments: { documentScope: 'editor' },
    });
    assert.equal(busyEditor.structuredContent.error.code, 'EDITOR_BUSY');
    assert.deepEqual(busyEditor.structuredContent.error.details, {
      reason: 'dialog_open',
      dialog: 'preferences',
    });
    assert.match(
      busyEditor.structuredContent.error.message,
      /Close the dialog/,
    );
    const blockedCreate = await whileBusy.callTool({
      name: 'create_document',
      arguments: { documentScope: 'editor' },
    });
    assert.equal(blockedCreate.structuredContent.error.code, 'EDITOR_BUSY');
    // These queries use the worker through the bridge; exercise the editor directly.
    for (const name of ['get_capabilities', 'get_element_catalog']) {
      const response = await fetch(configured.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${originalToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: name,
          method: 'tools/call',
          params: { name, arguments: {} },
        }),
      });
      assert.equal(response.status, 200);
      const reply = await response.json();
      assert.equal(reply.result.structuredContent.success, true);
      if (name === 'get_capabilities') {
        assert.equal(reply.result.structuredContent.result.mode, 'interactive');
      }
    }
  }
  await whileBusy.close();
  const labels = await evaluate(
    "Array.from(document.querySelectorAll('[role=dialog] [role=tab]')).map(e=>e.textContent.trim())",
  );
  assert.deepEqual(labels, [
    'General',
    'Appearance',
    'Editing',
    'Agent access (MCP)',
    'Advanced',
  ]);
  await evaluate(
    "Array.from(document.querySelectorAll('[role=dialog] [role=tab]')).find(e=>e.textContent.includes('Agent access')).dispatchEvent(new MouseEvent('mousedown', {bubbles:true,button:0}))",
  );
  await eventually(async () =>
    assert.ok(
      await evaluate(
        "Array.from(document.querySelectorAll('[role=dialog] button')).find(e=>e.textContent.trim()==='Copy configuration')",
      ),
    ),
  );
  assert.equal(
    await evaluate("document.querySelector('#agent-access-enabled') !== null"),
    true,
  );
  assert.equal(
    await evaluate(
      "Array.from(document.querySelectorAll('[role=dialog] button')).some(e=>/token|folder/i.test(e.textContent))",
    ),
    false,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('[role=dialog] [role=combobox]') === null",
    ),
    true,
  );
  if (startupFailure) {
    assert.equal(editor.exitCode, null);
    await new Promise((resolve) => occupiedPort.close(resolve));
    occupiedPort = undefined;
    await evaluate(
      "Array.from(document.querySelectorAll('[role=dialog] button')).find(e=>e.textContent.trim()==='Retry connection').click()",
    );
    await eventually(async () =>
      assert.equal(
        (await evaluate("window.ipcRenderer.invoke('AgentAccessGet')")).status,
        'ready',
      ),
    );
  }
  if (process.env.NEANES_TEST_SCREENSHOT) {
    await evaluate(
      'Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations !== Infinity).map(a=>a.finished.catch(()=>{})))',
    );
    const image = await renderer('Page.captureScreenshot', { format: 'png' });
    await writeFile(
      process.env.NEANES_TEST_SCREENSHOT,
      Buffer.from(image.data, 'base64'),
    );
  }
  assert.equal(
    await evaluate(
      'JSON.stringify(window._editor.workspaces.value.map(w => ({id:w.id,metadata:w.score.documentProperties,pageSetup:w.score.pageSetup,styles:w.score.paragraphStyles,elements:w.score.staff.elements.map(e=>e.elementType === "Empty" ? {elementType:"Empty"} : e.getClipboardProperties(true)),dirty:w.hasUnsavedChanges,history:w.commandService,selection:w.selectedElement?.id})))',
    ),
    before,
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
  const live = await connect(configuration);
  const result = await live.callTool({
    name: 'list_documents',
    arguments: { documentScope: 'editor' },
  });
  assert.ok(!result.isError, JSON.stringify(result));
  assert.equal(result.structuredContent.result.length, 1);
  assert.equal(
    JSON.parse(await readFile(policyPath, 'utf8')).token,
    originalToken,
  );
  const ready = await evaluate("window.ipcRenderer.invoke('AgentAccessGet')");
  const unauthenticated = await fetch(ready.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(unauthenticated.status, 401);
  const reconnected = await connect(configuration);
  const finalPrivate = await reconnected.callTool({
    name: 'create_document',
    arguments: { title: 'Disposable private draft' },
  });
  assert.ok(!finalPrivate.isError, JSON.stringify(finalPrivate));
  await reconnected.close();
  assert.equal(editor.exitCode, null);
  assert.equal(await evaluate('window._editor.workspaces.value.length'), 1);
  assert.equal(
    (await evaluate("window.ipcRenderer.invoke('AgentAccessGet')")).status,
    'ready',
  );
  // Disabling always asks for confirmation, whether workers have drafts or not.
  const dirtyClient = await connect(configuration);
  await call(dirtyClient, 'create_document', { title: 'Unsaved agent draft' });
  const warning = await evaluate(
    "window.ipcRenderer.invoke('AgentAccessSetEnabled', false)",
  );
  assert.equal(warning.confirmationRequired, true);
  assert.equal(warning.state.enabled, true);
  await evaluateMain(
    `(() => { const { Menu, BrowserWindow } = ${root}; const search = menu => { for (const item of menu.items) { if (item.label.includes('Preferences')) return item; if (item.submenu) { const found = search(item.submenu); if (found) return found; } } }; const item = search(Menu.getApplicationMenu()); item.click(item, BrowserWindow.getAllWindows()[0]); })()`,
  );
  await eventually(async () =>
    assert.ok(await evaluate("document.querySelector('[role=dialog]')")),
  );
  await evaluate(
    "Array.from(document.querySelectorAll('[role=dialog] [role=tab]')).find(e=>e.textContent.includes('Agent access')).dispatchEvent(new MouseEvent('mousedown', {bubbles:true,button:0}))",
  );
  await eventually(async () =>
    assert.equal(
      await evaluate(
        "document.querySelector('#agent-access-enabled')?.getAttribute('aria-checked')",
      ),
      'true',
    ),
  );
  await evaluate("document.querySelector('#agent-access-enabled').click()");
  await eventually(async () =>
    assert.ok(await evaluate("document.querySelector('[role=alertdialog]')")),
  );
  await evaluate(
    "Array.from(document.querySelectorAll('[role=alertdialog] button')).find(e=>e.textContent.trim()==='Cancel').click()",
  );
  assert.equal(
    (await evaluate("window.ipcRenderer.invoke('AgentAccessGet')")).enabled,
    true,
  );
  await eventually(async () =>
    assert.equal(
      await evaluate("document.querySelector('[role=alertdialog]') === null"),
      true,
    ),
  );
  await evaluate("document.querySelector('#agent-access-enabled').click()");
  await eventually(async () =>
    assert.ok(await evaluate("document.querySelector('[role=alertdialog]')")),
  );
  await evaluate(
    "Array.from(document.querySelectorAll('[role=alertdialog] button')).find(e=>e.textContent.trim()==='Turn off').click()",
  );
  await eventually(async () =>
    assert.equal(
      (await evaluate("window.ipcRenderer.invoke('AgentAccessGet')")).status,
      'off',
    ),
  );
  const off = {
    state: await evaluate("window.ipcRenderer.invoke('AgentAccessGet')"),
  };
  assert.equal(off.state.status, 'off');
  assert.equal(off.state.endpoint, null);
  assert.equal(JSON.parse(await readFile(policyPath, 'utf8')).enabled, false);
  await assert.rejects(() => call(dirtyClient, 'get_capabilities'));
  await assert.rejects(() => connect(configuration));
  assert.equal(await evaluate('window._editor.workspaces.value.length'), 1);
  assert.equal(
    await evaluate(
      'JSON.stringify(window._editor.workspaces.value.map(w => ({id:w.id,metadata:w.score.documentProperties,pageSetup:w.score.pageSetup,styles:w.score.paragraphStyles,elements:w.score.staff.elements.map(e=>e.elementType === "Empty" ? {elementType:"Empty"} : e.getClipboardProperties(true)),dirty:w.hasUnsavedChanges,history:w.commandService,selection:w.selectedElement?.id})))',
    ),
    before,
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
  const enabledAgain = await evaluate(
    "window.ipcRenderer.invoke('AgentAccessSetEnabled', true)",
  );
  assert.equal(enabledAgain.state.status, 'ready');
  const clean = await connect(configuration);
  assert.deepEqual(await call(clean, 'list_documents'), []);
  await clean.close();
  const cleanWarning = await evaluate(
    "window.ipcRenderer.invoke('AgentAccessSetEnabled', false)",
  );
  assert.equal(cleanWarning.confirmationRequired, true);
  assert.equal(cleanWarning.state.enabled, true);
  const cleanOff = await evaluate(
    "window.ipcRenderer.invoke('AgentAccessSetEnabled', false, true)",
  );
  assert.equal(cleanOff.confirmationRequired, false);
  assert.equal(cleanOff.state.status, 'off');
  console.log(
    'Agent access smoke passed: both launch orders, private defaults, live scope, failure/retry, disable confirmation, disable/re-enable, and unchanged editor documents.',
  );
} finally {
  try {
    if (occupiedPort) {
      await new Promise((resolve) => occupiedPort.close(resolve));
    }
    await Promise.allSettled(clients.map((client) => client.close()));
  } finally {
    await app.close();
  }
}
