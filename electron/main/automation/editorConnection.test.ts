import { promises as fs } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { createConnection } from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  type AutomationRequest,
  parseAutomationRequest,
} from '../../../src/automation/contracts/protocol';
import compatibility from './compatibility.json';
import {
  executeInEditor,
  readEditorDevelopmentUrl,
  startEditorConnection,
} from './editorConnection';
import { discoverScoreFiles } from './fileDiscovery';
import { MAX_AUTOMATION_MESSAGE_BYTES } from './messageLimits';

// Exercise the actual transport and file discovery; no Electron or fake host.
describe('editor HTTP connection', () => {
  let root: string;
  let discovery: string;
  let connection: Awaited<ReturnType<typeof startEditorConnection>>;
  const signal = new AbortController().signal;
  beforeEach(async () => {
    root = await fs.realpath(
      await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-ipc-')),
    );
    discovery = path.join(root, 'mcp-editor.json');
    await fs.writeFile(path.join(root, 'score.byzx'), '{}');
    connection = await startEditorConnection(discovery, (request, signal) => {
      if (request.tool !== 'discover_score_files') {
        throw new Error('Unexpected tool');
      }
      return discoverScoreFiles(request.arguments, signal);
    });
  });
  afterEach(async () => {
    await connection.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  const request = (folderPath: string) =>
    parseAutomationRequest({
      tool: 'discover_score_files',
      arguments: { folderPath },
    });

  it('round trips concurrent typed operations and cleans up private discovery', async () => {
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        executeInEditor(discovery, request(root), signal),
      ),
    );
    for (const result of results) {
      expect(result).toEqual({
        files: [path.join(root, 'score.byzx')],
        nextOffset: null,
      });
    }
    if (process.platform !== 'win32') {
      expect((await fs.stat(discovery)).mode & 0o777).toBe(0o600);
      const state = JSON.parse(await fs.readFile(discovery, 'utf8'));
      expect((await fs.stat(path.dirname(state.socket))).mode & 0o777).toBe(
        0o700,
      );
    }
    await connection.close();
    await expect(fs.stat(discovery)).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(
      executeInEditor(discovery, request(root), signal),
    ).rejects.toThrow('No editor is open');
  });

  it('rejects stale credentials and mismatched contracts without executing', async () => {
    const state = JSON.parse(await fs.readFile(discovery, 'utf8'));
    await fs.writeFile(
      discovery,
      JSON.stringify({ ...state, token: 'x'.repeat(64) }),
    );
    await expect(
      executeInEditor(discovery, request(root), signal),
    ).rejects.toMatchObject({ error: { code: 'PERMISSION_DENIED' } });
    await fs.writeFile(
      discovery,
      JSON.stringify({
        ...state,
        contractVersion: compatibility.contractVersion + 1,
      }),
    );
    await expect(
      executeInEditor(discovery, request(root), signal),
    ).rejects.toThrow('Incompatible');
    await fs.writeFile(discovery, JSON.stringify(state));
  });

  it('preserves structured file errors and refuses already-cancelled work', async () => {
    await expect(
      executeInEditor(discovery, request(path.join(root, 'missing')), signal),
    ).rejects.toMatchObject({ error: { code: 'FILE_NOT_FOUND' } });
    await expect(
      executeInEditor(discovery, request(root), AbortSignal.abort()),
    ).rejects.toThrow();
  });

  it('handles fragmented messages and refuses oversized unfinished messages', async () => {
    const state = JSON.parse(await fs.readFile(discovery, 'utf8'));
    const outcome = await new Promise<string>((resolve, reject) => {
      const outgoing = httpRequest(
        {
          socketPath: state.socket,
          path: '/operation',
          method: 'POST',
          agent: false,
        },
        (response) => {
          let body = '';
          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            body += chunk;
          });
          response.once('end', () => resolve(body));
          response.once('error', reject);
        },
      );
      outgoing.once('error', reject);
      const body = JSON.stringify({ ...state, request: request(root) });
      for (const character of body) {
        outgoing.write(character);
      }
      outgoing.end();
    });
    expect(JSON.parse(outcome).success).toBe(true);
    await new Promise<void>((resolve, reject) => {
      const socket = createConnection(state.socket);
      socket.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code !== 'EPIPE' && error.code !== 'ECONNRESET') {
          reject(error);
        }
      });
      socket.once('close', () => resolve());
      socket.once('connect', () =>
        socket.write(
          'POST /operation HTTP/1.1\r\nHost: localhost\r\nContent-Length: ' +
            (MAX_AUTOMATION_MESSAGE_BYTES + 2) +
            '\r\n\r\n' +
            'x'.repeat(MAX_AUTOMATION_MESSAGE_BYTES + 1),
        ),
      );
    });
    expect(
      await executeInEditor(discovery, request(root), signal),
    ).toMatchObject({ nextOffset: null });
  });
  it('discovers development URLs only for a live compatible editor', async () => {
    const state = JSON.parse(await fs.readFile(discovery, 'utf8'));
    expect(await readEditorDevelopmentUrl(discovery)).toBeUndefined();
    await fs.writeFile(
      discovery,
      JSON.stringify({ ...state, devServerUrl: 'http://127.0.0.1:5173/' }),
    );
    expect(await readEditorDevelopmentUrl(discovery)).toBe(
      'http://127.0.0.1:5173/',
    );
    await connection.close();
    await fs.writeFile(
      discovery,
      JSON.stringify({ ...state, devServerUrl: 'http://127.0.0.1:5173/' }),
    );
    expect(await readEditorDevelopmentUrl(discovery)).toBeUndefined();
    await fs.rm(discovery);
    expect(await readEditorDevelopmentUrl(discovery)).toBeUndefined();
  });

  it('ignores malformed, incompatible, and non-local development discovery', async () => {
    const state = JSON.parse(await fs.readFile(discovery, 'utf8'));
    for (const value of [
      '{',
      JSON.stringify({ ...state, devServerUrl: 'https://example.com/' }),
      JSON.stringify({ ...state, devServerUrl: 'file:///tmp/renderer.html' }),
      JSON.stringify({
        ...state,
        devServerUrl: 'http://127.0.0.1:5173/',
        contractVersion: -1,
      }),
    ]) {
      await fs.writeFile(discovery, value);
      expect(await readEditorDevelopmentUrl(discovery)).toBeUndefined();
    }
    await fs.writeFile(discovery, JSON.stringify(state));
  });
});

