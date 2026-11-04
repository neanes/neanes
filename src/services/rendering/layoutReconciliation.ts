import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';

import {
  beginLayoutOperation,
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

// Both promise-driven workers and event-driven print renderers use the same
// explicit operation boundary, supersession check, and bounded reconciliation.
// Live editing retains its debounced callbacks and shares reservation storage.
export class WorkspaceLayoutSettlement {
  private readonly operation;
  private readonly reconciliation = new LayoutReconciliation();

  constructor(private readonly workspace: Workspace) {
    this.operation = beginLayoutOperation(workspace, true);
  }

  apply(heights: TextBoxHeightMeasurement[]) {
    if (beginLayoutOperation(this.workspace) !== this.operation) {
      throw new Error('LAYOUT_OPERATION_SUPERSEDED');
    }
    return this.reconciliation.apply(this.workspace.score, heights);
  }
}
