import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import electron from 'electron';
import { createServer } from 'vite';

const root = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const args = process.argv.slice(2);
const basic = process.platform === 'win32' || args.includes('--basic');
const temporary = await mkdtemp(path.join(os.tmpdir(), 'neanes-save-smoke-'));
const output = path.resolve(
  args.filter((arg) => arg !== '--basic')[0] ?? path.join(temporary, 'scores'),
);
await mkdir(output, { recursive: true });

// Build the real main/preload entries without the Vite plugin launching its own
// Electron process. The test host installs an isolated profile before main loads.
process.env.VSCODE_DEBUG = '1';
process.env.IS_TEST = '1';
const server = await createServer({
  root,
  configFile: path.join(root, 'vite.config.mjs'),
  server: { host: '127.0.0.1', port: 0 },
});
try {
  await server.listen();
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      await access(path.join(root, 'dist-electron/main/index.js'));
      await access(path.join(root, 'dist-electron/preload/index.js'));
      break;
    } catch (error) {
      if (Date.now() > deadline) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  const child = spawn(
    electron,
    [
      path.join(root, 'tests/integration/saving/revisionSmokeHost.mjs'),
      '--no-update',
    ],
    {
      cwd: root,
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: server.resolvedUrls.local[0],
        NEANES_DEV_USER_DATA_DIR: path.join(temporary, 'profile'),
        NEANES_SAVE_SMOKE_ROOT: root,
        NEANES_SAVE_SMOKE_OUTPUT: output,
        NEANES_SAVE_SMOKE_BASIC: basic ? '1' : '0',
      },
      stdio: 'inherit',
    },
  );
  const timer = setTimeout(() => child.kill('SIGKILL'), 120_000);
  try {
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', resolve);
    });
    assert.equal(code, 0, 'Save revision smoke checks failed.');
    console.log(`Saved scores: ${output}`);
  } finally {
    clearTimeout(timer);
  }
} finally {
  await server.close();
}
// The Electron plugin's development build watchers outlive the HTTP server.
process.exit(0);
