import { EmptyElement, ScoreElement } from '@/models/save/v1/Element';

import { Footers } from './Footers';
import { Headers } from './Headers';
import { PageSetup } from './PageSetup';

const ScoreVersion: string = '1.1';

export { ScoreVersion };

export class Score {
  public version: string = ScoreVersion;
  public appVersion: string = APP_VERSION;
  public pageSetup: PageSetup = new PageSetup();
  public headers: Headers = new Headers();
  public footers: Footers = new Footers();
  public staff: Staff = new Staff();
}

export class Staff {
  public elements: ScoreElement[] = [new EmptyElement()];
  public lyrics: LyricSetup = new LyricSetup();
}

export class LyricSetup {
  public locked: boolean | undefined = undefined;
  public text: string = '';
}
