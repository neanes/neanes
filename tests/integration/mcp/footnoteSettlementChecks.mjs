import assert from 'node:assert/strict';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

import { eventually } from './smokePolling.mjs';

export async function checkFootnoteSettlement(call, evaluate, directory) {
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Footnote wrapping settlement',
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
  await settings({
    pageSize: 'Custom',
    pageWidthCustom: 400,
    pageHeightCustom: 390,
    leftMargin: 35,
    rightMargin: 35,
    topMargin: 30,
    bottomMargin: 30,
    footnoteNumbering: 'page',
    firstFootnoteNumber: 9,
  });
  const initial = await call('get_elements', args);
  const inlineContent = '<p>Inline reference</p>';
  const content =
    '<p>A reference among words that wrap near the end of a line and continue into the next line.</p>';
  await edit([
    { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
    {
      action: 'insert',
      elements: Array.from({ length: 6 }, (_, i) => ({
        elementType: 'RichTextBox',
        clientId: `box${i}`,
        properties: {
          content: i === 2 ? inlineContent : content,
          scrollable: i === 0,
          ...(i === 2 ? { inline: true } : {}),
        },
      })),
    },
    ...Array.from({ length: 6 }, (_, i) => ({
      action: 'insert_footnote',
      elementRef: `@box${i}`,
      contentKey: 'content',
      htmlOffset:
        i === 2 ? inlineContent.indexOf('</p>') : content.indexOf(' among'),
      elements: [
        {
          elementType: 'RichTextBox',
          properties: {
            content:
              '<p>Footnote text fills the available width with several words and wraps according to the displayed label gutter.</p>',
            scrollable: i === 1,
          },
        },
      ],
    })),
  ]);
  const entries = (
    await call('get_elements', { ...args, includeContent: true })
  ).elements;
  const heightLimits = await evaluate(`(() => {
    const limits = selector => [...document.querySelectorAll(selector)]
      .map(element => getComputedStyle(element).maxHeight);
    return {
      main: limits('.page .line:not([data-footnote-id]) .ck-content.single:not(.scrollable)'),
      scrollableMain: limits('.page .line:not([data-footnote-id]) .ck-content.single.scrollable'),
      footnotes: limits('.page .line[data-footnote-id] .ck-content.single'),
    };
  })()`);
  assert.ok(heightLimits.main.length > 0);
  assert.ok(heightLimits.footnotes.length > 0);
  assert.ok(
    heightLimits.main.every((height) => height === 'none'),
    'Ordinary main rich-text boxes are measured at their natural height',
  );
  assert.equal(heightLimits.scrollableMain.length, 1);
  assert.notEqual(
    heightLimits.scrollableMain[0],
    'none',
    'Scrollable main rich-text boxes retain their page-position height limits',
  );
  assert.ok(
    heightLimits.footnotes.every((height) => height === 'none'),
    'Whole footnote bodies are measured at their natural height',
  );
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.page .line[data-footnote-id] .ck-content.scrollable').length",
    ),
    0,
    'Footnote bodies ignore stored scrollability',
  );
  const ids = entries
    .slice(0, 6)
    .map(
      (entry) =>
        entry.properties.content.match(/data-footnote-id="([^"]+)"/)[1],
    );
  const markerGeometry = (id, candidates) =>
    eventually(async () => {
      const geometry = await evaluate(`(() => {
      const id = ${JSON.stringify(id)};
      const workspace = window._editor.selectedWorkspace.value;
      const owner = workspace.score.staff.elements.find(element => element.footnoteMarkers?.[id]);
      const page = document.querySelectorAll('.page-background .page')[owner.page - 1];
      const widget = page?.querySelector('.neanes-footnote[data-footnote-id="' + id + '"]');
      if (!widget || !widget.nextSibling) {
        page?.scrollIntoView({block: 'start'});
        return null;
      }
      const paragraph = widget.parentElement;
      const origin = paragraph.getBoundingClientRect();
      const box = widget.getBoundingClientRect();
      const text = widget.nextSibling;
      const range = document.createRange();
      range.selectNode(text);
      const wrapping = [...range.getClientRects()].map(
        rect => [rect.x - origin.x, rect.y - origin.y, rect.width, rect.height]
          .map(n => Number(n.toFixed(2))),
      );
      const label = widget.textContent;
      const sample = widget.cloneNode(false);
      sample.removeAttribute('id');
      sample.style.position = 'absolute';
      sample.style.width = 'auto';
      sample.style.visibility = 'hidden';
      widget.closest('.rich-text-box-container').append(sample);
      const naturalWidths = ${JSON.stringify(candidates)}.map(label => {
        sample.textContent = label;
        return Number(getComputedStyle(sample).width.replace('px', ''));
      });
      sample.remove();
      return {
        label,
        width: Number(getComputedStyle(widget).width.replace('px', '')),
        height: box.height,
        wrapping,
        naturalWidths,
      };
      })()`);
      assert.ok(geometry, `Marker ${id} is mounted`);
      return geometry;
    });
  const marker = (candidates) => markerGeometry(ids[1], candidates);
  for (const [footnoteFormat, firstFootnoteNumber, candidates] of [
    ['numbers', 9, ['9', '10']],
    ['symbols', 5, ['¶', '‖']],
    ['symbols', 6, ['‖', '**']],
  ]) {
    await settings({
      pageHeightCustom: 900,
      footnoteFormat,
      firstFootnoteNumber,
    });
    const first = await markerGeometry(ids[0], candidates);
    const uninterrupted = await marker(candidates);
    assert.equal(
      first.width,
      first.naturalWidths[0],
      'The first slot uses only the first label',
    );
    assert.equal(uninterrupted.label, candidates[1]);
    if (firstFootnoteNumber === 5) {
      assert.ok(
        uninterrupted.naturalWidths[0] > uninterrupted.naturalWidths[1],
        'The first symbol is wider than the last in this case',
      );
    }
    assert.equal(uninterrupted.width, Math.max(...uninterrupted.naturalWidths));
    await settings({ pageHeightCustom: 170 });
    const restarted = await marker(candidates);
    assert.equal(restarted.label, candidates[0]);
    assert.equal(
      restarted.width,
      restarted.naturalWidths[0],
      `${footnoteFormat} restart uses the starting mark's slot`,
    );
    const toggleBreak = (pageBreak) =>
      edit([
        {
          action: 'update',
          elementType: 'RichTextBox',
          elementRef: entries[0].elementRef,
          properties: { pageBreak },
        },
      ]);
    await toggleBreak(true);
    const explicit = await marker(candidates);
    assert.equal(explicit.label, candidates[0]);
    assert.equal(explicit.width, explicit.naturalWidths[0]);
    await toggleBreak(false);
  }
  for (const footnoteNumbering of ['continuous', 'section']) {
    await settings({
      pageHeightCustom: 390,
      footnoteNumbering,
      footnoteFormat: 'symbols',
      firstFootnoteNumber: 5,
    });
    const natural = await marker(['‖']);
    assert.equal(natural.label, '‖');
    assert.equal(natural.width, natural.naturalWidths[0]);
  }
  await settings({
    pageHeightCustom: 390,
    footnoteNumbering: 'page',
    footnoteFormat: 'numbers',
    firstFootnoteNumber: 9,
  });
  await edit([
    { action: 'update_footnote', footnoteId: ids[1], marker: 'Editorial note' },
  ]);
  const literal = await marker(['Editorial note']);
  assert.equal(literal.label, 'Editorial note');
  assert.equal(literal.width, literal.naturalWidths[0]);
  await edit([{ action: 'update_footnote', footnoteId: ids[1], marker: null }]);

  const geometry = () =>
    evaluate(`(() => {
    const w=window._editor.selectedWorkspace.value;
    return {main:w.score.staff.elements.filter(e=>e.elementType!=='Empty').map(e=>({id:e.id,page:e.page,line:e.line,x:e.x,width:e.width,height:e.height})), bodies:w.score.footnotes.map(f=>({id:f.id,elements:f.staff.elements.filter(e=>e.elementType!=='Empty').map(e=>({page:e.page,line:e.line,x:e.x,width:e.width,height:e.height}))}))};
  })()`);
  let baseline = await geometry();
  const baselineWidth = baseline.bodies[0].elements[0].width;
  const wrappingText = await evaluate(`(() => {
    const p=document.querySelector('.line[data-footnote-id] .ck-content p');
    const style=getComputedStyle(p), context=document.createElement('canvas').getContext('2d');
    context.font=style.fontStyle+' '+style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
    const target=${baselineWidth};
    let text='Footnote';
    while(context.measureText(text).width<target) text+=' a';
    return '<p>'+text+'</p>';
  })()`);
  const bodyRefs = await Promise.all(
    ids.map(
      async (footnoteId) =>
        (
          await call('get_elements', {
            ...args,
            collection: { kind: 'footnote', footnoteId },
          })
        ).elements[0].elementRef,
    ),
  );
  await edit([
    ...bodyRefs.map((elementRef) => ({
      action: 'update',
      elementType: 'RichTextBox',
      elementRef,
      properties: { content: wrappingText },
    })),
  ]);
  baseline = await geometry();
  await edit([
    { action: 'update_footnote', footnoteId: ids[0], marker: '[Note]' },
  ]);
  const custom = await geometry();
  assert.equal(
    custom.bodies[0].elements[0].width,
    baselineWidth,
    'Custom labels retain the fixed gutter',
  );
  assert.deepEqual(
    custom.bodies.map((body) =>
      body.elements.map(({ width, height }) => ({ width, height })),
    ),
    baseline.bodies.map((body) =>
      body.elements.map(({ width, height }) => ({ width, height })),
    ),
    'Custom labels do not rewrap footnote bodies',
  );
  const stable = await call('get_pages', args);
  await eventually(async () => assert.deepEqual(await geometry(), custom));
  assert.equal((await call('get_pages', args)).layoutId, stable.layoutId);
  await edit([{ action: 'update_footnote', footnoteId: ids[0], marker: null }]);
  const restored = await geometry();
  const bodySizes = (geometry) =>
    geometry.bodies.map((body) =>
      body.elements.map(({ width, height }) => ({ width, height })),
    );
  assert.deepEqual(
    bodySizes(restored),
    bodySizes(custom),
    'Removing custom labels retains body geometry',
  );

  await settings({ firstFootnoteNumber: 1000 });
  const largeNumbers = await geometry();
  assert.deepEqual(
    bodySizes(largeNumbers),
    bodySizes(restored),
    'Large numbers retain body geometry',
  );
  await settings({ firstFootnoteNumber: 9 });
  assert.deepEqual(
    bodySizes(await geometry()),
    bodySizes(restored),
    'Numbering changes retain body geometry',
  );
  const numbering = await evaluate(`(() => {
    const w=window._editor.selectedWorkspace.value;
    return w.score.staff.elements.filter(e=>e.elementType==='RichTextBox').map(e=>({page:e.page, marker:e.footnoteMarkers[Object.keys(e.footnoteMarkers).find(id=>e.content.includes(id))].label}));
  })()`);
  let previousPage, next;
  for (const entry of numbering) {
    if (entry.page !== previousPage) {
      next = 9;
    }
    assert.equal(
      entry.marker,
      String(next++),
      'Numbering follows final placement after rich-text rewrapping',
    );
    previousPage = entry.page;
  }

  // Repeated footer templates exercise token-aware settlement in each path.
  await call('update_header_footer_settings', {
    ...args,
    expectedRevision: await revision(),
    changes: { showFooter: true },
  });
  // Save/reopen in the private worker, then compare independently settled exports.
  const filePath = path.join(directory, 'footnote-wrapping.byzx');
  await call('save_document', {
    ...args,
    expectedRevision: await revision(),
    filePath,
  });
  const stale = JSON.parse(await readFile(filePath, 'utf8'));
  for (const staff of [
    stale.staff,
    ...stale.footnotes.map((footnote) => footnote.staff),
  ]) {
    for (const element of staff.elements) {
      if (element.elementType === 'RichTextBox' && !element.inline) {
        element.height = 1000;
      }
    }
  }
  const stalePath = path.join(
    directory,
    'footnote-wrapping-stale-heights.byzx',
  );
  await writeFile(stalePath, JSON.stringify(stale));
  const privateDoc = await call('open_document', {
    documentScope: 'private',
    filePath: stalePath,
  });
  const privateArgs = {
    documentScope: 'private',
    documentId: privateDoc.documentId,
  };
  await evaluate(`(() => {
    const observer = new MutationObserver(() => {
      const pages = document.querySelectorAll('.workspace-page-measurement .page');
      if (!pages.length) return;
      window.detachedStaffGeometry = [...pages].flatMap((page, index) =>
        [...page.querySelectorAll('.line:not([data-footnote-id]) > .element-box .rich-text-box-container')]
          .map(box => {
            const position = getComputedStyle(box.closest('.element-box'));
            const size = getComputedStyle(box);
            return [index + 1, ...[position.left, position.top, size.width, size.height].map(parseFloat)];
          }),
      );
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.detachedGeometryObserver = observer;
  })()`);
  const editorPages = await call('get_pages', args);
  const comparison = await evaluate(`(() => {
    window.detachedGeometryObserver.disconnect();
    return {
      detached: window.detachedStaffGeometry,
      live: window._editor.score.value.staff.elements
        .filter(element => element.elementType === 'RichTextBox')
        .map(({ page, x, y, width, height }) => [page, x, y, width, height]),
    };
  })()`);
  assert.equal(comparison.detached.length, comparison.live.length);
  for (const [index, layout] of comparison.detached.entries()) {
    assert.ok(
      layout.every(
        (value, field) =>
          Math.abs(value - comparison.live[index][field]) < 0.05,
      ),
      JSON.stringify(comparison),
    );
  }
  const privatePages = await call('get_pages', privateArgs);
  assert.equal(
    privatePages.pageCount,
    editorPages.pageCount,
    'Editor and private worker agree on pagination',
  );
  for (let pageNumber = 1; pageNumber <= editorPages.pageCount; pageNumber++) {
    const left = await call('get_page_elements', { ...args, pageNumber });
    const right = await call('get_page_elements', {
      ...privateArgs,
      pageNumber,
    });
    const occurrences = (result) =>
      result.occurrences.map(
        ({ elementType, collection, index, region, lineIndex }) => ({
          elementType,
          collection,
          index,
          region,
          lineIndex,
        }),
      );
    assert.deepEqual(
      occurrences(left),
      occurrences(right),
      'Editor and private worker agree on element placement',
    );
    const editorPreview = await call('preview_page', {
      ...args,
      expectedRevision: editorPages.revision,
      pageNumber,
    });
    const privatePreview = await call('preview_page', {
      ...privateArgs,
      expectedRevision: privatePages.revision,
      pageNumber,
    });
    assert.deepEqual(
      await readFile(editorPreview.outputFilePath),
      await readFile(privatePreview.outputFilePath),
      'Detached exports agree across editor and private worker',
    );
    await copyFile(
      editorPreview.outputFilePath,
      path.join(directory, `footnote-wrapping-${pageNumber}.png`),
    );
  }
  console.log(
    'PASS: page numbering and rich-text wrapping, fixed gutters, label-independent body geometry, editor/private-worker/export agreement',
  );
}

