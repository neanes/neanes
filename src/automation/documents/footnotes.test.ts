import { describe, expect, it } from 'vitest';

import { elementEditBatchSchema } from '@/automation/contracts/elementEditSchema';
import type { NoteElement } from '@/models/Element';
import { Workspace } from '@/models/Workspace';

import { ElementDiscovery } from './elementDiscovery';
import { applyElementEdits, planElementEdits } from './elementEdits';

describe('footnote transactions', () => {
  it('keeps authoritative lyrics and locks scoped to their own staff', () => {
    const workspace = new Workspace();
    const discovery = new ElementDiscovery();
    const edit = (actions: unknown) =>
      applyElementEdits(
        workspace,
        planElementEdits(
          workspace,
          discovery,
          elementEditBatchSchema.parse(actions),
          [],
        ),
      );
    edit([
      {
        action: 'insert',
        elements: [{ elementType: 'Note', clientId: 'anchor' }],
      },
      {
        action: 'insert_footnote',
        elementRef: '@anchor',
        elements: [{ elementType: 'Note' }],
      },
      { action: 'set_staff_lyrics', text: 'Main', locked: true },
    ]);
    const body = workspace.score.footnotes[0];
    const collection = { kind: 'footnote', footnoteId: body.id };
    edit([
      {
        action: 'set_staff_lyrics',
        collection,
        text: 'Footnote',
        locked: true,
      },
    ]);
    expect((workspace.score.staff.elements[0] as NoteElement).lyrics).toBe(
      'Main',
    );
    expect((body.staff.elements[0] as NoteElement).lyrics).toBe('Footnote');
    expect(() =>
      edit([
        {
          action: 'update',
          elementRef: discovery.reference(body.staff.elements[0]),
          elementType: 'Note',
          properties: { lyrics: 'Overwrite' },
        },
      ]),
    ).toThrow('LYRICS_LOCKED');
    edit([
      { action: 'insert', collection, elements: [{ elementType: 'Note' }] },
    ]);
    expect(body.staff.lyrics.text).toBe('Footnote');
    expect(workspace.score.staff.lyrics.text).toBe('Main');
    edit([
      {
        action: 'set_staff_lyrics',
        collection,
        text: 'New text',
        locked: false,
      },
    ]);
    expect(body.staff.lyrics.locked).toBe(false);
    expect(workspace.score.staff.lyrics.locked).toBe(true);
  });

  it('creates, discovers, edits and removes a body with its reference', () => {
    const workspace = new Workspace();
    const discovery = new ElementDiscovery();
    const edit = (actions: unknown) =>
      applyElementEdits(
        workspace,
        planElementEdits(
          workspace,
          discovery,
          elementEditBatchSchema.parse(actions),
          [],
        ),
      );
    edit([
      {
        action: 'insert',
        elements: [{ elementType: 'Note', clientId: 'anchor' }],
      },
      {
        action: 'insert_footnote',
        elementRef: '@anchor',
        elements: [
          {
            elementType: 'TextBox',
            properties: { content: 'Explanation', lineBreak: true },
          },
          { elementType: 'Note', properties: { lyrics: 'Footnote chant' } },
        ],
      },
    ]);
    const reference = workspace.score.staff.elements[0] as NoteElement;
    const body = workspace.score.footnotes[0];
    expect(body.id).toBe(reference.footnoteId);
    expect(body.staff.elements).toHaveLength(3);
    expect(
      discovery.location(workspace.score, body.staff.elements[1])?.collection,
    ).toEqual({ kind: 'footnote', footnoteId: body.id });
    edit([
      {
        action: 'insert',
        collection: { kind: 'footnote', footnoteId: body.id },
        elements: [{ elementType: 'Note', properties: { lyrics: 'More' } }],
      },
    ]);
    expect(body.staff.elements.at(-1)?.elementType).toBe('Empty');
    edit([{ action: 'remove', elementRef: discovery.reference(reference) }]);
    expect(workspace.score.footnotes).toHaveLength(0);
    workspace.commandService.undo();
    expect(workspace.score.footnotes[0].id).toBe(body.id);
    expect(workspace.score.staff.elements[0]).toBe(reference);
  });

  it('rejects nested references atomically', () => {
    const workspace = new Workspace();
    const discovery = new ElementDiscovery();
    const actions = elementEditBatchSchema.parse([
      {
        action: 'insert',
        elements: [{ elementType: 'Note', clientId: 'anchor' }],
      },
      {
        action: 'insert_footnote',
        elementRef: '@anchor',
        elements: [{ elementType: 'Note', clientId: 'child' }],
      },
      { action: 'insert_footnote', elementRef: '@child' },
    ]);
    expect(() => planElementEdits(workspace, discovery, actions, [])).toThrow(
      'INVALID_ELEMENT_EDIT',
    );
    expect(workspace.score.footnotes).toHaveLength(0);
    expect(workspace.score.staff.elements).toHaveLength(1);
  });
});
