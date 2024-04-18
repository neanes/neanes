import { EmptyElement, ScoreElement } from './Element';
import { LyricSetup } from './LyricSetup';

export class Staff {
  public elements: ScoreElement[] = [new EmptyElement()];
  public lyrics: LyricSetup = new LyricSetup();
}
