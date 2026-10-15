import { describe, expect, it } from 'vitest';

import { Workspace } from '@/models/Workspace';

import { applyDocumentSave, snapshotDocument } from './documentPersistence';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('document save completion', () => {
  it('applies save-as metadata and clears recovery state for the exact saved content', () => {
    const workspace = new Workspace();
    workspace.hasUnsavedChanges = true;
    workspace.isRecovered = true;
    const snapshot = snapshotDocument(workspace);
    expect(
      applyDocumentSave(
        workspace,
        {
          success: true,
          filePath: '/scores/new.byzx',
          sourceFormat: 'byzx',
          sourceMtimeMs: 10,
          sourceSize: 20,
        },
        snapshot,
      ),
    ).toBe(true);
    expect(workspace.filePath).toBe('/scores/new.byzx');
    expect(workspace.sourceFormat).toBe('byzx');
    expect(workspace.sourceMtimeMs).toBe(10);
    expect(workspace.sourceSize).toBe(20);
    expect(workspace.hasUnsavedChanges).toBe(false);
    expect(workspace.isRecovered).toBe(false);
  });

  it('preserves unsaved edits made while either save surface was writing', () => {
    const workspace = new Workspace();
    workspace.hasUnsavedChanges = true;
    workspace.isRecovered = true;
    const snapshot = snapshotDocument(workspace);
    workspace.score.documentProperties.title = 'Changed during save';
    expect(
      applyDocumentSave(
        workspace,
        {
          success: true,
          filePath: '/scores/new.byzx',
          sourceFormat: 'byzx',
          sourceMtimeMs: 10,
          sourceSize: 20,
        },
        snapshot,
      ),
    ).toBe(false);
    expect(workspace.filePath).toBe('/scores/new.byzx');
    expect(workspace.sourceFormat).toBe('byzx');
    expect(workspace.hasUnsavedChanges).toBe(true);
    expect(workspace.isRecovered).toBe(true);
    expect(workspace.score.documentProperties.title).toBe(
      'Changed during save',
    );
  });

  it('does not change the workspace when a save is canceled or fails', () => {
    const workspace = new Workspace();
    workspace.filePath = '/scores/original.byzx';
    workspace.hasUnsavedChanges = true;
    const snapshot = snapshotDocument(workspace);
    expect(
      applyDocumentSave(
        workspace,
        { success: false, filePath: '/scores/other.byzx' },
        snapshot,
      ),
    ).toBe(false);
    expect(snapshotDocument(workspace)).toBe(snapshot);
    expect(workspace.hasUnsavedChanges).toBe(true);
  });
});
