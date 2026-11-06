import { RichTextBoxElement } from '@/models/Element';
import type { LayoutDiagnosticsOptions } from '@/models/LayoutDiagnostics';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { elementFootnoteIds } from '@/services/FootnoteReferences';
import { LayoutService } from '@/services/LayoutService';

import { LayoutReconciliation } from './layoutReconciliation';
import {
  getResizableTextBoxes,
  type TextBoxHeightMeasurement,
} from './textBoxMeasurement';

const markerTrialLimit = 3;

export function needsFootnoteSlotSettlement(score: Score) {
  if (score.pageSetup.footnoteNumbering !== 'page') {
    return false;
  }
  const automatic = new Set(
    score.footnotes
      .filter((body) => body.marker === null)
      .map((body) => body.id),
  );
  return (
    automatic.size > 0 &&
    score.staff.elements.some(
      (element) =>
        element instanceof RichTextBoxElement &&
        elementFootnoteIds(element).some((id) => automatic.has(id)),
    )
  );
}

export class WorkspaceLayoutSettlement {
  private readonly heights = new LayoutReconciliation();
  private slots: Map<string, number> | undefined;
  private markerTrial = 0;
  private readonly score: Score;

  constructor(private readonly workspace: Workspace) {
    this.score = workspace.score;
    if (needsFootnoteSlotSettlement(this.score)) {
      this.slots = new Map();
      this.markerTrial = 1;
      // Eligible scores start from the same geometry after edits and on reopen.
      for (const box of getResizableTextBoxes(this.score)) {
        box.height = 0;
      }
    }
  }

  get usesFootnoteTrials() {
    return this.markerTrial > 0;
  }

  get footnoteSlots(): ReadonlyMap<string, number> | undefined {
    return this.slots;
  }

  paginate(options?: LayoutDiagnosticsOptions) {
    return LayoutService.processPages(this.workspace, {
      ...options,
      footnoteSlots: this.slots,
    });
  }

  advance(measured: TextBoxHeightMeasurement[]) {
    // Finish reconciling wrapping and page-position height caps before using
    // page ordinals to grow slots. All trials share the height retry budget.
    if (this.heights.apply(this.score, measured)) {
      return true;
    }
    if (this.slots === undefined) {
      return false;
    }

    const required = LayoutService.requiredFootnoteSlots(this.score);
    const grownBoxes: RichTextBoxElement[] = [];
    for (const box of this.score.staff.elements) {
      if (!(box instanceof RichTextBoxElement)) {
        continue;
      }
      let grew = false;
      for (const [id, { width }] of Object.entries(box.footnoteMarkers)) {
        const next = Math.max(width, required.get(id)!);
        this.slots.set(id, next);
        grew ||= next > width;
      }
      if (grew) {
        grownBoxes.push(box);
      }
    }
    if (grownBoxes.length === 0) {
      return false;
    }
    if (this.markerTrial === markerTrialLimit) {
      this.slots = undefined;
      this.heights.resetPageCaps();
    } else {
      this.markerTrial++;
      this.heights.resetPageCaps(grownBoxes);
    }
    return true;
  }
}
