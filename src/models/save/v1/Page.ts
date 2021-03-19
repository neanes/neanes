import { ScoreElement } from '@/models/save/v1/Element';

export interface Page {
    lines: Line[];
}

export interface Line {
    elements: ScoreElement[];
}