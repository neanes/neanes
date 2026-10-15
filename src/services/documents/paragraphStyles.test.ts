import { describe, expect, it } from 'vitest';

import { NoteElement, TextBoxElement } from '@/models/Element';
import {
  ParagraphStyle,
  resolveParagraphStyle,
  TextBoxAlignment,
} from '@/models/ParagraphStyle';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';
import { Unit } from '@/utils/Unit';

import {
  getParagraphStyles,
  paragraphStyleDefinition,
  planParagraphStyleEdits,
  replaceParagraphStyles,
} from './paragraphStyles';
import type { ParagraphStyleChange } from './paragraphStyleSchema';
(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

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

// Planning uses the real style graph and commits through the real history service.
describe('atomic paragraph style batches', () => {
  it('creates parents after their children in the payload and replaces existing styles atomically', () => {
    const workspace = new Workspace();
    const before = getParagraphStyles(workspace.score.paragraphStyles);
    const note = new NoteElement();
    note.lyricsFontSize = 30;
    workspace.score.staff.elements.push(note);
    const lyrics = paragraphStyleDefinition(
      workspace.score.paragraphStyles.find((style) => style.id === 'lyrics')!,
    );
    const changes: ParagraphStyleChange[] = [
      {
        action: 'replace',
        style: { ...lyrics, parentStyleId: 'new-parent', overrides: {} },
      },
      {
        action: 'create',
        style: {
          id: 'child',
          displayName: 'Child',
          parentStyleId: 'new-parent',
          overrides: {},
        },
      },
      {
        action: 'create',
        style: {
          id: 'new-parent',
          displayName: 'Parent',
          parentStyleId: 'default-text',
          overrides: {
            fontSize: Unit.fromPt(12.5),
            fontFamily: 'Source Serif',
          },
        },
      },
    ];
    replaceParagraphStyles(
      workspace,
      planParagraphStyleEdits(workspace.score.paragraphStyles, changes),
    );
    expect(
      resolveParagraphStyle(workspace.score.paragraphStyles, 'lyrics').fontSize,
    ).toBe(Unit.fromPt(12.5));
    expect(
      resolveParagraphStyle(workspace.score.paragraphStyles, 'child').fontSize,
    ).toBe(Unit.fromPt(12.5));
    expect(note.lyricsFontSize).toBe(30);
    const roundTrip = SaveService.LoadScoreFromJson(
      SaveService.SaveScoreToJson(workspace.score),
    );
    expect(getParagraphStyles(roundTrip.paragraphStyles)).toEqual(
      getParagraphStyles(workspace.score.paragraphStyles),
    );
    workspace.commandService.undo();
    expect(getParagraphStyles(workspace.score.paragraphStyles)).toEqual(before);
    workspace.commandService.redo();
    expect(
      resolveParagraphStyle(workspace.score.paragraphStyles, 'child').fontSize,
    ).toBe(Unit.fromPt(12.5));
  });

  it('preserves custom names matching a built-in stored label', () => {
    const workspace = new Workspace();
    const styles = planParagraphStyleEdits(workspace.score.paragraphStyles, [
      {
        action: 'create',
        style: {
          id: 'custom-lyrics',
          displayName: 'Lyrics',
          parentStyleId: 'default-text',
          overrides: {},
        },
      },
    ]);
    expect(
      styles.find((style) => style.id === 'custom-lyrics')!.displayName,
    ).toBe('Lyrics');
  });

  it('returns definitions that round-trip without making built-in names writable', () => {
    const workspace = new Workspace();
    const result = getParagraphStyles(workspace.score.paragraphStyles);
    expect(
      result.styles.find((style) => style.id === 'lyrics'),
    ).not.toHaveProperty('displayName');
    const styles = planParagraphStyleEdits(
      workspace.score.paragraphStyles,
      result.styles.map((style) => ({ action: 'replace', style })),
    );
    expect(getParagraphStyles(styles)).toEqual(result);
  });

  it('rejects an explicit parent that is deleted in the same batch', () => {
    const workspace = new Workspace();
    const styles = planParagraphStyleEdits(workspace.score.paragraphStyles, [
      {
        action: 'create',
        style: {
          id: 'parent',
          displayName: 'Parent',
          parentStyleId: 'default-text',
          overrides: {},
        },
      },
    ]);
    expect(() =>
      planParagraphStyleEdits(styles, [
        { action: 'delete', id: 'parent' },
        {
          action: 'replace',
          style: { id: 'lyrics', parentStyleId: 'parent', overrides: {} },
        },
      ]),
    ).toThrow('STYLE_PARENT_DELETED');
  });

  it('removes overrides on replacement while preserving explicit null resets and every model field', () => {
    const workspace = new Workspace();
    const overrides = {
      alignment: TextBoxAlignment.Right,
      fontFamily: 'Source Serif',
      fontSize: 17,
      fontStyle: 'Bold',
      color: '#123456',
      strokeWidth: 0.5,
      strokeColor: 'currentcolor',
      lineHeight: 1.5,
      textDecoration: null,
      fontVariantCaps: 'small-caps',
      fontVariantNumeric: 'oldstyle-nums',
      fontVariantLigatures: null,
      fontVariantAlternates: 'stylistic(one)',
    } as const;
    const definition = {
      id: 'custom',
      displayName: ' Custom ',
      parentStyleId: 'default-text',
      overrides,
    };
    let styles = planParagraphStyleEdits(workspace.score.paragraphStyles, [
      { action: 'create', style: definition },
    ]);
    expect(
      paragraphStyleDefinition(styles.find((style) => style.id === 'custom')!),
    ).toEqual({ ...definition, displayName: 'Custom' });
    styles = planParagraphStyleEdits(styles, [
      {
        action: 'replace',
        style: {
          ...definition,
          overrides: {
            lineHeight: null,
            fontVariantCaps: null,
            textDecoration: null,
          },
        },
      },
    ]);
    const custom = styles.find((style) => style.id === 'custom')!;
    expect(custom.overrides.fontSize).toBeUndefined();
    expect(custom.overrides.fontVariantCaps).toBeNull();
    expect(resolveParagraphStyle(styles, custom.id).fontVariantCaps).toBeNull();
  });

  it('reparents surviving children and content through multiple deleted ancestors with undo', () => {
    const workspace = new Workspace();
    let styles = planParagraphStyleEdits(workspace.score.paragraphStyles, [
      {
        action: 'create',
        style: {
          id: 'parent',
          displayName: 'Parent',
          parentStyleId: 'lyrics',
          overrides: {},
        },
      },
      {
        action: 'create',
        style: {
          id: 'child',
          displayName: 'Child',
          parentStyleId: 'parent',
          overrides: {},
        },
      },
      {
        action: 'create',
        style: {
          id: 'grandchild',
          displayName: 'Grandchild',
          parentStyleId: 'child',
          overrides: {},
        },
      },
    ]);
    workspace.score.paragraphStyles = styles;
    const note = new NoteElement();
    note.lyricsParagraphStyleId = 'child';
    workspace.score.staff.elements.push(note);
    const header = new TextBoxElement();
    header.paragraphStyleId = 'parent';
    workspace.score.headers.default.elements.push(header);
    styles = planParagraphStyleEdits(styles, [
      { action: 'delete', id: 'parent' },
      { action: 'delete', id: 'child' },
    ]);
    replaceParagraphStyles(workspace, styles);
    expect(
      workspace.score.paragraphStyles.find(
        (style) => style.id === 'grandchild',
      )!.parentStyleId,
    ).toBe('lyrics');
    expect(note.lyricsParagraphStyleId).toBe('lyrics');
    expect(header.paragraphStyleId).toBe('lyrics');
    workspace.commandService.undo();
    expect(
      workspace.score.paragraphStyles.find(
        (style) => style.id === 'grandchild',
      )!.parentStyleId,
    ).toBe('child');
    expect(note.lyricsParagraphStyleId).toBe('child');
    expect(header.paragraphStyleId).toBe('parent');
  });

  it.each(
    [
      [{ action: 'delete', id: 'lyrics' }],
      [{ action: 'delete', id: 'missing' }],
      [
        {
          action: 'create',
          style: {
            id: 'lyrics',
            displayName: 'Illegal',
            parentStyleId: 'default-text',
            overrides: {},
          },
        },
      ],
      [
        {
          action: 'replace',
          style: {
            id: 'lyrics',
            displayName: 'Renamed',
            parentStyleId: 'default-text',
            overrides: {},
          },
        },
      ],
      [
        {
          action: 'replace',
          style: { id: 'lyrics', parentStyleId: 'missing', overrides: {} },
        },
      ],
      [
        {
          action: 'replace',
          style: { id: 'lyrics', parentStyleId: 'lyrics', overrides: {} },
        },
      ],
      [
        {
          action: 'replace',
          style: { id: 'default-text', parentStyleId: 'lyrics', overrides: {} },
        },
      ],
      [
        {
          action: 'replace',
          style: { id: 'lyrics', parentStyleId: 'default-text', overrides: {} },
        },
        { action: 'delete', id: 'lyrics' },
      ],
      [
        {
          action: 'create',
          style: { id: 'custom', parentStyleId: 'default-text', overrides: {} },
        },
      ],
      [
        {
          action: 'create',
          style: {
            id: 'a',
            displayName: 'Same',
            parentStyleId: 'default-text',
            overrides: {},
          },
        },
        {
          action: 'create',
          style: {
            id: 'b',
            displayName: 'Same',
            parentStyleId: 'default-text',
            overrides: {},
          },
        },
      ],
    ].map((changes) => ({ changes: changes as ParagraphStyleChange[] })),
  )(
    'rejects invalid batches before changing the document: $changes',
    ({ changes }) => {
      const workspace = new Workspace();
      const before = getParagraphStyles(workspace.score.paragraphStyles);
      expect(() =>
        planParagraphStyleEdits(
          workspace.score.paragraphStyles,
          changes as ParagraphStyleChange[],
        ),
      ).toThrow();
      expect(getParagraphStyles(workspace.score.paragraphStyles)).toEqual(
        before,
      );
      expect(workspace.hasUnsavedChanges).toBe(false);
    },
  );
});