// One reference per page exposes reservations made from obsolete page assignments.
export async function checkFootnoteColdGutter(call, evaluate, directory) {
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Cold footnote gutter',
  });
  const args = { documentScope: 'editor', documentId: doc.documentId };
  const revision = async () =>
    (await call('get_document_properties', args)).revision;
  const settings = async (changes) =>
    call('update_page_setup', {
      ...args,
      expectedRevision: await revision(),
      changes,
    });
  await settings({
    footnoteFormat: 'symbols',
    footnoteNumbering: 'page',
    firstFootnoteNumber: 1,
  });
  const initial = await call('get_elements', args);
  const inserted = await call('edit_elements', {
    ...args,
    expectedRevision: await revision(),
    actions: [
      { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
      {
        action: 'insert',
        elements: Array.from({ length: 13 }, (_, i) => ({
          elementType: 'Note',
          clientId: `anchor${i}`,
          properties: { pageBreak: i < 12 },
        })),
      },
      ...Array.from({ length: 13 }, (_, i) => ({
        action: 'insert_footnote',
        elementRef: `@anchor${i}`,
        elements: [
          {
            elementType: 'RichTextBox',
            clientId: `body${i}`,
            properties: { content: '<p>Body</p>' },
          },
        ],
      })),
    ],
  });
  // Put text near a wrapping boundary to detect any numbering-dependent body width.
  const wrappingText = await evaluate(`(() => {
    const w=window._editor.selectedWorkspace.value;
    const p=document.querySelector('.line[data-footnote-id] .ck-content p');
    const style=getComputedStyle(p), context=document.createElement('canvas').getContext('2d');
    context.font=style.fontStyle+' '+style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
    const target=w.score.footnotes[0].staff.elements[0].width-6;
    let text='Footnote ';
    while(context.measureText(text).width<target-20) text+='a ';
    while(context.measureText(text).width<target) text+='i';
    return '<p>'+text+'</p>';
  })()`);
  await call('edit_elements', {
    ...args,
    expectedRevision: await revision(),
    actions: inserted.created
      .filter((e) => e.clientId?.startsWith('body'))
      .map((e) => ({
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: e.elementRef,
        properties: { content: wrappingText },
      })),
  });
  const editorHeight = await evaluate(
    'window._editor.selectedWorkspace.value.score.footnotes[0].staff.elements[0].height',
  );
  const filePath = path.join(directory, 'cold-rich-footnotes.byzx');
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
  const footnoteIds = await evaluate(
    'window._editor.selectedWorkspace.value.score.footnotes.map(f=>f.id)',
  );
  const privateHeights = async () =>
    Promise.all(
      footnoteIds.map(
        async (footnoteId) =>
          (
            await call('get_elements', {
              ...privateArgs,
              collection: { kind: 'footnote', footnoteId },
            })
          ).elements[0].properties.height,
      ),
    );
  const coldHeights = await privateHeights();
  assert.deepEqual(
    coldHeights,
    Array(13).fill(editorHeight),
    'Cold private reopening must discard heights measured at provisional body widths',
  );
  const editorPages = await call('get_pages', args);
  const privatePages = await call('get_pages', privateArgs);
  assert.equal(editorPages.pageCount, 13);
  assert.equal(privatePages.pageCount, editorPages.pageCount);
  const editorPreview = await call('preview_page', {
    ...args,
    expectedRevision: editorPages.revision,
    pageNumber: 1,
  });
  const privatePreview = await call('preview_page', {
    ...privateArgs,
    expectedRevision: privatePages.revision,
    pageNumber: 1,
  });
  assert.deepEqual(
    await readFile(editorPreview.outputFilePath),
    await readFile(privatePreview.outputFilePath),
    'Cold editor and private exports must agree on rich-text body geometry',
  );
  await copyFile(
    privatePreview.outputFilePath,
    path.join(directory, 'cold-rich-footnotes-private.png'),
  );
  const privateBefore = await call('get_document_properties', privateArgs);
  await call('update_page_setup', {
    ...privateArgs,
    expectedRevision: privateBefore.revision,
    changes: { footnoteHorizontalRuleLength: 43 },
  });
  assert.deepEqual(
    await privateHeights(),
    coldHeights,
    'Fresh warm settlement must retain the same natural body heights',
  );
  const geometry = () =>
    evaluate(`(() => {
    const w=window._editor.selectedWorkspace.value;
    return {
      references:w.score.staff.elements.filter(e=>e.elementType==='Note').map(e=>({page:e.page,line:e.line,marker:e.footnoteMarker})),
      bodies:w.score.footnotes.map(f=>f.staff.elements.filter(e=>e.elementType!=='Empty').map(e=>({page:e.page,line:e.line,x:e.x,width:e.width,y:e.y,height:e.height}))),
    };
  })()`);
  // Clear only transient pagination, as on a newly loaded document.
  await evaluate(`(() => {
    const score=window._editor.selectedWorkspace.value.score;
    score.staff.elements.forEach(e=>{e.page=0;});
    score.pageSetup.footnoteHorizontalRuleLength=41;
  })()`);
  await call('get_elements', args);
  await call('get_elements', args);
  const cold = await geometry();
  assert.equal(new Set(cold.references.map((e) => e.page)).size, 13);
  assert.deepEqual(
    cold.references.map((e) => e.marker),
    Array(13).fill('*'),
  );
  // A new operation with the completed page assignments must produce the same gutter.
  await evaluate(
    'window._editor.selectedWorkspace.value.score.pageSetup.footnoteHorizontalRuleLength=42',
  );
  await call('get_elements', args);
  await call('get_elements', args);
  const warm = await geometry();
  assert.deepEqual(
    cold,
    warm,
    'Cold and previously paginated settlement must use identical body positions and widths',
  );
  const pages = await call('get_pages', args);
  const preview = await call('preview_page', {
    ...args,
    expectedRevision: pages.revision,
    pageNumber: 1,
  });
  await copyFile(
    preview.outputFilePath,
    path.join(directory, 'cold-footnote-gutter.png'),
  );
  console.log(
    'PASS: 13 page-restarted symbol footnotes have identical cold/warm gutters, rich-text heights, and exports',
  );
}
export async function checkSparseAndDenseSlots(call, evaluate) {
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Sparse and dense asterisk slots',
  });
  const args = { documentScope: 'editor', documentId: doc.documentId };
  const revision = async () =>
    (await call('get_document_properties', args)).revision;
  const settings = async (changes) =>
    call('update_page_setup', {
      ...args,
      expectedRevision: await revision(),
      changes,
    });
  const edit = async (actions) =>
    call('edit_elements', {
      ...args,
      expectedRevision: await revision(),
      actions,
    });
  await settings({
    pageSize: 'Custom',
    pageWidthCustom: 400,
    pageHeightCustom: 110,
    leftMargin: 35,
    rightMargin: 35,
    topMargin: 30,
    bottomMargin: 30,
    footnoteFormat: 'symbols',
    footnoteSymbolSequence: 'asterisks',
    footnoteNumbering: 'page',
  });
  const initial = await call('get_elements', args);
  await evaluate(`(() => {
    window.slotMeasurementPasses = 0;
    window.slotMeasurementObserver = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.matches?.('.workspace-text-box-measurement')) {
            window.slotMeasurementPasses++;
          }
        }
      }
    });
    window.slotMeasurementObserver.observe(document.body, { childList: true, subtree: true });
  })()`);
  async function assertLiveFastPath() {
    await evaluate(`(() => {
      window.slotMeasurementPasses = 0;
      window._editor.score.value.staff.elements[0].page = 0;
      document.fonts.dispatchEvent(new Event('loadingdone'));
    })()`);
    await eventually(async () =>
      assert.equal(
        await evaluate('window._editor.score.value.staff.elements[0].page'),
        1,
      ),
    );
    assert.equal(await evaluate('window.slotMeasurementPasses'), 0);
  }
  await assertLiveFastPath();
  const content = '<p>Reference</p>';
  await edit([
    { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
    {
      action: 'insert',
      elements: Array.from({ length: 10 }, (_, index) => ({
        elementType: 'RichTextBox',
        clientId: `box${index}`,
        properties: { content },
      })),
    },
    ...Array.from({ length: 10 }, (_, index) => ({
      action: 'insert_footnote',
      elementRef: `@box${index}`,
      contentKey: 'content',
      htmlOffset: content.indexOf('</p>'),
      elements: [
        { elementType: 'RichTextBox', properties: { content: '<p>Body</p>' } },
      ],
    })),
  ]);
  const slots = () =>
    evaluate(`window._editor.score.value.staff.elements
      .filter(element => element.elementType === 'RichTextBox')
      .map(element => ({
        page: element.page, height: element.height, ...Object.values(element.footnoteMarkers)[0],
      }))`);
  const readPasses = () => evaluate('window.slotMeasurementPasses');
  const sparse = await slots();
  assert.equal(sparse.length, 10);
  for (const [index, slot] of sparse.entries()) {
    assert.equal(slot.page, index + 1, 'Page breaks are automatic');
    assert.equal(slot.label, '*');
    assert.equal(slot.width, sparse[0].width);
  }
  const sparsePasses = await readPasses();
  assert.ok(
    sparsePasses >= 2 && sparsePasses <= 4,
    `Sparse passes: ${sparsePasses}`,
  );

  await evaluate('window.slotMeasurementPasses = 0');
  await settings({ pageHeightCustom: 900 });
  const dense = await slots();
  for (const [index, slot] of dense.slice(0, 3).entries()) {
    assert.equal(slot.page, 1);
    assert.equal(slot.label, '*'.repeat(index + 1));
    assert.ok(Math.abs(slot.width - sparse[0].width * (index + 1)) < 0.05);
  }
  const densePasses = await readPasses();
  assert.ok(
    densePasses >= 3 && densePasses <= 6,
    `Dense passes: ${densePasses}`,
  );

  // Give six boxes line-wrap thresholds that propagate through three trials:
  // 1: [0 1 2] [3 4] [5]; 2: [0 1] [2 3 4] [5];
  // 3: [0 1] [2 3] [4 5]. Box 5 newly needs a second asterisk
  // in trial 3, so the fallback reserves its conservative sixth slot.
  const wrapping = await evaluate(`(() => {
    const widget = document.querySelector('.page .line:not([data-footnote-id]) .neanes-footnote');
    const editable = widget.closest('.ck-content');
    const probe = editable.cloneNode(false);
    Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', maxHeight: 'none', transform: 'none' });
    editable.parentElement.append(probe);
    const paragraph = document.createElement('p');
    const marker = widget.cloneNode(false);
    const text = document.createTextNode('');
    paragraph.append(text, marker);
    probe.append(paragraph);
    const widths = ${JSON.stringify(dense.slice(0, 4).map((slot) => slot.width))};
    const height = (value, ordinal) => {
      text.data = value;
      marker.textContent = '*'.repeat(ordinal);
      marker.style.width = widths[ordinal - 1] + 'px';
      return probe.getBoundingClientRect().height;
    };
    const baseline = height('Reference', 1);
    const thresholds = [2, 3, 4].map(ordinal => {
      for (let length = 1; length < 120; length++) {
        const value = 'Reference ' + 'i'.repeat(length);
        const grown = height(value, ordinal);
        if (grown > baseline && height(value, ordinal - 1) === baseline) {
          return { value, delta: grown - baseline };
        }
      }
      return null;
    });
    probe.remove();
    return { baseline, thresholds, bodyHeight: window._editor.score.value.footnotes[0].staff.elements[0].height };
  })()`);
  const [wrap2, wrap3, wrap4] = wrapping.thresholds;
  assert.ok(wrap2 && wrap3 && wrap4, JSON.stringify(wrapping));
  assert.equal(wrap2.delta, wrap3.delta);
  assert.equal(wrap2.delta, wrap4.delta);
  const entries = (
    await call('get_elements', { ...args, includeContent: true })
  ).elements;
  await settings({
    // The default space above the footnotes is 6 pt (8 px).
    pageHeightCustom: 60 + 8 + 8.25 * wrap2.delta,
    showFootnoteHorizontalRule: false,
  });
  await evaluate('window.slotMeasurementPasses = 0');
  await edit([
    { action: 'remove_range', start: 6, end: 10 },
    ...[wrap3, wrap4, wrap3, wrap2, wrap4, wrap2].map(({ value }, index) => ({
      action: 'update',
      elementType: 'RichTextBox',
      elementRef: entries[index].elementRef,
      properties: {
        content: entries[index].properties.content.replace('Reference', value),
        marginBottom:
          [4, 2, 2, 2, 3, 4][index] * wrap2.delta -
          wrapping.baseline -
          wrapping.bodyHeight,
      },
    })),
  ]);
  const fallback = await slots();
  assert.equal(fallback.length, 6);
  assert.deepEqual(
    fallback.map(({ page, label }) => [page, label]),
    [
      [1, '*'],
      [1, '**'],
      [2, '*'],
      [2, '**'],
      [3, '*'],
      [4, '*'],
    ],
    JSON.stringify({ fallback, wrapping }),
  );
  assert.ok(
    Math.abs(fallback[5].width - sparse[0].width * 6) < 0.1,
    JSON.stringify(fallback),
  );
  assert.equal(fallback[2].height, wrapping.baseline + wrap2.delta);
  const fallbackPasses = await readPasses();
  assert.ok(
    fallbackPasses >= 7 && fallbackPasses <= 15,
    `Fallback passes: ${fallbackPasses}`,
  );

  const editable =
    "document.querySelector('.page .line:not([data-footnote-id]) .ck-content.single')";
  await eventually(async () => {
    assert.equal(
      await evaluate(`${editable}?.ckeditorInstance?.state`),
      'ready',
    );
    assert.equal(await evaluate('document.hasFocus()'), true);
  });
  await evaluate(`(() => {
    const root = ${editable};
    const editor = root.ckeditorInstance;
    root.click();
    editor.editing.view.focus();
    window.slotTestEditor = editor;
  })()`);
  await eventually(async () =>
    assert.equal(
      await evaluate(`document.activeElement === ${editable}`),
      true,
    ),
  );
  await evaluate(`(() => {
    const editor = window.slotTestEditor;
    const geometry = () => window._editor.score.value.staff.elements
      .filter(element => element.elementType === 'RichTextBox')
      .map(({ page, line, height }) => [page, line, height]);
    const addParagraphs = count => {
      editor.model.change(writer => {
        const root = editor.model.document.getRoot();
        for (let i = 0; i < count; i++) {
          const paragraph = writer.createElement('paragraph');
          writer.insert(paragraph, root, 'end');
          writer.insertText('New text', paragraph, 0);
          writer.setSelection(paragraph, 'end');
        }
      });
      editor.editing.view.forceRender();
    };
    window.slotTest = { old: geometry(), trial: [], originalHtml: editor.getData() };
    const observer = new MutationObserver(records => {
      const newTrial = records.some(record => [...record.addedNodes].some(
        node => node.matches?.('.workspace-text-box-measurement'),
      ));
      if (!newTrial) return;
      window.slotTest.trial.push(geometry());
      if (window.slotTest.trial.length === 1) {
        // Supersede a request after its offscreen component has mounted.
        editor.execute('undo');
        addParagraphs(3);
        window.slotTest.caret = editor.model.document.selection.focus.path;
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.slotTestObserver = observer;
    addParagraphs(20);
  })()`);
  const awaitedLayout = await call('get_elements', args);
  assert.ok(
    Math.abs(
      awaitedLayout.elements[0].properties.height -
        fallback[0].height -
        3 * wrap2.delta,
    ) < 0.05,
    'MCP waits for the replacement layout before reading geometry',
  );
  await eventually(async () => {
    const state = await evaluate(`(() => {
      const editor = window.slotTestEditor;
      const current = ${editable}?.ckeditorInstance;
      const trial = window.slotTest;
      return {
        old: trial.old, trial: trial.trial, same: current === editor,
        final: window._editor.score.value.staff.elements
          .filter(element => element.elementType === 'RichTextBox')
          .map(({ page, line, height }) => [page, line, height]),
        caret: editor.model.document.selection.focus.path, expectedCaret: trial.caret,
        focused: document.activeElement === editor.ui.getEditableElement(),
      };
    })()`);
    const final = await slots();
    assert.ok(state.trial.length >= 2);
    assert.deepEqual(state.trial[0], state.old);
    for (const geometry of state.trial) {
      // Flushing the latest HTML can start another settlement after publication.
      assert.ok(
        [state.old, state.final].some(
          (layout) => JSON.stringify(layout) === JSON.stringify(geometry),
        ),
        'Offscreen trials expose only the original or final geometry',
      );
    }
    assert.equal(state.same, true);
    assert.equal(state.focused, true);
    assert.deepEqual(state.caret, state.expectedCaret);
    assert.ok(
      Math.abs(final[0].height - fallback[0].height - 3 * wrap2.delta) < 0.05,
      JSON.stringify(final),
    );
    assert.notEqual(
      final[1].page,
      fallback[1].page,
      'Only final geometry moves the next box',
    );
  });
  await evaluate(`(() => {
    window.slotTestObserver.disconnect();
    window.slotTestEditor.execute('undo');
  })()`);
  assert.equal(
    await evaluate(
      'window.slotTestEditor.getData() === window.slotTest.originalHtml',
    ),
    true,
  );
  assert.equal(
    await evaluate(`${editable}.ckeditorInstance === window.slotTestEditor`),
    true,
  );
  await evaluate(`${editable}.blur()`);

  await call('get_elements', args);
  const secondBox =
    "window._editor.score.value.staff.elements.filter(element => element.elementType === 'RichTextBox')[1]";
  const secondEditable = `document.getElementById('element-' + ${secondBox}.id)?.querySelector('.ck-content.single')`;
  await eventually(async () => {
    assert.equal(
      await evaluate(`${secondEditable}?.ckeditorInstance?.state`),
      'ready',
    );
    assert.equal(await evaluate('document.hasFocus()'), true);
  });
  assert.equal((await slots())[1].page, 1);
  await evaluate(`(() => {
    const root = ${secondEditable};
    root.click();
    const editor = root.ckeditorInstance;
    editor.editing.view.focus();
    window.deferredSlotEditor = editor;
  })()`);
  await eventually(async () => {
    assert.equal(
      await evaluate(`document.activeElement === ${secondEditable} &&
        window.deferredSlotEditor.ui.focusTracker.isFocused &&
        window._editor.selectedElement.value === ${secondBox}`),
      true,
    );
  });
  await evaluate(`(() => {
    const editor = window.deferredSlotEditor;
    editor.model.change(writer => {
      for (let i = 0; i < 4; i++) {
        const paragraph = writer.createElement('paragraph');
        writer.insert(paragraph, editor.model.document.getRoot(), 'end');
        writer.insertText('Moves the focused box', paragraph, 0);
      }
    });
  })()`);
  await call('get_elements', args, 'EDITOR_BUSY');
  assert.equal((await slots())[1].page, 1);
  assert.equal(
    await evaluate(
      `${secondEditable}.ckeditorInstance === window.deferredSlotEditor && document.activeElement === ${secondEditable}`,
    ),
    true,
  );
  // Transfer focus outside CKEditor so its focus tracker observes the exit.
  await evaluate(
    "document.querySelector('.main-toolbar button:not(:disabled)').focus()",
  );
  await eventually(async () =>
    assert.equal(
      await evaluate(
        `${secondEditable}?.ckeditorInstance === window.deferredSlotEditor &&
          window.deferredSlotEditor.ui.focusTracker.isFocused`,
      ),
      false,
    ),
  );
  await call('get_elements', args);
  assert.equal((await slots())[1].page, 2);

  await evaluate(`(() => {
    const invalidate = () => document.fonts.dispatchEvent(new Event('loadingdone'));
    const observer = new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes].some(
        node => node.matches?.('.workspace-text-box-measurement'),
      ))) {
        invalidate();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.slotRetryObserver = observer;
    invalidate();
  })()`);
  try {
    await call('get_elements', args, 'LAYOUT_SETTLEMENT_FAILED');
  } finally {
    await evaluate(`(() => {
      window.slotRetryObserver.disconnect();
    })()`);
  }
  assert.equal(
    await evaluate(
      "document.querySelector('.workspace-text-box-measurement') === null",
    ),
    true,
    'Superseded attempts leave no offscreen measurement mounted',
  );
  await call('get_elements', args);
  console.log(
    'PASS: repeated supersession hits the retry limit and releases the MCP queue',
  );

  await call('create_document', {
    documentScope: 'editor',
    title: 'Background measurement handoff',
  });
  await evaluate(`(() => {
    const observer = new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes].some(
        node => node.matches?.('.workspace-text-box-measurement'),
      ))) {
        observer.disconnect();
        const { selectedWorkspace, workspaces } = window._editor;
        selectedWorkspace.value = workspaces.value.find(
          workspace => workspace.id === ${JSON.stringify(doc.documentId)},
        );
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })()`);
  await settings({ pageHeightCustom: 900 });
  assert.deepEqual(
    await evaluate(`({
      selected: window._editor.selectedWorkspace.value.id,
      measuring: !!document.querySelector('.workspace-text-box-measurement'),
      pagesPublished: !!document.querySelector('.page-background .page'),
    })`),
    { selected: doc.documentId, measuring: false, pagesPublished: true },
    'MCP waits for the selected editor to publish after a tab switch',
  );

  await settings({ footnoteNumbering: 'continuous' });
  await assertLiveFastPath();
  await settings({ footnoteNumbering: 'page' });
  await edit([
    {
      action: 'insert',
      index: 0,
      elements: [{ elementType: 'Note' }, { elementType: 'Note' }],
    },
  ]);
  await call('get_elements', args);
  const lyricBox = (index) =>
    `document.getElementById('element-' + window._editor.score.value.staff.elements[${index}].id)?.querySelector('.lyrics')`;
  await eventually(async () =>
    assert.equal(await evaluate(`!!${lyricBox(0)} && !!${lyricBox(1)}`), true),
  );
  assert.equal(
    await evaluate(`new Promise(resolve => {
      const first = ${lyricBox(0)};
      const second = ${lyricBox(1)};
      first.focus();
      document.execCommand('insertText', false, 'first');
      const observer = new MutationObserver(records => {
        if (!records.some(record => [...record.addedNodes].some(
          node => node.matches?.('.workspace-text-box-measurement'),
        ))) return;
        observer.disconnect();
        const advanced = document.activeElement === second;
        if (advanced) document.execCommand('insertText', false, 'second');
        resolve(advanced);
      });
      observer.observe(document.body, { childList: true, subtree: true });
      first.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'Space', bubbles: true, cancelable: true,
      }));
    })`),
    true,
    'Lyric entry advances before offscreen measurement completes',
  );
  await call('get_elements', args);
  assert.deepEqual(
    await evaluate(`[${lyricBox(0)}.innerText, ${lyricBox(1)}.innerText]`),
    ['first', 'second'],
    'Publishing the layout preserves the next syllable being typed',
  );
  await evaluate(`${lyricBox(1)}.blur()`);
  await call('get_elements', args);
  await checkLiveMeasurementTimeout(call, evaluate, args);
  await evaluate('window.slotMeasurementObserver.disconnect()');
  console.log(
    `PASS: ten automatic pages reserve one asterisk, dense slots grow (**/***), superseded live trials preserve CKEditor, caret, and Undo; MCP retries after focused layout deferral; footnote-free and continuous live layout skip measurement. Measurement passes: sparse ${sparsePasses}, dense ${densePasses}, fallback ${fallbackPasses}`,
  );
}

