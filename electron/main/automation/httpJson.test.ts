import { randomUUID } from 'node:crypto';
import { createReadStream, promises as fs } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { createServer, request } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import { expect, it } from 'vitest';

import { readJsonBody } from './httpJson';
import { MAX_AUTOMATION_MESSAGE_BYTES } from './messageLimits';

for (const chunked of [false, true]) {
  it(
    'bounds real file-backed HTTP responses with ' +
      (chunked ? 'chunked transfer' : 'Content-Length'),
    async () => {
      const root = await fs.mkdtemp(
        path.join(os.tmpdir(), 'neanes-http-body-'),
      );
      const file = path.join(root, 'body.json');
      const socket =
        process.platform === 'win32'
          ? `\\\\.\\pipe\\neanes-http-${randomUUID()}`
          : path.join(root, 'file.sock');
      const server = createServer((_req, res) => {
        if (chunked) {
          res.setHeader('Transfer-Encoding', 'chunked');
        } else {
          res.setHeader(
            'Content-Length',
            String(MAX_AUTOMATION_MESSAGE_BYTES + 1),
          );
        }
        void pipeline(createReadStream(file), res).catch(() => {});
      });
      await fs.writeFile(
        file,
        '"' + 'x'.repeat(MAX_AUTOMATION_MESSAGE_BYTES - 1) + '"',
      );
      await new Promise<void>((resolve) => server.listen(socket, resolve));
      try {
        const response = await new Promise<IncomingMessage>(
          (resolve, reject) => {
            const outgoing = request(
              { socketPath: socket, agent: false },
              resolve,
            );
            outgoing.once('error', reject);
            outgoing.end();
          },
        );
        await expect(readJsonBody(response)).rejects.toThrow('size limit');
      } finally {
        server.closeAllConnections();
        await new Promise<void>((resolve) => server.close(() => resolve()));
        await fs.rm(root, { recursive: true, force: true });
      }
    },
  );
}
