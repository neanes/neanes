// Run outside the agent command sandbox; this starts a disposable Electron app.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import electron from 'electron';

const directory = await mkdtemp(
  path.join(tmpdir(), 'neanes-rich-text-update-'),
);
const token = randomBytes(32).toString('hex');
await writeFile(
  path.join(directory, 'agent-access.json'),
  JSON.stringify({ enabled: true, token }),
  { mode: 0o600 },
);
const env = {
  ...process.env,
  IS_TEST: '1',
  NEANES_DEV_USER_DATA_DIR: directory,
  NEANES_MCP_PORT: '0',
  NEANES_MCP_TOKEN: token,
};
delete env.ELECTRON_RUN_AS_NODE;
const editor = spawn(
  electron,
  [process.cwd(), '--remote-debugging-port=0', '--no-update'],
  { env, stdio: ['ignore', 'pipe', 'pipe'] },
);
let log = '';
editor.stdout.on('data', (data) => {
  log += data;
});
editor.stderr.on('data', (data) => {
  log += data;
});
let socket, client;
let nextId = 0;
const requests = new Map();
async function eventually(operation) {
  let error;
  for (let i = 0; i < 160; i++) {
    try {
      return await operation();
    } catch (e) {
      error = e;
      await delay(100);
    }
  }
  throw error;
}
function send(method, params) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    requests.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function call(name, args = {}) {
  const reply = await client.callTool({ name, arguments: args });
  assert.ok(reply.structuredContent?.success, JSON.stringify(reply));
  return reply.structuredContent.result;
}
const paragraph = (text) =>
  `<p class="neanes-paragraph-style-default-text">${text}</p>`;
const workspace = 'window._editor.selectedWorkspace.value';
const historyLength = () =>
  evaluate(`${workspace}.commandService.commandHistory.length`);
