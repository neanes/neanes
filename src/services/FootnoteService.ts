import { v4 as uuid } from 'uuid';

import {
  FootnoteAnchorElement,
  RICH_TEXT_BOX_CONTENT_KEYS,
  RichTextBoxElement,
  ScoreElement,
} from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import { BUILT_IN_PARAGRAPH_STYLE_IDS } from '@/models/ParagraphStyle';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { CommandFactory } from '@/services/history/CommandService';
import { cloneModel } from '@/utils/cloneModel';
import { richTextParagraphStyleClassName } from '@/utils/richTextParagraphStyleClasses';

import {
  activeRichTextContentKeys,
  remapRichTextBoxFootnotes,
  richTextFootnoteIds,
} from './RichTextFootnotes';

export { elementFootnoteIds, orderedFootnotes } from './FootnoteReferences';
import { normalizeFootnoteMarker } from './FootnoteMarker';
import { elementFootnoteIds } from './FootnoteReferences';

const footnoteFactory = new CommandFactory<Footnote>();
const anchorFactory = new CommandFactory<FootnoteAnchorElement>();

export function createFootnote(
  reference: ScoreElement,
  initializeRichTextBody = true,
) {
  const footnote = new Footnote();
  if (initializeRichTextBody && reference instanceof RichTextBoxElement) {
    const text = new RichTextBoxElement();
    text.content = `<p class="${richTextParagraphStyleClassName(BUILT_IN_PARAGRAPH_STYLE_IDS.FootnoteText)}"></p>`;
    text.languageCode = reference.languageCode;
    text.textDirection = reference.textDirection;
    footnote.staff.elements.unshift(text);
  }
  return footnote;
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
  const footnote = createFootnote(reference);
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
    if (element instanceof RichTextBoxElement) {
      remapRichTextBoxFootnotes(element, remap);
    }
  }
  return copies;
}

// Content and body ownership must enter history together, including deletion.
export function planRichTextFootnoteUpdate(
  score: Score,
  element: RichTextBoxElement,
  newValues: Partial<RichTextBoxElement>,
  added: Footnote[] = [],
) {
  const next = Object.assign(new RichTextBoxElement(), element, newValues);
  const nextIds = elementFootnoteIds(next);
  const beforeIds = elementFootnoteIds(element);
  const isMain = score.staff.elements.includes(element);
  if (!isMain && nextIds.length > 0) {
    throw new Error('NESTED_FOOTNOTES_UNSUPPORTED');
  }
  const bodies = new Set([...score.footnotes, ...added].map((body) => body.id));
  const allIds = score.staff.elements.flatMap((candidate) =>
    elementFootnoteIds(candidate === element ? next : candidate),
  );
  if (
    new Set(allIds).size !== allIds.length ||
    allIds.some((id) => !bodies.has(id))
  ) {
    throw new Error('INVALID_FOOTNOTE_REFERENCE');
  }
  // Changing panel layout must not hide a stored reference.
  if (
    RICH_TEXT_BOX_CONTENT_KEYS.some(
      (key) =>
        !activeRichTextContentKeys(next).includes(key) &&
        richTextFootnoteIds(next[key]).length > 0,
    )
  ) {
    throw new Error('INVALID_FOOTNOTE_REFERENCE');
  }
  return [
    ...added.map((body) =>
      footnoteFactory.create('add-to-collection', {
        collection: score.footnotes,
        elements: [body],
      }),
    ),
    new CommandFactory<RichTextBoxElement>().create('update-properties', {
      target: element,
      newValues,
    }),
    ...score.footnotes
      .filter(
        (body) => beforeIds.includes(body.id) && !nextIds.includes(body.id),
      )
      .map((body) =>
        footnoteFactory.create('remove-from-collection', {
          collection: score.footnotes,
          element: body,
        }),
      ),
  ];
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
