import type { Page } from '@/models/Page';
import { assignMissingElementIds, type Workspace } from '@/models/Workspace';
import { LayoutService } from '@/services/LayoutService';

import { detachLayout } from './detachLayout';
import {
  compareLayouts,
  createLayoutVerificationState,
  type LayoutVerificationState,
  recordLayoutVerification,
} from './layoutVerification';

declare global {
  interface Window {
    __neanesLayoutVerify?: LayoutVerificationState;
    __neanesParagraphCache?: { reused: number; rebuilt: number };
  }
}

export const layoutVerificationEnabled =
  import.meta.env.VITE_LAYOUT_VERIFY_ENABLED === 'true';

// Dev-only oracle. Call before the editor's layout with the raw workspace,
// then pass the editor's pages to the returned function. It lays out a copy
// of the pre-layout input from scratch and records any difference on
// `window.__neanesLayoutVerify`. Starting both layouts from the same state
// keeps `updated` and the saved previous-state fields comparable.
export function beginLayoutVerification(
  workspace: Workspace,
  options: Parameters<typeof LayoutService.processPages>[1],
) {
  // Layout assigns ids from the workspace counter, which a copy does not
  // share. Assign them once here so both layouts see the same ids.
  assignMissingElementIds(workspace);
  const detached = detachLayout(workspace);
  return (actualPages: Page[]) => {
    const expectedPages = LayoutService.processPages(
      detached.workspace,
      options,
    );
    const score = workspace.score;
    const result = compareLayouts(
      actualPages,
      expectedPages,
      [
        ...score.staves.flatMap((staff) => staff.elements),
        ...score.headersAndFooters,
      ],
      detached.copies,
    );
    window.__neanesLayoutVerify = recordLayoutVerification(
      window.__neanesLayoutVerify ?? createLayoutVerificationState(),
      result,
    );
    if (result !== null) {
      console.error('Layout verification failed', result);
    }
  };
}
