import { describe, expect, it } from 'vitest';

import { quoteStyleForLanguage, smartQuote } from './smartQuotes';

describe('smartQuote', () => {
  it('ignores characters other than straight quotes', () => {
    expect(smartQuote('a', '', 'en')).toBeUndefined();
    expect(smartQuote('’', 'don', 'en')).toBeUndefined();
  });

  it('opens double quotes at the start, after spaces, and after brackets', () => {
    expect(smartQuote('"', '', 'en')).toBe('“');
    expect(smartQuote('"', 'said ', 'en')).toBe('“');
    expect(smartQuote('"', '(', 'en')).toBe('“');
    expect(smartQuote('"', 'word—', 'en')).toBe('“');
  });

  it('closes double quotes after other characters', () => {
    expect(smartQuote('"', '“word', 'en')).toBe('”');
    expect(smartQuote('"', 'end.', 'en')).toBe('”');
  });

  it('opens a quote typed right after an opening quote', () => {
    expect(smartQuote("'", 'said “', 'en')).toBe('‘');
    expect(smartQuote('"', 'said ‘', 'en')).toBe('“');
  });

  it('types an English apostrophe inside a word', () => {
    expect(smartQuote("'", 'don', 'en')).toBe('’');
    expect(smartQuote("'", '', 'en')).toBe('‘');
  });

  it('uses the language pair for double quotes', () => {
    expect(smartQuote('"', '', 'el')).toBe('«');
    expect(smartQuote('"', '«λόγος', 'el')).toBe('»');
    expect(smartQuote('"', '', 'ro')).toBe('„');
    expect(smartQuote('"', '„text', 'ro')).toBe('”');
    expect(smartQuote('"', '', 'ru')).toBe('«');
    expect(smartQuote('"', '«слово', 'ru')).toBe('»');
    expect(smartQuote('"', '', 'ar')).toBe('”');
    expect(smartQuote('"', '”كلمة', 'ar')).toBe('“');
  });

  it('opens the nested pair for a single quote in opening context', () => {
    expect(smartQuote("'", '«', 'ru')).toBe('„');
    expect(smartQuote("'", '«a ', 'el')).toBe('“');
    expect(smartQuote("'", '„a ', 'ro')).toBe('«');
  });

  it('closes an open nested quote', () => {
    expect(smartQuote("'", '«„цитата', 'ru')).toBe('“');
    expect(smartQuote("'", '«“λόγος', 'el')).toBe('”');
    expect(smartQuote("'", '„«text', 'ro')).toBe('»');
  });

  it('types an apostrophe when no nested quote is open', () => {
    expect(smartQuote("'", 'апостроф', 'ru')).toBe('’');
    expect(smartQuote("'", '„цитата“ и апостроф', 'ru')).toBe('’');
    expect(smartQuote("'", 'ἀπ', 'el')).toBe('’');
  });
});

describe('quoteStyleForLanguage', () => {
  it('maps language codes and tags to quote styles', () => {
    expect(quoteStyleForLanguage('el')).toBe('el');
    expect(quoteStyleForLanguage('ru-RU')).toBe('ru');
    expect(quoteStyleForLanguage('ar:rtl')).toBe('ar');
    expect(quoteStyleForLanguage('EN')).toBe('en');
  });

  it('returns undefined for unknown or missing languages', () => {
    expect(quoteStyleForLanguage('fr')).toBeUndefined();
    expect(quoteStyleForLanguage('')).toBeUndefined();
    expect(quoteStyleForLanguage(null)).toBeUndefined();
  });
});
