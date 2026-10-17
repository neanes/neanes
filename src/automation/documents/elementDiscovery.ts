import { v4 as uuid } from 'uuid';
import { toRaw } from 'vue';

import {
  type AlternateLineElement,
  ElementType,
  type NoteElement,
  type ScoreElement,
} from '@/models/Element';
import type { Score } from '@/models/Score';

import { elementPropertySchemas } from '../contracts/elementPropertySchemas';

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
      elements: collection.slice(start, stop).map((element, index) => ({
        elementRef: this.reference(element),
        elementType: element.elementType,
        index: start + index,
        properties: this.properties(element, query),
        children: Object.fromEntries(
          Object.entries(childCollections(element)).map(([name, elements]) => [
            name,
            elements.length,
          ]),
        ),
      })),
    };
  }
}
