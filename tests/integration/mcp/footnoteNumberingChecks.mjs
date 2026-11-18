import assert from 'node:assert/strict';
import { copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { eventually } from './smokePolling.mjs';

export async function checkFootnoteNumbering({
  call,
  evaluate,
  click,
  dispatch,
  socket,
  directory,
}) {
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Automatic footnote numbering',
  });
  const args = { documentScope: 'editor', documentId: doc.documentId };
  const revision = async () =>
    (await call('get_document_properties', args)).revision;
  const edit = async (actions) =>
    call('edit_elements', {
      ...args,
      expectedRevision: await revision(),
      actions,
    });
  const settings = async (changes) =>
    call('update_page_setup', {
      ...args,
      expectedRevision: await revision(),
      changes,
    });
  const initial = await call('get_elements', args);
  const elements = [];
  for (let index = 0; index < 13; index++) {
    if (index === 5) {
      elements.push({
        elementType: 'TextBox',
        properties: { content: 'Section', runningMarkerRole: 'section' },
      });
    }
    elements.push(
      index === 2
        ? {
            elementType: 'RichTextBox',
            clientId: `n${index}`,
            properties: { content: '<p>Reference</p>' },
          }
        : {
            elementType: 'Note',
            clientId: `n${index}`,
            properties: { pageBreak: index === 10 },
          },
    );
  }
  await edit([
    { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
    { action: 'insert', elements },
    ...Array.from({ length: 13 }, (_, index) => ({
      action: 'insert_footnote',
      elementRef: `@n${index}`,
      ...(index === 2 ? { contentKey: 'content', htmlOffset: 7 } : {}),
      elements: [
        {
          elementType: 'RichTextBox',
          properties: { content: `<p>Body ${index}</p>` },
        },
      ],
    })),
  ]);
  const anchors = (
    await call('get_elements', { ...args, includeContent: true })
  ).elements.filter(
    (entry) =>
      entry.properties.footnoteId ||
      entry.properties.content?.includes('data-footnote-id'),
  );
  const ids = anchors.map(
    (entry) =>
      entry.properties.footnoteId ??
      entry.properties.content.match(/data-footnote-id="([^"]+)"/)[1],
  );
  await edit([{ action: 'update_footnote', footnoteId: ids[4], marker: 'X' }]);
  await settings({
    footnoteFormat: 'symbols',
    footnoteNumbering: 'page',
    footnoteReferenceParentheses: true,
  });
  assert.equal(
    (await call('get_page_setup', args)).settings.footnoteNumbering,
    'page',
  );

  async function rendered() {
    const pageCount = await evaluate(
      "document.querySelectorAll('.page').length",
    );
    const pages = [];
    for (let index = 0; index < pageCount; index++) {
      // Offscreen page contents are unmounted. Visit each page before reading
      // its labels instead of relying on the host display's viewport height.
      await evaluate(
        `document.querySelectorAll('.page')[${index}].scrollIntoView({block:'start'})`,
      );
      const labels = await eventually(async () => {
        const result = await evaluate(`(() => {
          const page = document.querySelectorAll('.page')[${index}];
          return {
            mounted: page.querySelector('.line') !== null,
            labels: [...page.querySelectorAll('.footnote-label')].map(n => ({
              id: n.dataset.footnoteId, marker: n.textContent.trim(),
            })),
          };
        })()`);
        assert.ok(result.mounted, `Waiting for page ${index + 1} to mount`);
        return result.labels;
      });
      if (labels.length) {
        pages.push(labels);
      }
    }
    return pages;
  }
  await eventually(async () =>
    assert.deepEqual(
      (await rendered()).map((page) => page.map(({ marker }) => marker)),
      [
        [
          '*',
          '\u2020',
          '\u2021',
          '\u00a7',
          'X',
          '\u00b6',
          '\u2016',
          '**',
          '\u2020\u2020',
          '\u2021\u2021',
          '\u00a7\u00a7',
        ],
        ['*', '\u2020'],
      ],
    ),
  );
  // The next marker beyond the original nine-symbol proposal remains available.
  const marker = `.footnote-reference[data-footnote-id="${ids[10]}"]`;
  assert.equal(
    await evaluate(
      `document.querySelector(${JSON.stringify(marker)}).textContent.trim()`,
    ),
    '(\u00a7\u00a7)',
  );

  await settings({ footnoteNumbering: 'section', firstFootnoteNumber: 3 });
  await eventually(async () =>
    assert.deepEqual(
      (await rendered()).flat().map(({ marker }) => marker),
      [
        '\u2021',
        '\u00a7',
        '\u00b6',
        '\u2016',
        'X',
        '\u2021',
        '\u00a7',
        '\u00b6',
        '\u2016',
        '**',
        '\u2020\u2020',
        '\u2021\u2021',
        '\u00a7\u00a7',
      ],
    ),
  );
  const filePath = path.join(directory, 'automatic-symbols.byzx');
  await call('save_document', {
    ...args,
    expectedRevision: await revision(),
    filePath,
  });
  const reopened = await call('open_document', {
    documentScope: 'private',
    filePath,
  });
  const privateArgs = {
    documentScope: 'private',
    documentId: reopened.documentId,
  };
  assert.equal(
    (await call('get_page_setup', privateArgs)).settings.footnoteNumbering,
    'section',
  );
  const body = await call('get_elements', {
    ...privateArgs,
    collection: { kind: 'footnote', footnoteId: ids[11] },
  });
  assert.equal(body.footnote.label, '\u2021\u2021');
  const pages = await call('get_pages', privateArgs);
  const preview = await call('preview_page', {
    ...privateArgs,
    expectedRevision: pages.revision,
    pageNumber: 2,
  });
  await copyFile(
    preview.outputFilePath,
    path.join(directory, 'automatic-symbols-page-2.png'),
  );

  // Reflow from shorter pages restarts by actual placement, including rich text references.
  await settings({
    footnoteNumbering: 'page',
    pageSize: 'Custom',
    pageWidthCustom: 816,
    pageHeightCustom: 440,
    topMargin: 30,
    bottomMargin: 30,
  });
  // Deliberately exercise page virtualization even on a large host display.
  const previousMaxHeight = await evaluate(`(() => {
    const viewport = document.querySelector('.page-background');
    const previous = viewport.style.maxHeight;
    viewport.style.maxHeight = '180px';
    return previous;
  })()`);
  const sequence = ['*', '\u2020', '\u2021', '\u00a7', '\u00b6', '\u2016'];
  await eventually(async () => {
    const actual = await rendered();
    assert.ok(actual.length > 2);
    for (const page of actual) {
      let position = 3;
      for (const entry of page) {
        const expected =
          entry.id === ids[4]
            ? 'X'
            : sequence[(position - 1) % 6].repeat(
                Math.floor((position - 1) / 6) + 1,
              );
        assert.equal(entry.marker, expected);
        if (entry.id !== ids[4]) {
          position++;
        }
      }
    }
    assert.equal(actual.flat().length, 13);
  });
  await evaluate(
    `document.querySelector('.page-background').style.maxHeight = ${JSON.stringify(previousMaxHeight)}`,
  );
  // Remounting rich text after restoring the viewport can update measurements.
  // Retry only this read-only pair, discovering a fresh revision each time.
  await eventually(
    async () => {
      const reflowPages = await call('get_pages', args);
      await call('preview_page', {
        ...args,
        expectedRevision: reflowPages.revision,
        pageNumber: 2,
      });
    },
    { retry: (error) => error.message.includes('REVISION_CONFLICT') },
  );

  async function openSetup() {
    await dispatch('FileMenuPageSetup');
    await eventually(async () =>
      assert.ok(await evaluate("document.querySelector('#page-setup-form')")),
    );
    const index = await evaluate(
      "[...document.querySelectorAll('[role=dialog] [role=tab]')].findIndex(n=>n.textContent.trim()==='Footnotes')",
    );
    assert.ok(index >= 0);
    await click(`[role=dialog] [role=tab]:nth-child(${index + 1})`);
  }
  async function select(selector, value) {
    await click(selector);
    const label = {
      numbers: '1, 2, 3, …',
      symbols: '*, †, ‡, …',
      asterisks: '*, **, ***, …',
      section: 'Restart each section',
    }[value];
    const index = await evaluate(
      `[...document.querySelectorAll('[role=option]')].findIndex(n=>n.textContent.trim()===${JSON.stringify(label)})`,
    );
    assert.ok(index >= 0);
    await click(`[role=option]:nth-child(${index + 1})`);
  }
  await openSetup();
  assert.equal(
    await evaluate(
      "document.querySelector('#page-setup-first-footnote-number').value",
    ),
    '\u2021',
  );
  await select('#page-setup-footnote-format', 'numbers');
  assert.equal(
    await evaluate(
      "document.querySelector('#page-setup-footnote-numbering').textContent.trim()",
    ),
    'Restart each page',
  );
  await select('#page-setup-footnote-format', 'asterisks');
  assert.equal(
    await evaluate(
      "document.querySelector('#page-setup-first-footnote-number').value",
    ),
    '***',
  );
  await select('#page-setup-footnote-format', 'symbols');
  assert.equal(
    await evaluate(
      "document.querySelector('#page-setup-footnote-numbering').textContent.trim()",
    ),
    'Restart each page',
  );
  assert.equal(
    await evaluate(
      "document.querySelector('#page-setup-first-footnote-number').value",
    ),
    '\u2021',
  );
  await click('[aria-label="Next symbol"]');
  assert.equal(
    await evaluate(
      "document.querySelector('#page-setup-first-footnote-number').value",
    ),
    '\u00a7',
  );
  await evaluate(
    "document.querySelector('#page-setup-first-footnote-number').focus();document.querySelector('#page-setup-first-footnote-number').select()",
  );
  await socket.send('Input.insertText', { text: '*\u2020' });
  assert.equal(
    await evaluate(
      "document.querySelector('button[form=page-setup-form]').disabled",
    ),
    true,
  );
  await evaluate(
    "document.querySelector('#page-setup-first-footnote-number').select()",
  );
  await socket.send('Input.insertText', { text: '\u2020\u2020' });
  assert.equal(
    await evaluate(
      "document.querySelector('button[form=page-setup-form]').disabled",
    ),
    false,
  );
  await evaluate(
    "document.querySelector('#page-setup-first-footnote-number').select()",
  );
  await socket.send('Input.insertText', { text: '*'.repeat(65) });
  await eventually(async () =>
    assert.equal(
      await evaluate(
        "document.querySelector('button[form=page-setup-form]').disabled",
      ),
      true,
    ),
  );
  await evaluate(
    "document.querySelector('#page-setup-first-footnote-number').select()",
  );
  await socket.send('Input.insertText', { text: '‖'.repeat(64) });
  await eventually(async () =>
    assert.equal(
      await evaluate(
        'document.querySelector(\'button[aria-label="Next symbol"]\').disabled',
      ),
      true,
    ),
  );
  await evaluate(
    "document.querySelector('#page-setup-first-footnote-number').select()",
  );
  await socket.send('Input.insertText', { text: '††' });
  await select('#page-setup-footnote-numbering', 'section');
  // Pending changes do not mutate the document until Update.
  assert.equal(
    await evaluate(
      'window._editor.selectedWorkspace.value.score.pageSetup.firstFootnoteNumber',
    ),
    3,
  );
  await click('button[form=page-setup-form]');
  await eventually(async () =>
    assert.equal(
      (await call('get_page_setup', args)).settings.firstFootnoteNumber,
      8,
    ),
  );
  assert.equal(
    (await call('get_page_setup', args)).settings.footnoteNumbering,
    'section',
  );
  await openSetup();
  assert.equal(
    await evaluate(
      "document.querySelector('#page-setup-first-footnote-number').value",
    ),
    '\u2020\u2020',
  );
  assert.equal(
    await evaluate(
      "document.querySelector('#page-setup-footnote-numbering').textContent.trim()",
    ),
    'Restart each section',
  );
  const screenshot = await socket.send('Page.captureScreenshot', {
    format: 'png',
  });
  await writeFile(
    path.join(directory, 'footnote-page-setup.png'),
    Buffer.from(screenshot.data, 'base64'),
  );
  await evaluate(
    "[...document.querySelectorAll('[role=dialog] button')].find(n=>n.textContent.trim()==='Cancel').click()",
  );
  const beforeRejected = await revision();
  await call(
    'update_page_setup',
    {
      ...args,
      expectedRevision: beforeRejected,
      changes: { firstFootnoteNumber: 385 },
    },
    'INVALID_PAGE_SETUP',
  );
  assert.equal(await revision(), beforeRejected);
}
