import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';

import type { ScoreElement } from '../models/Element';
import {
  MartyriaElement,
  NoteElement,
  TempoElement,
  TextBoxElement,
} from '../models/Element';
import { Ison, QuantitativeNeume } from '../models/Neumes';
import { Line, Page } from '../models/Page';
import { PageSetup } from '../models/PageSetup';
import { fontService } from './FontService';
import { LayoutService } from './LayoutService';
import { NeumeMappingService } from './NeumeMappingService';

vi.mock('./NeumeMappingService');
vi.mock('./FontService');

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

describe('LayoutService.alignIsonIndicators', () => {
  it('should adjust isonOffsetYAdjusted for notes with ison indicators', () => {
    const mockPageSetup = getMockPageSetup();

    const mockBaseMapping1 = { glyphName: 'baseGlyph1' };
    const mockBaseMapping2 = { glyphName: 'baseGlyph2' };
    const mockMarkMapping = { glyphName: 'markGlyph' };

    const mockOffset1 = { y: 10 };
    const mockOffset2 = { y: 20 };

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return mockBaseMapping1;
      }
      if (neume === QuantitativeNeume.Oligon) {
        return mockBaseMapping2;
      }
      return mockMarkMapping;
    });

    (fontService.getMarkAnchorOffset as Mock).mockImplementation(
      (fontFamily, base) => {
        if (base === 'baseGlyph1') {
          return mockOffset1;
        }
        if (base === 'baseGlyph2') {
          return mockOffset2;
        }
        return { y: 0 };
      },
    );

    const note1 = new NoteElement();
    note1.quantitativeNeume = QuantitativeNeume.Ison;
    note1.ison = Ison.Unison;

    const note2 = new NoteElement();
    note2.quantitativeNeume = QuantitativeNeume.Oligon;
    note2.ison = Ison.Unison;

    const line = getLine(note1, note2);

    const page = new Page();
    page.lines = [line];

    LayoutService.alignIsonIndicators([page], mockPageSetup);

    expect(note1.computedIsonOffsetY).toBe(0); // minOffset - totalOffset + isonOffsetY
    expect(note2.computedIsonOffsetY).toBe(-10); // minOffset - totalOffset + isonOffsetY
  });

  it('should adjust isonOffsetYAdjusted for notes with ison indicators and ison offsets', () => {
    const mockPageSetup = getMockPageSetup();

    const mockBaseMapping1 = { glyphName: 'baseGlyph1' };
    const mockBaseMapping2 = { glyphName: 'baseGlyph2' };
    const mockMarkMapping = { glyphName: 'markGlyph' };

    const mockOffset1 = { y: 10 };
    const mockOffset2 = { y: 20 };

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return mockBaseMapping1;
      }
      if (neume === QuantitativeNeume.Oligon) {
        return mockBaseMapping2;
      }
      return mockMarkMapping;
    });

    (fontService.getMarkAnchorOffset as Mock).mockImplementation(
      (fontFamily, base) => {
        if (base === 'baseGlyph1') {
          return mockOffset1;
        }
        if (base === 'baseGlyph2') {
          return mockOffset2;
        }
        return { y: 0 };
      },
    );

    const note1 = new NoteElement();
    note1.quantitativeNeume = QuantitativeNeume.Ison;
    note1.ison = Ison.Unison;
    note1.isonOffsetY = -5;

    const note2 = new NoteElement();
    note2.quantitativeNeume = QuantitativeNeume.Oligon;
    note2.ison = Ison.Unison;
    note2.isonOffsetY = -25;

    const line = getLine(note1, note2);

    const page = new Page();
    page.lines = [line];

    LayoutService.alignIsonIndicators([page], mockPageSetup);

    expect(note1.computedIsonOffsetY).toBe(-15); // minOffset - totalOffset + isonOffsetY
    expect(note2.computedIsonOffsetY).toBe(-25); // minOffset - totalOffset + isonOffsetY
  });

  it('should handle cases with no notes having ison indicators', () => {
    const mockPageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.Ison;
    note.ison = null;

    const line = getLine(note);

    const page = new Page();
    page.lines = [line];

    LayoutService.alignIsonIndicators([page], mockPageSetup);

    expect(note.computedIsonOffsetY).toBeNull();
  });

  it('should handle empty pages gracefully', () => {
    const mockPageSetup = getMockPageSetup();

    const page = new Page();
    page.lines = [];

    expect(() =>
      LayoutService.alignIsonIndicators([page], mockPageSetup),
    ).not.toThrow();
  });
});

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
