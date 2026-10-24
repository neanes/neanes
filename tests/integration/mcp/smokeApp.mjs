import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import electron from 'electron';

import { connectCdp, editorTarget } from './smokeCdp.mjs';
import { eventually } from './smokePolling.mjs';

export async function createSmokeApp(prefix, { keepArtifacts = false } = {}) {
  const directory = await mkdtemp(path.join(tmpdir(), prefix));
  const profile = path.join(directory, 'profile');
  const policyPath = path.join(profile, 'agent-access.json');
  const token = randomBytes(32).toString('hex');
  await mkdir(profile);
  await writeFile(policyPath, JSON.stringify({ enabled: true, token }), {
    mode: 0o600,
  });
  let child, exited, spawnError;
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
    policyPath,
    token,
    log: () => log,
    start({
      args = [],
      executable = electron,
      appArgs = [process.cwd()],
      port = 0,
    } = {}) {
      assert.equal(child, undefined, 'This fixture already launched Electron.');
      const env = {
        ...process.env,
        IS_TEST: '1',
        NEANES_DEV_USER_DATA_DIR: profile,
        NEANES_MCP_PORT: String(port),
      };
      for (const key of [
        'ELECTRON_RUN_AS_NODE',
        'NEANES_MCP_TOKEN',
        'NEANES_HEADLESS_PROFILE',
        'NEANES_HEADLESS_POLICY',
        'NEANES_WORKER_TOKEN',
      ]) {
        delete env[key];
      }
      child = spawn(executable, [...appArgs, ...args, '--no-update'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      exited = new Promise((resolve) => {
        child.once('exit', resolve);
        child.once('error', (error) => {
          spawnError = error;
          resolve();
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
    async endpoint() {
      return eventually(
        async () => {
          requireRunning();
          const endpoint = JSON.parse(
            await readFile(`${policyPath}.endpoint`, 'utf8'),
          );
          assert.ok(endpoint.endpoint, `MCP endpoint is not ready: ${log}`);
          return { url: endpoint.endpoint, token: endpoint.token };
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
      await exited;
      await rm(keepArtifacts ? profile : directory, {
        recursive: true,
        force: true,
      });
    },
  };
}
