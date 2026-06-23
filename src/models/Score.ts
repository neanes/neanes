import type { Footer } from './Footer';
import { Footers } from './Footers';
import type { Header } from './Header';
import { Headers } from './Headers';
import { PageSetup } from './PageSetup';
import { ScoreSection } from './ScoreSection';
import { Staff } from './Staff';

export type HeaderFooterVariant = 'default' | 'odd' | 'even' | 'firstPage';

export interface ResolvedSectionInfo {
  sectionIndex: number;
  pageNumberInSection: number;
}

export interface ResolvedHeaderFooterSectionInfo extends ResolvedSectionInfo {
  activeVariant: HeaderFooterVariant;
  headerDifferentFirstPage: boolean;
  linkedToPrevious: boolean;
  sourceSectionIndex: number;
}

export class Score {
  public pageSetup: PageSetup = new PageSetup();
  public headers: Headers = new Headers();
  public footers: Footers = new Footers();
  public sections: ScoreSection[] = [];
  public staff: Staff = new Staff();

  public get headersAndFooters() {
    return [
      ...[
        this.headers,
        ...this.sections.map((section) => section.headers),
      ].flatMap((headers) => [
        ...headers.default.elements,
        ...headers.even.elements,
        ...headers.firstPage.elements,
        ...headers.odd.elements,
      ]),
      ...[
        this.footers,
        ...this.sections.map((section) => section.footers),
      ].flatMap((footers) => [
        ...footers.default.elements,
        ...footers.even.elements,
        ...footers.firstPage.elements,
        ...footers.odd.elements,
      ]),
    ];
  }

  public ensureMinimumSectionCount() {
    const requiredSectionCount = this.getRequiredSectionArrayLength();

    while (this.sections.length < requiredSectionCount) {
      this.sections.push(new ScoreSection());
    }
  }

  public getSectionCount() {
    return (
      this.staff.elements.filter(
        (element) => element.pageBreak && element.sectionBreak,
      ).length + 1
    );
  }

  public getRequiredSectionArrayLength() {
    return Math.max(0, this.getSectionCount() - 1);
  }

  public getSectionIndexForElementIndex(elementIndex: number) {
    let sectionIndex = 0;

    for (const element of this.staff.elements) {
      if (element.index >= elementIndex) {
        break;
      }

      if (element.pageBreak && element.sectionBreak) {
        sectionIndex++;
      }
    }

    return sectionIndex;
  }

  public getSectionIndexForPhysicalPage(pageNumber: number) {
    const sectionBreakPages = this.getSectionBreakPageNumbers();
    let sectionIndex = 0;

    for (const breakPageNumber of sectionBreakPages) {
      if (breakPageNumber >= pageNumber) {
        break;
      }

      sectionIndex++;
    }

    return sectionIndex;
  }

  public getSectionPageNumber(pageNumber: number) {
    let sectionStartPage = 1;

    for (const breakPageNumber of this.getSectionBreakPageNumbers()) {
      if (breakPageNumber >= pageNumber) {
        break;
      }

      sectionStartPage = breakPageNumber + 1;
    }

    return Math.max(1, pageNumber - sectionStartPage + 1);
  }

  public findSectionForPhysicalPage(pageNumber: number): ResolvedSectionInfo {
    return {
      sectionIndex: this.getSectionIndexForPhysicalPage(pageNumber),
      pageNumberInSection: this.getSectionPageNumber(pageNumber),
    };
  }

  public resolveHeaderSectionForPage(
    pageNumber: number,
  ): ResolvedHeaderFooterSectionInfo {
    const resolvedSection = this.findSectionForPhysicalPage(pageNumber);
    const activeVariant = this.getActiveVariantForPage(
      pageNumber,
      resolvedSection.pageNumberInSection,
      resolvedSection.sectionIndex,
    );

    return {
      ...resolvedSection,
      activeVariant,
      headerDifferentFirstPage: this.getHeaderDifferentFirstPageForSection(
        resolvedSection.sectionIndex,
      ),
      linkedToPrevious: this.getHeaderVariantLinkedToPrevious(
        resolvedSection.sectionIndex,
        activeVariant,
      ),
      sourceSectionIndex: this.getHeaderSourceSectionIndex(
        resolvedSection.sectionIndex,
        activeVariant,
      ),
    };
  }

