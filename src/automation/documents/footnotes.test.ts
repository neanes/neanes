import { describe, expect, it } from 'vitest';

import { elementEditBatchSchema } from '@/automation/contracts/elementEditSchema';
import type { NoteElement } from '@/models/Element';
import { Workspace } from '@/models/Workspace';

import { ElementDiscovery } from './elementDiscovery';
import { applyElementEdits, planElementEdits } from './elementEdits';

describe('footnote transactions', () => {
  it('rejects tempo footnotes and omits footnote properties from tempo discovery', () => {
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
    edit([{ action: 'insert', elements: [{ elementType: 'Tempo' }] }]);
    const tempo = workspace.score.staff.elements[0];
    const revision = workspace.contentRevision;
    for (const action of ['insert_footnote', 'remove_footnote']) {
      expect(() =>
        edit([{ action, elementRef: discovery.reference(tempo) }]),
      ).toThrow('INVALID_ELEMENT_EDIT');
    }
    expect(workspace.contentRevision).toBe(revision);
    expect(workspace.score.footnotes).toHaveLength(0);
    const result = discovery.read(workspace.score, {
      collection: { kind: 'staff' },
      start: 0,
      offset: 0,
      limit: 10,
    });
    for (const [key, value] of Object.entries({
      footnoteId: '00000000-0000-4000-8000-000000000001',
      footnoteNumber: 1,
      footnoteMarker: '*',
      footnoteOffsetX: 0.3,
      footnoteOffsetY: -0.5,
    })) {
      expect(result.elements[0].properties).not.toHaveProperty(key);
      expect(() =>
        elementEditBatchSchema.parse([
          {
            action: 'update',
            elementType: 'Tempo',
            elementRef: discovery.reference(tempo),
            properties: { [key]: value },
          },
        ]),
      ).toThrow();
    }
  });

  it.each(['Note', 'Martyria'])(
    'removes the footnote when replacing %s with a tempo and restores it on undo',
    (elementType) => {
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
              elementType,
              clientId: 'anchor',
              properties: { footnoteOffsetX: 0.3, footnoteOffsetY: -0.5 },
            },
          ],
        },
        { action: 'insert_footnote', elementRef: '@anchor' },
      ]);
      const original = workspace.score.staff.elements[0];
      const body = workspace.score.footnotes[0];
      edit([
        {
          action: 'replace',
          elementRef: discovery.reference(original),
          element: { elementType: 'Tempo' },
        },
      ]);
      expect(workspace.score.staff.elements[0].elementType).toBe('Tempo');
      expect(workspace.score.staff.elements[0]).not.toHaveProperty(
        'footnoteId',
      );
      expect(workspace.score.footnotes).toHaveLength(0);
      workspace.commandService.undo();
      expect(workspace.score.staff.elements[0]).toBe(original);
      expect(original).toMatchObject({
        footnoteId: body.id,
        footnoteOffsetX: 0.3,
        footnoteOffsetY: -0.5,
      });
      expect(workspace.score.footnotes).toEqual([body]);
      workspace.commandService.redo();
      expect(workspace.score.footnotes).toHaveLength(0);
    },
  );

  it.each([
    {},
    { footnoteOffsetX: 0 },
    { footnoteOffsetY: 0 },
    { footnoteOffsetX: -0.2, footnoteOffsetY: 0.4 },
  ])(
    'preserves inherited and explicit marker offsets during replacement: %j',
    (properties) => {
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
              elementType: 'Martyria',
              clientId: 'anchor',
              properties: { footnoteOffsetX: 0.3, footnoteOffsetY: -0.5 },
            },
          ],
        },
        { action: 'insert_footnote', elementRef: '@anchor' },
      ]);
      const original = workspace.score.staff.elements[0];
      const footnote = workspace.score.footnotes[0];
      edit([
        {
          action: 'replace',
          elementRef: discovery.reference(original),
          element: { elementType: 'Note', properties },
        },
      ]);
      const expected = {
        elementType: 'Note',
        footnoteId: footnote.id,
        footnoteOffsetX: 0.3,
        footnoteOffsetY: -0.5,
        ...properties,
      };
      expect(workspace.score.staff.elements[0]).toMatchObject(expected);
      expect(workspace.score.footnotes).toEqual([footnote]);
      workspace.commandService.undo();
      expect(workspace.score.staff.elements[0]).toBe(original);
      expect(original).toMatchObject({
        footnoteOffsetX: 0.3,
        footnoteOffsetY: -0.5,
      });
      workspace.commandService.redo();
      expect(workspace.score.staff.elements[0]).toMatchObject(expected);
      expect(workspace.score.footnotes).toEqual([footnote]);
    },
  );

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

  it.each(['Note', 'Martyria'])(
    'supports footnote insertion and offset edits on %s through MCP',
    (elementType) => {
      const workspace = new Workspace();
      const discovery = new ElementDiscovery();
      applyElementEdits(
        workspace,
        planElementEdits(
          workspace,
          discovery,
          elementEditBatchSchema.parse([
            {
              action: 'insert',
              elements: [{ elementType, clientId: 'anchor' }],
            },
            { action: 'insert_footnote', elementRef: '@anchor' },
            {
              action: 'update',
              elementType,
              elementRef: '@anchor',
              properties: { footnoteOffsetX: 0.3, footnoteOffsetY: -0.2 },
            },
          ]),
          [],
        ),
      );
      const anchor = workspace.score.staff.elements[0];
      expect(anchor).toMatchObject({
        footnoteId: workspace.score.footnotes[0].id,
        footnoteOffsetX: 0.3,
        footnoteOffsetY: -0.2,
      });
      expect(() =>
        elementEditBatchSchema.parse([
          {
            action: 'update',
            elementType,
            elementRef: discovery.reference(anchor),
            properties: { footnoteId: null },
          },
        ]),
      ).toThrow();
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
