import { Footer } from './Footer';
import { Footers } from './Footers';
import { Header } from './Header';
import { Headers } from './Headers';
import { PageSetup } from './PageSetup';
import { Staff } from './Staff';

export class Score {
  public pageSetup: PageSetup = new PageSetup();
  public headers: Headers = new Headers();
  public footers: Footers = new Footers();
  public staff: Staff = new Staff();

  public get headersAndFooters() {
    return [
      ...this.headers.default.elements,
      ...this.headers.even.elements,
      ...this.headers.firstPage.elements,
      ...this.headers.odd.elements,
      ...this.footers.default.elements,
      ...this.footers.even.elements,
      ...this.footers.firstPage.elements,
      ...this.footers.odd.elements,
    ];
  }

  getHeaderForPage(pageNumber: number) {
    let header: Header;

    if (this.pageSetup.headerDifferentFirstPage && pageNumber === 1) {
      header = this.headers.firstPage;
    } else if (this.pageSetup.headerDifferentOddEven && pageNumber % 2 === 0) {
      header = this.headers.even;
    } else if (this.pageSetup.headerDifferentOddEven && pageNumber % 2 !== 0) {
      header = this.headers.odd;
    } else {
      header = this.headers.default;
    }

    return header;
  }

  getFooterForPage(pageNumber: number) {
    let footer: Footer;

    if (this.pageSetup.headerDifferentFirstPage && pageNumber === 1) {
      footer = this.footers.firstPage;
    } else if (this.pageSetup.headerDifferentOddEven && pageNumber % 2 === 0) {
      footer = this.footers.even;
    } else if (this.pageSetup.headerDifferentOddEven && pageNumber % 2 !== 0) {
      footer = this.footers.odd;
    } else {
      footer = this.footers.default;
    }

    return footer;
  }
}
