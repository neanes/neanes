import type { Score } from '@/models/Score';

import {
  layoutReservations,
  reserveMeasuredTextBoxHeight,
} from './layoutReservations';
import type {
  MeasuredTextBox,
  TextBoxHeightMeasurement,
} from './textBoxMeasurement';

// Reconcile detached page layout with measured text-box heights.
export class LayoutReconciliation {
  private pass = 0;

  apply(score: Score, heights: TextBoxHeightMeasurement[]) {
    const measured = new Map<MeasuredTextBox, number>();
    const reservations = layoutReservations(score);
    let changed = reservations?.pending ?? false;
    for (const measurement of heights) {
      const height = reserveMeasuredTextBoxHeight(measurement);
      if (height === null) {
        changed = true;
      } else {
        measured.set(
          measurement.element,
          Math.max(measured.get(measurement.element) ?? 0, height),
        );
      }
    }
    for (const [element, measuredHeight] of measured) {
      if (Math.abs(element.height - measuredHeight) > 0.01) {
        element.height = measuredHeight;
        changed = true;
      }
    }
    if (changed && ++this.pass >= 12) {
      throw new Error('LAYOUT_DID_NOT_SETTLE');
    }
    return changed;
  }
}
