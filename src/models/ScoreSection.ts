import { Footers } from './Footers';
import { Headers } from './Headers';

export class ScoreSectionHeaderFooterLinks {
  public default = true;
  public odd = true;
  public even = true;
  public firstPage = true;
}

export class ScoreSection {
  public headers: Headers = new Headers();
  public footers: Footers = new Footers();
  public headerLinks: ScoreSectionHeaderFooterLinks =
    new ScoreSectionHeaderFooterLinks();
  public footerLinks: ScoreSectionHeaderFooterLinks =
    new ScoreSectionHeaderFooterLinks();
  public headerDifferentFirstPage = false;
}
