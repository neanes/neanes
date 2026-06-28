import { describe, expect, it } from 'vitest';

import { TextBoxAlignment } from './Element';
import { RichTextBoxElement, TextBoxElement } from './Element';
import { PageSetup } from './PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createParagraphStylesFromDefaults,
  createParagraphStylesFromPageSetup,
  ParagraphStyle,
  resolveParagraphStyle,
  wouldCreateParagraphStyleCycle,
} from './ParagraphStyle';

describe('ParagraphStyle', () => {
  it('seeds built-in styles from page setup defaults', () => {
    const pageSetup = new PageSetup();
    pageSetup.lyricsDefaultFontFamily = 'GFS Didot';

    const styles = createParagraphStylesFromDefaults(pageSetup, {
      textBoxDefaultFontFamily: 'Minion Pro',
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
      BUILT_IN_PARAGRAPH_STYLE_IDS.Verse,
    ]);
    expect(styles[0].overrides.fontFamily).toBe('Minion Pro');
    expect(styles[0].overrides.alignment).toBe(TextBoxAlignment.Left);
    expect(styles[2].overrides.alignment).toBe(TextBoxAlignment.Center);
    expect(styles[5].overrides.alignment).toBeUndefined();
    expect(styles[8].overrides.fontFamily).toBe('GFS Didot');
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
});
