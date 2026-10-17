import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import {
  AcceptsLyricsOption,
  NoteElement,
  TextBoxElement,
} from '@/models/Element';
import { Fthora, QuantitativeNeume } from '@/models/Neumes';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import { ElementDiscovery } from './elementDiscovery';
import { applyElementEdits, planElementEdits } from './elementEdits';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
const image =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
function document() {
  const workspace = reactive(new Workspace(false)) as Workspace;
  const discovery = new ElementDiscovery();
  const edit = (input: unknown) => {
    const plan = planElementEdits(workspace, discovery, input, [
      'Source Serif',
    ]);
    applyElementEdits(workspace, plan);
    return plan;
  };
  return { workspace, discovery, edit };
}
const insert = (elements: unknown[]) => ({ action: 'insert', elements });
const update = (
  elementRef: string,
  properties: object,
  reset: string[] = [],
) => ({ action: 'update', elementRef, elementType: 'Note', properties, reset });
const saved = (workspace: Workspace) =>
  JSON.stringify(SaveService.SaveScoreToJson(workspace.score));

describe('validated element transactions', () => {
  it('constructs nested elements with local references in one reversible undo step', () => {
    const { workspace, discovery, edit } = document();
    const staff = workspace.score.staff.elements;
    const sentinel = staff[0];
    const plan = edit([
      insert([
        {
          elementType: 'Note',
          clientId: 'note',
          properties: { quantitativeNeume: 'Oligon', lyricsFontSize: 21 },
        },
      ]),
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@note',
          collection: 'annotations',
        },
        elements: [
          {
            elementType: 'Annotation',
            clientId: 'annotation',
            properties: { text: '<p>Comment</p>', x: 7 },
          },
        ],
      },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@note',
          collection: 'alternateLines',
        },
        elements: [{ elementType: 'AlternateLine', clientId: 'alternate' }],
      },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@alternate',
          collection: 'elements',
        },
        elements: [{ elementType: 'Note', clientId: 'altNote' }],
      },
      { action: 'assign_lyrics', text: 'Al-', end: 1 },
    ]);
    const note = staff[0] as NoteElement;
    expect(note.lyrics).toBe('Al');
    expect(note.isMelismaStart).toBe(true);
    expect(note.annotations[0].text).toBe('<p>Comment</p>');
    expect(note.alternateLines[0].elements[0].elementType).toBe('Note');
    expect(plan.created).toHaveLength(4);
    const ref = discovery.reference(note);
    const after = saved(workspace);
    workspace.commandService.undo();
    expect(workspace.score.staff.elements).toBe(staff);
    expect(staff).toEqual([sentinel]);
    workspace.commandService.redo();
    expect(saved(workspace)).toBe(after);
    expect(discovery.reference(staff[0])).toBe(ref);
  });

  it('leaves live content, refs, selection, dirty state and undo history untouched on a late error', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([{ elementType: 'Note', properties: { lyrics: 'original' } }]),
    ]);
    workspace.hasUnsavedChanges = false;
    workspace.selectedElement = workspace.score.staff.elements[0];
    const ref = discovery.reference(workspace.selectedElement);
    const before = saved(workspace);
    expect(() =>
      edit([
        update(ref, { lyrics: 'partial' }),
        insert([{ elementType: 'Tempo', properties: { bpm: -3 } }]),
      ]),
    ).toThrow();
    expect(saved(workspace)).toBe(before);
    expect(workspace.hasUnsavedChanges).toBe(false);
    expect(discovery.reference(workspace.selectedElement)).toBe(ref);
    workspace.commandService.undo();
    expect(workspace.score.staff.elements).toHaveLength(1);
    workspace.commandService.redo();
    expect(saved(workspace)).toBe(before);
  });

  it('preserves selection and collection proxies for property-only edits', () => {
    const { workspace, discovery, edit } = document();
    edit([insert([{ elementType: 'Note' }, { elementType: 'Note' }])]);
    workspace.selectedElement = workspace.score.staff.elements[0];
    workspace.selectionRange = { start: 0, end: 1 };
    const selected = workspace.selectedElement;
    edit([update(discovery.reference(selected), { lyrics: 'word' })]);
    expect(workspace.selectedElement).toBe(selected);
    expect(workspace.selectionRange).toEqual({ start: 0, end: 1 });
  });

  it('restores all setter side effects on undo and applies JSON properties in canonical order', () => {
    const { workspace, discovery, edit } = document();
    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.OligonPlusKentemata;
    note.secondaryFthora = Fthora.DiatonicNiLow_TopSecondary;
    workspace.score.staff.elements.unshift(note);
    const ref = discovery.reference(note);
    edit([update(ref, { quantitativeNeume: 'Ison' })]);
    expect(note.secondaryFthora).toBeNull();
    workspace.commandService.undo();
    expect(note.quantitativeNeume).toBe(QuantitativeNeume.OligonPlusKentemata);
    expect(note.secondaryFthora).toBe(Fthora.DiatonicNiLow_TopSecondary);
    workspace.commandService.redo();
    expect(note.secondaryFthora).toBeNull();
    edit([
      update(ref, {
        secondaryFthora: 'DiatonicNiLow_TopSecondary',
        quantitativeNeume: 'OligonPlusKentemata',
      }),
    ]);
    expect(note.secondaryFthora).toBe(Fthora.DiatonicNiLow_TopSecondary);
  });

  it('plans nested setter side effects atomically and restores them in one undo step', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([{ elementType: 'Note', clientId: 'main' }]),
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@main',
          collection: 'alternateLines',
        },
        elements: [{ elementType: 'AlternateLine', clientId: 'alt' }],
      },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@alt',
          collection: 'elements',
        },
        elements: [
          {
            elementType: 'Note',
            properties: {
              quantitativeNeume: 'OligonPlusKentemata',
              secondaryFthora: 'SoftChromaticPa_TopSecondary',
              secondaryChromaticFthoraNote: 'Thi',
            },
          },
        ],
      },
    ]);
    const main = workspace.score.staff.elements[0] as NoteElement;
    const nested = main.alternateLines[0].elements[0] as NoteElement;
    const changes = [
      update(discovery.reference(nested), { quantitativeNeume: 'Ison' }),
      update(discovery.reference(main), { lyrics: 'changed' }),
    ];
    const before = saved(workspace);
    expect(() =>
      edit([...changes, insert([{ elementType: 'Annotation' }])]),
    ).toThrow('INVALID_ELEMENT_COLLECTION');
    expect(saved(workspace)).toBe(before);
    const plan = planElementEdits(workspace, discovery, changes, []);
    expect(saved(workspace)).toBe(before);
    applyElementEdits(workspace, plan);
    expect(nested.secondaryFthora).toBeNull();
    expect(main.lyrics).toBe('changed');
    const after = saved(workspace);
    workspace.commandService.undo();
    expect(saved(workspace)).toBe(before);
    expect(nested.secondaryChromaticFthoraNote).toBe('Thi');
    workspace.commandService.redo();
    expect(saved(workspace)).toBe(after);
  });

  it('uses the same default chromatic interpretation as UI fthora selection', () => {
    const { workspace, edit } = document();
    edit([
      insert([
        { elementType: 'Note', properties: { fthora: 'SoftChromaticPa_Top' } },
      ]),
    ]);
    expect(
      (workspace.score.staff.elements[0] as NoteElement).chromaticFthoraNote,
    ).toBe('Ga');
  });

  it('preserves explicit null interpretations and applies fthora resets reversibly', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([
        {
          elementType: 'Note',
          properties: {
            fthora: 'SoftChromaticPa_Top',
            chromaticFthoraNote: 'Thi',
          },
        },
      ]),
    ]);
    const note = workspace.score.staff.elements[0] as NoteElement;
    const ref = discovery.reference(note);
    edit([
      update(ref, { fthora: 'HardChromaticPa_Top', chromaticFthoraNote: null }),
    ]);
    expect(note.chromaticFthoraNote).toBeNull();
    workspace.commandService.undo();
    expect(note.chromaticFthoraNote).toBe('Thi');
    edit([update(ref, {}, ['fthora'])]);
    expect(note.fthora).toBeNull();
    expect(note.chromaticFthoraNote).toBeNull();
    workspace.commandService.undo();
    expect(note.fthora).toBe('SoftChromaticPa_Top');
    expect(note.chromaticFthoraNote).toBe('Thi');
  });

  it('clears martyria neumes on alignment changes but honors explicit API overrides', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([
        {
          elementType: 'Martyria',
          properties: { quantitativeNeume: 'Oligon' },
        },
      ]),
    ]);
    const element = workspace.score.staff.elements[0];
    const change = (properties: object, reset: string[] = []) => ({
      action: 'update',
      elementType: 'Martyria',
      elementRef: discovery.reference(element),
      properties,
      reset,
    });
    edit([change({ alignRight: true })]);
    expect(Reflect.get(element, 'quantitativeNeume')).toBeNull();
    workspace.commandService.undo();
    expect(Reflect.get(element, 'quantitativeNeume')).toBe('Oligon');
    edit([change({ alignRight: true, quantitativeNeume: 'Ison' })]);
    expect(Reflect.get(element, 'quantitativeNeume')).toBe('Ison');
    edit([change({}, ['alignRight'])]);
    expect(Reflect.get(element, 'alignRight')).toBe(false);
    expect(Reflect.get(element, 'quantitativeNeume')).toBeNull();
    workspace.commandService.undo();
    expect(Reflect.get(element, 'alignRight')).toBe(true);
    expect(Reflect.get(element, 'quantitativeNeume')).toBe('Ison');
    workspace.commandService.redo();
    expect(Reflect.get(element, 'quantitativeNeume')).toBeNull();
  });

  it('preserves explicit overrides, distinguishes normal line height from inheritance, and resets defaults', () => {
    const { workspace, discovery, edit } = document();
    const box = new TextBoxElement();
    box.lineHeight = 1.2;
    workspace.score.staff.elements.unshift(box);
    const ref = discovery.reference(box);
    edit([
      {
        action: 'update',
        elementRef: ref,
        elementType: 'TextBox',
        properties: { lineHeight: null, fontSize: 24 },
      },
    ]);
    expect(box.lineHeight).toBeNull();
    edit([
      {
        action: 'update',
        elementRef: ref,
        elementType: 'TextBox',
        reset: ['lineHeight'],
      },
    ]);
    expect(box.lineHeight).toBeUndefined();
    expect(box.fontSize).toBe(24);
    workspace.commandService.undo();
    expect(box.lineHeight).toBeNull();
    workspace.commandService.undo();
    expect(box.lineHeight).toBe(1.2);
    expect(box.fontSize).toBeNull();
  });

  it.each([
    [insert([{ elementType: 'Empty' }])],
    [insert([{ elementType: 'Annotation' }])],
    [
      insert([
        {
          elementType: 'ImageBox',
          properties: { data: 'https://example.com/image.png' },
        },
      ]),
    ],
    [
      insert([
        {
          elementType: 'Note',
          properties: { secondaryFthora: 'DiatonicNiLow_TopSecondary' },
        },
      ]),
    ],
    [
      insert([
        { elementType: 'DropCap', properties: { paragraphStyleId: 'missing' } },
      ]),
    ],
    [
      insert([
        { elementType: 'DropCap', properties: { fontFamily: 'Missing Font' } },
      ]),
    ],
    [
      insert([
        {
          elementType: 'Note',
          properties: { lyricsColor: 'red; display:none' },
        },
      ]),
    ],
    [insert([{ elementType: 'Note', properties: { keyHelper: 5 } }])],
    [
      insert([
        { elementType: 'Note', clientId: 'same' },
        { elementType: 'Note', clientId: 'same' },
      ]),
    ],
    [{ action: 'remove_range', start: 0, end: 1 }],
    [{ action: 'remove_range', start: 2, end: 3 }],
    [
      {
        action: 'remove_range',
        collection: { kind: 'headers', variant: 'default' },
        start: 0,
        end: 1,
      },
    ],
  ])('rejects invalid batch %j without musical edits', (...actions) => {
    const { workspace, edit } = document();
    const before = saved(workspace);
    expect(() => edit(actions)).toThrow();
    expect(saved(workspace)).toBe(before);
    expect(workspace.hasUnsavedChanges).toBe(false);
  });

  it('supports every writable element type and saves/reopens the result', () => {
    const { workspace, edit } = document();
    edit([
      insert([
        { elementType: 'ModeKey' },
        { elementType: 'Note' },
        { elementType: 'Martyria' },
        { elementType: 'Tempo' },
        { elementType: 'TextBox', properties: { content: 'Plain text' } },
        {
          elementType: 'RichTextBox',
          properties: { content: '<p>Rich text</p>' },
        },
        { elementType: 'DropCap' },
        { elementType: 'ImageBox', properties: { data: image } },
      ]),
    ]);
    const loaded = SaveService.LoadScoreFromJson(JSON.parse(saved(workspace)));
    expect(loaded.staff.elements.map((element) => element.elementType)).toEqual(
      workspace.score.staff.elements.map((element) => element.elementType),
    );
  });

  it('replaces elements with positional break state and preserves collection identity for older history', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([
        {
          elementType: 'Note',
          properties: { lineBreak: true, pageBreak: true },
        },
      ]),
    ]);
    const note = workspace.score.staff.elements[0];
    workspace.selectedElement = note;
    const staff = workspace.score.staff.elements;
    edit([
      {
        action: 'replace',
        elementRef: discovery.reference(note),
        element: { elementType: 'Tempo', clientId: 'replacement' },
      },
    ]);
    expect(staff[0].lineBreak).toBe(true);
    expect(staff[0].pageBreak).toBe(true);
    expect(workspace.selectedElement).toBeNull();
    workspace.commandService.undo();
    expect(staff[0]).toBe(note);
    workspace.commandService.undo();
    expect(staff).toHaveLength(1);
    workspace.commandService.redo();
    expect(staff[0]).toBe(note);
  });

  it('handles sequential range edits, removed references and no-op batches', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([
        { elementType: 'Note', clientId: 'a' },
        { elementType: 'Note', clientId: 'b' },
      ]),
      { action: 'remove_range', start: 0, end: 1 },
    ]);
    const note = workspace.score.staff.elements[0];
    const ref = discovery.reference(note);
    const noOp = planElementEdits(
      workspace,
      discovery,
      [update(ref, { lyrics: '' })],
      [],
    );
    expect(applyElementEdits(workspace, noOp)).toBe(false);
    expect(() =>
      edit([
        { action: 'remove', elementRef: ref },
        update(ref, { lyrics: 'missing' }),
      ]),
    ).toThrow('ELEMENT_NOT_FOUND');
    expect(workspace.score.staff.elements[0]).toBe(note);
    const other = new ElementDiscovery();
    expect(() =>
      planElementEdits(
        workspace,
        other,
        [update(ref, { lyrics: 'cross-document' })],
        [],
      ),
    ).toThrow('ELEMENT_NOT_FOUND');
  });

  it('uses shared lyric assignment and respects locked staff lyrics in the same undo batch', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([{ elementType: 'Note' }, { elementType: 'Note' }]),
      { action: 'set_staff_lyrics', text: 'Al- le', locked: true },
    ]);
    expect((workspace.score.staff.elements[0] as NoteElement).lyrics).toBe(
      'Al',
    );
    expect(workspace.score.staff.lyrics).toMatchObject({
      text: 'Al- le',
      locked: true,
    });
    expect(() =>
      edit([{ action: 'assign_lyrics', text: 'different' }]),
    ).toThrow('LYRICS_LOCKED');
    expect(() =>
      edit([
        update(discovery.reference(workspace.score.staff.elements[0]), {
          lyrics: 'different',
        }),
      ]),
    ).toThrow('LYRICS_LOCKED');
    workspace.commandService.undo();
    expect(workspace.score.staff.elements).toHaveLength(1);
    expect(workspace.score.staff.lyrics.locked).toBe(false);
    workspace.commandService.redo();
    expect((workspace.score.staff.elements[1] as NoteElement).lyrics).toBe(
      'le',
    );
  });
  it('preserves omitted chromatic interpretations when resending the current fthora', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([
        {
          elementType: 'Note',
          properties: {
            fthora: 'SoftChromaticPa_Top',
            chromaticFthoraNote: 'Thi',
          },
        },
      ]),
    ]);
    const note = workspace.score.staff.elements[0] as NoteElement;
    const ref = discovery.reference(note);
    edit([update(ref, { fthora: 'SoftChromaticPa_Top' })]);
    expect(note.chromaticFthoraNote).toBe('Thi');
    edit([update(ref, { fthora: 'HardChromaticPa_Top' })]);
    expect(note.chromaticFthoraNote).toBe('Pa');
    edit([
      update(ref, {
        fthora: 'SoftChromaticPa_Top',
        chromaticFthoraNote: 'Thi',
      }),
    ]);
    expect(note.chromaticFthoraNote).toBe('Thi');
    workspace.commandService.undo();
    expect(note.chromaticFthoraNote).toBe('Pa');
  });

  it.each([
    [
      'Note',
      'secondaryFthora',
      'secondaryChromaticFthoraNote',
      'SoftChromaticPa_TopSecondary',
      'OligonPlusKentemata',
    ],
    [
      'Note',
      'tertiaryFthora',
      'tertiaryChromaticFthoraNote',
      'SoftChromaticPa_TopTertiary',
      'OligonPlusRunningElaphronPlusKentemata',
    ],
    [
      'Martyria',
      'fthora',
      'chromaticFthoraNote',
      'SoftChromaticPa_Top',
      'Oligon',
    ],
    [
      'Martyria',
      'quantitativeNeumeFthora',
      'quantitativeNeumeChromaticFthoraNote',
      'SoftChromaticPa_Top',
      'Oligon',
    ],
  ])(
    'preserves omitted %s %s interpretation',
    (elementType, fthoraKey, noteKey, fthora, quantitativeNeume) => {
      const { workspace, discovery, edit } = document();
      edit([
        insert([
          {
            elementType,
            properties: {
              quantitativeNeume,
              [fthoraKey]: fthora,
              [noteKey]: 'Thi',
            },
          },
        ]),
      ]);
      const element = workspace.score.staff.elements[0];
      edit([
        {
          action: 'update',
          elementType,
          elementRef: discovery.reference(element),
          properties: { [fthoraKey]: fthora },
        },
      ]);
      expect(Reflect.get(element, noteKey)).toBe('Thi');
    },
  );

  it('allows alternate-line lyric updates and assignments while main staff lyrics are locked', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([{ elementType: 'Note', clientId: 'main' }]),
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@main',
          collection: 'alternateLines',
        },
        elements: [{ elementType: 'AlternateLine', clientId: 'alt' }],
      },
      { action: 'set_staff_lyrics', text: 'main', locked: true },
      {
        action: 'insert',
        collection: {
          kind: 'children',
          parentRef: '@alt',
          collection: 'elements',
        },
        elements: [{ elementType: 'Note', properties: { lyrics: 'original' } }],
      },
    ]);
    const main = workspace.score.staff.elements[0] as NoteElement;
    const alternate = main.alternateLines[0];
    const note = alternate.elements[0] as NoteElement;
    edit([update(discovery.reference(note), { lyrics: 'direct' })]);
    expect(note.lyrics).toBe('direct');
    edit([
      {
        action: 'assign_lyrics',
        collection: {
          kind: 'children',
          parentRef: discovery.reference(alternate),
          collection: 'elements',
        },
        text: 'parsed',
      },
    ]);
    expect(note.lyrics).toBe('parsed');
    expect(main.lyrics).toBe('main');
    expect(workspace.score.staff.lyrics.locked).toBe(true);
    workspace.commandService.undo();
    expect(note.lyrics).toBe('direct');
    expect(() =>
      edit([update(discovery.reference(main), { lyrics: 'blocked' })]),
    ).toThrow('LYRICS_LOCKED');
  });

  it.each([
    ['Al-le-lu', false, ['Al', 'le', 'lu']],
    ['Al___', false, ['Al', '', '']],
    ['\u03c4\u03c9___', false, ['\u03c4\u03c9', '', '']],
    ['\u03c4\u03c9\u03bd___', false, ['\u03c4\u03c9', '', '\u03c9\u03bd']],
    ['\u03c4\u03c9\u03bd___', true, ['\u03c4\u03c9\u03bd', '', '']],
  ])(
    'documents parser output for %s with Greek disabled=%s',
    (text, disabled, expected) => {
      const { workspace, discovery, edit } = document();
      workspace.score.pageSetup.disableGreekMelismata = disabled;
      edit([
        insert(
          Array.from({ length: 3 }, () => ({
            elementType: 'Note',
            properties: { acceptsLyrics: AcceptsLyricsOption.Yes },
          })),
        ),
        { action: 'assign_lyrics', text, end: 3 },
      ]);
      const notes = workspace.score.staff.elements.slice(0, 3) as NoteElement[];
      expect(notes.map((note) => note.lyrics)).toEqual(expected);
      expect(notes[0].isMelismaStart).toBe(true);
      expect(notes[0].isHyphen).toBe(
        text.includes('-') || (!disabled && text.includes('\u03bd')),
      );
      edit([update(discovery.reference(notes[0]), { lyrics: 'Al-' })]);
      expect(notes[0].lyrics).toBe('Al-');
      expect(notes[0].isHyphen).toBe(
        text.includes('-') || (!disabled && text.includes('\u03bd')),
      );
    },
  );
  it.each([
    ['tie', 'Al', { tie: 'YfenAbove' }],
    ['Greek melisma', '\u03c4\u03c9\u03bd___', {}],
  ])(
    'rejects lyric ranges cutting a %s without changing content or history',
    (_label, text, properties) => {
      const { workspace, edit } = document();
      edit([
        insert([
          { elementType: 'Note', properties },
          { elementType: 'Note' },
          { elementType: 'Note' },
        ]),
        { action: 'assign_lyrics', text, end: 3 },
      ]);
      const before = saved(workspace);
      workspace.hasUnsavedChanges = false;
      for (const range of [
        { start: 1, end: 3 },
        { start: 0, end: 1 },
        ...(_label === 'Greek melisma'
          ? [
              { start: 2, end: 3 },
              { start: 0, end: 2 },
            ]
          : []),
      ]) {
        expect(() =>
          edit([{ action: 'assign_lyrics', text: 'new', ...range }]),
        ).toThrow('Expand start/end');
        expect(saved(workspace)).toBe(before);
        expect(workspace.hasUnsavedChanges).toBe(false);
      }
      workspace.commandService.undo();
      expect(workspace.score.staff.elements).toHaveLength(1);
      workspace.commandService.redo();
      expect(saved(workspace)).toBe(before);
      edit([{ action: 'assign_lyrics', start: 0, end: 3, text: 'complete' }]);
    },
  );

  it('permits an independent lyric range and respects explicit acceptsLyrics over a preceding tie', () => {
    const { workspace, edit } = document();
    edit([
      insert([
        {
          elementType: 'Note',
          properties: { lyrics: 'keep', tie: 'YfenAbove' },
        },
        { elementType: 'Note', properties: { acceptsLyrics: 'Yes' } },
        { elementType: 'Note', properties: { lyrics: 'outside' } },
      ]),
    ]);
    edit([{ action: 'assign_lyrics', start: 1, end: 2, text: 'inside' }]);
    expect(
      (workspace.score.staff.elements.slice(0, 3) as NoteElement[]).map(
        (note) => note.lyrics,
      ),
    ).toEqual(['keep', 'inside', 'outside']);
  });

  it('rejects conflicting final martyria tempos and requires explicit clearing when switching positions', () => {
    const { workspace, discovery, edit } = document();
    edit([
      insert([{ elementType: 'Martyria', properties: { tempo: 'Moderate' } }]),
    ]);
    const martyria = workspace.score.staff.elements[0];
    const ref = discovery.reference(martyria);
    const before = saved(workspace);
    const change = (properties: object) => ({
      action: 'update',
      elementType: 'Martyria',
      elementRef: ref,
      properties,
    });
    for (const properties of [
      { tempoLeft: 'Quick' },
      { tempoLeft: 'Quick', tempoRight: 'Slow' },
    ]) {
      expect(() => edit([change(properties)])).toThrow('Explicitly clear');
      expect(saved(workspace)).toBe(before);
    }
    expect(() =>
      edit([
        insert([
          {
            elementType: 'Martyria',
            properties: { tempo: 'Moderate', tempoLeft: 'Quick' },
          },
        ]),
      ]),
    ).toThrow('Explicitly clear');
    edit([change({ tempo: null, tempoLeft: 'Quick' })]);
    expect(Reflect.get(martyria, 'tempo')).toBeNull();
    expect(Reflect.get(martyria, 'tempoLeft')).toBe('Quick');
    workspace.commandService.undo();
    expect(saved(workspace)).toBe(before);
    // Only final combinations matter, allowing a switch in sequential actions.
    edit([change({ tempoRight: 'Slow' }), change({ tempo: null })]);
    expect(Reflect.get(martyria, 'tempoRight')).toBe('Slow');
  });
  it.each([
    ['Tempo', 'neume', 'Quick', 168],
    ['Tempo', 'neume', 'VerySlowAbove', 40],
    ['Martyria', 'tempo', 'Quick', 168],
    ['Martyria', 'tempoLeft', 'Quick', 168],
    ['Martyria', 'tempoRight', 'QuickAbove', 168],
    ['ModeKey', 'tempo', 'Slow', 80],
  ])(
    'defaults %s %s BPM on creation/replacement while preserving partial-update omissions',
    (elementType, signKey, sign, bpm) => {
      const { workspace, discovery, edit } = document();
      edit([insert([{ elementType, properties: { [signKey]: sign } }])]);
      const element = workspace.score.staff.elements[0];
      expect(Reflect.get(element, 'bpm')).toBe(bpm);
      const loaded = SaveService.LoadScoreFromJson(
        JSON.parse(saved(workspace)),
      );
      expect(Reflect.get(loaded.staff.elements[0], 'bpm')).toBe(bpm);
      edit([
        {
          action: 'update',
          elementRef: discovery.reference(element),
          elementType,
          properties: { [signKey]: 'Moderate' },
        },
      ]);
      expect(Reflect.get(element, 'bpm')).toBe(bpm);
      edit([
        {
          action: 'replace',
          elementRef: discovery.reference(element),
          element: { elementType, properties: { [signKey]: sign, bpm: 123 } },
        },
      ]);
      const replacement = workspace.score.staff.elements[0];
      expect(Reflect.get(replacement, 'bpm')).toBe(123);
      edit([
        {
          action: 'replace',
          elementRef: discovery.reference(replacement),
          element: { elementType, properties: { [signKey]: sign } },
        },
      ]);
      expect(Reflect.get(workspace.score.staff.elements[0], 'bpm')).toBe(bpm);
      workspace.commandService.undo();
      expect(workspace.score.staff.elements[0]).toBe(replacement);
      expect(Reflect.get(replacement, 'bpm')).toBe(123);
    },
  );

  it.each([
    { elements: [{ elementType: 'Note' }], text: 'Al-le-lu', start: 0, end: 1 },
    { elements: [{ elementType: 'Note' }], text: 'Al', start: 0, end: 0 },
    { elements: [{ elementType: 'Tempo' }], text: 'Al', start: 0, end: 1 },
    {
      elements: [{ elementType: 'Note', properties: { acceptsLyrics: 'No' } }],
      text: 'Al',
      start: 0,
      end: 1,
    },
    {
      elements: [
        { elementType: 'Note', properties: { tie: 'YfenAbove' } },
        { elementType: 'Note' },
      ],
      text: 'Al-le',
      start: 0,
      end: 2,
    },
    {
      elements: [
        { elementType: 'Note' },
        { elementType: 'Note', properties: { acceptsLyrics: 'MelismaOnly' } },
      ],
      text: 'Al-le',
      start: 0,
      end: 2,
    },
    {
      elements: [{ elementType: 'Note' }, { elementType: 'Note' }],
      text: '\u03c4\u03c9\u03bd___',
      start: 0,
      end: 2,
    },
    {
      elements: [{ elementType: 'DropCap' }, { elementType: 'Note' }],
      text: 'Al-le',
      start: 0,
      end: 2,
    },
  ])(
    'rejects unconsumed range lyrics atomically: %j',
    ({ elements, text, start, end }) => {
      const { workspace, discovery, edit } = document();
      edit([insert(elements)]);
      const before = saved(workspace);
      const ref = discovery.reference(workspace.score.staff.elements[0]);
      workspace.hasUnsavedChanges = false;
      expect(() =>
        edit([{ action: 'assign_lyrics', text, start, end }]),
      ).toThrow('Lyrics exceed the range capacity');
      expect(saved(workspace)).toBe(before);
      expect(workspace.hasUnsavedChanges).toBe(false);
      expect(discovery.reference(workspace.score.staff.elements[0])).toBe(ref);
      workspace.commandService.undo();
      expect(workspace.score.staff.elements).toHaveLength(1);
    },
  );

  it('accepts exact-fit lyrics including drop caps and trailing whitespace, and retains locked surplus for future notes', () => {
    const { workspace, edit } = document();
    edit([
      insert([{ elementType: 'DropCap' }, { elementType: 'Note' }]),
      { action: 'assign_lyrics', text: 'Al   ', end: 2 },
    ]);
    expect(Reflect.get(workspace.score.staff.elements[0], 'content')).toBe('A');
    expect((workspace.score.staff.elements[1] as NoteElement).lyrics).toBe('l');
    edit([{ action: 'assign_lyrics', text: '   ', start: 0, end: 0 }]);
    edit([{ action: 'set_staff_lyrics', text: 'Al-le-lu', locked: true }]);
    expect(workspace.score.staff.lyrics.text).toBe('Al-le-lu');
    edit([insert([{ elementType: 'Note' }, { elementType: 'Note' }])]);
    expect(
      (workspace.score.staff.elements.slice(1, 4) as NoteElement[]).map(
        (note) => note.lyrics,
      ),
    ).toEqual(['l', 'le', 'lu']);
  });
});
