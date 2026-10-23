import { describe, expect, it } from 'vitest';

import { snapshotElements } from '@/automation/__tests__/helpers';
import { automationOutputSchema } from '@/automation/__tests__/helpers';
import {
  AnnotationElement,
  DropCapElement,
  ImageBoxElement,
  NoteElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';
import { Score } from '@/models/Score';

import { elementContentQueryShape } from '../contracts/elementContentSchema';
import { parseAutomationRequest } from '../contracts/protocol';
import { assertResultBudget } from '../contracts/responseBudget';
import { ElementDiscovery } from './elementDiscovery';

const readQuery = {
  collection: { kind: 'staff' } as const,
  start: 0,
  offset: 0,
  limit: 100,
};

describe('exact element content retrieval', () => {
  it.each([
    [TextBoxElement, 'content', 'text'.repeat(17500)],
    [
      RichTextBoxElement,
      'content',
      '<p>' + 'HTML &amp; text'.repeat(5000) + '</p>',
    ],
    [
      RichTextBoxElement,
      'contentCenter',
      '<p>' + 'panel'.repeat(14000) + '</p>',
    ],
    [ImageBoxElement, 'data', 'data:image/png;base64,' + 'A'.repeat(70000)],
    [AnnotationElement, 'text', 'annotation'.repeat(7000)],
    [DropCapElement, 'content', 'drop'.repeat(17500)],
  ] as const)(
    'reconstructs %s.%s without transforming its contents',
    (Element, property, original) => {
      const score = new Score();
      const element = new Element();
      Reflect.set(element, property, original);
      score.staff.elements.unshift(element);
      const discovery = new ElementDiscovery();
      const elementRef = discovery.read(score, readQuery).elements[0]
        .elementRef;
      let offset: number | null = 0;
      let reconstructed = '';
      while (offset !== null) {
        const request = parseAutomationRequest({
          tool: 'get_element_content',
          arguments: {
            documentId: 'test',
            elementRef,
            property,
            offset,
            expectedRevision: 0,
          },
        });
        if (request.tool !== 'get_element_content') {
          throw new Error('Unexpected tool');
        }
        const result = {
          documentId: 'test',
          revision: 0,
          ...discovery.readContent(score, request.arguments),
        };
        expect(result.totalLength).toBe(original.length);
        expect(() =>
          assertResultBudget(result, 'get_element_content'),
        ).not.toThrow();
        expect(
          automationOutputSchema('get_element_content').parse({
            success: true,
            result,
          }),
        ).toEqual({ success: true, result });
        reconstructed += result.content;
        offset = result.nextOffset;
      }
      expect(reconstructed).toBe(original);
    },
  );

  it('bounds escaped text and preserves surrogate pairs at chunk boundaries', () => {
    const score = new Score();
    const element = new TextBoxElement();
    element.content = 'a\u{1f600}' + '\u0000'.repeat(70000);
    score.staff.elements.unshift(element);
    const discovery = new ElementDiscovery();
    const elementRef = discovery.reference(element);
    const query = {
      elementRef,
      property: 'content' as const,
      offset: 0,
      limit: 2,
    };
    const first = discovery.readContent(score, query);
    expect(first).toMatchObject({ content: 'a', nextOffset: 1 });
    const second = discovery.readContent(score, {
      ...query,
      offset: first.nextOffset!,
    });
    expect(second).toMatchObject({ content: '\u{1f600}', nextOffset: 3 });
    expect(() => discovery.readContent(score, { ...query, offset: 2 })).toThrow(
      'INVALID_ELEMENT_RANGE',
    );
    const escaped = discovery.readContent(score, {
      ...query,
      offset: 3,
      limit: 8000,
    });
    expect(() =>
      assertResultBudget(escaped, 'get_element_content'),
    ).not.toThrow();
    expect(
      discovery.readContent(score, {
        ...query,
        offset: element.content.length,
      }),
    ).toMatchObject({ content: '', nextOffset: null });
  });

  it('rejects missing/removed references, inapplicable fields and invalid offsets', () => {
    const score = new Score();
    const note = new NoteElement();
    score.staff.elements.unshift(note);
    const discovery = new ElementDiscovery();
    const query = {
      elementRef: discovery.reference(note),
      property: 'content' as const,
      offset: 0,
      limit: 8000,
    };
    expect(() => discovery.readContent(score, query)).toThrow(
      'does not have that string content field',
    );
    const box = new TextBoxElement();
    score.staff.elements.unshift(box);
    query.elementRef = discovery.reference(box);
    expect(discovery.readContent(score, query)).toMatchObject({
      content: '',
      totalLength: 0,
      nextOffset: null,
    });
    expect(() => discovery.readContent(score, { ...query, offset: 1 })).toThrow(
      'INVALID_ELEMENT_RANGE',
    );
    score.staff.elements.shift();
    expect(() => discovery.readContent(score, query)).toThrow(
      'ELEMENT_NOT_FOUND',
    );
    expect(() =>
      parseAutomationRequest({
        tool: 'get_element_content',
        arguments: { documentId: 'test', ...query, property: 'lyrics' },
      }),
    ).toThrow();
    expect(elementContentQueryShape.limit.safeParse(8001).success).toBe(false);
    expect(elementContentQueryShape.limit.safeParse(1).success).toBe(false);
  });

  it('includes small annotations and drop caps by default and marks oversized omissions', () => {
    const score = new Score();
    const annotation = new AnnotationElement();
    annotation.text = 'Short annotation';
    const drop = new DropCapElement();
    drop.content = 'A';
    score.staff.elements.unshift(annotation, drop);
    const discovery = new ElementDiscovery();
    let page = discovery.read(score, { ...readQuery, includeContent: false });
    expect(page.elements[0].properties).toHaveProperty('text', annotation.text);
    expect(page.elements[1].properties).toHaveProperty('content', drop.content);
    expect(
      discovery.read(score, { ...readQuery, properties: [] }).elements[0]
        .properties,
    ).toEqual({});
    const before = snapshotElements(discovery, score);
    annotation.text = 'a'.repeat(70000);
    drop.content = 'b'.repeat(70000);
    expect(snapshotElements(discovery, score)).not.toBe(before);
    page = discovery.read(score, readQuery);
    expect(page.elements[0]).toMatchObject({ omittedContent: ['text'] });
    expect(page.elements[1]).toMatchObject({ omittedContent: ['content'] });
    expect(page.elements[0].properties).not.toHaveProperty('text');
    expect(page.elements[1].properties).not.toHaveProperty('content');
    expect(() =>
      discovery.read(score, { ...readQuery, includeContent: true }),
    ).toThrow('get_element_content');
    expect(
      automationOutputSchema('get_elements').safeParse({
        success: true,
        result: {
          documentId: 'test',
          revision: 0,
          filePath: null,
          title: '',
          hasUnsavedChanges: false,
          selected: false,
          elementCount: 3,
          ...page,
        },
      }).success,
    ).toBe(true);
  });
});