async function checkLiveMeasurementTimeout(call, evaluate, args) {
  const font = await readFile(
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
      const face = new FontFace('LiveLayoutPendingFont', 'url(http://127.0.0.1:${server.address().port}/pending.otf)');
      const state = window.slotTimeout = { face };
      state.observer = new MutationObserver(records => {
        const measurement = records.flatMap(record => [...record.addedNodes])
          .find(node => node.matches?.('.workspace-text-box-measurement'));
        if (!measurement) return;
        state.observer.disconnect();
        state.measurement = measurement;
        document.fonts.add(face);
        void face.load().catch(() => {});
      });
      state.observer.observe(document.body, { childList: true, subtree: true });
      // Advance the revision so the read starts a new trial without scheduling
      // a debounced save that would supersede it.
      const workspace = window._editor.selectedWorkspace.value;
      state.lyricsLocked = workspace.score.staff.lyrics.locked;
      workspace.updateLyricsLocked(!state.lyricsLocked);
    })()`);
    await Promise.all([
      call('get_elements', args, 'LAYOUT_SETTLEMENT_FAILED'),
      eventually(async () => {
        assert.ok(fontResponse);
        assert.equal(
          await evaluate(`window.slotTimeout.measurement?.isConnected &&
            window.slotTimeout.face.status === 'loading'`),
          true,
          'A mounted measurement is waiting for the held font response',
        );
      }),
    ]);
    assert.deepEqual(
      await evaluate(`({
        mounted: window.slotTimeout.measurement.isConnected,
        fontStatus: window.slotTimeout.face.status,
      })`),
      { mounted: false, fontStatus: 'loading' },
      'The request deadline removes the measurement while the font is still pending',
    );
  } finally {
    fontResponse?.end(font);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await evaluate(`(async () => {
      const state = window.slotTimeout;
      if (!state) return;
      state.observer.disconnect();
      if (state.measurement) await state.face.loaded.catch(() => {});
      document.fonts.delete(state.face);
      window._editor.selectedWorkspace.value.updateLyricsLocked(state.lyricsLocked);
      delete window.slotTimeout;
    })()`);
  }
  await call('get_elements', args);
  console.log(
    'PASS: live layout timeout removes pending measurement and allows retry',
  );
}
