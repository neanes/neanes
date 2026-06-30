import { describe, expect, it } from 'vitest';

import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { Unit } from '@/utils/Unit';

import {
  RichTextBoxElement,
  TextBoxAlignment,
  TextBoxElement,
} from './Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createBuiltInParagraphStyleFromFactory,
  createParagraphStylesFromDefaults,
  ParagraphStyle,
  resolveParagraphStyle,
  wouldCreateParagraphStyleCycle,
} from './ParagraphStyle';

describe('ParagraphStyle', () => {
  it('seeds built-in styles from page setup defaults', () => {
    const styles = createParagraphStylesFromDefaults({
      textBoxDefaultFontFamily: 'Minion Pro',
      lyricsDefaultFontFamily: 'GFS Didot',
    });

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
    expect(styles[0].overrides.fontFamily).toBe('Minion Pro');
    expect(styles[0].overrides.alignment).toBe(TextBoxAlignment.Left);
    expect(styles[2].overrides.alignment).toBe(TextBoxAlignment.Center);
    expect(styles[5].overrides.alignment).toBeUndefined();
    expect(styles[8].overrides.fontFamily).toBe('GFS Didot');
    expect(styles[9].overrides.fontFamily).toBe('Source Serif');
  });

  it('resolves inheritance through parent styles and element overrides', () => {
    const parent = new ParagraphStyle();
    parent.id = 'parent';
    parent.overrides = {
      alignment: TextBoxAlignment.Center,
      fontFamily: 'Source Serif',
      color: '#111111',
    };

    const child = new ParagraphStyle();
    child.id = 'child';
    child.parentStyleId = parent.id;
    child.overrides = {
      alignment: TextBoxAlignment.Right,
      color: '#222222',
      lineHeight: 1.2,
    };

    const resolved = resolveParagraphStyle([parent, child], child.id, {
      alignment: TextBoxAlignment.Justify,
      color: '#333333',
    });

    expect(resolved.alignment).toBe(TextBoxAlignment.Justify);
    expect(resolved.fontFamily).toBe('Source Serif');
    expect(resolved.color).toBe('#333333');
    expect(resolved.lineHeight).toBe(1.2);
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
      wouldCreateParagraphStyleCycle([left, right], 'right', 'missing'),
    ).toBe(false);
  });

  it('starts new text boxes with the Default Text paragraph style', () => {
    expect(new TextBoxElement().paragraphStyleId).toBe(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
    expect('paragraphStyleId' in new RichTextBoxElement()).toBe(false);
  });

  it('returns fresh factory definitions for built-in paragraph styles', () => {
    const title = createBuiltInParagraphStyleFromFactory(
      BUILT_IN_PARAGRAPH_STYLE_IDS.Title,
    );
    title.displayName = 'Title Override';
    title.parentStyleId = null;
    title.overrides.fontFamily = 'Minion Pro';

    const resetTitle = createBuiltInParagraphStyleFromFactory(
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

    const defaultText = createBuiltInParagraphStyleFromFactory(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );

    expect(defaultText.displayName).toBe('Default Text');
    expect(defaultText.builtIn).toBe(true);
    expect(defaultText.parentStyleId).toBeNull();
    expect(defaultText.overrides).toEqual({
      alignment: TextBoxAlignment.Left,
      fontFamily: 'Source Serif',
      fontSize: Unit.fromPt(12),
      fontStyle: DEFAULT_FONT_STYLE,
      color: '#000000',
      strokeWidth: 0,
      lineHeight: null,
    });

    const customizedDefaultText = createBuiltInParagraphStyleFromFactory(
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
    customizedDefaultText.overrides.fontFamily = 'Minion Pro';

    const resolvedTitle = resolveParagraphStyle(
      [customizedDefaultText, resetTitle],
      resetTitle.id,
    );

    expect(resolvedTitle.fontFamily).toBe('Minion Pro');
    expect(resolvedTitle.fontSize).toBe(Unit.fromPt(28));
    expect(resolvedTitle.alignment).toBe(TextBoxAlignment.Center);
  });
});
