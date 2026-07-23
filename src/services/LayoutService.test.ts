import { describe, expect, it } from 'vitest';

import type { ScoreElement } from '../models/Element';
import {
  MartyriaElement,
  NoteElement,
  TempoElement,
  TextBoxElement,
} from '../models/Element';
import { Line } from '../models/Page';
import { PageSetup } from '../models/PageSetup';
import { LayoutService } from './LayoutService';

const itif = (condition: boolean) => (condition ? it : it.skip);

describe.each([true, false])(
  'LayoutService.findFinalAndNextElement',
  (isHyphen) => {
    it(`works for adjacent melismas (no next) [isHyphen=${isHyphen}]`, () => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const element = melismaStart;
      const line = getLine(melismaStart, expectedFinalElement);
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBeNull();
    });

    it(`works for adjacent melismas (with next) [isHyphen=${isHyphen}]`, () => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const expectedNextElement = new NoteElement();
      expectedNextElement.isMelisma = true;
      expectedNextElement.isMelismaStart = true;

      const element = melismaStart;
      const line = getLine(
        melismaStart,
        expectedFinalElement,
        expectedNextElement,
      );
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBe(expectedNextElement);
    });

    it.each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(`skips $type (no next) [isHyphen=${isHyphen}]`, () => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const martyria = new MartyriaElement();

      const element = melismaStart;
      const line = getLine(melismaStart, martyria, expectedFinalElement);
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBeNull();
    });

    it.each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(`skips $type (with next) [isHyphen=${isHyphen}]`, () => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const martyriaElement = new MartyriaElement();

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const expectedNextElement = new NoteElement();
      expectedNextElement.isMelisma = true;
      expectedNextElement.isMelismaStart = true;

      const element = melismaStart;
      const line = getLine(
        melismaStart,
        martyriaElement,
        expectedFinalElement,
        expectedNextElement,
      );
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBe(expectedNextElement);
    });

    it.each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(
      `skips $type (with next and consecutive continouous elements) [isHyphen=${isHyphen}]`,
      () => {
        const melismaStart = new NoteElement();
        melismaStart.isHyphen = isHyphen;
        melismaStart.isMelisma = true;
        melismaStart.isMelismaStart = true;

        const martyriaElement = new MartyriaElement();
        const tempoElement = new TempoElement();

        const expectedFinalElement = new NoteElement();
        expectedFinalElement.isMelisma = true;

        const expectedNextElement = new NoteElement();
        expectedNextElement.isMelisma = true;
        expectedNextElement.isMelismaStart = true;

        const element = melismaStart;
        const line = getLine(
          melismaStart,
          martyriaElement,
          tempoElement,
          expectedFinalElement,
          expectedNextElement,
        );
        const firstElementOnNextLine = null;

        const { finalElement, nextElement } =
          LayoutService.findFinalAndNextElement(
            line,
            element,
            firstElementOnNextLine,
            1,
          );

        expect(finalElement).toBe(expectedFinalElement);
        expect(nextElement).toBe(expectedNextElement);
      },
    );

    itif(!isHyphen).each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(
      `skips $type and ends in correct place (with next and consecutive continouous elements) [isHyphen=${isHyphen}]`,
      () => {
        const melismaStart = new NoteElement();
        melismaStart.isHyphen = isHyphen;
        melismaStart.isMelisma = true;
        melismaStart.isMelismaStart = true;

        const expectedNextElement = new TempoElement();
        const martyriaNote = new MartyriaElement();

        const expectedFinalElement = new NoteElement();
        expectedFinalElement.isMelisma = true;

        const newNote = new NoteElement();
        newNote.isMelisma = true;
        newNote.isMelismaStart = true;

        const element = melismaStart;
        const line = getLine(
          melismaStart,
          expectedFinalElement,
          expectedNextElement,
          martyriaNote,
          newNote,
        );
        const firstElementOnNextLine = null;

        const { finalElement, nextElement } =
          LayoutService.findFinalAndNextElement(
            line,
            element,
            firstElementOnNextLine,
            1,
          );

        expect(finalElement).toBe(expectedFinalElement);
        expect(nextElement).toBe(expectedNextElement);
      },
    );

    itif(!isHyphen).each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(`stops at $type [isHyphen=${isHyphen}]`, ({ expectedNextElement }) => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const element = melismaStart;
      const line = getLine(
        melismaStart,
        expectedFinalElement,
        expectedNextElement,
        new NoteElement(),
      );
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBe(expectedNextElement);
    });
  },
);

