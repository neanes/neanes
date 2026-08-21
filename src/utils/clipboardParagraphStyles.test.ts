import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  ParagraphStyle,
} from '@/models/ParagraphStyle';

import { resolveClipboardParagraphStyles } from './clipboardParagraphStyles';

function createCustomParagraphStyle(
  id: string,
  displayName: string,
  parentStyleId: string | null,
) {
  const style = new ParagraphStyle();
  style.id = id;
  style.displayName = displayName;
  style.parentStyleId = parentStyleId;
  return style;
}

describe('clipboardParagraphStyles', () => {
  it('skips ancestor-only imports when a descendant reuses the destination style by name', () => {
    const base = createCustomParagraphStyle(
      'base',
      'Base',
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
    const leaf = createCustomParagraphStyle('leaf', 'Leaf', base.id);
    const targetLeaf = createCustomParagraphStyle(
      'target-leaf',
      'Leaf',
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );

    const { importedParagraphStyles, styleIdRemap } =
      resolveClipboardParagraphStyles(
        [base, leaf],
        [...createDefaultParagraphStyles(), targetLeaf],
        [leaf.id],
      );

    expect(importedParagraphStyles).toEqual([]);
    expect(styleIdRemap.get(leaf.id)).toBe(targetLeaf.id);
    expect(styleIdRemap.has(base.id)).toBe(false);
  });

  it('imports a direct ancestor when it is actually referenced by copied content', () => {
    const base = createCustomParagraphStyle(
      'base',
      'Base',
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
    const leaf = createCustomParagraphStyle('leaf', 'Leaf', base.id);
    const targetLeaf = createCustomParagraphStyle(
      'target-leaf',
      'Leaf',
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );

    const { importedParagraphStyles, styleIdRemap } =
      resolveClipboardParagraphStyles(
        [base, leaf],
        [...createDefaultParagraphStyles(), targetLeaf],
        [base.id, leaf.id],
      );

    expect(importedParagraphStyles).toHaveLength(1);
    expect(importedParagraphStyles[0].displayName).toBe('Base');
    expect(importedParagraphStyles[0].parentStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
    expect(styleIdRemap.get(base.id)).toBe(importedParagraphStyles[0].id);
    expect(styleIdRemap.get(leaf.id)).toBe(targetLeaf.id);
  });
});
