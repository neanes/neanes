import type { Workspace } from '@/models/Workspace';
import { LayoutService } from '@/services/LayoutService';

import { WorkspaceLayoutSettlement } from './layoutReconciliation';
import type { TextBoxHeightMeasurement } from './textBoxMeasurement';

export async function settleWorkspace(
  workspace: Workspace,
  measure: () => Promise<TextBoxHeightMeasurement[]>,
) {
  const settlement = new WorkspaceLayoutSettlement(workspace);
  while (true) {
    LayoutService.processPages(workspace);
    const heights = await measure();
    if (!settlement.apply(heights)) {
      return;
    }
  }
}
