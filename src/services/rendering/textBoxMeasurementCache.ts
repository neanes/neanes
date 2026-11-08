import {
  ElementType,
  RichTextBoxElement,
  type ScoreElement,
  TextBoxAlignment,
} from '@/models/Element';
import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import { replaceTokens, type TokenMetadata } from '@/utils/replaceTokens';

import { getPrintPageMetadata } from './printPageMetadata';
import {
  getResizableTextBoxes,
  type MeasuredTextBox,
  richTextBoxHeightCap,
  type TextBoxHeightMeasurement,
} from './textBoxMeasurement';

function activeContent(box: MeasuredTextBox) {
  return box.multipanel
    ? [box.contentLeft, box.contentCenter, box.contentRight]
    : [box.content];
}

function getMeasurementContexts(workspace: Workspace, pages?: Page[]) {
  const { score } = workspace;
  const resizable = getResizableTextBoxes(score);
  if (pages === undefined) {
    return new Map(resizable.map((box) => [box, new Set<string>()]));
  }

  const boxes = new Set<ScoreElement>(resizable);
  const contexts = new Map<MeasuredTextBox, Set<string>>();
  function add(element: ScoreElement, metadata?: TokenMetadata) {
    if (!boxes.has(element)) {
      return;
    }
    const box = element as MeasuredTextBox;
    const variants = contexts.get(box) ?? new Set<string>();
    if (metadata !== undefined) {
      const content = activeContent(box);
      if (content.some((html) => html.includes('$'))) {
        const alignments = box.multipanel
          ? [
              TextBoxAlignment.Left,
              TextBoxAlignment.Center,
              TextBoxAlignment.Right,
            ]
          : [
              box instanceof RichTextBoxElement
                ? TextBoxAlignment.Center
                : box.computedAlignment,
            ];
        variants.add(
          JSON.stringify(
            content.map((html, index) =>
              replaceTokens(html, metadata, alignments[index]),
            ),
          ),
        );
      }
    }
    contexts.set(box, variants);
  }

  const metadata = getPrintPageMetadata(workspace, pages);
  const staff = new Set(score.staff.elements);
  for (const [index, page] of pages.entries()) {
    const context = metadata[index];
    const pageNumber = page.physicalPageNumber;
    if (score.pageSetup.showHeader) {
      add(
        score.getHeaderForPage(pageNumber, context.isChapterOpening)
          .elements[0],
        context,
      );
    }
    for (const line of page.allLines) {
      for (const element of line.elements) {
        add(
          element,
          element.elementType === ElementType.TextBox && staff.has(element)
            ? context
            : undefined,
        );
      }
    }
    if (score.pageSetup.showFooter) {
      add(
        score.getFooterForPage(pageNumber, context.isChapterOpening)
          .elements[0],
        context,
      );
    }
  }
  return contexts;
}

function boxStyleAndContent(box: MeasuredTextBox, richTextStyle: string) {
  return JSON.stringify([
    box.elementType,
    box.multipanel,
    activeContent(box),
    box instanceof RichTextBoxElement
      ? [richTextStyle, box.languageCode, box.textDirection]
      : [
          box.minHeight,
          box.computedAlignment,
          box.computedFontFamily,
          box.computedFontSize,
          box.computedFontWeight,
          box.computedFontStyle,
          box.computedLineHeight,
          box.computedFontVariantCaps,
          box.computedFontVariantNumeric,
          box.computedFontVariantLigatures,
          box.computedFontVariantAlternates,
        ],
  ]);
}

type CachedBox = {
  content: string;
  heights: Map<string, number>;
};

// Keep raw measurements, separate from any height floors or breaks used
// to make a particular pagination trial converge.
export class TextBoxMeasurementCache {
  private boxes = new WeakMap<ScoreElement, CachedBox>();

  clear() {
    this.boxes = new WeakMap();
  }

  async measure(
    workspace: Workspace,
    pages: Page[] | undefined,
    originals: ReadonlyMap<ScoreElement, ScoreElement>,
    editor: { fonts: string[]; language: string },
    measureMissing: (
      boxes: ReadonlySet<MeasuredTextBox>,
    ) => Promise<TextBoxHeightMeasurement[]>,
    isCurrent: () => boolean,
  ) {
    const { score } = workspace;
    const { pageSetup } = score;
    const richTextStyle = JSON.stringify([
      editor,
      pageSetup.neumeDefaultFontFamily,
      pageSetup.melkiteRtl,
      pageSetup.numerals,
      score.paragraphStyles,
    ]);
    const footnoteBoxes = new Set(
      score.footnotes.flatMap((footnote) => footnote.staff.elements),
    );
    const cached: TextBoxHeightMeasurement[] = [];
    const missing = new Map<
      MeasuredTextBox,
      { entry: CachedBox; key: string }
    >();

    for (const [box, contexts] of getMeasurementContexts(workspace, pages)) {
      const original = originals.get(box)!;
      const content = boxStyleAndContent(box, richTextStyle);
      let entry = this.boxes.get(original);
      if (entry?.content !== content) {
        entry = { content, heights: new Map() };
        this.boxes.set(original, entry);
      }
      const footnoteBody = footnoteBoxes.has(box);
      const key = JSON.stringify([
        pages !== undefined,
        box.width,
        [...contexts].sort(),
        box instanceof RichTextBoxElement
          ? [
              richTextBoxHeightCap(box, pageSetup, footnoteBody, box.y),
              footnoteBody,
              Object.keys(box.footnoteMarkers)
                .sort()
                .map((id) => [id, box.footnoteMarkers[id].width]),
            ]
          : null,
      ]);
      const height = entry.heights.get(key);
      if (height === undefined) {
        missing.set(box, { entry, key });
      } else {
        cached.push({ element: box, width: box.width, height });
      }
    }

    if (missing.size === 0) {
      return cached;
    }
    const fresh = await measureMissing(new Set(missing.keys()));
    if (!isCurrent()) {
      throw new Error('LAYOUT_MEASUREMENT_STALE');
    }
    // Repeated templates can have multiple measured heights. Reconciliation
    // uses their maximum, so that is the value to reuse for this set of pages.
    const heights = new Map<MeasuredTextBox, number>();
    for (const { element, width, height } of fresh) {
      if (element.width === width) {
        heights.set(element, Math.max(heights.get(element) ?? 0, height));
      }
    }
    for (const [box, height] of heights) {
      const { entry, key } = missing.get(box)!;
      // Bound the variants retained for moving boxes and changing labels.
      if (entry.heights.size >= 16) {
        entry.heights.delete(entry.heights.keys().next().value!);
      }
      entry.heights.set(key, height);
    }
    return [...cached, ...fresh];
  }
}
