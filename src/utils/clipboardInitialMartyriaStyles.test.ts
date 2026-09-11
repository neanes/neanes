import { describe, expect, it } from 'vitest';

import { ModeKeyElement, TextBoxElement } from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  createDefaultInitialMartyriaTypography,
  getBuiltInInitialMartyriaStyle,
} from '@/models/InitialMartyriaBuiltInStyles';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  ParagraphStyle,
} from '@/models/ParagraphStyle';

import {
  collectClipboardInitialMartyriaStylesFromElements,
  resolveClipboardInitialMartyriaStyles,
  rewriteClipboardElementInitialMartyriaStyleId,
} from './clipboardInitialMartyriaStyles';
import {
  collectClipboardParagraphStyleIdsFromElements,
  collectClipboardParagraphStylesFromElements,
  resolveClipboardParagraphStyles,
} from './clipboardParagraphStyles';

function createCustomInitialMartyriaStyle(
  id: string,
  displayName: string,
  paragraphStyleId: string,
  greekParagraphStyleId: string = BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyriaGreek,
): InitialMartyriaStyle {
  const basedOn = BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNames;

  return {
    id,
    displayName,
    basedOn,
    structure: { ...getBuiltInInitialMartyriaStyle(basedOn).structure },
    ...createDefaultInitialMartyriaTypography(),
    paragraphStyleId,
    greekParagraphStyleId,
  };
}

function createCustomParagraphStyle(id: string, displayName: string) {
  const style = new ParagraphStyle();
  style.id = id;
  style.displayName = displayName;
  style.parentStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
  return style;
}

function createModeKey(initialMartyriaStyleId: string | null) {
  const modeKey = new ModeKeyElement();
  modeKey.initialMartyriaStyleId = initialMartyriaStyleId;
  return modeKey;
}

