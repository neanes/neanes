import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import electron from 'electron';

import { createSmokeApp } from './smokeApp.mjs';
import { createToolCaller, stdioConfiguration } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

if (process.platform !== 'darwin') {
  console.log('Skipping Launch Services check outside macOS.');
  process.exit(0);
}

const directory = await mkdtemp('/private/tmp/neanes-reopen-');
const original = process.env.NEANES_TEST_EXECUTABLE || electron;
const bundle = path.join(directory, 'Neanes Launch Test.app');
const executable = path.join(bundle, 'Contents/MacOS', path.basename(original));
const editor = await createSmokeApp('neanes-reopen-editor-');
const config = stdioConfiguration(editor.profile);
const appArgs = process.env.NEANES_TEST_EXECUTABLE ? [] : [process.cwd()];
const launchArgs = [...appArgs, '--no-update'];
const score = path.resolve('tests/data/prosomoia1_input.byzx');
const nextScore = path.resolve('tests/data/lyrics-before-2723.byzx');
const client = new Client({ name: 'neanes-macos-reopen-smoke', version: '1' });
const call = createToolCaller(client);
const editorDocuments = () =>
  call('list_documents', { documentScope: 'editor' });

function editorProcesses() {
  // Match only the main executable of this disposable bundle.
  const processes = execFileSync('/bin/ps', ['-axo', 'pid=,command='], {
    encoding: 'utf8',
  });
  return processes
    .trim()
    .split('\n')
    .map((line) => line.trim().match(/^(\d+) (.+)$/))
    .filter((match) => match?.[2].startsWith(executable + ' '))
    .filter((match) => !match[2].split(' ').includes('--mcp'))
    .map((match) => Number(match[1]));
}

async function stopEditor() {
  for (const pid of editorProcesses()) {
    process.kill(pid, 'SIGKILL');
  }
  await eventually(() => assert.deepEqual(editorProcesses(), []));
}

async function assertWorkerHandoff(workerPid) {
  assert.ok(workerPid, 'The MCP worker has no PID.');
  await eventually(() => {
    const editors = editorProcesses();
    assert.equal(editors.length, 1);
    const parentPid = execFileSync(
      '/bin/ps',
      ['-p', String(editors[0]), '-o', 'ppid='],
      { encoding: 'utf8' },
    );
    assert.equal(
      Number(parentPid.trim()),
      workerPid,
      'The editor was launched directly instead of by the MCP worker.',
    );
  });
}

function launchFromFinder(options = [], files = [], args = []) {
  // If Launch Services starts a fresh process, it must also use the test profile.
  execFileSync('/usr/bin/open', [
    ...options,
    '-a',
    bundle,
    '--env',
    'IS_TEST=1',
    '--env',
    `NEANES_DEV_USER_DATA_DIR=${editor.profile}`,
    ...files,
    '--args',
    ...launchArgs,
    ...args,
  ]);
}

try {
  execFileSync('/usr/bin/ditto', [path.resolve(original, '../../..'), bundle]);
  const transport = new StdioClientTransport({
    ...config,
    command: executable,
    args: [...config.args, '--no-update'],
  });
  await client.connect(transport, { timeout: 70_000 });
  assert.deepEqual(editorProcesses(), [], 'MCP startup opened an editor.');
  launchFromFinder();
  await assertWorkerHandoff(transport.pid);
  await eventually(async () => assert.ok((await editorDocuments()).length > 0));
  await stopEditor();

  // A Finder score open must reach a fresh editor even with only MCP running.
  launchFromFinder([], [score]);
  await assertWorkerHandoff(transport.pid);
  await eventually(async () => {
    assert.ok(
      (await editorDocuments()).some(({ filePath }) => filePath === score),
    );
  });
  await stopEditor();

  // A fresh launch can receive both command-line files and Finder open events.
  launchFromFinder(['-n'], [nextScore], [score]);
  await eventually(async () => {
    const paths = (await editorDocuments()).map(({ filePath }) => filePath);
    assert.ok(paths.includes(score), 'Startup argument was dropped.');
    assert.ok(paths.includes(nextScore), 'Finder score was dropped.');
  });
  await stopEditor();

  const child = editor.start({
    executable,
    appArgs,
    args: ['--inspect=0', score],
  });
  await editor.ready();
  const { evaluate } = await editor.debugger('main');
  const windows =
    "process.getBuiltinModule('module').createRequire(process.cwd() + '/package.json')('electron').BrowserWindow.getAllWindows()";
  await eventually(async () => {
    assert.ok(
      (await editorDocuments()).some(({ filePath }) => filePath === score),
    );
  });

  // Invoke the same executable and arguments as the worker handoff so macOS
  // cannot route the request directly to the editor via Launch Services.
  const handoff = (...files) =>
    execFileSync(executable, [...launchArgs, ...files], {
      env: config.env,
      timeout: 10_000,
    });
  await evaluate(`${windows}[0].minimize()`);
  await eventually(async () =>
    assert.equal(await evaluate(`${windows}[0].isMinimized()`), true),
  );
  handoff();
  await eventually(async () =>
    assert.equal(await evaluate(`${windows}[0].isMinimized()`), false),
  );

  await evaluate(`${windows}[0].close()`);
  await eventually(async () =>
    assert.equal(await evaluate(`${windows}.length`), 0),
  );
  handoff(nextScore);
  await eventually(async () => {
    const documents = await editorDocuments();
    assert.ok(documents.some(({ filePath }) => filePath === nextScore));
    assert.ok(documents.every(({ filePath }) => filePath !== score));
  });
  assert.deepEqual(editorProcesses(), [child.pid]);
  assert.deepEqual(await call('list_documents'), []);
  console.log(
    'macOS reopen, Finder score open, and same-process window restore and recreation passed.',
  );
} finally {
  try {
    await client.close();
    await stopEditor();
  } finally {
    await editor.close();
    await rm(directory, { recursive: true, force: true });
  }
}
