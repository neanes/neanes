import { toRaw } from 'vue';

import { ElementType, type ScoreElement } from '@/models/Element';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { CommandFactory } from '@/services/history/CommandService';
import {
  collectClipboardParagraphStyleIdsFromElements,
  collectClipboardParagraphStylesFromElements,
  resolveClipboardParagraphStyles,
  rewriteClipboardElementParagraphStyleIds,
} from '@/utils/clipboardParagraphStyles';

import { elementPropertySchemas } from '../contracts/elementPropertySchemas';
import { childCollections } from './elementDiscovery';
import type { ElementEditPlan } from './elementEdits';

export interface ElementCopyRange {
  start: number;
  end?: number;
  index?: number;
  includeLyrics?: boolean;
}

function copyElement(
  source: ScoreElement,
  includeLyrics: boolean,
): ScoreElement {
  const copy = toRaw(source).clone({ includeLyrics });
  // Clipboard clones omit some persistent fields (including break state).
  // Copy readable stored fields too, but recalculate pitches in the new context.
  for (const key of Object.keys(
    elementPropertySchemas[source.elementType].shape,
  )) {
    if (
      !includeLyrics &&
      source.elementType === ElementType.Note &&
      (key.startsWith('lyrics') ||
        ['isHyphen', 'isMelisma', 'isMelismaStart'].includes(key))
    ) {
      continue;
    }
    if (key !== 'scaleNotes' && key !== 'scaleNotesVirtual') {
      Reflect.set(copy, key, Reflect.get(source, key));
    }
  }
  for (const [key, children] of Object.entries(childCollections(source))) {
    Reflect.set(
      copy,
      key,
      children.map((child) => copyElement(child, includeLyrics)),
    );
  }
  return copy;
}

// Match editor paste semantics without using the clipboard or sharing objects.
export function planElementCopy(
  source: Workspace,
  destination: Workspace,
  range: ElementCopyRange,
): ElementEditPlan {
  const sourceElements = source.score.staff.elements;
  const destinationElements = destination.score.staff.elements;
  const end = range.end ?? sourceElements.length - 1;
  const index = range.index ?? destinationElements.length - 1;
  if (
    !Number.isInteger(range.start) ||
    !Number.isInteger(end) ||
    !Number.isInteger(index) ||
    range.start < 0 ||
    end < range.start ||
    end > sourceElements.length - 1 ||
    index < 0 ||
    index > destinationElements.length - 1 ||
    end - range.start > 1000
  ) {
    throw new Error('INVALID_ELEMENT_RANGE');
  }
  const elements = sourceElements.slice(range.start, end);
  if (elements.some((element) => element.elementType === ElementType.Empty)) {
    throw new Error('INVALID_ELEMENT_RANGE');
  }
  const plan: ElementEditPlan = {
    commands: [],
    fontFamilies: [],
    updated: [],
    staffStructureChanged: elements.length > 0,
    created: [],
  };
  if (elements.length === 0) {
    return plan;
  }
  // Structural edits reassign authoritative staff lyrics during settlement.
  // Reject rather than silently replacing the copied passage's lyrics.
  if (destination.score.staff.lyrics.locked) {
    throw new Error('LYRICS_LOCKED');
  }
  const copies = elements.map((element) =>
    copyElement(element, range.includeLyrics ?? true),
  );
  const { importedParagraphStyles, styleIdRemap } =
    resolveClipboardParagraphStyles(
      collectClipboardParagraphStylesFromElements(
        copies,
        source.score.paragraphStyles,
      ),
      destination.score.paragraphStyles,
      collectClipboardParagraphStyleIdsFromElements(copies),
    );
  const paragraphStyles = [
    ...destination.score.paragraphStyles,
    ...importedParagraphStyles,
  ];
  for (const copy of copies) {
    rewriteClipboardElementParagraphStyleIds(
      copy,
      paragraphStyles,
      styleIdRemap,
    );
  }
  const fonts = new Set<string>();
  const collectFonts = (element: ScoreElement) => {
    for (const [key, value] of Object.entries(element)) {
      if (key.endsWith('FontFamily') || key === 'fontFamily') {
        if (typeof value === 'string') {
          fonts.add(value);
        }
      }
    }
    for (const children of Object.values(childCollections(element))) {
      children.forEach(collectFonts);
    }
  };
  copies.forEach(collectFonts);
  for (const style of paragraphStyles) {
    if (style.overrides.fontFamily !== undefined) {
      fonts.add(style.overrides.fontFamily);
    }
  }
  plan.fontFamilies = [...fonts];
  if (importedParagraphStyles.length > 0) {
    plan.commands.push(
      new CommandFactory<Score>().create('update-properties', {
        target: destination.score,
        newValues: { paragraphStyles },
      }),
    );
  }
  plan.commands.push(
    new CommandFactory<ScoreElement>().create('add-to-collection', {
      collection: destinationElements,
      elements: copies,
      insertAtIndex: index,
    }),
  );
  plan.created = copies.map((element) => ({ clientId: null, element }));
  return plan;
}
