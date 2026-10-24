import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';
import { connectCdp, editorTarget } from './smokeCdp.mjs';
import {
  closeDocument,
  connectBridgeClient,
  createToolCaller,
} from './smokeClient.mjs';

const directory = process.argv[2];
assert.ok(
  directory && path.isAbsolute(directory),
  'Use an allowed absolute directory with a disposable app.',
);
const client = await connectBridgeClient('neanes-page-discovery-smoke');
const tools = (await client.listTools()).tools;
const call = createToolCaller(client, tools);
let socket;
async function evaluate(expression) {
  socket ??= await connectCdp(
    (await editorTarget(process.env.NEANES_DEBUG_URL)).webSocketDebuggerUrl,
  );
  return socket.evaluate(expression);
}
const introduced = new Map();
const stamp = Date.now();
const fixture = path.join(directory, `page-query-${stamp}.byzx`);
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
  const initial = await readScoreSnapshot(call, seedArgs);
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
  for (const scope of [
    { documentScope: 'editor' },
    { documentScope: 'private' },
  ]) {
    const opened = await call('open_document', { ...scope, filePath: fixture });
    const args = { ...scope, documentId: opened.documentId };
    introduced.set(opened.documentId, args);
    const before = await readScoreSnapshot(call, args);
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
    const after = await readScoreSnapshot(call, args);
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
        `page-query-${stamp}-${scope.documentScope === 'private' ? 'private' : 'editor'}.pdf`,
      ),
    });
    if (process.env.NEANES_DEBUG_URL && scope.documentScope === 'editor') {
      const pendingRead = call('get_pages', stable, 'REVISION_CONFLICT');
      await evaluate(
        `(() => {const workspace = window._editor.workspaces.value.find(w=>w.id===${JSON.stringify(args.documentId)}); workspace.updateLyricsLocked(!workspace.score.staff.lyrics.locked);})()`,
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
    const current = await call('get_document_properties', args);
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
      `Page discovery passed: ${scope.documentScope === 'private' ? 'private' : 'editor'}`,
    );
  }
} finally {
  for (const args of [...introduced.values()].reverse()) {
    await closeDocument(call, args);
  }
  socket?.close();
  await client.close();
}
