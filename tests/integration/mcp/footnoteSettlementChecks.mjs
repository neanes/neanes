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
      'The first reference uses its rendered width',
    );
    assert.equal(uninterrupted.label, candidates[1]);
    if (firstFootnoteNumber === 5) {
      assert.ok(
        uninterrupted.naturalWidths[0] > uninterrupted.naturalWidths[1],
        'The first symbol is wider than the last in this case',
      );
    }
    assert.equal(uninterrupted.width, uninterrupted.naturalWidths[1]);
    await settings({ pageHeightCustom: 170 });
    const restarted = await marker(candidates);
    assert.equal(restarted.label, candidates[0]);
    assert.equal(
      restarted.width,
      restarted.naturalWidths[0],
      `${footnoteFormat} restart uses the starting mark's width`,
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
export async function checkLiveFootnoteSettlement(call, evaluate) {
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Live footnote settlement',
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
      elements: Array.from({ length: 3 }, (_, index) => ({
        elementType: 'RichTextBox',
        clientId: `box${index}`,
        properties: { content },
      })),
    },
    ...Array.from({ length: 3 }, (_, index) => ({
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
  assert.equal(
    await evaluate('window.slotMeasurementPasses'),
    1,
    'Sparse references reuse the initial measurements during reconciliation',
  );
  const sparse = await slots();
  assert.deepEqual(
    sparse.map(({ page, label }) => [page, label]),
    [
      [1, '*'],
      [2, '*'],
      [3, '*'],
    ],
  );

  await settings({ pageHeightCustom: 900 });
  const dense = await slots();
  for (const [index, slot] of dense.entries()) {
    assert.equal(slot.page, 1);
    assert.equal(slot.label, '*'.repeat(index + 1));
    assert.ok(Math.abs(slot.width - sparse[0].width * (index + 1)) < 0.05);
  }

  // Leave room for two short boxes, but push one forward when the editor adds
  // three lines. The live editor checks only need a single page boundary.
  await edit([{ action: 'remove_range', start: 2, end: 3 }]);
  const lineHeight = dense[0].height;
  const bodyHeight = await evaluate(`window._editor.score.value.footnotes
    .reduce((sum, body) => sum + body.staff.elements[0].height, 0)`);
  await settings({
    pageHeightCustom: 60 + 8 + bodyHeight + 4.5 * lineHeight,
    showFootnoteHorizontalRule: false,
  });
  const settled = await slots();
  assert.deepEqual(
    settled.map(({ page }) => page),
    [1, 1],
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
        settled[0].height -
        3 * lineHeight,
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
    assert.notEqual(
      state.final[1][0],
      settled[1].page,
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
  await settings({ pageHeightCustom: 900, pageWidthCustom: 401 });
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
      // Make this lyric edit exercise the asynchronous measurement path.
      document.fonts.dispatchEvent(new Event('loadingdone'));
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
  await checkSelectionDuringPagination(evaluate);
  await checkLiveMeasurementTimeout(call, evaluate, args);
  await evaluate('window.slotMeasurementObserver.disconnect()');
  console.log(
    'PASS: marker widths, supersession, CKEditor focus and Undo, tab handoff, and live layout fast paths',
  );
}

async function checkSelectionDuringPagination(evaluate) {
  const key = (code, modifiers = '') =>
    `window.dispatchEvent(new KeyboardEvent('keydown', {
      code: '${code}', key: '${code === 'KeyJ' ? 'j' : code}',
      bubbles: true, cancelable: true, ${modifiers}
    }))`;
  const { inserted, later } = await evaluate(`(() => {
    const editor = window._editor;
    const workspace = editor.selectedWorkspace.value;
    const [first, later] = editor.elements.value;
    const laterBox = document.querySelector('#element-' + later.id + ' .syllable-box');
    const entryMode = workspace.entryMode;
    document.activeElement.blur();
    workspace.entryMode = 'Insert';
    editor.selectedElement.value = first;
    ${key('KeyJ')};
    const inserted = editor.selectedElement.value;
    if (inserted === first || later.index === editor.elements.value.indexOf(later)) {
      throw new Error('The insertion must precede the layout refresh');
    }
    workspace.entryMode = entryMode;
    laterBox.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }));
    return { inserted: inserted.id, later: later.id };
  })()`);
  await eventually(async () => {
    assert.deepEqual(
      await evaluate(`Array.from(
        document.querySelectorAll('.page-background .syllable-box.selected'),
        box => box.closest('.element-box').id,
      )`),
      [`element-${inserted}`, `element-${later}`],
      'The range highlights both notes after the insertion is laid out',
    );
  });
  assert.equal(
    await evaluate(`document.activeElement.blur(); ${key('Delete')}`),
    false,
    'Delete is handled',
  );
  await eventually(async () => {
    assert.equal(
      await evaluate(`window._editor.elements.value.some(
        note => [${JSON.stringify(inserted)}, ${JSON.stringify(later)}].includes(note.id),
      )`),
      false,
      'Delete removes the highlighted range',
    );
  });

  // Let the keyboard entry throttle reset before inserting the next note.
  await evaluate('new Promise(resolve => setTimeout(resolve, 110))');
  const noteId = await evaluate(`(() => {
    const editor = window._editor;
    const workspace = editor.selectedWorkspace.value;
    const entryMode = workspace.entryMode;
    document.activeElement.blur();
    workspace.entryMode = 'Insert';
    editor.selectedElement.value = editor.elements.value[0];
    ${key('KeyJ')};
    workspace.entryMode = entryMode;
    const id = editor.selectedElement.value.id;
    if (document.getElementById('element-' + id)) {
      throw new Error('The new note must still be waiting for layout');
    }
    ${key('ArrowDown', 'ctrlKey: true')};
    return id;
  })()`);
  await eventually(async () => {
    assert.equal(
      await evaluate(
        'document.activeElement.matches(".lyrics") && document.activeElement.closest(".element-box")?.id',
      ),
      `element-${noteId}`,
      'Ctrl+Down focuses the new note once its lyric control mounts',
    );
  });
  await evaluate('document.activeElement.blur()');
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
      state.box = workspace.score.staff.elements.find(element => element.elementType === 'RichTextBox');
      state.content = state.box.content;
      state.box.content += '<p>Unmeasured text</p>';
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
      state.box.content = state.content;
      window._editor.selectedWorkspace.value.updateLyricsLocked(state.lyricsLocked);
      delete window.slotTimeout;
    })()`);
  }
  await call('get_elements', args);
  console.log(
    'PASS: live layout timeout removes pending measurement and allows retry',
  );
}

async function createPageRestartFixture(call, title) {
  const doc = await call('create_document', { documentScope: 'editor', title });
  const args = { documentScope: 'editor', documentId: doc.documentId };
  const mutate = async (tool, changes) =>
    call(tool, {
      ...args,
      expectedRevision: (await call('get_document_properties', args)).revision,
      ...changes,
    });
  const settings = (changes) => mutate('update_page_setup', { changes });
  await settings({
    pageSize: 'Custom',
    pageWidthCustom: 400,
    pageHeightCustom: 900,
    leftMargin: 35,
    rightMargin: 35,
    topMargin: 30,
    bottomMargin: 30,
    showFootnoteHorizontalRule: false,
    footnoteNumbering: 'page',
    firstFootnoteNumber: 9,
  });
  const initial = await call('get_elements', args);
  const content = '<p>Reference</p>';
  const reference = (clientId) => ({
    action: 'insert_footnote',
    elementRef: '@' + clientId,
    contentKey: 'content',
    htmlOffset: content.indexOf('</p>'),
    elements: [
      { elementType: 'RichTextBox', properties: { content: '<p>Body</p>' } },
    ],
  });
  const insert = (elements, references) =>
    mutate('edit_elements', {
      actions: [
        { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
        { action: 'insert', elements },
        ...references.map(reference),
      ],
    });
  return { args, mutate, settings, insert, reference, content };
}

export async function checkTextBoxMeasurementReuse(call, evaluate) {
  const { args, settings, insert, mutate, content } =
    await createPageRestartFixture(call, 'Text-heavy note entry');
  await insert(
    [
      { elementType: 'Note' },
      ...Array.from({ length: 20 }, (_, index) => ({
        elementType: 'RichTextBox',
        clientId: `box${index}`,
        properties: { content },
      })),
    ],
    ['box0', 'box1', 'box2', 'box3'],
  );
  const header = (
    await call('get_elements', {
      ...args,
      collection: { kind: 'headers', variant: 'default' },
      properties: [],
    })
  ).elements[0];
  await mutate('edit_elements', {
    actions: [
      {
        action: 'update',
        elementRef: header.elementRef,
        elementType: header.elementType,
        properties: { contentCenter: 'Page $p of $n' },
      },
    ],
  });
  const callbacks = [];
  for (const [footnoteNumbering, showHeader] of [
    ['continuous', false],
    ['page', false],
    ['page', true],
  ]) {
    await settings({ footnoteNumbering });
    if (showHeader) {
      await mutate('update_header_footer_settings', {
        changes: { showHeader },
      });
    }
    await call('get_pages', args);
    await evaluate(`(() => {
      window.measurementPeak = 0;
      window.measurementObserver = new MutationObserver(() => {
        const count = document.querySelectorAll(
          '.workspace-text-box-measurement :is(.rich-text-box-container, .text-box-container)',
        ).length;
        window.measurementPeak = Math.max(window.measurementPeak, count);
      });
      window.measurementObserver.observe(document.body, { childList: true, subtree: true });
    })()`);
    try {
      const delays = [];
      for (let index = 0; index < 3; index++) {
        const { id, delay } = await evaluate(`new Promise(resolve => {
          const editor = window._editor;
          const workspace = editor.selectedWorkspace.value;
          const entryMode = workspace.entryMode;
          document.activeElement.blur();
          workspace.entryMode = 'Insert';
          editor.selectedElement.value = editor.elements.value[0];
          const start = performance.now();
          window.dispatchEvent(new KeyboardEvent('keydown', {
            code: 'KeyJ', key: 'j', bubbles: true, cancelable: true,
          }));
          const id = editor.selectedElement.value.id;
          workspace.entryMode = entryMode;
          setTimeout(() => resolve({ id, delay: performance.now() - start }), 120);
        })`);
        delays.push(Math.round(delay));
        await call('get_pages', args);
        assert.equal(
          await evaluate(`window._editor.score.value.staff.elements[1].id`),
          id,
        );
      }
      assert.equal(
        await evaluate('window.measurementPeak'),
        0,
        'Note entry reuses unchanged rich-text heights',
      );
      callbacks.push({ footnoteNumbering, showHeader, delays });
      if (footnoteNumbering === 'page') {
        const { elements } = await call('get_elements', {
          ...args,
          includeContent: true,
        });
        const box = elements
          .filter((element) => element.elementType === 'RichTextBox')
          .at(-1);
        await mutate('edit_elements', {
          actions: [
            {
              action: 'update',
              elementType: 'RichTextBox',
              elementRef: box.elementRef,
              properties: {
                content: box.properties.content + '<p>Another line</p>',
              },
            },
          ],
        });
        assert.equal(
          await evaluate('window.measurementPeak'),
          1,
          'A content edit measures only the changed box',
        );
      }
      if (showHeader) {
        await evaluate('window.measurementPeak = 0');
        await mutate('update_header_footer_settings', {
          changes: { firstPageNumber: 2 },
        });
        assert.equal(
          await evaluate('window.measurementPeak'),
          1,
          'Only the template is measured when its page number changes',
        );
      }
    } finally {
      await evaluate('window.measurementObserver.disconnect()');
    }
  }
  console.log('PASS: note entry reuses rich-text measurements', callbacks);
}

export async function checkFillWidthReference(call, evaluate) {
  const { args, mutate, settings, insert, content } =
    await createPageRestartFixture(call, 'Fill-width reference');
  await insert(
    [
      { elementType: 'Note' },
      { elementType: 'Note' },
      {
        elementType: 'RichTextBox',
        clientId: 'inline',
        properties: { content, inline: true },
      },
      { elementType: 'Martyria', properties: { alignRight: true } },
      { elementType: 'Note' },
    ],
    ['inline'],
  );
  const layout = () =>
    evaluate(`(() => {
    const elements = window._editor.score.value.staff.elements;
    const [, before, box, martyria, after] = elements;
    const marker = Object.values(box.footnoteMarkers)[0];
    return {
      lines: elements.map(element => element.line),
      sharesLine: before.line === box.line && box.line === martyria.line &&
        after.line !== box.line,
      reachesMartyria: Math.abs(box.x + box.width - martyria.x) < 0.01,
      marker: { label: marker?.label, width: marker?.width },
      positions: [box.x, box.width, martyria.x],
    };
  })()`);
  await call('get_pages', args);
  const short = await layout();
  assert.ok(short.sharesLine && short.reachesMartyria, JSON.stringify(short));
  const box = (await call('get_elements', { ...args, includeContent: true }))
    .elements[2];
  await mutate('edit_elements', {
    actions: [
      {
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: box.elementRef,
        properties: {
          content: box.properties.content.replace(
            'Reference',
            'Reference '.repeat(30),
          ),
        },
      },
    ],
  });
  assert.deepEqual(
    await layout(),
    short,
    'Inline content leaves musical layout unchanged',
  );
  await settings({ firstFootnoteNumber: 10 });
  await call('get_pages', args);
  const wider = await layout();
  assert.equal(short.marker.label, '9');
  assert.equal(wider.marker.label, '10');
  assert.ok(wider.marker.width > short.marker.width);
  assert.deepEqual({ ...wider, marker: short.marker }, short);
  console.log(
    'PASS: fill-width rich text leaves neumes in place and fills up to the right martyria',
  );
}

export async function checkMarkerWidthThreshold(call, evaluate, directory) {
  const { args, mutate, settings, insert, reference, content } =
    await createPageRestartFixture(call, 'Page restart marker width threshold');
  await insert(
    ['first', 'threshold'].map((clientId) => ({
      elementType: 'RichTextBox',
      clientId,
      properties: { content },
    })),
    ['first', 'threshold'],
  );
  const boxes = (await call('get_elements', { ...args, includeContent: true }))
    .elements;
  const id = boxes[1].properties.content.match(/data-footnote-id="([^"]+)"/)[1];
  const geometry = () =>
    evaluate(`(() => {
    const id = ${JSON.stringify(id)};
    const box = window._editor.score.value.staff.elements[1];
    const widget = document.querySelector('.page-background .neanes-footnote[data-footnote-id="' + id + '"]');
    const marker = box.footnoteMarkers[id];
    return { page: box.page, height: box.height, marker: { label: marker?.label, width: marker?.width },
      rendered: widget && [widget.textContent, parseFloat(widget.style.width)] };
  })()`);
  await eventually(async () =>
    assert.deepEqual((await geometry()).rendered?.[0], '10'),
  );
  const probe = await evaluate(`(() => {
    const widgets = [...document.querySelectorAll('.page-background .neanes-footnote')];
    const widths = widgets.slice(0, 2).map(widget => parseFloat(widget.style.width));
    const editable = widgets[1].closest('.ck-content');
    const probe = editable.cloneNode(false);
    Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', maxHeight: 'none', transform: 'none' });
    editable.parentElement.append(probe);
    const paragraph = document.createElement('p');
    const marker = widgets[1].cloneNode(false);
    const text = document.createTextNode('');
    paragraph.append(text, marker);
    probe.append(paragraph);
    const height = index => {
      marker.textContent = ['9', '10'][index];
      marker.style.width = widths[index] + 'px';
      return probe.getBoundingClientRect().height;
    };
    const oneLine = height(0);
    let threshold;
    for (let length = 1; length < 120; length++) {
      text.data = 'Threshold ' + 'i'.repeat(length);
      const wide = height(1);
      if (wide > oneLine && height(0) === oneLine) {
        threshold = { text: text.data, oneLine, wide };
        break;
      }
    }
    probe.remove();
    const score = window._editor.score.value;
    const fixedHeight = score.staff.elements[0].height +
      score.footnotes.reduce((sum, body) => sum + body.staff.elements[0].height, 0);
    return { widths, threshold, fixedHeight };
  })()`);
  assert.ok(probe.threshold, JSON.stringify(probe));
  const { text, oneLine, wide } = probe.threshold;
  await evaluate(`(() => {
    const id = ${JSON.stringify(id)};
    window.thresholdTrials = [];
    window.thresholdObserver = new MutationObserver(() => {
      const root = document.querySelector('.workspace-text-box-measurement');
      const marker = root?.querySelector('.neanes-footnote[data-footnote-id="' + id + '"]');
      if (!marker || !['9', '10'].includes(marker.textContent)) return;
      window.thresholdTrials.push({
        label: marker.textContent, width: parseFloat(marker.style.width),
        livePage: window._editor.score.value.staff.elements[1].page,
        hidden: getComputedStyle(root).visibility === 'hidden' && root.inert,
      });
    });
    window.thresholdObserver.observe(document.body, {
      childList: true, subtree: true, attributes: true, characterData: true,
    });
  })()`);
  await mutate('edit_elements', {
    actions: [
      {
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: boxes[1].elementRef,
        properties: {
          content: boxes[1].properties.content.replace('Reference', text),
        },
      },
    ],
  });
  assert.equal((await geometry()).height, wide);
  const trials = await evaluate('window.thresholdTrials');
  assert.ok(
    trials.some(
      (trial) => trial.label === '10' && trial.width === probe.widths[1],
    ),
    JSON.stringify({ trials, widths: probe.widths }),
  );
  assert.ok(
    trials.some((trial) => trial.width === probe.widths[0]),
    JSON.stringify({ trials, widths: probe.widths }),
  );
  assert.ok(
    trials.every((trial) => trial.livePage === 1 && trial.hidden),
    JSON.stringify(trials),
  );

  // The default space above the footnotes is 6 pt (8 px).
  const thresholdHeight = 60 + 8 + probe.fixedHeight + (oneLine + wide) / 2;
  await settings({ pageHeightCustom: thresholdHeight });
  const settled = {
    page: 2,
    height: oneLine,
    marker: { label: '9' },
    rendered: ['9', probe.widths[0]],
  };
  const assertSettled = () =>
    eventually(async () => {
      const {
        marker: { width, label },
        ...actual
      } = await geometry();
      assert.deepEqual({ ...actual, marker: { label } }, settled);
      assert.ok(Math.abs(width - probe.widths[0]) < 0.001);
    });
  await assertSettled();
  assert.deepEqual(
    await evaluate(
      'window.thresholdObserver.disconnect(); window.thresholdTrials',
    ),
    trials,
    'Repagination reuses the measurement for the narrower marker',
  );

  const filePath = path.join(directory, 'marker-width-threshold.byzx');
  await mutate('save_document', { filePath });
  const privateDoc = await call('open_document', {
    documentScope: 'private',
    filePath,
  });
  const privateArgs = {
    documentScope: 'private',
    documentId: privateDoc.documentId,
  };
  for (const document of [args, privateArgs]) {
    const pages = await call('get_pages', document);
    assert.equal(pages.pageCount, 2);
    const secondPage = await call('get_page_elements', {
      ...document,
      pageNumber: 2,
    });
    assert.ok(
      secondPage.occurrences.some(
        (entry) => entry.region === 'staff' && entry.index === 1,
      ),
    );
    const preview = await call('preview_page', {
      ...document,
      expectedRevision: pages.revision,
      pageNumber: 2,
    });
    const png = await readFile(preview.outputFilePath);
    const output = path.join(directory, 'marker-width-threshold-page-2.png');
    if (document === args) {
      await writeFile(output, png);
    } else {
      assert.deepEqual(png, await readFile(output));
    }
  }
  const coldPath = path.join(directory, 'marker-width-threshold-cold.byzx');
  const cold = JSON.parse(await readFile(filePath, 'utf8'));
  cold.staff.elements[1].height = wide * 10;
  await writeFile(coldPath, JSON.stringify(cold));
  const reopened = await call('open_document', {
    documentScope: 'editor',
    filePath: coldPath,
  });
  await call('get_pages', {
    documentScope: 'editor',
    documentId: reopened.documentId,
  });
  await assertSettled();

  // Allow the wide label to fit in a fresh run on the reopened score.
  const reopenedArgs = {
    documentScope: 'editor',
    documentId: reopened.documentId,
  };
  await call('update_page_setup', {
    ...reopenedArgs,
    expectedRevision: (await call('get_document_properties', reopenedArgs))
      .revision,
    changes: { pageHeightCustom: thresholdHeight + (wide - oneLine) },
  });
  await call('get_pages', reopenedArgs);
  const returned = await geometry();
  assert.equal(returned.page, 1);
  assert.equal(returned.height, wide);
  assert.equal(returned.marker.label, '10');
  assert.ok(Math.abs(returned.marker.width - probe.widths[1]) < 0.001);
  const first = (await call('get_elements', reopenedArgs)).elements[0];
  const spacerHeight = 3 * oneLine;
  await call('edit_elements', {
    ...reopenedArgs,
    expectedRevision: (await call('get_document_properties', reopenedArgs))
      .revision,
    actions: [
      {
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: first.elementRef,
        properties: { marginBottom: spacerHeight },
      },
      {
        action: 'insert',
        index: 2,
        elements: [
          {
            elementType: 'TextBox',
            properties: { content: 'Spacer', customHeight: spacerHeight },
          },
          {
            elementType: 'RichTextBox',
            clientId: 'downstream',
            properties: { content },
          },
        ],
      },
      reference('downstream'),
    ],
  });
  // Page 1 can fit its anchor and A at one line. Page 2 can fit A, the
  // spacer and B only after A shrinks to one line with its restarted 9.
  await call('update_page_setup', {
    ...reopenedArgs,
    expectedRevision: (await call('get_document_properties', reopenedArgs))
      .revision,
    changes: { pageHeightCustom: thresholdHeight + spacerHeight },
  });
  await call('get_pages', reopenedArgs);
  const downstream = await evaluate(`(() => {
    const elements = window._editor.score.value.staff.elements;
    return [elements[1], elements[3]].map(box => [
      box.page, box.height, Object.values(box.footnoteMarkers)[0].label,
    ]);
  })()`);
  assert.deepEqual(downstream, [
    [2, oneLine, '9'],
    [2, oneLine, '10'],
  ]);
  console.log('PASS: the downstream box returns after the moved box shrinks');
  const updateReopened = async (tool, changes) =>
    call(tool, {
      ...reopenedArgs,
      expectedRevision: (await call('get_document_properties', reopenedArgs))
        .revision,
      ...changes,
    });
  await updateReopened('update_page_setup', {
    changes: { pageHeightCustom: 900 },
  });
  const threshold = (await call('get_elements', reopenedArgs)).elements[1];
  // Leave room for the drop cap's full reserved span. Only its actual
  // paragraph lines should be grouped with it for remembered page breaks.
  const marginBottom = 100;
  await updateReopened('edit_elements', {
    actions: [
      { action: 'remove_range', start: 2, end: 4 },
      {
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: threshold.elementRef,
        properties: { marginBottom },
      },
      {
        action: 'insert',
        index: 1,
        elements: [
          { elementType: 'DropCap', properties: { lineSpan: 2 } },
          { elementType: 'Note', properties: { lineBreak: true } },
        ],
      },
    ],
  });
  const cap = await evaluate(`(() => {
    const [anchor, dropCap, note, box] = window._editor.score.value.staff.elements;
    return {
      span: dropCap.computedLineSpan, sameLine: dropCap.line === note.line,
      boxLine: box.line - note.line, addedHeight: box.y - anchor.y - anchor.height,
      label: Object.values(box.footnoteMarkers)[0].label,
    };
  })()`);
  assert.deepEqual(
    [cap.span, cap.sameLine, cap.boxLine, cap.label],
    [2, true, 1, '10'],
  );
  await updateReopened('update_page_setup', {
    changes: {
      pageHeightCustom: thresholdHeight + cap.addedHeight + marginBottom,
    },
  });
  await call('get_pages', reopenedArgs);
  const afterDropCap = await evaluate(`(() => {
    const [, dropCap, note, box] = window._editor.score.value.staff.elements;
    return [dropCap.page, note.page, box.page, box.height, Object.values(box.footnoteMarkers)[0].label];
  })()`);
  assert.deepEqual(afterDropCap, [1, 1, 2, oneLine, '9']);
  console.log(
    'PASS: a short drop-cap paragraph leaves the next paragraph free to retain its break',
  );
  console.log(
    'PASS: 10 wraps and moves offscreen, 9 shrinks on page 2, and a fresh run can move back',
  );
}
