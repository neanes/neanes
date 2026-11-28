import type { ScoreElement } from './Element';
import { LyricSetup } from './LyricSetup';

export class Staff {
  public elements: ScoreElement[] = [];
  public lyrics: LyricSetup = new LyricSetup();
}
