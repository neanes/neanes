import { describe, expect, it } from 'vitest';

import type { ScoreElement } from '@/models/Element';
import {
  EmptyElement,
  MartyriaElement,
  NoteElement,
  TextBoxElement,
} from '@/models/Element';
import { Line, Page } from '@/models/Page';

import {
  compareLayouts,
  createLayoutVerificationState,
  recordLayoutVerification,
} from './layoutVerification';

function copyElement<T extends ScoreElement>(element: T): T {
  return Object.assign(
    Object.create(Object.getPrototypeOf(element)),
    element,
  ) as T;
}

// Builds an editor-side layout and its detached copy with equal fields.
function buildLayouts() {
  const note = new NoteElement();
  note.id = 1;
  note.x = 10;
  note.y = 20;
  note.page = 1;
  note.line = 1;
  note.computedMeasureBarLeft = null;
  const martyria = new MartyriaElement();
  martyria.id = 2;
  martyria.x = 40;
  const textBox = new TextBoxElement();
  textBox.id = 3;
  const empty = new EmptyElement();
  const elements: ScoreElement[] = [note, martyria, textBox, empty];

  const copies = new Map<ScoreElement, ScoreElement>(
    elements.map((element) => [element, copyElement(element)]),
  );

  function pagesFor(map: (element: ScoreElement) => ScoreElement) {
    const first = new Page();
    const line = new Line();
    line.elements = [map(note), map(martyria)];
    line.adjustmentRatio = 0.5;
    first.lines.push(line);
    const second = new Page();
    second.physicalPageNumber = 2;
    const secondLine = new Line();
    secondLine.elements = [map(textBox), map(empty)];
    second.lines.push(secondLine);
    second.footnotes.push({
      id: 'f',
      number: 1,
      marker: '1',
      reference: map(note),
      lines: [],
      top: 100,
      height: 30,
      labelX: 5,
    });
    return [first, second];
  }

  return {
    note,
    martyria,
    textBox,
    elements,
    copies,
    actual: pagesFor((element) => element),
    expected: pagesFor((element) => copies.get(element)!),
  };
}

