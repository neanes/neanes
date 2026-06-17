import { describe, expect, it } from 'vitest';

import { RICH_TEXT_DEFAULT_FONT_FAMILY } from './fontConstants';
import {
  firstFontFamilyToken,
  fontFamilyListContains,
  fromRichTextFontFamilyModelValue,
  quoteFontFamily,
  splitFontFamilyList,
  toRichTextFontFamilyModelValue,
} from './fontFamily';

describe('font-family list parsing', () => {
  it('splits font-family lists without splitting quoted commas', () => {
    expect(splitFontFamilyList("'Family, Display', Neanes")).toEqual([
      "'Family, Display'",
      ' Neanes',
    ]);
  });

  it('normalizes the first family token', () => {
    expect(firstFontFamilyToken("'GFS Didot', Neanes")).toBe('GFS Didot');
    expect(firstFontFamilyToken('Source Serif,Neanes')).toBe('Source Serif');
  });

  it('matches family-list entries after quote normalization', () => {
    expect(fontFamilyListContains("'GFS Didot', Neanes", 'GFS Didot')).toBe(
      true,
    );
    expect(fontFamilyListContains("'GFS Didot', Neanes", 'Old Standard')).toBe(
      false,
    );
  });
});

describe('font-family serialization', () => {
  it('quotes non-bare CSS font family names', () => {
    expect(quoteFontFamily('Neanes')).toBe('Neanes');
    expect(quoteFontFamily('GFS Didot')).toBe("'GFS Didot'");
  });

  it('converts rich-text font-family model values for UI controls', () => {
    expect(fromRichTextFontFamilyModelValue(undefined)).toBe(
      RICH_TEXT_DEFAULT_FONT_FAMILY,
    );
    expect(fromRichTextFontFamilyModelValue("'GFS Didot', Neanes")).toBe(
      'GFS Didot',
    );
  });

  it('composes rich-text font-family model values with the neume fallback', () => {
    expect(
      toRichTextFontFamilyModelValue(RICH_TEXT_DEFAULT_FONT_FAMILY, 'Neanes'),
    ).toBeUndefined();
    expect(toRichTextFontFamilyModelValue('Neanes', 'Neanes')).toBe('Neanes');
    expect(toRichTextFontFamilyModelValue('Source Serif', 'Neanes')).toBe(
      'Source Serif,Neanes',
    );
  });
});
