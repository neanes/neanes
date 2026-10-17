import { v4 as uuid } from 'uuid';
import { toRaw } from 'vue';

import {
  type AlternateLineElement,
  ElementType,
  type NoteElement,
  type ScoreElement,
} from '@/models/Element';
import type { Score } from '@/models/Score';

import { matchesElement } from '../contracts/elementPredicates';
import { elementPropertySchemas } from '../contracts/elementPropertySchemas';
import type {
  ElementLookupQuery,
  ElementSearchQuery,
} from '../contracts/elementSearchSchema';

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
  'data',
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
    const properties = Object.fromEntries(
      Object.keys(schema.shape).flatMap((key) => {
        if (
          (query.properties !== undefined && !query.properties.includes(key)) ||
          (query.includeContent === false && elementContentProperties.has(key))
        ) {
          return [];
        }
        const value: unknown = Reflect.get(element, key);
        // A null line height explicitly resets to normal; undefined inherits.
        if (value === undefined || (value === null && key !== 'lineHeight')) {
          return [];
        }
        return [[key, value]];
      }),
    );
    return query.properties === undefined && query.includeContent !== false
      ? schema.parse(properties)
      : schema.partial().parse(properties);
  }

  // Save serialization can omit blank children and does not retain object
  // identity. Revisions must also cover everything exposed by discovery.
  snapshot(score: Score) {
    const collectionSnapshot = (elements: ScoreElement[]): unknown[] =>
      elements.map((element) => ({
        elementRef: this.reference(element),
        elementType: element.elementType,
        properties: this.properties(element),
        // Exact null predicates distinguish null from undefined even when read
        // projections omit both. Include that distinction in revision identity.
        nullProperties: Object.keys(
          elementPropertySchemas[element.elementType].shape,
        ).filter((key) => Reflect.get(element, key) === null),
        children: Object.fromEntries(
          Object.entries(childCollections(element)).map(([name, children]) => [
            name,
            collectionSnapshot(children),
          ]),
        ),
      }));
    return JSON.stringify({
      staff: collectionSnapshot(score.staff.elements),
      headers: headerFooterVariants.map((variant) =>
        collectionSnapshot(score.headers[variant].elements),
      ),
      footers: headerFooterVariants.map((variant) =>
        collectionSnapshot(score.footers[variant].elements),
      ),
    });
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
  }> {
    for (const [index, element] of elements.entries()) {
      yield { element, collection, index };
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
    return {
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
  }

  find(score: Score, query: ElementSearchQuery) {
    const candidates =
      query.scope.kind === 'document'
        ? this.entries(score)
        : this.walk(
            this.collection(score, query.scope.collection),
            query.scope.collection,
            query.scope.includeDescendants,
          );
    const elements = [];
    let matched = 0;
    for (const { element, collection, index } of candidates) {
      if (
        query.elementTypes !== undefined &&
        !query.elementTypes.includes(element.elementType)
      ) {
        continue;
      }
      if (query.where !== undefined && !matchesElement(element, query.where)) {
        continue;
      }
      if (matched++ < query.offset) {
        continue;
      }
      if (elements.length === query.limit) {
        return {
          offset: query.offset,
          nextOffset: query.offset + elements.length,
          elements,
        };
      }
      elements.push({ ...this.project(element, index, query), collection });
    }
    if (query.offset > matched) {
      throw new Error('INVALID_ELEMENT_RANGE');
    }
    return { offset: query.offset, nextOffset: null, elements };
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
    for (const { element, collection, index } of this.entries(score)) {
      if (this.refs.get(toRaw(element)) !== query.elementRef) {
        continue;
      }
      const elements = this.collection(score, collection);
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
          .map((element, offset) =>
            this.project(element, start + offset, query),
          ),
      };
    }
    throw new Error('ELEMENT_NOT_FOUND');
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
    const start = query.start + query.offset;
    const stop = Math.min(start + query.limit, end);
    return {
      collection: query.collection,
      collectionSize: collection.length,
      start: query.start,
      end,
      offset: query.offset,
      nextOffset: stop < end ? query.offset + stop - start : null,
      elements: collection
        .slice(start, stop)
        .map((element, index) => this.project(element, start + index, query)),
    };
  }
}
