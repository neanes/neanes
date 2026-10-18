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
async function undo() {
  await click('.main-toolbar button[aria-label^="Undo"]');
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
  name: 'neanes-hidden-export-smoke',
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
    const current = await call('get_document_properties', { documentId });
    // Rendering regressions need the internal save snapshot, including DOM IDs.
    // Keep that inspection on the existing debugger surface, outside MCP.
    current.score = await evaluate(
      `JSON.parse(JSON.stringify(window._editor.serializeScore(window._editor.workspaces.value.find(w => w.id === ${JSON.stringify(documentId)}).score)))`,
    );
    if (previous?.revision === current.revision) {
      return current;
    }
    previous = current;
    await setTimeout(50);
  }
  throw new Error('Document did not settle.');
}
const introduced = [];
let primaryError;
const suffix = Date.now();
const sourcePath = path.join(directory, `hidden-export-${suffix}.byzx`);
const outputPath = path.join(directory, `hidden-export-${suffix}.pdf`);
try {
  const seed = await call('create_document');
  introduced.push(seed.documentId);
  await call('save_document', {
    documentId: seed.documentId,
    expectedRevision: seed.revision,
    filePath: sourcePath,
  });
  const score = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  score.documentProperties = {
    title: 'Long resolved title for header and footer wrapping. '.repeat(12),
    author: 'Export test',
  };
  score.pageSetup.showHeader = true;
  score.pageSetup.showFooter = true;
  score.pageSetup.facingPages = true;
  score.pageSetup.headerFooterDifferentChapterOpening = false;
  score.pageSetup.showHeaderHorizontalRule = true;
  score.pageSetup.showFooterHorizontalRule = true;
  score.headers.default.elements = [
    {
      elementType: 'RichTextBox',
      content: '<p>EXPORT HEADER $:title</p>',
      height: 1,
    },
  ];
  score.footers.default.elements = [
    {
      elementType: 'TextBox',
      content: 'EXPORT FOOTER $:title $f $p/$n',
      height: 1,
    },
  ];
  const notation = [
    { elementType: 'DropCap', content: 'A' },
    ...Array.from({ length: 30 }, (_, index) => ({
      elementType: 'Note',
      quantitativeNeume: 'Ison',
      lyrics: `lyric${index}`,
      isMelisma: index % 4 === 0,
      isHyphen: index % 4 === 0,
    })),
    { elementType: 'Martyria', auto: true },
    { elementType: 'Tempo', neume: 'Moderate' },
  ];
  score.staff.elements.splice(
    -1,
    0,
    ...notation,
    {
      elementType: 'RichTextBox',
      inline: true,
      content: '<p>INLINE TOP</p>',
      contentBottom: '<p>INLINE BOTTOM</p>',
    },
    {
      elementType: 'RichTextBox',
      inline: true,
      content: '',
      contentBottom: '<p>INLINE EMPTY TOP</p>',
    },
    {
      elementType: 'RichTextBox',
      multipanel: true,
      contentLeft: '<p>LEFT PANEL</p>',
      contentCenter: '<p style="text-align:center;">CENTER PANEL</p>',
      contentRight: '<p style="text-align:right;">RIGHT PANEL</p>',
      height: 22,
    },
    ...Array.from({ length: 3 }, (_, index) => ({
      elementType: 'RichTextBox',
      pageBreak: true,
      runningMarkerRole: 'chapter',
      runningMarkerText:
        index === 1
          ? 'Long chapter name for page-specific wrapping. '.repeat(5)
          : `Chapter ${index}`,
      content: `<p>EXPORT BODY ${index}</p><p>${'Wrapping text. '.repeat(30)}</p>`,
      height: 1,
    })),
  );
  const fixturePath = path.join(directory, `hidden-fixture-${suffix}.byzx`);
  await fs.writeFile(fixturePath, JSON.stringify(score));
  const opened = await call('open_document', { filePath: fixturePath });
  introduced.push(opened.documentId);
  // Exercise the interactive page's original ref/focus and mutation paths.
  const interactive = await settled(opened.documentId);
  const notes = interactive.score.staff.elements.filter(
    (element) => element.elementType === 'Note',
  );
  const firstNote = notes[1];
  const secondNote = notes[2];
  const firstNeume = `#element-${firstNote.id} .syllable-box`;
  const firstLyrics = `#element-${firstNote.id} .lyrics`;
  await click(firstNeume);
  assert.equal(
    await evaluate('window._editor.selectedElement.value.id'),
    firstNote.id,
  );
  const highlight = await evaluate(
    `getComputedStyle(document.querySelector(${JSON.stringify(firstNeume)})).backgroundColor`,
  );
  assert.notEqual(
    highlight,
    'rgba(0, 0, 0, 0)',
    'Selection styling must cross the shared component boundary.',
  );
  await click(`#element-${secondNote.id} .syllable-box`, 8);
  assert.deepEqual(
    await evaluate(
      'JSON.parse(JSON.stringify(window._editor.selectedWorkspace.value.selectionRange))',
    ),
    {
      start: interactive.score.staff.elements.findIndex(
        (element) => element.id === firstNote.id,
      ),
      end: interactive.score.staff.elements.findIndex(
        (element) => element.id === secondNote.id,
      ),
    },
  );
  await click(firstLyrics);
  assert.equal(
    await evaluate('document.activeElement.classList.contains("lyrics")'),
    true,
  );
  await evaluate(
    `(() => { const range = document.createRange(); range.selectNodeContents(document.activeElement); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); })()`,
  );
  await send('Input.insertText', { text: 'Shared page lyric' });
  await click(firstNeume);
  await waitFor(
    () =>
      evaluate(
        `window._editor.elements.value.find(e => e.id === ${firstNote.id}).lyrics === 'Shared page lyric'`,
      ),
    'Lyrics blur was not forwarded.',
  );
  await undo();
  await waitFor(
    () =>
      evaluate(
        `window._editor.elements.value.find(e => e.id === ${firstNote.id}).lyrics === ${JSON.stringify(firstNote.lyrics)}`,
      ),
    'Lyrics undo failed.',
  );

  // Undo changes the selected note's key; its replacement must re-register refs.
  await click(firstLyrics);
  assert.equal(
    await evaluate('document.activeElement.classList.contains("lyrics")'),
    true,
  );
  await click(firstNeume);
  await click(`#element-${notes[3].id} .syllable-box`, 0, 'right');
  assert.equal(
    await evaluate('window._editor.selectedElement.value.id'),
    notes[3].id,
  );
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', {
      type,
      key: 'Escape',
      code: 'Escape',
      windowsVirtualKeyCode: 27,
    });
  }
  const unzoomed = await evaluate(
    `document.querySelector(${JSON.stringify(firstNeume)}).getBoundingClientRect().width`,
  );
  await evaluate('window._editor.selectedWorkspace.value.zoom = 1.25');
  await waitFor(
    async () =>
      Math.abs(
        (await evaluate(
          `document.querySelector(${JSON.stringify(firstNeume)}).getBoundingClientRect().width`,
        )) /
          unzoomed -
          1.25,
      ) < 0.02,
    'Shared page did not inherit editor zoom.',
  );
  await evaluate('window._editor.selectedWorkspace.value.zoom = 1');

  const inline = interactive.score.staff.elements.find(
    (element) =>
      element.elementType === 'RichTextBox' &&
      element.inline &&
      element.content,
  );
  const inlineTop = `#element-${inline.id} .inline-top.ck-content`;
  await click(inlineTop);
  await waitFor(
    () => evaluate('document.activeElement.classList.contains("inline-top")'),
    'Inline editor did not receive focus.',
  );
  await send('Input.insertText', { text: 'PENDING SHARED EDIT ' });
  // Changing tabs must flush the pending editor into the old workspace.
  const temporary = await call('create_document');
  introduced.push(temporary.documentId);
  const flushed = await settled(opened.documentId);
  assert.match(
    flushed.score.staff.elements.find((element) => element.id === inline.id)
      .content,
    /PENDING SHARED EDIT/,
  );
  assert.ok(
    !(await settled(temporary.documentId)).score.staff.elements.some(
      (element) => JSON.stringify(element).includes('PENDING SHARED EDIT'),
    ),
  );
  await call('open_document', { filePath: fixturePath });
  await click(firstNeume);
  const richHistory = await evaluate(
    'JSON.parse(JSON.stringify(window._editor.selectedWorkspace.value.commandService.commandHistory.map(command => ({ values: command.args?.newValues, previous: command.previousValues }))))',
  );
  assert.equal(
    richHistory.length,
    1,
    'Switching tabs must record the pending rich-text edit once.',
  );
  assert.match(richHistory[0].values.content, /PENDING SHARED EDIT/);
  assert.equal(richHistory[0].previous.content, inline.content);

  // Repeated headers share a model but must focus the clicked page's instance.
  await evaluate('document.querySelectorAll(".page")[1].scrollIntoView()');
  await waitFor(
    () =>
      evaluate(
        'document.querySelectorAll(".page")[1].querySelector(".rich-text-box-container .ck-content") != null',
      ),
    'Scrolled header did not mount.',
  );
  await click('.page:nth-child(2) .rich-text-box-container .ck-content');
  await waitFor(
    () =>
      evaluate(
        'document.activeElement.closest(".page") === document.querySelectorAll(".page")[1] && window._editor.selectedWorkspace.value.selectedHeaderFooterElement != null',
      ),
    'Repeated header focus used the wrong page instance.',
  );
  await click(firstNeume);
  // Apply page-dependent print tokens after checking the live editor's header
  // focus path, whose pagination still uses its existing template heights.
  await evaluate(
    "window._editor.score.value.headers.default.elements[0].content = '<p>EXPORT HEADER $:chapter $:title</p>'",
  );
  const control = await call('create_document');
  introduced.push(control.documentId);
  // Undo/redo of a color-only style change must finish measurement even
  // when no height changes, and must stay attached to its workspace.
  await call('open_document', { filePath: fixturePath });
  await click(firstNeume);
  const styles = await call('get_paragraph_styles', {
    documentId: opened.documentId,
  });
  const defaultText = styles.styles.find(
    (style) => style.id === 'default-text',
  );
  await call('edit_paragraph_styles', {
    documentId: opened.documentId,
    expectedRevision: styles.revision,
    changes: [
      {
        action: 'replace',
        style: {
          ...defaultText,
          overrides: { ...defaultText.overrides, color: '#123456' },
        },
      },
    ],
  });
  const styled = await settled(opened.documentId);
  const switchToControl = () =>
    evaluate(
      `window._editor.selectedWorkspace.value = window._editor.workspaces.value.find(w => w.id === ${JSON.stringify(control.documentId)})`,
    );
  const measurementFinished = () =>
    waitFor(
      () =>
        evaluate(
          'document.querySelector(".workspace-text-box-measurement") == null && document.querySelector(".richTextBoxCalculation, .textBoxCalculation") == null',
        ),
      'Style history left measurement editors mounted.',
    );
  await undo();
  await switchToControl();
  const undone = await settled(opened.documentId);
  assert.deepEqual(
    undone.score.paragraphStyles,
    interactive.score.paragraphStyles,
  );
  await measurementFinished();
  await call('open_document', { filePath: fixturePath });
  await click(firstNeume);
  await click('.main-toolbar button[aria-label^="Redo"]');
  await switchToControl();
  const redone = await settled(opened.documentId);
  assert.deepEqual(redone.score.paragraphStyles, styled.score.paragraphStyles);
  await measurementFinished();
  const before = await settled(opened.documentId);
  const beforeControl = await settled(control.documentId);
  const beforeState = await evaluate(
    `window._editor.workspaces.value.map(w => ({ id: w.id, history: w.commandService.commandHistory.length, index: w.commandService.index, dirty: w.hasUnsavedChanges, temp: w.tempFileName }))`,
  );
  const exported = call('export_pdf', {
    documentId: before.documentId,
    expectedRevision: before.revision,
    filePath: outputPath,
  });
  await waitFor(
    async () => (await hiddenTargets()).length === 1,
    'Export did not use a hidden renderer.',
  );
  // The target remains in the background while the user switches tabs and edits.
  assert.equal(
    await evaluate('window._editor.selectedWorkspace.value.id'),
    control.documentId,
  );
  await evaluate(
    `(() => { const e = window._editor; e.selectedWorkspace.value = e.workspaces.value.find(w => w.id === ${JSON.stringify(seed.documentId)}); e.workspaces.value.find(w => w.id === ${JSON.stringify(opened.documentId)}).score.documentProperties.title = 'Edited while exporting'; })()`,
  );
  const result = await exported;
  assert.equal(result.exportedRevision, before.revision);
  assert.ok(result.revision > before.revision);
  const after = await settled(opened.documentId);
  assert.equal(after.score.documentProperties.title, 'Edited while exporting');
  after.score.documentProperties.title = before.score.documentProperties.title;
  assert.deepEqual(after.score, before.score);
  assert.deepEqual(
    (await settled(control.documentId)).score,
    beforeControl.score,
  );
  assert.equal(
    await evaluate('window._editor.selectedWorkspace.value.id'),
    seed.documentId,
  );
  const afterState = await evaluate(
    `window._editor.workspaces.value.map(w => ({ id: w.id, history: w.commandService.commandHistory.length, index: w.commandService.index, dirty: w.hasUnsavedChanges, temp: w.tempFileName }))`,
  );
  // The user's unsaved metadata change may set its dirty flag, but export adds no undo entries or workspaces.
  for (const item of afterState) {
    if (item.id === opened.documentId) {
      item.dirty = beforeState.find((w) => w.id === item.id).dirty;
    }
  }
  assert.deepEqual(afterState, beforeState);
  assert.equal((await hiddenTargets()).length, 0);
  assert.match(
    (await fs.readFile(outputPath)).toString('ascii', 0, 5),
    /%PDF-/,
  );

  // A broken image rejects rendering; it never writes a partial output.
  const brokenPath = path.join(directory, `hidden-broken-${suffix}.byzx`);
  score.pageSetup.showHeader = false;
  score.pageSetup.showFooter = false;
  score.staff.elements = [
    {
      elementType: 'ImageBox',
      data: 'data:image/png;base64,broken',
      imageWidth: 50,
      imageHeight: 50,
    },
    { elementType: 'Empty' },
  ];
  await fs.writeFile(brokenPath, JSON.stringify(score));
  const broken = await call('open_document', { filePath: brokenPath });
  introduced.push(broken.documentId);
  const brokenBefore = await settled(broken.documentId);
  const failedPath = path.join(directory, `hidden-failure-${suffix}.pdf`);
  const reply = await client.callTool({
    name: 'export_pdf',
    arguments: {
      documentId: broken.documentId,
      expectedRevision: brokenBefore.revision,
      filePath: failedPath,
    },
  });
  assert.equal(reply.structuredContent.error.code, 'EXPORT_RENDER_FAILED');
  assert.deepEqual(
    (await settled(broken.documentId)).score,
    brokenBefore.score,
  );
  assert.equal((await hiddenTargets()).length, 0);
  await assert.rejects(fs.access(failedPath), { code: 'ENOENT' });
  // Abort the actual HTTP request while its disposable renderer is loading.
  const cancelledPath = path.join(directory, `hidden-cancelled-${suffix}.pdf`);
  const current = await settled(opened.documentId);
  const controller = new AbortController();
  const cancelled = fetch(
    process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      signal: controller.signal,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'cancel-export',
        method: 'tools/call',
        params: {
          name: 'export_pdf',
          arguments: {
            documentId: current.documentId,
            expectedRevision: current.revision,
            filePath: cancelledPath,
          },
        },
      }),
    },
  );
  const rejected = assert.rejects(cancelled, { name: 'AbortError' });
  await waitFor(
    async () => (await hiddenTargets()).length === 1,
    'Cancelled export did not start.',
  );
  controller.abort();
  await rejected;
  await waitFor(
    async () => (await hiddenTargets()).length === 0,
    'Cancelled renderer was not disposed.',
  );
  assert.deepEqual((await settled(opened.documentId)).score, current.score);
  await assert.rejects(fs.access(cancelledPath), { code: 'ENOENT' });
  console.log(`Hidden export smoke passed. Inspect PDF: ${outputPath}`);
} catch (error) {
  primaryError = error;
  throw error;
} finally {
  const cleanupErrors = [];
  for (const documentId of introduced.reverse()) {
    try {
      const document = await settled(documentId);
      await call('close_document', {
        documentId,
        expectedRevision: document.revision,
        discardUnsavedChanges: true,
      });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }

  socket.close();
  await client.close();
  if (cleanupErrors.length > 0 && primaryError == null) {
    throw new AggregateError(cleanupErrors, 'Smoke cleanup failed');
  }
}
