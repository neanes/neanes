// Run outside the agent command sandbox; this starts a disposable Electron app.
import assert from 'node:assert/strict';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';
import { createSmokeApp } from './smokeApp.mjs';
import { pauseNextExport } from './smokeCdp.mjs';
import { callTool, connectStdioClient } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-preview-', { keepArtifacts: true });
const { directory } = app;
let client;
const imageDirectories = new Set();
try {
  app.start({ args: ['--remote-debugging-port=0', '--inspect=0'] });
  const { evaluate } = await app.debugger();
  const { evaluate: evaluateMain } = await app.debugger('main');
  await app.ready();
  // Exercise request expiry and a late reply against the real renderer.
  const delayedEvaluation = evaluate(
    `new Promise(resolve => {
      const timer = setTimeout(() => resolve('deadline missed'), 2000);
      window.__smokeLateReply = () => { clearTimeout(timer); resolve('late reply'); };
    })`,
    { timeoutMs: 100 },
  );
  await assert.rejects(delayedEvaluation, (error) => {
    assert.equal(error.code, 'CDP_REQUEST_TIMEOUT');
    assert.equal(error.method, 'Runtime.evaluate');
    assert.ok(Number.isInteger(error.requestId));
    assert.match(error.message, /__smokeLateReply/);
    return true;
  });
  assert.equal(
    await evaluate(
      `window.__smokeLateReply(); delete window.__smokeLateReply; 'responsive'`,
    ),
    'responsive',
  );
  client = await connectStdioClient('preview-smoke', { profile: app.profile });
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
    const reply = await callTool(client, name, args, error);
    const outcome = reply.structuredContent;
    if (
      outcome.success &&
      ['preview_page', 'get_element_image'].includes(name)
    ) {
      imageDirectories.add(path.dirname(outcome.result.outputFilePath));
    }
    assert.equal(
      validator.getValidator(definition.outputSchema)(outcome).valid,
      true,
    );
    if (error) {
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
  async function assertEditorExportDisposed() {
    await eventually(async () => assert.equal(await exportWindows(), 0));
  }
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
      assert.ok(!('layoutId' in preview));
      assert.equal(preview.pageNumber, pageNumber);
      assert.equal(preview.pageCount, 2);
      assert.ok(Math.max(preview.width, preview.height) <= maxEdge);
      assert.equal(preview.content.length, 1);
      assert.equal(preview.mimeType, 'image/png');
      const buffer = await readFile(preview.outputFilePath);
      assert.ok(buffer.length <= 4 * 1024 * 1024);
      assert.equal(buffer.subarray(1, 4).toString(), 'PNG');
      assert.equal(buffer.readUInt32BE(16), preview.width);
      assert.equal(buffer.readUInt32BE(20), preview.height);
      assert.ok(!JSON.stringify(preview).includes('base64'));
      await writeFile(
        path.join(
          directory,
          `${scope.documentScope ?? 'private'}-${pageNumber}.png`,
        ),
        buffer,
      );
      const pixels = await evaluate(
        `(async()=>{const image=new Image();image.src=${JSON.stringify('data:image/png;base64,' + buffer.toString('base64'))};await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;let ink=0;for(let i=0;i<p.length;i+=4){if(p[i+3] && Math.min(p[i],p[i+1],p[i+2])<240)ink++;}return {ink,alpha:p[3]};})()`,
      );
      assert.ok(pixels.ink > 100);
      assert.equal(pixels.alpha, 255);
      if (scope.documentScope === 'editor') {
        await assertEditorExportDisposed();
      }
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
      'VALIDATION_ERROR',
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
    // Disable scripts in the next real export renderer before it can settle.
    // Cancellation must reach the server to dispose this pending window.
    if (scope.documentScope === 'editor') {
      await evaluateMain(`(() => {
        const {app} = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
        globalThis.__previewCancellation = { held: false, error: null };
        app.once('browser-window-created', (_event, window) => {
          window.webContents.debugger.attach();
          void window.webContents.debugger.sendCommand('Emulation.setScriptExecutionDisabled', {value: true}).then(
            () => { globalThis.__previewCancellation.held = true; },
            error => { globalThis.__previewCancellation.error = String(error); },
          );
        });
      })()`);
      const controller = new AbortController();
      const reason = new McpError(
        ErrorCode.RequestTimeout,
        'Preview smoke cancellation',
      );
      let finished = false;
      const outcome = client
        .callTool(
          { name: 'preview_page', arguments: { ...stable, pageNumber: 1 } },
          undefined,
          { signal: controller.signal },
        )
        .then(
          (result) => {
            finished = true;
            return { result };
          },
          (error) => {
            finished = true;
            return { error };
          },
        );
      try {
        await eventually(async () => {
          const held = await evaluateMain('globalThis.__previewCancellation');
          assert.equal(held.error, null);
          assert.equal(held.held, true);
          assert.equal(await exportWindows(), 1);
        });
        assert.equal(finished, false, 'The renderer must still be pending.');
        controller.abort(reason);
        assert.equal((await outcome).error, reason);
        await assertEditorExportDisposed();
        assert.deepEqual(await readScoreSnapshot(call, args), before);
        assert.equal(await state(), uiBefore);
      } finally {
        controller.abort(reason);
        await evaluateMain('delete globalThis.__previewCancellation');
      }
    }
    // The editor inspector can control editor-owned renderers. Private worker
    // renderers belong to a separate process and are covered through their API.
    if (scope.documentScope === 'editor') {
      await evaluateMain(`(() => {
        const {app} = process.getBuiltinModule('module').createRequire(process.cwd()+'/package.json')('electron');
        app.once('browser-window-created', (_event, window) => {
          window.webContents.once('did-start-loading', () => window.destroy());
        });
      })()`);
      await call(
        'preview_page',
        { ...stable, pageNumber: 1 },
        'EXPORT_RENDER_FAILED',
      );
      await assertEditorExportDisposed();
      assert.equal(await state(), uiBefore);
    }
    // Concurrent editor edits must not receive a misleading preview revision.
    if (scope.documentScope === 'editor') {
      const held = await pauseNextExport(evaluateMain);
      const pending = call(
        'preview_page',
        { ...stable, pageNumber: 1 },
        'REVISION_CONFLICT',
      ).then(
        () => null,
        (error) => error,
      );
      try {
        await held.wait();
        await evaluate(
          `(() => {const workspace = window._editor.workspaces.value.find(w=>w.id===${JSON.stringify(doc.documentId)}); workspace.updateLyricsLocked(!workspace.score.staff.lyrics.locked);})()`,
        );
      } finally {
        await held.release();
      }
      const failure = await pending;
      if (failure) {
        throw failure;
      }
      await assertEditorExportDisposed();
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
    await readFile(landscapePreview.outputFilePath),
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
  // An undecodable private image reports a rendering failure.
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
    'EXPORT_RENDER_FAILED',
  );
  console.log(`Preview smoke passed. PNGs: ${directory}`);
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  try {
    await client?.close();
  } finally {
    await app.close();
    // This disposable editor is force-killed; copied preview artifacts above
    // remain in directory while temporary working files are removed.
    for (const directory of imageDirectories) {
      await rm(directory, { recursive: true, force: true });
    }
  }
}
