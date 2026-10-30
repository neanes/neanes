import { describe, expect, it } from 'vitest';

import { NoteElement, TextBoxElement } from '@/models/Element';
import {
  resolveParagraphStyle,
  TextBoxAlignment,
} from '@/models/ParagraphStyle';
import { Workspace } from '@/models/Workspace';
import {
  paragraphStyleDefinition,
  replaceParagraphStyles,
} from '@/services/documents/paragraphStyles';
import { SaveService } from '@/services/SaveService';
import { Unit } from '@/utils/Unit';

import type { ParagraphStyleChange } from '../contracts/paragraphStyleChanges';
import { planParagraphStyleEdits } from './paragraphStyleEdits';
import { getParagraphStyles } from './paragraphStyleRead';
(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

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

  it('merges sparse overrides, preserving names, parents, null resets and unrelated values through undo and save', () => {
    const workspace = new Workspace();
    workspace.score.paragraphStyles = planParagraphStyleEdits(
      workspace.score.paragraphStyles,
      [
        {
          action: 'create',
          style: {
            id: 'custom',
            displayName: 'Custom',
            parentStyleId: 'lyrics',
            overrides: {
              fontFamily: 'Old Font',
              fontSize: 23,
              color: '#123456',
              lineHeight: 1.5,
              strokeWidth: 0.5,
            },
          },
        },
      ],
    );
    const before = getParagraphStyles(workspace.score.paragraphStyles);
    const planned = planParagraphStyleEdits(workspace.score.paragraphStyles, [
      {
        action: 'update',
        id: 'custom',
        changes: {
          overrides: {
            fontFamily: 'Source Serif',
            lineHeight: null,
            strokeWidth: 0,
          },
        },
      },
      {
        action: 'update',
        id: 'default-text',
        changes: {
          overrides: { fontFamily: 'Source Serif' },
        },
      },
    ]);
    expect(getParagraphStyles(workspace.score.paragraphStyles)).toEqual(before);
    replaceParagraphStyles(workspace, planned);
    const expected = {
      id: 'custom',
      displayName: 'Custom',
      parentStyleId: 'lyrics',
      overrides: {
        fontFamily: 'Source Serif',
        fontSize: 23,
        color: '#123456',
        lineHeight: null,
        strokeWidth: 0,
      },
    };
    expect(
      paragraphStyleDefinition(
        workspace.score.paragraphStyles.find((style) => style.id === 'custom')!,
      ),
    ).toEqual(expected);
    expect(
      resolveParagraphStyle(workspace.score.paragraphStyles, 'default-text')
        .fontFamily,
    ).toBe('Source Serif');
    const roundTrip = SaveService.LoadScoreFromJson(
      SaveService.SaveScoreToJson(workspace.score),
    );
    expect(
      paragraphStyleDefinition(
        roundTrip.paragraphStyles.find((style) => style.id === 'custom')!,
      ),
    ).toEqual(expected);
    workspace.commandService.undo();
    expect(getParagraphStyles(workspace.score.paragraphStyles)).toEqual(before);
    workspace.commandService.redo();
    expect(
      paragraphStyleDefinition(
        workspace.score.paragraphStyles.find((style) => style.id === 'custom')!,
      ),
    ).toEqual(expected);
  });

  it('removes named overrides to restore inheritance, preserving other edits through undo and save', () => {
    const workspace = new Workspace();
    workspace.score.paragraphStyles = planParagraphStyleEdits(
      workspace.score.paragraphStyles,
      [
        {
          action: 'create',
          style: {
            id: 'parent',
            displayName: 'Parent',
            parentStyleId: 'default-text',
            overrides: { fontFamily: 'Inherited Font', lineHeight: 1.6 },
          },
        },
        {
          action: 'create',
          style: {
            id: 'child',
            displayName: 'Child',
            parentStyleId: 'parent',
            overrides: {
              fontFamily: 'Local Font',
              lineHeight: null,
              fontSize: 23,
            },
          },
        },
      ],
    );
    const before = getParagraphStyles(workspace.score.paragraphStyles);
    const plan = planParagraphStyleEdits(workspace.score.paragraphStyles, [
      {
        action: 'update',
        id: 'child',
        resetOverrides: ['fontFamily', 'lineHeight'],
        changes: { overrides: { strokeWidth: 0 } },
      },
    ]);
    expect(getParagraphStyles(workspace.score.paragraphStyles)).toEqual(before);
    replaceParagraphStyles(workspace, plan);
    const child = workspace.score.paragraphStyles.find(
      (style) => style.id === 'child',
    )!;
    expect(child.overrides).toEqual({ fontSize: 23, strokeWidth: 0 });
    expect(child.displayName).toBe('Child');
    expect(child.parentStyleId).toBe('parent');
    expect(
      resolveParagraphStyle(workspace.score.paragraphStyles, 'child'),
    ).toMatchObject({
      fontFamily: 'Inherited Font',
      lineHeight: 1.6,
      fontSize: 23,
      strokeWidth: 0,
    });
    const roundTrip = SaveService.LoadScoreFromJson(
      SaveService.SaveScoreToJson(workspace.score),
    );
    expect(
      roundTrip.paragraphStyles.find((style) => style.id === 'child')!
        .overrides,
    ).toEqual({ fontSize: 23, strokeWidth: 0 });
    expect(
      resolveParagraphStyle(roundTrip.paragraphStyles, 'child'),
    ).toMatchObject({ fontFamily: 'Inherited Font', lineHeight: 1.6 });
    workspace.commandService.undo();
    expect(getParagraphStyles(workspace.score.paragraphStyles)).toEqual(before);
    workspace.commandService.redo();
    expect(getParagraphStyles(workspace.score.paragraphStyles)).toEqual(
      getParagraphStyles(roundTrip.paragraphStyles),
    );
    const resetOnly = planParagraphStyleEdits(roundTrip.paragraphStyles, [
      { action: 'update', id: 'child', resetOverrides: ['fontSize', 'color'] },
    ]);
    expect(resetOnly.find((style) => style.id === 'child')!.overrides).toEqual({
      strokeWidth: 0,
    });
  });

  it('rejects setting and resetting the same override before any batch edits are committed', () => {
    const workspace = new Workspace();
    const before = getParagraphStyles(workspace.score.paragraphStyles);
    expect(() =>
      planParagraphStyleEdits(workspace.score.paragraphStyles, [
        {
          action: 'update',
          id: 'default-text',
          changes: { overrides: { fontSize: 23 } },
        },
        {
          action: 'update',
          id: 'lyrics',
          changes: { overrides: { lineHeight: null } },
          resetOverrides: ['lineHeight'],
        },
      ]),
    ).toThrow('An override cannot be both set and reset.');
    expect(getParagraphStyles(workspace.score.paragraphStyles)).toEqual(before);
    expect(workspace.hasUnsavedChanges).toBe(false);
  });

  it('updates custom metadata and parents while preserving overrides and accepting parents created later', () => {
    const previous = planParagraphStyleEdits(
      new Workspace().score.paragraphStyles,
      [
        {
          action: 'create',
          style: {
            id: 'child',
            displayName: 'Child',
            parentStyleId: 'lyrics',
            overrides: { fontSize: 23 },
          },
        },
      ],
    );
    const updated = planParagraphStyleEdits(previous, [
      {
        action: 'update',
        id: 'child',
        changes: { displayName: ' Renamed ', parentStyleId: 'parent' },
      },
      {
        action: 'create',
        style: {
          id: 'parent',
          displayName: 'Parent',
          parentStyleId: 'default-text',
          overrides: { fontFamily: 'Source Serif' },
        },
      },
    ]);
    expect(
      paragraphStyleDefinition(updated.find((style) => style.id === 'child')!),
    ).toEqual({
      id: 'child',
      displayName: 'Renamed',
      parentStyleId: 'parent',
      overrides: { fontSize: 23 },
    });
    expect(resolveParagraphStyle(updated, 'child').fontFamily).toBe(
      'Source Serif',
    );
    const detached = planParagraphStyleEdits(updated, [
      {
        action: 'update',
        id: 'child',
        changes: { parentStyleId: null, overrides: {} },
      },
    ]);
    expect(
      paragraphStyleDefinition(detached.find((style) => style.id === 'child')!),
    ).toEqual({
      id: 'child',
      displayName: 'Renamed',
      parentStyleId: 'default-text',
      overrides: { fontSize: 23 },
    });
  });

  it('reparents an updated child when its omitted parent is deleted, but rejects explicitly assigning the deleted parent', () => {
    const previous = planParagraphStyleEdits(
      new Workspace().score.paragraphStyles,
      [
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
      ],
    );
    for (const changes of [
      [
        { action: 'delete', id: 'parent' },
        {
          action: 'update',
          id: 'child',
          changes: { overrides: { fontSize: 23 } },
        },
      ],
      [
        {
          action: 'update',
          id: 'child',
          changes: { overrides: { fontSize: 23 } },
        },
        { action: 'delete', id: 'parent' },
      ],
    ] as ParagraphStyleChange[][]) {
      const updated = planParagraphStyleEdits(previous, changes);
      const child = updated.find((style) => style.id === 'child')!;
      expect(child.parentStyleId).toBe('lyrics');
      expect(child.overrides.fontSize).toBe(23);
    }
    expect(() =>
      planParagraphStyleEdits(previous, [
        { action: 'delete', id: 'parent' },
        { action: 'update', id: 'child', changes: { parentStyleId: 'parent' } },
      ]),
    ).toThrow('STYLE_PARENT_DELETED');
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

  it('filters complete definitions while resolving against all ancestors', () => {
    const workspace = new Workspace();
    const styles = workspace.score.paragraphStyles;
    styles.find((style) => style.id === 'default-text')!.overrides.fontSize =
      27;
    const full = getParagraphStyles(styles);
    const focused = getParagraphStyles(styles, {
      ids: ['lyrics'],
      includeResolved: false,
    });
    expect(focused.styles).toEqual(
      full.styles.filter((style) => style.id === 'lyrics'),
    );
    expect(focused).not.toHaveProperty('resolvedStyles');
    expect(
      getParagraphStyles(styles, { ids: ['lyrics'] }).resolvedStyles,
    ).toEqual(full.resolvedStyles!.filter((style) => style.id === 'lyrics'));
    expect(getParagraphStyles(styles, { ids: [] }).styles).toEqual([]);
    expect(() => getParagraphStyles(styles, { ids: ['missing'] })).toThrow(
      'STYLE_NOT_FOUND',
    );
    expect(JSON.stringify(focused).length).toBeLessThan(600);
  });

  it('lists IDs without definitions or resolved values, preserving filtering and errors', () => {
    const styles = new Workspace().score.paragraphStyles;
    expect(getParagraphStyles(styles, { view: 'ids' })).toEqual({
      styleIds: styles.map((style) => style.id),
    });
    expect(
      getParagraphStyles(styles, {
        view: 'ids',
        ids: ['lyrics'],
        includeResolved: true,
      }),
    ).toEqual({ styleIds: ['lyrics'] });
    expect(getParagraphStyles(styles, { view: 'ids', ids: [] })).toEqual({
      styleIds: [],
    });
    expect(() =>
      getParagraphStyles(styles, { view: 'ids', ids: ['missing'] }),
    ).toThrow('STYLE_NOT_FOUND');
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
      [
        {
          action: 'update',
          id: 'missing',
          changes: { overrides: { fontSize: 23 } },
        },
      ],
      [{ action: 'update', id: 'lyrics', changes: { displayName: 'Renamed' } }],
      [
        {
          action: 'update',
          id: 'lyrics',
          changes: { parentStyleId: 'lyrics' },
        },
      ],
      [
        {
          action: 'update',
          id: 'lyrics',
          changes: { parentStyleId: 'missing' },
        },
      ],
      [
        {
          action: 'update',
          id: 'lyrics',
          changes: { overrides: { fontSize: -1 } },
        },
      ],
      [
        { action: 'update', id: 'lyrics', changes: {} },
        { action: 'delete', id: 'lyrics' },
      ],
      [
        { action: 'update', id: 'lyrics', changes: {} },
        {
          action: 'replace',
          style: { id: 'lyrics', parentStyleId: 'default-text', overrides: {} },
        },
      ],
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
