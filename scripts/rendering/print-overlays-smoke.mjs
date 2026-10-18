import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { inflateSync } from 'node:zlib';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const directory = process.argv[2];
const token = process.env.NEANES_MCP_TOKEN;
assert.ok(directory && path.isAbsolute(directory) && token);
const targets = await (
  await fetch(
    `${process.env.NEANES_DEBUG_URL ?? 'http://127.0.0.1:9334'}/json/list`,
  )
).json();
const target = targets.find(
  (target) =>
    target.type === 'page' &&
    !target.url.includes('export.html') &&
    !target.url.startsWith('devtools:'),
);
assert.ok(
  target,
  'Start an isolated Electron instance with remote debugging enabled.',
);
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve) =>
  socket.addEventListener('open', resolve, { once: true }),
);
let nextId = 0;
const requests = new Map();
socket.addEventListener('message', (event) => {
  const reply = JSON.parse(event.data);
  const request = requests.get(reply.id);
  if (request) {
    requests.delete(reply.id);
    if (reply.error || reply.result.exceptionDetails) {
      request.reject(new Error(JSON.stringify(reply)));
    } else {
      request.resolve(reply.result);
    }
  }
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    requests.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return result.result.value;
}
const client = new Client({
  name: 'neanes-print-overlays-smoke',
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
const flags = [
  'showGuides',
  'showAdjustmentRatios',
  'showAnonymousBoxes',
  'showElementBoxes',
  'showInkBoundingBoxes',
  'showGlueWidths',
  'showLyricBaselines',
  'showLyricBoundingBoxes',
  'showNeumeBoundingBoxes',
  'showCollisionRegions',
];
const originalPreferences = await evaluate(
  'localStorage.getItem("editorPreferences")',
);
const suffix = Date.now();
const seedPath = path.join(directory, `overlay-seed-${suffix}.byzx`);
const fixturePath = path.join(directory, `overlay-fixture-${suffix}.byzx`);
let openDocument;
async function closeDocument() {
  if (openDocument != null) {
    const current = await call('get_document_properties', {
      documentId: openDocument.documentId,
    });
    await call('close_document', {
      documentId: current.documentId,
      expectedRevision: current.revision,
      discardUnsavedChanges: true,
    });
    openDocument = undefined;
  }
}
async function setPreferences(overrides) {
  await closeDocument();
  const preferences = {
    ...JSON.parse(originalPreferences ?? '{}'),
    ...Object.fromEntries(flags.map((flag) => [flag, false])),
    showDeveloperPanels: true,
    overlaysEnabled: true,
    printOverlays: true,
    ...overrides,
  };
  await evaluate(
    `localStorage.setItem('editorPreferences', ${JSON.stringify(JSON.stringify(preferences))})`,
  );
  const previousTimeOrigin = await evaluate('performance.timeOrigin');
  await send('Page.reload');
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      if (
        await evaluate(
          `performance.timeOrigin !== ${previousTimeOrigin} && window._editor != null && document.querySelector(".page-background") != null`,
        )
      ) {
        await call('list_documents');
        return;
      }
    } catch {
      // Reload temporarily disconnects the real renderer from the host.
    }
    await setTimeout(50);
  }
  throw new Error('Editor did not become ready after reloading preferences.');
}
// Count drawing/text operators in Chromium's compressed page content streams.
// This checks actual PDF content, rather than merely comparing file sizes.
function pdfOperators(data) {
  const text = data.toString('latin1');
  const streams = [];
  for (const match of text.matchAll(
    /<<[^>]*\/Filter \/FlateDecode[^>]*>>\s*stream\r?\n/g,
  )) {
    const start = match.index + match[0].length;
    const end = text.indexOf('endstream', start);
    const decoded = inflateSync(data.subarray(start, end)).toString('latin1');
    if (decoded.includes('BT') && decoded.includes(' cm')) {
      streams.push(decoded);
    }
  }
  assert.ok(streams.length > 0, 'Expected Chromium PDF page content streams.');
  const content = streams.join('\n');
  return {
    drawing: [...content.matchAll(/\b(?:re|m|l|Do)\b/g)].length,
    text: [...content.matchAll(/\bBT\b/g)].length,
  };
}
async function exportCase(name, preferences) {
  await setPreferences(preferences);
  openDocument = await call('open_document', { filePath: fixturePath });
  const current = await call('get_document_properties', {
    documentId: openDocument.documentId,
  });
  const output = path.join(directory, `overlay-${name}-${suffix}.pdf`);
  await call('export_pdf', {
    documentId: current.documentId,
    expectedRevision: current.revision,
    filePath: output,
  });
  return pdfOperators(await fs.readFile(output));
}
try {
  openDocument = await call('create_document');
  await call('save_document', {
    documentId: openDocument.documentId,
    expectedRevision: openDocument.revision,
    filePath: seedPath,
  });
  const score = JSON.parse(await fs.readFile(seedPath, 'utf8'));
  score.staff.elements.splice(
    -1,
    0,
    ...Array.from({ length: 48 }, (_, index) => ({
      elementType: 'Note',
      quantitativeNeume: 'Ison',
      lyrics: `wrappinglyrics${index}`,
    })),
  );
  await fs.writeFile(fixturePath, JSON.stringify(score));
  const baseline = await exportCase('disabled', {});
  const allFlags = Object.fromEntries(flags.map((flag) => [flag, true]));
  for (const gate of [
    'printOverlays',
    'overlaysEnabled',
    'showDeveloperPanels',
  ]) {
    assert.deepEqual(
      await exportCase(gate, { ...allFlags, [gate]: false }),
      baseline,
      `${gate}=false must suppress print overlays.`,
    );
  }
  for (const flag of flags) {
    const actual = await exportCase(flag, { [flag]: true });
    if (flag === 'showAdjustmentRatios') {
      assert.ok(actual.text > baseline.text, `${flag} must add PDF text.`);
    } else {
      assert.ok(
        actual.drawing > baseline.drawing,
        `${flag} must add PDF drawing operators: ${JSON.stringify(actual)} vs ${JSON.stringify(baseline)}`,
      );
    }
  }
  const combined = await exportCase('all', allFlags);
  assert.ok(
    combined.drawing > baseline.drawing && combined.text > baseline.text,
  );
  console.log(`Print overlays smoke passed. Inspect PDFs in ${directory}`);
} finally {
  try {
    await closeDocument();
  } finally {
    await evaluate(
      originalPreferences == null
        ? 'localStorage.removeItem("editorPreferences")'
        : `localStorage.setItem('editorPreferences', ${JSON.stringify(originalPreferences)})`,
    );
    await send('Page.reload');
    socket.close();
    await client.close();
  }
}
