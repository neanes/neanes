import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';

const directory = process.argv[2];
const token = process.env.NEANES_MCP_TOKEN;
assert.ok(directory && path.isAbsolute(directory) && token);
const client = new Client({
  name: 'neanes-background-style-smoke',
  version: '1.0.0',
});
await client.connect(
  new StreamableHTTPClientTransport(
    new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp'),
    { requestInit: { headers: { Authorization: `Bearer ${token}` } } },
  ),
);
async function call(name, args = {}) {
  const reply = await client.callTool({ name, arguments: args });
  assert.ok(!reply.isError, JSON.stringify(reply));
  return reply.structuredContent.result;
}
async function settledDocument(documentId) {
  let previous;
  for (let attempt = 0; attempt < 100; attempt++) {
    const current = await readScoreSnapshot(call, { documentId });
    if (current.revision === previous?.revision) {
      return current;
    }
    previous = current;
    await setTimeout(50);
  }
  throw new Error('Document did not settle.');
}
function heights(score) {
  return [
    score.staff.elements[0].height,
    score.staff.elements[1].height,
    score.staff.elements[2].height,
    score.headers.default.elements[0].height,
    score.footers.default.elements[0].height,
  ];
}
try {
  const initial = await call('list_documents');
  const suffix = Date.now();
  const seed = await call('create_document');
  const seedPath = path.join(directory, `style-seed-${suffix}.byzx`);
  await call('save_document', {
    documentId: seed.documentId,
    expectedRevision: seed.revision,
    filePath: seedPath,
  });
  const score = JSON.parse(await fs.readFile(seedPath, 'utf8'));
  score.paragraphStyles.push({
    id: 'body-copy',
    displayName: 'Body Copy',
    parentStyleId: 'default-text',
    fontFamily: 'Source Serif',
    fontSize: 16,
  });
  score.paragraphStyles.push({
    id: 'body-child',
    displayName: 'Body Child',
    parentStyleId: 'body-copy',
  });
  const content =
    'LONG WRAPPING TEXT FOR DETERMINISTIC TYPOGRAPHY MEASUREMENT. '.repeat(2);
  const rich = {
    elementType: 'RichTextBox',
    content: `<p class="neanes-paragraph-style-body-child">${content}</p>`,
    height: 1,
  };
  score.staff.elements.unshift(
    {
      elementType: 'TextBox',
      content,
      paragraphStyleId: 'body-child',
      height: 1,
    },
    rich,
    {
      elementType: 'RichTextBox',
      multipanel: true,
      contentLeft: '<p>Left</p>',
      contentCenter: `<p class="neanes-paragraph-style-body-child">${content}</p>`,
      contentRight: '<p>Right</p>',
      height: 1,
    },
  );
  score.pageSetup.showHeader = true;
  score.pageSetup.showFooter = true;
  score.headers.default.elements = [
    {
      ...structuredClone(rich),
      content: '<p class="neanes-paragraph-style-body-child">Header height</p>',
    },
  ];
  score.footers.default.elements = [
    {
      ...structuredClone(rich),
      content: '<p class="neanes-paragraph-style-body-child">Footer height</p>',
    },
  ];
  const backgroundPath = path.join(
    directory,
    `style-background-${suffix}.byzx`,
  );
  const foregroundPath = path.join(
    directory,
    `style-foreground-${suffix}.byzx`,
  );
  await fs.writeFile(backgroundPath, JSON.stringify(score));
  await fs.writeFile(foregroundPath, JSON.stringify(score));
  const background = await call('open_document', { filePath: backgroundPath });
  const foreground = await call('open_document', { filePath: foregroundPath });
  async function enlarge(documentId, fontSize = 40, overrides = {}) {
    const styles = await call('get_paragraph_styles', { documentId });
    const style = styles.styles.find((style) => style.id === 'body-copy');
    return call('edit_paragraph_styles', {
      documentId,
      expectedRevision: styles.revision,
      changes: [
        {
          action: 'replace',
          style: {
            ...style,
            overrides: {
              ...style.overrides,
              fontSize,
              fontVariantCaps: null,
              textDecoration: null,
              ...overrides,
            },
          },
        },
      ],
    });
  }
  await enlarge(foreground.documentId, 20, {
    fontVariantCaps: 'all-small-caps',
    textDecoration: 'underline',
  });
  const beforeForeground = await settledDocument(foreground.documentId);
  const foregroundHeights = heights(beforeForeground.score);
  const beforeBackground = await readScoreSnapshot(call, {
    documentId: background.documentId,
  });
  const backgroundChanged = await enlarge(background.documentId);
  const backgroundSaved = await call('save_document', {
    documentId: background.documentId,
    expectedRevision: backgroundChanged.revision,
  });
  assert.equal(backgroundSaved.savedContentUnchanged, true);
  assert.equal(
    (await call('list_documents')).find((document) => document.selected)
      .documentId,
    foreground.documentId,
  );
  const unchangedForeground = await settledDocument(foreground.documentId);
  assert.deepEqual(
    heights(unchangedForeground.score),
    foregroundHeights,
    'Background styles must not affect the visible workspace CSS or heights.',
  );
  const backgroundScore = JSON.parse(await fs.readFile(backgroundPath, 'utf8'));
  assert.equal(
    backgroundScore.staff.elements[1].content,
    beforeBackground.score.staff.elements[1].content,
    'Measurement must not rewrite rich-text content.',
  );
  const backgroundHeights = heights(backgroundScore);
  assert.ok(
    backgroundHeights.every((height) => Number.isFinite(height) && height > 40),
    JSON.stringify(backgroundHeights),
  );
  assert.ok(
    backgroundHeights[2] >= backgroundHeights[1],
    'The multipanel center must contribute to the measured height.',
  );
  await enlarge(foreground.documentId);
  const currentForeground = await settledDocument(foreground.documentId);
  await call('save_document', {
    documentId: foreground.documentId,
    expectedRevision: currentForeground.revision,
  });
  const foregroundScore = JSON.parse(await fs.readFile(foregroundPath, 'utf8'));
  const updatedForegroundHeights = heights(foregroundScore);
  for (let index = 0; index < backgroundHeights.length; index++) {
    assert.ok(
      Math.abs(backgroundHeights[index] - updatedForegroundHeights[index]) <
        0.1,
      JSON.stringify({ backgroundHeights, updatedForegroundHeights }),
    );
  }
  const initialIds = new Set(initial.map((document) => document.documentId));
  for (const document of await call('list_documents')) {
    if (!initialIds.has(document.documentId)) {
      await call('close_document', {
        documentId: document.documentId,
        expectedRevision: document.revision,
      });
    }
  }
  console.log(
    'Background style smoke passed: saved heights match foreground measurement without switching tabs.',
  );
} finally {
  await client.close();
}
