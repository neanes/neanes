import type { Score } from '@/models/Score';

import type {
  MeasuredTextBox,
  TextBoxHeightMeasurement,
} from './textBoxMeasurement';

// Reconcile detached page layout with measured text-box heights.
export class LayoutReconciliation {
  private pass = 0;
  private headerFooterHeights = new Map<MeasuredTextBox, number>();

  apply(score: Score, heights: TextBoxHeightMeasurement[]) {
    const headersAndFooters = new Set(score.headersAndFooters);
    const measured = new Map<MeasuredTextBox, number>();
    for (const { element, height } of heights) {
      measured.set(element, Math.max(measured.get(element) ?? 0, height));
    }
    let changed = false;
    for (const [element, measuredHeight] of measured) {
      // Page-specific tokens can make one template a different height on each
      // page. Keep its largest observed height to avoid pagination cycles.
      const height = headersAndFooters.has(element)
        ? Math.max(this.headerFooterHeights.get(element) ?? 0, measuredHeight)
        : measuredHeight;
      if (headersAndFooters.has(element)) {
        this.headerFooterHeights.set(element, height);
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
