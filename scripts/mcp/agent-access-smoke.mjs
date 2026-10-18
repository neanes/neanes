import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import electron from 'electron';

const directory = await mkdtemp(path.join(tmpdir(), 'neanes-agent-access-'));
const policyPath = path.join(directory, 'agent-access.json');
const files = path.join(directory, 'files');
await mkdir(files);
await writeFile(
  policyPath,
  JSON.stringify({
    enabled: false,
    token: randomBytes(32).toString('hex'),
  }),
  { mode: 0o600 },
);
const executable = process.env.NEANES_TEST_EXECUTABLE || electron;
const appArgs = process.env.NEANES_TEST_EXECUTABLE ? [] : [process.cwd()];
const clients = [],
  sockets = [];
let editor;
const startupFailure = process.env.NEANES_TEST_MCP_FAILURE === '1';
let occupiedPort;
if (startupFailure) {
  occupiedPort = createServer();
  await new Promise((resolve) => occupiedPort.listen(0, '127.0.0.1', resolve));
}
async function eventually(operation) {
  let error;
  for (let i = 0; i < 120; i++) {
    try {
      return await operation();
    } catch (e) {
      error = e;
      await setTimeout(250);
    }
  }
  throw error;
}
async function connect(configuration) {
  const client = new Client({ name: 'neanes-access-smoke', version: '1' });
  clients.push(client);
  await client.connect(
    new StdioClientTransport({
      command: configuration?.command ?? process.execPath,
      args: configuration?.args ?? [
        path.resolve('scripts/mcp/bridge.mjs'),
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
async function debuggerConnection(url) {
  const targets = await eventually(async () => {
    const list = await (await fetch(url)).json();
    assert.ok(list[0]?.webSocketDebuggerUrl);
    return list;
  });
  const target = targets.find((t) => t.type === 'page') || targets[0];
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  sockets.push(socket);
  await new Promise((resolve) =>
    socket.addEventListener('open', resolve, { once: true }),
  );
  let id = 0;
  const requests = new Map();
  socket.addEventListener('message', (event) => {
    const reply = JSON.parse(event.data);
    const pending = requests.get(reply.id);
    if (pending) {
      requests.delete(reply.id);
      if (reply.error || reply.result?.exceptionDetails) {
        pending.reject(new Error(JSON.stringify(reply)));
      } else {
        pending.resolve(reply.result);
      }
    }
  });
  return (method, params) =>
    new Promise((resolve, reject) => {
      const requestId = ++id;
      requests.set(requestId, { resolve, reject });
      socket.send(JSON.stringify({ id: requestId, method, params }));
    });
}
try {
  // Worker first, then editor; another worker after editor startup covers the opposite order.
  const first = await connect();
  editor = spawn(
    executable,
    [
      ...appArgs,
      '--remote-debugging-port=9346',
      '--inspect=9347',
      '--no-update',
    ],
    {
      env: {
        ...process.env,
        IS_TEST: '1',
        NEANES_MCP_PORT: String(occupiedPort?.address().port ?? 0),
        NEANES_MCP_TOKEN: undefined,
        NEANES_DEV_USER_DATA_DIR: directory,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  editor.stderr.on('data', (data) => process.stderr.write(data));
  const renderer = await debuggerConnection('http://127.0.0.1:9346/json/list');
  const main = await debuggerConnection('http://127.0.0.1:9347/json/list');
  const evaluate = async (expression) =>
    (
      await renderer('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      })
    ).result.value;
  const evaluateMain = async (expression) =>
    (
      await main('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      })
    ).result.value;
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
  assert.equal('enabled' in configured, false);
  assert.equal('token' in configured, false);
  const originalToken = JSON.parse(await readFile(policyPath, 'utf8')).token;
  assert.ok(!configured.configuration.includes(originalToken));
  const configuration = JSON.parse(configured.configuration).mcpServers.neanes;
  assert.ok(!configuration.args.includes('--target'));
  const second = await connect(configuration);
  assert.equal(
    (await second.callTool({ name: 'get_capabilities', arguments: {} }))
      .structuredContent.result.mode,
    startupFailure ? 'headless' : 'interactive',
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
          arguments: { scope: 'editor' },
        }),
      /could not start agent access/,
    );
  } else {
    const liveFromWorker = await first.callTool({
      name: 'list_documents',
      arguments: { scope: 'editor' },
    });
    assert.ok(!liveFromWorker.isError, JSON.stringify(liveFromWorker));
    assert.equal(liveFromWorker.structuredContent.result.length, 1);
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
    await evaluate("document.querySelector('#agent-access-enabled') === null"),
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
    arguments: { scope: 'editor' },
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
  console.log(
    'Agent access smoke passed: both launch orders, always-on startup, hidden credentials, automatic reuse/fallback, private defaults, live scope, nonfatal startup failure/retry, unchanged editor documents.',
  );
} finally {
  if (occupiedPort) {
    await new Promise((resolve) => occupiedPort.close(resolve));
  }
  await Promise.allSettled(clients.map((client) => client.close()));
  for (const socket of sockets) {
    socket.close();
  }
  if (editor && editor.exitCode === null) {
    editor.kill('SIGTERM');
    await new Promise((resolve) => editor.once('exit', resolve));
  }
  await rm(directory, { recursive: true, force: true });
}
