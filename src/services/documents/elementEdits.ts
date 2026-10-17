import { toRaw } from 'vue';

import {
  AcceptsLyricsOption,
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  ElementType,
  ImageBoxElement,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  type ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import type { LyricSetup } from '@/models/LyricSetup';
import {
  getSecondaryNeume,
  getTertiaryNeume,
} from '@/models/NeumeReplacements';
import type { Fthora } from '@/models/Neumes';
import type { Workspace } from '@/models/Workspace';
import {
  fthoraInterpretationKeys,
  getFthoraChange,
  getMartyriaAlignmentChange,
} from '@/services/elementEditing';
import {
  type Command,
  CommandFactory,
} from '@/services/history/CommandService';
import { LyricService } from '@/services/LyricService';

import type { ElementDiscovery } from './elementDiscovery';
import {
  childCollections,
  type ElementCollection,
  headerFooterVariants,
} from './elementDiscovery';
import {
  type ElementDefinition,
  elementEditBatchSchema,
  elementEditPropertySchemas,
} from './elementEditSchema';

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
const factory = new CommandFactory<ScoreElement>();

export interface ElementEditPlan {
  commands: Command[];
  fontFamilies: string[];
  updated: ScoreElement[];
  staffStructureChanged: boolean;
  created: { clientId: string | null; element: ScoreElement }[];
}

// Plan entirely against detached live-model objects. Setters normalize musical
// combinations here, before commands touch the document or its history.
export function planElementEdits(
  workspace: Workspace,
  discovery: ElementDiscovery,
  input: unknown,
  fonts: readonly string[],
): ElementEditPlan {
  const actions = elementEditBatchSchema.parse(input);
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
  for (const region of ['headers', 'footers'] as const) {
    for (const variant of headerFooterVariants) {
      roots.set(
        `${region}.${variant}`,
        cloneCollection(workspace.score[region][variant].elements),
      );
    }
  }
  const reachable = () => {
    const result = new Set<ScoreElement>();
    const visit = (elements: ScoreElement[]) => {
      for (const element of elements) {
        result.add(element);
        for (const children of Object.values(childCollections(element))) {
          visit(children);
        }
      }
    };
    for (const elements of roots.values()) {
      visit(elements);
    }
    return result;
  };
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
  const validateProperties = (
    element: ScoreElement,
    properties: Record<string, unknown>,
  ) => {
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
      if (
        key.toLowerCase().endsWith('fontfamily') &&
        typeof value === 'string' &&
        value !== Reflect.get(element, key) &&
        !fonts.includes(value)
      ) {
        throw new Error(`FONT_NOT_FOUND: ${value}`);
      }
    }
  };
  const applyProperties = (
    element: ScoreElement,
    values: Record<string, unknown>,
    reset: string[] = [],
    options: { creating?: boolean; staffManaged?: boolean } = {},
  ) => {
    const schema = elementEditPropertySchemas[element.elementType];
    if (
      lyricSetup.locked &&
      (options.staffManaged ?? staff.includes(element)) &&
      [...Object.keys(values), ...reset].some(
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
    const properties = schema.parse(values);
    validateProperties(element, properties);
    const defaults =
      element.elementType === ElementType.Empty
        ? undefined
        : new constructors[element.elementType]();
    const update: Record<string, unknown> = {};
    for (const key of reset) {
      if (!Object.hasOwn(schema.shape, key) || Object.hasOwn(properties, key)) {
        throw new Error('INVALID_ELEMENT_EDIT');
      }
      update[key] = Reflect.get(defaults!, key);
    }
    Object.assign(update, properties);
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
    staffManaged = false,
  ) => {
    const element: ScoreElement = new constructors[definition.elementType]();
    if (previous) {
      element.copyBreakStateFrom(previous);
    }
    applyProperties(element, definition.properties, [], {
      creating: true,
      staffManaged,
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
    if (action.action === 'insert') {
      const collection = resolveCollection(action.collection);
      const index =
        action.index ??
        (collection === staff ? collection.length - 1 : collection.length);
      if (index > collection.length) {
        throw new Error('INVALID_ELEMENT_RANGE');
      }
      collection.splice(
        index,
        0,
        ...action.elements.map((item) =>
          create(item, undefined, collection === staff),
        ),
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
      collection.splice(
        index,
        1,
        ...(action.action === 'replace'
          ? [create(action.element, element, collection === staff)]
          : []),
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
      lyricSetup.text = action.text;
      lyricSetup.locked = action.locked;
      assignLyrics(action.text, staff);
    } else {
      const collection = resolveCollection(action.collection);
      if (
        collection !== staff &&
        !(
          action.collection.kind === 'children' &&
          action.collection.collection === 'elements'
        )
      ) {
        throw new Error('INVALID_ELEMENT_COLLECTION');
      }
      if (lyricSetup.locked && collection === staff) {
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

  if (lyricSetup.locked) {
    assignLyrics(lyricSetup.text, staff);
  }

  // Validate the final graph, including constraints imposed by serialization
  // and rendering. No transient invalid collection is ever installed live.
  const validate = (
    elements: ScoreElement[],
    allowed: ElementType[],
    depth = 0,
  ) => {
    if (depth > 16) {
      throw new Error('INVALID_ELEMENT_EDIT');
    }
    for (const element of elements) {
      if (!allowed.includes(element.elementType)) {
        throw new Error('INVALID_ELEMENT_COLLECTION');
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
  validate(staff, [
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
  for (const [name, elements] of roots) {
    if (name !== 'staff') {
      if (elements.length !== 1) {
        throw new Error('INVALID_ELEMENT_COLLECTION');
      }
      validate(elements, [ElementType.TextBox, ElementType.RichTextBox]);
    }
  }
  const live = (element: ScoreElement) => originals.get(element) ?? element;
  const commands: Command[] = [];
  const updated: ScoreElement[] = [];
  if (
    lyricSetup.locked !== workspace.score.staff.lyrics.locked ||
    lyricSetup.text !== workspace.score.staff.lyrics.text
  ) {
    commands.push(
      new CommandFactory<LyricSetup>().create('update-properties', {
        target: workspace.score.staff.lyrics,
        newValues: lyricSetup,
      }),
    );
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
    if (
      next.length === original.length &&
      next.every((element, index) => toRaw(element) === toRaw(original[index]))
    ) {
      continue;
    }
    for (const element of original) {
      commands.push(
        factory.create('remove-from-collection', {
          collection: original,
          element,
        }),
      );
    }
    if (next.length > 0) {
      commands.push(
        factory.create('add-to-collection', {
          collection: original,
          elements: next,
        }),
      );
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
  workspace.commandService.executeAsBatch(plan.commands);
  workspace.hasUnsavedChanges = true;
  const reachable = new Set<ScoreElement>();
  const visit = (elements: ScoreElement[]) => {
    for (const element of elements) {
      reachable.add(toRaw(element));
      Object.values(childCollections(element)).forEach(visit);
    }
  };
  visit([
    ...workspace.score.staff.elements,
    ...workspace.score.headersAndFooters,
  ]);
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
  if (plan.staffStructureChanged) {
    workspace.selectionRange = null;
  }
  return true;
}
