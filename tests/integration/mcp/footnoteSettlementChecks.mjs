import assert from 'node:assert/strict';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
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
          },
        },
      ],
    })),
  ]);
  const entries = (
    await call('get_elements', { ...args, includeContent: true })
  ).elements;
  const ids = entries
    .slice(0, 6)
    .map(
      (entry) =>
        entry.properties.content.match(/data-footnote-id="([^"]+)"/)[1],
    );
  const geometry = () =>
    evaluate(`(() => {
    const w=window._editor.selectedWorkspace.value;
    return {main:w.score.staff.elements.filter(e=>e.elementType!=='Empty').map(e=>({id:e.id,page:e.page,line:e.line,x:e.x,width:e.width,height:e.height})), bodies:w.score.footnotes.map(f=>({id:f.id,elements:f.staff.elements.filter(e=>e.elementType!=='Empty').map(e=>({page:e.page,line:e.line,x:e.x,width:e.width,height:e.height}))}))};
  })()`);
  let baseline = await geometry();
  const baselineWidth = baseline.bodies[0].elements[0].width;
  // A short, ordinary custom label widens the shared gutter enough to rewrap bodies.
  await edit([
    { action: 'update_footnote', footnoteId: ids[0], marker: '[Note]' },
  ]);
  const sample = await geometry();
  const wrappingText = await evaluate(`(() => {
    const p=document.querySelector('.line[data-footnote-id] .ck-content p');
    const style=getComputedStyle(p), context=document.createElement('canvas').getContext('2d');
    context.font=style.fontStyle+' '+style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
    const target=(${baselineWidth}+${sample.bodies[0].elements[0].width})/2;
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
    { action: 'update_footnote', footnoteId: ids[0], marker: null },
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
  const widened = await geometry();
  assert.ok(
    widened.bodies[0].elements[0].width < baselineWidth,
    'Displayed custom labels widen the gutter',
  );
  assert.ok(
    widened.bodies.some(
      (body, i) =>
        body.elements[0].height > baseline.bodies[i].elements[0].height,
    ),
    'The changed gutter rewraps at least one footnote body',
  );
  const stable = await call('get_pages', args);
  await eventually(async () => assert.deepEqual(await geometry(), widened));
  assert.equal((await call('get_pages', args)).layoutId, stable.layoutId);
  await edit([{ action: 'update_footnote', footnoteId: ids[0], marker: null }]);
  const restored = await geometry();
  assert.ok(
    restored.bodies[0].elements[0].width > widened.bodies[0].elements[0].width,
    'A new content operation can reclaim the gutter',
  );
  assert.ok(
    restored.bodies.some(
      (body, i) =>
        body.elements[0].height < widened.bodies[i].elements[0].height,
    ),
    'A new operation can reclaim body height',
  );

  await settings({ firstFootnoteNumber: 1000 });
  const settingsWide = await geometry();
  assert.ok(
    settingsWide.bodies[0].elements[0].width <
      restored.bodies[0].elements[0].width,
  );
  await settings({ firstFootnoteNumber: 9 });
  assert.ok(
    (await geometry()).bodies[0].elements[0].width >
      settingsWide.bodies[0].elements[0].width,
    'Settings changes release reservations',
  );
  const numbering = await evaluate(`(() => {
    const w=window._editor.selectedWorkspace.value;
    return w.score.staff.elements.filter(e=>e.elementType==='RichTextBox').map(e=>({page:e.page, marker:e.footnoteMarkers[Object.keys(e.footnoteMarkers).find(id=>e.content.includes(id))]}));
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
  const editorPages = await call('get_pages', args);
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
    'PASS: page numbering and rich-text wrapping, actual-label gutters, reservation reset, editor/private-worker/export agreement',
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
  // Fit at the final '*' gutter, but wrap at the provisional '***' gutter.
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
