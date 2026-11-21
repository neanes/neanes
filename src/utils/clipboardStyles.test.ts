import { describe, expect, it } from 'vitest';

import { ModeKeyElement } from '@/models/Element';
import {
  createDefaultInitialMartyriaTypography,
  getCommonInitialMartyriaWording,
} from '@/models/InitialMartyriaCommonWordings';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  ParagraphStyle,
} from '@/models/ParagraphStyle';

import {
  getScoreStyleAdditions,
  importClipboardStyles,
  partitionStylesByUse,
  rewriteClipboardElementStyleReferences,
} from './clipboardStyles';

function createInitialMartyriaStyle(
  id: string,
  displayName: string,
  paragraphStyleId: string = BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
): InitialMartyriaStyle {
  return {
    id,
    displayName,
    structure: {
      ...getCommonInitialMartyriaWording('englishModeNames').structure,
    },
    ...createDefaultInitialMartyriaTypography(),
    paragraphStyleId,
  };
}

function createParagraphStyle(
  id: string,
  displayName: string,
  parentStyleId: string = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
) {
  const style = new ParagraphStyle();
  style.id = id;
  style.displayName = displayName;
  style.parentStyleId = parentStyleId;
  return style;
}

function createModeKey(initialMartyriaStyleId: string | null) {
  const modeKey = new ModeKeyElement();
  modeKey.initialMartyriaStyleId = initialMartyriaStyleId;
  return modeKey;
}

describe('clipboardStyles', () => {
  it('imports missing styles and points pasted references at them', () => {
    const paragraphStyle = createParagraphStyle('source-text', 'Rubric');
    const initialMartyriaStyle = createInitialMartyriaStyle(
      'source-key',
      'Parish',
      paragraphStyle.id,
    );
    const target = {
      paragraphStyles: createDefaultParagraphStyles(),
      initialMartyriaStyles: [],
    };

    const result = importClipboardStyles(
      {
        paragraphStyles: [paragraphStyle],
        paragraphStyleIds: [paragraphStyle.id],
        initialMartyriaStyles: [initialMartyriaStyle],
      },
      target,
    );

    const [importedParagraphStyle] = result.imported.paragraphStyles;
    const [importedInitialMartyriaStyle] =
      result.imported.initialMartyriaStyles;
    expect(importedParagraphStyle.displayName).toBe('Rubric');
    expect(importedParagraphStyle.id).not.toBe(paragraphStyle.id);
    // The imported initial martyria style follows the imported paragraph style.
    expect(importedInitialMartyriaStyle.paragraphStyleId).toBe(
      importedParagraphStyle.id,
    );
    expect(result.styles.paragraphStyles).toEqual([
      ...target.paragraphStyles,
      importedParagraphStyle,
    ]);
    expect(result.styles.initialMartyriaStyles).toEqual([
      importedInitialMartyriaStyle,
    ]);

    const modeKey = createModeKey(initialMartyriaStyle.id);
    rewriteClipboardElementStyleReferences(modeKey, result);
    expect(modeKey.initialMartyriaStyleId).toBe(
      importedInitialMartyriaStyle.id,
    );
  });

  it('reuses destination styles and imports nothing for them', () => {
    const paragraphStyle = createParagraphStyle('text', 'Rubric');
    const initialMartyriaStyle = createInitialMartyriaStyle(
      'key',
      'Parish',
      paragraphStyle.id,
    );
    const target = {
      paragraphStyles: [...createDefaultParagraphStyles(), paragraphStyle],
      initialMartyriaStyles: [initialMartyriaStyle],
    };

    const result = importClipboardStyles(
      {
        paragraphStyles: [paragraphStyle],
        paragraphStyleIds: [paragraphStyle.id],
        initialMartyriaStyles: [initialMartyriaStyle],
      },
      target,
    );

    expect(result.imported).toEqual({
      paragraphStyles: [],
      initialMartyriaStyles: [],
    });
    expect(getScoreStyleAdditions(target, result.imported)).toBeNull();
  });

  it('adds only the styles a score lacks', () => {
    const existing = createInitialMartyriaStyle('existing', 'Existing');
    const added = createInitialMartyriaStyle('added', 'Added');
    const score = {
      paragraphStyles: createDefaultParagraphStyles(),
      initialMartyriaStyles: [existing],
    };

    expect(
      getScoreStyleAdditions(score, {
        paragraphStyles: [],
        initialMartyriaStyles: [existing, added, added],
      }),
    ).toEqual({ initialMartyriaStyles: [existing, added] });
  });

  it('separates the styles elements use from the rest', () => {
    const parent = createParagraphStyle('parent', 'Parent');
    const child = createParagraphStyle('child', 'Child', parent.id);
    const unusedParagraphStyle = createParagraphStyle('unused', 'Unused');
    const used = createInitialMartyriaStyle('used', 'Used', child.id);
    const unused = createInitialMartyriaStyle(
      'unused-key',
      'Unused',
      unusedParagraphStyle.id,
    );

    const result = partitionStylesByUse([createModeKey('used')], {
      paragraphStyles: [parent, child, unusedParagraphStyle],
      initialMartyriaStyles: [used, unused],
    });

    // A used style brings its paragraph style and that style's parent.
    expect(result.used).toEqual({
      paragraphStyles: [parent, child],
      initialMartyriaStyles: [used],
    });
    expect(result.unused).toEqual({
      paragraphStyles: [unusedParagraphStyle],
      initialMartyriaStyles: [unused],
    });
  });
});
