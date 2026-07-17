import { isDisplayedPageNumberOdd } from '@/utils/PageNumbering';

import type { Footer } from './Footer';
import { Footers } from './Footers';
import type { Header } from './Header';
import { Headers } from './Headers';
import type { InitialMartyriaStyle } from './InitialMartyriaStyle';
import { PageSetup } from './PageSetup';
import {
  createDefaultParagraphStyles,
  type ParagraphStyle,
} from './ParagraphStyle';
import { Staff } from './Staff';

export class DocumentProperties {
  public title: string = '';
  public author: string = '';
}

export class Score {
  public documentProperties: DocumentProperties = new DocumentProperties();
  public pageSetup: PageSetup = new PageSetup();
  public paragraphStyles: ParagraphStyle[] = createDefaultParagraphStyles();
  public initialMartyriaStyles: InitialMartyriaStyle[] = [];
  public headers: Headers = new Headers();
  public footers: Footers = new Footers();
  public staff: Staff = new Staff();

  public get headersAndFooters() {
    return [
      ...this.headers.default.elements,
      ...this.headers.chapterOpening.elements,
      ...this.headers.even.elements,
      ...this.headers.firstPage.elements,
      ...this.headers.odd.elements,
      ...this.footers.default.elements,
      ...this.footers.chapterOpening.elements,
      ...this.footers.even.elements,
      ...this.footers.firstPage.elements,
      ...this.footers.odd.elements,
    ];
  }

  getHeaderForPage(physicalPageNumber: number, isChapterOpening = false) {
    let header: Header;
    const isOddDisplayedPage = isDisplayedPageNumberOdd(
      this.pageSetup,
      physicalPageNumber,
    );

    if (this.pageSetup.headerDifferentFirstPage && physicalPageNumber === 1) {
      header = this.headers.firstPage;
    } else if (
      this.pageSetup.headerFooterDifferentChapterOpening &&
      isChapterOpening
    ) {
      header = this.headers.chapterOpening;
    } else if (this.pageSetup.headerDifferentOddEven && isOddDisplayedPage) {
      header = this.headers.odd;
    } else if (this.pageSetup.headerDifferentOddEven) {
      header = this.headers.even;
    } else {
      header = this.headers.default;
    }

    return header;
  }

  getFooterForPage(physicalPageNumber: number, isChapterOpening = false) {
    let footer: Footer;
    const isOddDisplayedPage = isDisplayedPageNumberOdd(
      this.pageSetup,
      physicalPageNumber,
    );

    if (this.pageSetup.headerDifferentFirstPage && physicalPageNumber === 1) {
      footer = this.footers.firstPage;
    } else if (
      this.pageSetup.headerFooterDifferentChapterOpening &&
      isChapterOpening
    ) {
      footer = this.footers.chapterOpening;
    } else if (this.pageSetup.headerDifferentOddEven && isOddDisplayedPage) {
      footer = this.footers.odd;
    } else if (this.pageSetup.headerDifferentOddEven) {
      footer = this.footers.even;
    } else {
      footer = this.footers.default;
    }

    return footer;
  }

  public shouldShowHeaderRuleForPageIndex(
    physicalPageNumber: number,
    isChapterOpening = false,
  ): boolean {
    if (this.pageSetup.showHeaderHorizontalRule) {
      const isOddDisplayedPage = isDisplayedPageNumberOdd(
        this.pageSetup,
        physicalPageNumber,
      );

      if (
        (this.pageSetup.headerDifferentFirstPage &&
          this.pageSetup.excludeHeaderHorizontalRuleFirstPage &&
          physicalPageNumber === 1) ||
        (this.pageSetup.headerDifferentOddEven &&
          this.pageSetup.excludeHeaderHorizontalRuleEvenPage &&
          !isOddDisplayedPage) ||
        (this.pageSetup.headerDifferentOddEven &&
          this.pageSetup.excludeHeaderHorizontalRuleOddPage &&
          isOddDisplayedPage) ||
        (this.pageSetup.headerFooterDifferentChapterOpening &&
          this.pageSetup.excludeHeaderHorizontalRuleChapterOpening &&
          isChapterOpening)
      ) {
        return false;
      }
      return true;
    }

    return false;
  }

  public shouldShowFooterRuleOnPage(
    physicalPageNumber: number,
    isChapterOpening = false,
  ): boolean {
    if (this.pageSetup.showFooterHorizontalRule) {
      const isOddDisplayedPage = isDisplayedPageNumberOdd(
        this.pageSetup,
        physicalPageNumber,
      );

      if (
        (this.pageSetup.headerDifferentFirstPage &&
          this.pageSetup.excludeFooterHorizontalRuleFirstPage &&
          physicalPageNumber === 1) ||
        (this.pageSetup.headerDifferentOddEven &&
          this.pageSetup.excludeFooterHorizontalRuleEvenPage &&
          !isOddDisplayedPage) ||
        (this.pageSetup.headerDifferentOddEven &&
          this.pageSetup.excludeFooterHorizontalRuleOddPage &&
          isOddDisplayedPage) ||
        (this.pageSetup.headerFooterDifferentChapterOpening &&
          this.pageSetup.excludeFooterHorizontalRuleChapterOpening &&
          isChapterOpening)
      ) {
        return false;
      }
      return true;
    }

    return false;
  }
}
