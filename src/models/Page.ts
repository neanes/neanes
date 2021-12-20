import { ScoreElement } from '@/models/Element';

export interface Page {
  lines: Line[];
}

export interface Line {
  elements: ScoreElement[];
}
