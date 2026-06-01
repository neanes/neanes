import type { ScoreElement } from './Element';
import { EmptyElement } from './Element';
import { LyricSetup } from './LyricSetup';

export class Staff {
  public elements: ScoreElement[] = [new EmptyElement()];
  public lyrics: LyricSetup = new LyricSetup();
}
