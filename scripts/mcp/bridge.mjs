#!/usr/bin/env node
// Dependency-free Node 22+ stdio-to-HTTP MCP bridge, shipped with Neanes.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { setTimeout as delay } from 'node:timers/promises';
import { parseArgs } from 'node:util';

import {
  bridgeInstructions,
  bridgeResourceContents,
  bridgeTools,
  documentScope,
  isDocumentTool,
} from './bridgeProtocol.mjs';

const { values } = parseArgs({
  options: {
    executable: { type: 'string' },
    app: { type: 'string' },
    policy: { type: 'string' },
    // Older copied configurations may still supply this; routing is automatic.
    target: { type: 'string' },
  },
});
let child, profile, primary;
let tools;
let stopping = false;
let policyToken;
let validatedEditor;
async function requireAccess() {
  const policy = JSON.parse(await readFile(values.policy, 'utf8'));
  if (
    policy.enabled !== true ||
    typeof policy.token !== 'string' ||
    policy.token.length < 32 ||
    (policyToken && policyToken !== policy.token)
  ) {
    throw new Error(
      'Agent access is disabled. Enable it in Neanes Preferences and reconnect.',
    );
  }
  policyToken ??= policy.token;
}

const requests = new Map();
function log(message) {
  process.stderr.write(`Neanes MCP: ${message}\n`);
}
function send(message) {
  if (!stopping) {
    process.stdout.write(JSON.stringify(message) + '\n');
  }
}
function validateConnection(connection) {
  const address = new URL(connection.endpoint);
  if (
    address.protocol !== 'http:' ||
    address.hostname !== '127.0.0.1' ||
    address.pathname !== '/mcp' ||
    typeof connection.token !== 'string' ||
    connection.token.length < 32
  ) {
    throw new Error('Invalid local connection.');
  }
  return connection;
}
async function rpc(connection, message, signal = AbortSignal.timeout(65_000)) {
  validateConnection(connection);
  const response = await fetch(connection.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${connection.token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify(message),
    signal,
  });
  if (!response.ok) {
    throw new Error(
      `Neanes returned HTTP ${response.status}. Check access settings and reconnect.`,
    );
  }
  return response.status === 202 || response.status === 204
    ? null
    : response.json();
}
const initialize = (connection) =>
  rpc(
    connection,
    {
      jsonrpc: '2.0',
      id: 'bridge-initialize',
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'neanes-bridge', version: '1' },
      },
    },
    AbortSignal.timeout(3000),
  );
