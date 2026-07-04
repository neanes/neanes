import { describe, expect, it } from 'vitest';

import { Score } from './Score';

describe('Score header/footer selection', () => {
  it('lets first-page variants win over chapter opening', () => {
    const score = new Score();

    score.pageSetup.headerDifferentFirstPage = true;
    score.pageSetup.headerFooterDifferentChapterOpening = true;

    expect(score.getHeaderForPage(1, true)).toBe(score.headers.firstPage);
    expect(score.getFooterForPage(1, true)).toBe(score.footers.firstPage);
  });

  it('lets chapter-opening variants win over odd/even variants', () => {
    const score = new Score();

    score.pageSetup.headerDifferentOddEven = true;
    score.pageSetup.headerFooterDifferentChapterOpening = true;

    expect(score.getHeaderForPage(3, true)).toBe(score.headers.chapterOpening);
    expect(score.getFooterForPage(3, true)).toBe(score.footers.chapterOpening);
  });

  it('falls back through first-page, odd/even, and default when chapter opening is disabled', () => {
    const score = new Score();

    score.pageSetup.headerDifferentFirstPage = true;
    score.pageSetup.headerDifferentOddEven = true;
    score.pageSetup.headerFooterDifferentChapterOpening = false;

    expect(score.getHeaderForPage(1, true)).toBe(score.headers.firstPage);
    expect(score.getFooterForPage(1, true)).toBe(score.footers.firstPage);
    expect(score.getHeaderForPage(3, true)).toBe(score.headers.odd);
    expect(score.getFooterForPage(3, true)).toBe(score.footers.odd);
    expect(score.getHeaderForPage(2, false)).toBe(score.headers.even);
    expect(score.getFooterForPage(2, false)).toBe(score.footers.even);

    score.pageSetup.headerDifferentOddEven = false;

    expect(score.getHeaderForPage(3, true)).toBe(score.headers.default);
    expect(score.getFooterForPage(3, true)).toBe(score.footers.default);
  });

  it('can hide header and footer rules on chapter-opening pages', () => {
    const score = new Score();

    score.pageSetup.showHeaderHorizontalRule = true;
    score.pageSetup.showFooterHorizontalRule = true;
    score.pageSetup.headerFooterDifferentChapterOpening = true;
    score.pageSetup.excludeHeaderHorizontalRuleChapterOpening = true;
    score.pageSetup.excludeFooterHorizontalRuleChapterOpening = true;

    expect(score.shouldShowHeaderRuleForPageIndex(3, true)).toBe(false);
    expect(score.shouldShowFooterRuleOnPage(3, true)).toBe(false);
    expect(score.shouldShowHeaderRuleForPageIndex(2, false)).toBe(true);
    expect(score.shouldShowFooterRuleOnPage(2, false)).toBe(true);
  });
});
