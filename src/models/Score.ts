import { Footer } from './Footer';
import { Header } from './Header';
import { HeaderFooterType } from './HeaderFooterType';
import { PageSetup } from './PageSetup';
import { Staff } from './Staff';

export class Score {
  public pageSetup: PageSetup = new PageSetup();
  public headers: Header[] = [];
  public footers: Footer[] = [];
  public staff: Staff = new Staff();

  getHeaderForPage(pageNumber: number) {
    let header: Header | undefined;

    if (this.pageSetup.headerDifferentFirstPage && pageNumber === 1) {
      header = this.headers.find((x) => x.type === HeaderFooterType.FirstPage);
    } else if (this.pageSetup.headerDifferentOddEven && pageNumber % 2 === 0) {
      header = this.headers.find((x) => x.type === HeaderFooterType.Even);
    } else if (this.pageSetup.headerDifferentOddEven && pageNumber % 2 !== 0) {
      header = this.headers.find((x) => x.type === HeaderFooterType.Odd);
    } else {
      header = this.headers.find((x) => x.type === HeaderFooterType.Default);
    }

    return header;
  }

  getFooterForPage(pageNumber: number) {
    let footer: Footer;

    if (this.pageSetup.headerDifferentFirstPage && pageNumber === 1) {
      footer = this.footers.find((x) => x.type === HeaderFooterType.FirstPage)!;
    } else if (this.pageSetup.headerDifferentOddEven && pageNumber % 2 === 0) {
      footer = this.footers.find((x) => x.type === HeaderFooterType.Even)!;
    } else if (this.pageSetup.headerDifferentOddEven && pageNumber % 2 !== 0) {
      footer = this.footers.find((x) => x.type === HeaderFooterType.Odd)!;
    } else {
      footer = this.footers.find((x) => x.type === HeaderFooterType.Default)!;
    }

    return footer;
  }
}
