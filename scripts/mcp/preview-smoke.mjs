// Run outside the agent command sandbox; this starts a disposable Electron app.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import electron from 'electron';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';

const directory = await mkdtemp(path.join(tmpdir(), 'neanes-preview-'));
const policyPath = path.join(directory, 'agent-access.json');
await writeFile(
  policyPath,
  JSON.stringify({ enabled: true, token: randomBytes(32).toString('hex') }),
  { mode: 0o600 },
);
const editor = spawn(
  electron,
  [
    process.cwd(),
    '--remote-debugging-port=9356',
    '--inspect=9357',
    '--no-update',
  ],
  {
    env: {
      ...process.env,
      IS_TEST: '1',
      NEANES_DEV_USER_DATA_DIR: directory,
      NEANES_MCP_PORT: '0',
      NEANES_MCP_TOKEN: undefined,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let log = '';
editor.stdout.on('data', (data) => {
  log += data;
});
editor.stderr.on('data', (data) => {
  log += data;
});
const sockets = [];
let client;
async function eventually(operation) {
  let error;
  for (let attempt = 0; attempt < 160; attempt++) {
    try {
      return await operation();
    } catch (e) {
      error = e;
      await delay(100);
    }
  }
  throw error;
}
async function debuggerConnection(port) {
  const target = await eventually(async () => {
    const targets = await (
      await fetch(`http://127.0.0.1:${port}/json/list`)
    ).json();
    const target = targets.find(
      (t) => !t.url.includes('export.html') && !t.url.startsWith('devtools:'),
    );
    assert.ok(target?.webSocketDebuggerUrl);
    return target;
  });
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  sockets.push(socket);
  await new Promise((resolve) =>
    socket.addEventListener('open', resolve, { once: true }),
  );
  let id = 0;
  return (expression) =>
    new Promise((resolve, reject) => {
      const requestId = ++id;
      const listener = (event) => {
        const reply = JSON.parse(event.data);
        if (reply.id !== requestId) {
          return;
        }
        socket.removeEventListener('message', listener);
        if (reply.error || reply.result?.exceptionDetails) {
          reject(new Error(JSON.stringify(reply)));
        } else {
          resolve(reply.result.result.value);
        }
      };
      socket.addEventListener('message', listener);
      socket.send(
        JSON.stringify({
          id: requestId,
          method: 'Runtime.evaluate',
          params: { expression, awaitPromise: true, returnByValue: true },
        }),
      );
    });
}
try {
  const evaluate = await debuggerConnection(9356);
  const evaluateMain = await debuggerConnection(9357);
  await eventually(async () =>
    assert.equal(
      (await evaluate("window.ipcRenderer.invoke('AgentAccessGet')")).status,
      'ready',
    ),
  );
  await eventually(async () =>
    assert.ok(
      await evaluate(
        'Boolean(window._editor?.workspaces.value.length && !document.querySelector(".loading-overlay"))',
      ),
    ),
  );
  const configuration = JSON.parse(
    (await evaluate("window.ipcRenderer.invoke('AgentAccessGet')"))
      .configuration,
  ).mcpServers.neanes;
  client = new Client({ name: 'preview-smoke', version: '1' });
  await client.connect(
    new StdioClientTransport({ ...configuration, stderr: 'inherit' }),
  );
  const definitions = (await client.listTools()).tools;
  const validator = new AjvJsonSchemaValidator();
  async function call(name, args = {}, error) {
    const definition = definitions.find((tool) => tool.name === name);
    if (!error) {
      assert.equal(
        validator.getValidator(definition.inputSchema)(args).valid,
        true,
      );
    }
    const reply = await client.callTool({ name, arguments: args });
    const outcome = reply.structuredContent;
    assert.deepEqual(outcome, JSON.parse(reply.content[0].text));
    assert.equal(
      validator.getValidator(definition.outputSchema)(outcome).valid,
      true,
    );
    assert.equal(outcome.success, !error, JSON.stringify(outcome));
    if (error) {
      assert.equal(outcome.error.code, error);
      return;
    }
    return { ...outcome.result, content: reply.content };
  }
  const state = () =>
    evaluate(
      'JSON.stringify(window._editor.workspaces.value.map(w => ({id:w.id,dirty:w.hasUnsavedChanges,history:w.commandService.commandHistory.length,selection:w.selectedElement?.id})))',
    );
  const exportWindows = () =>
    evaluateMain(
      'process.getBuiltinModule("module").createRequire(process.cwd()+"/package.json")("electron").BrowserWindow.getAllWindows().filter(w=>w.webContents.getURL().includes("export.html")).length',
    );
  // Use an edited control document; pristine startup tabs normalize on remount.
  const controls = (
    await client.callTool({
      name: 'list_documents',
      arguments: { documentScope: 'editor' },
    })
  ).structuredContent.result;
  for (const control of controls) {
    const settled = await readScoreSnapshot(call, {
      documentScope: 'editor',
      documentId: control.documentId,
    });
    await call('replace_document_properties', {
      documentScope: 'editor',
      documentId: control.documentId,
      expectedRevision: settled.revision,
      properties: { title: 'Preview regression control', author: '' },
    });
  }
  const baseline = await state();
  for (const scope of [{ documentScope: 'editor' }, {}]) {
    let doc = await call('create_document', {
      ...scope,
      title: 'Unsaved PNG preview',
    });
    const args = { ...scope, documentId: doc.documentId };
    doc = await call('edit_elements', {
      ...args,
      expectedRevision: doc.revision,
      actions: [
        {
          action: 'insert',
          index: 0,
          elements: [
            {
              elementType: 'TextBox',
              properties: { content: 'Page one: PNG preview' },
            },
            {
              elementType: 'Note',
              clientId: 'note',
              properties: {
                quantitativeNeume: 'Ison',
                lyrics: 'Test',
                pageBreak: true,
              },
            },
            {
              elementType: 'RichTextBox',
              properties: { content: '<p>Page two: rich text</p>' },
            },
          ],
        },
      ],
    });
    const noteRef = doc.created.find(
      (item) => item.clientId === 'note',
    ).elementRef;
    doc = await call('edit_elements', {
      ...args,
      expectedRevision: doc.revision,
      actions: [
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: noteRef,
            collection: 'alternateLines',
          },
          elements: [
            { elementType: 'AlternateLine', properties: { x: 40, y: -60 } },
            {
              elementType: 'AlternateLine',
              clientId: 'populatedAlternate',
              properties: { x: 20, y: -30 },
            },
          ],
        },
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: '@populatedAlternate',
            collection: 'elements',
          },
          elements: [
            { elementType: 'Note', properties: { quantitativeNeume: 'Ison' } },
          ],
        },
        {
          action: 'insert',
          collection: {
            kind: 'children',
            parentRef: noteRef,
            collection: 'annotations',
          },
          elements: [{ elementType: 'Annotation' }],
        },
      ],
    });
    const before = await readScoreSnapshot(call, args);
    const uiBefore = await state();
    const pages = await call('get_pages', {
      ...args,
      expectedRevision: before.revision,
    });
    assert.equal(pages.pageCount, 2);
    const stable = {
      ...args,
      expectedRevision: pages.revision,
      expectedLayoutId: pages.layoutId,
    };
    for (const [pageNumber, maxEdge] of [
      [1, 512],
      [2, 2048],
    ]) {
      const preview = await call('preview_page', {
        ...stable,
        pageNumber,
        maxEdge,
      });
      assert.equal(preview.capturedRevision, pages.revision);
      assert.equal(preview.revision, pages.revision);
      assert.equal(preview.layoutId, pages.layoutId);
      assert.equal(preview.pageNumber, pageNumber);
      assert.equal(preview.pageCount, 2);
      assert.ok(Math.max(preview.width, preview.height) <= maxEdge);
      assert.equal(preview.content.length, 2);
      const image = preview.content[1];
      assert.equal(image.type, 'image');
      assert.equal(image.mimeType, 'image/png');
      const buffer = Buffer.from(image.data, 'base64');
      assert.ok(buffer.length <= 4 * 1024 * 1024);
      assert.equal(buffer.subarray(1, 4).toString(), 'PNG');
      assert.equal(buffer.readUInt32BE(16), preview.width);
      assert.equal(buffer.readUInt32BE(20), preview.height);
      assert.ok(!JSON.stringify(preview.content[0]).includes(image.data));
      await writeFile(
        path.join(
          directory,
          `${scope.documentScope ?? 'private'}-${pageNumber}.png`,
        ),
        buffer,
      );
      const pixels = await evaluate(
        `(async()=>{const image=new Image();image.src=${JSON.stringify('data:image/png;base64,' + image.data)};await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;let ink=0;for(let i=0;i<p.length;i+=4){if(p[i+3] && Math.min(p[i],p[i+1],p[i+2])<240)ink++;}return {ink,alpha:p[3]};})()`,
      );
      assert.ok(pixels.ink > 100);
      assert.equal(pixels.alpha, 255);
      await eventually(async () => assert.equal(await exportWindows(), 0));
    }
    await call(
      'preview_page',
      { ...stable, pageNumber: 3 },
      'INVALID_PAGE_NUMBER',
    );
    await call(
      'preview_page',
      {
        ...stable,
        expectedRevision: stable.expectedRevision + 1,
        pageNumber: 1,
      },
      'REVISION_CONFLICT',
    );
    await call(
      'preview_page',
      { ...stable, expectedLayoutId: '0'.repeat(64), pageNumber: 1 },
      'LAYOUT_CONFLICT',
    );
    await call(
      'preview_page',
      { ...stable, pageNumber: 1, maxEdge: 2049 },
      'VALIDATION_ERROR',
    );
    const children = await call('get_elements', {
      ...args,
      expectedRevision: stable.expectedRevision,
      collection: {
        kind: 'children',
        parentRef: noteRef,
        collection: 'alternateLines',
      },
    });
    assert.equal(children.elements.length, 2);
    assert.equal(children.elements[0].children.elements, 0);
    assert.equal(children.elements[1].children.elements, 1);
    const after = await readScoreSnapshot(call, args);
    assert.deepEqual(after.score, before.score);
    assert.equal(after.revision, before.revision);
    assert.equal(after.hasUnsavedChanges, true);
    assert.equal(await state(), uiBefore);
    // A real HTTP/MCP cancellation while the detached PNG window exists.
    const controller = new AbortController();
    const pending = client.callTool(
      { name: 'preview_page', arguments: { ...stable, pageNumber: 1 } },
      undefined,
      { signal: controller.signal },
    );
    const cancelled = assert.rejects(pending);
    await eventually(async () => assert.equal(await exportWindows(), 1));
    controller.abort();
    await cancelled;
    await eventually(async () => assert.equal(await exportWindows(), 0));
    assert.equal(await state(), uiBefore);
    // Concurrent editor edits must not receive a misleading preview revision.
    if (scope.documentScope === 'editor') {
      const pending = call(
        'preview_page',
        { ...stable, pageNumber: 1 },
        'REVISION_CONFLICT',
      );
      await eventually(async () => assert.equal(await exportWindows(), 1));
      await evaluate(
        `window._editor.workspaces.value.find(w=>w.id===${JSON.stringify(doc.documentId)}).score.documentProperties.title='Concurrent edit'`,
      );
      await pending;
      await eventually(async () => assert.equal(await exportWindows(), 0));
    }
    if (!scope.documentScope) {
      const failed = call(
        'preview_page',
        { ...stable, pageNumber: 1 },
        'EXPORT_RENDER_FAILED',
      );
      await eventually(async () => assert.equal(await exportWindows(), 1));
      await evaluateMain(
        'process.getBuiltinModule("module").createRequire(process.cwd()+"/package.json")("electron").BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes("export.html")).destroy()',
      );
      await failed;
      await eventually(async () => assert.equal(await exportWindows(), 0));
      assert.equal(await state(), uiBefore);
    }
    doc = await readScoreSnapshot(call, args);
    await call('close_document', {
      ...args,
      expectedRevision: doc.revision,
      discardUnsavedChanges: true,
    });
  }
  assert.equal(await state(), baseline);
  // Saved custom landscape content, rich text, filename tokens, and embedded images.
  let seed = await call('create_document');
  const fixtureArgs = { documentId: seed.documentId };
  const landscape = (await readScoreSnapshot(call, fixtureArgs)).score;
  Object.assign(landscape.pageSetup, {
    pageSize: 'Custom',
    pageWidthCustom: 576,
    pageHeightCustom: 864,
    pageWidth: 864,
    pageHeight: 576,
    landscape: true,
    showHeader: true,
    showFooter: true,
    headerFooterDifferentChapterOpening: false,
  });
  landscape.documentProperties = {
    title: 'Landscape preview tokens',
    author: '',
  };
  landscape.headers.default.elements = [
    {
      elementType: 'RichTextBox',
      content: '<p>HEADER $:title $f</p>',
      height: 1,
    },
  ];
  landscape.footers.default.elements = [
    { elementType: 'TextBox', content: 'FOOTER $p/$n', height: 1 },
  ];
  landscape.staff.elements.unshift(
    {
      elementType: 'RichTextBox',
      content: '<p>Custom landscape preview</p>',
      height: 1,
    },
    {
      elementType: 'ImageBox',
      data:
        'data:image/svg+xml;base64,' +
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>',
        ).toString('base64'),
      imageWidth: 40,
      imageHeight: 40,
    },
  );
  const landscapePath = path.join(directory, 'landscape.byzx');
  const sourceBytes = JSON.stringify(landscape);
  await writeFile(landscapePath, sourceBytes);
  const opened = await call('open_document', { filePath: landscapePath });
  const argsSaved = { documentId: opened.documentId };
  const savedBefore = await readScoreSnapshot(call, argsSaved);
  const layoutSaved = await call('get_pages', argsSaved);
  const landscapePreview = await call('preview_page', {
    ...argsSaved,
    expectedRevision: layoutSaved.revision,
    expectedLayoutId: layoutSaved.layoutId,
    pageNumber: 1,
  });
  assert.ok(landscapePreview.width > landscapePreview.height);
  assert.equal(await readFile(landscapePath, 'utf8'), sourceBytes);
  assert.deepEqual(
    (await readScoreSnapshot(call, argsSaved)).score,
    savedBefore.score,
  );
  await writeFile(
    path.join(directory, 'landscape.png'),
    Buffer.from(landscapePreview.content[1].data, 'base64'),
  );
  await call('close_document', {
    ...argsSaved,
    expectedRevision: layoutSaved.revision,
    discardUnsavedChanges: true,
  });
  await call('close_document', {
    ...fixtureArgs,
    expectedRevision: seed.revision,
    discardUnsavedChanges: true,
  });
  // An undecodable image fails settlement without retaining a renderer or changing source state.
  let broken = await call('create_document');
  const args = { documentId: broken.documentId };
  const score = (await readScoreSnapshot(call, args)).score;
  score.staff.elements.unshift({
    elementType: 'ImageBox',
    data: 'data:image/png;base64,broken',
    imageWidth: 50,
    imageHeight: 50,
  });
  const fixture = path.join(directory, 'broken.byzx');
  await writeFile(fixture, JSON.stringify(score));
  broken = await call('open_document', { filePath: fixture });
  await call(
    'preview_page',
    {
      documentId: broken.documentId,
      expectedRevision: broken.revision,
      pageNumber: 1,
    },
    'LAYOUT_SETTLEMENT_FAILED',
  );
  await eventually(async () => assert.equal(await exportWindows(), 0));
  console.log(`Preview smoke passed. PNGs: ${directory}`);
} catch (error) {
  console.error(log);
  throw error;
} finally {
  await client?.close();
  for (const socket of sockets) {
    socket.close();
  }
  const exit = new Promise((resolve) => editor.once('exit', resolve));
  editor.kill();
  await exit;
}
