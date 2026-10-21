import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { constants, lstatSync, mkdirSync, openSync } from 'node:fs';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

import { app, BrowserWindow } from 'electron';

const root = process.env.NEANES_SAVE_SMOKE_ROOT;
const output = process.env.NEANES_SAVE_SMOKE_OUTPUT;
const profile = process.env.NEANES_DEV_USER_DATA_DIR;
const fifoPaths = new Set();
function createFifo(filePath) {
  execFileSync('mkfifo', [filePath]);
  fifoPaths.add(filePath);
}
mkdirSync(profile, { recursive: true });
app.setPath('userData', profile);
app.setPath('sessionData', profile);
// Load CommonJS main synchronously so it installs its app-ready listener in time.
const loadApplication = createRequire(import.meta.url);
loadApplication(path.join(root, 'dist-electron/main/index.js'));

async function waitFor(description, check) {
  const deadline = Date.now() + 60_000;
  for (;;) {
    const result = await check();
    if (result) {
      return result;
    }
    assert.ok(Date.now() < deadline, `Timed out: ${description}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function run() {
  await app.whenReady();
  const window = await waitFor(
    'editor window',
    () => BrowserWindow.getAllWindows()[0],
  );
  const evaluate = async (source) => {
    const result = await window.webContents.executeJavaScript(
      `
      (async () => {
        try {
          return { value: await eval(${JSON.stringify(source)}) };
        } catch (error) {
          return { error: error.stack ?? String(error) };
        }
      })()
    `,
      true,
    );
    assert.ok(!result.error, `${result.error}\nRenderer operation:\n${source}`);
    return result.value;
  };
  await waitFor('interactive editor initialization', async () => {
    if (window.webContents.isLoading()) {
      return false;
    }
    return evaluate(
      `Boolean(document.querySelector('.editor')?.__vueParentComponent?.setupState?.isLoading === false)`,
    );
  });
  await evaluate(
    `window.__saveSmoke = document.querySelector('.editor').__vueParentComponent.setupState; true`,
  );
  assert.equal(
    await evaluate(`typeof window.__saveSmoke.saveWorkspace`),
    'function',
  );
  window.show();
  window.focus();

  const scorePath = path.join(output, 'score.byzx');
  await evaluate(`
    window.__saveSmoke.selectedWorkspace.filePath = ${JSON.stringify(scorePath)};
    window.__saveSmoke.onFileMenuInsertRichTextBox();
    true;
  `);
  const findRichEditor = () =>
    waitFor('live CKEditor', () =>
      evaluate(`
    (() => {
      const element = document.querySelector('.rich-text-box-container.selected');
      window.__saveSmokeCk = element?.__vueParentComponent.setupState.getEditorInstance();
      return window.__saveSmokeCk?.state === 'ready';
    })()
  `),
    );
  await findRichEditor();
  const typeText = async (text) => {
    // Undo/redo can remount the rendered box and replace its CKEditor instance.
    await findRichEditor();
    await evaluate(`
      (() => {
        const editor = window.__saveSmokeCk;
        editor.model.change(writer => writer.setSelection(editor.model.document.getRoot().getChild(0), 'end'));
        editor.editing.view.focus();
      })();
    `);
    await window.webContents.insertText(text);
    await waitFor('typed rich text', () =>
      evaluate(
        `window.__saveSmokeCk.getData().includes(${JSON.stringify(text)})`,
      ),
    );
  };
  const save = () =>
    evaluate(
      `window.__saveSmoke.saveWorkspace(window.__saveSmoke.selectedWorkspace)`,
    );
  const beginSave = async () => {
    await evaluate(`
      window.__saveSmokeSettled = false;
      window.__saveSmokePending = window.__saveSmoke.saveWorkspace(window.__saveSmoke.selectedWorkspace);
      window.__saveSmokePending.then(() => window.__saveSmokeSettled = true, () => window.__saveSmokeSettled = true);
      true;
    `);
  };
  const endSave = () => evaluate(`window.__saveSmokePending`);
  const dirty = () =>
    evaluate(`window.__saveSmoke.selectedWorkspace.hasUnsavedChanges`);
  const revision = () =>
    evaluate(`window.__saveSmoke.selectedWorkspace.contentRevision`);
  const setPath = (filePath) =>
    evaluate(
      `window.__saveSmoke.selectedWorkspace.filePath = ${JSON.stringify(filePath)}; true`,
    );
  const workspaceId = await evaluate(`window.__saveSmoke.selectedWorkspace.id`);
  const recoveryPath = path.join(profile, 'recovery', `${workspaceId}.json`);
  const readRecoveryScore = async () =>
    JSON.parse(JSON.parse(await readFile(recoveryPath, 'utf8')).envelope.score);
  const assertScoreContains = (score, text) =>
    assert.ok(JSON.stringify(score.staff.elements).includes(text));
  const holdRecoveryCleanup = async () => {
    await evaluate(`
      window.__saveSmoke.prepareWorkspaceForSerialization(window.__saveSmoke.selectedWorkspace);
      window.__saveSmoke.clearRecoverySnapshotTimer(window.__saveSmoke.selectedWorkspace.id);
      window.__saveSmoke.persistRecoverySnapshot(window.__saveSmoke.selectedWorkspace);
    `);
    const envelope = await readFile(recoveryPath, 'utf8');
    await rm(recoveryPath);
    createFifo(recoveryPath);
    await evaluate(`
      window.__saveSmoke.clearRecoverySnapshotTimer(window.__saveSmoke.selectedWorkspace.id);
      window.__saveSmokeRecovery = window.__saveSmoke.persistRecoverySnapshot(window.__saveSmoke.selectedWorkspace);
      true;
    `);
    await beginSave();
    await waitFor(
      'score written while recovery cleanup is pending',
      async () => !(await dirty()),
    );
    assert.equal(await evaluate(`window.__saveSmokeSettled`), false);
    return async () => {
      await writeFile(recoveryPath, envelope);
      await evaluate(`window.__saveSmokeRecovery`);
      return endSave();
    };
  };

  await typeText('Saved content');
  let result = await save();
  assert.equal(result.success, true);
  assert.equal(result.savedContentUnchanged, true);
  assert.equal(await dirty(), false);
  assertScoreContains(
    JSON.parse(await readFile(scorePath, 'utf8')),
    'Saved content',
  );
  await assert.rejects(readFile(recoveryPath), { code: 'ENOENT' });
  const cleanRevision = await revision();
  result = await save();
  assert.equal(result.savedContentUnchanged, true);
  assert.equal(await revision(), cleanRevision);
  console.log(
    'PASS: buffered CKEditor text is saved; repeated unchanged saves stay clean',
  );

  // A real FIFO holds the application's file write until a reader is attached.
  // Its payload is captured before the user types; no IPC or filesystem method
  // is replaced to control the timing.
  const writeGate = path.join(output, 'pending-write.byzx');
  createFifo(writeGate);
  await setPath(writeGate);
  await beginSave();
  await typeText(' EDIT DURING WRITE');
  assert.equal(await evaluate(`window.__saveSmokeSettled`), false);
  assert.equal(
    await evaluate(
      `window.__saveSmoke.selectedRichTextBoxElement.content.includes('EDIT DURING WRITE')`,
    ),
    false,
  );
  const written = JSON.parse(await readFile(writeGate, 'utf8'));
  assert.equal(JSON.stringify(written).includes('EDIT DURING WRITE'), false);
  result = await endSave();
  assert.equal(result.success, true);
  assert.equal(result.savedContentUnchanged, false);
  assert.equal(await dirty(), true);
  assertScoreContains(await readRecoveryScore(), 'EDIT DURING WRITE');
  await evaluate(`window.__saveSmoke.onFileMenuUndo(); true`);
  assert.equal(await dirty(), false);
  await evaluate(`window.__saveSmoke.onFileMenuRedo(); true`);
  assert.equal(await dirty(), true);
  await rm(writeGate);
  await setPath(scorePath);
  assert.equal((await save()).savedContentUnchanged, true);
  console.log(
    'PASS: real CKEditor input during file I/O remains recoverable; undo after completion returns to clean',
  );

  const undoGate = path.join(output, 'undo-during-save.byzx');
  createFifo(undoGate);
  await setPath(undoGate);
  const beforeUndoSave = await revision();
  await beginSave();
  await evaluate(`
    window.__saveSmoke.updateDocumentProperties({title: 'Temporary edit during saving', author: ''});
    window.__saveSmoke.onFileMenuUndo();
    true;
  `);
  assert.equal(await revision(), beforeUndoSave + 2);
  assert.equal(await dirty(), false);
  await readFile(undoGate);
  result = await endSave();
  assert.equal(result.success, true);
  assert.equal(result.savedContentUnchanged, true);
  assert.equal(await dirty(), false);
  await rm(undoGate);
  await setPath(scorePath);
  console.log(
    'PASS: editing and undoing during file I/O finishes clean while revisions keep increasing',
  );

  await evaluate(
    `window.__saveSmoke.updateDocumentProperties({title: 'Written but undone', author: ''}); true`,
  );
  createFifo(undoGate);
  await setPath(undoGate);
  await beginSave();
  await evaluate(`window.__saveSmoke.onFileMenuUndo(); true`);
  const undoneWrite = JSON.parse(await readFile(undoGate, 'utf8'));
  assert.equal(undoneWrite.documentProperties.title, 'Written but undone');
  result = await endSave();
  assert.equal(result.success, true);
  assert.equal(result.savedContentUnchanged, false);
  assert.equal(await dirty(), true);
  await evaluate(`window.__saveSmoke.onFileMenuRedo(); true`);
  assert.equal(await dirty(), false);
  await rm(undoGate);
  await setPath(scorePath);
  assert.equal((await save()).savedContentUnchanged, true);
  console.log(
    'PASS: undo during saving leaves the older editor content dirty; redo restores the written state as clean',
  );

  const queueGate = path.join(output, 'queued-save.byzx');
  createFifo(queueGate);
  await setPath(queueGate);
  await beginSave();
  await typeText(' QUEUED EDIT');
  await setPath(scorePath);
  await evaluate(`
    window.__saveSmokeSecond = window.__saveSmoke.saveWorkspace(window.__saveSmoke.selectedWorkspace);
    true;
  `);
  assert.equal(
    JSON.stringify(JSON.parse(await readFile(scorePath, 'utf8'))).includes(
      'QUEUED EDIT',
    ),
    false,
  );
  await readFile(queueGate);
  const queuedResults = await evaluate(
    `Promise.all([window.__saveSmokePending, window.__saveSmokeSecond])`,
  );
  assert.equal(queuedResults[0].success, true);
  assert.equal(queuedResults[0].savedContentUnchanged, false);
  assert.equal(queuedResults[1].success, true);
  assert.equal(queuedResults[1].savedContentUnchanged, true);
  assert.equal(await dirty(), false);
  assertScoreContains(
    JSON.parse(await readFile(scorePath, 'utf8')),
    'QUEUED EDIT',
  );
  await rm(queueGate);
  console.log(
    'PASS: overlapping saves run in order and the later save persists the latest editor input',
  );

  const heightGate = path.join(output, 'height-update.byzx');
  createFifo(heightGate);
  await setPath(heightGate);
  const beforeHeight = await revision();
  await beginSave();
  await evaluate(`
    window.__saveSmoke.updateRichTextBoxHeight(window.__saveSmoke.selectedRichTextBoxElement, window.__saveSmoke.selectedRichTextBoxElement.height + 1);
    true;
  `);
  await readFile(heightGate);
  result = await endSave();
  assert.equal(result.success, true);
  assert.equal(result.savedContentUnchanged, true);
  assert.equal(await dirty(), false);
  assert.equal(await revision(), beforeHeight);
  await rm(heightGate);
  await setPath(scorePath);
  console.log(
    'PASS: recalculated height during a save does not dirty content or advance its revision',
  );

  // Queue actual recovery work on a FIFO read of an existing recovery envelope.
  // The subsequent save can write its score, but its recovery cleanup must wait.
  await typeText(' Before cleanup');
  const releaseRecovery = await holdRecoveryCleanup();
  await typeText(' EDIT DURING CLEANUP');
  assert.equal(
    await evaluate(
      `window.__saveSmoke.selectedRichTextBoxElement.content.includes('EDIT DURING CLEANUP')`,
    ),
    false,
  );
  assert.equal(
    JSON.stringify(JSON.parse(await readFile(scorePath, 'utf8'))).includes(
      'EDIT DURING CLEANUP',
    ),
    false,
  );
  result = await releaseRecovery();
  assert.equal(result.success, true);
  assert.equal(result.savedContentUnchanged, false);
  assert.equal(await dirty(), true);
  assertScoreContains(await readRecoveryScore(), 'EDIT DURING CLEANUP');
  assert.equal((await save()).savedContentUnchanged, true);
  console.log(
    'PASS: real CKEditor input during recovery cleanup remains dirty and recovery is recreated',
  );

  await evaluate(
    `window.__saveSmoke.updateDocumentProperties({title: 'Saved during cleanup', author: ''}); true`,
  );
  const releaseUndoCleanup = await holdRecoveryCleanup();
  const beforeCleanupUndo = await revision();
  await evaluate(`
    window.__saveSmoke.updateDocumentProperties({title: 'Temporary cleanup edit', author: ''});
    window.__saveSmoke.onFileMenuUndo();
    true;
  `);
  assert.equal(await revision(), beforeCleanupUndo + 2);
  assert.equal(await dirty(), false);
  result = await releaseUndoCleanup();
  assert.equal(result.success, true);
  assert.equal(result.savedContentUnchanged, true);
  assert.equal(await dirty(), false);
  await assert.rejects(readFile(recoveryPath), { code: 'ENOENT' });
  console.log(
    'PASS: edit and undo during recovery cleanup returns to the saved state and stays clean',
  );

  await evaluate(
    `window.__saveSmoke.updateDocumentProperties({title: 'Saved history branch', author: ''}); true`,
  );
  assert.equal((await save()).savedContentUnchanged, true);
  await evaluate(`
    window.__saveSmoke.onFileMenuUndo();
    window.__saveSmoke.updateDocumentProperties({title: 'Replacement branch', author: ''});
    window.__saveSmoke.onFileMenuUndo();
    window.__saveSmoke.onFileMenuRedo();
    true;
  `);
  assert.equal(await dirty(), true);
  assert.equal((await save()).savedContentUnchanged, true);
  console.log(
    'PASS: a new history branch cannot reuse the saved state identity at the same undo position',
  );

  const beforeLyrics = await revision();
  await evaluate(`
    window.__saveSmoke.updateLyricsLocked(true);
    window.__saveSmoke.updateStaffLyrics('Lyrics edited through the command service');
    true;
  `);
  assert.equal(await revision(), beforeLyrics + 2);
  assert.equal(await dirty(), true);
  assert.equal((await save()).savedContentUnchanged, true);
  const withLyrics = JSON.parse(await readFile(scorePath, 'utf8'));
  assert.equal(
    withLyrics.staff.lyrics.text,
    'Lyrics edited through the command service',
  );
  assert.equal(withLyrics.staff.lyrics.locked, true);
  console.log(
    'PASS: lyrics-manager edits advance content revisions and persist through the real save path',
  );

  await evaluate(
    `window.__saveSmoke.updateDocumentProperties({title: 'An undoable edit', author: ''}); true`,
  );
  const afterEdit = await revision();
  await evaluate(`window.__saveSmoke.onFileMenuUndo(); true`);
  assert.equal(await revision(), afterEdit + 1);
  assert.equal(await dirty(), false);
  await evaluate(`window.__saveSmoke.onFileMenuRedo(); true`);
  assert.equal(await revision(), afterEdit + 2);
  await setPath(output);
  console.log(
    'Checking intentional directory write failure (EISDIR is expected):',
  );
  result = await save();
  assert.equal(result.success, false);
  assert.equal(await dirty(), true);
  await setPath(scorePath);
  assert.equal((await save()).savedContentUnchanged, true);
  assert.equal(await dirty(), false);
  console.log(
    'PASS: editor undo/redo advance revisions; a real write failure preserves dirty content and retry succeeds',
  );

  const inserted = await evaluate(`
    (async () => {
      const editor = window.__saveSmoke;
      const {NoteElement} = await import('/src/models/Element.ts');
      const note = new NoteElement();
      editor.addScoreElement(note, 0);
      editor.selectedElement = note;
      const beforeAnnotation = editor.selectedWorkspace.contentRevision;
      editor.onFileMenuInsertAnnotation();
      const afterAnnotation = editor.selectedWorkspace.contentRevision;
      editor.onFileMenuInsertAlternateLine();
      return {
        annotationRevision: afterAnnotation - beforeAnnotation,
        alternateLineRevision: editor.selectedWorkspace.contentRevision - afterAnnotation,
        annotations: note.annotations.length,
        alternateLines: note.alternateLines.length,
      };
    })()
  `);
  assert.deepEqual(inserted, {
    annotationRevision: 1,
    alternateLineRevision: 1,
    annotations: 1,
    alternateLines: 1,
  });
  assert.equal(await dirty(), true);
  assert.equal((await save()).savedContentUnchanged, true);
  console.log(
    'PASS: annotation and alternate-line insertion advance revisions through noHistory commands',
  );
  await writeFile(
    path.join(output, 'editor.png'),
    (await window.webContents.capturePage()).toPNG(),
  );
}

void run().then(
  () => app.exit(0),
  (error) => {
    console.error(error);
    // Release blocked filesystem workers before Electron tears down libuv.
    // These descriptors are closed by process exit after the workers unblock.
    for (const filePath of fifoPaths) {
      try {
        if (lstatSync(filePath).isFIFO()) {
          openSync(filePath, constants.O_RDWR | constants.O_NONBLOCK);
        }
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.error(cleanupError);
        }
      }
    }
    app.exit(1);
  },
);
