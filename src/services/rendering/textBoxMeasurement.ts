import {
  ElementType,
  RichTextBoxElement,
  type ScoreElement,
  TextBoxAlignment,
  type TextBoxElement,
} from '@/models/Element';
import type { Page } from '@/models/Page';
import type { PageSetup } from '@/models/PageSetup';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { replaceTokens, type TokenMetadata } from '@/utils/replaceTokens';

import { getPrintPageMetadata } from './printPageMetadata';

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

// Visits every element on the pages, with the token metadata that print
// rendering gives it. Headers, footers and main-staff plain text boxes are
// rendered with page-specific tokens; other elements are not.
function forEachPageElement(
  workspace: Workspace,
  pages: Page[],
  visit: (element: ScoreElement, metadata: TokenMetadata | undefined) => void,
) {
  const { score } = workspace;
  const metadata = getPrintPageMetadata(workspace, pages);
  const staff = new Set(score.staff.elements);
  for (const [index, page] of pages.entries()) {
    const context = metadata[index];
    const pageNumber = page.physicalPageNumber;
    if (score.pageSetup.showHeader) {
      visit(
        score.getHeaderForPage(pageNumber, context.isChapterOpening)
          .elements[0],
        context,
      );
    }
    for (const line of page.allLines) {
      for (const element of line.elements) {
        visit(
          element,
          element.elementType === ElementType.TextBox && staff.has(element)
            ? context
            : undefined,
        );
      }
    }
    if (score.pageSetup.showFooter) {
      visit(
        score.getFooterForPage(pageNumber, context.isChapterOpening)
          .elements[0],
        context,
      );
    }
  }
}

export function activeTextBoxContent(box: MeasuredTextBox) {
  return box.multipanel
    ? [box.contentLeft, box.contentCenter, box.contentRight]
    : [box.content];
}

// The content a box displays with these tokens, or undefined when the tokens
// do not change it.
function tokenizedTextBoxContent(
  box: MeasuredTextBox,
  metadata: TokenMetadata | undefined,
) {
  const content = activeTextBoxContent(box);
  if (metadata === undefined || !content.some((html) => html.includes('$'))) {
    return undefined;
  }
  const alignments = box.multipanel
    ? [TextBoxAlignment.Left, TextBoxAlignment.Center, TextBoxAlignment.Right]
    : [
        box instanceof RichTextBoxElement
          ? TextBoxAlignment.Center
          : box.computedAlignment,
      ];
  return JSON.stringify(
    content.map((html, index) =>
      replaceTokens(html, metadata, alignments[index]),
    ),
  );
}

// Each target box on the pages, with the token metadata for each distinct
// content it displays there. The undefined key is content the tokens do not
// change.
export function getTextBoxVariants(
  workspace: Workspace,
  pages: Page[],
  targets: ReadonlySet<ScoreElement>,
) {
  const variants = new Map<
    MeasuredTextBox,
    Map<string | undefined, TokenMetadata | undefined>
  >();
  forEachPageElement(workspace, pages, (element, metadata) => {
    if (!targets.has(element)) {
      return;
    }
    const box = element as MeasuredTextBox;
    const boxVariants = variants.get(box) ?? new Map();
    variants.set(box, boxVariants);
    const variant = tokenizedTextBoxContent(box, metadata);
    if (!boxVariants.has(variant)) {
      boxVariants.set(variant, metadata);
    }
  });
  return variants;
}
