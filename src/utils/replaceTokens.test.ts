import { describe, expect, it } from 'vitest';

import { TextBoxAlignment } from '@/models/Element';

import { replaceTokens, type TokenMetadata } from './replaceTokens';

const metadata: TokenMetadata = {
  pageNumber: 1,
  numberOfPages: 12,
  fileName: 'score.byzx',
  filePath: '/tmp/score.byzx',
  numerals: 'westernArabic',
  title: 'Title',
  author: 'Author',
  chapter: 'Chapter 1',
  section: 'Section A',
  isBookStyleChapterOpening: false,
};

describe('replaceTokens', () => {
  it('replaces existing and running-marker tokens', () => {
    expect(
      replaceTokens(
        '$:author|$:title|$:chapter|$:section|$p|$n|$f|$F',
        metadata,
        TextBoxAlignment.Center,
      ),
    ).toBe('Author|Title|Chapter 1|Section A|1|12|score.byzx|/tmp/score.byzx');
  });

  it('suppresses book-style opening header tokens and keeps footer folios', () => {
    const chapterOpeningMetadata: TokenMetadata = {
      ...metadata,
      isBookStyleChapterOpening: true,
    };

    expect(
      replaceTokens(
        '$:author|$:title|$:chapter|$:section|$p',
        chapterOpeningMetadata,
        TextBoxAlignment.Center,
        'header',
      ),
    ).toBe('||||');

    expect(
      replaceTokens(
        '$:author|$:title|$:chapter|$:section|$p',
        chapterOpeningMetadata,
        TextBoxAlignment.Center,
        'footer',
      ),
    ).toBe('||||1');
  });
});
