import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const directory = process.argv[2];
const token = process.env.NEANES_MCP_TOKEN;
assert.ok(directory && path.isAbsolute(directory) && token);
const debugUrl = process.env.NEANES_DEBUG_URL ?? 'http://127.0.0.1:9334';
const targets = async () => (await fetch(`${debugUrl}/json/list`)).json();
const editorTarget = (await targets()).find(
  (target) =>
    target.type === 'page' &&
    !target.url.includes('export.html') &&
    !target.url.startsWith('devtools:'),
);
assert.ok(
  editorTarget,
  'Start an isolated Electron instance with --remote-debugging-port=9334.',
);
const socket = new WebSocket(editorTarget.webSocketDebuggerUrl);
await new Promise((resolve) =>
  socket.addEventListener('open', resolve, { once: true }),
);
let nextId = 0;
const requests = new Map();
socket.addEventListener('message', (event) => {
  const reply = JSON.parse(event.data);
  if (requests.has(reply.id)) {
    const { resolve, reject } = requests.get(reply.id);
    requests.delete(reply.id);
    if (reply.error || reply.result.exceptionDetails) {
      reject(new Error(JSON.stringify(reply)));
    } else {
      resolve(reply.result);
    }
  }
});
function send(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    requests.set(id, { resolve, reject });
    socket.send(
      JSON.stringify({
        id,
        method,
        params,
      }),
    );
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.result.value;
}
async function click(selector, modifiers = 0, button = 'left') {
  await evaluate(
    `document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center' })`,
  );
  const point = await evaluate(
    `(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`,
  );
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type,
      ...point,
      button,
      clickCount: 1,
      modifiers,
    });
  }
}
async function waitFor(predicate, message) {
  for (let attempt = 0; attempt < 300; attempt++) {
    if (await predicate()) {
      return;
    }
    await setTimeout(20);
  }
  throw new Error(message);
}
const hiddenTargets = async () =>
  (await targets()).filter((target) => target.url.includes('export.html'));
const client = new Client({
  name: 'neanes-rendering-migration-smoke',
  version: '1.0.0',
});
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp'),
    { requestInit: { headers: { Authorization: `Bearer ${token}` } } },
  ),
);
async function call(name, args = {}) {
  const reply = await client.callTool({ name, arguments: args });
  assert.ok(!reply.isError, JSON.stringify(reply));
  return reply.structuredContent.result;
}
async function settled(documentId) {
  let previous;
  for (let attempt = 0; attempt < 100; attempt++) {
    const current = await call('get_document', { documentId });
    if (previous?.revision === current.revision) {
      return current;
    }
    previous = current;
    await setTimeout(50);
  }
  throw new Error('Document did not settle.');
}
// Run only against a disposable profile. This exercises real renderer IPC and
// filesystem output, without replacing print, image, layout, or dialog APIs.
const introduced = [];
const suffix = Date.now();
const output = (name) =>
  path.join(directory, `render-migration-${suffix}-${name}`);
