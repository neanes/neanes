import assert from 'node:assert/strict';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';

import { eventually } from './smokePolling.mjs';

export async function checkFootnoteMarkers(call, evaluate, directory) {
  let naturalGap;
  let naturalMetrics;
  for (const scenario of [
    { name: 'natural', count: 8, anchor: 1, width: 600 },
    { name: 'justified', count: 40, anchor: 1, width: 500 },
    { name: 'tight-break', count: 4, anchor: 3, width: 600 },
    { name: 'line-end', count: 40, anchor: 8, width: 500 },
    { name: 'centered', count: 3, anchor: 2, width: 600, centered: true },
    { name: 'rtl', count: 8, anchor: 1, width: 600, rtl: true },
  ]) {
    const width =
      scenario.name === 'tight-break'
        ? 100 +
          naturalMetrics.neumeWidth * 4 +
          naturalGap * 4 +
          naturalMetrics.markerWidth * 0.1
        : scenario.width;
    let doc = await call('create_document', {
      documentScope: 'editor',
      title: `Footnote marker: ${scenario.name}`,
    });
    const args = { documentScope: 'editor', documentId: doc.documentId };
    doc = await call('update_page_setup', {
      ...args,
      expectedRevision: doc.revision,
      changes: {
        pageSize: 'Custom',
        pageWidthCustom: width,
        pageHeightCustom: 900,
        leftMargin: 50,
        rightMargin: 50,
        topMargin: 50,
        bottomMargin: 50,
        lineHeight: 70,
        melkiteRtl: scenario.rtl ?? false,
      },
    });
    const initial = await call('get_elements', args);
    await call('edit_elements', {
      ...args,
      expectedRevision: doc.revision,
      actions: [
        { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
        {
          action: 'insert',
          elements: Array.from({ length: scenario.count }, (_, index) => ({
            elementType: 'Note',
            clientId: `n${index}`,
            properties: {
              quantitativeNeume: 'Ison',
              ...(scenario.centered && index === scenario.count - 1
                ? { lineBreak: true, lineBreakType: 'Center' }
                : {}),
            },
          })),
        },
        {
          action: 'insert_footnote',
          elementRef: `@n${scenario.anchor}`,
          elements: [
            {
              elementType: 'TextBox',
              properties: {
                content: 'A footnote with a parenthesized reference.',
              },
            },
          ],
        },
      ],
    });
    await eventually(async () =>
      assert.equal(
        await evaluate(
          `document.querySelectorAll('.footnote-reference').length`,
        ),
        1,
      ),
    );
    const geometry = await evaluate(`(() => {
      const w = window._editor.selectedWorkspace.value;
      const notes = w.score.staff.elements.filter(n => n.elementType === 'Note');
      const reference = notes[${scenario.anchor}];
      const marker = document.getElementById('element-' + reference.id).querySelector('.footnote-reference');
      const page = marker.closest('.page').getBoundingClientRect();
      const rect = marker.getBoundingClientRect();
      const body = document.querySelector('.footnote-body-marker');
      const bodyStyle = getComputedStyle(body);
      const zoom = w.zoom;
      const rtl = w.score.pageSetup.melkiteRtl;
      const pairIndex = notes.findIndex((note, i) => note !== reference && notes[i + 1] && note.line === reference.line && notes[i + 1].line === reference.line && note.page === reference.page && notes[i + 1].page === reference.page);
      const ordinary = pairIndex < 0 ? ${naturalGap ?? 0} * zoom : (notes[pairIndex + 1].x - notes[pairIndex].x - notes[pairIndex].neumeWidth) * zoom;
      const end = rtl ? page.right - (reference.x + reference.neumeWidth) * zoom : page.left + (reference.x + reference.neumeWidth) * zoom;
      const next = notes[${scenario.anchor + 1}];
      const after = next && next.line === reference.line && next.page === reference.page ? (rtl ? rect.left - (page.right - next.x * zoom) : page.left + next.x * zoom - rect.right) : null;
      return { bodyLabel: body.textContent.trim(), bodyTag: body.tagName,
        bodyVerticalAlign: bodyStyle.verticalAlign,
        bodyFontSize: parseFloat(bodyStyle.fontSize) / zoom,
        neumeWidth: reference.neumeWidth, markerWidth: reference.footnoteMarkerWidth, referenceLine: reference.line, firstLine: notes[0].line, label: marker.textContent.trim(), ordinary, before: rtl ? end - rect.right : rect.left - end, after, zoom,
        center: (notes[0].x + reference.x + reference.width) / 2,
        pageCenter: w.score.pageSetup.pageWidth / 2,
        markerEnd: reference.x + reference.width,
        contentEnd: w.score.pageSetup.pageWidth - w.score.pageSetup.rightMargin };
    })()`);
    assert.equal(geometry.label, '(1)');
    assert.equal(geometry.bodyLabel, '1.');
    assert.equal(geometry.bodyTag, 'SPAN');
    assert.equal(geometry.bodyVerticalAlign, 'baseline');
    assert.ok(Math.abs(geometry.bodyFontSize - (10 * 96) / 72) < 0.01);
    assert.ok(
      Math.abs(geometry.before - geometry.ordinary) < 0.15,
      `${scenario.name}: ${JSON.stringify(geometry)}`,
    );
    if (geometry.after !== null) {
      assert.ok(
        Math.abs(geometry.after - geometry.ordinary) < 0.15,
        `${scenario.name}: ${JSON.stringify(geometry)}`,
      );
    }
    assert.ok(geometry.markerEnd <= geometry.contentEnd + 0.1);
    if (scenario.name === 'natural') {
      naturalGap = geometry.ordinary / geometry.zoom;
      naturalMetrics = geometry;
    }
    if (scenario.name === 'justified') {
      assert.ok(
        Math.abs(geometry.ordinary / geometry.zoom - naturalGap) > 0.05,
        'The marker gaps must participate in justification.',
      );
    }
    if (scenario.name === 'tight-break') {
      assert.ok(
        geometry.referenceLine > geometry.firstLine,
        'Move the neume and marker together when only the neume would fit.',
      );
    }
    if (scenario.centered) {
      assert.ok(Math.abs(geometry.center - geometry.pageCenter) < 0.1);
    }
    const ready = await call('get_document_properties', args);
    const preview = await call('preview_page', {
      ...args,
      expectedRevision: ready.revision,
      pageNumber: 1,
    });
    await copyFile(
      preview.outputFilePath,
      path.join(directory, `marker-${scenario.name}.png`),
    );
  }
  console.log(
    'PASS: parenthesized markers, ordinary gaps, justification, line endings, centered lines, and RTL',
  );
}
