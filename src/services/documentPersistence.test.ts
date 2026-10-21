import { describe, expect, it } from 'vitest';
import { reactive, toRaw } from 'vue';

import { RichTextBoxElement } from '@/models/Element';
import type { DocumentProperties } from '@/models/Score';
import { Score } from '@/models/Score';
import { Workspace } from '@/models/Workspace';
import { CommandFactory } from '@/services/history/CommandService';

import {
  applyDocumentSave,
  captureDocumentSaveState,
  isDocumentSaveStateCurrent,
} from './documentPersistence';

const saved = { success: true, sourceMtimeMs: 10, sourceSize: 20 };

describe('save completion', () => {
  it('marks unchanged saved content clean and clears its recovered state', () => {
    const workspace = new Workspace();
    workspace.filePath = '/scores/original.byz';
    workspace.hasUnsavedChanges = true;
    workspace.isRecovered = true;
    const snapshot = captureDocumentSaveState(workspace);
    expect(applyDocumentSave(workspace, saved, snapshot)).toBe(true);
    expect(workspace.hasUnsavedChanges).toBe(false);
    expect(workspace.isRecovered).toBe(false);
    expect(workspace.filePath).toBe('/scores/original.byz');
    expect(workspace.sourceMtimeMs).toBe(10);
    expect(workspace.sourceSize).toBe(20);
  });

  it.each([false, true])(
    'preserves newer edits and clears recovered=%s after applying save-as metadata',
    (recovered) => {
      const workspace = new Workspace();
      workspace.hasUnsavedChanges = true;
      workspace.isRecovered = recovered;
      const snapshot = captureDocumentSaveState(workspace);
      workspace.commandService.execute(
        new CommandFactory<DocumentProperties>().create('update-properties', {
          target: workspace.score.documentProperties,
          newValues: { title: 'Changed during save' },
        }),
      );
      expect(
        applyDocumentSave(
          workspace,
          { ...saved, filePath: '/scores/new.byz' },
          snapshot,
        ),
      ).toBe(false);
      expect(workspace.filePath).toBe('/scores/new.byz');
      expect(workspace.hasUnsavedChanges).toBe(true);
      expect(workspace.isRecovered).toBe(false);
      expect(workspace.sourceMtimeMs).toBe(10);
      expect(workspace.sourceSize).toBe(20);
      expect(workspace.score.documentProperties.title).toBe(
        'Changed during save',
      );
    },
  );

  it('updates the save-as path before subsequent save states are compared', () => {
    const workspace = new Workspace();
    workspace.hasUnsavedChanges = true;
    expect(
      applyDocumentSave(
        workspace,
        { ...saved, filePath: '/scores/new.byzx' },
        captureDocumentSaveState(workspace),
      ),
    ).toBe(true);
    expect(workspace.filePath).toBe('/scores/new.byzx');
    expect(workspace.hasUnsavedChanges).toBe(false);
    const afterSave = captureDocumentSaveState(workspace);
    expect(isDocumentSaveStateCurrent(workspace, afterSave)).toBe(true);
    expect(applyDocumentSave(workspace, saved, afterSave)).toBe(true);
  });

  it('detects pending text once it is flushed into the model, even if its dirty flag was false', () => {
    const workspace = new Workspace();
    const box = new RichTextBoxElement();
    box.content = '<p>Saved version</p>';
    workspace.score.staff.elements = [box];
    const snapshot = captureDocumentSaveState(workspace);
    workspace.commandService.execute(
      new CommandFactory<RichTextBoxElement>().create('update-properties', {
        target: box,
        newValues: { content: '<p>Newer rich text</p>' },
      }),
    );
    expect(applyDocumentSave(workspace, saved, snapshot)).toBe(false);
    expect(workspace.hasUnsavedChanges).toBe(true);
  });

  it('ignores selection, zoom, and other non-file workspace state', () => {
    const workspace = new Workspace();
    const snapshot = captureDocumentSaveState(workspace);
    workspace.zoom = 2;
    workspace.hasUnsavedChanges = true;
    workspace.isRecovered = true;
    expect(applyDocumentSave(workspace, saved, snapshot)).toBe(true);
  });

  it('recognizes saved content after an intervening edit and undo', () => {
    const workspace = new Workspace();
    const snapshot = captureDocumentSaveState(workspace);
    workspace.commandService.execute(
      new CommandFactory<DocumentProperties>().create('update-properties', {
        target: workspace.score.documentProperties,
        newValues: { title: 'Temporary edit' },
      }),
    );
    workspace.commandService.undo();
    expect(workspace.contentRevision).toBe(snapshot.contentRevision + 2);
    expect(applyDocumentSave(workspace, saved, snapshot)).toBe(true);
    expect(workspace.hasUnsavedChanges).toBe(false);
  });

  it('remembers the written state when edits remain at save completion', () => {
    const workspace = new Workspace();
    const state = captureDocumentSaveState(workspace);
    workspace.commandService.execute(
      new CommandFactory<DocumentProperties>().create('update-properties', {
        target: workspace.score.documentProperties,
        newValues: { title: 'Newer edit' },
      }),
    );
    expect(applyDocumentSave(workspace, saved, state)).toBe(false);
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.commandService.undo();
    expect(workspace.hasUnsavedChanges).toBe(false);
  });

  it('finishes recovery once recovered content is written, even when later edits are undone after completion', () => {
    const workspace = new Workspace();
    workspace.isRecovered = true;
    workspace.hasUnsavedChanges = true;
    const state = captureDocumentSaveState(workspace);
    workspace.commandService.execute(
      new CommandFactory<DocumentProperties>().create('update-properties', {
        target: workspace.score.documentProperties,
        newValues: { title: 'Edit during recovered save' },
      }),
    );
    expect(applyDocumentSave(workspace, saved, state)).toBe(false);
    expect(workspace.isRecovered).toBe(false);
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.commandService.undo();
    expect(workspace.hasUnsavedChanges).toBe(false);
    expect(workspace.isRecovered).toBe(false);
  });

  it('marks an undone in-flight state saved so redo can return to it', () => {
    const workspace = new Workspace();
    workspace.commandService.execute(
      new CommandFactory<DocumentProperties>().create('update-properties', {
        target: workspace.score.documentProperties,
        newValues: { title: 'Written state' },
      }),
    );
    const state = captureDocumentSaveState(workspace);
    workspace.commandService.undo();
    expect(applyDocumentSave(workspace, saved, state)).toBe(false);
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.commandService.redo();
    expect(workspace.hasUnsavedChanges).toBe(false);
  });

  it('does not change the saved undo state after a failed write', () => {
    const workspace = new Workspace();
    workspace.commandService.execute(
      new CommandFactory<DocumentProperties>().create('update-properties', {
        target: workspace.score.documentProperties,
        newValues: { title: 'Failed save' },
      }),
    );
    expect(
      applyDocumentSave(
        workspace,
        { success: false },
        captureDocumentSaveState(workspace),
      ),
    ).toBe(false);
    workspace.commandService.undo();
    expect(workspace.hasUnsavedChanges).toBe(false);
    workspace.commandService.redo();
    expect(workspace.hasUnsavedChanges).toBe(true);
  });

  it('does not clear changes when the source path changed during the save', () => {
    const workspace = new Workspace();
    workspace.filePath = '/scores/first.byz';
    const snapshot = captureDocumentSaveState(workspace);
    workspace.filePath = '/scores/second.byz';
    expect(applyDocumentSave(workspace, saved, snapshot)).toBe(false);
    expect(workspace.filePath).toBe('/scores/second.byz');
    expect(workspace.hasUnsavedChanges).toBe(true);
  });

  it.each([{ success: false }, { success: false, canceled: true }])(
    'does not change any workspace state for an unsuccessful save: %j',
    (result) => {
      const workspace = new Workspace();
      workspace.filePath = '/scores/original.byz';
      workspace.hasUnsavedChanges = true;
      workspace.isRecovered = true;
      workspace.sourceMtimeMs = 30;
      workspace.sourceSize = 40;
      const snapshot = captureDocumentSaveState(workspace);
      expect(
        applyDocumentSave(
          workspace,
          {
            ...result,
            filePath: '/scores/other.byz',
            sourceMtimeMs: 99,
            sourceSize: 99,
          },
          snapshot,
        ),
      ).toBe(false);
      expect(captureDocumentSaveState(workspace)).toEqual(snapshot);
      expect(workspace.hasUnsavedChanges).toBe(true);
      expect(workspace.isRecovered).toBe(true);
      expect(workspace.sourceMtimeMs).toBe(30);
      expect(workspace.sourceSize).toBe(40);
    },
  );
});

