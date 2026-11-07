import { v4 as uuid } from 'uuid';

import { FootnoteAnchorElement, ScoreElement } from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { CommandFactory } from '@/services/history/CommandService';
import { cloneModel } from '@/utils/cloneModel';

export { elementFootnoteIds, orderedFootnotes } from './FootnoteReferences';
import { normalizeFootnoteMarker } from './FootnoteMarker';
import { elementFootnoteIds } from './FootnoteReferences';

const footnoteFactory = new CommandFactory<Footnote>();
const anchorFactory = new CommandFactory<FootnoteAnchorElement>();

// Explicit properties have already been applied to the replacement.
export function transferFootnoteReference(
  source: FootnoteAnchorElement,
  replacement: FootnoteAnchorElement,
  explicitProperties: object = {},
) {
  replacement.footnoteId = source.footnoteId;
  if (source.footnoteId !== null) {
    if (!Object.hasOwn(explicitProperties, 'footnotePositionOverride')) {
      replacement.footnotePositionOverride = source.footnotePositionOverride;
    }
    for (const key of ['footnoteOffsetX', 'footnoteOffsetY'] as const) {
      if (!Object.hasOwn(explicitProperties, key)) {
        replacement[key] = source[key];
      }
    }
  }
}

export function planFootnoteInsertion(
  workspace: Workspace,
  reference: FootnoteAnchorElement,
) {
  if (
    !workspace.score.staff.elements.includes(reference) ||
    reference.footnoteId !== null
  ) {
    throw new Error('INVALID_FOOTNOTE_ANCHOR');
  }
  const footnote = new Footnote();
  return {
    footnote,
    commands: [
      footnoteFactory.create('add-to-collection', {
        collection: workspace.score.footnotes,
        elements: [footnote],
      }),
      anchorFactory.create('update-properties', {
        target: reference,
        newValues: { footnoteId: footnote.id },
      }),
    ],
  };
}

export function footnoteRemovalCommands(
  score: Score,
  elements: ScoreElement[],
) {
  const ids = new Set(elements.flatMap(elementFootnoteIds));
  return score.footnotes
    .filter((footnote) => ids.has(footnote.id))
    .map((footnote) =>
      footnoteFactory.create('remove-from-collection', {
        collection: score.footnotes,
        element: footnote,
      }),
    );
}

export function planFootnoteRemoval(
  score: Score,
  reference: FootnoteAnchorElement,
) {
  return [
    anchorFactory.create('update-properties', {
      target: reference,
      newValues: { footnoteId: null },
    }),
    ...footnoteRemovalCommands(score, [reference]),
  ];
}

export function cloneFootnote(footnote: Footnote) {
  const elements: ScoreElement[] = [];
  const clone = cloneModel(footnote, (source, copy) => {
    if (source instanceof ScoreElement) {
      elements.push(copy as ScoreElement);
    }
  });
  clone.id = uuid();
  for (const element of elements) {
    element.id = null;
  }
  return clone;
}

export function captureFootnotes(score: Score, elements: ScoreElement[]) {
  const ids = new Set(elements.flatMap(elementFootnoteIds));
  return score.footnotes
    .filter((footnote) => ids.has(footnote.id))
    .map((footnote) => {
      const snapshot = cloneFootnote(footnote);
      snapshot.id = footnote.id;
      return snapshot;
    });
}

export function prepareFootnotePaste(
  elements: ScoreElement[],
  snapshots: Footnote[],
) {
  const bodies = new Map(snapshots.map((footnote) => [footnote.id, footnote]));
  const copies: Footnote[] = [];
  for (const element of elements) {
    const remap = new Map<string, string>();
    for (const id of elementFootnoteIds(element)) {
      const snapshot = bodies.get(id);
      if (snapshot === undefined) {
        throw new Error('INVALID_FOOTNOTE_REFERENCE');
      }
      const copy = cloneFootnote(snapshot);
      remap.set(id, copy.id);
      copies.push(copy);
    }
    if (
      element instanceof FootnoteAnchorElement &&
      element.footnoteId !== null
    ) {
      element.footnoteId = remap.get(element.footnoteId)!;
    }
  }
  return copies;
}

export function footnoteMarkerUpdateCommand(
  footnote: Footnote,
  marker: string | null,
) {
  return footnoteFactory.create('update-properties', {
    target: footnote,
    newValues: { marker: normalizeFootnoteMarker(marker) },
  });
}
