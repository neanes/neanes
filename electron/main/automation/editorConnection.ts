import { randomBytes, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { createServer, request as httpRequest } from 'node:http';
import path from 'node:path';

import { z } from 'zod';

import {
  AutomationError,
  automationErrorSchema,
  automationOutcome,
} from '../../../src/automation/contracts/errors';
import {
  type AutomationRequest,
  parseAutomationRequest,
} from '../../../src/automation/contracts/protocol';
import { atomicWrite } from './atomicWrite';
import compatibility from './compatibility.json';
import { readJsonBody } from './httpJson';

const connectionSchema = z.object({
  socket: z.string().min(1),
  token: z.string().min(32),
  contractVersion: z.number(),
});
const requestSchema = z.object({
  token: z.string(),
  contractVersion: z.number(),
  request: z.unknown(),
});

export async function startEditorConnection(
  discoveryFile: string,
  execute: (
    request: AutomationRequest,
    signal: AbortSignal,
  ) => Promise<unknown>,
) {
  const token = randomBytes(32).toString('hex');
  // Use a short private directory: macOS Unix socket paths are limited to 103 bytes.
  const directory =
    process.platform === 'win32' ? null : await fs.mkdtemp('/tmp/neanes-');
  if (directory) {
    await fs.chmod(directory, 0o700);
  }
  const socketPath = directory
    ? path.join(directory, 'editor.sock')
    : `\\\\.\\pipe\\neanes-${randomBytes(16).toString('hex')}`;
  const server = createServer((req, res) => {
    const controller = new AbortController();
    res.once('close', () => controller.abort(new Error('EDITOR_DISCONNECTED')));
    void automationOutcome(async () => {
      if (req.method !== 'POST' || req.url !== '/operation') {
        throw new Error('Invalid editor request.');
      }
      const envelope = requestSchema.parse(await readJsonBody(req));
      const supplied = Buffer.from(envelope.token);
      const expected = Buffer.from(token);
      if (
        supplied.length !== expected.length ||
        !timingSafeEqual(supplied, expected)
      ) {
        throw new Error('PERMISSION_DENIED');
      }
      if (envelope.contractVersion !== compatibility.contractVersion) {
        throw new Error(
          'Incompatible Neanes automation contract. Update Neanes and reconnect.',
        );
      }
      const request = parseAutomationRequest(envelope.request);
      return execute(request, controller.signal);
    }).then((outcome) => {
      if (!res.destroyed) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(outcome));
      }
    });
  });
  // Each operation owns its connection; disconnecting cancels its work.
  server.maxRequestsPerSocket = 1;
  server.headersTimeout = 10_000;
  server.requestTimeout = 70_000;
  server.setTimeout(70_000);
  server.on('error', (error) =>
    console.error('Editor connection failed', error),
  );
  async function close() {
    if (server.listening) {
      const closed = new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      server.closeAllConnections();
      await closed;
    }
    if (directory) {
      await fs.rm(directory, { recursive: true, force: true });
    }
    // Do not remove a discovery file replaced by a newer editor process.
    try {
      const current = JSON.parse(await fs.readFile(discoveryFile, 'utf8'));
      if (current.token === token) {
        await fs.rm(discoveryFile, { force: true });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(socketPath, () => {
        server.removeListener('error', reject);
        resolve();
      });
    });
    await fs.mkdir(path.dirname(discoveryFile), { recursive: true });
    await atomicWrite(
      discoveryFile,
      JSON.stringify({
        socket: socketPath,
        token,
        contractVersion: compatibility.contractVersion,
      }),
    );
  } catch (error) {
    await close();
    throw error;
  }
  return { close };
}

export async function executeInEditor(
  discoveryFile: string,
  request: AutomationRequest,
  signal: AbortSignal,
): Promise<unknown> {
  signal.throwIfAborted();
  let connection;
  try {
    connection = connectionSchema.parse(
      JSON.parse(await fs.readFile(discoveryFile, 'utf8')),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        'No editor is open. Open Neanes to work with editor tabs.',
      );
    }
    throw error;
  }
  if (connection.contractVersion !== compatibility.contractVersion) {
    throw new Error(
      'Incompatible Neanes automation contract. Update Neanes and reconnect.',
    );
  }
  const timeout = AbortSignal.timeout(65_000);
  try {
    const response = await new Promise<IncomingMessage>((resolve, reject) => {
      const outgoing = httpRequest(
        {
          socketPath: connection.socket,
          path: '/operation',
          method: 'POST',
          agent: false,
          signal: AbortSignal.any([signal, timeout]),
        },
        resolve,
      );
      outgoing.once('error', reject);
      outgoing.end(JSON.stringify({ ...connection, request }));
    });
    if (response.statusCode !== 200) {
      response.destroy();
      throw new Error(`Invalid editor HTTP response: ${response.statusCode}.`);
    }
    const outcome = z
      .discriminatedUnion('success', [
        z.object({ success: z.literal(true), result: z.unknown() }),
        z.object({ success: z.literal(false), error: automationErrorSchema }),
      ])
      .safeParse(await readJsonBody(response));
    if (!outcome.success) {
      throw new Error('Invalid editor response.');
    }
    if (!outcome.data.success) {
      throw new AutomationError(outcome.data.error);
    }
    return outcome.data.result;
  } catch (error) {
    if (signal.aborted) {
      throw new Error('EXPORT_CANCELLED');
    }
    if (timeout.aborted) {
      throw new Error('Editor request timed out. Inspect before retrying.');
    }
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ECONNREFUSED') {
      throw new Error(
        'No editor is open. Open Neanes to work with editor tabs.',
      );
    }
    if (
      ['ECONNRESET', 'EPIPE', 'ERR_STREAM_PREMATURE_CLOSE'].includes(code ?? '')
    ) {
      throw new Error(
        'Editor disconnected. The request may have completed; inspect before retrying.',
      );
    }
    throw error;
  }
}
