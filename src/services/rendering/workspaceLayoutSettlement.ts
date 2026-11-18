import { toRaw } from 'vue';

import { RichTextBoxElement, type ScoreElement } from '@/models/Element';
import type { LayoutDiagnosticsOptions } from '@/models/LayoutDiagnostics';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { automaticFootnoteMarker } from '@/services/FootnoteMarker';
import { elementFootnoteIds } from '@/services/FootnoteReferences';
import { LayoutService } from '@/services/LayoutService';

import { LayoutReconciliation } from './layoutReconciliation';
import {
  getResizableTextBoxes,
  type TextBoxHeightMeasurement,
} from './textBoxMeasurement';

export function needsFootnoteSettlement(score: Score) {
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
  private readonly breaksBefore = new Set<ScoreElement>();
  private readonly markerWidths = new Map<string, number>();
  private readonly heightChanges = new Map<ScoreElement, number>();
  private readonly score: Score;
  private provisional: boolean;
  private changedPasses = 0;
  readonly usesFootnoteTrials: boolean;

  constructor(private readonly workspace: Workspace) {
    this.score = workspace.score;
    this.provisional = this.usesFootnoteTrials = needsFootnoteSettlement(
      this.score,
    );
    if (this.usesFootnoteTrials) {
      // Eligible scores start from the same geometry after edits and on reopen.
      for (const box of getResizableTextBoxes(this.score)) {
        box.height = 0;
      }
    }
  }

  paginate(options?: LayoutDiagnosticsOptions) {
    const previousPages = this.heightChanges.size
      ? new Map(
          this.score.staff.elements.map((element) => [
            toRaw(element),
            element.page,
          ]),
        )
      : undefined;
    const pages = LayoutService.processPages(this.workspace, {
      ...options,
      provisionalFootnoteWidths: this.provisional,
      breaksBefore: this.breaksBefore,
      onOverflowBreak: previousPages
        ? (boundary, elements, excess) => {
            const previousPage = previousPages.get(toRaw(boundary));
            // A box arriving from another page can still have the height of
            // its old label. Do not use that growth to retain a break here.
            const growth = elements.reduce((sum, element) => {
              const key = toRaw(element);
              return previousPages.get(key) === previousPage
                ? sum + (this.heightChanges.get(key) ?? 0)
                : sum;
            }, 0);
            if (growth >= excess) {
              this.breaksBefore.add(boundary);
            }
          }
        : undefined,
    });

    if (this.usesFootnoteTrials) {
      const changedBoxes: RichTextBoxElement[] = [];
      for (const box of this.score.staff.elements) {
        if (!(box instanceof RichTextBoxElement) || box.inline) {
          continue;
        }
        let changed = false;
        for (const [id, { width }] of Object.entries(box.footnoteMarkers)) {
          const previous = this.markerWidths.get(id);
          changed ||= previous !== undefined && previous !== width;
          this.markerWidths.set(id, width);
        }
        if (changed) {
          changedBoxes.push(box);
        }
      }
      // A new marker width can undo wrapping even at the same box width.
      this.heights.resetPageCaps(changedBoxes);
    }
    return pages;
  }

  advance(measured: TextBoxHeightMeasurement[]) {
    const previous = new Map<RichTextBoxElement, number>();
    if (this.usesFootnoteTrials && !this.provisional) {
      for (const { element } of measured) {
        if (
          element instanceof RichTextBoxElement &&
          Object.keys(element.footnoteMarkers).length > 0
        ) {
          previous.set(toRaw(element), element.height);
        }
      }
    }
    this.heightChanges.clear();
    if (this.heights.apply(this.score, measured)) {
      if (++this.changedPasses >= 12) {
        throw new Error('LAYOUT_DID_NOT_SETTLE');
      }
      for (const [element, height] of previous) {
        if (height !== element.height) {
          this.heightChanges.set(element, element.height - height);
        }
      }
      return true;
    }
    if (this.provisional) {
      // Start label-dependent measurement from settled provisional geometry.
      this.provisional = false;
      const { pageSetup, staff } = this.score;
      const startingLabel = automaticFootnoteMarker(
        pageSetup.firstFootnoteNumber,
        pageSetup,
      );
      const automaticIds = new Set(
        this.score.footnotes
          .filter((body) => body.marker === null)
          .map((body) => body.id),
      );
      // Pagination already assigned the labels. Matching starting labels
      // and custom markers were measured at their final widths.
      return staff.elements.some(
        (element) =>
          element instanceof RichTextBoxElement &&
          Object.entries(element.footnoteMarkers).some(
            ([id, { label }]) =>
              automaticIds.has(id) && label !== startingLabel,
          ),
      );
    }
    return false;
  }

  finish(): ReadonlySet<ScoreElement> {
    const boundaries = new Set(this.breaksBefore);
    this.breaksBefore.clear();
    return boundaries;
  }
}
