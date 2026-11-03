import { toRaw } from 'vue';

import {
  AcceptsLyricsOption,
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  ElementType,
  FootnoteAnchorElement,
  ImageBoxElement,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RICH_TEXT_BOX_CONTENT_KEYS,
  RichTextBoxElement,
  type ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import type { Footnote } from '@/models/Footnote';
import type { LyricSetup } from '@/models/LyricSetup';
import { modeKeyTemplates } from '@/models/ModeKeys';
import {
  getSecondaryNeume,
  getTertiaryNeume,
} from '@/models/NeumeReplacements';
import type { Fthora } from '@/models/Neumes';
import type { Workspace } from '@/models/Workspace';
import {
  createMartyriaUpdateCommand,
  createNoteUpdateCommand,
} from '@/services/elementEditing';
import {
  fthoraInterpretationKeys,
  getFthoraChange,
  getMartyriaAlignmentChange,
} from '@/services/elementEditing';
import {
  createFootnote,
  elementFootnoteIds,
  footnoteMarkerUpdateCommand,
  transferFootnoteReference,
} from '@/services/FootnoteService';
import {
  UpdatePropertiesCommand,
  type UpdatePropertiesCommandArgs,
} from '@/services/history/commands/UpdatePropertiesCommand';
import {
  type Command,
  CommandFactory,
} from '@/services/history/CommandService';
import { LyricService } from '@/services/LyricService';
import {
  activeRichTextContentKeys,
  insertRichTextFootnote,
  richTextFootnoteIds,
} from '@/services/RichTextFootnotes';

import {
  type ElementDefinition,
  type ElementEditBatch,
  elementEditPropertySchemas,
} from '../contracts/elementEditSchema';
import { modeKeyTemplateFields } from '../contracts/modeKeyTemplates';
import type { ElementDiscovery } from './elementDiscovery';
import {
  childCollections,
  type ElementCollection,
  headerFooterVariants,
  reachableElements,
} from './elementDiscovery';

const constructors = {
  [ElementType.Note]: NoteElement,
  [ElementType.Martyria]: MartyriaElement,
  [ElementType.Tempo]: TempoElement,
  [ElementType.TextBox]: TextBoxElement,
  [ElementType.RichTextBox]: RichTextBoxElement,
  [ElementType.DropCap]: DropCapElement,
  [ElementType.ModeKey]: ModeKeyElement,
  [ElementType.ImageBox]: ImageBoxElement,
  [ElementType.Annotation]: AnnotationElement,
  [ElementType.AlternateLine]: AlternateLineElement,
};
const factory = new CommandFactory<ScoreElement>((args) => {
  if (args.target instanceof NoteElement) {
    return createNoteUpdateCommand(
      args as UpdatePropertiesCommandArgs<NoteElement>,
    );
  }
  if (args.target instanceof MartyriaElement) {
    return createMartyriaUpdateCommand(
      args as UpdatePropertiesCommandArgs<MartyriaElement>,
    );
  }
  return new UpdatePropertiesCommand(args);
});

export interface ElementEditPlan {
  commands: Command[];
  fontFamilies: string[];
  updated: ScoreElement[];
  staffStructureChanged: boolean;
  created: { clientId: string | null; element: ScoreElement }[];
}

export function createdElementResult(
  created: ElementEditPlan['created'],
  discovery: ElementDiscovery,
  includeCreated: boolean,
) {
  return {
    createdCount: created.length,
    ...(includeCreated
      ? {
          created: created.map(({ clientId, element }) => ({
            clientId,
            elementRef: discovery.reference(element),
            elementType: element.elementType,
          })),
        }
      : {}),
  };
}

// Plan entirely against detached live-model objects. Setters normalize musical
// combinations here, before commands touch the document or its history.
export function planElementEdits(
  workspace: Workspace,
  discovery: ElementDiscovery,
  actions: ElementEditBatch,
  fonts: readonly string[],
  images: ReadonlyMap<string, string> = new Map(),
): ElementEditPlan {
  const originals = new Map<ScoreElement, ScoreElement>();
  const collections = new Map<ScoreElement[], ScoreElement[]>();
  const refs = new Map<string, ScoreElement>();
  const created: ElementEditPlan['created'] = [];
  const declaredIds = new Set<string>();
  const fontFamilies = new Set<string>();
  const lyricSetup = { ...workspace.score.staff.lyrics };
  const assignLyrics = (text: string, elements: ScoreElement[]) => {
    elements.forEach((element, index) => {
      element.index = index;
    });
    return new LyricService().assignLyrics(
      text,
      elements,
      workspace.score.pageSetup.melkiteRtl,
      workspace.score.pageSetup.disableGreekMelismata,
      (note, lyrics) => {
        note.lyrics = lyrics;
      },
      (note, values) => Object.assign(note, values),
      (dropCap, content) => {
        dropCap.content = content;
      },
    );
  };
  const cloneCollection = (elements: ScoreElement[]): ScoreElement[] => {
    const draft = elements.map((element) => {
      const raw = toRaw(element);
      const copy: ScoreElement = Object.assign(
        Object.create(Object.getPrototypeOf(raw)),
        raw,
      );
      originals.set(copy, element);
      refs.set(discovery.reference(raw), copy);
      for (const [key, children] of Object.entries(childCollections(element))) {
        Reflect.set(copy, key, cloneCollection(children));
      }
      return copy;
    });
    collections.set(elements, draft);
    return draft;
  };
  const staff = cloneCollection(workspace.score.staff.elements);
  const roots = new Map<string, ScoreElement[]>([['staff', staff]]);
  const footnotes = [...workspace.score.footnotes];
  const markerUpdates = new Map<Footnote, string | null>();
  const lyricSetups = new Map<ScoreElement[], LyricSetup>([
    [staff, lyricSetup],
  ]);
  const lyricOriginals = new Map<LyricSetup, LyricSetup>([
    [lyricSetup, workspace.score.staff.lyrics],
  ]);
  for (const body of footnotes) {
    const elements = cloneCollection(body.staff.elements);
    roots.set(`footnotes.${body.id}`, elements);
    const setup = { ...body.staff.lyrics };
    lyricSetups.set(elements, setup);
    lyricOriginals.set(setup, body.staff.lyrics);
  }
  for (const region of ['headers', 'footers'] as const) {
    for (const variant of headerFooterVariants) {
      roots.set(
        `${region}.${variant}`,
        cloneCollection(workspace.score[region][variant].elements),
      );
    }
  }
  const reachable = () => reachableElements([...roots.values()].flat());
  const resolve = (ref: string) => {
    const element = refs.get(ref);
    if (element === undefined || !reachable().has(element)) {
      throw new Error('ELEMENT_NOT_FOUND');
    }
    return element;
  };
  const resolveCollection = (selector: ElementCollection) => {
    if (selector.kind === 'children') {
      const children = childCollections(resolve(selector.parentRef));
      if (!Object.hasOwn(children, selector.collection)) {
        throw new Error('INVALID_ELEMENT_COLLECTION');
      }
      return children[selector.collection];
    }
    if (selector.kind === 'footnote') {
      const elements = roots.get(`footnotes.${selector.footnoteId}`);
      if (elements === undefined) {
        throw new Error('INVALID_ELEMENT_COLLECTION');
      }
      return elements;
    }
    return roots.get(
      selector.kind === 'staff'
        ? 'staff'
        : `${selector.kind}.${selector.variant}`,
    )!;
  };
  const location = (element: ScoreElement) => {
    for (const root of roots.values()) {
      const pending = [root];
      while (pending.length > 0) {
        const collection = pending.pop()!;
        const index = collection.indexOf(element);
        if (index >= 0) {
          return { collection, index };
        }
        for (const item of collection) {
          pending.push(...Object.values(childCollections(item)));
        }
      }
    }
    throw new Error('ELEMENT_NOT_FOUND');
  };
  const validateProperties = (properties: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(properties)) {
      if (
        key.toLowerCase().endsWith('fontfamily') &&
        typeof value === 'string' &&
        fonts.includes(value)
      ) {
        fontFamilies.add(value);
      }
      if (
        (key === 'paragraphStyleId' || key === 'lyricsParagraphStyleId') &&
        !workspace.score.paragraphStyles.some((style) => style.id === value)
      ) {
        throw new Error('STYLE_NOT_FOUND');
      }
    }
  };
  const applyProperties = (
    element: ScoreElement,
    properties: Record<string, unknown>,
    reset: string[] = [],
    options: { creating?: boolean; managedLyrics?: LyricSetup } = {},
  ) => {
    const schema = elementEditPropertySchemas[element.elementType];
    if (
      (
        options.managedLyrics ??
        [...lyricSetups].find(([elements]) => elements.includes(element))?.[1]
      )?.locked === true &&
      [...Object.keys(properties), ...reset].some(
        (key) =>
          (element.elementType === ElementType.Note &&
            ['lyrics', 'isMelisma', 'isMelismaStart', 'isHyphen'].includes(
              key,
            )) ||
          (element.elementType === ElementType.DropCap && key === 'content'),
      )
    ) {
      throw new Error('LYRICS_LOCKED');
    }
    validateProperties(properties);
    const defaults =
      element.elementType === ElementType.Empty
        ? undefined
        : new constructors[element.elementType]();
    const update: Record<string, unknown> = {};
    for (const key of reset) {
      if (
        key === 'imagePath' ||
        !Object.hasOwn(schema.shape, key) ||
        Object.hasOwn(properties, key)
      ) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
      update[key] = Reflect.get(defaults!, key);
    }
    Object.assign(update, properties);
    if (typeof properties.imagePath === 'string') {
      const data = images.get(properties.imagePath);
      if (data === undefined) {
        throw new Error('INVALID_ELEMENT_EDIT: Image file was not loaded');
      }
      update.data = data;
      delete update.imagePath;
    }
    if (
      element instanceof ModeKeyElement &&
      Object.hasOwn(properties, 'templateId')
    ) {
      const template = modeKeyTemplates.find(
        (item) => item.id === properties.templateId,
      )!;
      const constructed = ModeKeyElement.createFromTemplate(
        template,
        properties.useOptionalDiatonicFthoras as boolean,
      );
      for (const key of modeKeyTemplateFields) {
        update[key] = constructed[key];
      }
    }
    // This construction option is not a live or saved element property.
    delete update.useOptionalDiatonicFthoras;
    // UI selection always chooses a default. A partial API update preserves
    // custom interpretations when the fthora is unchanged, and explicit nulls.
    for (const fthoraKey of Object.keys(
      fthoraInterpretationKeys,
    ) as (keyof typeof fthoraInterpretationKeys)[]) {
      const noteKey = fthoraInterpretationKeys[fthoraKey];
      if (
        (element.elementType === ElementType.Note ||
          element.elementType === ElementType.Martyria) &&
        Object.hasOwn(update, fthoraKey) &&
        !Object.hasOwn(update, noteKey) &&
        (options.creating ||
          update[fthoraKey] !== Reflect.get(element, fthoraKey))
      ) {
        Object.assign(
          update,
          getFthoraChange(fthoraKey, update[fthoraKey] as Fthora | null),
        );
      }
    }
    // Unlike UI alignment actions, API patches may explicitly supply a neume.
    if (
      element.elementType === ElementType.Martyria &&
      update.alignRight !== undefined &&
      !Object.hasOwn(update, 'quantitativeNeume')
    ) {
      Object.assign(
        update,
        getMartyriaAlignmentChange(
          (element as MartyriaElement).alignRight,
          update.alignRight as boolean,
        ),
      );
    }
    if (element instanceof ImageBoxElement && typeof update.data === 'string') {
      element.data = update.data;
    }
    // Apply setters in model-schema order, regardless of JSON key order.
    for (const key of Object.keys(schema.shape)) {
      if (Object.hasOwn(update, key)) {
        Reflect.set(element, key, update[key]);
      }
    }
  };
  const create = (
    definition: ElementDefinition,
    previous?: ScoreElement,
    managedCollection?: ScoreElement[],
  ) => {
    const element: ScoreElement = new constructors[definition.elementType]();
    if (previous) {
      element.copyBreakStateFrom(previous);
    }
    applyProperties(element, definition.properties, [], {
      creating: true,
      managedLyrics:
        managedCollection === undefined
          ? undefined
          : lyricSetups.get(managedCollection),
    });
    // UI tempo selection also honors user preferences and resets BPM. API
    // creation uses model defaults; partial updates preserve omitted BPM.
    if (
      !Object.hasOwn(definition.properties, 'bpm') &&
      (element instanceof TempoElement ||
        element instanceof MartyriaElement ||
        element instanceof ModeKeyElement)
    ) {
      const sign =
        element instanceof TempoElement
          ? element.neume
          : element instanceof MartyriaElement
            ? (element.tempo ?? element.tempoLeft ?? element.tempoRight)
            : element.tempo;
      if (sign != null) {
        element.bpm = TempoElement.getDefaultBpm(sign);
      }
    }
    const id = definition.clientId;
    if (id !== undefined) {
      if (declaredIds.has(id)) {
        throw new Error('DUPLICATE_ELEMENT_CLIENT_ID');
      }
      declaredIds.add(id);
      refs.set(`@${id}`, element);
    }
    created.push({ clientId: id ?? null, element });
    return element;
  };
  const range = (
    elements: ScoreElement[],
    start: number,
    end = elements.length,
  ) => {
    if (start > end || end > elements.length) {
      throw new Error('INVALID_ELEMENT_RANGE');
    }
    return elements.slice(start, end);
  };
  // The parser carries tie and melisma state across notes. A sliced passage
  // cannot reconstruct a syllable that began outside the requested range.
  const validateLyricBoundary = (
    elements: ScoreElement[],
    boundary: number,
  ) => {
    const previous = elements
      .slice(0, boundary)
      .findLast(
        (element) =>
          element.elementType === ElementType.Note ||
          element.elementType === ElementType.DropCap,
      );
    const next = elements
      .slice(boundary)
      .find(
        (element) =>
          element.elementType === ElementType.Note ||
          element.elementType === ElementType.DropCap,
      );
    if (
      previous?.elementType !== ElementType.Note ||
      next?.elementType !== ElementType.Note
    ) {
      return;
    }
    const left = previous as NoteElement;
    const right = next as NoteElement;
    if (
      new LyricService().getEffectiveAcceptsLyrics(right, left) ===
        AcceptsLyricsOption.MelismaOnly ||
      (right.isMelisma && !right.isMelismaStart) ||
      left.isHyphen
    ) {
      throw new Error(
        'INVALID_ELEMENT_RANGE: Lyric range cuts a tied, melismatic, or hyphenated group. Expand start/end to include the complete group, or explicitly update note lyrics and flags.',
      );
    }
  };
  for (const action of actions) {
    if (action.action === 'update_footnote') {
      const body = footnotes.find(
        (footnote) => footnote.id === action.footnoteId,
      );
      if (body === undefined) {
        throw new Error('INVALID_FOOTNOTE_REFERENCE');
      }
      markerUpdates.set(body, action.marker);
    } else if (
      action.action === 'insert_footnote' ||
      action.action === 'remove_footnote'
    ) {
      const reference = resolve(action.elementRef);
      if (
        !(
          reference instanceof FootnoteAnchorElement ||
          (reference instanceof RichTextBoxElement &&
            action.action === 'insert_footnote')
        ) ||
        !staff.includes(reference)
      ) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
      if (
        action.action === 'remove_footnote' &&
        reference instanceof FootnoteAnchorElement
      ) {
        if (reference.footnoteId === null) {
          throw new Error('INVALID_ELEMENT_EDIT');
        }
        reference.footnoteId = null;
      } else {
        if (action.action !== 'insert_footnote') {
          throw new Error('INVALID_ELEMENT_EDIT');
        }
        if (
          reference instanceof FootnoteAnchorElement &&
          (reference.footnoteId !== null ||
            action.contentKey !== undefined ||
            action.htmlOffset !== undefined)
        ) {
          throw new Error('INVALID_ELEMENT_EDIT');
        }
        const body = createFootnote(reference, action.elements.length === 0);
        footnotes.push(body);
        const elements = cloneCollection(body.staff.elements);
        const setup = { ...body.staff.lyrics };
        lyricSetups.set(elements, setup);
        lyricOriginals.set(setup, body.staff.lyrics);
        elements.unshift(
          ...action.elements.map((definition) =>
            create(definition, undefined, elements),
          ),
        );
        roots.set(`footnotes.${body.id}`, elements);
        if (reference instanceof FootnoteAnchorElement) {
          reference.footnoteId = body.id;
        } else if (
          reference instanceof RichTextBoxElement &&
          action.contentKey !== undefined &&
          action.htmlOffset !== undefined &&
          activeRichTextContentKeys(reference).includes(action.contentKey)
        ) {
          reference[action.contentKey] = insertRichTextFootnote(
            reference[action.contentKey],
            action.htmlOffset,
            body.id,
          );
        } else {
          throw new Error('INVALID_ELEMENT_EDIT');
        }
      }
    } else if (action.action === 'insert') {
      const collection = resolveCollection(action.collection);
      const index =
        action.index ??
        (collection === staff || action.collection.kind === 'footnote'
          ? collection.length - 1
          : collection.length);
      if (index > collection.length) {
        throw new Error('INVALID_ELEMENT_RANGE');
      }
      collection.splice(
        index,
        0,
        ...action.elements.map((item) => create(item, undefined, collection)),
      );
    } else if (action.action === 'update') {
      const element = resolve(action.elementRef);
      if (element.elementType !== action.elementType) {
        throw new Error('ELEMENT_TYPE_MISMATCH');
      }
      if (
        Object.keys(action.properties).length === 0 &&
        action.reset.length === 0
      ) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
      applyProperties(element, action.properties, action.reset);
    } else if (action.action === 'replace' || action.action === 'remove') {
      const element = resolve(action.elementRef);
      if (element.elementType === ElementType.Empty) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
      const { collection, index } = location(element);
      const replacement =
        action.action === 'replace'
          ? create(action.element, element, collection)
          : null;
      if (
        action.action === 'replace' &&
        element instanceof FootnoteAnchorElement &&
        replacement instanceof FootnoteAnchorElement
      ) {
        transferFootnoteReference(
          element,
          replacement,
          action.element.properties,
        );
      }
      collection.splice(
        index,
        1,
        ...(replacement === null ? [] : [replacement]),
      );
    } else if (action.action === 'remove_range') {
      const collection = resolveCollection(action.collection);
      const removed = range(collection, action.start, action.end);
      if (
        removed.some((element) => element.elementType === ElementType.Empty)
      ) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
      collection.splice(action.start, removed.length);
    } else if (action.action === 'set_staff_lyrics') {
      const collection = resolveCollection(action.collection);
      const setup = lyricSetups.get(collection)!;
      setup.text = action.text;
      setup.locked = action.locked;
      assignLyrics(action.text, collection);
    } else {
      const collection = resolveCollection(action.collection);
      if (
        collection !== staff &&
        action.collection.kind !== 'footnote' &&
        !(
          action.collection.kind === 'children' &&
          action.collection.collection === 'elements'
        )
      ) {
        throw new Error('INVALID_ELEMENT_COLLECTION');
      }
      if (lyricSetups.get(collection)?.locked) {
        throw new Error('LYRICS_LOCKED');
      }
      const passage = range(collection, action.start, action.end);
      if (passage.length > 0) {
        validateLyricBoundary(collection, action.start);
        validateLyricBoundary(collection, action.end ?? collection.length);
      }
      const { unassignedText } = assignLyrics(action.text, passage);
      if (unassignedText !== '') {
        throw new Error(
          'INVALID_ELEMENT_RANGE: Lyrics exceed the range capacity. Expand the range or shorten the input. set_staff_lyrics with locked=true can retain text for future notes.',
        );
      }
    }
  }

  for (const [elements, setup] of lyricSetups) {
    if (setup.locked) {
      assignLyrics(setup.text, elements);
    }
  }

  // Validate the final graph, including constraints imposed by serialization
  // and rendering. No transient invalid collection is ever installed live.
  const validate = (
    elements: ScoreElement[],
    allowed: ElementType[],
    depth = 0,
    allowFootnoteReferences = false,
  ) => {
    if (depth > 16) {
      throw new Error('INVALID_ELEMENT_EDIT');
    }
    for (const element of elements) {
      if (!allowed.includes(element.elementType)) {
        throw new Error('INVALID_ELEMENT_COLLECTION');
      }
      if (
        (element instanceof AnnotationElement &&
          richTextFootnoteIds(element.text).length > 0) ||
        (!allowFootnoteReferences && elementFootnoteIds(element).length > 0)
      ) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
      if (element instanceof RichTextBoxElement) {
        for (const key of RICH_TEXT_BOX_CONTENT_KEYS) {
          if (
            !activeRichTextContentKeys(element).includes(key) &&
            richTextFootnoteIds(element[key]).length > 0
          ) {
            throw new Error('INVALID_ELEMENT_EDIT');
          }
        }
      }
      if (element.elementType === ElementType.Note) {
        const note = element as NoteElement;
        if (
          getSecondaryNeume(note.quantitativeNeume) == null &&
          (note.secondaryAccidental != null ||
            note.secondaryFthora != null ||
            note.secondaryGorgonNeume != null)
        ) {
          throw new Error('INVALID_NEUME_COMBINATION');
        }
        if (
          getTertiaryNeume(note.quantitativeNeume) == null &&
          (note.tertiaryAccidental != null || note.tertiaryFthora != null)
        ) {
          throw new Error('INVALID_NEUME_COMBINATION');
        }
        validate(note.annotations, [ElementType.Annotation], depth + 1);
        validate(note.alternateLines, [ElementType.AlternateLine], depth + 1);
      } else if (element.elementType === ElementType.Martyria) {
        const martyria = element as MartyriaElement;
        if (
          [martyria.tempo, martyria.tempoLeft, martyria.tempoRight].filter(
            (value) => value != null,
          ).length > 1
        ) {
          throw new Error(
            'INVALID_NEUME_COMBINATION: Martyria tempo, tempoLeft, and tempoRight are mutually exclusive. Explicitly clear the other fields with null or reset.',
          );
        }
      } else if (element.elementType === ElementType.AlternateLine) {
        validate(
          (element as AlternateLineElement).elements,
          [ElementType.Note],
          depth + 1,
        );
      } else if (
        element.elementType === ElementType.ImageBox &&
        !(element as ImageBoxElement).data.startsWith('data:image/')
      ) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
    }
  };
  if (
    staff.length === 0 ||
    staff.at(-1)!.elementType !== ElementType.Empty ||
    staff
      .slice(0, -1)
      .some((element) => element.elementType === ElementType.Empty)
  ) {
    throw new Error('INVALID_ELEMENT_EDIT');
  }
  validate(
    staff,
    [
      ElementType.Note,
      ElementType.Martyria,
      ElementType.Tempo,
      ElementType.TextBox,
      ElementType.RichTextBox,
      ElementType.DropCap,
      ElementType.ModeKey,
      ElementType.ImageBox,
      ElementType.Empty,
    ],
    0,
    true,
  );
  for (const [name, elements] of roots) {
    if (name.startsWith('footnotes.')) {
      if (
        elements.length === 0 ||
        elements.at(-1)!.elementType !== ElementType.Empty ||
        elements
          .slice(0, -1)
          .some((element) => element.elementType === ElementType.Empty)
      ) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
      if (elements.some((element) => element.pageBreak)) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
      validate(elements, [
        ElementType.Note,
        ElementType.Martyria,
        ElementType.Tempo,
        ElementType.TextBox,
        ElementType.RichTextBox,
        ElementType.DropCap,
        ElementType.ModeKey,
        ElementType.ImageBox,
        ElementType.Empty,
      ]);
    } else if (name !== 'staff') {
      if (elements.length !== 1) {
        throw new Error('INVALID_ELEMENT_COLLECTION');
      }
      validate(elements, [ElementType.TextBox, ElementType.RichTextBox]);
    }
  }
  const live = (element: ScoreElement) => originals.get(element) ?? element;
  const commands: Command[] = [...markerUpdates].map(([body, marker]) =>
    footnoteMarkerUpdateCommand(body, marker),
  );
  const ids = staff.flatMap(elementFootnoteIds);
  const knownIds = new Set(footnotes.map((body) => body.id));
  if (new Set(ids).size !== ids.length || ids.some((id) => !knownIds.has(id))) {
    throw new Error('INVALID_FOOTNOTE_REFERENCE');
  }
  const referencedIds = new Set(ids);
  const finalFootnotes = footnotes.filter((body) => referencedIds.has(body.id));
  if (
    finalFootnotes.length !== workspace.score.footnotes.length ||
    finalFootnotes.some(
      (body, index) => body !== workspace.score.footnotes[index],
    )
  ) {
    commands.push(
      new CommandFactory<Workspace['score']>().create('update-properties', {
        target: workspace.score,
        newValues: { footnotes: finalFootnotes },
      }),
    );
  }
  const updated: ScoreElement[] = [];
  for (const [setup, original] of lyricOriginals) {
    if (setup.locked !== original.locked || setup.text !== original.text) {
      commands.push(
        new CommandFactory<LyricSetup>().create('update-properties', {
          target: original,
          newValues: setup,
        }),
      );
    }
  }
  for (const [draft, original] of originals) {
    const values: Record<string, unknown> = {};
    // Setters can change several backing fields. Apply their fully validated
    // final state directly so undo restores all side effects, in any key order.
    for (const key of Object.keys(toRaw(draft))) {
      const value: unknown = Reflect.get(draft, key);
      if (
        key !== 'index' &&
        !Array.isArray(value) &&
        !Object.is(value, Reflect.get(toRaw(original), key))
      ) {
        values[key] = value;
      }
    }
    if (Object.keys(values).length > 0) {
      updated.push(original);
      commands.push(
        factory.create('update-properties', {
          target: original,
          newValues: values,
        }),
      );
    }
  }
  for (const [original, draft] of collections) {
    const next = draft.map(live);
    let start = 0;
    while (
      start < original.length &&
      start < next.length &&
      toRaw(original[start]) === toRaw(next[start])
    ) {
      start++;
    }
    let originalEnd = original.length;
    let nextEnd = next.length;
    while (
      originalEnd > start &&
      nextEnd > start &&
      toRaw(original[originalEnd - 1]) === toRaw(next[nextEnd - 1])
    ) {
      originalEnd--;
      nextEnd--;
    }
    // Keep the live array and unchanged boundaries for existing history.
    // Removing backwards avoids repeatedly shifting the changed region.
    for (let index = originalEnd - 1; index >= start; index--) {
      commands.push(
        factory.create('remove-from-collection', {
          collection: original,
          element: original[index],
        }),
      );
    }
    if (nextEnd > start) {
      commands.push(
        factory.create('add-to-collection', {
          collection: original,
          elements: next.slice(start, nextEnd),
          insertAtIndex: start,
        }),
      );
    }
  }

  for (const body of footnotes) {
    if (!referencedIds.has(body.id)) {
      roots.delete(`footnotes.${body.id}`);
    }
  }
  const finalElements = reachable();
  return {
    commands,
    fontFamilies: [...fontFamilies],
    updated,
    staffStructureChanged:
      staff.length !== workspace.score.staff.elements.length ||
      staff.some(
        (element, index) =>
          toRaw(live(element)) !== toRaw(workspace.score.staff.elements[index]),
      ),
    created: created.filter((item) => finalElements.has(item.element)),
  };
}

