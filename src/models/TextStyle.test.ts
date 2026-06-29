import { describe, expect, it } from 'vitest';

import {
  RichTextBoxElement,
  TextBoxAlignment,
  TextBoxElement,
} from './Element';
import { PageSetup } from './PageSetup';
import {
  BUILT_IN_TEXT_STYLE_IDS,
  createTextStylesFromDefaults,
  resolveTextStyle,
  TextStyle,
  wouldCreateTextStyleCycle,
} from './TextStyle';

describe('TextStyle', () => {
  it('seeds built-in styles from page setup defaults', () => {
    const pageSetup = new PageSetup();

    const styles = createTextStylesFromDefaults(pageSetup, {
      textBoxDefaultFontFamily: 'Minion Pro',
      lyricsDefaultFontFamily: 'GFS Didot',
    });

    expect(styles.map((style) => style.id)).toEqual([
      BUILT_IN_TEXT_STYLE_IDS.DefaultText,
      BUILT_IN_TEXT_STYLE_IDS.Annotation,
      BUILT_IN_TEXT_STYLE_IDS.Title,
      BUILT_IN_TEXT_STYLE_IDS.Subtitle,
      BUILT_IN_TEXT_STYLE_IDS.Chapter,
      BUILT_IN_TEXT_STYLE_IDS.Section,
      BUILT_IN_TEXT_STYLE_IDS.Header,
      BUILT_IN_TEXT_STYLE_IDS.Footer,
      BUILT_IN_TEXT_STYLE_IDS.Lyrics,
      BUILT_IN_TEXT_STYLE_IDS.DropCap,
    ]);
    expect(styles[0].overrides.fontFamily).toBe('Minion Pro');
    expect(styles[0].overrides.alignment).toBe(TextBoxAlignment.Left);
    expect(styles[2].overrides.alignment).toBe(TextBoxAlignment.Center);
    expect(styles[5].overrides.alignment).toBeUndefined();
    expect(styles[8].overrides.fontFamily).toBe('GFS Didot');
    expect(styles[9].overrides.fontFamily).toBe('Source Serif');
  });

  it('resolves inheritance through parent styles and element overrides', () => {
    const parent = new TextStyle();
    parent.id = 'parent';
    parent.overrides = {
      alignment: TextBoxAlignment.Center,
      fontFamily: 'Source Serif',
      color: '#111111',
    };

    const child = new TextStyle();
    child.id = 'child';
    child.parentStyleId = parent.id;
    child.overrides = {
      alignment: TextBoxAlignment.Right,
      color: '#222222',
      lineHeight: 1.2,
    };

    const resolved = resolveTextStyle([parent, child], child.id, {
      alignment: TextBoxAlignment.Justify,
      color: '#333333',
    });

    expect(resolved.alignment).toBe(TextBoxAlignment.Justify);
    expect(resolved.fontFamily).toBe('Source Serif');
    expect(resolved.color).toBe('#333333');
    expect(resolved.lineHeight).toBe(1.2);
  });

  it('detects inheritance cycles', () => {
    const left = new TextStyle();
    left.id = 'left';
    left.parentStyleId = 'right';

    const right = new TextStyle();
    right.id = 'right';
    right.parentStyleId = null;

    expect(wouldCreateTextStyleCycle([left, right], 'right', 'left')).toBe(
      true,
    );
    expect(wouldCreateTextStyleCycle([left, right], 'right', 'missing')).toBe(
      false,
    );
  });

  it('starts new text boxes with the Default Text paragraph style', () => {
    expect(new TextBoxElement().textStyleId).toBe(
      BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    );
    expect('textStyleId' in new RichTextBoxElement()).toBe(false);
  });
});
