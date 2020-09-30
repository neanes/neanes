import { Element } from '@/models/Element';

export interface Page {
    lines: Line[];
}

export interface Line {
    elements: Element[];
}