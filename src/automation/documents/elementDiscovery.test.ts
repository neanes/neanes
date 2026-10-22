import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import { z } from 'zod';

import { snapshotElements } from '@/automation/__tests__/helpers';
import {
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  EmptyElement,
  ImageBoxElement,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import { QuantitativeNeume } from '@/models/Neumes';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';
import { Score } from '@/models/Score';
import {
  CommandFactory,
  CommandService,
} from '@/services/history/CommandService';
import { SaveService } from '@/services/SaveService';

import {
  elementCatalogSchema,
  elementPageShape,
  getElementCatalog,
} from '../contracts/elementSchemas';
import { parseAutomationRequest } from '../contracts/protocol';
import { type ElementCollection, ElementDiscovery } from './elementDiscovery';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
const query = (collection: ElementCollection = { kind: 'staff' }) => ({
  collection,
  start: 0,
  offset: 0,
  limit: 100,
  includeContent: true,
});

describe('typed element discovery', () => {
  it('excludes embedded content by default while supporting explicit small content reads', () => {
    const score = new Score();
    const image = new ImageBoxElement();
    image.data = 'data:image/png;base64,' + 'A'.repeat(1024 * 1024);
    const box = new TextBoxElement();
    box.content = 'Requested text';
    score.staff.elements.unshift(image, box);
    const request = parseAutomationRequest({
      tool: 'get_elements',
      arguments: { documentId: 'test' },
    });
    if (request.tool !== 'get_elements') {
      throw new Error('Unexpected tool');
    }
    const reader = new ElementDiscovery();
    const page = reader.read(score, request.arguments);
    expect(JSON.stringify(page).length).toBeLessThan(3000);
    expect(page.elements[0].properties).not.toHaveProperty('data');
    expect(page.elements[1].properties).not.toHaveProperty('content');
    expect(
      reader.read(score, {
        ...request.arguments,
        start: 1,
        limit: 1,
        includeContent: true,
      }).elements[0].properties,
    ).toHaveProperty('content', box.content);
  });

  it('continues size-limited read and search pages without skipping elements', () => {
    const score = new Score();
    score.staff.elements = Array.from({ length: 200 }, () => new NoteElement());
    const reader = new ElementDiscovery();
    for (const read of [
      (offset: number) =>
        reader.read(score, { ...query(), offset, limit: 1000 }),
      (offset: number) =>
        reader.find(score, {
          scope: {
            kind: 'collection',
            collection: { kind: 'staff' },
            includeDescendants: false,
          },
          offset,
          limit: 1000,
          properties: ['quantitativeNeume', 'lyrics'],
          includeContent: false,
        }),
    ]) {
      const references: string[] = [];
      let offset: number | null = 0;
      while (offset !== null) {
        const page: ReturnType<typeof read> = read(offset);
        expect(JSON.stringify(page).length).toBeLessThan(24000);
        expect(page.elements.length).toBeGreaterThan(0);
        references.push(...page.elements.map((element) => element.elementRef));
        offset = page.nextOffset;
      }
      expect(references).toHaveLength(200);
      expect(new Set(references).size).toBe(200);
    }
  });
  it('reads every element kind and publishes a JSON catalog without changing score data', () => {
    const score = new Score();
    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.Oligon;
    note.lyrics = 'word';
    note.lyricsFontSize = 19;
    note.spaceAfter = 7;
    const martyria = new MartyriaElement();
    martyria.spaceAfter = 3;
    const mode = new ModeKeyElement();
    mode.bpm = 87;
    score.staff.elements = [
      note,
      martyria,
      new TempoElement(),
      new TextBoxElement(),
      new RichTextBoxElement(),
      new DropCapElement(),
      mode,
      new ImageBoxElement(),
      new AnnotationElement(),
      new AlternateLineElement(),
      new EmptyElement(),
    ];
    // Cover both explicit normal resets and inherited line heights.
    (score.staff.elements[3] as TextBoxElement).lineHeight = null;
    const before = JSON.stringify(SaveService.SaveScoreToJson(score));
    const result = new ElementDiscovery().read(score, query());
    expect(z.strictObject(elementPageShape).parse(result)).toEqual(result);
    expect(result.elements[0].properties).toMatchObject({
      quantitativeNeume: 'Oligon',
      lyrics: 'word',
      lyricsFontSize: 19,
      spaceAfter: 7,
    });
    for (const element of result.elements) {
      expect(
        Object.entries(element.properties).every(
          ([key, value]) =>
            value !== undefined && (value !== null || key === 'lineHeight'),
        ),
      ).toBe(true);
    }
    expect(result.elements[0].properties).not.toHaveProperty('accidental');
    expect(result.elements[0].properties).toMatchObject({
      noteIndicator: false,
    });
    expect(result.elements[3].properties).toMatchObject({
      content: '',
      marginTop: 0,
    });
    expect(result.elements[3].properties).toHaveProperty('lineHeight', null);
    expect(result.elements[5].properties).not.toHaveProperty('lineHeight');
    expect(() =>
      z.strictObject(elementPageShape).parse({
        ...result,
        elements: [
          {
            ...result.elements[0],
            properties: { ...result.elements[0].properties, accidental: null },
          },
        ],
      }),
    ).toThrow();
    expect(result.elements[6].properties).toMatchObject({ bpm: 87 });
    expect(result.elements[0].properties).not.toHaveProperty(
      'computedIsonOffsetY',
    );
    expect(result.elements[0].properties).not.toHaveProperty('id');
    expect(JSON.stringify(SaveService.SaveScoreToJson(score))).toBe(before);
    const catalog = getElementCatalog({
      includeProperties: true,
      includeNeumes: true,
    });
    expect(elementCatalogSchema.parse(catalog)).toEqual(catalog);
    expect(catalog.neumes!.QuantitativeNeume).toContain('Oligon');
    expect(catalog.elementTypes).toHaveLength(11);
    const noteSchema = catalog.elementTypes.find(
      (type) => type.elementType === 'Note',
    )!.properties!;
    expect(noteSchema.required).not.toContain('accidental');
    expect(noteSchema.required).toContain('quantitativeNeume');
  });

  it.each([
    ['text box', TextBoxElement],
    ['drop cap', DropCapElement],
  ] as const)(
    'preserves reset, inheritance and numeric line heights for a %s',
    (_name, Element) => {
      const score = new Score();
      const inherited = new Element();
      const reset = new Element();
      reset.lineHeight = null;
      const explicit = new Element();
      explicit.lineHeight = 1.2;
      score.paragraphStyles.find(
        (style) => style.id === inherited.paragraphStyleId,
      )!.overrides.lineHeight = 1.5;
      score.staff.elements.unshift(inherited, reset, explicit);
      const reader = new ElementDiscovery();
      const result = reader.read(score, query());
      expect(z.strictObject(elementPageShape).parse(result)).toEqual(result);
      expect(result.elements[0].properties).not.toHaveProperty('lineHeight');
      expect(result.elements[1].properties).toHaveProperty('lineHeight', null);
      expect(result.elements[2].properties).toHaveProperty('lineHeight', 1.2);
      expect(
        resolveParagraphStyle(
          score.paragraphStyles,
          inherited.paragraphStyleId,
          inherited.getParagraphStyleOverrides(),
        ).lineHeight,
      ).toBe(1.5);
      expect(
        resolveParagraphStyle(
          score.paragraphStyles,
          reset.paragraphStyleId,
          reset.getParagraphStyleOverrides(),
        ).lineHeight,
      ).toBeNull();
      const before = snapshotElements(reader, score);
      inherited.lineHeight = null;
      expect(snapshotElements(reader, score)).not.toBe(before);
      const catalog = getElementCatalog({
        includeProperties: true,
        includeNeumes: true,
      }).elementTypes.find(
        (type) => type.elementType === inherited.elementType,
      )!.properties!;
      expect(catalog.required).not.toContain('lineHeight');
      expect(
        (catalog.properties as Record<string, unknown>).lineHeight,
      ).toMatchObject({
        description: expect.stringContaining(
          'Null explicitly resets line height to normal.',
        ),
      });
    },
  );

  it('reads imported multipanel boxes with omitted unused content and dimensions', () => {
    const data = JSON.parse(
      JSON.stringify(SaveService.SaveScoreToJson(new Score())),
    );
    data.staff.elements.unshift(
      {
        elementType: 'RichTextBox',
        multipanel: true,
        contentCenter: '<p>Center</p>',
      },
      { elementType: 'TextBox', multipanel: true, contentCenter: 'Center' },
    );
    const score = SaveService.LoadScoreFromJson(data);
    const reader = new ElementDiscovery();
    const page = reader.read(score, query());
    expect(z.strictObject(elementPageShape).parse(page)).toEqual(page);
    for (const element of page.elements.slice(0, 2)) {
      expect(element.properties).toMatchObject({
        content: '',
        contentLeft: '',
        contentRight: '',
        height: 20,
      });
    }
  });

  it('preserves unset image alignment from imported scores', () => {
    const data = JSON.parse(
      JSON.stringify(SaveService.SaveScoreToJson(new Score())),
    );
    data.staff.elements.unshift({
      elementType: 'ImageBox',
      data: 'data:image/png;base64,broken',
      imageWidth: 50,
      imageHeight: 50,
    });
    const score = SaveService.LoadScoreFromJson(data);
    const page = new ElementDiscovery().read(score, query());
    expect(z.strictObject(elementPageShape).parse(page)).toEqual(page);
    expect((score.staff.elements[0] as ImageBoxElement).alignment).toBeNull();
    expect(page.elements[0].properties).not.toHaveProperty('alignment');
  });

  it('projects mixed element properties without losing explicit values or changing revisions', () => {
    const score = new Score();
    const note = new NoteElement();
    const box = new TextBoxElement();
    box.lineHeight = null;
    score.staff.elements.unshift(note, box);
    const reader = new ElementDiscovery();
    const before = snapshotElements(reader, score);
    const full = reader.read(score, query());
    const selected = reader.read(score, {
      ...query(),
      properties: [
        'lyrics',
        'noteIndicator',
        'spaceAfter',
        'lineHeight',
        'accidental',
      ],
    });
    expect(selected.elements[0].properties).toEqual({
      lyrics: '',
      noteIndicator: false,
      spaceAfter: 0,
    });
    expect(selected.elements[1].properties).toEqual({ lineHeight: null });
    expect(selected.elements[2].properties).toEqual({});
    expect(z.strictObject(elementPageShape).parse(selected)).toEqual(selected);
    expect(selected.elements.map((e) => e.elementRef)).toEqual(
      full.elements.map((e) => e.elementRef),
    );
    expect(
      reader
        .read(score, { ...query(), properties: [] })
        .elements.every((e) => Object.keys(e.properties).length === 0),
    ).toBe(true);
    expect(snapshotElements(reader, score)).toBe(before);
    box.content = 'changed outside the projection';
    expect(snapshotElements(reader, score)).not.toBe(before);
  });

  it('bounds image and rich-text discovery when content is excluded and retains full retrieval', () => {
    const score = new Score();
    const image = new ImageBoxElement();
    image.data = 'data:image/png;base64,' + 'A'.repeat(350000);
    const box = new RichTextBoxElement();
    box.content = '<p>' + 'text'.repeat(10000) + '</p>';
    box.contentCenter = box.content;
    const annotation = new AnnotationElement();
    annotation.text = 'annotation'.repeat(10000);
    score.staff.elements.unshift(image, box, annotation);
    const reader = new ElementDiscovery();
    const small = reader.read(score, { ...query(), includeContent: false });
    expect(JSON.stringify(small).length).toBeLessThan(3000);
    for (const element of small.elements) {
      expect(element.properties).not.toHaveProperty('data');
      expect(element.properties).not.toHaveProperty('content');
      expect(element.properties).not.toHaveProperty('contentCenter');
      expect(element.properties).not.toHaveProperty('text');
    }
    expect(
      reader.read(score, {
        ...query(),
        properties: ['data'],
        includeContent: false,
      }).elements[0].properties,
    ).toEqual({});
    expect(() =>
      reader.read(score, { ...query(), properties: ['data'] }),
    ).toThrow('One element exceeds the page budget');
    box.contentCenter = '<p>Small explicit content</p>';
    expect(
      reader.read(score, {
        ...query(),
        start: 1,
        limit: 1,
        properties: ['contentCenter'],
      }).elements[0].properties,
    ).toHaveProperty('contentCenter', box.contentCenter);
    expect(z.strictObject(elementPageShape).parse(small)).toEqual(small);
  });

  it('keeps 100-note projected responses within a representative size budget', () => {
    const score = new Score();
    score.staff.elements = Array.from({ length: 100 }, () => new NoteElement());
    const reader = new ElementDiscovery();
    let full = 0;
    let offset: number | null = 0;
    while (offset !== null) {
      const page = reader.read(score, { ...query(), offset });
      full += JSON.stringify(page).length;
      offset = page.nextOffset;
    }
    const projected = JSON.stringify(
      reader.read(score, {
        ...query(),
        properties: ['quantitativeNeume', 'lyrics'],
      }),
    ).length;
    expect(projected).toBeLessThan(20000);
    expect(projected / full).toBeLessThan(0.45);
    console.info('MCP 100-note response sizes (characters)', {
      full,
      projected,
    });
  });

  it('keeps references through insertion, proxies and undo, and rejects removed parents', () => {
    const score = new Score();
    const note = new NoteElement();
    score.staff.elements.unshift(note);
    const reader = new ElementDiscovery();
    const ref = reader.read(score, query()).elements[0].elementRef;
    score.staff.elements.unshift(new NoteElement());
    expect(reader.read(reactive(score), query()).elements[1].elementRef).toBe(
      ref,
    );
    const history = new CommandService();
    history.execute(
      new CommandFactory().create('remove-from-collection', {
        collection: score.staff.elements,
        element: note,
      }),
    );
    const children = query({
      kind: 'children',
      parentRef: ref,
      collection: 'annotations',
    });
    expect(() => reader.read(score, children)).toThrow('ELEMENT_NOT_FOUND');
    history.undo();
    expect(reader.read(score, query()).elements[1].elementRef).toBe(ref);
    expect(reader.read(score, children).elements).toEqual([]);
    expect(
      new ElementDiscovery().read(score, query()).elements[1].elementRef,
    ).not.toBe(ref);
  });

  it('discovers nested collections without recursively expanding unbounded content', () => {
    const score = new Score();
    const note = new NoteElement();
    const annotation = new AnnotationElement();
    annotation.text = 'annotation';
    annotation.x = 5;
    const alternate = new AlternateLineElement();
    alternate.elements.push(new NoteElement());
    note.annotations.push(annotation);
    note.alternateLines.push(alternate);
    score.staff.elements.unshift(note);
    const reader = new ElementDiscovery();
    const parent = reader.read(score, query()).elements[0];
    expect(parent.children).toEqual({ annotations: 1, alternateLines: 1 });
    expect(parent.properties).not.toHaveProperty('annotations');
    const annotations = reader.read(
      score,
      query({
        kind: 'children',
        parentRef: parent.elementRef,
        collection: 'annotations',
      }),
    );
    expect(annotations.elements[0].properties).toMatchObject({
      text: 'annotation',
      x: 5,
    });
    const alternates = reader.read(
      score,
      query({
        kind: 'children',
        parentRef: parent.elementRef,
        collection: 'alternateLines',
      }),
    );
    const notes = reader.read(
      score,
      query({
        kind: 'children',
        parentRef: alternates.elements[0].elementRef,
        collection: 'elements',
      }),
    );
    expect(notes.elements[0].elementType).toBe('Note');
    expect(() =>
      reader.read(
        score,
        query({
          kind: 'children',
          parentRef: parent.elementRef,
          collection: 'elements',
        }),
      ),
    ).toThrow('INVALID_ELEMENT_COLLECTION');
  });

  it('tracks blank child removal, identity and order even when saved contents are identical', () => {
    const score = new Score();
    const note = new NoteElement();
    const first = new AnnotationElement();
    const second = new AnnotationElement();
    note.annotations.push(first, second);
    score.staff.elements.unshift(note);
    const reader = new ElementDiscovery();
    const saved = () => JSON.stringify(SaveService.SaveScoreToJson(score));
    const originalSaved = saved();
    const original = snapshotElements(reader, score);
    expect(snapshotElements(reader, reactive(score))).toBe(original);
    note.annotations.reverse();
    expect(saved()).toBe(originalSaved);
    const reordered = snapshotElements(reader, score);
    expect(reordered).not.toBe(original);
    note.annotations.pop();
    expect(saved()).toBe(originalSaved);
    const removed = snapshotElements(reader, score);
    expect(removed).not.toBe(reordered);
    note.annotations[0] = new AnnotationElement();
    expect(saved()).toBe(originalSaved);
    expect(snapshotElements(reader, score)).not.toBe(removed);
  });

  it('tracks projected properties and nested or disabled collections omitted by serialization', () => {
    const score = new Score();
    const note = new NoteElement();
    const annotation = new AnnotationElement();
    const alternate = new AlternateLineElement();
    const nested = new NoteElement();
    nested.annotations.push(annotation);
    alternate.elements.push(nested);
    note.alternateLines.push(alternate, new AlternateLineElement());
    score.staff.elements.unshift(note);
    const reader = new ElementDiscovery();
    const saved = () => JSON.stringify(SaveService.SaveScoreToJson(score));
    let beforeSaved = saved();
    let before = snapshotElements(reader, score);
    annotation.x = 10;
    expect(saved()).toBe(beforeSaved);
    expect(snapshotElements(reader, score)).not.toBe(before);
    before = snapshotElements(reader, score);
    note.alternateLines.pop();
    expect(saved()).toBe(beforeSaved);
    expect(snapshotElements(reader, score)).not.toBe(before);
    beforeSaved = saved();
    before = snapshotElements(reader, score);
    score.headers.odd.elements[0] = score.headers.odd.elements[0].clone();
    expect(saved()).toBe(beforeSaved);
    expect(snapshotElements(reader, score)).not.toBe(before);
    before = snapshotElements(reader, score);
    note.x += 20;
    note.keyHelper++;
    expect(snapshotElements(reader, score)).toBe(before);
  });

  it('uses half-open collection ranges and relative pagination, including empty ranges', () => {
    const score = new Score();
    score.staff.elements.unshift(
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    );
    const reader = new ElementDiscovery();
    const first = reader.read(score, {
      ...query(),
      start: 1,
      end: 3,
      limit: 1,
    });
    expect(first.elements.map((e) => e.index)).toEqual([1]);
    expect(first.nextOffset).toBe(1);
    const second = reader.read(score, {
      ...query(),
      start: 1,
      end: 3,
      offset: 1,
      limit: 1,
    });
    expect(second.elements.map((e) => e.index)).toEqual([2]);
    expect(second.nextOffset).toBeNull();
    expect(reader.read(score, { ...query(), start: 4 }).elements).toEqual([]);
    for (const range of [
      { start: 3, end: 2 },
      { start: 5 },
      { end: 5 },
      { offset: 5 },
    ]) {
      expect(() => reader.read(score, { ...query(), ...range })).toThrow(
        'INVALID_ELEMENT_RANGE',
      );
    }
  });

  it('reads distinct stored header/footer variants and scopes references to the reader', () => {
    const score = new Score();
    const reader = new ElementDiscovery();
    const header = reader.read(
      score,
      query({ kind: 'headers', variant: 'chapterOpening' }),
    );
    const footer = reader.read(
      score,
      query({ kind: 'footers', variant: 'chapterOpening' }),
    );
    expect(header.elements[0].elementType).toBe('TextBox');
    expect(footer.elements[0].elementRef).not.toBe(
      header.elements[0].elementRef,
    );
    expect(() =>
      new ElementDiscovery().read(
        score,
        query({
          kind: 'children',
          parentRef: header.elements[0].elementRef,
          collection: 'annotations',
        }),
      ),
    ).toThrow('ELEMENT_NOT_FOUND');
  });
});
