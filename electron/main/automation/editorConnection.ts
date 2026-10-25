import { randomBytes, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import type { Socket } from 'node:net';
import { createConnection, createServer } from 'node:net';
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
import { readJsonLines } from './jsonLines';

const connectionSchema = z.object({
  socket: z.string().min(1),
  token: z.string().min(32),
  contractVersion: z.number(),
});
const developmentConnectionSchema = connectionSchema.extend({
  devServerUrl: z
    .url()
    .refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      );
    })
    .optional(),
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
  devServerUrl?: string,
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
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    const controller = new AbortController();
    let started = false;
    socket.setTimeout(70_000, () => socket.destroy());
    socket.on('error', () => socket.destroy());
    socket.once('close', () => {
      controller.abort(new Error('EDITOR_DISCONNECTED'));
      sockets.delete(socket);
      detach();
    });
    const detach = readJsonLines(
      socket,
      1024 * 1024,
      (message) => {
        // One operation per connection. Closing it also cancels queued/export work.
        if (started) {
          socket.destroy();
          return;
        }
        started = true;
        void automationOutcome(async () => {
          const envelope = requestSchema.parse(message);
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
          if (!socket.destroyed) {
            socket.end(JSON.stringify(outcome) + '\n');
          }
        });
      },
      () => socket.destroy(),
    );
  });
  server.on('error', (error) =>
    console.error('Editor connection failed', error),
  );
  async function close() {
    for (const socket of sockets) {
      socket.destroy();
    }
    if (server.listening) {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
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
        ...(devServerUrl ? { devServerUrl } : {}),
      }),
    );
  } catch (error) {
    await close();
    throw error;
  }
  return { close };
}

// Only unpackaged MCP startup calls this. A stale discovery file must not make
// private work depend on a development server whose editor has already exited.
export async function readEditorDevelopmentUrl(discoveryFile: string) {
  let connection;
  try {
    connection = developmentConnectionSchema.safeParse(
      JSON.parse(await fs.readFile(discoveryFile, 'utf8')),
    );
  } catch {
    // Optional development metadata must not prevent private startup.
    return undefined;
  }
  if (
    !connection.success ||
    !connection.data.devServerUrl ||
    connection.data.contractVersion !== compatibility.contractVersion
  ) {
    return undefined;
  }
  const { socket: socketPath, devServerUrl } = connection.data;
  return new Promise<string | undefined>((resolve) => {
    const socket = createConnection(socketPath);
    const finish = (url?: string) => {
      socket.destroy();
      resolve(url);
    };
    socket.setTimeout(1000, () => finish());
    socket.once('error', () => finish());
    socket.once('connect', () => finish(devServerUrl));
  });
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
  return new Promise((resolve, reject) => {
    const socket = createConnection(connection.socket);
    let settled = false;
    const finish = (error?: Error, result?: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      detach();
      signal.removeEventListener('abort', cancel);
      socket.destroy();
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };
    const cancel = () => finish(new Error('EXPORT_CANCELLED'));
    const detach = readJsonLines(
      socket,
      32 * 1024 * 1024,
      (message) => {
        const outcome = z
          .discriminatedUnion('success', [
            z.object({ success: z.literal(true), result: z.unknown() }),
            z.object({
              success: z.literal(false),
              error: automationErrorSchema,
            }),
          ])
          .safeParse(message);
        if (!outcome.success) {
          finish(new Error('Invalid editor response.'));
        } else if (outcome.data.success) {
          finish(undefined, outcome.data.result);
        } else {
          finish(new AutomationError(outcome.data.error));
        }
      },
      (error) => finish(error),
    );
    socket.setTimeout(65_000, () =>
      finish(new Error('Editor request timed out. Inspect before retrying.')),
    );
    socket.once('error', (error: NodeJS.ErrnoException) =>
      finish(
        error.code === 'ENOENT' || error.code === 'ECONNREFUSED'
          ? new Error(
              'No editor is open. Open Neanes to work with editor tabs.',
            )
          : error,
      ),
    );
    socket.once('close', () =>
      finish(
        new Error(
          'Editor disconnected. The request may have completed; inspect before retrying.',
        ),
      ),
    );
    signal.addEventListener('abort', cancel, { once: true });
    if (signal.aborted) {
      cancel();
      return;
    }
    socket.once('connect', () => {
      socket.write(JSON.stringify({ ...connection, request }) + '\n');
    });
  });
}
