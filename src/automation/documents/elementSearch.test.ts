import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { z } from 'zod';

import {
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  MartyriaElement,
  NoteElement,
  TextBoxElement,
} from '@/models/Element';
import { MeasureBar } from '@/models/Neumes';
import { Score } from '@/models/Score';

import { automationTools } from '../../../electron/main/automation/tools';
import { elementPredicateSchema } from '../contracts/elementPredicates';
import {
  elementLookupShape,
  elementSearchShape,
} from '../contracts/elementSearchSchema';
import {
  automationSchemas,
  parseAutomationRequest,
} from '../contracts/protocol';
import { automationOutputSchema } from '../contracts/results';
import { ElementDiscovery } from './elementDiscovery';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
const search = (args: object = {}) =>
  z.strictObject(elementSearchShape).parse(args);
const lookup = (elementRef: string, args: object = {}) =>
  z.strictObject(elementLookupShape).parse({ elementRef, ...args });
const summary = {
  documentId: 'test',
  revision: 0,
  filePath: null,
  sourceFormat: null,
  title: '',
  hasUnsavedChanges: false,
  selected: false,
  elementCount: 1,
};

function fixture() {
  const score = new Score();
  const note = new NoteElement();
  const martyria = new MartyriaElement();
  note.measureBarLeft = Object.values(MeasureBar)[0];
  martyria.measureBarRight = Object.values(MeasureBar)[1];
  const box = new TextBoxElement();
  box.content = 'large content'.repeat(10000);
  const drop = new DropCapElement();
  drop.fontSize = 80;
  const annotation = new AnnotationElement();
  annotation.text = 'label';
  note.annotations.push(annotation);
  const alternate = new AlternateLineElement();
  alternate.elements.push(new NoteElement());
  note.alternateLines.push(alternate);
  score.staff.elements.unshift(note, martyria, box, drop);
  return {
    score,
    note,
    martyria,
    box,
    drop,
    annotation,
    alternate,
    reader: new ElementDiscovery(),
  };
}