describe('layout verification', () => {
  it('accepts equal layouts', () => {
    const { actual, expected, elements, copies } = buildLayouts();
    expect(compareLayouts(actual, expected, elements, copies)).toBeNull();
  });

  it('reports a differing element field with both values', () => {
    const { actual, expected, elements, copies, note } = buildLayouts();
    copies.get(note)!.x = 11;
    expect(compareLayouts(actual, expected, elements, copies)).toEqual({
      path: 'element 1.x',
      elementId: 1,
      field: 'x',
      actual: 10,
      expected: 11,
    });
  });

  it('reports fields that only one side has', () => {
    const { actual, expected, elements, copies, martyria } = buildLayouts();
    (copies.get(martyria) as unknown as Record<string, unknown>).extra = 1;
    expect(compareLayouts(actual, expected, elements, copies)).toMatchObject({
      elementId: 2,
      field: 'extra',
      actual: undefined,
      expected: 1,
    });
  });

  it('compares nested layout values', () => {
    const { actual, expected, elements, copies, note } = buildLayouts();
    note.computedMeasureBarLeft = null;
    (copies.get(note) as NoteElement).lyricsFontCss = 'bold 12px serif';
    note.lyricsFontCss = 'bold 13px serif';
    expect(compareLayouts(actual, expected, elements, copies)).toMatchObject({
      elementId: 1,
      field: 'lyricsFontCss',
    });
  });

  it('reports element order changes within a line', () => {
    const { actual, expected, elements, copies, note, martyria } =
      buildLayouts();
    expected[0].lines[0].elements = [copies.get(martyria)!, copies.get(note)!];
    expect(compareLayouts(actual, expected, elements, copies)).toEqual({
      path: 'pages[0].lines[0].elements[0]',
      elementId: 1,
      field: 'pages[0].lines[0].elements[0]',
      actual: '<Note 1>',
      expected: '<Martyria 2>',
    });
  });

  it('reports an element on a different line', () => {
    const { actual, expected, elements, copies, martyria } = buildLayouts();
    expected[0].lines[0].elements.pop();
    expected[1].lines[0].elements.unshift(copies.get(martyria)!);
    expect(compareLayouts(actual, expected, elements, copies)?.path).toBe(
      'pages[0].lines[0].elements.length',
    );
  });

  it('reports page count and page fields', () => {
    const { actual, expected, elements, copies } = buildLayouts();
    expected.push(new Page());
    expect(compareLayouts(actual, expected, elements, copies)).toMatchObject({
      path: 'pages.length',
      actual: 2,
      expected: 3,
    });
    expected.pop();
    expected[1].footnoteOverflow = true;
    expect(compareLayouts(actual, expected, elements, copies)).toMatchObject({
      path: 'pages[1].footnoteOverflow',
      actual: false,
      expected: true,
    });
  });

  it('compares footnote placements and their references', () => {
    const { actual, expected, elements, copies, martyria } = buildLayouts();
    expected[1].footnotes[0].top = 101;
    expect(compareLayouts(actual, expected, elements, copies)?.path).toBe(
      'pages[1].footnotes[0].top',
    );
    expected[1].footnotes[0].top = 100;
    expected[1].footnotes[0].reference = copies.get(martyria)!;
    expect(compareLayouts(actual, expected, elements, copies)).toMatchObject({
      path: 'pages[1].footnotes[0].reference',
      actual: '<Note 1>',
      expected: '<Martyria 2>',
    });
  });

  it('compares line fields', () => {
    const { actual, expected, elements, copies } = buildLayouts();
    expected[0].lines[0].adjustmentRatio = 0.25;
    expect(compareLayouts(actual, expected, elements, copies)).toMatchObject({
      path: 'pages[0].lines[0].adjustmentRatio',
      actual: 0.5,
      expected: 0.25,
    });
  });

  it('matches element references inside element fields through copies', () => {
    const { actual, expected, elements, copies, note, textBox } =
      buildLayouts();
    const actualRecord = note as unknown as Record<string, unknown>;
    const expectedRecord = copies.get(note) as unknown as Record<
      string,
      unknown
    >;
    actualRecord.related = textBox;
    expectedRecord.related = copies.get(textBox);
    expect(compareLayouts(actual, expected, elements, copies)).toBeNull();
    expectedRecord.related = textBox;
    expect(compareLayouts(actual, expected, elements, copies)).toMatchObject({
      field: 'related',
    });
  });

  it('treats NaN as equal and distinguishes -0 from 0', () => {
    const { actual, expected, elements, copies, note } = buildLayouts();
    note.x = Number.NaN;
    copies.get(note)!.x = Number.NaN;
    expect(compareLayouts(actual, expected, elements, copies)).toBeNull();
    note.x = -0;
    copies.get(note)!.x = 0;
    expect(compareLayouts(actual, expected, elements, copies)).toMatchObject({
      field: 'x',
    });
  });

  it('reports elements without a copy', () => {
    const { actual, expected, elements, copies } = buildLayouts();
    const extra = new NoteElement();
    extra.id = 9;
    expect(
      compareLayouts(actual, expected, [...elements, extra], copies),
    ).toMatchObject({ elementId: 9, expected: 'no detached copy' });
  });

  it('records the number of checks and the first difference', () => {
    const { actual, expected, elements, copies, note } = buildLayouts();
    let state = createLayoutVerificationState();
    state = recordLayoutVerification(
      state,
      compareLayouts(actual, expected, elements, copies),
    );
    copies.get(note)!.y = 21;
    const first = compareLayouts(actual, expected, elements, copies);
    state = recordLayoutVerification(state, first);
    copies.get(note)!.y = 20;
    copies.get(note)!.width = 3;
    const second = compareLayouts(actual, expected, elements, copies);
    state = recordLayoutVerification(state, second);
    expect(state).toEqual({
      checks: 3,
      failures: 2,
      firstDifference: first,
      lastDifference: second,
    });
    expect(first?.field).toBe('y');
    expect(second?.field).toBe('width');
  });
});
