import {
  ElementType,
  type RichTextBoxElement,
  type TextBoxElement,
} from '@/models/Element';
import type { Score } from '@/models/Score';

export type MeasuredTextBox = TextBoxElement | RichTextBoxElement;
export interface TextBoxHeightMeasurement {
  element: MeasuredTextBox;
  height: number;
}

export function getResizableTextBoxes(score: Score): MeasuredTextBox[] {
  const headers = score.pageSetup.showHeader
    ? Object.values(score.headers).flatMap((header) => header.elements)
    : [];
  const footers = score.pageSetup.showFooter
    ? Object.values(score.footers).flatMap((footer) => footer.elements)
    : [];
  return [...score.staff.elements, ...headers, ...footers].filter(
    (element): element is MeasuredTextBox =>
      (element.elementType === ElementType.RichTextBox &&
        !(element as RichTextBoxElement).inline) ||
      (element.elementType === ElementType.TextBox &&
        !(element as TextBoxElement).inline &&
        (element as TextBoxElement).customHeight == null),
  );
}
