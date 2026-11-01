// Launch outside the agent sandbox on macOS. Uses a disposable Electron profile.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { createSmokeApp } from './smokeApp.mjs';
import { connectStdioClient, createToolCaller } from './smokeClient.mjs';
import { eventually } from './smokePolling.mjs';

const app = await createSmokeApp('neanes-footnote-body-alignment-', {
  keepArtifacts: true,
});
let client;
try {
  app.start({ args: ['--remote-debugging-port=0'] });
  const socket = await app.debugger();
  const { evaluate } = socket;
  await app.ready();
  client = await connectStdioClient('footnote-body-alignment', {
    profile: app.profile,
  });
  const call = createToolCaller(client, (await client.listTools()).tools);
  const doc = await call('create_document', {
    documentScope: 'editor',
    title: 'Footnote body alignment',
  });
  const args = { documentScope: 'editor', documentId: doc.documentId };
  const initial = await call('get_elements', args);
  await call('edit_elements', {
    ...args,
    expectedRevision: initial.revision,
    actions: [
      { action: 'remove_range', start: 0, end: initial.collectionSize - 1 },
      {
        action: 'insert',
        elements: [
          { elementType: 'Note', clientId: 'text' },
          { elementType: 'Note', clientId: 'neumes' },
        ],
      },
      {
        action: 'insert_footnote',
        elementRef: '@text',
        elements: [
          {
            elementType: 'RichTextBox',
            properties: {
              content:
                '<p class="neanes-paragraph-style-footnote-text">This is a test</p>',
            },
          },
        ],
      },
      {
        action: 'insert_footnote',
        elementRef: '@neumes',
        elements: [
          { elementType: 'Note', properties: { quantitativeNeume: 'Oligon' } },
          { elementType: 'Note', properties: { quantitativeNeume: 'Oligon' } },
        ],
      },
    ],
  });
  const geometry = () =>
    evaluate(`(() => {
    const labels = [...document.querySelectorAll('.page .footnote-label')];
    return labels.map(label => {
      const line = document.querySelector('.page .line[data-footnote-id="'+label.dataset.footnoteId+'"]');
      const content = line.querySelector('.ck-content p') ?? line.querySelector('.neume');
      const marker = label.querySelector('.footnote-body-marker');
      const probe = document.createElement('div');
      const css = getComputedStyle(content);
      for (const key of ['fontFamily','fontSize','fontWeight','fontStyle','lineHeight']) probe.style[key] = css[key];
      Object.assign(probe.style, {position:'absolute',visibility:'hidden',whiteSpace:'nowrap',top:'0px',left:'0px'});
      probe.append(document.createTextNode('This is a test'));
      const sup = document.createElement('sup');
      sup.style.cssText = marker.style.cssText;
      // Rich editors scale their entire DOM; neumes use scaled font sizes.
      if (content.closest('.ck-content')) {
        sup.style.fontSize = parseFloat(getComputedStyle(marker).fontSize) / window._editor.selectedWorkspace.value.zoom + 'px';
      }
      const span = document.createElement('span');
      span.textContent = marker.textContent;
      span.style.display = 'inline-block';
      span.style.lineHeight = '1';
      sup.append(span);
      probe.append(sup);
      content.parentElement.append(probe);
      const expected = content.getBoundingClientRect().top + span.getBoundingClientRect().top - probe.getBoundingClientRect().top;
      const actual = marker.firstElementChild.getBoundingClientRect().top;
      const result = {actual, expected, delta: actual-expected, font: css.fontFamily, size:css.fontSize, height:css.lineHeight, labelHeight:getComputedStyle(label).lineHeight};
      probe.remove();
      return result;
    });
  })()`);
  for (const zoom of [0.75, 1.5, 1]) {
    await evaluate(`window._editor.selectedWorkspace.value.zoom = ${zoom}`);
    await eventually(async () => {
      const result = await geometry();
      assert.equal(result.length, 2);
      for (const entry of result) {
        assert.ok(Math.abs(entry.delta) < 1, JSON.stringify(result));
      }
    });
  }
  const clip = await evaluate(`(() => {
    const labels = [...document.querySelectorAll('.page .footnote-label')];
    labels[0].scrollIntoView({block: 'center'});
    const first = labels[0].getBoundingClientRect();
    const last = labels.at(-1).getBoundingClientRect();
    return {x:first.left-10, y:first.top-20, width:400, height:last.bottom-first.top+60, scale:1};
  })()`);
  const screenshot = await socket.send('Page.captureScreenshot', {
    format: 'png',
    clip,
    captureBeyondViewport: true,
  });
  await writeFile(
    path.join(app.directory, 'body-alignment.png'),
    Buffer.from(screenshot.data, 'base64'),
  );
  console.log(
    `PASS: footnote text and neume markers match inline superscript placement. Artifacts: ${app.directory}`,
  );
} catch (error) {
  console.error(app.log());
  throw error;
} finally {
  await client?.close();
  await app.close();
}
