import type { Workspace } from '@/models/Workspace';
import { LayoutService } from '@/services/LayoutService';

import { LayoutReconciliation } from './layoutReconciliation';
import { beginLayoutOperation } from './layoutReservations';
import type { TextBoxHeightMeasurement } from './textBoxMeasurement';

export async function settleWorkspace(
  workspace: Workspace,
  measure: () => Promise<TextBoxHeightMeasurement[]>,
) {
  const operation = beginLayoutOperation(workspace, true);
  const reconciliation = new LayoutReconciliation();
  while (true) {
    LayoutService.processPages(workspace);
    const heights = await measure();
    if (beginLayoutOperation(workspace) !== operation) {
      throw new Error('LAYOUT_OPERATION_SUPERSEDED');
    }
    if (!reconciliation.apply(workspace.score, heights)) {
      return;
    }
  }
}