it('refuses an oversized unfinished chunked upload and remains usable', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-http-chunked-'));
  const discovery = path.join(root, 'discovery.json');
  const connection = await startEditorConnection(
    discovery,
    (request, signal) => {
      if (request.tool !== 'discover_score_files') {
        throw new Error('Unexpected tool');
      }
      return discoverScoreFiles(request.arguments, signal);
    },
  );
  try {
    const state = JSON.parse(await fs.readFile(discovery, 'utf8'));
    await new Promise<void>((resolve, reject) => {
      const socket = createConnection(state.socket);
      socket.on('error', (error: NodeJS.ErrnoException) => {
        if (!['EPIPE', 'ECONNRESET'].includes(error.code ?? '')) {
          reject(error);
        }
      });
      socket.once('close', () => resolve());
      socket.once('connect', () => {
        socket.write(
          'POST /operation HTTP/1.1\r\nHost: localhost\r\nTransfer-Encoding: chunked\r\n\r\n' +
            (MAX_AUTOMATION_MESSAGE_BYTES + 2).toString(16) +
            '\r\n' +
            'x'.repeat(MAX_AUTOMATION_MESSAGE_BYTES + 1),
        );
      });
    });
    const result = await executeInEditor(
      discovery,
      parseAutomationRequest({
        tool: 'discover_score_files',
        arguments: { folderPath: root },
      }),
      new AbortController().signal,
    );
    expect(result).toMatchObject({ nextOffset: null });
  } finally {
    await connection.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});

describe('editor HTTP lifecycle', () => {
  for (const action of ['cancel', 'shutdown'] as const) {
    it(`${action} aborts in-flight file discovery`, async () => {
      const root = await fs.mkdtemp(
        path.join(os.tmpdir(), 'neanes-http-lifecycle-'),
      );
      const source = path.join(root, 'scores');
      await fs.mkdir(source);
      await Promise.all(
        Array.from({ length: 1000 }, (_, index) =>
          fs.mkdir(path.join(source, `folder-${index}`)),
        ),
      );
      const started = Promise.withResolvers<void>();
      const finished = Promise.withResolvers<boolean>();
      const discovery = path.join(root, 'discovery.json');
      const connection = await startEditorConnection(
        discovery,
        async (request, signal) => {
          if (request.tool !== 'discover_score_files') {
            throw new Error('Unexpected tool');
          }
          started.resolve();
          try {
            const result = await discoverScoreFiles(request.arguments, signal);
            finished.resolve(false);
            return result;
          } catch (error) {
            finished.resolve(signal.aborted);
            throw error;
          }
        },
      );
      const controller = new AbortController();
      const request = parseAutomationRequest({
        tool: 'discover_score_files',
        arguments: { folderPath: source, recursive: true },
      });
      const running = executeInEditor(discovery, request, controller.signal);
      const checked = expect(running).rejects.toThrow(
        action === 'cancel' ? 'EXPORT_CANCELLED' : 'may have completed',
      );
      try {
        await started.promise;
        if (action === 'cancel') {
          controller.abort();
        } else {
          await connection.close();
        }
        await checked;
        expect(await finished.promise).toBe(true);
        if (action === 'cancel') {
          expect(
            await executeInEditor(
              discovery,
              parseAutomationRequest({
                tool: 'discover_score_files',
                arguments: { folderPath: root },
              }),
              new AbortController().signal,
            ),
          ).toMatchObject({ nextOffset: null });
        }
      } finally {
        controller.abort();
        await connection.close();
        await fs.rm(root, { recursive: true, force: true });
      }
    });
  }

  it('preserves discovery metadata replaced by another editor', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'neanes-http-owner-'));
    const discovery = path.join(root, 'discovery.json');
    const execute = (request: AutomationRequest, signal: AbortSignal) => {
      if (request.tool !== 'discover_score_files') {
        throw new Error('Unexpected tool');
      }
      return discoverScoreFiles(request.arguments, signal);
    };
    const first = await startEditorConnection(discovery, execute);
    const second = await startEditorConnection(discovery, execute);
    try {
      const replacement = await fs.readFile(discovery, 'utf8');
      await first.close();
      expect(await fs.readFile(discovery, 'utf8')).toBe(replacement);
      const request = parseAutomationRequest({
        tool: 'discover_score_files',
        arguments: { folderPath: root },
      });
      expect(
        await executeInEditor(discovery, request, new AbortController().signal),
      ).toMatchObject({ nextOffset: null });
    } finally {
      await first.close();
      await second.close();
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
