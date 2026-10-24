import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { promisify } from 'node:util';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import electron from 'electron';

import { checkBatch } from './batchChecks.mjs';
import { checkSettings } from './settingsChecks.mjs';

const directory = await mkdtemp(path.join(tmpdir(), 'neanes-headless-smoke-'));
const policyPath = path.join(directory, 'agent-access.json');
const files = path.join(directory, 'files');
await mkdir(files);
const policy = {
  enabled: true,
  token: randomBytes(32).toString('hex'),
};
await writeFile(policyPath, JSON.stringify(policy), { mode: 0o600 });
const clients = [];
async function connect(
  executable = process.env.NEANES_TEST_EXECUTABLE || electron,
) {
  const client = new Client({ name: 'neanes-headless-smoke', version: '1' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.resolve('scripts/mcp/bridge.mjs'),
      '--executable',
      executable,
      ...(process.env.NEANES_TEST_EXECUTABLE ? [] : ['--app', process.cwd()]),
      '--policy',
      policyPath,
    ],
    stderr: 'inherit',
  });
  clients.push(client);
  await client.connect(transport, { timeout: 70_000 });
  return client;
}
async function call(client, name, args = {}) {
  const result = await client.callTool({ name, arguments: args });
  assert.ok(!result.isError, JSON.stringify(result));
  return result.structuredContent.result;
}
try {
  const [first, second] = await Promise.all([connect(), connect()]);
  // Each bridge owns a worker; documents never resolve in a different worker.
  const capabilities = await call(first, 'get_capabilities');
  assert.equal(capabilities.mode, 'headless');
  assert.deepEqual(capabilities.privateDocuments, {
    maxDocuments: 16,
    lifetime: 'worker',
  });
  assert.equal('isolatedSessions' in capabilities, false);
  assert.equal('fonts' in capabilities, false);
  const withFonts = await call(first, 'get_capabilities', {
    includeFonts: true,
  });
  assert.ok(withFonts.fonts.includes('Source Serif'));
  console.info('Capabilities JSON characters', {
    default: JSON.stringify(capabilities).length,
    withFonts: JSON.stringify(withFonts).length,
    fontCount: withFonts.fonts.length,
  });
  const richTextFormat = await call(first, 'get_rich_text_format');
  assert.match(richTextFormat.guide, /neanes-paragraph-style-default-text/);
  assert.match(richTextFormat.guide, /neanes-paragraph-style-annotation/);
  assert.ok(JSON.stringify(richTextFormat).length < 6500);
  const inlineFormat = await call(first, 'get_rich_text_format', {
    topics: ['inline'],
  });
  assert.match(inlineFormat.guide, /font-size:18pt/);
  assert.ok(!inlineFormat.guide.includes('BASICS'));
  const openTypeFormat = await call(first, 'get_rich_text_format', {
    topics: ['opentype'],
  });
  assert.match(openTypeFormat.guide, /styleset\(ss01, ss05\)/);
  assert.ok(!openTypeFormat.guide.includes('BASICS'));
  const modeTemplates = await call(first, 'get_mode_key_templates', {
    mode: 6,
  });
  assert.equal(modeTemplates.templates.length, 5);
  assert.deepEqual(
    modeTemplates.templates.find((template) => template.templateId === 604),
    {
      templateId: 604,
      mode: 6,
      description: 'Heptaphonic (Makam Hicâzkâr)',
      scale: 'HardChromatic',
      scaleNote: 'PaHigh',
      supportsOptionalDiatonicFthora: false,
    },
  );
  assert.deepEqual(await call(first, 'list_documents'), []);
  await assert.rejects(
    () => call(first, 'list_documents', { documentScope: 'editor' }),
    /No editor is open/,
  );
  const privateDocument = await call(first, 'create_document', {
    title: 'Automatic private document',
  });
  assert.equal(privateDocument.selected, false);
  const privateArgs = { documentId: privateDocument.documentId };
  let modeEdit = await call(first, 'edit_elements', {
    ...privateArgs,
    expectedRevision: privateDocument.revision,
    actions: [
      {
        action: 'insert',
        elements: [
          {
            elementType: 'ModeKey',
            properties: {
              templateId: 604,
              useOptionalDiatonicFthoras: false,
              bpm: 123,
            },
          },
        ],
      },
    ],
  });
  let modeElements = await call(first, 'get_elements', privateArgs);
  const modeRef = modeElements.elements[0].elementRef;
  assert.equal(modeElements.elements[0].properties.scaleNote, 'PaHigh');
  assert.equal(
    modeElements.elements[0].properties.fthoraAboveNote,
    'HardChromaticPa_Top',
  );
  modeEdit = await call(first, 'edit_elements', {
    ...privateArgs,
    expectedRevision: modeEdit.revision,
    actions: [
      {
        action: 'update',
        elementRef: modeRef,
        elementType: 'ModeKey',
        properties: { templateId: 100, useOptionalDiatonicFthoras: true },
      },
    ],
  });
  modeElements = await call(first, 'get_elements', privateArgs);
  assert.equal(
    modeElements.elements[0].properties.fthoraAboveNote,
    'DiatonicPa_Top',
  );
  assert.equal(
    modeElements.elements[0].properties.quantitativeNeumeRight,
    undefined,
  );
  assert.equal(modeElements.elements[0].properties.bpm, 123);
  const invalidModeEdit = await first.callTool({
    name: 'edit_elements',
    arguments: {
      ...privateArgs,
      expectedRevision: modeEdit.revision,
      actions: [
        {
          action: 'update',
          elementRef: modeRef,
          elementType: 'ModeKey',
          properties: { templateId: 703 },
        },
      ],
    },
  });
  assert.equal(
    invalidModeEdit.structuredContent.error.code,
    'VALIDATION_ERROR',
  );

  assert.equal((await call(first, 'list_documents')).length, 1);
  assert.deepEqual(await call(second, 'list_documents'), []);
  const definitions = await first.listTools();
  assert.deepEqual(
    definitions.tools.find((tool) => tool.name === 'list_documents').inputSchema
      .properties.documentScope.enum,
    ['private', 'editor'],
  );
  assert.equal(
    definitions.tools.some(
      (tool) => tool.name === 'create_session' || tool.name === 'close_session',
    ),
    false,
  );
  assert.equal(
    Object.hasOwn(
      definitions.tools.find((tool) => tool.name === 'list_documents')
        .inputSchema.properties,
      'sessionId',
    ),
    false,
  );
  await checkSettings(first);
  const foreign = await second.callTool({
    name: 'get_document_properties',
    arguments: { documentId: modeEdit.documentId },
  });
  assert.equal(foreign.structuredContent.error.code, 'DOCUMENT_NOT_FOUND');
  let document = await call(first, 'create_document', {
    title: 'Headless smoke',
  });
  const styleIds = await call(first, 'get_paragraph_styles', {
    documentId: document.documentId,
    view: 'ids',
  });
  assert.ok(styleIds.styleIds.includes('lyrics'));
  assert.equal('styles' in styleIds, false);
  assert.equal('resolvedStyles' in styleIds, false);
  document = await call(first, 'edit_paragraph_styles', {
    documentId: document.documentId,
    expectedRevision: document.revision,
    changes: [
      {
        action: 'update',
        id: 'lyrics',
        changes: {
          overrides: { fontFamily: '__unavailable_text_font__' },
        },
      },
      {
        action: 'update',
        id: 'default-text',
        changes: {
          overrides: { fontFamily: 'Source Serif' },
        },
      },
    ],
  });
  document = await call(first, 'edit_paragraph_styles', {
    documentId: document.documentId,
    expectedRevision: document.revision,
    changes: [
      {
        action: 'create',
        style: {
          id: 'reset-child',
          displayName: 'Reset Child',
          parentStyleId: 'default-text',
          overrides: { fontFamily: '__local_override__', fontSize: 19 },
        },
      },
    ],
  });
  document = await call(first, 'edit_paragraph_styles', {
    documentId: document.documentId,
    expectedRevision: document.revision,
    changes: [
      { action: 'update', id: 'reset-child', resetOverrides: ['fontFamily'] },
    ],
  });
  document = await call(first, 'edit_elements', {
    documentId: document.documentId,
    expectedRevision: document.revision,
    actions: [
      {
        action: 'insert',
        index: 0,
        elements: [
          {
            elementType: 'RichTextBox',
            properties: {
              content:
                '<p class="neanes-paragraph-style-reset-child">Headless rich text</p>',
            },
          },
          {
            elementType: 'Note',
            properties: {
              quantitativeNeume: 'Ison',
              lyrics: 'Test',
              lyricsFontFamily: '__unavailable_element_font__',
            },
          },
        ],
      },
    ],
  });
  const layout = await call(first, 'get_pages', {
    documentId: document.documentId,
  });
  const repeatedLayout = await call(first, 'get_pages', {
    documentId: document.documentId,
    expectedRevision: layout.revision,
    expectedLayoutId: layout.layoutId,
  });
  assert.deepEqual(repeatedLayout, layout);
  const preview = await first.callTool({
    name: 'preview_page',
    arguments: {
      documentId: document.documentId,
      expectedRevision: layout.revision,
      pageNumber: 1,
      maxEdge: 512,
    },
  });
  assert.ok(!preview.isError, JSON.stringify(preview.structuredContent));
  assert.equal(preview.content[1].type, 'image');
  assert.equal(preview.content[1].mimeType, 'image/png');
  assert.ok(
    Math.max(
      preview.structuredContent.result.width,
      preview.structuredContent.result.height,
    ) <= 512,
  );
  const scorePath = path.join(files, 'headless.byzx');
  document = await call(first, 'save_document', {
    documentId: document.documentId,
    expectedRevision: document.revision,
    filePath: scorePath,
  });
  assert.ok((await readFile(scorePath, 'utf8')).includes('Headless smoke'));
  const persisted = JSON.parse(await readFile(scorePath, 'utf8'));
  assert.equal(
    persisted.paragraphStyles.find((style) => style.id === 'lyrics').fontFamily,
    '__unavailable_text_font__',
  );
  assert.equal(
    persisted.staff.elements.find((element) => element.elementType === 'Note')
      .lyricsFontFamily,
    '__unavailable_element_font__',
  );
  await call(first, 'export_pdf', {
    documentId: document.documentId,
    expectedRevision: document.revision,
    filePath: path.join(files, 'headless.pdf'),
  });
  assert.ok((await stat(path.join(files, 'headless.pdf'))).size > 1000);
  const openedScore = await call(second, 'open_document', {
    filePath: scorePath,
  });
  const reopenedStyle = await call(second, 'get_paragraph_styles', {
    documentId: openedScore.documentId,
    ids: ['default-text', 'reset-child'],
  });
  // Root overrides equal to built-in fallbacks are omitted when normalized.
  assert.equal(
    reopenedStyle.resolvedStyles[0].values.fontFamily,
    'Source Serif',
  );
  const resetDefinition = reopenedStyle.styles.find(
    (style) => style.id === 'reset-child',
  );
  assert.deepEqual(resetDefinition.overrides, { fontSize: 19 });
  assert.equal(
    reopenedStyle.resolvedStyles.find((style) => style.id === 'reset-child')
      .values.fontFamily,
    'Source Serif',
  );
  // Batch scratch documents never join the worker's long-lived store.
  const beforeBatch = await call(first, 'list_documents');
  await checkBatch(first, files, scorePath);
  assert.deepEqual(await call(first, 'list_documents'), beforeBatch);
  // Capacity is per worker and closing a draft requires explicit consent.
  while (
    (await call(first, 'list_documents')).length <
    capabilities.privateDocuments.maxDocuments
  ) {
    await call(first, 'create_document', { title: 'Capacity draft' });
  }
  const full = await first.callTool({ name: 'create_document', arguments: {} });
  assert.equal(full.structuredContent.error.code, 'DOCUMENT_LIMIT_REACHED');
  const drafts = await call(first, 'list_documents');
  for (const draft of drafts) {
    if (draft.hasUnsavedChanges) {
      const refused = await first.callTool({
        name: 'close_document',
        arguments: {
          documentId: draft.documentId,
          expectedRevision: draft.revision,
        },
      });
      assert.equal(refused.structuredContent.error.code, 'UNSAVED_CHANGES');
    }
    const closed = await call(first, 'close_document', {
      documentId: draft.documentId,
      expectedRevision: draft.revision,
      discardUnsavedChanges: true,
    });
    assert.equal(closed.selectedDocumentId, null);
  }
  assert.deepEqual(await call(first, 'list_documents'), []);
  await call(first, 'create_document', { title: 'Capacity reclaimed' });
  await assert.rejects(() =>
    connect(path.join(directory, 'missing-executable')),
  );
  if (process.platform === 'darwin' || process.platform === 'linux') {
    const doomed = await connect();
    const { stdout } = await promisify(execFile)('pgrep', [
      '-P',
      String(doomed.transport.pid),
    ]);
    const children = stdout.trim().split(/\s+/).map(Number);
    assert.equal(children.length, 1);
    process.kill(children[0], 'SIGKILL');
    await setTimeout(500);
    await assert.rejects(() => call(doomed, 'get_capabilities'));
  }
  // Revocation stops existing workers and does not undo saved files.
  const saved = await readFile(scorePath, 'utf8');
  await writeFile(policyPath, JSON.stringify({ ...policy, enabled: false }));
  await assert.rejects(() => connect());
  await setTimeout(1500);
  await assert.rejects(() => call(first, 'get_capabilities'));
  await assert.rejects(() => call(second, 'get_capabilities'));
  assert.equal(await readFile(scorePath, 'utf8'), saved);
  // Re-enabling starts a fresh host without reviving private drafts.
  await writeFile(
    policyPath,
    JSON.stringify({ enabled: true, token: randomBytes(32).toString('hex') }),
  );
  const fresh = await connect();
  assert.deepEqual(await call(fresh, 'list_documents'), []);
  await fresh.close();
  // Neither the bridge nor --headless-mcp may bootstrap permission.
  await rm(policyPath);
  await assert.rejects(() => connect());
  await assert.rejects(() => stat(policyPath), { code: 'ENOENT' });
  for (const content of [
    JSON.stringify({ token: policy.token }),
    JSON.stringify({ ...policy, enabled: false }),
    '{invalid',
  ]) {
    await writeFile(policyPath, content);
    await assert.rejects(() => connect());
    const workerProfile = path.join(directory, 'refused-worker');
    await mkdir(workerProfile, { recursive: true });
    const env = {
      ...process.env,
      IS_TEST: '1',
      NEANES_HEADLESS_PROFILE: workerProfile,
      NEANES_HEADLESS_POLICY: policyPath,
    };
    delete env.ELECTRON_RUN_AS_NODE;
    await assert.rejects(() =>
      promisify(execFile)(
        process.env.NEANES_TEST_EXECUTABLE || electron,
        [
          ...(process.env.NEANES_TEST_EXECUTABLE ? [] : [process.cwd()]),
          '--headless-mcp',
        ],
        { env, timeout: 15000 },
      ),
    );
    assert.equal(await readFile(policyPath, 'utf8'), content);
  }
  console.log(
    'Headless bridge smoke passed: private workers, save/reopen, PDF, revocation, fresh reconnect, and disabled/missing/invalid policy refusal.',
  );
} finally {
  await Promise.allSettled(clients.map((client) => client.close()));
  await rm(directory, { recursive: true, force: true });
}
