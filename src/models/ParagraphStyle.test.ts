import { describe, expect, it } from 'vitest';

import { resources } from '@/i18n';
import { Unit } from '@/utils/Unit';

import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultBuiltInParagraphStyle,
  createDefaultParagraphStyles,
  getBuiltInParagraphStyleNameSelector,
  ParagraphStyle,
  resolveParagraphStyle,
  TextBoxAlignment,
  wouldCreateParagraphStyleCycle,
} from './ParagraphStyle';

describe('ParagraphStyle', () => {
  it('creates built-in styles from the default paragraph-style graph', () => {
    const styles = createDefaultParagraphStyles();
    const customStyle = new ParagraphStyle();

    expect(styles.map((style) => style.id)).toEqual([
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Title,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Subtitle,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Chapter,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Section,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Header,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Footer,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
    ]);
    expect(styles[0].overrides).toEqual({});
    expect(styles[0].parentStyleId).toBeNull();
    expect(styles.slice(1).every((style) => style.parentStyleId != null)).toBe(
      true,
    );
    expect(customStyle.parentStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
    expect(resolveParagraphStyle(styles, styles[0].id).fontFamily).toBe(
      'Source Serif',
    );
    expect(resolveParagraphStyle(styles, styles[0].id).alignment).toBe(
      TextBoxAlignment.Left,
    );
    expect(styles[2].overrides.alignment).toBe(TextBoxAlignment.Center);
    expect(styles[5].overrides.alignment).toBeUndefined();
    expect(styles[8].overrides).toEqual({});
    expect(styles[9].overrides).toEqual({ fontSize: Unit.fromPt(60) });
  });

  it('resolves inheritance through parent styles and element overrides', () => {
    const parent = new ParagraphStyle();
    parent.id = 'parent';
    parent.overrides = {
      alignment: TextBoxAlignment.Center,
      fontFamily: 'Source Serif',
      color: '#111111',
      textDecoration: 'underline',
    };

    const child = new ParagraphStyle();
    child.id = 'child';
    child.parentStyleId = parent.id;
    child.overrides = {
      alignment: TextBoxAlignment.Right,
      color: '#222222',
      lineHeight: 1.2,
      textDecoration: null,
    };

    const resolved = resolveParagraphStyle([parent, child], child.id, {
      alignment: TextBoxAlignment.Justify,
      color: '#333333',
    });

    expect(resolved.alignment).toBe(TextBoxAlignment.Justify);
    expect(resolved.fontFamily).toBe('Source Serif');
    expect(resolved.color).toBe('#333333');
    expect(resolved.lineHeight).toBe(1.2);
    expect(resolved.textDecoration).toBeNull();
  });

  it('detects inheritance cycles', () => {
    const left = new ParagraphStyle();
    left.id = 'left';
    left.parentStyleId = 'right';

    const right = new ParagraphStyle();
    right.id = 'right';
    right.parentStyleId = null;

    expect(wouldCreateParagraphStyleCycle([left, right], 'right', 'left')).toBe(
      true,
    );
    expect(
      wouldCreateParagraphStyleCycle([left, right], 'right', 'right'),
    ).toBe(true);
    expect(
      wouldCreateParagraphStyleCycle([left, right], 'right', 'missing'),
    ).toBe(false);
  });

  it('returns fresh default definitions for built-in paragraph styles', () => {
    const title = createDefaultBuiltInParagraphStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Title,
    );
    title.displayName = 'Title Override';
    title.parentStyleId = null;
    title.overrides.fontFamily = 'Minion Pro';

    const resetTitle = createDefaultBuiltInParagraphStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Title,
    );

    expect(resetTitle).not.toBe(title);
    expect(resetTitle.displayName).toBe('Title');
    expect(resetTitle.builtIn).toBe(true);
    expect(resetTitle.parentStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
    expect(resetTitle.overrides).toEqual({
      alignment: TextBoxAlignment.Center,
      fontSize: Unit.fromPt(28),
    });
    expect(resetTitle.overrides.fontFamily).toBeUndefined();

    const defaultText = createDefaultBuiltInParagraphStyle(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );

    expect(defaultText.displayName).toBe('Default Text');
    expect(defaultText.builtIn).toBe(true);
    expect(defaultText.parentStyleId).toBeNull();
    expect(defaultText.overrides).toEqual({});
    expect(defaultText.overrides.textDecoration).toBeUndefined();
  });

  it('maps built-in paragraph style ids to display-name selectors', () => {
    const defaultTextSelector = getBuiltInParagraphStyleNameSelector(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
    const lyricsSelector = getBuiltInParagraphStyleNameSelector(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    );

    expect(defaultTextSelector?.(resources.en)).toBe('Default Text');
    expect(lyricsSelector?.(resources.ro)).toBe('Versuri');
    expect(getBuiltInParagraphStyleNameSelector('custom-style')).toBeNull();
  });
});
