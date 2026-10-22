import { describe, expect, it } from 'vitest';

import type { DocumentProperties } from '@/models/Score';
import { Workspace } from '@/models/Workspace';
import { CommandFactory } from '@/services/history/CommandService';

import { DocumentRevisions } from './documentRevisions';

describe('MCP document revisions', () => {
  it('detects an edit and undo between reads even when the document returns clean', () => {
    const workspace = new Workspace(false);
    const revisions = new DocumentRevisions();
    const before = revisions.read(workspace);
    workspace.commandService.execute(
      new CommandFactory<DocumentProperties>().create('update-properties', {
        target: workspace.score.documentProperties,
        newValues: { title: 'Temporary' },
      }),
    );
    workspace.commandService.undo();
    expect(workspace.hasUnsavedChanges).toBe(false);
    expect(revisions.read(workspace)).toBe(before + 2);
    expect(revisions.read(workspace)).toBe(before + 2);
  });
  it('invalidates earlier API reads after save-as without dirtying saved content', () => {
    const workspace = new Workspace(false);
    const revisions = new DocumentRevisions();
    const before = revisions.read(workspace);
    workspace.filePath = '/scores/new.byz';
    expect(revisions.read(workspace)).toBe(before + 1);
    expect(workspace.hasUnsavedChanges).toBe(false);
    expect(workspace.contentRevision).toBe(0);
  });
  it('ignores selection, zoom and completed writes to the same source', () => {
    const workspace = new Workspace(false);
    const revisions = new DocumentRevisions();
    const before = revisions.read(workspace);
    workspace.zoom = 2;
    workspace.sourceMtimeMs = 42;
    workspace.sourceSize = 100;
    expect(revisions.read(workspace)).toBe(before);
  });
});
