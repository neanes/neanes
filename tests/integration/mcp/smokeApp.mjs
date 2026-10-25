import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import electron from 'electron';

import { connectCdp, editorTarget } from './smokeCdp.mjs';
import { eventually } from './smokePolling.mjs';

export async function createSmokeApp(prefix, { keepArtifacts = false } = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), prefix));
  const profile = path.join(directory, 'profile');
  await mkdir(profile);
  let child, closed, spawnError;
  let log = '';
  const connections = [];
  const isRunning = () =>
    !spawnError && child?.exitCode === null && child.signalCode === null;
  function requireRunning() {
    if (spawnError) {
      throw spawnError;
    }
    assert.ok(
      isRunning(),
      `Electron exited (${child?.exitCode ?? child?.signalCode}): ${log}`,
    );
  }
  return {
    directory,
    profile,
    log: () => log,
    start({
      args = [],
      executable = electron,
      appArgs = [process.cwd()],
    } = {}) {
      assert.equal(child, undefined, 'This fixture already launched Electron.');
      const env = {
        ...process.env,
        IS_TEST: '1',
        NEANES_DEV_USER_DATA_DIR: profile,
      };
      delete env.ELECTRON_RUN_AS_NODE;
      child = spawn(executable, [...appArgs, ...args, '--no-update'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      closed = new Promise((resolve) => {
        child.once('close', resolve);
        child.once('error', (error) => {
          spawnError = error;
        });
      });
      child.stdout.on('data', (data) => {
        log += data;
      });
      child.stderr.on('data', (data) => {
        log += data;
      });
      return child;
    },
    async ready() {
      return eventually(
        async () => {
          requireRunning();
          const connection = JSON.parse(
            await readFile(path.join(profile, 'mcp-editor.json'), 'utf8'),
          );
          assert.ok(
            connection.socket,
            `Editor connection is not ready: ${log}`,
          );
          return { profile };
        },
        { timeoutMs: 30_000, retry: isRunning },
      );
    },
    async debugger(kind = 'renderer') {
      const target = await eventually(
        async () => {
          requireRunning();
          const pattern =
            kind === 'renderer'
              ? /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/
              : /Debugger listening on ws:\/\/127\.0\.0\.1:(\d+)/;
          const match = pattern.exec(log);
          assert.ok(match, `The ${kind} debugger is not ready: ${log}`);
          const url = `http://127.0.0.1:${match[1]}`;
          if (kind === 'renderer') {
            return editorTarget(url);
          }
          const targets = await (await fetch(`${url}/json/list`)).json();
          assert.ok(targets[0]?.webSocketDebuggerUrl);
          return targets[0];
        },
        { timeoutMs: 30_000, retry: isRunning },
      );
      const connection = await connectCdp(target.webSocketDebuggerUrl);
      connections.push(connection);
      return connection;
    },
    async close() {
      for (const connection of connections) {
        connection.close();
      }
      // These profiles are disposable; dirty drafts must not open save prompts.
      if (child && child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
      // Wait for stdio to close as well as the main process to exit. Chromium
      // subprocesses can briefly keep writing profile files after SIGKILL.
      await closed;
      await rm(keepArtifacts ? profile : directory, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100,
      });
    },
  };
}
