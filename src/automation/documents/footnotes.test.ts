import { describe, expect, it } from 'vitest';

import { elementEditBatchSchema } from '@/automation/contracts/elementEditSchema';
import type { NoteElement } from '@/models/Element';
import { Workspace } from '@/models/Workspace';

import { ElementDiscovery } from './elementDiscovery';
import { applyElementEdits, planElementEdits } from './elementEdits';

describe('footnote transactions', () => {
  it.each(['staff', 'alternate', 'footnote'])(
    'rejects annotation references recursively in %s without changing the document',
    (location) => {
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
      const actions: unknown[] = [
        {
          action: 'insert',
          elements: [{ elementType: 'Note', clientId: 'anchor' }],
        },
      ];
      let parentRef = '@anchor';
      if (location === 'alternate') {
        actions.push(
          {
            action: 'insert',
            collection: {
              kind: 'children',
              parentRef,
              collection: 'alternateLines',
            },
            elements: [{ elementType: 'AlternateLine', clientId: 'line' }],
          },
          {
            action: 'insert',
            collection: {
              kind: 'children',
              parentRef: '@line',
              collection: 'elements',
            },
            elements: [{ elementType: 'Note', clientId: 'nested' }],
          },
        );
        parentRef = '@nested';
      } else if (location === 'footnote') {
        actions.push({
          action: 'insert_footnote',
          elementRef: parentRef,
          elements: [{ elementType: 'Note', clientId: 'nested' }],
        });
        parentRef = '@nested';
      }
      actions.push({
        action: 'insert',
        collection: { kind: 'children', parentRef, collection: 'annotations' },
        elements: [
          {
            elementType: 'Annotation',
            properties: { text: '<p>Original</p>' },
          },
        ],
      });
      edit(actions);
      const note =
        location === 'staff'
          ? (workspace.score.staff.elements[0] as NoteElement)
          : location === 'footnote'
            ? (workspace.score.footnotes[0].staff.elements[0] as NoteElement)
            : ((workspace.score.staff.elements[0] as NoteElement)
                .alternateLines[0].elements[0] as NoteElement);
      const annotation = note.annotations[0];
      const revision = workspace.contentRevision;
      const invalid =
        '<p><span class="neanes-footnote" data-footnote-id="00000000-0000-4000-8000-000000000001"></span></p>';
      expect(() =>
        edit([
          {
            action: 'update',
            elementRef: discovery.reference(annotation),
            elementType: 'Annotation',
            properties: { text: invalid },
          },
        ]),
      ).toThrow('INVALID_ELEMENT_EDIT');
      expect(annotation.text).toBe('<p>Original</p>');
      expect(workspace.contentRevision).toBe(revision);
      expect(() =>
        edit([
          {
            action: 'insert',
            collection: {
              kind: 'children',
              parentRef: discovery.reference(note),
              collection: 'annotations',
            },
            elements: [
              { elementType: 'Annotation', properties: { text: invalid } },
            ],
          },
        ]),
      ).toThrow('INVALID_ELEMENT_EDIT');
      expect(note.annotations).toHaveLength(1);
      expect(workspace.contentRevision).toBe(revision);
    },
  );

  it('stages marker changes atomically and exposes footnote marker metadata', () => {
    const workspace = new Workspace();
    const discovery = new ElementDiscovery();
    const plan = (actions: unknown) =>
      planElementEdits(
        workspace,
        discovery,
        elementEditBatchSchema.parse(actions),
        [],
      );
    applyElementEdits(
      workspace,
      plan([
        {
          action: 'insert',
          elements: [{ elementType: 'Note', clientId: 'note' }],
        },
        { action: 'insert_footnote', elementRef: '@note' },
      ]),
    );
    const body = workspace.score.footnotes[0];
    const change = plan([
      { action: 'update_footnote', footnoteId: body.id, marker: ' \u2021 ' },
    ]);
    expect(body.marker).toBeNull();
    applyElementEdits(workspace, change);
    expect(body.marker).toBe('\u2021');
    const result = discovery.read(workspace.score, {
      collection: { kind: 'footnote', footnoteId: body.id },
      start: 0,
      offset: 0,
      limit: 10,
    });
    expect(result.footnote).toEqual({
      id: body.id,
      marker: '\u2021',
      label: '\u2021',
      number: null,
    });
    expect(() =>
      plan([
        { action: 'update_footnote', footnoteId: body.id, marker: '*' },
        {
          action: 'update_footnote',
          footnoteId: '00000000-0000-4000-8000-000000000001',
          marker: '*',
        },
      ]),
    ).toThrow('INVALID_FOOTNOTE_REFERENCE');
    expect(body.marker).toBe('\u2021');
    workspace.commandService.undo();
    expect(body.marker).toBeNull();
    expect(
      elementEditBatchSchema.safeParse([
        {
          action: 'update_footnote',
          footnoteId: body.id,
          marker: 'bad\nmarker',
        },
      ]).success,
    ).toBe(false);
  });

  it('inserts rich text references and removes their bodies with content edits', () => {
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
        elements: [
          {
            elementType: 'RichTextBox',
            clientId: 'box',
            properties: { content: '<p>Before after</p>' },
          },
        ],
      },
      {
        action: 'insert_footnote',
        elementRef: '@box',
        contentKey: 'content',
        htmlOffset: 9,
        elements: [{ elementType: 'Note', properties: { spaceAfter: 37 } }],
      },
    ]);
    const box = workspace.score.staff.elements.find(
      (element) => element.elementType === 'RichTextBox',
    )!;
    const reference = discovery.reference(box);
    const body = workspace.score.footnotes[0];
    expect(body.staff.elements[0]).toHaveProperty('spaceAfter', 37);
    edit([
      {
        action: 'update',
        elementRef: reference,
        elementType: 'RichTextBox',
        properties: { content: '<p>Edited</p>' },
      },
    ]);
    expect(workspace.score.footnotes).toEqual([]);
    workspace.commandService.undo();
    expect(workspace.score.footnotes[0]).toBe(body);
    expect(() =>
      edit([
        {
          action: 'update',
          elementRef: reference,
          elementType: 'RichTextBox',
          properties: {
            content:
              '<p><span class="neanes-footnote" data-footnote-id="00000000-0000-4000-8000-000000000001"></span></p>',
          },
        },
      ]),
    ).toThrow('INVALID_FOOTNOTE_REFERENCE');
    expect(workspace.score.footnotes[0]).toBe(body);
  });
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
