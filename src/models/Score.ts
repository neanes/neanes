import { Footer } from './Footer';
import { Header } from './Header';
import { PageSetup } from './PageSetup';
import { Staff } from './Staff';

export class Score {
  public pageSetup: PageSetup = new PageSetup();
  public headers: Header[] = [];
  public footers: Footer[] = [];
  public staff: Staff = new Staff();
}