  public resolveFooterSectionForPage(
    pageNumber: number,
  ): ResolvedHeaderFooterSectionInfo {
    const resolvedSection = this.findSectionForPhysicalPage(pageNumber);
    const activeVariant = this.getActiveVariantForPage(
      pageNumber,
      resolvedSection.pageNumberInSection,
      resolvedSection.sectionIndex,
    );

    return {
      ...resolvedSection,
      activeVariant,
      headerDifferentFirstPage: this.getHeaderDifferentFirstPageForSection(
        resolvedSection.sectionIndex,
      ),
      linkedToPrevious: this.getFooterVariantLinkedToPrevious(
        resolvedSection.sectionIndex,
        activeVariant,
      ),
      sourceSectionIndex: this.getFooterSourceSectionIndex(
        resolvedSection.sectionIndex,
        activeVariant,
      ),
    };
  }

  public getHeaderCollections() {
    return [this.headers, ...this.sections.map((section) => section.headers)];
  }

  public getFooterCollections() {
    return [this.footers, ...this.sections.map((section) => section.footers)];
  }

  public getExplicitSection(sectionIndex: number) {
    if (sectionIndex <= 0) {
      return null;
    }

    return this.sections[sectionIndex - 1] ?? null;
  }

  public getOrCreateExplicitSection(sectionIndex: number) {
    if (sectionIndex <= 0) {
      return null;
    }

    while (this.sections.length < sectionIndex) {
      this.sections.push(new ScoreSection());
    }

    return this.sections[sectionIndex - 1] ?? null;
  }

  getHeaderForPage(pageNumber: number): Header {
    const resolvedSection = this.resolveHeaderSectionForPage(pageNumber);
    return this.getHeaderForSectionVariant(
      resolvedSection.sourceSectionIndex,
      resolvedSection.activeVariant,
    );
  }

  getFooterForPage(pageNumber: number): Footer {
    const resolvedSection = this.resolveFooterSectionForPage(pageNumber);
    return this.getFooterForSectionVariant(
      resolvedSection.sourceSectionIndex,
      resolvedSection.activeVariant,
    );
  }

  public shouldShowHeaderOnPage(pageNumber: number): boolean {
    if (this.pageSetup.showHeaderHorizontalRule) {
      const resolvedSection = this.resolveHeaderSectionForPage(pageNumber);

      if (
        (resolvedSection.headerDifferentFirstPage &&
          this.pageSetup.excludeHeaderHorizontalRuleFirstPage &&
          resolvedSection.pageNumberInSection === 1) ||
        (this.pageSetup.headerDifferentOddEven &&
          this.pageSetup.excludeHeaderHorizontalRuleEvenPage &&
          pageNumber % 2 === 0) ||
        (this.pageSetup.headerDifferentOddEven &&
          this.pageSetup.excludeHeaderHorizontalRuleOddPage &&
          pageNumber % 2 !== 0)
      ) {
        return false;
      }
      return true;
    }

    return false;
  }

  public shouldShowFooterOnPage(pageNumber: number): boolean {
    if (this.pageSetup.showFooterHorizontalRule) {
      const resolvedSection = this.resolveFooterSectionForPage(pageNumber);

      if (
        (resolvedSection.headerDifferentFirstPage &&
          this.pageSetup.excludeFooterHorizontalRuleFirstPage &&
          resolvedSection.pageNumberInSection === 1) ||
        (this.pageSetup.headerDifferentOddEven &&
          this.pageSetup.excludeFooterHorizontalRuleEvenPage &&
          pageNumber % 2 === 0) ||
        (this.pageSetup.headerDifferentOddEven &&
          this.pageSetup.excludeFooterHorizontalRuleOddPage &&
          pageNumber % 2 !== 0)
      ) {
        return false;
      }
      return true;
    }

    return false;
  }

