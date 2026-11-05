import { toRaw } from 'vue';

import type {
  RichTextBoxElement,
  ScoreElement,
  TextBoxElement,
} from '@/models/Element';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { elementFootnoteIds } from '@/services/FootnoteReferences';

import type { TextBoxHeightMeasurement } from './textBoxMeasurement';

// Transient dimensions belong to one content/font revision, never to the score file.
export class LayoutReservations {
  constructor(readonly hasFootnotes: boolean) {}

  pending = false;
  private readonly heights = new Map<
    ScoreElement,
    { width: number; height: number }
  >();
  readonly widths = new Map<ScoreElement, number>();

  releaseHeight(element: ScoreElement) {
    this.heights.delete(toRaw(element));
  }

  reserveHeight(element: ScoreElement, measured: number) {
    if (!this.hasFootnotes) {
      return measured;
    }
    element = toRaw(element);
    const previous = this.heights.get(element);
    // A height maximum is valid only at the width where it was measured.
    const height =
      previous !== undefined && Math.abs(previous.width - element.width) <= 0.01
        ? Math.max(previous.height, measured)
        : measured;
    this.heights.set(element, { width: element.width, height });
    return height;
  }

  reserveWidth(element: ScoreElement, width: number) {
    const reserved = Math.max(this.widths.get(element) ?? 0, width);
    this.widths.set(element, reserved);
    return reserved;
  }
}

const states = new WeakMap<Score, { key: string; state: LayoutReservations }>();
const owners = new WeakMap<ScoreElement, LayoutReservations>();
let fontRevision = 0;
export function invalidateLayoutFonts() {
  fontRevision++;
}

export function beginLayoutOperation(workspace: Workspace, fresh = false) {
  const score = toRaw(workspace.score);
  const hasFootnotes = score.footnotes.length > 0;
  const key = JSON.stringify([
    workspace.contentRevision,
    fontRevision,
    score.pageSetup,
    score.paragraphStyles,
    hasFootnotes,
  ]);
  let entry = states.get(score);
  if (fresh || entry?.key !== key) {
    entry = { key, state: new LayoutReservations(hasFootnotes) };
    states.set(score, entry);
    for (const element of [
      ...score.staves.flatMap((staff) => staff.elements),
      ...score.headersAndFooters,
    ]) {
      owners.set(toRaw(element), entry.state);
    }
  }
  return entry!.state;
}

export function layoutReservations(score: Score) {
  return states.get(toRaw(score))?.state;
}

export function reserveInlineWidth(element: ScoreElement, width: number) {
  if (elementFootnoteIds(element).length === 0) {
    return width;
  }
  return (
    owners.get(toRaw(element))?.reserveWidth(toRaw(element), width) ?? width
  );
}

export function reserveTextBoxHeight(element: ScoreElement, measured: number) {
  return (
    owners.get(toRaw(element))?.reserveHeight(element, measured) ?? measured
  );
}

export function reserveMeasuredTextBoxHeight({
  element,
  width,
  height,
}: TextBoxHeightMeasurement): number | null {
  // Ignore a delayed result after layout has assigned a different width.
  if (Math.abs(width - element.width) > 0.01) {
    return null;
  }
  return reserveTextBoxHeight(element, height);
}

export function applyLiveTextBoxHeight(
  element: TextBoxElement | RichTextBoxElement,
  measured: number,
) {
  // Pending typing has no content revision yet. Release the previous maximum
  // so live measurements can shrink, including after focus leaves the editor.
  owners.get(toRaw(element))?.releaseHeight(element);
  element.height = measured;
}

export function elementLayoutOperation(element: ScoreElement) {
  return owners.get(toRaw(element));
}
