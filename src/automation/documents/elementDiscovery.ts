import { v4 as uuid } from 'uuid';
import { toRaw } from 'vue';

import {
  findTextMatches,
  type TextSearchMatch,
} from '@/automation/documents/textSearch';
import { RichTextBoxElement, TextBoxElement } from '@/models/Element';
import {
  type AlternateLineElement,
  ElementType,
  type ImageBoxElement,
  type NoteElement,
  type ScoreElement,
} from '@/models/Element';
import type { Score } from '@/models/Score';

import type { ElementContentQuery } from '../contracts/elementContentSchema';
import { matchesElement } from '../contracts/elementPredicates';
import { elementPropertySchemas } from '../contracts/elementPropertySchemas';
import type {
  ElementLookupQuery,
  ElementSearchQuery,
} from '../contracts/elementSearchSchema';
import { AutomationError } from '../contracts/errors';
import {
  elementPageEntrySize,
  MAX_ELEMENT_PAGE_CHARACTERS,
} from '../contracts/responseBudget';
import type { TextSearchQuery } from '../contracts/textSearchSchema';
import { readContentChunk } from './contentRead';
import { collectPage } from './pagination';

export const headerFooterVariants = [
  'default',
  'firstPage',
  'odd',
  'even',
  'chapterOpening',
] as const;
export type ElementCollection =
  | { kind: 'staff' }
  | { kind: 'headers'; variant: (typeof headerFooterVariants)[number] }
  | { kind: 'footers'; variant: (typeof headerFooterVariants)[number] }
  | {
      kind: 'children';
      parentRef: string;
      collection: 'annotations' | 'alternateLines' | 'elements';
    };

export function childCollections(
  element: ScoreElement,
): Record<string, ScoreElement[]> {
  if (element.elementType === ElementType.Note) {
    const note = element as NoteElement;
    return {
      annotations: note.annotations,
      alternateLines: note.alternateLines,
    };
  }
  if (element.elementType === ElementType.AlternateLine) {
    return { elements: (element as AlternateLineElement).elements };
  }
  return {};
}

// Content can be large even for a single element. Lyrics remain ordinary
// properties so musical discovery can omit embedded content independently.
export const elementContentProperties = new Set([
  'content',
  'contentBottom',
  'contentLeft',
  'contentCenter',
  'contentRight',
  'text',
]);
export const elementPropertyNames = new Set(
  Object.values(elementPropertySchemas).flatMap((schema) =>
    Object.keys(schema.shape),
  ),
);

// Collect every element in the trees rooted at the given elements.
export function reachableElements(
  roots: Iterable<ScoreElement>,
  normalize: (element: ScoreElement) => ScoreElement = (element) => element,
) {
  const result = new Set<ScoreElement>();
  const visit = (elements: Iterable<ScoreElement>) => {
    for (const element of elements) {
      result.add(normalize(element));
      for (const children of Object.values(childCollections(element))) {
        visit(children);
      }
    }
  };
  visit(roots);
  return result;
}

// Projection schemas are built once; a fresh partial per element is costly.
const partialPropertySchemas = new Map<
  ElementType,
  ReturnType<(typeof elementPropertySchemas)[ElementType]['partial']>
>();
function partialPropertySchema(type: ElementType) {
  let schema = partialPropertySchemas.get(type);
  if (schema === undefined) {
    schema = elementPropertySchemas[type].partial();
    partialPropertySchemas.set(type, schema);
  }
  return schema;
}

// Legacy text boxes may lack fields that newer constructors initialize.
const textBoxDefaults = {
  [ElementType.RichTextBox]: new RichTextBoxElement(),
  [ElementType.TextBox]: new TextBoxElement(),
} as Partial<Record<ElementType, ScoreElement>>;

// Owned by one open document. Object identity survives insertion, movement and
// history restoration, without assigning IDs or retaining removed elements.
export class ElementDiscovery {
  private refs = new WeakMap<ScoreElement, string>();

  reference(element: ScoreElement) {
    const raw = toRaw(element);
    let ref = this.refs.get(raw);
    if (ref === undefined) {
      ref = uuid();
      this.refs.set(raw, ref);
    }
    return ref;
  }