  private getHeaderForSectionVariant(
    sectionIndex: number,
    variant: HeaderFooterVariant,
  ): Header {
    const headers = this.getHeadersForSection(sectionIndex);

    if (variant === 'firstPage') {
      return headers.firstPage;
    }

    if (variant === 'even') {
      return headers.even;
    }

    if (variant === 'odd') {
      return headers.odd;
    }

    return headers.default;
  }

  private getFooterForSectionVariant(
    sectionIndex: number,
    variant: HeaderFooterVariant,
  ): Footer {
    const footers = this.getFootersForSection(sectionIndex);

    if (variant === 'firstPage') {
      return footers.firstPage;
    }

    if (variant === 'even') {
      return footers.even;
    }

    if (variant === 'odd') {
      return footers.odd;
    }

    return footers.default;
  }

  private getHeadersForSection(sectionIndex: number) {
    const section = this.getExplicitSection(sectionIndex);
    return section?.headers ?? this.headers;
  }

  private getFootersForSection(sectionIndex: number) {
    const section = this.getExplicitSection(sectionIndex);
    return section?.footers ?? this.footers;
  }

  private getHeaderSourceSectionIndex(
    sectionIndex: number,
    variant: HeaderFooterVariant,
  ) {
    let currentSectionIndex = sectionIndex;

    while (
      currentSectionIndex > 0 &&
      this.getHeaderVariantLinkedToPrevious(currentSectionIndex, variant)
    ) {
      currentSectionIndex--;
    }

    return currentSectionIndex;
  }

  private getFooterSourceSectionIndex(
    sectionIndex: number,
    variant: HeaderFooterVariant,
  ) {
    let currentSectionIndex = sectionIndex;

    while (
      currentSectionIndex > 0 &&
      this.getFooterVariantLinkedToPrevious(currentSectionIndex, variant)
    ) {
      currentSectionIndex--;
    }

    return currentSectionIndex;
  }

  private getSectionBreakPageNumbers() {
    const sectionBreakPageNumbers: number[] = [];
    let fallbackPageNumber = 1;

    for (const element of this.staff.elements) {
      if (element.pageBreak && element.sectionBreak) {
        sectionBreakPageNumbers.push(
          element.page > 0 ? element.page : fallbackPageNumber,
        );
      }

      if (element.pageBreak) {
        fallbackPageNumber++;
      }
    }

    return sectionBreakPageNumbers;
  }

  private getHeaderDifferentFirstPageForSection(sectionIndex: number) {
    if (sectionIndex === 0) {
      return this.pageSetup.headerDifferentFirstPage;
    }

    return (
      this.getExplicitSection(sectionIndex)?.headerDifferentFirstPage === true
    );
  }

  private getActiveVariantForPage(
    physicalPageNumber: number,
    pageNumberInSection: number,
    sectionIndex: number,
  ): HeaderFooterVariant {
    if (
      this.getHeaderDifferentFirstPageForSection(sectionIndex) &&
      pageNumberInSection === 1
    ) {
      return 'firstPage';
    }

    if (this.pageSetup.headerDifferentOddEven && physicalPageNumber % 2 === 0) {
      return 'even';
    }

    if (this.pageSetup.headerDifferentOddEven && physicalPageNumber % 2 !== 0) {
      return 'odd';
    }

    return 'default';
  }

  private getHeaderVariantLinkedToPrevious(
    sectionIndex: number,
    variant: HeaderFooterVariant,
  ) {
    if (sectionIndex <= 0) {
      return false;
    }

    return this.getExplicitSection(sectionIndex)?.headerLinks[variant] === true;
  }

  private getFooterVariantLinkedToPrevious(
    sectionIndex: number,
    variant: HeaderFooterVariant,
  ) {
    if (sectionIndex <= 0) {
      return false;
    }

    return this.getExplicitSection(sectionIndex)?.footerLinks[variant] === true;
  }
}
