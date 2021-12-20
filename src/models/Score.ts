import { ScoreElement, EmptyElement } from '@/models/Element';
import { PageSetup } from './PageSetup';

export class Score {
  public pageSetup: PageSetup = new PageSetup();
  public staff: Staff = new Staff();
}

export class Staff {
  public elements: ScoreElement[] = [new EmptyElement()];
}
