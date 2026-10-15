import { describe, expect, it } from 'vitest';

import { Workspace } from '@/models/Workspace';

import { assertDocumentCanClose } from './documentLifecycle';
import { snapshotDocument } from './documentPersistence';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('document close policy', () => {
  it('allows a saved document to close without discard permission', () => {
    const workspace = new Workspace();
    expect(() =>
      assertDocumentCanClose(workspace, {
        expectedSnapshot: snapshotDocument(workspace),
      }),
    ).not.toThrow();
  });
  it('requires explicit permission to discard unsaved content', () => {
    const workspace = new Workspace();
    workspace.hasUnsavedChanges = true;
    const snapshot = snapshotDocument(workspace);
    expect(() =>
      assertDocumentCanClose(workspace, { expectedSnapshot: snapshot }),
    ).toThrow('UNSAVED_CHANGES');
    expect(() =>
      assertDocumentCanClose(workspace, {
        expectedSnapshot: snapshot,
        discardUnsavedChanges: true,
      }),
    ).not.toThrow();
    expect(workspace.hasUnsavedChanges).toBe(true);
  });
  it('protects a recovered draft even when its dirty flag is clear', () => {
    const workspace = new Workspace();
    workspace.isRecovered = true;
    expect(workspace.hasUnsavedChanges).toBe(false);
    const expectedSnapshot = snapshotDocument(workspace);
    expect(() =>
      assertDocumentCanClose(workspace, { expectedSnapshot }),
    ).toThrow('UNSAVED_CHANGES');
    expect(() =>
      assertDocumentCanClose(workspace, {
        expectedSnapshot,
        discardUnsavedChanges: true,
      }),
    ).not.toThrow();
    expect(workspace.isRecovered).toBe(true);
  });

  it.each([false, true])(
    'rejects newer content even when discard is %s',
    (discardUnsavedChanges) => {
      const workspace = new Workspace();
      const snapshot = snapshotDocument(workspace);
      workspace.score.documentProperties.title = 'Newer user edit';
      workspace.hasUnsavedChanges = true;
      expect(() =>
        assertDocumentCanClose(workspace, {
          expectedSnapshot: snapshot,
          discardUnsavedChanges,
        }),
      ).toThrow('REVISION_CONFLICT');
      expect(workspace.score.documentProperties.title).toBe('Newer user edit');
    },
  );
});