const overlays = {
  showDeveloperPanels: true,
  overlaysEnabled: true,
  printOverlays: false,
  showGuides: true,
  showAdjustmentRatios: true,
  showAnonymousBoxes: true,
  showElementBoxes: true,
  showInkBoundingBoxes: true,
  showGlueWidths: true,
  showLyricBaselines: true,
  showLyricBoundingBoxes: true,
  showNeumeBoundingBoxes: true,
  showCollisionRegions: true,
};
async function png(snapshot, name, options = {}) {
  return evaluate(
    `window.ipcRenderer.invoke('ExportSnapshotAsPng', ${JSON.stringify({
      snapshot,
      filePath: output(`${name}.png`),
      options: {
        dpi: 96,
        pageNumbers: null,
        transparentBackground: false,
        ...options,
      },
    })})`,
  );
}
async function imageInfo(filePath) {
  const buffer = await fs.readFile(filePath);
  const pixels = await evaluate(`(async () => {
    const image = new Image(); image.src = ${JSON.stringify(`data:image/png;base64,${buffer.toString('base64')}`)};
    await image.decode(); const canvas = document.createElement('canvas');
    canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0; for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] && (pixels[i] < 240 || pixels[i + 1] < 240 || pixels[i + 2] < 240)) ink++;
    }
    return { corner: [...pixels.slice(0, 4)], ink };
  })()`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    ...pixels,
  };
}
try {
  const seed = await call('create_document');
  introduced.push(seed.documentId);
  await call('save_document', {
    documentId: seed.documentId,
    expectedRevision: seed.revision,
    filePath: output('seed.byzx'),
  });
  const score = JSON.parse(await fs.readFile(output('seed.byzx'), 'utf8'));
  Object.assign(score.pageSetup, {
    pageSize: 'Custom',
    pageWidthCustom: 576,
    pageHeightCustom: 864,
    pageWidth: 864,
    pageHeight: 576,
    landscape: true,
    showHeader: true,
    showFooter: true,
    showHeaderHorizontalRule: true,
    headerFooterDifferentChapterOpening: false,
  });
  score.documentProperties = {
    title: 'Resolved title with wrapping. '.repeat(8),
    author: 'Rendering migration',
  };
  score.headers.default.elements = [
    { elementType: 'RichTextBox', content: '<p>HEADER $:title</p>', height: 1 },
  ];
  score.footers.default.elements = [
    { elementType: 'TextBox', content: 'FOOTER $f $p/$n', height: 1 },
  ];
  const image =
    'data:image/svg+xml;base64,' +
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>',
    ).toString('base64');
  score.staff.elements = [
    ...score.staff.elements.slice(0, 1),
    { elementType: 'Note', quantitativeNeume: 'Ison', lyrics: 'First page' },
    {
      elementType: 'RichTextBox',
      inline: true,
      content: '<p>INLINE TOP</p>',
      contentBottom: '<p>INLINE BOTTOM</p>',
    },
    { elementType: 'ImageBox', data: image, imageWidth: 40, imageHeight: 40 },
    {
      elementType: 'RichTextBox',
      pageBreak: true,
      content: '<p>SECOND PAGE rich text</p>',
      height: 1,
    },
    { elementType: 'Note', quantitativeNeume: 'Ison', lyrics: 'Second page' },
    { elementType: 'Empty' },
  ];
  await fs.writeFile(output('fixture.byzx'), JSON.stringify(score));
  const opened = await call('open_document', {
    filePath: output('fixture.byzx'),
  });
  introduced.push(opened.documentId);
  const loaded = await settled(opened.documentId);
  const note = loaded.score.staff.elements.find(
    (element) => element.elementType === 'Note',
  );
  await click(`#element-${note.id} .lyrics`);
  const focused = await settled(opened.documentId);
  await call('save_document', {
    documentId: opened.documentId,
    expectedRevision: focused.revision,
  });
  const before = await settled(opened.documentId);
  const snapshot = {
    score: structuredClone(before.score),
    filePath: output('fixture.byzx'),
    fileName: 'Fixture',
    title: 'Snapshot print title',
    editorLanguage: 'en',
    systemFonts: [],
    overlays,
  };
  snapshot.score.headers.default.elements[0].height = 1;
  snapshot.score.staff.elements.find((element) => element.pageBreak).height = 1;
  const workspaceState = await evaluate(
    `JSON.stringify({ selected: window._editor.selectedWorkspace.value.id, selection: window._editor.selectedWorkspace.value.selectedElement?.id, workspaces: window._editor.workspaces.value.map(w => ({id: w.id, dirty: w.hasUnsavedChanges, history: w.commandService})) })`,
  );
  const normal = await png(snapshot, 'normal');
  assert.equal(normal.exportedPageCount, 2);
  const first = await imageInfo(normal.firstExportedPagePath);
  assert.equal(first.width, 864);
  assert.equal(first.height, 576);
  assert.deepEqual(first.corner, [255, 255, 255, 255]);
  assert.ok(first.ink > 1000);
  assert.equal((await hiddenTargets()).length, 0);
  const transparent = await png(snapshot, 'transparent', {
    pageNumbers: [2],
    dpi: 192,
    transparentBackground: true,
  });
  assert.equal(transparent.exportedPageCount, 1);
  assert.equal(transparent.firstExportedPagePath, output('transparent-2.png'));
  const second = await imageInfo(transparent.firstExportedPagePath);
  assert.equal(second.width, 1728);
  assert.equal(second.height, 1152);
  assert.equal(second.corner[3], 0);
  assert.ok(second.ink > 1000);
  await assert.rejects(fs.access(output('transparent-1.png')), {
    code: 'ENOENT',
  });
  const withOverlays = await png(
    { ...snapshot, overlays: { ...overlays, printOverlays: true } },
    'overlays',
    { pageNumbers: [1] },
  );
  assert.ok(
    (await imageInfo(withOverlays.firstExportedPagePath)).ink > first.ink,
  );
  const empty = await png(snapshot, 'empty', { pageNumbers: [] });
  assert.equal(empty.exportedPageCount, 0);
  assert.equal((await hiddenTargets()).length, 0);
  const after = await settled(opened.documentId);
  assert.deepEqual(after.score, before.score);
  assert.equal(after.revision, before.revision);
  assert.equal(
    await evaluate(
      `JSON.stringify({ selected: window._editor.selectedWorkspace.value.id, selection: window._editor.selectedWorkspace.value.selectedElement?.id, workspaces: window._editor.workspaces.value.map(w => ({id: w.id, dirty: w.hasUnsavedChanges, history: w.commandService})) })`,
    ),
    workspaceState,
  );
  if (
    process.argv.includes('--native-print-cancel') ||
    process.argv.includes('--native-print-save')
  ) {
    const saveNativePdf = process.argv.includes('--native-print-save');
    console.log(
      saveNativePdf
        ? `Use the native PDF menu to save to ${output('native.pdf')}`
        : 'Cancel the native print dialog to finish the optional native print check.',
    );
    const printed = await evaluate(
      `window.ipcRenderer.invoke('PrintWorkspace', ${JSON.stringify({
        snapshot,
        pageSize: 'Custom',
        pageWidthInches: 6,
        pageHeightInches: 9,
        landscape: true,
      })})`,
    );
    if (saveNativePdf) {
      assert.equal(printed.success, true);
      const pdf = await fs.readFile(output('native.pdf'));
      assert.ok(pdf.subarray(0, 5).equals(Buffer.from('%PDF-')));
      console.log(
        'Native PDF pages:',
        [...pdf.toString('latin1').matchAll(/\/Type\s*\/Page\b/g)].length,
      );
    } else {
      assert.equal(printed.success, false);
      assert.match(printed.failureReason, /cancel/i);
    }
    assert.equal((await hiddenTargets()).length, 0);
    assert.deepEqual((await settled(opened.documentId)).score, before.score);
  }
  const broken = structuredClone(snapshot);
  broken.score.staff.elements = [
    {
      elementType: 'ImageBox',
      data: 'data:image/png;base64,broken',
      imageWidth: 40,
      imageHeight: 40,
    },
    { elementType: 'Empty' },
  ];
  await assert.rejects(png(broken, 'broken'), /EXPORT_RENDER_FAILED/);
  assert.equal((await hiddenTargets()).length, 0);
  await assert.rejects(fs.access(output('broken-1.png')), { code: 'ENOENT' });
  // Close an actual rendering window while it is preparing, then verify disposal.
  const interrupted = png(snapshot, 'interrupted').then(
    () => null,
    (error) => String(error),
  );
  let hidden;
  await waitFor(async () => {
    hidden = (await hiddenTargets())[0];
    return hidden;
  }, 'Missing rendering window');
  const hiddenSocket = new WebSocket(hidden.webSocketDebuggerUrl);
  await new Promise((resolve) =>
    hiddenSocket.addEventListener('open', resolve, { once: true }),
  );
  hiddenSocket.send(JSON.stringify({ id: 1, method: 'Page.close' }));
  assert.match(await interrupted, /EXPORT_RENDER_FAILED/);
  await waitFor(
    async () => (await hiddenTargets()).length === 0,
    'Rendering window leaked',
  );
  hiddenSocket.close();
  console.log(
    'Detached PNG dimensions, range, alpha, overlays, source preservation, failure and disposal passed.',
    normal.firstExportedPagePath,
  );
} finally {
  for (const documentId of introduced.reverse()) {
    const current = await call('get_document', { documentId });
    await call('close_document', {
      documentId,
      expectedRevision: current.revision,
      discardUnsavedChanges: true,
    });
  }
  await client.close();
  socket.close();
}