export function applyElementEdits(workspace: Workspace, plan: ElementEditPlan) {
  if (plan.commands.length === 0) {
    return false;
  }
  const previousRevision = workspace.contentRevision;
  workspace.commandService.executeAsBatch(plan.commands);
  const reachable = reachableElements(
    [
      ...workspace.score.staves.flatMap((staff) => staff.elements),
      ...workspace.score.headersAndFooters,
    ],
    toRaw,
  );
  for (const key of [
    'selectedElement',
    'selectedLyrics',
    'selectedAnnotationElement',
    'selectedAlternateLineElement',
    'selectedHeaderFooterElement',
  ] as const) {
    const selected = workspace[key];
    if (selected != null && !reachable.has(toRaw(selected))) {
      workspace[key] = null;
    }
  }
  for (const element of plan.updated) {
    element.keyHelper++;
  }
  if (
    plan.staffStructureChanged ||
    (plan.commands.length > 0 && workspace.activeFootnoteId !== null)
  ) {
    workspace.selectionRange = null;
  }
  if (
    workspace.activeFootnoteId !== null &&
    !workspace.score.footnotes.some(
      (body) => body.id === workspace.activeFootnoteId,
    )
  ) {
    workspace.activeFootnoteId = null;
  }
  return workspace.contentRevision !== previousRevision;
}
