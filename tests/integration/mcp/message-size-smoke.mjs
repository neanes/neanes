// Run outside the agent command sandbox; starts disposable Electron processes.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import path from 'node:path';

import { EmptyResultSchema } from '@modelcontextprotocol/sdk/types.js';

import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const probe = process.argv.includes('--probe');
const app = await createSmokeApp('neanes-message-size-');
const clients = [];
try {
  app.start({ args: ['--remote-debugging-port=0'] });
  await app.ready();
  const { evaluate } = await app.debugger();
  await eventually(async () =>
    assert.equal(
      await evaluate(
        'Boolean(window._editor?.workspaces.value.length && !document.querySelector(".loading-overlay"))',
      ),
      true,
    ),
  );
  const connection = JSON.parse(
    await readFile(path.join(app.profile, 'mcp-editor.json'), 'utf8'),
  );
  async function socketCall(tool, args) {
    const wire =
      JSON.stringify({
        ...connection,
        request: { tool, arguments: args },
      }) + '\n';
    return new Promise((resolve, reject) => {
      const socket = createConnection(connection.socket);
      let response = '';
      socket.setTimeout(70_000, () =>
        socket.destroy(new Error('Socket timeout')),
      );
      socket.on('error', reject);
      socket.on('data', (chunk) => {
        response += chunk;
      });
      socket.on('end', () => {
        try {
          assert.ok(response, 'Editor disconnected without a response');
          const outcome = JSON.parse(response);
          assert.equal(outcome.success, true, JSON.stringify(outcome));
          resolve(outcome.result);
        } catch (error) {
          reject(error);
        }
      });
      socket.on('connect', () => socket.write(wire));
    });
  }
  for (const edge of probe ? [256, 512] : [512, 1024, 2048]) {
    // A real, lossless PNG with deterministic high-detail pixels, rather than
    // padding a tiny image or sending an invalid base64 payload.
    const imageLength = await evaluate(`(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = ${edge};
      const context = canvas.getContext('2d');
      const image = context.createImageData(${edge}, ${edge});
      let seed = 123456789;
      for (let i = 0; i < image.data.length; i += 4) {
        for (let channel = 0; channel < 3; channel++) {
          seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
          image.data[i + channel] = seed & 255;
        }
        image.data[i + 3] = 255;
      }
      context.putImageData(image, 0, 0);
      window.__messageSizeImage = canvas.toDataURL('image/png');
      return window.__messageSizeImage.length;
    })()`);
    // Keep debugger messages small; only the transports under test carry the
    // complete image in one envelope.
    const parts = [];
    for (let offset = 0; offset < imageLength; offset += 256_000) {
      parts.push(
        await evaluate(
          `window.__messageSizeImage.slice(${offset}, ${offset + 256_000})`,
        ),
      );
    }
    await evaluate('delete window.__messageSizeImage');
    const data = parts.join('');
    const actions = [
      {
        action: 'insert',
        elements: [
          {
            elementType: 'ImageBox',
            properties: { data, imageWidth: 400, imageHeight: 400 },
          },
        ],
      },
    ];
    for (const route of ['stdio', 'editor-socket']) {
      let client;
      let call = socketCall;
      if (route === 'stdio') {
        client = await connectStdioClient('message-size-smoke', {
          profile: app.profile,
        });
        clients.push(client);
        call = createToolCaller(client);
      }
      const document = await call('create_document', {
        title: `${route}-${edge}`,
      });
      const args = {
        documentId: document.documentId,
        expectedRevision: document.revision,
        actions,
      };
      const wire =
        route === 'stdio'
          ? {
              jsonrpc: '2.0',
              id: 100,
              method: 'tools/call',
              params: { name: 'edit_elements', arguments: args },
            }
          : {
              ...connection,
              request: { tool: 'edit_elements', arguments: args },
            };
      const measurement = {
        edge,
        route,
        pngBytes: Buffer.from(data.split(',')[1], 'base64').length,
        wireBytes: Buffer.byteLength(JSON.stringify(wire) + '\n'),
      };
      try {
        const edited = await call('edit_elements', args);
        const filePath = path.join(app.directory, `${route}-${edge}.byzx`);
        const saved = await call('save_document', {
          documentId: document.documentId,
          expectedRevision: edited.revision,
          filePath,
        });
        const score = JSON.parse(await readFile(filePath, 'utf8'));
        assert.equal(
          score.staff.elements.find(
            (element) => element.elementType === 'ImageBox',
          ).data,
          data,
        );
        await call('close_document', {
          documentId: document.documentId,
          expectedRevision: saved.revision,
        });
        measurement.result = 'saved image matches exactly';
      } catch (error) {
        measurement.result = error.message;
        if (!probe) {
          throw error;
        }
      } finally {
        console.log(JSON.stringify(measurement));
        await client?.close();
      }
    }
  }
  if (!probe) {
    const client = await connectStdioClient('message-size-boundary', {
      profile: app.profile,
    });
    clients.push(client);
    const limit = 32 * 1024 * 1024;
    assert.deepEqual(
      await client.request(
        { method: 'ping', params: { padding: 'x'.repeat(limit - 1024) } },
        EmptyResultSchema,
      ),
      {},
    );
    await assert.rejects(
      client.request(
        { method: 'ping', params: { padding: 'x'.repeat(limit + 1) } },
        EmptyResultSchema,
      ),
      /Connection closed/,
    );
    console.log(
      'Stdio accepts a request just below 32 MiB and closes above it.',
    );
  }
  console.log(
    probe
      ? 'Message size baseline probe complete.'
      : 'Message size smoke passed.',
  );
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  await Promise.allSettled(clients.map((client) => client.close()));
  await app.close();
}
