import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';
import { connectCdp, editorTarget } from './smokeCdp.mjs';
import {
  closeDocument,
  connectStdioClient,
  createToolCaller,
} from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const directory = process.argv[2];
assert.ok(
  directory && path.isAbsolute(directory),
  'Use an allowed absolute directory with a disposable app.',
);
const client = await connectStdioClient('neanes-page-discovery-smoke');
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
      const font = await fs.readFile(
        new URL(
          '../../../src/assets/fonts/SourceSerif4-Regular.otf',
          import.meta.url,
        ),
      );
      let fontResponse;
      const server = createServer((_request, response) => {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Content-Type', 'font/otf');
        fontResponse = response;
      });
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      try {
        await evaluate(`(() => {
          const face = new FontFace('PageReadPendingFont', 'url(http://127.0.0.1:${server.address().port}/pending.otf)');
          window.__pageReadFont = face;
          document.fonts.add(face);
          void face.load().catch(() => {});
        })()`);
        await eventually(() => assert.ok(fontResponse));
        const pendingRead = call('get_pages', stable, 'REVISION_CONFLICT').then(
          () => null,
          (error) => error,
        );
        const failures = [];
        // The detached measuring component mounts only after the initial
        // revision check. Its font dependency keeps this read in progress.
        try {
          await eventually(async () => {
            assert.equal(await evaluate('document.fonts.status'), 'loading');
            assert.equal(
              await evaluate(
                'document.querySelectorAll(".workspace-page-measurement").length',
              ),
              1,
            );
          });
          await evaluate(
            `(() => {const workspace = window._editor.workspaces.value.find(w=>w.id===${JSON.stringify(args.documentId)}); workspace.updateLyricsLocked(!workspace.score.staff.lyrics.locked);})()`,
          );
        } catch (error) {
          failures.push(error);
        } finally {
          fontResponse.end(font);
        }
        const failure = await pendingRead;
        if (failure) {
          failures.push(failure);
        }
        if (failures.length) {
          throw new AggregateError(
            failures,
            'Concurrent page discovery failed.',
          );
        }
      } finally {
        if (fontResponse && !fontResponse.writableEnded) {
          fontResponse.end(font);
        }
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
        await evaluate(
          'document.fonts.delete(window.__pageReadFont); delete window.__pageReadFont',
        );
      }
    } else {
      await call('replace_document_properties', {
        ...args,
        expectedRevision: after.revision,
        properties: { title: 'Changed', author: '' },
      });
      await call('get_pages', stable, 'REVISION_CONFLICT');
    }
    // Malformed imported images must still exercise layout failure; the edit
    // API now rejects malformed image files before committing a transaction.
    const brokenScore = (await readScoreSnapshot(call, args)).score;
    brokenScore.staff.elements.unshift({
      elementType: 'ImageBox',
      data: 'data:image/png;base64,broken',
      imageWidth: 20,
      imageHeight: 20,
    });
    const brokenPath = path.join(
      directory,
      `broken-image-${stamp}-${scope.documentScope ?? 'private'}.byzx`,
    );
    await fs.writeFile(brokenPath, JSON.stringify(brokenScore));
    const broken = await call('open_document', {
      ...scope,
      filePath: brokenPath,
    });
    const brokenArgs = { ...scope, documentId: broken.documentId };
    introduced.set(broken.documentId, brokenArgs);
    await call('get_pages', brokenArgs, 'LAYOUT_SETTLEMENT_FAILED');
    const recovered = await call('edit_elements', {
      ...brokenArgs,
      expectedRevision: broken.revision,
      actions: [
        {
          action: 'remove',
          elementRef: (await call('get_elements', brokenArgs)).elements[0]
            .elementRef,
        },
      ],
    });
    assert.equal(
      (
        await call('get_pages', {
          ...brokenArgs,
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
