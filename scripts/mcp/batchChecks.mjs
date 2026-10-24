import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import JSZip from 'jszip';

import { closeDocument, createToolCaller } from './smokeClient.mjs';

export async function checkBatch(client, directory, seedPath) {
  const call = createToolCaller(client);
  const initialIds = (await call('list_documents')).map(
    (doc) => doc.documentId,
  );
  const seed = JSON.parse(await fs.readFile(seedPath, 'utf8'));
  const files = [];
  const originals = [];
  for (let index = 0; index < 37; index++) {
    const score = structuredClone(seed);
    score.documentProperties.title = `Batch ${index}`;
    const style = score.paragraphStyles.find(
      (style) => style.id === 'default-text',
    );
    style.fontFamily = 'Old Standard';
    style.fontSize = 21 + index;
    const filePath = path.join(directory, `batch-${index}.byzx`);
    originals.push(JSON.stringify(score));
    await fs.writeFile(filePath, originals[index]);
    files.push({ filePath });
  }
  const discovered = [];
  let discoveryOffset = 0;
  do {
    const page = await call('discover_score_files', {
      folderPath: directory,
      limit: 7,
      offset: discoveryOffset,
    });
    discovered.push(...page.files);
    discoveryOffset = page.nextOffset;
  } while (discoveryOffset !== null);
  assert.equal(new Set(discovered).size, discovered.length);
  for (const file of files) {
    assert.ok(discovered.includes(await fs.realpath(file.filePath)));
  }
  files[0].edits = {
    paragraphStyles: [
      {
        action: 'update',
        id: 'default-text',
        changes: { overrides: { fontSize: 88 } },
      },
    ],
    pageSetup: { bottomMargin: 55 },
  };
  files[1].edits = {
    paragraphStyles: [
      {
        action: 'update',
        id: 'default-text',
        changes: { overrides: { fontFamily: 'GFS Didot' } },
      },
    ],
    documentProperties: { author: 'Individual' },
  };
  const query = {
    files,
    edits: {
      paragraphStyles: [
        {
          action: 'update',
          id: 'default-text',
          changes: { overrides: { fontFamily: 'Source Serif' } },
        },
      ],
      pageSetup: { topMargin: 50 },
      headerFooter: { showHeader: false },
      documentProperties: { author: 'Shared' },
    },
  };
  const dry = await call('batch_update_files', {
    ...query,
    files: files.slice(0, 2),
    dryRun: true,
  });
  assert.ok(
    dry.results.every(
      (result) =>
        result.status === 'dryRun' && result.changed && !result.savedFilePath,
    ),
  );
  assert.equal(await fs.readFile(files[0].filePath, 'utf8'), originals[0]);
  const outcomes = [];
  let startIndex = 0;
  do {
    const reply = await call('batch_update_files', { ...query, startIndex });
    outcomes.push(...reply.results);
    assert.ok(
      ['complete', 'timeBudget', 'responseBudget'].includes(reply.stopReason),
    );
    startIndex = reply.nextIndex;
  } while (startIndex !== null);
  assert.equal(outcomes.length, 37);
  assert.ok(
    outcomes.every(
      (result) => result.status === 'completed' && result.savedFilePath,
    ),
  );
  for (const [index, file] of files.entries()) {
    const score = JSON.parse(await fs.readFile(file.filePath, 'utf8'));
    const style = score.paragraphStyles.find(
      (style) => style.id === 'default-text',
    );
    assert.equal(
      style.fontFamily ?? 'Source Serif',
      index === 1 ? 'GFS Didot' : 'Source Serif',
    );
    assert.equal(style.fontSize, index === 0 ? 88 : 21 + index);
    assert.equal(score.pageSetup.topMargin, 50);
    assert.equal(score.documentProperties.title, `Batch ${index}`);
    assert.equal(
      score.documentProperties.author,
      index === 1 ? 'Individual' : 'Shared',
    );
  }
  const stalePath = path.join(directory, 'batch-stale-measurements.byzx');
  const stale = structuredClone(seed);
  stale.staff.elements.find(
    (element) => element.elementType === 'RichTextBox',
  ).height = 1;
  const staleSource = JSON.stringify(stale);
  await fs.writeFile(stalePath, staleSource);
  const staleUnchanged = await call('batch_update_files', {
    files: [{ filePath: stalePath }],
  });
  assert.equal(staleUnchanged.results[0].status, 'unchanged');
  assert.equal(await fs.readFile(stalePath, 'utf8'), staleSource);
  const noOpPath = files[2].filePath;
  const before = await fs.readFile(noOpPath, 'utf8');
  const beforeStat = await fs.stat(noOpPath);
  const noOp = await call('batch_update_files', {
    ...query,
    files: [{ filePath: noOpPath }],
  });
  assert.equal(noOp.results[0].status, 'unchanged');
  assert.equal(noOp.results[0].savedFilePath, undefined);
  assert.equal((await fs.stat(noOpPath)).mtimeMs, beforeStat.mtimeMs);
  const missing = path.join(directory, 'missing.byzx');
  const stopped = await call('batch_update_files', {
    files: [{ filePath: missing }, { filePath: noOpPath }],
  });
  assert.equal(stopped.stopReason, 'error');
  assert.equal(stopped.nextIndex, 1);
  assert.equal(stopped.results[0].error.code, 'FILE_NOT_FOUND');
  const resumed = await call('batch_update_files', {
    files: [{ filePath: missing }, { filePath: noOpPath }],
    startIndex: stopped.nextIndex,
  });
  assert.equal(resumed.results[0].index, 1);
  assert.equal(resumed.nextIndex, null);
  const continued = await call('batch_update_files', {
    files: [{ filePath: missing }, { filePath: noOpPath }],
    onError: 'continue',
  });
  assert.deepEqual(
    continued.results.map((result) => result.status),
    ['failed', 'unchanged'],
  );
  const copyPath = path.join(directory, 'batch-copy.byz');
  const pdfPath = path.join(directory, 'batch-copy.pdf');
  const copied = await call('batch_update_files', {
    files: [
      { filePath: noOpPath, outputFilePath: copyPath, pdfFilePath: pdfPath },
    ],
    save: 'copy',
  });
  assert.equal(copied.results[0].status, 'completed');
  const archive = await JSZip.loadAsync(await fs.readFile(copyPath));
  const copiedScore = JSON.parse(
    await archive.file('batch-copy.byzx').async('text'),
  );
  assert.deepEqual(copiedScore, JSON.parse(before));
  const reopened = await call('open_document', { filePath: copyPath });
  try {
    const metadata = await call('get_document_properties', {
      documentId: reopened.documentId,
    });
    assert.deepEqual(metadata.properties, copiedScore.documentProperties);
  } finally {
    await closeDocument(call, { documentId: reopened.documentId });
  }
  assert.ok((await fs.stat(pdfPath)).size > 1000);
  assert.equal(await fs.readFile(noOpPath, 'utf8'), before);
  const temporary = await call('batch_update_files', {
    files: [
      {
        filePath: noOpPath,
        pdfFilePath: path.join(directory, 'batch-temporary.pdf'),
      },
    ],
    save: 'none',
    edits: { pageSetup: { topMargin: 60 } },
  });
  assert.equal(temporary.results[0].status, 'completed');
  assert.equal(temporary.results[0].savedFilePath, undefined);
  assert.equal(await fs.readFile(noOpPath, 'utf8'), before);
  const partialPath = path.join(directory, 'batch-partial.byzx');
  const partial = await call('batch_update_files', {
    files: [
      { filePath: noOpPath, outputFilePath: partialPath, pdfFilePath: pdfPath },
    ],
    save: 'copy',
  });
  assert.equal(partial.results[0].status, 'failed');
  assert.equal(partial.results[0].savedFilePath, partialPath);
  assert.equal(partial.results[0].error.code, 'FILE_EXISTS');
  const invalid = await call('batch_update_files', {
    files: [{ filePath: noOpPath }],
    edits: {
      paragraphStyles: [
        { action: 'update', id: 'missing', resetOverrides: ['fontFamily'] },
      ],
    },
  });
  assert.equal(invalid.results[0].error.code, 'STYLE_NOT_FOUND');
  assert.equal(await fs.readFile(noOpPath, 'utf8'), before);
  const collision = await client.callTool({
    name: 'batch_update_files',
    arguments: {
      files: [
        { filePath: files[0].filePath, outputFilePath: files[1].filePath },
        {
          filePath: files[1].filePath,
          outputFilePath: path.join(directory, 'never.byzx'),
        },
      ],
      save: 'copy',
      overwrite: true,
    },
  });
  assert.equal(collision.structuredContent.error.code, 'VALIDATION_ERROR');
  const aliasTarget = path.join(directory, 'batch-extensionless');
  const aliasPath = path.join(directory, 'batch-alias.byzx');
  await fs.writeFile(aliasTarget, before);
  await fs.symlink(aliasTarget, aliasPath);
  const aliasResult = await call('batch_update_files', {
    files: [{ filePath: aliasPath }],
    edits: { documentProperties: { author: 'Alias save' } },
  });
  assert.equal(aliasResult.results[0].status, 'completed');
  assert.ok((await fs.lstat(aliasPath)).isSymbolicLink());
  assert.equal(
    JSON.parse(await fs.readFile(aliasTarget, 'utf8')).documentProperties
      .author,
    'Alias save',
  );
  const oversized = await call('batch_update_files', {
    files: Array.from({ length: 100 }, (_, index) => ({
      filePath: path.join(directory, 'absent-'.repeat(28), `${index}.byzx`),
    })),
    onError: 'continue',
  });
  assert.equal(oversized.stopReason, 'responseBudget');
  assert.ok(oversized.nextIndex > 0 && oversized.nextIndex < 100);
  // Cancel after a real score commit while PDF work keeps the batch in progress.
  const cancelledFiles = files.map((file, index) => ({
    filePath: file.filePath,
    outputFilePath: path.join(directory, `cancel-${index}.byzx`),
    pdfFilePath: path.join(directory, `cancel-${index}.pdf`),
  }));
  const controller = new AbortController();
  const cancelled = client
    .callTool(
      {
        name: 'batch_update_files',
        arguments: { files: cancelledFiles, save: 'copy' },
      },
      undefined,
      { signal: controller.signal },
    )
    .then(
      () => false,
      () => true,
    );
  let committed = false;
  for (let attempt = 0; attempt < 200; attempt++) {
    try {
      await fs.stat(cancelledFiles[0].outputFilePath);
      committed = true;
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    await delay(10);
  }
  assert.ok(
    committed,
    'The cancellation test must observe a committed first score.',
  );
  controller.abort();
  assert.equal(await cancelled, true);
  await call('get_capabilities');
  await assert.rejects(() => fs.stat(cancelledFiles.at(-1).outputFilePath), {
    code: 'ENOENT',
  });
  assert.deepEqual(
    (await call('list_documents')).map((doc) => doc.documentId),
    initialIds,
  );
  console.info(
    'Batch smoke passed: 37 varied scores, per-file plans, dry run, no-op, resume, errors, copy/PDF, temporary export, save/reopen, collision protection, cancellation, and cleanup.',
  );
}