describe('element search and reference lookup', () => {
  it('combines predicates, membership and element types with compact projections', () => {
    const { score, reader, box, drop } = fixture();
    const bars = reader.find(
      score,
      search({
        where: {
          or: [
            { field: 'measureBarLeft', op: 'isNotNull' },
            { field: 'measureBarRight', op: 'isNotNull' },
          ],
        },
        properties: ['measureBarLeft', 'measureBarRight'],
      }),
    );
    expect(bars.elements.map((e) => e.index)).toEqual([0, 1]);
    expect(bars.elements.every((e) => e.collection.kind === 'staff')).toBe(
      true,
    );
    const mixed = reader.find(
      score,
      search({
        where: {
          and: [
            {
              or: [
                { field: 'measureBarLeft', op: 'isNotNull' },
                { field: 'measureBarRight', op: 'isNotNull' },
              ],
            },
            { field: 'auto', op: 'eq', value: true },
          ],
        },
      }),
    );
    expect(mixed.elements.map((element) => element.elementType)).toEqual([
      'Martyria',
    ]);
    const drops = reader.find(
      score,
      search({
        elementTypes: ['DropCap'],
        where: {
          and: [
            { field: 'fontSize', op: 'in', values: [70, 80] },
            {
              field: 'paragraphStyleId',
              op: 'eq',
              value: drop.paragraphStyleId,
            },
          ],
        },
      }),
    );
    expect(
      reader.find(
        score,
        search({
          elementTypes: ['DropCap'],
          where: { field: 'fontSize', op: 'eq', value: 80 },
        }),
      ).elements,
    ).toHaveLength(1);
    expect(drops.elements).toHaveLength(1);
    const boxes = reader.find(
      score,
      search({
        elementTypes: ['TextBox'],
        where: {
          field: 'paragraphStyleId',
          op: 'eq',
          value: box.paragraphStyleId,
        },
      }),
    );
    expect(boxes.elements.some((e) => e.collection.kind === 'staff')).toBe(
      true,
    );
    expect(
      boxes.elements.every((e) => Object.keys(e.properties).length === 0),
    ).toBe(true);
    const content = reader.find(
      score,
      search({
        where: { field: 'content', op: 'eq', value: box.content },
        properties: ['content'],
      }),
    );
    expect(content.elements).toHaveLength(1);
    expect(content.elements[0].properties).toEqual({});
    expect(JSON.stringify(content).length).toBeLessThan(500);
    expect(() =>
      reader.find(
        score,
        search({
          elementTypes: ['TextBox'],
          scope: { kind: 'collection', collection: { kind: 'staff' } },
          properties: ['content'],
          includeContent: true,
        }),
      ),
    ).toThrow('One element exceeds the page budget');
  });

  it('distinguishes applicability, null, undefined, false, zero and empty strings', () => {
    const { score, reader, box, drop } = fixture();
    box.lineHeight = null;
    const find = (field: string, op: string, extra: object = {}) =>
      reader.find(
        score,
        search({
          scope: { kind: 'collection', collection: { kind: 'staff' } },
          where: { field, op, ...extra },
        }),
      ).elements;
    expect(find('lineHeight', 'isNull').map((e) => e.index)).toEqual([2, 3]);
    expect(
      find('lineHeight', 'eq', { value: null }).map((e) => e.index),
    ).toEqual([2]);
    expect(find('fontSize', 'isNotNull').map((e) => e.index)).toEqual([3]);
    expect(find('lyrics', 'isNotNull').map((e) => e.index)).toEqual([0]);
    expect(find('noteIndicator', 'isNotNull').map((e) => e.index)).toEqual([0]);
    expect(find('spaceAfter', 'eq', { value: 0 }).map((e) => e.index)).toEqual([
      0, 1,
    ]);
    expect(find('lyrics', 'eq', { value: '' })).toHaveLength(1);
    const before = reader.snapshot(score);
    drop.fontSize = null;
    expect(reader.snapshot(score)).not.toBe(before);
    const nullSnapshot = reader.snapshot(score);
    // Some imported optional fields can be undefined instead of constructor null.
    Reflect.set(drop, 'fontSize', undefined);
    expect(reader.snapshot(score)).not.toBe(nullSnapshot);
    expect(find('fontSize', 'eq', { value: null })).toHaveLength(1);
    expect(find('fontSize', 'isNull')).toHaveLength(2);
  });

  it('traverses nested and stored collections deterministically with match-relative pagination', () => {
    const { score, reader, note, alternate } = fixture();
    const all = reader.find(score, search());
    expect(all.elements.slice(0, 5).map((e) => e.elementType)).toEqual([
      'Note',
      'Annotation',
      'AlternateLine',
      'Note',
      'Martyria',
    ]);
    expect(all.elements.slice(-10).map((e) => e.collection)).toEqual(
      ['headers', 'footers'].flatMap((kind) =>
        ['default', 'firstPage', 'odd', 'even', 'chapterOpening'].map(
          (variant) => ({ kind, variant }),
        ),
      ),
    );
    const first = reader.find(
      score,
      search({ elementTypes: ['Note'], limit: 1 }),
    );
    expect(first.nextOffset).toBe(1);
    const second = reader.find(
      score,
      search({ elementTypes: ['Note'], limit: 1, offset: first.nextOffset }),
    );
    expect(second.nextOffset).toBeNull();
    expect(second.elements[0].collection).toEqual({
      kind: 'children',
      parentRef: reader.reference(alternate),
      collection: 'elements',
    });
    expect(
      reader.find(score, search({ elementTypes: ['Note'], offset: 2 }))
        .elements,
    ).toEqual([]);
    expect(() =>
      reader.find(score, search({ elementTypes: ['Note'], offset: 3 })),
    ).toThrow('INVALID_ELEMENT_RANGE');
    expect(
      reader.find(
        score,
        search({
          scope: { kind: 'collection', collection: { kind: 'staff' } },
        }),
      ).elements,
    ).toHaveLength(5);
    expect(
      reader.find(
        score,
        search({
          scope: {
            kind: 'collection',
            collection: { kind: 'staff' },
            includeDescendants: true,
          },
        }),
      ).elements,
    ).toHaveLength(8);
    expect(
      reader.find(
        score,
        search({
          scope: {
            kind: 'collection',
            collection: {
              kind: 'children',
              parentRef: reader.reference(note),
              collection: 'annotations',
            },
          },
        }),
      ).elements,
    ).toHaveLength(1);
  });

  it('reads bounded neighborhoods at current locations and preserves reference identity across movement/restoration', () => {
    const { score, reader, box, note, annotation } = fixture();
    const ref = reader.reference(reactive(box));
    const window = reader.lookup(
      score,
      lookup(ref, {
        before: 499,
        after: 499,
        properties: ['paragraphStyleId'],
      }),
    );
    expect(window.collection).toEqual({ kind: 'staff' });
    expect(window.start).toBe(0);
    expect(window.end).toBe(5);
    expect(window.elements.map((e) => e.index)).toEqual([0, 1, 2, 3, 4]);
    expect(
      reader.lookup(score, lookup(ref)).elements[0].properties,
    ).not.toHaveProperty('content');
    const annotationWindow = reader.lookup(
      score,
      lookup(reader.reference(annotation), { before: 10, after: 10 }),
    );
    expect(annotationWindow.collection).toEqual({
      kind: 'children',
      parentRef: reader.reference(note),
      collection: 'annotations',
    });
    expect(annotationWindow.elements).toHaveLength(1);
    score.staff.elements.splice(2, 1);
    expect(() => reader.lookup(score, lookup(ref))).toThrow(
      'ELEMENT_NOT_FOUND',
    );
    score.staff.elements.unshift(box);
    expect(reader.lookup(score, lookup(ref)).elements[0]).toMatchObject({
      elementRef: ref,
      index: 0,
    });
    expect(() => new ElementDiscovery().lookup(score, lookup(ref))).toThrow(
      'ELEMENT_NOT_FOUND',
    );
    expect(() => reader.lookup(new Score(), lookup(ref))).toThrow(
      'ELEMENT_NOT_FOUND',
    );
    const header = reader.find(
      score,
      search({
        scope: {
          kind: 'collection',
          collection: { kind: 'headers', variant: 'odd' },
        },
      }),
    ).elements[0];
    expect(reader.lookup(score, lookup(header.elementRef)).collection).toEqual(
      header.collection,
    );
  });

  it('rejects invalid fields, values, operators and unbounded conditions', () => {
    for (const where of [
      { field: 'computedFontSize', op: 'eq', value: 80 },
      { field: 'fontSize', op: 'eq', value: '80' },
      { field: 'fontSize', op: 'in', values: [80, 'bad'] },
      { field: 'quantitativeNeume', op: 'eq', value: 'invalid' },
      { field: 'noteIndicator', op: 'eq', value: null },
      { field: 'fontSize', op: 'set' },
      { field: 'fontSize', op: 'isNull', value: null },
      { and: [] },
      { or: [] },
      { field: 'fontSize', op: 'in', values: [] },
      { field: 'fontSize', op: 'in', values: Array(101).fill(80) },
      { and: Array(100).fill({ field: 'fontSize', op: 'isNull' }) },
    ]) {
      expect(() => search({ where })).toThrow();
    }
    let deep: unknown = { field: 'fontSize', op: 'isNull' };
    for (let i = 0; i < 8; i++) {
      deep = { and: [deep] };
    }
    expect(() => elementPredicateSchema.parse(deep)).toThrow();
    let excessive: unknown = { field: 'fontSize', op: 'isNull' };
    for (let i = 0; i < 10000; i++) {
      excessive = { and: [excessive] };
    }
    expect(() =>
      parseAutomationRequest({
        tool: 'find_elements',
        arguments: { documentId: 'test', where: excessive },
      }),
    ).toThrow(z.ZodError);
    const ref = '00000000-0000-4000-8000-000000000001';
    expect(() => lookup(ref, { before: 500 })).toThrow();
    expect(() => lookup(ref, { after: -1 })).toThrow();
  });

  it('validates published and runtime contracts without publishing full property schemas', () => {
    const { score, reader } = fixture();
    const tools = automationTools();
    const validator = new AjvJsonSchemaValidator();
    const args = {
      documentId: 'test',
      where: { and: [{ field: 'fontSize', op: 'in', values: [80] }] },
    };
    for (const [name, input, result] of [
      [
        'find_elements',
        args,
        reader.find(score, search({ where: args.where })),
      ],
      [
        'get_element',
        {
          documentId: 'test',
          elementRef: reader.reference(score.staff.elements[0]),
          after: 2,
        },
        reader.lookup(
          score,
          lookup(reader.reference(score.staff.elements[0]), { after: 2 }),
        ),
      ],
    ] as const) {
      const tool = tools.find((tool) => tool.name === name)!;
      expect(tool.annotations?.readOnlyHint).toBe(true);
      expect(validator.getValidator(tool.inputSchema)(input)).toMatchObject({
        valid: true,
      });
      expect(automationSchemas[name].safeParse(input).success).toBe(true);
      const outcome = { success: true, result: { ...summary, ...result } };
      expect(automationOutputSchema(name).parse(outcome)).toEqual(outcome);
      expect(validator.getValidator(tool.outputSchema!)(outcome)).toMatchObject(
        { valid: true },
      );
      expect(JSON.stringify(tool.outputSchema).length).toBeLessThan(4500);
      const invalid = {
        ...outcome,
        result: {
          ...outcome.result,
          elements: [
            { ...result.elements[0], properties: { fontSize: 'bad' } },
          ],
        },
      };
      expect(automationOutputSchema(name).safeParse(invalid).success).toBe(
        false,
      );
    }
  });
});
