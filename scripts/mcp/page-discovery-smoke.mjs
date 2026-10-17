import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';

const directory = process.argv[2];
const token = process.env.NEANES_MCP_TOKEN;
assert.ok(
  directory && path.isAbsolute(directory) && token,
  'Use an allowed absolute directory and NEANES_MCP_TOKEN with a disposable app.',
);
const client = new Client({
  name: 'neanes-page-discovery-smoke',
  version: '1.0.0',
});
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp'),
    { requestInit: { headers: { Authorization: `Bearer ${token}` } } },
  ),
);
const tools = (await client.listTools()).tools;
const validator = new AjvJsonSchemaValidator();
const inputs = new Map(
  tools.map((tool) => [tool.name, validator.getValidator(tool.inputSchema)]),
);
const outputs = new Map(
  tools.map((tool) => [tool.name, validator.getValidator(tool.outputSchema)]),
);
async function call(name, args = {}, error) {
  if (!error) {
    assert.equal(inputs.get(name)(args).valid, true);
  }
  const reply = await client.callTool({ name, arguments: args });
  const outcome = reply.structuredContent;
  assert.deepEqual(outcome, JSON.parse(reply.content[0].text));
  assert.equal(outputs.get(name)(outcome).valid, true, JSON.stringify(outcome));
  assert.equal(outcome.success, !error, JSON.stringify(outcome));
  if (error) {
    assert.equal(outcome.error.code, error);
  } else {
    return outcome.result;
  }
}
let socket;
let nextId = 0;
async function evaluate(expression) {
  if (!socket) {
    const targets = await (
      await fetch(`${process.env.NEANES_DEBUG_URL}/json/list`)
    ).json();
    const target = targets.find(
      (entry) =>
        entry.type === 'page' &&
        !entry.url.includes('export.html') &&
        !entry.url.startsWith('devtools:'),
    );
    assert.ok(target);
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve) =>
      socket.addEventListener('open', resolve, { once: true }),
    );
  }
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const listener = (event) => {
      const reply = JSON.parse(event.data);
      if (reply.id !== id) {
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
        id,
        method: 'Runtime.evaluate',
        params: { expression, returnByValue: true, awaitPromise: true },
      }),
    );
  });
}
const introduced = new Map();
const stamp = Date.now();
const fixture = path.join(directory, `page-query-${stamp}.byzx`);
let sessionId;
try {
  const seed = await call('create_document', {
    title: 'A long document title for page-specific header token measurement',
  });
  const seedArgs = { documentId: seed.documentId };
  introduced.set(seed.documentId, seedArgs);
  await call('edit_elements', {
    ...seedArgs,
    expectedRevision: seed.revision,
    actions: [
      { action: 'remove_range', start: 0, end: seed.elementCount - 1 },
      {
        action: 'insert',
        elements: [
          {
            elementType: 'TextBox',
            clientId: 'chapter',
            properties: {
              content: 'Chapter one',
              runningMarkerRole: 'chapter',
            },
          },
          {
            elementType: 'Note',
            clientId: 'note',
            properties: { pageBreak: true },
          },
          {
            elementType: 'RichTextBox',
            properties: {
              content: '<p>Page two rich text.</p>',
              pageBreak: true,
            },
          },
          {
            elementType: 'TextBox',
            properties: { content: 'Page three' },
          },
        ],
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
            elementType: 'Annotation',
            properties: {
              text: '<p class="neanes-paragraph-style-annotation">Annotation</p>',
              x: 20,
              y: -30,
            },
          },
        ],
      },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@note',
          collection: 'alternateLines',
        },
        elements: [
          {
            elementType: 'AlternateLine',
            clientId: 'alternate',
            properties: { x: 20, y: -60 },
          },
        ],
      },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@alternate',
          collection: 'elements',
        },
        elements: [{ elementType: 'Note' }],
      },
    ],
  });
  const initial = await call('get_document', seedArgs);
  const score = initial.score;
  Object.assign(score.pageSetup, {
    showHeader: true,
    showFooter: true,
    firstPageNumber: 10,
    headerDifferentFirstPage: false,
    headerDifferentOddEven: false,
    headerFooterDifferentChapterOpening: false,
  });
  Object.assign(score.headers.default.elements[0], {
    multipanel: false,
    content: '$:title - $:pageNumber / $:numberOfPages - $:chapter',
  });
  Object.assign(score.footers.default.elements[0], {
    multipanel: false,
    content: 'Footer $:pageNumber',
  });
  await fs.writeFile(fixture, JSON.stringify(score));
  sessionId = (await call('create_session')).sessionId;
  for (const scope of [{}, { sessionId }]) {
    const opened = await call('open_document', { ...scope, filePath: fixture });
    const args = { ...scope, documentId: opened.documentId };
    introduced.set(opened.documentId, args);
    const before = await call('get_document', args);
    const controlState = process.env.NEANES_DEBUG_URL
      ? await evaluate(
          'JSON.stringify(window._editor.workspaces.value.map(w=>({id:w.id,dirty:w.hasUnsavedChanges,history:w.commandService.commandHistory.length,selection:w.selectedElement?.id})))',
        )
      : null;
    const pages = await call('get_pages', { ...args, limit: 1 });
    assert.equal(pages.pageCount, 3);
    assert.equal(pages.pages[0].pageNumber, 1);
    assert.equal(pages.pages[0].displayedPageNumber, 10);
    const stable = {
      ...args,
      expectedRevision: pages.revision,
      expectedLayoutId: pages.layoutId,
    };
    const remaining = await call('get_pages', {
      ...stable,
      offset: pages.nextOffset,
    });
    assert.deepEqual(
      remaining.pages.map((page) => [
        page.pageNumber,
        page.displayedPageNumber,
      ]),
      [
        [2, 11],
        [3, 12],
      ],
    );
    let headerRef;
    for (let pageNumber = 1; pageNumber <= 3; pageNumber++) {
      const found = await call('get_page_elements', { ...stable, pageNumber });
      const header = found.occurrences.find(
        (element) => element.region === 'header',
      );
      assert.ok(header);
      if (headerRef) {
        assert.equal(header.elementRef, headerRef);
      }
      headerRef = header.elementRef;
      const detail = await call('get_element', {
        ...args,
        elementRef: header.elementRef,
        properties: [],
      });
      assert.deepEqual(detail.collection, {
        kind: 'headers',
        variant: 'default',
      });
      assert.ok(
        found.occurrences.some((element) => element.region === 'footer'),
      );
      assert.ok(
        found.occurrences.every(
          (element) => !Object.hasOwn(element, 'properties'),
        ),
      );
    }
    const first = await call('get_page_elements', {
      ...stable,
      pageNumber: 1,
      regions: ['staff'],
      elementTypes: ['Note'],
      where: { field: 'lyrics', op: 'isNotNull' },
      limit: 1,
    });
    assert.equal(first.occurrences.length, 1);
    assert.equal(first.nextOffset, 1);
    const second = await call('get_page_elements', {
      ...stable,
      pageNumber: 1,
      regions: ['staff'],
      elementTypes: ['Note'],
      limit: 1,
      offset: first.nextOffset,
    });
    assert.equal(second.occurrences[0].collection.kind, 'children');
    await call(
      'get_page_elements',
      { ...stable, pageNumber: 4 },
      'INVALID_PAGE_NUMBER',
    );
    await call('get_pages', { ...stable, offset: 4 }, 'INVALID_ELEMENT_RANGE');
    await call(
      'get_pages',
      { ...args, expectedLayoutId: '0'.repeat(64) },
      'LAYOUT_CONFLICT',
    );
    const after = await call('get_document', args);
    assert.deepEqual(after, before);
    if (controlState) {
      assert.equal(
        await evaluate(
          'JSON.stringify(window._editor.workspaces.value.map(w=>({id:w.id,dirty:w.hasUnsavedChanges,history:w.commandService.commandHistory.length,selection:w.selectedElement?.id})))',
        ),
        controlState,
      );
      assert.equal(
        await evaluate(
          'document.querySelectorAll(".workspace-page-measurement").length',
        ),
        0,
      );
    }
    await call('export_pdf', {
      ...args,
      expectedRevision: after.revision,
      filePath: path.join(
        directory,
        `page-query-${stamp}-${scope.sessionId ? 'isolated' : 'interactive'}.pdf`,
      ),
    });
    if (process.env.NEANES_DEBUG_URL && !scope.sessionId) {
      const pendingRead = call('get_pages', stable, 'REVISION_CONFLICT');
      await evaluate(
        `window._editor.workspaces.value.find(w=>w.id===${JSON.stringify(args.documentId)}).score.documentProperties.title += ' changed during measurement'`,
      );
      await pendingRead;
    } else {
      await call('replace_document_properties', {
        ...args,
        expectedRevision: after.revision,
        properties: { title: 'Changed', author: '' },
      });
      await call('get_pages', stable, 'REVISION_CONFLICT');
    }
    const current = await call('get_document', { ...args, sections: [] });
    const broken = await call('edit_elements', {
      ...args,
      expectedRevision: current.revision,
      actions: [
        {
          action: 'insert',
          elements: [
            {
              elementType: 'ImageBox',
              clientId: 'broken',
              properties: {
                data: 'data:image/png;base64,broken',
                imageWidth: 20,
                imageHeight: 20,
              },
            },
          ],
        },
      ],
    });
    await call('get_pages', args, 'LAYOUT_SETTLEMENT_FAILED');
    const recovered = await call('edit_elements', {
      ...args,
      expectedRevision: broken.revision,
      actions: [{ action: 'remove', elementRef: broken.created[0].elementRef }],
    });
    assert.equal(
      (
        await call('get_pages', {
          ...args,
          expectedRevision: recovered.revision,
        })
      ).pageCount,
      3,
    );
    if (controlState) {
      assert.equal(
        await evaluate(
          'document.querySelectorAll(".workspace-page-measurement").length',
        ),
        0,
      );
    }
    console.log(
      `Page discovery passed: ${scope.sessionId ? 'isolated' : 'interactive'}`,
    );
  }
} finally {
  for (const args of [...introduced.values()].reverse()) {
    const current = await call('get_document', { ...args, sections: [] });
    await call('close_document', {
      ...args,
      expectedRevision: current.revision,
      discardUnsavedChanges: true,
    });
  }
  if (sessionId) {
    await call('close_session', { sessionId, discardUnsavedChanges: true });
  }
  socket?.close();
  await client.close();
}
