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
        ? 100 + naturalMetrics.neumeWidth * 4 + naturalGap * 3 + 1
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
      ],
    });
    const notePositions = () =>
      evaluate(
        `window._editor.selectedWorkspace.value.score.staff.elements.filter(n => n.elementType === 'Note').map(n => ({x:n.x,width:n.width,line:n.line}))`,
      );
    const beforePositions = await notePositions();
    const readyBefore = await call('get_document_properties', args);
    await call('edit_elements', {
      ...args,
      expectedRevision: readyBefore.revision,
      actions: [
        {
          action: 'insert_footnote',
          elementRef: (await call('get_elements', args)).elements[
            scenario.anchor
          ].elementRef,
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
        neumeWidth: reference.neumeWidth, markerWidth: rect.width / zoom, referenceLine: reference.line, firstLine: notes[0].line, markerTop: reference.footnoteMarkerTop, markerCenter: (rect.left+rect.right)/2, neumeCenter: rtl ? page.right-(reference.x+reference.neumeWidth/2)*zoom : page.left+(reference.x+reference.neumeWidth/2)*zoom, label: marker.textContent.trim(), ordinary, before: rtl ? end - rect.right : rect.left - end, after, zoom,
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
      Math.abs(geometry.markerCenter - geometry.neumeCenter) < 1,
      `${scenario.name}: marker centered above neume`,
    );
    assert.deepEqual(
      await notePositions(),
      beforePositions,
      `${scenario.name}: unobstructed footnote must not affect horizontal layout`,
    );
    if (scenario.name === 'natural') {
      naturalGap = geometry.ordinary / geometry.zoom;
      naturalMetrics = geometry;
    }
    if (scenario.name === 'tight-break') {
      assert.equal(
        geometry.referenceLine,
        geometry.firstLine,
        'The marker does not force a fitting note onto another line',
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
    'PASS: centered unobstructed markers without extra horizontal spacing, natural/justified spacing, tight lines, centered lines, and RTL',
  );
}

export async function checkFootnoteMarkerCollisionSpacing(
  call,
  evaluate,
  verifyOverride,
) {
  for (const rtl of [false, true]) {
    for (const scenario of [
      {
        bar: 'MeasureBarRight',
        edge: 'measureBarRight',
        anchor: 0,
        offsetY: 0.1,
      },
      { bar: 'MeasureBarShortDouble', edge: 'measureBarRight', anchor: 0 },
      { bar: 'MeasureBarShortDouble', edge: 'measureBarLeft', anchor: 1 },
      { bar: 'MeasureBarShortTheseos', edge: 'measureBarRight', anchor: 0 },
      { bar: 'MeasureBarShortTheseos', edge: 'measureBarRight', anchor: 1 },
    ]) {
      const doc = await call('create_document', {
        documentScope: 'editor',
        title: `Marker barline clearance: ${scenario.edge}, ${scenario.anchor}, RTL=${rtl}`,
      });
      const args = { documentScope: 'editor', documentId: doc.documentId };
      const edit = async (actions) =>
        call('edit_elements', {
          ...args,
          expectedRevision: (await call('get_document_properties', args))
            .revision,
          actions,
        });
      await call('update_page_setup', {
        ...args,
        expectedRevision: doc.revision,
        changes: {
          melkiteRtl: rtl,
          neumeDefaultFontFamily: rtl ? 'NeanesRTL' : 'Neanes',
        },
      });
      const initial = await call('get_elements', args);
      await edit([
        { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
        {
          action: 'insert',
          elements: [0, 1].map((index) => ({
            elementType: 'Note',
            clientId: `n${index}`,
            properties: {
              quantitativeNeume: 'Apostrophos',
              ...(index === scenario.anchor
                ? { footnoteOffsetY: scenario.offsetY ?? 0 }
                : {}),
              ...(index === (scenario.edge === 'measureBarRight' ? 0 : 1)
                ? { [scenario.edge]: scenario.bar }
                : {}),
            },
          })),
        },
        {
          action: 'insert_footnote',
          elementRef: `@n${scenario.anchor}`,
        },
      ]);
      const notes = (await call('get_elements', args)).elements;
      const anchor = notes[scenario.anchor];
      await edit([
        {
          action: 'update_footnote',
          footnoteId: anchor.properties.footnoteId,
          marker: '††',
        },
      ]);
      const distance = () =>
        evaluate(`(() => {
          const n=window._editor.selectedWorkspace.value.score.staff.elements;
          return n[1].x-n[0].x;
        })()`);
      const collidingDistance = await distance();
      await edit([
        {
          action: 'update',
          elementType: 'Note',
          elementRef: anchor.elementRef,
          properties: { footnoteOffsetY: -2 },
        },
      ]);
      const clearDistance = await distance();
      assert.ok(
        Math.abs(collidingDistance - clearDistance) < 0.01,
        `${scenario.bar}, ${scenario.edge}, anchor ${scenario.anchor}, RTL=${rtl}: marker placement preserves horizontal spacing (${collidingDistance}, ${clearDistance})`,
      );
      await edit([
        {
          action: 'update',
          elementType: 'Note',
          elementRef: anchor.elementRef,
          properties: { footnoteOffsetY: scenario.offsetY ?? 0 },
        },
      ]);
      assert.ok(
        Math.abs((await distance()) - collidingDistance) < 0.01,
        'Restoring the marker preserves horizontal spacing',
      );

      const markerClearance = () =>
        evaluate(`(() => {
        const bounds = element => {
          const style=getComputedStyle(element), rect=element.getBoundingClientRect();
          const context=document.createElement('canvas').getContext('2d');
          context.font=style.fontStyle+' '+style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
          context.fontVariantCaps=style.fontVariantCaps;
          const ink=context.measureText(element.textContent.trim()), stroke=parseFloat(style.webkitTextStrokeWidth)/2;
          const probe=document.createElement('span');
          probe.style.cssText='display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
          element.appendChild(probe);
          const baseline=probe.getBoundingClientRect().top;
          probe.remove();
          return {left:rect.left-ink.actualBoundingBoxLeft-stroke, right:rect.left+ink.actualBoundingBoxRight+stroke, top:baseline-ink.actualBoundingBoxAscent-stroke, bottom:baseline+ink.actualBoundingBoxDescent+stroke};
        };
        const markers=[...document.querySelectorAll('.page .footnote-reference')].map(bounds);
        const glyphs=[...document.querySelectorAll('.page .neume-box span.neume')].map(bounds);
        const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>0.5 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>0.5;
        return markers.flatMap((marker,i)=>[...glyphs, ...markers.slice(i+1)].filter(other=>overlap(marker,other)).map(other=>({marker,other})));
      })()`);
      await eventually(async () =>
        assert.deepEqual(
          await markerClearance(),
          [],
          `Markers clear neighboring glyphs and other markers: ${JSON.stringify(scenario)}, RTL=${rtl}`,
        ),
      );

      await verifyOverride(anchor, rtl);

      // The same shared geometry handles neighboring neumes and other markers.
      if (scenario.bar === 'MeasureBarShortDouble' && scenario.anchor === 0) {
        await edit([
          {
            action: 'update',
            elementType: 'Note',
            elementRef: notes[0].elementRef,
            properties: { measureBarRight: null },
          },
          {
            action: 'update',
            elementType: 'Note',
            elementRef: notes[1].elementRef,
            properties: { quantitativeNeume: 'OligonPlusHypsiliRight' },
          },
        ]);
        // A normal manual offset places this short marker over the next note.
        const neighborOffset = await evaluate(`(() => {
          const w=window._editor.selectedWorkspace.value, n=w.score.staff.elements;
          return (${rtl ? -1 : 1})*(n[1].x-n[0].x)/w.score.pageSetup.neumeDefaultFontSize;
        })()`);
        const tallOffset = await evaluate(`(() => {
          const w=window._editor.selectedWorkspace.value, n=w.score.staff.elements;
          const marker=document.querySelector('.footnote-reference').getBoundingClientRect();
          const glyph=document.querySelector('#element-'+n[1].id+' .neume-box span.neume').getBoundingClientRect();
          return (glyph.right-2-(marker.left+marker.right)/2)/w.score.pageSetup.neumeDefaultFontSize;
        })()`);
        await edit([
          {
            action: 'update',
            elementType: 'Note',
            elementRef: anchor.elementRef,
            properties: {
              footnoteOffsetX: tallOffset,
              footnoteOffsetY: 0.4,
            },
          },
        ]);
        await eventually(async () =>
          assert.deepEqual(await markerClearance(), []),
        );
        await verifyOverride(anchor, rtl);
        const neumeDistance = await distance();
        await edit([
          {
            action: 'update',
            elementType: 'Note',
            elementRef: anchor.elementRef,
            properties: { footnoteOffsetY: -2 },
          },
        ]);
        assert.ok(Math.abs(neumeDistance - (await distance())) < 0.01);
        await eventually(async () =>
          assert.deepEqual(await markerClearance(), []),
        );
        await edit([
          {
            action: 'update',
            elementType: 'Note',
            elementRef: notes[1].elementRef,
            properties: { quantitativeNeume: 'Apostrophos' },
          },
          {
            action: 'insert_footnote',
            elementRef: notes[1].elementRef,
          },
          {
            action: 'update',
            elementType: 'Note',
            elementRef: anchor.elementRef,
            properties: { footnoteOffsetY: 0 },
          },
        ]);
        const secondAnchor = (await call('get_elements', args)).elements[1];
        await edit([
          {
            action: 'update_footnote',
            footnoteId: secondAnchor.properties.footnoteId,
            marker: '††',
          },
        ]);
        // Place two realistic reference markers at the same horizontal center.
        await edit([
          {
            action: 'update',
            elementType: 'Note',
            elementRef: anchor.elementRef,
            properties: {
              footnoteOffsetX: neighborOffset / 2,
              footnoteOffsetY: 0,
            },
          },
          {
            action: 'update',
            elementType: 'Note',
            elementRef: secondAnchor.elementRef,
            properties: {
              footnoteOffsetX: -neighborOffset / 2,
              footnoteOffsetY: 0,
            },
          },
        ]);
        await eventually(async () =>
          assert.deepEqual(await markerClearance(), []),
        );
        await verifyOverride(secondAnchor, rtl);
        const markerDistance = await distance();
        await edit([
          {
            action: 'update',
            elementType: 'Note',
            elementRef: anchor.elementRef,
            properties: { footnoteOffsetY: -2 },
          },
        ]);
        assert.ok(Math.abs(markerDistance - (await distance())) < 0.01);
        await eventually(async () =>
          assert.deepEqual(await markerClearance(), []),
        );
      }
    }
  }
  console.log(
    'PASS: markers clear barlines, neighboring neumes, and other markers without changing horizontal layout in LTR and RTL',
  );
}