describe('clipboardInitialMartyriaStyles', () => {
  it('collects the custom styles copied mode keys reference, as copies', () => {
    const parish = createCustomInitialMartyriaStyle(
      'parish',
      'Parish',
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    );
    const unused = createCustomInitialMartyriaStyle(
      'unused',
      'Unused',
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    );

    const collected = collectClipboardInitialMartyriaStylesFromElements(
      [
        createModeKey(parish.id),
        createModeKey(null),
        createModeKey(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekTraditionalSign),
        createModeKey('deleted'),
        createModeKey(parish.id),
        new TextBoxElement(),
      ],
      [parish, unused],
    );

    expect(collected).toHaveLength(1);
    expect(collected[0]).toEqual(parish);
    expect(collected[0]).not.toBe(parish);
    expect(collected[0].structure).not.toBe(parish.structure);
  });

  it('walks the collected styles when collecting paragraph styles', () => {
    const heading = createCustomParagraphStyle('heading', 'Heading');
    const parish = createCustomInitialMartyriaStyle(
      'parish',
      'Parish',
      heading.id,
    );
    const paragraphStyles = [...createDefaultParagraphStyles(), heading];

    expect(collectClipboardParagraphStyleIdsFromElements([], [parish])).toEqual(
      [heading.id, BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyriaGreek],
    );

    const collected = collectClipboardParagraphStylesFromElements(
      [],
      [parish],
      paragraphStyles,
    );

    expect(collected).toHaveLength(1);
    expect(collected[0].id).toBe(heading.id);
    expect(collected[0]).not.toBe(heading);
  });

  it('keeps the destination style when it already has the id', () => {
    const clipboardParish = createCustomInitialMartyriaStyle(
      'parish',
      'Parish (copied)',
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    );
    const targetParish = createCustomInitialMartyriaStyle(
      'parish',
      'Parish',
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    );

    expect(
      resolveClipboardInitialMartyriaStyles(
        [clipboardParish],
        [targetParish],
        createDefaultParagraphStyles(),
        new Map(),
      ),
    ).toEqual([]);
  });

  it('imports unknown styles as copies under the same id', () => {
    const parish = createCustomInitialMartyriaStyle(
      'parish',
      'Parish',
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    );

    const imported = resolveClipboardInitialMartyriaStyles(
      [parish],
      [],
      createDefaultParagraphStyles(),
      new Map(),
    );

    expect(imported).toHaveLength(1);
    expect(imported[0]).toEqual(parish);
    expect(imported[0]).not.toBe(parish);
  });

  it('remaps the paragraph style reference of an imported style', () => {
    const heading = createCustomParagraphStyle('heading', 'Heading');
    const greekHeading = createCustomParagraphStyle(
      'greek-heading',
      'Greek Heading',
    );
    const parish = createCustomInitialMartyriaStyle(
      'parish',
      'Parish',
      heading.id,
      greekHeading.id,
    );
    const targetParagraphStyles = createDefaultParagraphStyles();

    const { importedParagraphStyles, styleIdRemap } =
      resolveClipboardParagraphStyles(
        collectClipboardParagraphStylesFromElements(
          [],
          [parish],
          [...targetParagraphStyles, heading, greekHeading],
        ),
        targetParagraphStyles,
        collectClipboardParagraphStyleIdsFromElements([], [parish]),
      );
    const imported = resolveClipboardInitialMartyriaStyles(
      [parish],
      [],
      targetParagraphStyles,
      styleIdRemap,
    );

    expect(importedParagraphStyles).toHaveLength(2);
    expect(importedParagraphStyles[0].displayName).toBe('Heading');
    expect(importedParagraphStyles[1].displayName).toBe('Greek Heading');
    expect(imported).toHaveLength(1);
    expect(imported[0].paragraphStyleId).toBe(importedParagraphStyles[0].id);
    expect(imported[0].greekParagraphStyleId).toBe(
      importedParagraphStyles[1].id,
    );
    expect(parish.paragraphStyleId).toBe(heading.id);
    expect(parish.greekParagraphStyleId).toBe(greekHeading.id);
  });

  it('reuses a destination paragraph style by name for an imported style', () => {
    const heading = createCustomParagraphStyle('heading', 'Heading');
    const targetHeading = createCustomParagraphStyle(
      'target-heading',
      'Heading',
    );
    const parish = createCustomInitialMartyriaStyle(
      'parish',
      'Parish',
      heading.id,
    );
    const targetParagraphStyles = [
      ...createDefaultParagraphStyles(),
      targetHeading,
    ];

    const { importedParagraphStyles, styleIdRemap } =
      resolveClipboardParagraphStyles([heading], targetParagraphStyles, [
        heading.id,
      ]);
    const imported = resolveClipboardInitialMartyriaStyles(
      [parish],
      [],
      targetParagraphStyles,
      styleIdRemap,
    );

    expect(importedParagraphStyles).toEqual([]);
    expect(imported[0].paragraphStyleId).toBe(targetHeading.id);
  });

  it('falls back to the built-in paragraph style when the reference is unknown', () => {
    const parish = createCustomInitialMartyriaStyle(
      'parish',
      'Parish',
      'deleted',
      'deleted-greek',
    );

    const imported = resolveClipboardInitialMartyriaStyles(
      [parish],
      [],
      createDefaultParagraphStyles(),
      new Map(),
    );

    expect(imported[0].paragraphStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    );
    expect(imported[0].greekParagraphStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyriaGreek,
    );
  });

  it('clears mode key references that stay unknown after the merge', () => {
    const parish = createCustomInitialMartyriaStyle(
      'parish',
      'Parish',
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    );
    const known = createModeKey(parish.id);
    const builtIn = createModeKey(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNames,
    );
    const followsScore = createModeKey(null);
    const unknown = createModeKey('deleted');

    for (const modeKey of [known, builtIn, followsScore, unknown]) {
      rewriteClipboardElementInitialMartyriaStyleId(modeKey, [parish]);
    }

    expect(known.initialMartyriaStyleId).toBe(parish.id);
    expect(builtIn.initialMartyriaStyleId).toBe(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNames,
    );
    expect(followsScore.initialMartyriaStyleId).toBeNull();
    expect(unknown.initialMartyriaStyleId).toBeNull();
  });
});
