import { ScoreElement } from '@/models/Element';

export interface Page {
  lines: Line[];

  isVisible: boolean;
}

export interface Line {
  elements: ScoreElement[];
}
