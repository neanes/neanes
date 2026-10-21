import { describe, expect, it } from 'vitest';

import { RichTextBoxElement } from '@/models/Element';
import { Workspace } from '@/models/Workspace';

import { applyDocumentSave, snapshotDocument } from './documentPersistence';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

const saved = { success: true, sourceMtimeMs: 10, sourceSize: 20 };

describe('save completion', () => {
  it('marks unchanged saved content clean and clears its recovered state', () => {
    const workspace = new Workspace();
    workspace.filePath = '/scores/original.byz';
    workspace.hasUnsavedChanges = true;
    workspace.isRecovered = true;
    const snapshot = snapshotDocument(workspace);
    expect(applyDocumentSave(workspace, saved, snapshot)).toBe(true);
    expect(workspace.hasUnsavedChanges).toBe(false);
    expect(workspace.isRecovered).toBe(false);
    expect(workspace.filePath).toBe('/scores/original.byz');
    expect(workspace.sourceMtimeMs).toBe(10);
    expect(workspace.sourceSize).toBe(20);
  });

  it.each([false, true])(
    'preserves newer edits and recovered=%s while applying save-as metadata',
    (recovered) => {
      const workspace = new Workspace();
      workspace.hasUnsavedChanges = true;
      workspace.isRecovered = recovered;
      const snapshot = snapshotDocument(workspace);
      workspace.score.documentProperties.title = 'Changed during save';
      expect(
        applyDocumentSave(
          workspace,
          { ...saved, filePath: '/scores/new.byz' },
          snapshot,
        ),
      ).toBe(false);
      expect(workspace.filePath).toBe('/scores/new.byz');
      expect(workspace.hasUnsavedChanges).toBe(true);
      expect(workspace.isRecovered).toBe(recovered);
      expect(workspace.sourceMtimeMs).toBe(10);
      expect(workspace.sourceSize).toBe(20);
      expect(workspace.score.documentProperties.title).toBe(
        'Changed during save',
      );
    },
  );

  it('updates the save-as path before subsequent snapshots are compared', () => {
    const workspace = new Workspace();
    workspace.hasUnsavedChanges = true;
    expect(
      applyDocumentSave(
        workspace,
        { ...saved, filePath: '/scores/new.byzx' },
        snapshotDocument(workspace),
      ),
    ).toBe(true);
    expect(workspace.filePath).toBe('/scores/new.byzx');
    expect(workspace.hasUnsavedChanges).toBe(false);
    const afterSave = snapshotDocument(workspace);
    expect(afterSave).not.toBe(snapshotDocument(new Workspace()));
    expect(applyDocumentSave(workspace, saved, afterSave)).toBe(true);
  });

  it('detects pending text once it is flushed into the model, even if its dirty flag was false', () => {
    const workspace = new Workspace();
    const box = new RichTextBoxElement();
    box.content = '<p>Saved version</p>';
    workspace.score.staff.elements = [box];
    const snapshot = snapshotDocument(workspace);
    box.content = '<p>Newer rich text</p>';
    expect(applyDocumentSave(workspace, saved, snapshot)).toBe(false);
    expect(workspace.hasUnsavedChanges).toBe(true);
  });

  it('ignores selection, zoom, and other non-file workspace state', () => {
    const workspace = new Workspace();
    const snapshot = snapshotDocument(workspace);
    workspace.zoom = 2;
    workspace.hasUnsavedChanges = true;
    workspace.isRecovered = true;
    expect(applyDocumentSave(workspace, saved, snapshot)).toBe(true);
  });

  it('treats content restored to the saved snapshot as clean', () => {
    const workspace = new Workspace();
    const snapshot = snapshotDocument(workspace);
    const title = workspace.score.documentProperties.title;
    workspace.score.documentProperties.title = 'Temporary edit';
    workspace.score.documentProperties.title = title;
    expect(applyDocumentSave(workspace, saved, snapshot)).toBe(true);
  });

  it('does not clear changes when the source path changed during the save', () => {
    const workspace = new Workspace();
    workspace.filePath = '/scores/first.byz';
    const snapshot = snapshotDocument(workspace);
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
      const snapshot = snapshotDocument(workspace);
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
      expect(snapshotDocument(workspace)).toBe(snapshot);
      expect(workspace.hasUnsavedChanges).toBe(true);
      expect(workspace.isRecovered).toBe(true);
      expect(workspace.sourceMtimeMs).toBe(30);
      expect(workspace.sourceSize).toBe(40);
    },
  );
});
