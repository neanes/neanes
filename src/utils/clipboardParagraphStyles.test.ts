import { describe, expect, it } from 'vitest';

import { NoteElement } from '@/models/Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  ParagraphStyle,
} from '@/models/ParagraphStyle';

import {
  collectClipboardParagraphStyleIdsFromElements,
  collectClipboardParagraphStylesForPassageAndFootnotes,
  resolveClipboardParagraphStyles,
  rewriteClipboardElementParagraphStyleIds,
} from './clipboardParagraphStyles';

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
  it.each([false, true])(
    'preserves footnote lyric styles independently of passage lyrics (%s)',
    (includeLyrics) => {
      const parent = createCustomParagraphStyle(
        'parent',
        'Parent',
        BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      );
      const bodyStyle = createCustomParagraphStyle('body', 'Body', parent.id);
      const mainStyle = createCustomParagraphStyle(
        'main',
        'Main',
        BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      );
      const main = new NoteElement();
      main.lyrics = 'Main words';
      main.lyricsParagraphStyleId = mainStyle.id;
      const body = new NoteElement();
      body.lyrics = 'Footnote words';
      body.lyricsParagraphStyleId = bodyStyle.id;
      const collected = collectClipboardParagraphStylesForPassageAndFootnotes(
        [main],
        [body],
        includeLyrics,
        [parent, bodyStyle, mainStyle],
      );
      expect(collected.map((style) => style.id).sort()).toEqual(
        includeLyrics ? ['body', 'main', 'parent'] : ['body', 'parent'],
      );
      const pastedMain = main.clone({ includeLyrics });
      const target = createDefaultParagraphStyles();
      const { importedParagraphStyles, styleIdRemap } =
        resolveClipboardParagraphStyles(
          collected,
          target,
          collectClipboardParagraphStyleIdsFromElements([pastedMain, body]),
        );
      target.push(...importedParagraphStyles);
      rewriteClipboardElementParagraphStyleIds(body, target, styleIdRemap);
      const importedBody = importedParagraphStyles.find(
        (style) => style.displayName === 'Body',
      )!;
      expect(body.lyricsParagraphStyleId).toBe(importedBody.id);
      expect(body.lyrics).toBe('Footnote words');
      expect(importedBody.parentStyleId).toBe(
        importedParagraphStyles.find((style) => style.displayName === 'Parent')!
          .id,
      );
    },
  );

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
