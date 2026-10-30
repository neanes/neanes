import { v4 as uuid } from 'uuid';

import { NoteElement, ScoreElement } from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { CommandFactory } from '@/services/history/CommandService';
import { cloneModel } from '@/utils/cloneModel';

const footnoteFactory = new CommandFactory<Footnote>();
const noteFactory = new CommandFactory<NoteElement>();

export function orderedFootnotes(score: Score) {
  const byId = new Map(
    score.footnotes.map((footnote) => [footnote.id, footnote]),
  );
  const seen = new Set<string>();
  const result: {
    footnote: Footnote;
    reference: NoteElement;
    number: number;
  }[] = [];
  for (const element of score.staff.elements) {
    if (!(element instanceof NoteElement) || element.footnoteId === null) {
      continue;
    }
    const footnote = byId.get(element.footnoteId);
    if (footnote === undefined || seen.has(footnote.id)) {
      throw new Error('INVALID_FOOTNOTE_REFERENCE');
    }
    seen.add(footnote.id);
    result.push({
      footnote,
      reference: element,
      number: score.pageSetup.firstFootnoteNumber + result.length,
    });
  }
  return result;
}

export function planFootnoteInsertion(
  workspace: Workspace,
  reference: NoteElement,
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
      noteFactory.create('update-properties', {
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
  const ids = new Set(
    elements
      .filter(
        (element): element is NoteElement => element instanceof NoteElement,
      )
      .map((element) => element.footnoteId),
  );
  return score.footnotes
    .filter((footnote) => ids.has(footnote.id))
    .map((footnote) =>
      footnoteFactory.create('remove-from-collection', {
        collection: score.footnotes,
        element: footnote,
      }),
    );
}

export function planFootnoteRemoval(score: Score, reference: NoteElement) {
  return [
    noteFactory.create('update-properties', {
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
  const ids = new Set(
    elements
      .filter(
        (element): element is NoteElement => element instanceof NoteElement,
      )
      .map((element) => element.footnoteId),
  );
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
    if (!(element instanceof NoteElement) || element.footnoteId === null) {
      continue;
    }
    const snapshot = bodies.get(element.footnoteId);
    if (snapshot === undefined) {
      throw new Error('INVALID_FOOTNOTE_REFERENCE');
    }
    const copy = cloneFootnote(snapshot);
    element.footnoteId = copy.id;
    copies.push(copy);
  }
  return copies;
}
