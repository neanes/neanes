import { toRaw } from 'vue';

import { ElementType, type RichTextBoxElement } from '@/models/Element';
import type { Score } from '@/models/Score';

import type {
  MeasuredTextBox,
  TextBoxHeightMeasurement,
} from './textBoxMeasurement';

// Reconcile detached page layout with measured text-box heights.
export class LayoutReconciliation {
  private pass = 0;
  private readonly headerFooterHeights = new Map<MeasuredTextBox, number>();
  private readonly pageCappedHeights = new Map<
    MeasuredTextBox,
    { width: number; height: number }
  >();

  resetPageCaps(boxes?: MeasuredTextBox[]) {
    if (boxes === undefined) {
      this.pageCappedHeights.clear();
    } else {
      for (const box of boxes) {
        this.pageCappedHeights.delete(toRaw(box));
      }
    }
  }

  apply(score: Score, heights: TextBoxHeightMeasurement[]) {
    if (
      heights.some(
        ({ element, width }) => Math.abs(element.width - width) > 0.01,
      )
    ) {
      throw new Error('LAYOUT_MEASUREMENT_STALE');
    }

    const headersAndFooters = new Set(score.headersAndFooters.map(toRaw));
    const mainScoreElements =
      score.footnotes.length > 0
        ? new Set(score.staff.elements.map(toRaw))
        : null;
    const measured = new Map<MeasuredTextBox, number>();
    for (const { element, height } of heights) {
      measured.set(element, Math.max(measured.get(element) ?? 0, height));
    }
    let changed = false;
    for (const [element, measuredHeight] of measured) {
      const key = toRaw(element);
      let height = measuredHeight;
      if (headersAndFooters.has(key)) {
        // Page-specific tokens can change the height of a repeated template.
        height = Math.max(this.headerFooterHeights.get(key) ?? 0, height);
        this.headerFooterHeights.set(key, height);
      } else if (
        mainScoreElements?.has(key) &&
        element.elementType === ElementType.RichTextBox &&
        !(element as RichTextBoxElement).inline &&
        !(element as RichTextBoxElement).multipanel
      ) {
        // Repagination changes the vertical cap. Keep the largest height at
        // this width so a smaller cap cannot move the box back again.
        const { width } = element;
        const previous = this.pageCappedHeights.get(key);
        if (previous && Math.abs(previous.width - width) <= 0.01) {
          height = Math.max(previous.height, height);
        }
        this.pageCappedHeights.set(key, { width, height });
      }
      if (Math.abs(element.height - height) > 0.01) {
        element.height = height;
        changed = true;
      }
    }
    if (changed && ++this.pass >= 12) {
      throw new Error('LAYOUT_DID_NOT_SETTLE');
    }
    return changed;
  }
}
