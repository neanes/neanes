import {
  ElementType,
  type RichTextBoxElement,
  type TextBoxElement,
} from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import type { Score } from '@/models/Score';

export type MeasuredTextBox = TextBoxElement | RichTextBoxElement;
export interface TextBoxHeightMeasurement {
  element: MeasuredTextBox;
  // Assigned layout width used to render this measurement.
  width: number;
  height: number;
}

export function getResizableTextBoxes(score: Score): MeasuredTextBox[] {
  const headers = score.pageSetup.showHeader
    ? Object.values(score.headers).flatMap((header) => header.elements)
    : [];
  const footers = score.pageSetup.showFooter
    ? Object.values(score.footers).flatMap((footer) => footer.elements)
    : [];
  return [
    ...score.staves.flatMap((staff) => staff.elements),
    ...headers,
    ...footers,
  ].filter(
    (element): element is MeasuredTextBox =>
      (element.elementType === ElementType.RichTextBox &&
        !(element as RichTextBoxElement).inline) ||
      (element.elementType === ElementType.TextBox &&
        !(element as TextBoxElement).inline &&
        (element as TextBoxElement).customHeight == null),
  );
}

export function richTextBoxHeightCap(
  box: Pick<RichTextBoxElement, 'scrollable' | 'multipanel' | 'inline'>,
  pageSetup: PageSetup,
  footnoteBody: boolean,
  y: number,
) {
  return box.scrollable && !box.multipanel && !box.inline && !footnoteBody
    ? pageSetup.pageHeight - y - pageSetup.bottomMargin
    : undefined;
}
