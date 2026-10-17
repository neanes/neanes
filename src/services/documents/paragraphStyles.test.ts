import { describe, expect, it } from 'vitest';

import { NoteElement } from '@/models/Element';
import { ParagraphStyle } from '@/models/ParagraphStyle';
import { Workspace } from '@/models/Workspace';

import { replaceParagraphStyles } from './paragraphStyles';

describe('shared paragraph style edits', () => {
  it('remaps deleted styles to their surviving parent and undoes both changes together', () => {
    const workspace = new Workspace();
    const custom = new ParagraphStyle();
    custom.parentStyleId = 'lyrics';
    workspace.score.paragraphStyles.push(custom);
    const note = new NoteElement();
    note.lyricsParagraphStyleId = custom.id;
    workspace.score.staff.elements.push(note);

    replaceParagraphStyles(
      workspace,
      workspace.score.paragraphStyles.filter((style) => style.id !== custom.id),
    );
    expect(note.lyricsParagraphStyleId).toBe('lyrics');
    expect(
      workspace.score.paragraphStyles.some((style) => style.id === custom.id),
    ).toBe(false);
    expect(workspace.hasUnsavedChanges).toBe(true);

    workspace.commandService.undo();
    expect(note.lyricsParagraphStyleId).toBe(custom.id);
    expect(
      workspace.score.paragraphStyles.some((style) => style.id === custom.id),
    ).toBe(true);
    workspace.commandService.redo();
    expect(note.lyricsParagraphStyleId).toBe('lyrics');
  });
});
