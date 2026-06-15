import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ScoreElement } from '../models/Element';
import {
  ElementType,
  LineBreakType,
  MartyriaElement,
  MeasureBarElement,
  NoteElement,
  TempoElement,
  TextBoxElement,
} from '../models/Element';
import { Ison, MeasureBar, QuantitativeNeume } from '../models/Neumes';
import { Line, Page } from '../models/Page';
import { PageSetup } from '../models/PageSetup';
import { Workspace } from '../models/Workspace';
import { fontService } from './FontService';
import { LayoutService } from './LayoutService';
import { NeumeMappingService } from './NeumeMappingService';
import { TextMeasurementService } from './TextMeasurementService';

vi.mock('./NeumeMappingService');
vi.mock('./FontService');

const itif = (condition: boolean) => (condition ? it : it.skip);

const testFontSize = 10;
const testNoteWidth = 10;
const testMeasureBarWidth = 4;
const testInlineSpacing = 20;

beforeEach(() => {
  vi.clearAllMocks();
  setupLayoutServiceMocks();
});

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

describe('LayoutService measure bar layout elements', () => {
  it('keeps natural note-to-note spacing unchanged for a non-colliding barline', () => {
    const pageSetup = getMockPageSetup();
    const measureBar = getMeasureBarElement(MeasureBar.MeasureBarRight);
    const baseGlue = {
      type: 'glue' as const,
      width: testInlineSpacing,
      stretch: 8,
      shrink: 6,
    };
    const measureBarWidthMap = getMeasureBarWidthMap();
    const leftGlue = (LayoutService as any).createMeasureBarSideGlue(
      getNote(),
      measureBar,
      getNote(),
      'left',
      baseGlue,
      pageSetup,
      measureBarWidthMap,
    );
    const rightGlue = (LayoutService as any).createMeasureBarSideGlue(
      getNote(),
      measureBar,
      getNote(),
      'right',
      baseGlue,
      pageSetup,
      measureBarWidthMap,
    );
    const leftNote = getNote();
    leftNote.measureBarRight = MeasureBar.MeasureBarRight;
    const withBarLine = processScore(leftNote, getNote());

    expect(getMeasureBars(withBarLine)).toHaveLength(1);
    expect(
      leftGlue.width + testMeasureBarWidth + rightGlue.width,
    ).toBeCloseTo(testInlineSpacing);
  });

  it('adds room when a barline collision region requires more space', () => {
    const noBarGap = getNoteGap(processScore(getNote(), getNote()));

    setupLayoutServiceMocks({
      collisionRegionMeasureBars: new Set([MeasureBar.MeasureBarTheseos]),
    });

    const leftNote = getNote();
    leftNote.measureBarRight = MeasureBar.MeasureBarTheseos;
    const withTheseos = processScore(leftNote, getNote());

    expect(getNoteGap(withTheseos)).toBeGreaterThan(noBarGap);
  });

  it('uses equal stretch and shrink around a barline', () => {
    const pageSetup = getMockPageSetup();
    const measureBar = getMeasureBarElement(MeasureBar.MeasureBarRight);
    const baseGlue = {
      type: 'glue' as const,
      width: testInlineSpacing,
      stretch: 8,
      shrink: 6,
    };
    const measureBarWidthMap = getMeasureBarWidthMap();

    const leftGlue = (LayoutService as any).createMeasureBarSideGlue(
      getNote(),
      measureBar,
      getNote(),
      'left',
      baseGlue,
      pageSetup,
      measureBarWidthMap,
    );
    const rightGlue = (LayoutService as any).createMeasureBarSideGlue(
      getNote(),
      measureBar,
      getNote(),
      'right',
      baseGlue,
      pageSetup,
      measureBarWidthMap,
    );

    expect(leftGlue.stretch).toBe(rightGlue.stretch);
    expect(leftGlue.shrink).toBe(rightGlue.shrink);
  });

  it.each([
    MeasureBar.MeasureBarTheseos,
    MeasureBar.MeasureBarShortTheseos,
  ])(
    'enforces minimum collision clearance for %s collision regions',
    (measureBar) => {
      setupLayoutServiceMocks({
        collisionRegionMeasureBars: new Set([measureBar]),
      });

      const leftNote = getNote();
      leftNote.measureBarRight = measureBar;
      const line = processScore(leftNote, getNote());
      const bar = getMeasureBars(line)[0];
      const rightNote = getNotes(line)[1];

      const collisionRegionRight =
        bar.x + testMeasureBarWidth + testInlineSpacing;
      expect(rightNote.x - collisionRegionRight).toBeGreaterThanOrEqual(
        testInlineSpacing,
      );
    },
  );

  it('flushes first-line and last-line barline ink boundaries to page margins', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.leftMargin = 7;
    pageSetup.rightMargin = 11;
    pageSetup.pageWidth = 200;

    const firstBar = getMeasureBarElement(MeasureBar.MeasureBarRight);
    firstBar.width = testMeasureBarWidth;
    const lastBar = getMeasureBarElement(MeasureBar.MeasureBarRight);
    lastBar.width = testMeasureBarWidth;
    const page = new Page();
    page.lines = [getLine(firstBar, getNote()), getLine(getNote(), lastBar)];

    (LayoutService as any).alignTerminalMeasureBarElements([page], pageSetup);

    expect(firstBar.x).toBe(pageSetup.leftMargin);
    expect(lastBar.x + lastBar.width).toBe(
      pageSetup.pageWidth - pageSetup.rightMargin,
    );
  });

  it('transfers a line-start note left barline to the previous line', () => {
    const firstNote = getNote();
    firstNote.lineBreak = true;
    firstNote.lineBreakType = LineBreakType.Justify;
    const secondNote = getNote();
    secondNote.measureBarLeft = MeasureBar.MeasureBarRight;

    const pages = LayoutService.processPages(
      getWorkspace(firstNote, secondNote),
    );
    const firstLine = pages[0].lines[0];
    const secondLine = pages[0].lines[1];
    const transferredBar = last(firstLine.elements) as MeasureBarElement;

    expect(transferredBar.elementType).toBe(ElementType.MeasureBar);
    expect(transferredBar.isTransferred).toBe(true);
    expect(transferredBar.sourceElement).toBe(secondNote);
    expect(first(secondLine.elements)?.elementType).toBe(
      ElementType.MeasureBar,
    );
    expect((first(secondLine.elements) as MeasureBarElement).isTransferred).toBe(
      false,
    );
    expect(secondLine.elements[1]).toBe(secondNote);
    expect(secondNote.x).toBeGreaterThanOrEqual(
      (first(secondLine.elements) as MeasureBarElement).x +
        (first(secondLine.elements) as MeasureBarElement).width +
        testInlineSpacing,
    );
  });

  it('does not strand a left-owned barline without its note at a line end', () => {
    const firstNote = getNote();
    const secondNote = getNote();
    secondNote.measureBarLeft = MeasureBar.MeasureBarRight;

    const workspace = getWorkspace(firstNote, secondNote);
    workspace.score.pageSetup.pageWidth = 26;
    const pages = LayoutService.processPages(workspace);
    const firstLine = pages[0].lines[0];
    const secondLine = pages[0].lines[1];
    const transferredBar = last(firstLine.elements) as MeasureBarElement;
    const originalBar = first(secondLine.elements) as MeasureBarElement;

    expect(firstLine.elements).not.toContain(originalBar);
    expect(transferredBar.elementType).toBe(ElementType.MeasureBar);
    expect(transferredBar.isTransferred).toBe(true);
    expect(transferredBar.sourceElement).toBe(secondNote);
    expect(originalBar.elementType).toBe(ElementType.MeasureBar);
    expect(originalBar.isTransferred).toBe(false);
    expect(originalBar.sourceElement).toBe(secondNote);
    expect(secondLine.elements[1]).toBe(secondNote);
  });

  it('keeps a paragraph-start note left barline visible with leading spacing', () => {
    const note = getNote();
    note.measureBarLeft = MeasureBar.MeasureBarRight;

    const pages = LayoutService.processPages(getWorkspace(note));
    const line = pages[0].lines[0];
    const originalBar = first(line.elements) as MeasureBarElement;

    expect(originalBar.elementType).toBe(ElementType.MeasureBar);
    expect(originalBar.isTransferred).toBe(false);
    expect(originalBar.sourceElement).toBe(note);
    expect(line.elements[1]).toBe(note);
    expect(note.x).toBeGreaterThanOrEqual(
      originalBar.x + originalBar.width + testInlineSpacing,
    );
  });

  it.each([
    {
      name: 'right',
      apply: (martyria: MartyriaElement) => {
        martyria.measureBarRight = MeasureBar.MeasureBarRight;
      },
    },
    {
      name: 'Above',
      apply: (martyria: MartyriaElement) => {
        martyria.measureBarLeft = MeasureBar.MeasureBarShortTheseosAbove;
      },
    },
  ])(
    'transfers a martyria $name barline before the next line note',
    ({ apply }) => {
      const martyria = new MartyriaElement();
      martyria.lineBreak = true;
      martyria.lineBreakType = LineBreakType.Justify;
      apply(martyria);
      const note = getNote();

      const workspace = getWorkspace(martyria, note);
      const rightEdge =
        workspace.score.pageSetup.pageWidth -
        workspace.score.pageSetup.rightMargin;
      const pages = LayoutService.processPages(workspace);
      const firstLine = pages[0].lines[0];
      const secondLine = pages[0].lines[1];
      const transferredBar = first(secondLine.elements) as MeasureBarElement;

      expect(transferredBar.elementType).toBe(ElementType.MeasureBar);
      expect(transferredBar.isTransferred).toBe(true);
      expect(transferredBar.sourceElement).toBe(martyria);
      if (martyria.measureBarRight != null) {
        const originalBar = last(firstLine.elements) as MeasureBarElement;
        expect(originalBar.elementType).toBe(ElementType.MeasureBar);
        expect(originalBar.isTransferred).toBe(false);
        expect(originalBar.sourceElement).toBe(martyria);
      } else {
        expect(last(firstLine.elements)).toBe(martyria);
      }
      expect(transferredBar.x).toBeGreaterThanOrEqual(0);
      expect(note.x).toBeGreaterThanOrEqual(
        transferredBar.x + transferredBar.width + testInlineSpacing,
      );
      expect(martyria.x + martyria.width).toBeLessThanOrEqual(rightEdge);
      expect(secondLine.elements[1]).toBe(note);
    },
  );

  it('reserves transferred martyria barline spacing before breaking the next line', () => {
    const martyria = new MartyriaElement();
    martyria.lineBreak = true;
    martyria.lineBreakType = LineBreakType.Justify;
    martyria.measureBarRight = MeasureBar.MeasureBarRight;
    const firstNote = getNote();
    const secondNote = getNote();

    const workspace = getWorkspace(martyria, firstNote, secondNote);
    workspace.score.pageSetup.pageWidth = 40;
    const pages = LayoutService.processPages(workspace);
    const lines = pages[0].lines;
    const rightEdge =
      workspace.score.pageSetup.pageWidth -
      workspace.score.pageSetup.rightMargin;

    expect(lines[1].elements).toContain(firstNote);
    for (const line of lines) {
      const lineLastElement = last(line.elements);
      expect(lineLastElement.x + lineLastElement.width).toBeLessThanOrEqual(
        rightEdge,
      );
    }
  });

  it('keeps an automatically transferred martyria right barline with the next note', () => {
    const martyria = new MartyriaElement();
    martyria.measureBarRight = MeasureBar.MeasureBarRight;
    const note = getNote();

    const workspace = getWorkspace(martyria, note);
    workspace.score.pageSetup.pageWidth = 40;
    const pages = LayoutService.processPages(workspace);
    const firstLine = pages[0].lines[0];
    const secondLine = pages[0].lines[1];
    const transferredBar = first(secondLine.elements) as MeasureBarElement;

    const originalBar = last(firstLine.elements) as MeasureBarElement;
    expect(originalBar.elementType).toBe(ElementType.MeasureBar);
    expect(originalBar.isTransferred).toBe(false);
    expect(originalBar.sourceElement).toBe(martyria);
    expect(transferredBar.elementType).toBe(ElementType.MeasureBar);
    expect(transferredBar.sourceElement).toBe(martyria);
    expect(secondLine.elements[1]).toBe(note);
  });

  it('spaces note-owned right bars and following-note left bars the same way', () => {
    const leftOwned = getNote();
    leftOwned.measureBarRight = MeasureBar.MeasureBarRight;
    const rightBarLine = processScore(leftOwned, getNote());

    const rightOwned = getNote();
    rightOwned.measureBarLeft = MeasureBar.MeasureBarRight;
    const leftBarLine = processScore(getNote(), rightOwned);

    expect(getNoteGap(rightBarLine)).toBeCloseTo(getNoteGap(leftBarLine));
  });

  it('does not let wide lyrics on a left-barred note widen barline spacing', () => {
    const normalLyricNote = getNote();
    normalLyricNote.measureBarLeft = MeasureBar.MeasureBarRight;
    const normalLyricLine = processScore(getNote(), normalLyricNote);

    const wideLyricNote = getNote();
    wideLyricNote.measureBarLeft = MeasureBar.MeasureBarRight;
    wideLyricNote.lyrics = 'very wide lyrics';
    const wideLyricLine = processScore(getNote(), wideLyricNote);

    expect(getNoteGap(wideLyricLine)).toBeCloseTo(
      getNoteGap(normalLyricLine),
    );
  });

  it('preserves a following left-barred note lyric overhang in note spacing', () => {
    const plainRightNote = getNote();
    plainRightNote.lyrics = 'wide right lyrics';
    const plainLine = processScore(getNote(), plainRightNote);

    const barredRightNote = getNote();
    barredRightNote.lyrics = 'wide right lyrics';
    barredRightNote.measureBarLeft = MeasureBar.MeasureBarRight;
    const barredLine = processScore(getNote(), barredRightNote);

    expect(getNoteGap(barredLine)).toBeGreaterThanOrEqual(
      getNoteGap(plainLine),
    );
  });

  it('keeps martyria spacing balanced when a barline precedes the martyria', () => {
    setupLayoutServiceMocks({ martyriaGlueWidth: 30 });

    const leftNote = getNote();
    leftNote.measureBarRight = MeasureBar.MeasureBarRight;
    const martyria = new MartyriaElement();
    const rightNote = getNote();
    const line = processScore(leftNote, martyria, rightNote);

    const leftBoundary = martyria.x - (leftNote.x + leftNote.width);
    const rightBoundary = rightNote.x - (martyria.x + martyria.width);

    expect(leftBoundary).toBeCloseTo(rightBoundary);
    expect(getMeasureBars(line)).toHaveLength(1);
  });

  it('preserves lyric-aware note-to-martyria spacing with a barline before the martyria', () => {
    setupLayoutServiceMocks({ martyriaGlueWidth: 30 });

    const plainLeftNote = getNote();
    plainLeftNote.lyrics = 'wide left lyrics';
    const plainMartyria = new MartyriaElement();
    const plainRightNote = getNote();
    const plainLine = processScore(
      plainLeftNote,
      plainMartyria,
      plainRightNote,
    );

    const barredLeftNote = getNote();
    barredLeftNote.lyrics = 'wide left lyrics';
    barredLeftNote.measureBarRight = MeasureBar.MeasureBarRight;
    const barredMartyria = new MartyriaElement();
    const barredRightNote = getNote();
    const barredLine = processScore(
      barredLeftNote,
      barredMartyria,
      barredRightNote,
    );
    const bar = getMeasureBars(barredLine)[0];
    const { leftProjection } = (LayoutService as any).getLyricProjections(
      barredRightNote,
      barredRightNote.alignLeft,
    );

    expect(
      Math.abs(
        barredMartyria.x -
          (barredLeftNote.x + barredLeftNote.width) -
          (plainMartyria.x - (plainLeftNote.x + plainLeftNote.width)),
      ),
    ).toBeLessThan(0.1);
    expect(
      Math.abs(
        barredRightNote.x -
          (barredMartyria.x + barredMartyria.width) -
          (plainRightNote.x - (plainMartyria.x + plainMartyria.width)),
      ),
    ).toBeLessThan(0.1);
    expect(bar.x - (barredLeftNote.x + barredLeftNote.width)).toBeCloseTo(
      barredMartyria.x - (bar.x + bar.width),
    );
  });

  it('keeps martyria spacing balanced when a barline follows the martyria', () => {
    setupLayoutServiceMocks({ martyriaGlueWidth: 30 });

    const leftNote = getNote();
    const martyria = new MartyriaElement();
    martyria.measureBarRight = MeasureBar.MeasureBarRight;
    const rightNote = getNote();
    const line = processScore(leftNote, martyria, rightNote);

    const leftBoundary = martyria.x - (leftNote.x + leftNote.width);
    const rightBoundary = rightNote.x - (martyria.x + martyria.width);

    expect(leftBoundary).toBeCloseTo(rightBoundary);
    expect(getMeasureBars(line)).toHaveLength(1);
  });

  it('preserves martyria-to-note spacing with a barline after the martyria', () => {
    setupLayoutServiceMocks({ martyriaGlueWidth: 30 });

    const plainLeftNote = getNote();
    const plainMartyria = new MartyriaElement();
    const plainRightNote = getNote();
    const plainLine = processScore(
      plainLeftNote,
      plainMartyria,
      plainRightNote,
    );

    const barredLeftNote = getNote();
    const barredMartyria = new MartyriaElement();
    barredMartyria.measureBarRight = MeasureBar.MeasureBarRight;
    const barredRightNote = getNote();
    const barredLine = processScore(
      barredLeftNote,
      barredMartyria,
      barredRightNote,
    );
    const bar = getMeasureBars(barredLine)[0];

    expect(
      Math.abs(
        barredMartyria.x -
          (barredLeftNote.x + barredLeftNote.width) -
          (plainMartyria.x - (plainLeftNote.x + plainLeftNote.width)),
      ),
    ).toBeLessThan(0.1);
    expect(
      Math.abs(
        barredRightNote.x -
          (barredMartyria.x + barredMartyria.width) -
          (plainRightNote.x - (plainMartyria.x + plainMartyria.width)),
      ),
    ).toBeLessThan(0.1);
    expect(bar.x - (barredMartyria.x + barredMartyria.width)).toBeCloseTo(
      barredRightNote.x - (bar.x + bar.width),
    );
  });

  it('preserves lyric-aware martyria-to-note spacing with a barline after the martyria', () => {
    setupLayoutServiceMocks({ martyriaGlueWidth: 30 });

    const plainLeftNote = getNote();
    const plainMartyria = new MartyriaElement();
    const plainRightNote = getNote();
    plainRightNote.lyrics = 'wide right lyrics';
    const plainLine = processScore(
      plainLeftNote,
      plainMartyria,
      plainRightNote,
    );

    const barredLeftNote = getNote();
    const barredMartyria = new MartyriaElement();
    barredMartyria.measureBarRight = MeasureBar.MeasureBarRight;
    const barredRightNote = getNote();
    barredRightNote.lyrics = 'wide right lyrics';
    const barredLine = processScore(
      barredLeftNote,
      barredMartyria,
      barredRightNote,
    );
    const bar = getMeasureBars(barredLine)[0];
    const { leftProjection } = (LayoutService as any).getLyricProjections(
      barredRightNote,
      barredRightNote.alignLeft,
    );
    expect(
      Math.abs(
        barredMartyria.x -
          (barredLeftNote.x + barredLeftNote.width) -
          (plainMartyria.x - (plainLeftNote.x + plainLeftNote.width)),
      ),
    ).toBeLessThan(0.1);
    expect(
      Math.abs(
        barredRightNote.x -
          (barredMartyria.x + barredMartyria.width) +
          leftProjection -
          (plainRightNote.x - (plainMartyria.x + plainMartyria.width)),
      ),
    ).toBeLessThan(0.1);
    expect(bar.x - (barredMartyria.x + barredMartyria.width)).toBeCloseTo(
      barredRightNote.x - leftProjection - (bar.x + bar.width),
    );
  });

  it('preserves long-lyric note spacing when a barline is inserted between notes', () => {
    const plainLeftNote = getNote();
    plainLeftNote.lyrics = 'wide left lyrics';
    const plainRightNote = getNote();
    plainRightNote.lyrics = 'wide right lyrics';
    const plainLine = processScore(plainLeftNote, plainRightNote);

    const barredLeftNote = getNote();
    barredLeftNote.lyrics = 'wide left lyrics';
    barredLeftNote.measureBarRight = MeasureBar.MeasureBarRight;
    const barredRightNote = getNote();
    barredRightNote.lyrics = 'wide right lyrics';
    const barredLine = processScore(barredLeftNote, barredRightNote);

    expect(getNoteGap(barredLine)).toBeGreaterThanOrEqual(
      getNoteGap(plainLine),
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
  pageSetup.neumeDefaultFontSize = testFontSize;
  pageSetup.neumeDefaultSpacing = 0;
  pageSetup.pageWidth = 500;
  pageSetup.pageHeight = 500;
  pageSetup.leftMargin = 0;
  pageSetup.rightMargin = 0;
  pageSetup.topMargin = 0;
  pageSetup.bottomMargin = 0;
  pageSetup.lineHeight = 40;
  pageSetup.alignIsonIndicators = false;
  return pageSetup;
}

function setupLayoutServiceMocks(args?: {
  collisionRegionMeasureBars?: Set<MeasureBar>;
  martyriaGlueWidth?: number;
}) {
  (fontService.getMetrics as Mock).mockReturnValue({ oligonMidpoint: 0 });
  (fontService.getStandardGlue as Mock).mockReturnValue({
    width: testInlineSpacing / testFontSize,
    stretch: 0.8,
    shrink: 0.4,
  });
  (fontService.getMartyriaGlue as Mock).mockReturnValue({
    width: (args?.martyriaGlueWidth ?? testInlineSpacing) / testFontSize,
    stretch: 0.8,
    shrink: 0.4,
  });
  (fontService.getVareiaGap as Mock).mockReturnValue(0);
  (fontService.resolveContextualSubstitutions as Mock).mockImplementation(
    (_fontFamily, glyphs: string[]) => glyphs,
  );
  (fontService.getMarkOffset as Mock).mockReturnValue({ x: 0, y: 0 });
  (fontService.getMarkAnchorOffset as Mock).mockReturnValue({ x: 0, y: 0 });
  (fontService.getGlyphBBox as Mock).mockImplementation((_font, glyph) =>
    getGlyphBBox(glyph),
  );
  (fontService.getGlyphCollisionRegions as Mock).mockImplementation(
    (_font, glyph) => {
      const measureBar = getMeasureBarForGlyph(glyph);
      return measureBar != null &&
        args?.collisionRegionMeasureBars?.has(measureBar)
        ? [
            {
              name: 'barline',
              bBoxSW: [0, 0],
              bBoxNE: [
                (testMeasureBarWidth + testInlineSpacing) / testFontSize,
                1,
              ],
            },
          ]
        : [];
    },
  );
  (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
    const glyphName = String(neume);
    return {
      text: glyphName,
      glyphName,
    };
  });

  vi.spyOn(TextMeasurementService, 'getTextWidth').mockImplementation((text) =>
    getMockTextWidth(text),
  );
  vi.spyOn(TextMeasurementService, 'getInkBounds').mockImplementation(
    (text) => {
      const width = getMockTextWidth(text);
      return {
        advanceWidth: width,
        inkLeft: 0,
        inkRight: width,
        inkWidth: width,
        leftOverhang: 0,
        rightOverhang: 0,
      };
    },
  );
  vi.spyOn(TextMeasurementService, 'getFontHeight').mockReturnValue(20);
  vi.spyOn(
    TextMeasurementService,
    'getFontBoundingBoxAscent',
  ).mockReturnValue(15);
  vi.spyOn(
    TextMeasurementService,
    'getFontBoundingBoxDescent',
  ).mockReturnValue(5);
}

function getMockTextWidth(text: string) {
  if (Object.values(MeasureBar).includes(text as MeasureBar)) {
    return testMeasureBarWidth;
  }

  if (text === 'wide left lyrics' || text === 'wide right lyrics') {
    return testNoteWidth * 3;
  }

  if (text === '' || text == null) {
    return 0;
  }

  if (text === '-' || text === ' ') {
    return 2;
  }

  return testNoteWidth;
}

function getGlyphBBox(glyph: string) {
  const width = getMockTextWidth(glyph);
  if (getMeasureBarForGlyph(glyph) != null) {
    return {
      bBoxSW: [0, 2],
      bBoxNE: [width / testFontSize, 3],
    };
  }

  return {
    bBoxSW: [0, 0],
    bBoxNE: [width / testFontSize, 1],
  };
}

function getMeasureBarForGlyph(glyph: string) {
  return Object.values(MeasureBar).find((measureBar) => measureBar === glyph);
}

function getMeasureBarWidthMap() {
  return new Map<MeasureBar, number>(
    Object.values(MeasureBar).map((measureBar) => [
      measureBar,
      testMeasureBarWidth,
    ]),
  );
}

function getNote() {
  const note = new NoteElement();
  note.quantitativeNeume = QuantitativeNeume.Ison;
  note.neumeWidth = testNoteWidth;
  return note;
}

function getMeasureBarElement(measureBar: MeasureBar) {
  const element = new MeasureBarElement();
  element.measureBar = measureBar;
  return element;
}

function getWorkspace(...elements: ScoreElement[]) {
  const workspace = new Workspace();
  workspace.score.pageSetup = getMockPageSetup();
  workspace.score.staff.elements = elements;
  return workspace;
}

function processScore(...elements: ScoreElement[]) {
  return LayoutService.processPages(getWorkspace(...elements))[0].lines[0];
}

function getNotes(line: Line) {
  return line.elements.filter(
    (element): element is NoteElement => element.elementType === ElementType.Note,
  );
}

function getMeasureBars(line: Line) {
  return line.elements.filter(
    (element): element is MeasureBarElement =>
      element.elementType === ElementType.MeasureBar,
  );
}

function getNoteGap(line: Line) {
  const notes = getNotes(line);
  return notes[1].x - (notes[0].x + notes[0].width);
}

function first<T>(items: T[]) {
  return items[0];
}

function last<T>(items: T[]) {
  return items[items.length - 1];
}
