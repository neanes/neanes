import assert from 'node:assert/strict';

import { createSmokeApp } from './smokeApp.mjs';
import { connectEditorClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-inline-rich-text-');
let client;
try {
  app.start({ args: ['--remote-debugging-port=0'] });
  const socket = await app.debugger();
  client = await connectEditorClient('inline-rich-text', await app.ready());
  const call = createToolCaller(client);
  const doc = await call('create_document', { title: 'Fill-width rich text' });
  const args = { documentId: doc.documentId };
  const initial = await call('get_elements', args);
  const { created, revision } = await call('edit_elements', {
    ...args,
    expectedRevision: doc.revision,
    actions: [
      { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
      {
        action: 'insert',
        elements: [
          { elementType: 'Note' },
          { elementType: 'Note' },
          {
            elementType: 'RichTextBox',
            properties: { inline: true, content: '<p>Short</p>' },
          },
          { elementType: 'Martyria', properties: { alignRight: true } },
          { elementType: 'Note' },
        ],
      },
    ],
  });
  const layout = () =>
    socket.evaluate(`(() => {
      const [first, second, box, martyria, next] =
        window._editor.score.value.staff.elements;
      return {
        sameLine: first.line === second.line && second.line === box.line &&
          box.line === martyria.line && next.line > martyria.line,
        fillsToMartyria: Math.abs(box.x + box.width - martyria.x) < 0.01,
        positions: [first.x, second.x, box.x, box.width, martyria.x],
      };
    })()`);
  const short = await layout();
  assert.ok(short.sameLine && short.fillsToMartyria, JSON.stringify(short));
  const longEdit = await call('edit_elements', {
    ...args,
    expectedRevision: revision,
    actions: [
      {
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: created[2].elementRef,
        properties: { content: `<p>${'Long inline text '.repeat(60)}</p>` },
      },
    ],
  });
  assert.deepEqual(await layout(), short);
  const centeredBreak = await call('edit_elements', {
    ...args,
    expectedRevision: longEdit.revision,
    actions: [
      {
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: created[2].elementRef,
        properties: {
          content: '<p>Centered break</p>',
          lineBreak: true,
          lineBreakType: 'Center',
        },
      },
    ],
  });
  const centeredLine = await socket.evaluate(`(() => {
    const { staff, pageSetup } = window._editor.score.value;
    const [first, second, box, martyria] = staff.elements;
    return {
      sameLine: first.line === second.line && second.line === box.line &&
        box.line < martyria.line,
      leftGap: first.x - pageSetup.leftMargin,
      rightGap: pageSetup.pageWidth - pageSetup.rightMargin - box.x - box.width,
    };
  })()`);
  assert.ok(centeredLine.sameLine, JSON.stringify(centeredLine));
  assert.ok(centeredLine.leftGap > 0, JSON.stringify(centeredLine));
  assert.ok(
    Math.abs(centeredLine.leftGap - centeredLine.rightGap) < 0.01,
    JSON.stringify(centeredLine),
  );

  const centeredPage = await call('edit_elements', {
    ...args,
    expectedRevision: centeredBreak.revision,
    actions: [
      {
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: created[2].elementRef,
        properties: {
          content: '<p style="text-align:center;">Top centered text</p>',
          contentBottom:
            '<p style="text-align:center;">Bottom centered text</p>',
          lineBreak: false,
          lineBreakType: null,
          centerOnPage: true,
        },
      },
    ],
  });
  const checkPageCenter = () =>
    eventually(async () => {
      const geometry = await socket.evaluate(`(() => {
        const { staff, pageSetup } = window._editor.score.value;
        const box = staff.elements.find(e => e.elementType === 'RichTextBox');
        const wrapper = document.getElementById('element-' + box.id);
        const zoom = Number(getComputedStyle(wrapper).getPropertyValue('--zoom'));
        const center = wrapper.getBoundingClientRect().left +
          (pageSetup.leftMargin + pageSetup.innerPageWidth / 2 - box.x) * zoom;
        const textCenter = (selector) => {
          const range = document.createRange();
          range.selectNodeContents(wrapper.querySelector(selector));
          const rect = range.getBoundingClientRect();
          return rect.left + rect.width / 2;
        };
        return {
          boxX: box.x,
          boxWidth: box.width,
          editorWidth: wrapper.querySelector('.ck-content.inline-top')
            .getBoundingClientRect().width / zoom,
          center,
          top: textCenter('.ck-content.inline-top p'),
          bottom: textCenter('.ck-content.inline-bottom p'),
        };
      })()`);
      assert.ok(
        Math.abs(geometry.top - geometry.center) < 1 &&
          Math.abs(geometry.bottom - geometry.center) < 1 &&
          Math.abs(geometry.editorWidth - geometry.boxWidth) < 1,
        JSON.stringify(geometry),
      );
      return geometry.boxX;
    });
  const originalBoxX = await checkPageCenter();
  const reflow = await call('edit_elements', {
    ...args,
    expectedRevision: centeredPage.revision,
    actions: [
      {
        action: 'update',
        elementType: 'Note',
        elementRef: created[1].elementRef,
        properties: { spaceAfter: 20 },
      },
    ],
  });
  assert.notEqual(await checkPageCenter(), originalBoxX);

  const atLeftMargin = await call('edit_elements', {
    ...args,
    expectedRevision: reflow.revision,
    actions: created.slice(0, 2).map(({ elementRef }) => ({
      action: 'remove',
      elementRef,
    })),
  });
  await checkPageCenter();
  await socket.send('Page.bringToFront');
  await eventually(async () => {
    const hit = await socket.evaluate(`(() => {
      const [box, martyria] = window._editor.score.value.staff.elements;
      const editable = document.getElementById('element-' + box.id)
        .querySelector('.ck-content.inline-top');
      const marker = document.getElementById('element-' + martyria.id);
      editable.ckeditorInstance.editing.view.focus();

      const neumeBox = marker.querySelector('.neume-box');
      // Focusing the editor can scroll the right-aligned martyria out of view.
      neumeBox.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
      const markerRect = neumeBox.getBoundingClientRect();
      const editorRect = editable.getBoundingClientRect();
      const x = (markerRect.left + markerRect.right) / 2;
      const overlapTop = Math.max(markerRect.top, editorRect.top);
      const overlapBottom = Math.min(markerRect.bottom, editorRect.bottom);
      const y = (overlapTop + overlapBottom) / 2;
      const target = document.elementFromPoint(x, y);
      return {
        focused: editable.classList.contains('ck-focused'),
        overlapsVertically: overlapTop < overlapBottom,
        hitsMartyria: marker.contains(target),
      };
    })()`);
    assert.ok(
      hit.focused && hit.overlapsVertically && hit.hitsMartyria,
      JSON.stringify(hit),
    );
  });

  // A narrow fixed-width box can end before the page midpoint.
  await call('edit_elements', {
    ...args,
    expectedRevision: atLeftMargin.revision,
    actions: [
      {
        action: 'update',
        elementType: 'RichTextBox',
        elementRef: created[2].elementRef,
        properties: { customWidth: 80 },
      },
    ],
  });
  await checkPageCenter();

  console.log(
    'Fill-width rich text preserves musical layout and supports both centering controls.',
  );
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  try {
    await client?.close();
  } finally {
    await app.close();
  }
}