async function discoverEditor() {
  const deadline = Date.now() + 60_000;
  while (true) {
    let state;
    try {
      state = JSON.parse(await readFile(`${values.policy}.endpoint`, 'utf8'));
    } catch (error) {
      validatedEditor = undefined;
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
    if (
      state.error ||
      state.pid !== validatedEditor?.pid ||
      state.endpoint !== validatedEditor?.endpoint ||
      state.token !== validatedEditor?.token
    ) {
      validatedEditor = undefined;
    }
    if (!Number.isInteger(state.pid) || state.pid <= 0) {
      return null;
    }
    try {
      process.kill(state.pid, 0);
    } catch (error) {
      if (error.code === 'ESRCH') {
        validatedEditor = undefined;
        return null;
      }
      throw error;
    }
    if (state.error === 'AGENT_ACCESS_DISABLED') {
      throw new Error(
        'Agent access is disabled. Enable it in Neanes Preferences and reconnect.',
      );
    }
    if (state.error === 'EDITOR_DISCONNECTED') {
      return null;
    }
    if (state.error) {
      throw new Error(`Neanes could not start agent access: ${state.error}`);
    }
    if (state.endpoint) {
      const connection = validateConnection(state);
      if (!validatedEditor) {
        const reply = await initialize(connection);
        if (reply?.result?.serverInfo?.name !== 'neanes') {
          throw new Error('The editor endpoint is not Neanes.');
        }
        validatedEditor = connection;
      }
      return connection;
    }
    if (Date.now() > deadline) {
      throw new Error(
        'Neanes is still starting. Check its connection status and reconnect.',
      );
    }
    await delay(100);
  }
}
async function stop(code = 0) {
  if (stopping) {
    return;
  }
  stopping = true;
  for (const controller of requests.values()) {
    controller.abort();
  }
  if (child && child.exitCode === null && child.signalCode === null) {
    const exited = new Promise((resolve) => child.once('exit', resolve));
    child.kill('SIGTERM');
    await exited;
  }
  if (profile) {
    await rm(profile, { recursive: true, force: true });
  }
  process.exitCode = code;
}
async function launchWorker() {
  await requireAccess();
  if (!values.executable || !path.isAbsolute(values.executable)) {
    throw new Error('An absolute --executable path is required.');
  }
  profile = await mkdtemp(path.join(tmpdir(), 'neanes-worker-'));
  const token = randomBytes(32).toString('hex');
  const env = {
    ...process.env,
    NEANES_HEADLESS_PROFILE: profile,
    NEANES_HEADLESS_POLICY: values.policy,
    NEANES_WORKER_TOKEN: token,
  };
  for (const key of [
    'ELECTRON_RUN_AS_NODE',
    'NEANES_MCP_TOKEN',
    'NEANES_MCP_PORT',
  ]) {
    delete env[key];
  }
  child = spawn(
    values.executable,
    [...(values.app ? [values.app] : []), '--headless-mcp'],
    { env, stdio: ['pipe', 'pipe', 'pipe', 'pipe'], windowsHide: true },
  );
  child.stdout.on('data', (data) => process.stderr.write(data));
  child.stderr.on('data', (data) => process.stderr.write(data));
  const endpoint = await new Promise((resolve, reject) => {
    const lines = createInterface({ input: child.stdio[3] });
    const timer = setTimeout(
      () => failed(new Error('Headless startup timed out.')),
      65_000,
    );
    function failed(error) {
      clearTimeout(timer);
      lines.close();
      reject(error);
    }
    child.once('error', failed);
    child.once('exit', (code) =>
      failed(new Error(`Headless worker exited (${code}).`)),
    );
    lines.once('line', (line) => {
      clearTimeout(timer);
      lines.close();
      try {
        resolve(JSON.parse(line).endpoint);
      } catch (error) {
        reject(error);
      }
    });
  });
  child.once('exit', () => {
    if (!stopping) {
      log('Neanes stopped. Reconnect to start a new session.');
      void stop(1);
      process.stdin.destroy();
    }
  });
  return { endpoint, token };
}
async function forward(message, signal) {
  await requireAccess();
  let connection = primary;
  if (message.method === 'tools/call') {
    const tool = tools.find((tool) => tool.name === message.params?.name);
    if (tool && isDocumentTool(tool)) {
      const routed = documentScope(message.params.arguments ?? {});
      if (routed.scope === 'editor') {
        connection = await discoverEditor();
        if (!connection) {
          throw new Error(
            'No editor is open. Open Neanes to work with editor tabs.',
          );
        }
      }
      message = {
        ...message,
        params: { ...message.params, arguments: routed.arguments },
      };
    }
  }
  let reply;
  try {
    reply = await rpc(connection, message, signal);
  } catch (error) {
    // Revalidate on the next call; an edit may already have committed.
    validatedEditor = undefined;
    throw error;
  }
  if (message.method === 'tools/list' && reply?.result?.tools) {
    reply.result.tools = bridgeTools(reply.result.tools);
  }
  if (message.method === 'resources/read' && reply?.result?.contents) {
    reply.result.contents = bridgeResourceContents(reply.result.contents);
  }
  if (message.method === 'initialize' && reply?.result) {
    reply.result.instructions = bridgeInstructions(reply.result.instructions);
  }
  return reply;
}
async function main() {
  if (!values.policy || !path.isAbsolute(values.policy)) {
    throw new Error(
      'An absolute --policy path is required. Copy configuration from Neanes settings.',
    );
  }
  await requireAccess();
  // Private work never inherits the interactive editor's modal or loading state.
  primary = await launchWorker();
  const policyTimer = setInterval(() => {
    void requireAccess().catch(async (error) => {
      log(error.message);
      await stop(1);
      process.stdin.destroy();
    });
  }, 1000);
  policyTimer.unref();
  const inventory = await rpc(primary, {
    jsonrpc: '2.0',
    id: 'bridge-tools',
    method: 'tools/list',
  });
  if (!inventory?.result?.tools) {
    throw new Error('Neanes tool discovery failed.');
  }
  tools = inventory.result.tools;
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
  lines.on('line', (line) => {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      send({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      });
      return;
    }
    if (message.method === 'notifications/cancelled') {
      requests.get(message.params?.requestId)?.abort();
      return;
    }
    const controller = new AbortController();
    if (message.id !== undefined) {
      requests.set(message.id, controller);
    }
    void forward(message, controller.signal)
      .then((reply) => {
        if (reply) {
          send(reply);
        }
      })
      .catch((error) => {
        if (message.id !== undefined) {
          send({
            jsonrpc: '2.0',
            id: message.id,
            error: { code: -32000, message: String(error.message) },
          });
        }
      })
      .finally(() => {
        if (message.id !== undefined) {
          requests.delete(message.id);
        }
      });
  });
  lines.once('close', () => void stop());
}
process.on('SIGTERM', () => void stop());
process.on('SIGINT', () => void stop());
main().catch(async (error) => {
  log(error.message);
  await stop(1);
  process.stdin.destroy();
});
