import { Footers } from './Footers';
import { Headers } from './Headers';

export class ScoreSectionHeaderFooterLinks {
  public default: boolean | undefined = undefined;
  public odd: boolean | undefined = undefined;
  public even: boolean | undefined = undefined;
  public firstPage: boolean | undefined = undefined;
}

export class ScoreSection {
  public headers: Headers = new Headers();
  public footers: Footers = new Footers();
  public headerDifferentFirstPage: boolean | undefined = undefined;
  public headerLinks: ScoreSectionHeaderFooterLinks | undefined = undefined;
  public footerLinks: ScoreSectionHeaderFooterLinks | undefined = undefined;
}
