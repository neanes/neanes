import { describe, expect, it } from 'vitest';
import { computed, reactive } from 'vue';

import { CommandFactory } from '@/services/history/CommandService';

import type { ScoreElement } from './Element';
import { NoteElement } from './Element';
import type { DocumentProperties } from './Score';
import { Score } from './Score';
import { Workspace } from './Workspace';

const properties = new CommandFactory<DocumentProperties>();
const elements = new CommandFactory<ScoreElement>();

function changeTitle(workspace: Workspace, title: string) {
  return properties.create('update-properties', {
    target: workspace.score.documentProperties,
    newValues: { title },
  });
}

describe('workspace content revisions', () => {
  it('invalidates a replaced score while preserving its loaded dirty-state baseline', () => {
    const workspace = reactive(new Workspace()) as Workspace;
    const replacement = new Score();
    workspace.score = replacement;
    expect(workspace.contentRevision).toBe(1);
    expect(workspace.hasUnsavedChanges).toBe(false);
    workspace.score = replacement;
    workspace.score = workspace.score;
    expect(workspace.contentRevision).toBe(1);
    workspace.hasUnsavedChanges = true;
    workspace.score = new Score();
    expect(workspace.contentRevision).toBe(2);
    expect(workspace.hasUnsavedChanges).toBe(true);
  });
  it('tracks execute, undo, and redo independently of the dirty flag', () => {
    const workspace = new Workspace();
    const history = workspace.commandService;
    history.execute(changeTitle(workspace, 'Title'));
    expect(workspace.contentRevision).toBe(1);
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.hasUnsavedChanges = false;
    history.undo();
    expect(workspace.score.documentProperties.title).toBe('');
    expect(workspace.contentRevision).toBe(2);
    expect(workspace.hasUnsavedChanges).toBe(true);
    history.redo();
    expect(workspace.score.documentProperties.title).toBe('Title');
    expect(workspace.contentRevision).toBe(3);
  });

  it('tracks collection insertion, replacement, and removal through undo and redo', () => {
    const workspace = new Workspace();
    const collection = workspace.score.staff.elements;
    const first = new NoteElement();
    const replacement = new NoteElement();
    const history = workspace.commandService;
    history.execute(
      elements.create('add-to-collection', {
        collection,
        elements: [first],
        insertAtIndex: 0,
      }),
    );
    history.execute(
      elements.create('replace-element-in-collection', {
        collection,
        element: replacement,
        replaceAtIndex: 0,
      }),
    );
    history.execute(
      elements.create('remove-from-collection', {
        collection,
        element: replacement,
      }),
    );
    expect(workspace.contentRevision).toBe(3);
    history.undo();
    expect(collection[0]).toBe(replacement);
    history.undo();
    expect(collection[0]).toBe(first);
    history.undo();
    expect(collection).toHaveLength(1);
    history.redo();
    history.redo();
    history.redo();
    expect(collection).toHaveLength(1);
    expect(workspace.contentRevision).toBe(9);
  });

  it.each([false, true])(
    'publishes one revision per batch, with noHistory=%s',
    (noHistory) => {
      const workspace = new Workspace();
      workspace.commandService.executeAsBatch(
        [changeTitle(workspace, 'First'), changeTitle(workspace, 'Second')],
        noHistory,
      );
      expect(workspace.contentRevision).toBe(1);
      expect(workspace.hasUnsavedChanges).toBe(true);
      workspace.commandService.undo();
      expect(workspace.score.documentProperties.title).toBe(
        noHistory ? 'Second' : '',
      );
      expect(workspace.contentRevision).toBe(noHistory ? 1 : 2);
      workspace.commandService.redo();
      expect(workspace.score.documentProperties.title).toBe('Second');
      expect(workspace.contentRevision).toBe(noHistory ? 1 : 3);
    },
  );

  it('tracks a noHistory content command without creating an undo step', () => {
    const workspace = new Workspace();
    workspace.commandService.execute(
      changeTitle(workspace, 'Automatic content edit'),
      true,
    );
    workspace.commandService.undo();
    expect(workspace.contentRevision).toBe(1);
    expect(workspace.hasUnsavedChanges).toBe(true);
    expect(workspace.score.documentProperties.title).toBe(
      'Automatic content edit',
    );
  });

  it('ignores empty operations without discarding redo history', () => {
    const workspace = new Workspace();
    const history = workspace.commandService;
    history.execute(changeTitle(workspace, 'Title'));
    history.undo();
    workspace.hasUnsavedChanges = false;
    history.execute(changeTitle(workspace, ''));
    history.executeAsBatch([]);
    history.executeAsBatch([changeTitle(workspace, '')]);
    const collection = workspace.score.staff.elements;
    history.execute(
      elements.create('add-to-collection', { collection, elements: [] }),
    );
    history.execute(
      elements.create('remove-from-collection', {
        collection,
        element: new NoteElement(),
      }),
    );
    history.execute(
      elements.create('replace-element-in-collection', {
        collection,
        element: collection[0],
        replaceAtIndex: 0,
      }),
    );
    history.undo();
    expect(workspace.contentRevision).toBe(2);
    expect(workspace.hasUnsavedChanges).toBe(false);
    history.redo();
    expect(workspace.score.documentProperties.title).toBe('Title');
    expect(workspace.contentRevision).toBe(3);
  });

  it('does not advance the revision when clearing or notifying history', () => {
    const workspace = new Workspace();
    workspace.commandService.execute(changeTitle(workspace, 'Title'));
    workspace.hasUnsavedChanges = false;
    workspace.commandService.notify();
    workspace.commandService.clearHistory();
    workspace.commandService.undo();
    workspace.commandService.redo();
    expect(workspace.contentRevision).toBe(1);
    expect(workspace.hasUnsavedChanges).toBe(false);
  });

  it('tracks lyrics and lock commands without adding undo steps', () => {
    const workspace = new Workspace();
    workspace.updateStaffLyrics('Lyrics');
    workspace.updateLyricsLocked(true);
    workspace.hasUnsavedChanges = false;
    workspace.updateStaffLyrics('Lyrics');
    workspace.updateLyricsLocked(true);
    workspace.commandService.undo();
    expect(workspace.score.staff.lyrics).toEqual({
      text: 'Lyrics',
      locked: true,
    });
    expect(workspace.contentRevision).toBe(2);
    expect(workspace.hasUnsavedChanges).toBe(false);
    workspace.updateStaffLyrics('New lyrics');
    expect(workspace.contentRevision).toBe(3);
    expect(workspace.hasUnsavedChanges).toBe(true);
  });

  it('keeps shared tracking reactive and scoped to each workspace', () => {
    const first = reactive(new Workspace()) as Workspace;
    const second = reactive(new Workspace()) as Workspace;
    const dirty = computed(() => first.hasUnsavedChanges);
    const revision = computed(() => first.contentRevision);
    expect(dirty.value).toBe(false);
    expect(revision.value).toBe(0);
    first.commandService.execute(changeTitle(first, 'Title'));
    expect(dirty.value).toBe(true);
    expect(revision.value).toBe(1);
    expect(second.contentRevision).toBe(0);
    expect(second.hasUnsavedChanges).toBe(false);
    first.hasUnsavedChanges = false;
    expect(dirty.value).toBe(false);
    first.updateStaffLyrics('Lyrics');
    expect(dirty.value).toBe(true);
    expect(revision.value).toBe(2);
  });

  it('invalidates captured content when a batch fails after applying an edit', () => {
    const workspace = new Workspace();
    const immutable = Object.freeze({ title: 'Read only' });
    expect(() =>
      workspace.commandService.executeAsBatch([
        changeTitle(workspace, 'Applied'),
        new CommandFactory<{ title: string }>().create('update-properties', {
          target: immutable,
          newValues: { title: 'Cannot apply' },
        }),
      ]),
    ).toThrow(TypeError);
    expect(workspace.score.documentProperties.title).toBe('Applied');
    expect(workspace.contentRevision).toBe(1);
    expect(workspace.hasUnsavedChanges).toBe(true);
  });
});
