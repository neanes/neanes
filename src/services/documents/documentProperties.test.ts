import { describe, expect, it } from 'vitest';

import { Workspace } from '@/models/Workspace';

import { replaceDocumentProperties } from './documentProperties';

describe('document properties', () => {
  it('replaces all metadata in one undo step', () => {
    const workspace = new Workspace();
    const original = { ...workspace.score.documentProperties };
    replaceDocumentProperties(workspace, {
      title: 'Example',
      author: 'Author',
    });
    expect(workspace.score.documentProperties).toEqual({
      title: 'Example',
      author: 'Author',
    });
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.commandService.undo();
    expect(workspace.score.documentProperties).toEqual(original);
    workspace.commandService.redo();
    expect(workspace.score.documentProperties.title).toBe('Example');
  });

  it('requires the entire metadata object and validates before mutation', () => {
    const workspace = new Workspace();
    const input = JSON.parse('{"title":"Should not change"}');
    expect(() => replaceDocumentProperties(workspace, input)).toThrow();
    expect(workspace.score.documentProperties.title).toBe('');
    expect(workspace.hasUnsavedChanges).toBe(false);
  });
});