describe('LayoutService.mayShowLeadingLyricHyphen', () => {
  it('suppresses Greek start hyphens when Greek melismata are enabled', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = true;
    note.lyrics = 'τω';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup)).toBe(
      false,
    );
  });

  it('suppresses Greek continuation hyphens when Greek melismata are enabled', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = true;
    note.isMelisma = true;
    note.lyrics = '';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup, true)).toBe(
      false,
    );
  });

  it('allows non-Greek hyphens', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = true;
    note.lyrics = 'test';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup)).toBe(true);
  });

  it('allows Greek hyphens when Greek melismata are disabled', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.disableGreekMelismata = true;

    const note = new NoteElement();
    note.isHyphen = true;
    note.lyrics = 'τω';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup)).toBe(true);
  });

  it('does not allow non-hyphen notes', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = false;
    note.lyrics = 'τω';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup)).toBe(
      false,
    );
  });

  it('allows non-Greek continuation hyphens outside active Greek melismas', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = true;
    note.isMelisma = true;
    note.lyrics = '';

    expect(
      LayoutService.mayShowLeadingLyricHyphen(note, pageSetup, false),
    ).toBe(true);
  });

  it('allows Greek continuation hyphens when Greek melismata are disabled', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.disableGreekMelismata = true;

    const note = new NoteElement();
    note.isHyphen = true;
    note.isMelisma = true;
    note.lyrics = '';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup, true)).toBe(
      true,
    );
  });
});

describe('LayoutService.pickRichTextCut', () => {
  it('returns the largest offset that fits in the available space', () => {
    expect(LayoutService.pickRichTextCut([20, 40, 60], 0, 50)).toBe(40);
  });

  it('returns null when not even the first line fits', () => {
    expect(LayoutService.pickRichTextCut([20, 40, 60], 0, 10)).toBeNull();
  });

  it('ignores offsets at or below the current top', () => {
    expect(LayoutService.pickRichTextCut([20, 40, 60], 40, 30)).toBe(60);
    expect(LayoutService.pickRichTextCut([20, 40, 60], 40, 5)).toBeNull();
  });

  it('returns null when there are no offsets', () => {
    expect(LayoutService.pickRichTextCut([], 0, 50)).toBeNull();
  });

  it('accepts an offset within the sub-pixel tolerance of the limit', () => {
    expect(LayoutService.pickRichTextCut([50.4], 0, 50)).toBe(50.4);
  });
});

describe('LayoutService.computeRichTextBoxSlices', () => {
  const offsets = [20, 40, 60, 80, 100];

  it('returns a single slice when everything fits', () => {
    expect(
      LayoutService.computeRichTextBoxSlices(offsets, 100, 100, () => 100),
    ).toEqual([{ offsetTop: 0, height: 100 }]);
  });

  it('cuts at line boundaries across two pages', () => {
    expect(
      LayoutService.computeRichTextBoxSlices(offsets, 100, 50, () => 100),
    ).toEqual([
      { offsetTop: 0, height: 40 },
      { offsetTop: 40, height: 60 },
    ]);
  });

  it('flows across three pages when continuation space is limited', () => {
    expect(
      LayoutService.computeRichTextBoxSlices(offsets, 100, 45, () => 45),
    ).toEqual([
      { offsetTop: 0, height: 40 },
      { offsetTop: 40, height: 40 },
      { offsetTop: 80, height: 20 },
    ]);
  });

  it('resolves available space per continuation page', () => {
    // The first continuation page is short (30px) while later pages are tall
    // (90px) -- e.g. a taller odd-page header. A single shared continuation
    // height would flow everything after the origin slice onto one page;
    // resolving per page forces the extra cut on the short page.
    expect(
      LayoutService.computeRichTextBoxSlices(
        [30, 60, 90, 120, 150],
        150,
        90,
        (continuationIndex) => (continuationIndex === 1 ? 30 : 90),
      ),
    ).toEqual([
      { offsetTop: 0, height: 90 },
      { offsetTop: 90, height: 30 },
      { offsetTop: 120, height: 30 },
    ]);
  });

  it('forces at least one line when the first line overflows the space', () => {
    expect(
      LayoutService.computeRichTextBoxSlices(offsets, 100, 15, () => 100),
    ).toEqual([
      { offsetTop: 0, height: 20 },
      { offsetTop: 20, height: 80 },
    ]);
  });

  it('keeps a single unbreakable line as one slice', () => {
    expect(
      LayoutService.computeRichTextBoxSlices([100], 100, 50, () => 100),
    ).toEqual([{ offsetTop: 0, height: 100 }]);
  });

  it('appends the total height when the offsets do not reach it', () => {
    // Final line offset is 80 but the content is 100px tall; the slicer must
    // still flow the remaining 20px (e.g. trailing padding) onto a page.
    expect(
      LayoutService.computeRichTextBoxSlices(
        [20, 40, 60, 80],
        100,
        50,
        () => 50,
      ),
    ).toEqual([
      { offsetTop: 0, height: 40 },
      { offsetTop: 40, height: 40 },
      { offsetTop: 80, height: 20 },
    ]);
  });
});

function getInlineTextBox() {
  const inlineTextBox = new TextBoxElement();
  inlineTextBox.inline = true;
  return inlineTextBox;
}

function getLine(...elements: ScoreElement[]) {
  const line = new Line();
  line.elements = elements;
  return line;
}

function getMockPageSetup() {
  const pageSetup = new PageSetup();
  pageSetup.neumeDefaultFontFamily = 'MockFont';
  return pageSetup;
}
