import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import JSZip from 'jszip';

import { readScoreSnapshot } from './readScoreSnapshot.mjs';
import { checkSettings } from './settingsChecks.mjs';
import {
  closeDocument,
  connectHttpClient,
  createToolCaller,
} from './smokeClient.mjs';
import { settledDocument } from './smokePolling.mjs';

const directory = process.argv[2];
const token = process.env.NEANES_MCP_TOKEN;
if (!directory || !path.isAbsolute(directory) || !token) {
  throw new Error(
    'Usage: NEANES_MCP_TOKEN=... node tests/integration/mcp/smoke.mjs /absolute/allowed/output-directory',
  );
}
const url = new URL(process.env.NEANES_MCP_URL ?? 'http://127.0.0.1:38765/mcp');
const client = await connectHttpClient('neanes-mcp-smoke', { url });
const call = createToolCaller(client);
const fails = call;
const suffix = Date.now();
const scorePath = path.join(directory, `smoke-${suffix}.byzx`);
const pdfPath = path.join(directory, `smoke-${suffix}.pdf`);
const archivePath = path.join(directory, `smoke-${suffix}.byz`);
const otherPath = path.join(directory, `smoke-${suffix}-other.byzx`);
const reopenedPath = path.join(directory, `smoke-${suffix}-reopened.byzx`);
const reopenedArchivePath = path.join(
  directory,
  `smoke-${suffix}-reopened.byz`,
);
try {
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 31);
  assert.ok(
    tools.tools.every(
      (tool) => !['create_session', 'close_session'].includes(tool.name),
    ),
  );
  await fails(
    'list_documents',
    { sessionId: '00000000-0000-4000-8000-000000000001' },
    'VALIDATION_ERROR',
  );
  assert.ok(tools.tools.every((tool) => tool.outputSchema?.type === 'object'));
  await fails(
    'get_page_setup',
    { documentId: 'missing', properties: ['unknown'] },
    'VALIDATION_ERROR',
  );
  await fails('unknown_tool', {}, 'TOOL_NOT_FOUND');
  const invalidPath = path.join(directory, `smoke-${suffix}-invalid.byzx`);
  for (const data of ['{', '{}', 'null', '{"version":"unsupported"}']) {
    await fs.writeFile(invalidPath, data);
    await fails('open_document', { filePath: invalidPath }, 'INVALID_SCORE');
  }
  const invalidArchive = path.join(directory, `smoke-${suffix}-invalid.byz`);
  await fs.writeFile(invalidArchive, 'not a zip file');
  await fails(
    'open_document',
    { filePath: invalidArchive },
    'INVALID_SCORE_ARCHIVE',
  );
  await fails(
    'open_document',
    { filePath: path.join(directory, 'missing.byzx') },
    'FILE_NOT_FOUND',
  );
  await checkSettings(client);
  const capabilities = await call('get_capabilities');
  assert.equal('fonts' in capabilities, false);
  const withFonts = await call('get_capabilities', { includeFonts: true });
  assert.ok(withFonts.fonts.includes('Source Serif'));
  const fontDraft = await call('create_document');
  const fontDefinitions = await call('get_paragraph_styles', {
    documentId: fontDraft.documentId,
    ids: ['lyrics'],
    includeResolved: false,
  });
  const unavailableFont = await call('edit_paragraph_styles', {
    documentId: fontDraft.documentId,
    expectedRevision: fontDefinitions.revision,
    changes: [
      {
        action: 'replace',
        style: {
          ...fontDefinitions.styles[0],
          overrides: { fontFamily: '__missing_font__' },
        },
      },
    ],
  });
  const fontPath = path.join(directory, `unavailable-font-${Date.now()}.byzx`);
  await call('save_document', {
    documentId: fontDraft.documentId,
    expectedRevision: unavailableFont.revision,
    filePath: fontPath,
  });
  const fontScore = JSON.parse(await fs.readFile(fontPath, 'utf8'));
  assert.equal(
    fontScore.paragraphStyles.find((style) => style.id === 'lyrics').fontFamily,
    '__missing_font__',
  );
  const fontState = await call('get_paragraph_styles', {
    documentId: fontDraft.documentId,
  });
  await call('close_document', {
    documentId: fontDraft.documentId,
    expectedRevision: fontState.revision,
  });
  const initial = await call('list_documents');
  const created = await call('create_document', { title: 'MCP smoke' });
  let document = await call('get_elements', {
    documentId: created.documentId,
    limit: 1,
  });
  assert.equal(document.elements.length, 1);
  assert.ok(document.nextOffset > 0);
  const styleResult = await call('get_paragraph_styles', {
    documentId: created.documentId,
  });
  const lyrics = styleResult.styles.find((style) => style.id === 'lyrics');
  const fontSize = (12.5 * 96) / 72;
  const styled = await call('edit_paragraph_styles', {
    includeStyles: true,
    documentId: created.documentId,
    expectedRevision: styleResult.revision,
    changes: [
      {
        action: 'replace',
        style: {
          ...lyrics,
          parentStyleId: 'smoke-parent',
          overrides: { ...lyrics.overrides, fontSize },
        },
      },
      {
        action: 'create',
        style: {
          id: 'smoke-child',
          displayName: 'Smoke child',
          parentStyleId: 'smoke-parent',
          overrides: {},
        },
      },
      {
        action: 'create',
        style: {
          id: 'smoke-parent',
          displayName: 'Smoke parent',
          parentStyleId: 'default-text',
          overrides: { fontFamily: 'Source Serif' },
        },
      },
    ],
  });
  assert.equal(
    styled.resolvedStyles.find((style) => style.id === 'lyrics').values
      .fontSize,
    fontSize,
  );
  assert.equal(
    styled.resolvedStyles.find((style) => style.id === 'smoke-child').values
      .fontFamily,
    'Source Serif',
  );
  const changed = await call('replace_document_properties', {
    documentId: created.documentId,
    expectedRevision: styled.revision,
    properties: { title: 'MCP smoke', author: 'MCP smoke' },
  });
  await fails(
    'save_document',
    {
      documentId: created.documentId,
      expectedRevision: document.revision,
      filePath: scorePath,
    },
    'REVISION_CONFLICT',
  );
  const saved = await call('save_document', {
    documentId: created.documentId,
    expectedRevision: changed.revision,
    filePath: scorePath,
  });
  assert.equal(saved.hasUnsavedChanges, false);
  assert.equal(saved.savedContentUnchanged, true);
  assert.equal(saved.savedRevision, changed.revision);
  assert.equal(saved.filePath, scorePath);
  const persisted = JSON.parse(await fs.readFile(scorePath, 'utf8'));
  assert.equal(persisted.documentProperties.author, 'MCP smoke');
  await fs.copyFile(scorePath, reopenedPath);
  const reopened = await call('open_document', { filePath: reopenedPath });
  assert.equal(reopened.created, true);
  const inspected = await readScoreSnapshot(call, {
    documentId: reopened.documentId,
  });
  assert.equal(
    (
      await call('get_paragraph_styles', { documentId: inspected.documentId })
    ).resolvedStyles.find((style) => style.id === 'lyrics').values.fontSize,
    fontSize,
  );
  const opened = await call('open_document', { filePath: scorePath });
  assert.equal(opened.documentId, created.documentId);
  assert.equal(opened.created, false);
  await call('export_pdf', {
    documentId: opened.documentId,
    expectedRevision: opened.revision,
    filePath: pdfPath,
  });
  const pdf = await fs.readFile(pdfPath);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  await fails(
    'export_pdf',
    {
      documentId: opened.documentId,
      expectedRevision: opened.revision,
      filePath: pdfPath,
    },
    'FILE_EXISTS',
  );
  assert.deepEqual(await fs.readFile(pdfPath), pdf);
  // Custom dimensions describe the unrotated paper; Electron applies landscape.
  for (const landscape of [false, true]) {
    const customScore = structuredClone(persisted);
    Object.assign(customScore.pageSetup, {
      pageSize: 'Custom',
      pageWidthCustom: 6 * 96,
      pageHeightCustom: 9 * 96,
      pageWidth: (landscape ? 9 : 6) * 96,
      pageHeight: (landscape ? 6 : 9) * 96,
      landscape,
    });
    const orientation = landscape ? 'landscape' : 'portrait';
    const customPath = path.join(
      directory,
      `smoke-${suffix}-${orientation}.byzx`,
    );
    const customPdfPath = path.join(
      directory,
      `smoke-${suffix}-${orientation}.pdf`,
    );
    await fs.writeFile(customPath, JSON.stringify(customScore));
    const custom = await call('open_document', { filePath: customPath });
    try {
      const current = await settledDocument(call, {
        documentId: custom.documentId,
      });
      await call('export_pdf', {
        documentId: current.documentId,
        expectedRevision: current.revision,
        filePath: customPdfPath,
      });
      const customPdf = (await fs.readFile(customPdfPath)).toString('latin1');
      const mediaBoxes = [...customPdf.matchAll(/\/MediaBox\s*\[([^\]]+)\]/g)];
      assert.ok(
        mediaBoxes.length > 0,
        'Export must specify PDF paper dimensions.',
      );
      for (const [, dimensions] of mediaBoxes) {
        assert.deepEqual(
          dimensions.trim().split(/\s+/).map(Number),
          landscape ? [0, 0, 648, 432] : [0, 0, 432, 648],
          `Custom 6 x 9 ${orientation} paper must be oriented exactly once.`,
        );
      }
    } finally {
      await closeDocument(call, { documentId: custom.documentId });
    }
  }
  const other = await call('create_document', { title: 'Other document' });
  await call('save_document', {
    documentId: other.documentId,
    expectedRevision: other.revision,
    filePath: otherPath,
  });
  await call('export_pdf', {
    documentId: opened.documentId,
    expectedRevision: opened.revision,
    filePath: pdfPath,
    overwrite: true,
  });
  const afterExport = await call('list_documents');
  assert.equal(
    afterExport.find((item) => item.selected).documentId,
    other.documentId,
  );
  const currentStyles = await call('get_paragraph_styles', {
    documentId: opened.documentId,
  });
  const currentLyrics = currentStyles.styles.find(
    (style) => style.id === 'lyrics',
  );
  await fails(
    'edit_paragraph_styles',
    {
      documentId: opened.documentId,
      expectedRevision: currentStyles.revision,
      changes: [
        {
          action: 'replace',
          style: { ...currentLyrics, parentStyleId: 'smoke-child' },
        },
        {
          action: 'replace',
          style: {
            ...currentStyles.styles.find((style) => style.id === 'smoke-child'),
            parentStyleId: 'lyrics',
          },
        },
      ],
    },
    'STYLE_INHERITANCE_CYCLE',
  );
  const styleIds = await call('get_paragraph_styles', {
    documentId: opened.documentId,
    view: 'ids',
  });
  assert.deepEqual(
    styleIds.styleIds,
    currentStyles.styles.map((style) => style.id),
  );
  assert.equal('styles' in styleIds, false);
  assert.equal('resolvedStyles' in styleIds, false);
  const deleted = await call('edit_paragraph_styles', {
    includeStyles: true,
    documentId: opened.documentId,
    expectedRevision: currentStyles.revision,
    changes: [{ action: 'delete', id: 'smoke-parent' }],
  });
  assert.deepEqual(deleted.affectedStyleIds.slice().sort(), [
    'lyrics',
    'smoke-child',
    'smoke-parent',
  ]);
  assert.equal(
    deleted.styles.find((style) => style.id === 'lyrics').parentStyleId,
    'default-text',
  );
  assert.equal(
    deleted.styles.find((style) => style.id === 'smoke-child').parentStyleId,
    'default-text',
  );
  await fails(
    'open_document',
    { filePath: '/etc/hosts' },
    'UNSUPPORTED_FILE_TYPE',
  );
  // Save back to the unchanged source without an overwrite flag.
  await call('save_document', {
    documentId: opened.documentId,
    expectedRevision: deleted.revision,
  });
  document = await readScoreSnapshot(call, { documentId: opened.documentId });
  await fs.appendFile(scorePath, '\nexternal change');
  await fails(
    'save_document',
    {
      documentId: opened.documentId,
      expectedRevision: document.revision,
      overwrite: true,
    },
    'SOURCE_FILE_CONFLICT',
  );
  const archived = await call('save_document', {
    documentId: opened.documentId,
    expectedRevision: document.revision,
    filePath: archivePath,
  });
  await fs.copyFile(archivePath, reopenedArchivePath);
  const reopenedArchive = await call('open_document', {
    filePath: reopenedArchivePath,
  });
  assert.equal(
    (
      await call('get_paragraph_styles', {
        documentId: reopenedArchive.documentId,
      })
    ).resolvedStyles.find((style) => style.id === 'lyrics').values.fontSize,
    fontSize,
  );
  // Exercise real DOM-backed rich-text remapping without DOM emulation.
  const richPath = path.join(directory, `smoke-${suffix}-rich.byzx`);
  const richScore = structuredClone(persisted);
  const richElement = {
    elementType: 'RichTextBox',
    content:
      '<p class="neanes-paragraph-style-smoke-parent">Style reference</p>',
    height: 20,
  };
  richScore.staff.elements.unshift(richElement);
  richScore.headers.default.elements = [structuredClone(richElement)];
  await fs.writeFile(richPath, JSON.stringify(richScore));
  const rich = await call('open_document', { filePath: richPath });
  const readyRich = await settledDocument(call, {
    documentId: rich.documentId,
  });
  await call('edit_paragraph_styles', {
    documentId: rich.documentId,
    expectedRevision: readyRich.revision,
    changes: [{ action: 'delete', id: 'smoke-parent' }],
  });
  const settledRich = await settledDocument(call, {
    documentId: rich.documentId,
  });
  const richDocument = await readScoreSnapshot(call, {
    documentId: rich.documentId,
    expectedRevision: settledRich.revision,
  });
  for (const element of [
    richDocument.score.staff.elements[0],
    richDocument.score.headers.default.elements[0],
  ]) {
    assert.match(element.content, /neanes-paragraph-style-default-text/);
    assert.doesNotMatch(element.content, /neanes-paragraph-style-smoke-parent/);
  }
  await call('save_document', {
    documentId: rich.documentId,
    expectedRevision: richDocument.revision,
  });
  for (const format of ['byzx', 'byz']) {
    for (const targetSuffix of ['', format === 'byz' ? '.byzx' : '.byz']) {
      const target = path.join(
        directory,
        `smoke-${suffix}-source-${format}${targetSuffix}`,
      );
      const alias = path.join(
        directory,
        `smoke-${suffix}-alias-${format}${targetSuffix}.${format}`,
      );
      await fs.copyFile(format === 'byz' ? archivePath : reopenedPath, target);
      await fs.symlink(target, alias);
      const source = await call('open_document', { filePath: alias });
      assert.equal(source.filePath, alias);
      const changedSource = await call('replace_document_properties', {
        documentId: source.documentId,
        expectedRevision: source.revision,
        properties: { title: 'Alias source saved', author: 'MCP smoke' },
      });
      const savedSource = await call('save_document', {
        documentId: source.documentId,
        expectedRevision: changedSource.revision,
      });
      assert.equal(savedSource.filePath, alias);
      assert.equal(savedSource.savedContentUnchanged, true);
      assert.equal((await fs.lstat(alias)).isSymbolicLink(), true);
      const bytes = await fs.readFile(target);
      const data =
        format === 'byz'
          ? await (
              await JSZip.loadAsync(bytes)
            )
              .file(/\.byzx$/)[0]
              .async('string')
          : bytes.toString();
      assert.equal(
        JSON.parse(data).documentProperties.title,
        'Alias source saved',
      );
      assert.equal(
        (await call('open_document', { filePath: alias })).documentId,
        source.documentId,
      );
    }
  }
  const current = await call('list_documents');
  assert.equal(current.length, initial.length + 9);
  assert.equal(archived.documentId, opened.documentId);
  // Cleanup only workspaces introduced by this run, preserving the user's original tabs.
  const draft = await call('create_document', { title: 'Disposable draft' });
  await fails(
    'close_document',
    { documentId: draft.documentId, expectedRevision: draft.revision },
    'UNSAVED_CHANGES',
  );
  const editedDraft = await call('replace_document_properties', {
    documentId: draft.documentId,
    expectedRevision: draft.revision,
    properties: { title: 'Newer draft', author: '' },
  });
  await fails(
    'close_document',
    {
      documentId: draft.documentId,
      expectedRevision: draft.revision,
      discardUnsavedChanges: true,
    },
    'REVISION_CONFLICT',
  );
  assert.ok(
    (await call('list_documents')).some(
      (item) => item.documentId === draft.documentId,
    ),
  );
  const discarded = await call('close_document', {
    documentId: draft.documentId,
    expectedRevision: editedDraft.revision,
    discardUnsavedChanges: true,
  });
  assert.equal(discarded.documentId, draft.documentId);
  await fails(
    'close_document',
    { documentId: draft.documentId, expectedRevision: editedDraft.revision },
    'DOCUMENT_NOT_FOUND',
  );
  const originalIds = new Set(initial.map((item) => item.documentId));
  const beforeClose = await call('list_documents');
  const selectedId = beforeClose.find((item) => item.selected).documentId;
  const background = beforeClose.find(
    (item) =>
      !originalIds.has(item.documentId) && item.documentId !== selectedId,
  );
  const backgroundClose = await call('close_document', {
    documentId: background.documentId,
    expectedRevision: background.revision,
  });
  assert.equal(backgroundClose.selectedDocumentId, selectedId);
  for (const item of await call('list_documents')) {
    if (!originalIds.has(item.documentId)) {
      await call('close_document', {
        documentId: item.documentId,
        expectedRevision: item.revision,
      });
    }
  }
  const afterClose = await call('list_documents');
  assert.deepEqual(
    new Set(afterClose.map((item) => item.documentId)),
    originalIds,
  );
  assert.equal((await fs.readFile(pdfPath)).subarray(0, 5).toString(), '%PDF-');
  assert.equal(
    JSON.parse(await fs.readFile(reopenedPath, 'utf8')).documentProperties
      .author,
    'MCP smoke',
  );
  // Authentication and browser-origin protections apply before MCP parsing.
  assert.equal((await fetch(url, { method: 'POST' })).status, 401);
  assert.equal(
    (
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Origin: 'https://example.com',
        },
      })
    ).status,
    403,
  );
  console.log(`MCP smoke passed. Score, archive, and PDF: ${directory}`);
} finally {
  await client.close();
}