  private properties(
    element: ScoreElement,
    query: { properties?: string[]; includeContent?: boolean } = {},
  ) {
    const schema = elementPropertySchemas[element.elementType];
    const defaults = textBoxDefaults[element.elementType];
    const properties = Object.fromEntries(
      Object.keys(schema.shape).flatMap((key) => {
        if (
          (query.properties !== undefined && !query.properties.includes(key)) ||
          (query.includeContent !== true &&
            elementContentProperties.has(key) &&
            !(
              element.elementType === ElementType.Annotation && key === 'text'
            ) &&
            !(element.elementType === ElementType.DropCap && key === 'content'))
        ) {
          return [];
        }
        let value: unknown = Reflect.get(element, key);
        if (value === undefined && defaults) {
          value = Reflect.get(defaults, key);
        }
        // A null line height explicitly resets to normal; undefined inherits.
        if (value === undefined || (value === null && key !== 'lineHeight')) {
          return [];
        }
        if (
          element.elementType === ElementType.Note &&
          (key === 'scaleNotes' || key === 'scaleNotesVirtual')
        ) {
          value = (element as NoteElement)[key].map((pitch) => pitch ?? null);
        }
        return [[key, value]];
      }),
    );
    return query.properties === undefined && query.includeContent === true
      ? schema.parse(properties)
      : partialPropertySchema(element.elementType).parse(properties);
  }

  // Locate a referenced element anywhere in the document.
  private entry(score: Score, elementRef: string) {
    for (const entry of this.entries(score)) {
      if (this.refs.get(toRaw(entry.element)) === elementRef) {
        return entry;
      }
    }
    throw new Error('ELEMENT_NOT_FOUND');
  }

  private collection(
    score: Score,
    selector: ElementCollection,
  ): ScoreElement[] {
    if (selector.kind === 'staff') {
      return score.staff.elements;
    }
    if (selector.kind === 'headers' || selector.kind === 'footers') {
      return score[selector.kind][selector.variant].elements;
    }
    const pending = [score.staff.elements, score.headersAndFooters];
    while (pending.length > 0) {
      for (const element of pending.pop()!) {
        const children = childCollections(element);
        if (this.refs.get(toRaw(element)) === selector.parentRef) {
          if (!Object.hasOwn(children, selector.collection)) {
            throw new Error('INVALID_ELEMENT_COLLECTION');
          }
          return children[selector.collection];
        }
        pending.push(...Object.values(children));
      }
    }
    throw new Error('ELEMENT_NOT_FOUND');
  }

  private *walk(
    elements: ScoreElement[],
    collection: ElementCollection,
    descendants: boolean,
  ): Generator<{
    element: ScoreElement;
    collection: ElementCollection;
    index: number;
    elements: ScoreElement[];
  }> {
    for (const [index, element] of elements.entries()) {
      yield { element, collection, index, elements };
      if (descendants) {
        for (const [name, children] of Object.entries(
          childCollections(element),
        )) {
          yield* this.walk(
            children,
            {
              kind: 'children',
              parentRef: this.reference(element),
              collection: name as 'annotations' | 'alternateLines' | 'elements',
            },
            true,
          );
        }
      }
    }
  }

  *entries(score: Score) {
    yield* this.walk(score.staff.elements, { kind: 'staff' }, true);
    for (const kind of ['headers', 'footers'] as const) {
      for (const variant of headerFooterVariants) {
        yield* this.walk(
          score[kind][variant].elements,
          { kind, variant },
          true,
        );
      }
    }
  }

  private project(
    element: ScoreElement,
    index: number,
    query: { properties?: string[]; includeContent?: boolean },
  ) {
    const result = {
      elementRef: this.reference(element),
      elementType: element.elementType,
      index,
      properties: this.properties(element, query),
      children: Object.fromEntries(
        Object.entries(childCollections(element)).map(([name, elements]) => [
          name,
          elements.length,
        ]),
      ),
    };
    const smallContent =
      element.elementType === ElementType.Annotation
        ? 'text'
        : element.elementType === ElementType.DropCap
          ? 'content'
          : null;
    if (
      query.includeContent !== true &&
      smallContent !== null &&
      Object.hasOwn(result.properties, smallContent) &&
      JSON.stringify(result).length > MAX_ELEMENT_PAGE_CHARACTERS - 1000
    ) {
      Reflect.deleteProperty(result.properties, smallContent);
      return { ...result, omittedContent: [smallContent] };
    }
    return result;
  }

  readImage(score: Score, elementRef: string) {
    const { element } = this.entry(score, elementRef);
    if (element.elementType !== ElementType.ImageBox) {
      throw new Error(
        'INVALID_ELEMENT_CONTENT: The selected element is not an image',
      );
    }
    return (element as ImageBoxElement).data;
  }

