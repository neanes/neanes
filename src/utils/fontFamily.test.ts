import { describe, expect, it } from 'vitest';

import { RICH_TEXT_DEFAULT_FONT_FAMILY } from './fontConstants';
import {
  firstFontFamilyToken,
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
    expect(splitFontFamilyList('"A; B", "C, D", serif')).toEqual([
      '"A; B"',
      ' "C, D"',
      ' serif',
    ]);
  });

  it('normalizes the first family token', () => {
    expect(firstFontFamilyToken("'GFS Didot', Neanes")).toBe('GFS Didot');
    expect(firstFontFamilyToken('Source Serif,Neanes')).toBe('Source Serif');
    expect(firstFontFamilyToken("'O\\'Brien', serif")).toBe("O'Brien");
  });
});

describe('font-family serialization', () => {
  it('quotes non-bare CSS font family names', () => {
    expect(quoteFontFamily('Neanes')).toBe('Neanes');
    expect(quoteFontFamily('GFS Didot')).toBe("'GFS Didot'");
    expect(quoteFontFamily("O'Brien")).toBe("'O\\'Brien'");
    expect(quoteFontFamily('A\\B')).toBe("'A\\\\B'");
  });

  it('converts rich-text font-family model values for UI controls', () => {
    expect(fromRichTextFontFamilyModelValue(undefined)).toBe(
      RICH_TEXT_DEFAULT_FONT_FAMILY,
    );
    expect(fromRichTextFontFamilyModelValue("'GFS Didot', Neanes")).toBe(
      'GFS Didot',
    );
  });

  it('normalizes rich-text font-family model values', () => {
    expect(toRichTextFontFamilyModelValue(RICH_TEXT_DEFAULT_FONT_FAMILY)).toBe(
      undefined,
    );
    expect(toRichTextFontFamilyModelValue('Neanes')).toBe('Neanes');
    expect(toRichTextFontFamilyModelValue('Source Serif')).toBe('Source Serif');
  });
});
