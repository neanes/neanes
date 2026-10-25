import { promises as fs } from 'node:fs';
import { createConnection } from 'node:net';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { parseAutomationRequest } from '../../../src/automation/contracts/protocol';
import compatibility from './compatibility.json';
import {
  executeInEditor,
  readEditorDevelopmentUrl,
  startEditorConnection,
} from './editorConnection';
import { discoverScoreFiles } from './fileDiscovery';
import { MAX_AUTOMATION_MESSAGE_BYTES } from './messageLimits';

// Exercise the actual transport and file discovery; no Electron or fake host.
describe('editor socket connection', () => {
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
      const socket = createConnection(state.socket);
      let response = '';
      socket.on('error', reject);
      socket.on('data', (chunk) => {
        response += chunk;
      });
      socket.on('end', () => resolve(response));
      socket.once('connect', () => {
        const line =
          JSON.stringify({ ...state, request: request(root) }) + '\n';
        for (const character of line) {
          socket.write(character);
        }
      });
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
        socket.write('x'.repeat(MAX_AUTOMATION_MESSAGE_BYTES + 1)),
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
