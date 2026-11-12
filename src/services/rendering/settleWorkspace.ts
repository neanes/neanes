import type { LayoutDiagnosticsOptions } from '@/models/LayoutDiagnostics';
import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';

import {
  getResizableTextBoxes,
  type TextBoxHeightMeasurement,
} from './textBoxMeasurement';
import { WorkspaceLayoutSettlement } from './workspaceLayoutSettlement';

export type LiveLayoutOutcome = 'settled' | 'deferred' | 'superseded';

export async function settleWorkspace(
  workspace: Workspace,
  measure: (templatePages?: Page[]) => Promise<TextBoxHeightMeasurement[]>,
  options?: LayoutDiagnosticsOptions,
) {
  const { score, contentRevision } = workspace;
  const settlement = new WorkspaceLayoutSettlement(workspace);
  const needsMeasurement = getResizableTextBoxes(score).length > 0;
  let pages = settlement.paginate(options);
  while (true) {
    // Repeated templates need page-specific tokens, just as in export.
    const templatePages =
      settlement.usesFootnoteTrials &&
      (score.pageSetup.showHeader || score.pageSetup.showFooter)
        ? pages.filter((page) => !page.isEmpty)
        : undefined;
    const heights = needsMeasurement ? await measure(templatePages) : [];
    if (
      workspace.score !== score ||
      workspace.contentRevision !== contentRevision
    ) {
      throw new Error('LAYOUT_MEASUREMENT_STALE');
    }
    if (!settlement.advance(heights)) {
      return { pages, breaksBefore: settlement.finish() };
    }
    pages = settlement.paginate(options);
  }
}
