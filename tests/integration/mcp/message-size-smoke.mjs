// Run outside the agent command sandbox; starts disposable Electron processes.
import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { EmptyResultSchema } from '@modelcontextprotocol/sdk/types.js';

import { createSmokeApp } from './smokeApp.mjs';
import {
  connectStdioClient,
  createToolCaller,
  requestEditor,
} from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-message-size-');
const clients = [];
const imageDirectories = new Set();
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
  async function editorCall(tool, args) {
    const outcome = await requestEditor(connection, { tool, arguments: args });
    assert.equal(outcome.success, true, JSON.stringify(outcome));
    return outcome.result;
  }
  for (const edge of [512, 1024, 2048]) {
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
    const input = Buffer.from(data.split(',')[1], 'base64');
    const imagePath = path.join(app.directory, `input-${edge}.png`);
    await writeFile(imagePath, input);
    const actions = [
      {
        action: 'insert',
        elements: [
          {
            elementType: 'ImageBox',
            properties: { imagePath, imageWidth: 400, imageHeight: 400 },
          },
        ],
      },
    ];
    for (const route of ['stdio', 'editor-http']) {
      let client;
      let call = editorCall;
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
        wireBytes: Buffer.byteLength(
          JSON.stringify(wire) + (route === 'stdio' ? '\n' : ''),
        ),
      };
      const outputPaths = [];
      try {
        assert.ok(measurement.wireBytes < 2048);
        assert.ok(!JSON.stringify(wire).includes('base64'));
        const edited = await call('edit_elements', args);
        const elementRef = edited.created[0].elementRef;
        const exported = await call('get_element_image', {
          documentId: document.documentId,
          elementRef,
        });
        imageDirectories.add(path.dirname(exported.outputFilePath));
        outputPaths.push(exported.outputFilePath);
        assert.deepEqual(await readFile(exported.outputFilePath), input);
        assert.ok(!JSON.stringify(exported).includes('base64'));
        const elements = await call('get_elements', {
          documentId: document.documentId,
          includeContent: true,
        });
        assert.ok(!JSON.stringify(elements).includes('base64'));
        assert.ok(!Object.hasOwn(elements.elements[0].properties, 'data'));
        const preview = await call('preview_page', {
          documentId: document.documentId,
          expectedRevision: edited.revision,
          pageNumber: 1,
          maxEdge: 512,
        });
        imageDirectories.add(path.dirname(preview.outputFilePath));
        outputPaths.push(preview.outputFilePath);
        assert.equal(
          (await readFile(preview.outputFilePath)).subarray(1, 4).toString(),
          'PNG',
        );
        assert.ok(!JSON.stringify(preview).includes('base64'));
        console.log(
          JSON.stringify({
            route,
            previewResponseBytes: Buffer.byteLength(JSON.stringify(preview)),
          }),
        );

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
        throw error;
      } finally {
        console.log(JSON.stringify(measurement));
        await client?.close();
        if (client) {
          for (const outputFilePath of outputPaths) {
            await assert.rejects(readFile(outputFilePath), { code: 'ENOENT' });
          }
        }
      }
    }
  }
  // A large locked lyrics-manager buffer is a legitimate write even with no
  // notes yet; Unicode byte size matters independently of JSON character count.
  for (const route of ['stdio', 'editor-http']) {
    const client =
      route === 'stdio'
        ? await connectStdioClient('message-size-text', {
            profile: app.profile,
          })
        : undefined;
    if (client) {
      clients.push(client);
    }
    const call = client ? createToolCaller(client) : editorCall;
    let document = await call('create_document', {
      title: 'Large lyrics input',
    });
    const text = 'Ἀλληλούϊα '.repeat(128000);
    const args = {
      documentId: document.documentId,
      expectedRevision: document.revision,
      actions: [{ action: 'set_staff_lyrics', text, locked: true }],
    };
    console.log(
      JSON.stringify({
        route,
        lyricsRequestBytes: Buffer.byteLength(JSON.stringify(args)),
      }),
    );
    assert.ok(Buffer.byteLength(JSON.stringify(args)) > 1024 * 1024);
    document = await call('edit_elements', args);
    let actual = '';
    let offset = 0;
    do {
      const chunk = await call('get_staff_lyrics', {
        documentId: document.documentId,
        expectedRevision: document.revision,
        offset,
      });
      actual += chunk.text;
      offset = chunk.nextOffset;
    } while (offset !== null);
    assert.equal(actual, text);
    await call('close_document', {
      documentId: document.documentId,
      expectedRevision: document.revision,
      discardUnsavedChanges: true,
    });
    await client?.close();
  }
  {
    const client = await connectStdioClient('message-size-boundary', {
      profile: app.profile,
    });
    clients.push(client);
    const limit = 8 * 1024 * 1024;
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
      'Stdio accepts a request just below 8 MiB and closes above it.',
    );
  }
  console.log('Message size smoke passed.');
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  await Promise.allSettled(clients.map((client) => client.close()));
  await app.close();
  // The editor fixture uses SIGKILL to avoid dirty-document prompts. Remove
  // its image files explicitly; normal worker shutdown is checked above.
  for (const directory of imageDirectories) {
    await rm(directory, { recursive: true, force: true });
  }
}