describe('save state identity', () => {
  it('preserves recovered status for a replacement document while an older score finishes saving', () => {
    const workspace = new Workspace();
    const written = captureDocumentSaveState(workspace);
    workspace.score = new Score();
    workspace.isRecovered = true;
    expect(applyDocumentSave(workspace, saved, written)).toBe(false);
    expect(workspace.isRecovered).toBe(true);
    expect(workspace.hasUnsavedChanges).toBe(true);
  });
  it('recognizes edit and undo during recovery cleanup after a save-as', () => {
    const workspace = new Workspace();
    expect(
      applyDocumentSave(
        workspace,
        { ...saved, filePath: '/scores/new.byz' },
        captureDocumentSaveState(workspace),
      ),
    ).toBe(true);
    const afterWrite = captureDocumentSaveState(workspace);
    workspace.commandService.execute(
      new CommandFactory<DocumentProperties>().create('update-properties', {
        target: workspace.score.documentProperties,
        newValues: { title: 'Temporary cleanup edit' },
      }),
    );
    workspace.commandService.undo();
    expect(isDocumentSaveStateCurrent(workspace, afterWrite)).toBe(true);
    expect(workspace.hasUnsavedChanges).toBe(false);
  });
  it('detects whole-score replacement even without a command', () => {
    const workspace = new Workspace();
    const state = captureDocumentSaveState(workspace);
    workspace.score = new Score();
    expect(applyDocumentSave(workspace, saved, state)).toBe(false);
  });

  it('ignores recalculated measurements, including on raw layout objects', () => {
    const workspace = reactive(new Workspace()) as Workspace;
    const box = new RichTextBoxElement();
    workspace.score.staff.elements.push(box);
    const state = captureDocumentSaveState(workspace);
    const rawBox = toRaw(
      workspace.score.staff.elements[1],
    ) as RichTextBoxElement;
    rawBox.height = 100;
    expect(workspace.contentRevision).toBe(state.contentRevision);
    expect(applyDocumentSave(workspace, saved, state)).toBe(true);
  });

  it('uses the same identity through raw and reactive workspaces', () => {
    const workspace = reactive(new Workspace()) as Workspace;
    const state = captureDocumentSaveState(workspace);
    expect(isDocumentSaveStateCurrent(toRaw(workspace), state)).toBe(true);
    workspace.updateStaffLyrics('An edit');
    expect(isDocumentSaveStateCurrent(toRaw(workspace), state)).toBe(false);
  });

  it('detects edits during recovery cleanup after applying save-as metadata', () => {
    const workspace = new Workspace();
    const written = captureDocumentSaveState(workspace);
    expect(
      applyDocumentSave(
        workspace,
        { ...saved, filePath: '/scores/new.byz' },
        written,
      ),
    ).toBe(true);
    const afterWrite = captureDocumentSaveState(workspace);
    workspace.updateStaffLyrics('Typed during cleanup');
    expect(isDocumentSaveStateCurrent(workspace, afterWrite)).toBe(false);
    expect(workspace.hasUnsavedChanges).toBe(true);
  });
});