async function click(selector, clickCount = 1) {
  const point = await evaluate(
    `(() => { const node = document.querySelector(${JSON.stringify(selector)}); node.scrollIntoView({block:'center'}); const r = node.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`,
  );
  await clickAt(point, clickCount);
}
async function clickAt(point, clickCount = 1) {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', {
      type,
      ...point,
      button: 'left',
      clickCount,
    });
  }
}
try {
  const debugPort = await eventually(() => {
    const match = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/.exec(log);
    assert.ok(match, log);
    return match[1];
  });
  const target = await eventually(async () => {
    const targets = await (
      await fetch(`http://127.0.0.1:${debugPort}/json/list`)
    ).json();
    const page = targets.find(
      (t) =>
        t.type === 'page' &&
        !t.url.includes('export.html') &&
        !t.url.startsWith('devtools:'),
    );
    assert.ok(page?.webSocketDebuggerUrl);
    return page;
  });
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) =>
    socket.addEventListener('open', resolve, { once: true }),
  );
  socket.addEventListener('message', (event) => {
    const reply = JSON.parse(event.data);
    const pending = requests.get(reply.id);
    if (pending) {
      requests.delete(reply.id);
      if (reply.error) {
        pending.reject(new Error(JSON.stringify(reply.error)));
      } else {
        pending.resolve(reply.result);
      }
    }
  });
  await eventually(async () => {
    assert.equal(
      await evaluate(
        `Boolean(window._editor?.workspaces.value.length && !document.querySelector('.loading-overlay'))`,
      ),
      true,
    );
    assert.equal(
      (await evaluate("window.ipcRenderer.invoke('AgentAccessGet')")).status,
      'ready',
    );
  });
  const url = /Neanes MCP listening at (http:\/\/127\.0\.0\.1:\d+\/mcp)/.exec(
    log,
  )[1];
  client = new Client({ name: 'rich-text-update-smoke', version: '1' });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(url), {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    }),
  );

  for (const [name, layout, fields] of [
    ['ordinary', {}, ['content']],
    ['scrollable', { scrollable: true }, ['content']],
    ['inline', { inline: true }, ['content', 'contentBottom']],
    [
      'multipanel',
      { multipanel: true },
      ['contentLeft', 'contentCenter', 'contentRight'],
    ],
  ]) {
    const doc = await call('create_document', {
      title: `Rich-text update: ${name}`,
    });
    const args = { documentId: doc.documentId };
    const inserted = await call('edit_elements', {
      ...args,
      expectedRevision: doc.revision,
      actions: [
        {
          action: 'insert',
          elements: [
            {
              elementType: 'RichTextBox',
              properties: {
                ...layout,
                ...Object.fromEntries(
                  fields.map((field) => [
                    field,
                    paragraph(`Original ${field}`),
                  ]),
                ),
              },
            },
          ],
        },
      ],
    });
    const ref = inserted.created[0].elementRef;
    const content = (property) =>
      call('get_element_content', { ...args, elementRef: ref, property });
    for (const field of fields) {
      const before = await content(field);
      const history = await historyLength();
      const html = paragraph(`Updated ${field}`);
      const result = await call('edit_elements', {
        ...args,
        expectedRevision: before.revision,
        actions: [
          {
            action: 'update',
            elementRef: ref,
            elementType: 'RichTextBox',
            properties: { [field]: html },
          },
        ],
      });
      const after = await content(field);
      assert.equal(result.applied, true);
      assert.ok(
        result.revision > before.revision,
        `${name}/${field}: revision must advance`,
      );
      assert.equal(
        after.content,
        html,
        `${name}/${field}: content must survive teardown`,
      );
      assert.equal(
        await historyLength(),
        history + 1,
        'No stale-content undo entry',
      );
    }
    for (const [property, value] of [
      ['marginTop', 31],
      ['marginBottom', 27],
    ]) {
      const field = fields[0];
      const before = await content(field);
      const html = paragraph(`Mixed update ${property}`);
      await call('edit_elements', {
        ...args,
        expectedRevision: before.revision,
        actions: [
          {
            action: 'update',
            elementRef: ref,
            elementType: 'RichTextBox',
            properties: { [field]: html, [property]: value },
          },
        ],
      });
      assert.equal((await content(field)).content, html);
      const read = await call('get_element', {
        ...args,
        elementRef: ref,
        properties: [property],
      });
      assert.equal(read.elements[0].properties[property], value);
    }
    // History mutations plus keyed remount exercise the same lifecycle as app Undo/Redo.
    const field = fields[0];
    const latest = (await content(field)).content;
    await evaluate(
      `(() => {const w=${workspace};w.commandService.undo();w.score.staff.elements.find(e=>e.elementType==='RichTextBox').keyHelper++;})()`,
    );
    assert.equal(
      (await content(field)).content,
      paragraph('Mixed update marginTop'),
    );
    await evaluate(
      `(() => {const w=${workspace};w.commandService.redo();w.score.staff.elements.find(e=>e.elementType==='RichTextBox').keyHelper++;})()`,
    );
    assert.equal((await content(field)).content, latest);

    if (name === 'ordinary') {
      const id = await evaluate(
        `${workspace}.score.staff.elements.find(e=>e.elementType==='RichTextBox').id`,
      );
      await click(`#element-${id} .ck-content`);
      await send('Input.insertText', { text: 'USER_PENDING' });
      const pendingModel = await evaluate(
        `${workspace}.score.staff.elements.find(e=>e.elementType==='RichTextBox').content`,
      );
      assert.ok(
        !pendingModel.includes('USER_PENDING'),
        'User edit must still be pending before remount',
      );
      await evaluate(
        `${workspace}.score.staff.elements.find(e=>e.elementType==='RichTextBox').keyHelper++`,
      );
      assert.ok(
        (await content(field)).content.includes('USER_PENDING'),
        'Teardown must preserve genuine pending typing',
      );
      await click(`#element-${id} .ck-content`);
      await send('Input.insertText', { text: 'USER_BLUR' });
      await evaluate('document.activeElement.blur()');
      assert.ok(
        (await content(field)).content.includes('USER_BLUR'),
        'Blur must preserve genuine typing',
      );
    }
    const expected = await content(field);
    const filePath = path.join(directory, `${name}.byzx`);
    await call('save_document', {
      ...args,
      expectedRevision: expected.revision,
      filePath,
    });
    const saved = JSON.parse(await readFile(filePath, 'utf8'));
    assert.equal(
      saved.staff.elements.find((e) => e.elementType === 'RichTextBox')[field],
      expected.content,
    );
    const summary = await call('get_document_properties', args);
    await call('close_document', {
      ...args,
      expectedRevision: summary.revision,
    });
  }
  const related = await call('create_document', {
    title: 'Related rich-text surfaces',
  });
  const relatedArgs = { documentId: related.documentId };
  let revision = related.revision;
  for (const kind of ['headers', 'footers']) {
    const collection = { kind, variant: 'default' };
    const existing = await call('get_elements', { ...relatedArgs, collection });
    const enabled = await call('update_header_footer_settings', {
      ...relatedArgs,
      expectedRevision: existing.revision,
      changes: { [kind === 'headers' ? 'showHeader' : 'showFooter']: true },
    });
    const replaced = await call('edit_elements', {
      ...relatedArgs,
      expectedRevision: enabled.revision,
      actions: [
        {
          action: 'replace',
          elementRef: existing.elements[0].elementRef,
          element: {
            elementType: 'RichTextBox',
            properties: { content: paragraph(`Original ${kind}`) },
          },
        },
      ],
    });
    const ref = replaced.created[0].elementRef;
    const html = paragraph(`Updated ${kind}`);
    const updated = await call('edit_elements', {
      ...relatedArgs,
      expectedRevision: replaced.revision,
      actions: [
        {
          action: 'update',
          elementRef: ref,
          elementType: 'RichTextBox',
          properties: { content: html },
        },
      ],
    });
    assert.ok(updated.revision > replaced.revision);
    const read = await call('get_element_content', {
      ...relatedArgs,
      elementRef: ref,
      property: 'content',
    });
    assert.equal(read.content, html);
    revision = read.revision;
  }
  const inserted = await call('edit_elements', {
    ...relatedArgs,
    expectedRevision: revision,
    actions: [
      {
        action: 'insert',
        elements: [{ clientId: 'note', elementType: 'Note' }],
      },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@note',
          collection: 'annotations',
        },
        elements: [
          {
            clientId: 'annotation',
            elementType: 'Annotation',
            properties: { text: paragraph('Original annotation') },
          },
        ],
      },
    ],
  });
  const noteRef = inserted.created.find(
    (e) => e.clientId === 'note',
  ).elementRef;
  const annotationRef = inserted.created.find(
    (e) => e.clientId === 'annotation',
  ).elementRef;
  const annotationHtml = paragraph('Updated annotation');
  const annotated = await call('edit_elements', {
    ...relatedArgs,
    expectedRevision: inserted.revision,
    actions: [
      {
        action: 'update',
        elementRef: annotationRef,
        elementType: 'Annotation',
        properties: { text: annotationHtml },
      },
      // Updating the note remounts its child annotation in the same transaction.
      {
        action: 'update',
        elementRef: noteRef,
        elementType: 'Note',
        properties: { lyrics: 'word' },
      },
    ],
  });
  assert.ok(annotated.revision > inserted.revision);
  assert.equal(
    (
      await call('get_element_content', {
        ...relatedArgs,
        elementRef: annotationRef,
        property: 'text',
      })
    ).content,
    annotationHtml,
  );
  // Changing contentLanguage remounts the inner editor while the annotation
  // component survives. Keep typing pending to exercise that handoff directly.
  const annotationSelector = '.annotation-container .ck-content';
  await click(annotationSelector, 2);
  await evaluate(
    `(() => { const editor = document.querySelector(${JSON.stringify(annotationSelector)}).ckeditorInstance; editor.model.change(writer => writer.setSelection(editor.model.document.getRoot(), 'end')); })()`,
  );
  await send('Input.insertText', { text: 'ANNOTATION_PENDING_LANGUAGE' });
  const annotationModel = `${workspace}.score.staff.elements.find(e=>e.elementType==='Note').annotations[0]`;
  assert.ok(
    !(await evaluate(`${annotationModel}.text`)).includes(
      'ANNOTATION_PENDING_LANGUAGE',
    ),
  );
  await evaluate(
    `void (window._annotationBeforeLanguage = document.querySelector(${JSON.stringify(annotationSelector)}))`,
  );
  await evaluate(
    `Object.assign(${annotationModel}, {languageCode:'el', textDirection:'ltr'}); void 0`,
  );
  await eventually(async () => {
    assert.ok(
      await evaluate(
        `document.querySelector(${JSON.stringify(annotationSelector)})?.textContent.includes('ANNOTATION_PENDING_LANGUAGE')`,
      ),
      'Language remount must retain pending annotation typing',
    );
  });
  const annotationAfterLanguage = await call('get_element_content', {
    ...relatedArgs,
    elementRef: annotationRef,
    property: 'text',
  });
  assert.ok(
    annotationAfterLanguage.content.includes('ANNOTATION_PENDING_LANGUAGE'),
  );
  assert.equal(await evaluate(`${annotationModel}.languageCode`), 'el');
  assert.equal(
    await evaluate('window._annotationBeforeLanguage.isConnected'),
    false,
    'The language change must actually remount the editor',
  );

  await click(annotationSelector, 2);
  await evaluate(
    `(() => { const editor = document.querySelector(${JSON.stringify(annotationSelector)}).ckeditorInstance; editor.model.change(writer => writer.setSelection(editor.model.document.getRoot(), 'end')); })()`,
  );
  await send('Input.insertText', { text: 'ANNOTATION_PENDING_DROPDOWN' });
  assert.ok(
    !(await evaluate(`${annotationModel}.text`)).includes(
      'ANNOTATION_PENDING_DROPDOWN',
    ),
  );
  await evaluate(
    `(() => { const editor = document.querySelector(${JSON.stringify(annotationSelector)}).ckeditorInstance; editor.model.change(writer => writer.setSelection(editor.model.document.getRoot(), 'in')); })()`,
  );
  await click('#properties-annotation-language');
  const optionPoint = await eventually(async () => {
    const point = await evaluate(`(() => {
      const node = Array.from(document.querySelectorAll('[role="option"]')).find(node=>node.textContent.startsWith('Rom'));
      if (node == null) return null;
      node.scrollIntoView({block:'center'});
      const r = node.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? {x:r.x+r.width/2,y:r.y+r.height/2} : null;
    })()`);
    assert.ok(
      point,
      'Romanian must be offered in the annotation language dropdown',
    );
    return point;
  });
  await clickAt(optionPoint);
  await evaluate(
    'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',
  );
  await evaluate('document.activeElement.blur()');
  await eventually(async () => {
    assert.equal(await evaluate(`${annotationModel}.languageCode`), 'ro');
    assert.ok(
      await evaluate(
        `document.querySelector(${JSON.stringify(annotationSelector)})?.textContent.includes('ANNOTATION_PENDING_DROPDOWN')`,
      ),
    );
  });
  const finalAnnotation = await call('get_element_content', {
    ...relatedArgs,
    elementRef: annotationRef,
    property: 'text',
  });
  assert.ok(finalAnnotation.content.includes('ANNOTATION_PENDING_LANGUAGE'));
  assert.ok(finalAnnotation.content.includes('ANNOTATION_PENDING_DROPDOWN'));

  await call('close_document', {
    ...relatedArgs,
    expectedRevision: finalAnnotation.revision,
    discardUnsavedChanges: true,
  });
  console.log(
    'Rich-text update smoke passed: content and mixed updates, all panels, Undo/Redo, pending typing, blur, saved HTML, headers/footers, and annotations.',
  );
} catch (error) {
  console.error(log);
  throw error;
} finally {
  await client?.close();
  socket?.close();
  // This profile is disposable; never prompt to save failed-test drafts at shutdown.
  const exited = new Promise((resolve) => editor.once('exit', resolve));
  editor.kill('SIGKILL');
  await exited;
  await rm(directory, { recursive: true, force: true });
}
