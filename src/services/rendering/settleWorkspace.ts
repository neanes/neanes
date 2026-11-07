import type { Workspace } from '@/models/Workspace';
import { LayoutService } from '@/services/LayoutService';

import { LayoutReconciliation } from './layoutReconciliation';
import {
  getResizableTextBoxes,
  type TextBoxHeightMeasurement,
} from './textBoxMeasurement';

export async function settleWorkspace(
  workspace: Workspace,
  measure: () => Promise<TextBoxHeightMeasurement[]>,
) {
  const { score, contentRevision } = workspace;
  const reconciliation = new LayoutReconciliation();
  LayoutService.processPages(workspace);
  if (getResizableTextBoxes(score).length === 0) {
    return;
  }
  while (true) {
    const heights = await measure();
    if (
      workspace.score !== score ||
      workspace.contentRevision !== contentRevision
    ) {
      throw new Error('LAYOUT_MEASUREMENT_STALE');
    }
    if (!reconciliation.apply(score, heights)) {
      return;
    }
    LayoutService.processPages(workspace);
  }
}