  readContent(score: Score, query: ElementContentQuery) {
    const { element } = this.entry(score, query.elementRef);
    const value: unknown = Reflect.get(element, query.property);
    if (
      !elementContentProperties.has(query.property) ||
      !Object.hasOwn(
        elementPropertySchemas[element.elementType].shape,
        query.property,
      ) ||
      typeof value !== 'string'
    ) {
      throw new AutomationError({
        code: 'INVALID_ELEMENT_CONTENT',
        message:
          'The selected element does not have that string content field.',
        details: { elementRef: query.elementRef, property: query.property },
      });
    }
    return {
      elementRef: query.elementRef,
      property: query.property,
      ...readContentChunk(value, query),
    };
  }

  private candidates(score: Score, scope: ElementSearchQuery['scope']) {
    return scope.kind === 'document'
      ? this.entries(score)
      : this.walk(
          this.collection(score, scope.collection),
          scope.collection,
          scope.includeDescendants,
        );
  }

  find(score: Score, query: ElementSearchQuery) {
    const candidates = this.candidates(score, query.scope);
    function* matches() {
      for (const entry of candidates) {
        if (
          (query.elementTypes === undefined ||
            query.elementTypes.includes(entry.element.elementType)) &&
          (query.where === undefined ||
            matchesElement(entry.element, query.where))
        ) {
          yield entry;
        }
      }
    }
    const { values: elements, ...page } = collectPage(
      matches(),
      query,
      ({ element, collection, index }) => ({
        ...this.project(element, index, query),
        collection,
      }),
      elementPageEntrySize,
    );
    return { ...page, elements };
  }

  findText(score: Score, query: TextSearchQuery) {
    const candidates = this.candidates(score, query.scope);
    function* occurrences() {
      const iterators = new Map<
        ScoreElement[],
        {
          iterator: ReturnType<typeof findTextMatches>;
          next: IteratorResult<TextSearchMatch>;
        }
      >();
      for (const { collection, index, elements } of candidates) {
        let state = iterators.get(elements);
        if (!state) {
          const iterator = findTextMatches(elements, query.query, query);
          state = { iterator, next: iterator.next() };
          iterators.set(elements, state);
        }
        while (!state.next.done && state.next.value.parts[0].index === index) {
          yield { collection, match: state.next.value };
          state.next = state.iterator.next();
        }
      }
    }
    const { values: matches, ...page } = collectPage(
      occurrences(),
      query,
      ({ collection, match }) => ({
        elementRef: this.reference(match.parts[0].element),
        collection,
        snippet: match.snippet,
        matchStart: match.matchStart,
        matchEnd: match.matchEnd,
        elements: match.parts.map(({ element, index, field }) => ({
          elementRef: this.reference(element),
          elementType: element.elementType,
          index,
          field,
        })),
      }),
      elementPageEntrySize,
    );
    return { ...page, matches };
  }

  location(score: Score, target: ScoreElement) {
    const raw = toRaw(target);
    for (const { element, collection, index } of this.entries(score)) {
      if (toRaw(element) === raw) {
        return {
          elementRef: this.reference(element),
          elementType: element.elementType,
          collection,
          index,
        };
      }
    }
    return null;
  }

  lookup(score: Score, query: ElementLookupQuery) {
    const { collection, index, elements } = this.entry(score, query.elementRef);
    const start = Math.max(0, index - query.before);
    const end = Math.min(elements.length, index + query.after + 1);
    return {
      elementRef: query.elementRef,
      collection,
      collectionSize: elements.length,
      start,
      end,
      elements: elements
        .slice(start, end)
        .map((element, offset) => this.project(element, start + offset, query)),
    };
  }

  read(
    score: Score,
    query: {
      collection: ElementCollection;
      start: number;
      end?: number;
      offset: number;
      limit: number;
      properties?: string[];
      includeContent?: boolean;
    },
  ) {
    const collection = this.collection(score, query.collection);
    const end = query.end ?? collection.length;
    if (query.start > end || end > collection.length) {
      throw new Error('INVALID_ELEMENT_RANGE');
    }
    const count = end - query.start;
    if (query.offset > count) {
      throw new Error('INVALID_ELEMENT_RANGE');
    }
    function* indices() {
      for (let index = query.start + query.offset; index < end; index++) {
        yield index;
      }
    }
    const { values: elements, ...page } = collectPage(
      indices(),
      { offset: 0, limit: query.limit },
      (index) => this.project(collection[index], index, query),
      elementPageEntrySize,
    );
    return {
      collection: query.collection,
      collectionSize: collection.length,
      start: query.start,
      end,
      offset: query.offset,
      nextOffset:
        page.nextOffset === null ? null : query.offset + page.nextOffset,
      elements,
    };
  }
}
