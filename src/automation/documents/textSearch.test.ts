import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
import { describe, expect, it } from 'vitest';

import { snapshotElements } from '@/automation/__tests__/helpers';
import {
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  NoteElement,
  TextBoxElement,
} from '@/models/Element';
import { Score } from '@/models/Score';

import { automationTools } from '../../../electron/main/automation/tools';
import { automationOutcome } from '../contracts/errors';
import { automationSchemas } from '../contracts/protocol';
import { automationResultSchemas } from '../contracts/results';
import { ElementDiscovery } from './elementDiscovery';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
const query = (args: object = {}) =>
  automationSchemas.find_text.parse({
    documentId: 'test',
    query: 'hello',
    ...args,
  });

function fixture() {
  const score = new Score();
  const first = Object.assign(new NoteElement(), { lyrics: 'hel' });
  const second = Object.assign(new NoteElement(), { lyrics: 'lo' });
  const annotation = Object.assign(new AnnotationElement(), {
    text: '<p>Hello annotation</p>',
  });
  first.annotations.push(annotation);
  const alternate = new AlternateLineElement();
  alternate.elements.push(
    Object.assign(new NoteElement(), { lyrics: 'hello' }),
  );
  first.alternateLines.push(alternate);
  score.staff.elements.unshift(
    first,
    second,
    Object.assign(new TextBoxElement(), { content: 'hello box' }),
  );
  score.headers.odd.elements[0] = Object.assign(new TextBoxElement(), {
    content: 'hello header',
  });
  return {
    score,
    first,
    second,
    annotation,
    alternate,
    reader: new ElementDiscovery(),
  };
}

describe('MCP text discovery', () => {
  it('returns depth-first matches and all references in a lyric span without mutation', () => {
    const { score, reader, first, second, annotation } = fixture();
    const before = snapshotElements(reader, score);
    const result = reader.findText(score, query());
    expect(result.matches).toHaveLength(5);
    expect(result.matches.map((match) => match.snippet.trim())).toEqual([
      'hello',
      'hello annotation',
      'hello',
      'hello box',
      'hello header',
    ]);
    expect(result.matches[0].elements.map((part) => part.elementRef)).toEqual([
      reader.reference(first),
      reader.reference(second),
    ]);
    expect(result.matches[1].elementRef).toBe(reader.reference(annotation));
    expect(result.matches[4].collection).toEqual({
      kind: 'headers',
      variant: 'odd',
    });
    expect(snapshotElements(reader, score)).toBe(before);
    for (const match of result.matches) {
      for (const element of match.elements) {
        expect(
          reader.lookup(score, {
            elementRef: element.elementRef,
            before: 0,
            after: 0,
            includeContent: false,
          }).collection,
        ).toEqual(match.collection);
      }
    }
  });

  it('retains both references when a composed lyric character spans elements', () => {
    const score = new Score();
    const drop = Object.assign(new DropCapElement(), { content: 'Α' });
    const following = Object.assign(new NoteElement(), {
      lyrics: '\u0313\u0301ξιον',
    });
    score.staff.elements.unshift(drop, following);
    const reader = new ElementDiscovery();
    const result = reader.findText(score, query({ query: 'Ἄξιον' }));
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].elementRef).toBe(reader.reference(drop));
    expect(result.matches[0].elements).toEqual([
      {
        elementRef: reader.reference(drop),
        elementType: drop.elementType,
        index: 0,
        field: 'content',
      },
      {
        elementRef: reader.reference(following),
        elementType: following.elementType,
        index: 1,
        field: 'lyrics',
      },
    ]);
    expect(
      result.matches[0].snippet.slice(
        result.matches[0].matchStart,
        result.matches[0].matchEnd,
      ),
    ).toBe('ἄξιον');
  });

  it('supports collection/field filtering and does not join across collections', () => {
    const { score, reader, first } = fixture();
    const scope = { kind: 'collection', collection: { kind: 'staff' } };
    expect(reader.findText(score, query({ scope })).matches).toHaveLength(2);
    expect(
      reader.findText(
        score,
        query({ scope: { ...scope, includeDescendants: true } }),
      ).matches,
    ).toHaveLength(4);
    expect(
      reader
        .findText(score, query({ fields: ['text'] }))
        .matches.map((match) => match.elements[0].field),
    ).toEqual(['text']);
    expect(
      reader.findText(score, query({ query: 'helhello' })).matches,
    ).toEqual([]);
    expect(
      reader.findText(
        score,
        query({
          scope: {
            kind: 'collection',
            collection: {
              kind: 'children',
              parentRef: reader.reference(first),
              collection: 'annotations',
            },
          },
        }),
      ).matches,
    ).toHaveLength(1);
  });

  it('paginates occurrences with no skips, including size-limited pages', () => {
    const score = new Score();
    score.staff.elements.unshift(
      Object.assign(new TextBoxElement(), { content: 'hello '.repeat(500) }),
    );
    const reader = new ElementDiscovery();
    const first = reader.findText(score, query({ limit: 1000 }));
    expect(first.matches.length).toBeGreaterThan(0);
    expect(first.matches.length).toBeLessThan(500);
    let offset = 0;
    let count = 0;
    do {
      const result = reader.findText(score, query({ offset, limit: 1000 }));
      count += result.matches.length;
      if (result.nextOffset === null) {
        break;
      }
      expect(result.nextOffset).toBeGreaterThan(offset);
      offset = result.nextOffset;
    } while (true);
    expect(count).toBe(500);
    expect(reader.findText(score, query({ offset: 500 })).matches).toEqual([]);
    expect(() => reader.findText(score, query({ offset: 501 }))).toThrow(
      'INVALID_ELEMENT_RANGE',
    );
    const tiny = reader.findText(score, query({ limit: 1 }));
    expect(tiny.nextOffset).toBe(1);
  });

  it('rejects a single oversized span rather than returning a non-advancing page', async () => {
    const score = new Score();
    score.staff.elements.unshift(
      ...Array.from({ length: 256 }, () =>
        Object.assign(new NoteElement(), { lyrics: 'a' }),
      ),
    );
    const result = await automationOutcome(() =>
      new ElementDiscovery().findText(score, query({ query: 'a'.repeat(256) })),
    );
    expect(result).toMatchObject({
      success: false,
      error: { code: 'RESPONSE_TOO_LARGE' },
    });
  });

  it('validates and publishes the read-only tool and successful outcomes', () => {
    for (const value of ['', ' \tـ', 'a'.repeat(257)]) {
      expect(() => query({ query: value })).toThrow();
    }
    const tool = automationTools().find((tool) => tool.name === 'find_text')!;
    expect(tool.annotations?.readOnlyHint).toBe(true);
    const validator = new AjvJsonSchemaValidator();
    expect(
      validator.getValidator(tool.inputSchema)({
        documentId: 'test',
        query: 'hello',
      }).valid,
    ).toBe(true);
    const { score, reader } = fixture();
    const result = {
      documentId: 'test',
      revision: 0,
      filePath: null,
      title: '',
      hasUnsavedChanges: false,
      selected: false,
      elementCount: 4,
      ...reader.findText(score, query()),
    };
    expect(automationResultSchemas.find_text.parse(result)).toEqual(result);
    expect(
      validator.getValidator(tool.outputSchema!)({ success: true, result })
        .valid,
    ).toBe(true);
  });
});
