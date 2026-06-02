import type { Mock } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ScoreElement } from '../models/Element';
import {
  EmptyElement,
  MartyriaElement,
  NoteElement,
  TempoElement,
  TextBoxElement,
} from '../models/Element';
import {
  Ison,
  GorgonNeume,
  MeasureBar,
  QuantitativeNeume,
  VocalExpressionNeume,
} from '../models/Neumes';
import { Line, Page } from '../models/Page';
import { PageSetup } from '../models/PageSetup';
import { fontService } from './FontService';
import { LayoutService } from './LayoutService';
import { NeumeMappingService } from './NeumeMappingService';

vi.mock('./NeumeMappingService');
vi.mock('./FontService');

const itif = (condition: boolean) => (condition ? it : it.skip);

describe('LayoutService.getGlueWidthBetween', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses trailing spacing from the left glyph and leading spacing from the right glyph', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const left = new NoteElement();
    left.quantitativeNeume = QuantitativeNeume.Ison;

    const right = new NoteElement();
    right.quantitativeNeume = QuantitativeNeume.Oligon;

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      if (neume === QuantitativeNeume.Oligon) {
        return { glyphName: 'oligonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getTrailingSpace as Mock).mockReturnValue(1.2);
    (fontService.getLeadingSpace as Mock).mockReturnValue(0.4);

    expect(LayoutService.getGlueWidthBetween(left, right, pageSetup)).toBe(19);
    expect(fontService.getTrailingSpace).toHaveBeenCalledWith(
      'MockFont',
      'isonGlyph',
    );
    expect(fontService.getLeadingSpace).toHaveBeenCalledWith(
      'MockFont',
      'oligonGlyph',
    );
  });

  it('uses vareia as the leading glyph when the following note has a vareia', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const left = new NoteElement();
    left.quantitativeNeume = QuantitativeNeume.Ison;

    const right = new NoteElement();
    right.quantitativeNeume = QuantitativeNeume.Oligon;
    right.vareia = true;

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      if (neume === QuantitativeNeume.Oligon) {
        return { glyphName: 'oligonGlyph' };
      }
      if (neume === VocalExpressionNeume.Vareia) {
        return { glyphName: 'vareiaGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getTrailingSpace as Mock).mockReturnValue(1.2);
    (fontService.getLeadingSpace as Mock).mockReturnValue(0.7);

    expect(LayoutService.getGlueWidthBetween(left, right, pageSetup)).toBe(22);
    expect(fontService.getLeadingSpace).toHaveBeenCalledWith(
      'MockFont',
      'vareiaGlyph',
    );
  });

  it('uses tempo glyph spacing before a following note', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const left = new TempoElement();
    const right = new NoteElement();
    right.quantitativeNeume = QuantitativeNeume.Oligon;

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === left.neume) {
        return { glyphName: 'tempoGlyph' };
      }
      if (neume === QuantitativeNeume.Oligon) {
        return { glyphName: 'oligonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getTrailingSpace as Mock).mockReturnValue(0.6);
    (fontService.getLeadingSpace as Mock).mockReturnValue(0.4);

    expect(LayoutService.getGlueWidthBetween(left, right, pageSetup)).toBe(13);
    expect(fontService.getTrailingSpace).toHaveBeenCalledWith(
      'MockFont',
      'tempoGlyph',
    );
    expect(fontService.getLeadingSpace).toHaveBeenCalledWith(
      'MockFont',
      'oligonGlyph',
    );
  });

  it('uses a contextually substituted trailing glyph inside the left note', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const left = new NoteElement();
    left.quantitativeNeume = QuantitativeNeume.Hyporoe;
    left.gorgonNeume = GorgonNeume.Gorgon_Top;

    const right = new NoteElement();
    right.quantitativeNeume = QuantitativeNeume.Oligon;

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Hyporoe) {
        return { glyphName: 'yporroi' };
      }
      if (neume === GorgonNeume.Gorgon_Top) {
        return { glyphName: 'gorgonAbove' };
      }
      if (neume === QuantitativeNeume.Oligon) {
        return { glyphName: 'oligonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getMetadata as Mock).mockReturnValue({
      contextualSubstitutions: [
        {
          inputGlyphs: [['yporroi']],
          backtrackGlyphs: [],
          lookaheadGlyphs: [['gorgonAbove']],
          substitutions: [
            {
              index: 0,
              from: 'yporroi',
              to: 'yporroi.gorgon',
            },
          ],
        },
      ],
    });
    (fontService.getTrailingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'yporroi.gorgon') {
        return 1.5;
      }
      if (glyph === 'yporroi') {
        return 0.4;
      }
      return 0;
    });
    (fontService.getLeadingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'oligonGlyph') {
        return 0.2;
      }
      return 0;
    });

    expect(LayoutService.getGlueWidthBetween(left, right, pageSetup)).toBe(20);
    expect(fontService.getTrailingSpace).toHaveBeenCalledWith(
      'MockFont',
      'yporroi.gorgon',
    );
  });

  it('uses a contextually substituted leading glyph inside the right note', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const left = new NoteElement();
    left.quantitativeNeume = QuantitativeNeume.Ison;

    const right = new NoteElement();
    right.quantitativeNeume = QuantitativeNeume.KentemataPlusOligon;
    right.vocalExpressionNeume = VocalExpressionNeume.Psifiston;

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      if (neume === QuantitativeNeume.KentemataPlusOligon) {
        return { glyphName: 'oligonKentimataBelow' };
      }
      if (neume === VocalExpressionNeume.Psifiston) {
        return { glyphName: 'psifiston' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getMetadata as Mock).mockReturnValue({
      contextualSubstitutions: [
        {
          inputGlyphs: [['oligonKentimataBelow'], ['psifiston']],
          backtrackGlyphs: [],
          lookaheadGlyphs: [],
          substitutions: [
            {
              index: 0,
              from: 'oligonKentimataBelow',
              to: 'oligonKentimataBelow.alt01',
            },
          ],
        },
      ],
    });
    (fontService.getTrailingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'isonGlyph') {
        return 0.6;
      }
      return 0;
    });
    (fontService.getLeadingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'oligonKentimataBelow.alt01') {
        return 0.8;
      }
      if (glyph === 'oligonKentimataBelow') {
        return 0.1;
      }
      return 0;
    });

    expect(LayoutService.getGlueWidthBetween(left, right, pageSetup)).toBe(17);
    expect(fontService.getLeadingSpace).toHaveBeenCalledWith(
      'MockFont',
      'oligonKentimataBelow.alt01',
    );
  });
});

describe('inline element spacing helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the previous neume trailing spacing before an inline element', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.Ison;
    const textBox = new TextBoxElement();
    textBox.inline = true;

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getTrailingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'isonGlyph') {
        return 0.4;
      }
      return 0;
    });

    const width = (
      LayoutService as any
    ).getTrailingGlueWidthBeforeInlineElement([note, textBox], 1, pageSetup);

    expect(width).toBe(7);
  });

  it('uses the following leading glyph spacing after an inline element', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const textBox = new TextBoxElement();
    textBox.inline = true;
    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.Oligon;
    note.vareia = true;

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === VocalExpressionNeume.Vareia) {
        return { glyphName: 'vareiaGlyph' };
      }
      if (neume === QuantitativeNeume.Oligon) {
        return { glyphName: 'oligonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getLeadingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'vareiaGlyph') {
        return 0.25;
      }
      return 0;
    });

    const width = (LayoutService as any).getLeadingGlueWidthAfterInlineElement(
      [textBox, note],
      0,
      pageSetup,
    );

    expect(width).toBe(5.5);
  });

  it('uses pair glue before a martyria after a note', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.Ison;
    const martyria = new MartyriaElement();

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      if (neume === martyria.note) {
        return { glyphName: 'martyriaGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getTrailingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'isonGlyph') {
        return 0.4;
      }
      return 0;
    });
    (fontService.getLeadingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'martyriaGlyph') {
        return 0.2;
      }
      return 0;
    });

    const width = (LayoutService as any).getLeadingGlueWidthBeforeElement(
      [note, martyria],
      1,
      pageSetup,
    );

    expect(width).toBe(9);
  });

  it('uses following neume leading spacing before a tempo after an inline element', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const textBox = new TextBoxElement();
    textBox.inline = true;
    const tempo = new TempoElement();

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === tempo.neume) {
        return { glyphName: 'tempoGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getLeadingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'tempoGlyph') {
        return 0.35;
      }
      return 0;
    });

    const width = (LayoutService as any).getLeadingGlueWidthBeforeElement(
      [textBox, tempo],
      1,
      pageSetup,
    );

    expect(width).toBe(6.5);
  });
});

describe('LayoutService.centerMeasureBars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      if (neume === QuantitativeNeume.Oligon) {
        return { glyphName: 'oligonGlyph' };
      }
      if (neume === QuantitativeNeume.Hyporoe) {
        return { glyphName: 'yporroi' };
      }
      if (neume === VocalExpressionNeume.Vareia) {
        return { glyphName: 'vareiaGlyph' };
      }
      if (neume === GorgonNeume.Gorgon_Top) {
        return { glyphName: 'gorgonAbove' };
      }
      return { glyphName: 'otherGlyph' };
    });
    (fontService.getMetadata as Mock).mockReturnValue({
      contextualSubstitutions: [],
    });
  });

  it('keeps a right-side measure bar centered even when the following note has vareia', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.melkiteRtl = false;

    const measureBarWidthMap = new Map<MeasureBar, number>([
      [MeasureBar.MeasureBarRight, 10],
    ]);

    const layoutAny = LayoutService as any;
    const originalGetNeumeWidthFromCache = layoutAny.getNeumeWidthFromCache;
    const originalGetGlyphWidthFromCache = layoutAny.getGlyphWidthFromCache;
    layoutAny.getNeumeWidthFromCache = vi.fn((...args: unknown[]) => {
      const neume = args[1];
      if (neume === VocalExpressionNeume.Vareia) {
        return 20;
      }
      return 0;
    });
    layoutAny.getGlyphWidthFromCache = vi.fn((...args: unknown[]) => {
      const glyphName = args[1];
      if (glyphName === 'vareiaGlyph') {
        return 20;
      }
      if (glyphName === 'isonGlyph') {
        return 100;
      }
      if (glyphName === 'oligonGlyph') {
        return 90;
      }
      return 0;
    });

    try {
      const pageWithoutVareia = new Page();
      const lineWithoutVareia = new Line();
      const ownerWithoutVareia = new NoteElement();
      ownerWithoutVareia.quantitativeNeume = QuantitativeNeume.Ison;
      ownerWithoutVareia.measureBarRight = MeasureBar.MeasureBarRight;
      ownerWithoutVareia.x = 0;
      ownerWithoutVareia.neumeWidth = 110;
      const nextWithoutVareia = new NoteElement();
      nextWithoutVareia.quantitativeNeume = QuantitativeNeume.Oligon;
      nextWithoutVareia.x = 200;
      nextWithoutVareia.neumeWidth = 90;
      lineWithoutVareia.elements = [ownerWithoutVareia, nextWithoutVareia];
      pageWithoutVareia.lines = [lineWithoutVareia];

      const pageWithVareia = new Page();
      const lineWithVareia = new Line();
      const ownerWithVareia = new NoteElement();
      ownerWithVareia.quantitativeNeume = QuantitativeNeume.Ison;
      ownerWithVareia.measureBarRight = MeasureBar.MeasureBarRight;
      ownerWithVareia.x = 0;
      ownerWithVareia.neumeWidth = 110;
      const nextWithVareia = new NoteElement();
      nextWithVareia.quantitativeNeume = QuantitativeNeume.Oligon;
      nextWithVareia.vareia = true;
      nextWithVareia.vareiaInternalSpacing = 20;
      nextWithVareia.x = 200;
      nextWithVareia.neumeWidth = 110;
      lineWithVareia.elements = [ownerWithVareia, nextWithVareia];
      pageWithVareia.lines = [lineWithVareia];

      (layoutAny.centerMeasureBars as Function)(
        [pageWithoutVareia, pageWithVareia],
        pageSetup,
        measureBarWidthMap,
      );

      expect(ownerWithoutVareia.computedMeasureBarRightOffsetX).toBe(45);
      expect(ownerWithVareia.computedMeasureBarRightOffsetX).toBe(45);
    } finally {
      layoutAny.getNeumeWidthFromCache = originalGetNeumeWidthFromCache;
      layoutAny.getGlyphWidthFromCache = originalGetGlyphWidthFromCache;
    }
  });

  it('centers a right-side measure bar between a note and a following inline text box', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.melkiteRtl = false;

    const measureBarWidthMap = new Map<MeasureBar, number>([
      [MeasureBar.MeasureBarRight, 10],
    ]);

    const layoutAny = LayoutService as any;
    const originalGetGlyphWidthFromCache = layoutAny.getGlyphWidthFromCache;
    layoutAny.getGlyphWidthFromCache = vi.fn((...args: unknown[]) => {
      const glyphName = args[1];
      if (glyphName === 'isonGlyph') {
        return 100;
      }
      return 0;
    });

    try {
      const page = new Page();
      const line = new Line();
      const owner = new NoteElement();
      owner.quantitativeNeume = QuantitativeNeume.Ison;
      owner.measureBarRight = MeasureBar.MeasureBarRight;
      owner.x = 0;
      owner.neumeWidth = 110;
      const textBox = new TextBoxElement();
      textBox.inline = true;
      textBox.x = 200;
      textBox.width = 50;
      line.elements = [owner, textBox];
      page.lines = [line];

      layoutAny.centerMeasureBars([page], pageSetup, measureBarWidthMap);

      expect(owner.computedMeasureBarRightOffsetX).toBe(45);
    } finally {
      layoutAny.getGlyphWidthFromCache = originalGetGlyphWidthFromCache;
    }
  });

  it('centers a right-side measure bar using the substituted body width of the owning note', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.melkiteRtl = false;
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const measureBarWidthMap = new Map<MeasureBar, number>([
      [MeasureBar.MeasureBarRight, 10],
    ]);

    const owner = new NoteElement();
    owner.quantitativeNeume = QuantitativeNeume.Hyporoe;
    owner.gorgonNeume = GorgonNeume.Gorgon_Top;
    owner.measureBarRight = MeasureBar.MeasureBarRight;
    owner.x = 0;
    owner.neumeWidth = 110;

    const next = new NoteElement();
    next.quantitativeNeume = QuantitativeNeume.Ison;
    next.x = 200;
    next.neumeWidth = 100;

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Hyporoe) {
        return { glyphName: 'yporroi' };
      }
      if (neume === GorgonNeume.Gorgon_Top) {
        return { glyphName: 'gorgonAbove' };
      }
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getMetadata as Mock).mockReturnValue({
      contextualSubstitutions: [
        {
          inputGlyphs: [['yporroi']],
          backtrackGlyphs: [],
          lookaheadGlyphs: [['gorgonAbove']],
          substitutions: [
            {
              index: 0,
              from: 'yporroi',
              to: 'yporroi.gorgon',
            },
          ],
        },
      ],
    });

    const layoutAny = LayoutService as any;
    const originalGetTextWidth = layoutAny.getGlyphWidthFromCache;
    layoutAny.getGlyphWidthFromCache = vi.fn(
      (_cache: unknown, glyphName: string) => {
        if (glyphName === 'yporroi.gorgon') {
          return 120;
        }
        if (glyphName === 'yporroi') {
          return 100;
        }
        if (glyphName === 'isonGlyph') {
          return 100;
        }
        return 0;
      },
    );

    try {
      const page = new Page();
      const line = new Line();
      line.elements = [owner, next];
      page.lines = [line];

      layoutAny.centerMeasureBars([page], pageSetup, measureBarWidthMap);

      expect(owner.computedMeasureBarRightOffsetX).toBe(55);
    } finally {
      layoutAny.getGlyphWidthFromCache = originalGetTextWidth;
    }
  });

  it('centers a left-side measure bar using the substituted body width of the previous note', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.melkiteRtl = false;
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.neumeDefaultSpacing = 3;

    const measureBarWidthMap = new Map<MeasureBar, number>([
      [MeasureBar.MeasureBarRight, 10],
    ]);

    const previous = new NoteElement();
    previous.quantitativeNeume = QuantitativeNeume.Hyporoe;
    previous.gorgonNeume = GorgonNeume.Gorgon_Top;
    previous.x = 0;
    previous.neumeWidth = 110;

    const owner = new NoteElement();
    owner.quantitativeNeume = QuantitativeNeume.Ison;
    owner.measureBarLeft = MeasureBar.MeasureBarRight;
    owner.x = 200;
    owner.neumeWidth = 100;

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Hyporoe) {
        return { glyphName: 'yporroi' };
      }
      if (neume === GorgonNeume.Gorgon_Top) {
        return { glyphName: 'gorgonAbove' };
      }
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getMetadata as Mock).mockReturnValue({
      contextualSubstitutions: [
        {
          inputGlyphs: [['yporroi']],
          backtrackGlyphs: [],
          lookaheadGlyphs: [['gorgonAbove']],
          substitutions: [
            {
              index: 0,
              from: 'yporroi',
              to: 'yporroi.gorgon',
            },
          ],
        },
      ],
    });

    const layoutAny = LayoutService as any;
    const originalGetTextWidth = layoutAny.getGlyphWidthFromCache;
    layoutAny.getGlyphWidthFromCache = vi.fn(
      (_cache: unknown, glyphName: string) => {
        if (glyphName === 'yporroi.gorgon') {
          return 120;
        }
        if (glyphName === 'yporroi') {
          return 100;
        }
        if (glyphName === 'isonGlyph') {
          return 100;
        }
        return 0;
      },
    );

    try {
      const page = new Page();
      const line = new Line();
      line.elements = [previous, owner];
      page.lines = [line];

      layoutAny.centerMeasureBars([page], pageSetup, measureBarWidthMap);

      expect(owner.computedMeasureBarLeftOffsetX).toBe(-45);
    } finally {
      layoutAny.getGlyphWidthFromCache = originalGetTextWidth;
    }
  });

  it('centers a left-side measure bar between an inline text box and a following note', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.melkiteRtl = false;

    const measureBarWidthMap = new Map<MeasureBar, number>([
      [MeasureBar.MeasureBarRight, 10],
    ]);

    const layoutAny = LayoutService as any;
    const originalGetGlyphWidthFromCache = layoutAny.getGlyphWidthFromCache;
    layoutAny.getGlyphWidthFromCache = vi.fn((...args: unknown[]) => {
      const glyphName = args[1];
      if (glyphName === 'isonGlyph') {
        return 100;
      }
      return 0;
    });

    try {
      const page = new Page();
      const line = new Line();
      const textBox = new TextBoxElement();
      textBox.inline = true;
      textBox.x = 0;
      textBox.width = 50;
      const note = new NoteElement();
      note.quantitativeNeume = QuantitativeNeume.Ison;
      note.measureBarLeft = MeasureBar.MeasureBarRight;
      note.x = 140;
      note.neumeWidth = 110;
      line.elements = [textBox, note];
      page.lines = [line];

      layoutAny.centerMeasureBars([page], pageSetup, measureBarWidthMap);

      expect(note.computedMeasureBarLeftOffsetX).toBe(-50);
    } finally {
      layoutAny.getGlyphWidthFromCache = originalGetGlyphWidthFromCache;
    }
  });

  it('adds trailing spacing before a terminal right measure bar', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.melkiteRtl = false;

    const measureBarWidthMap = new Map<MeasureBar, number>([
      [MeasureBar.MeasureBarRight, 10],
    ]);

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getTrailingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'isonGlyph') {
        return 0.3;
      }
      return 0;
    });

    const layoutAny = LayoutService as any;
    const originalGetGlyphWidthFromCache = layoutAny.getGlyphWidthFromCache;
    layoutAny.getGlyphWidthFromCache = vi.fn(() => 100);

    try {
      const page = new Page();
      const line = new Line();
      const owner = new NoteElement();
      owner.quantitativeNeume = QuantitativeNeume.Ison;
      owner.measureBarRight = MeasureBar.MeasureBarRight;
      owner.x = 0;
      owner.neumeWidth = 110;
      line.elements = [owner];
      page.lines = [line];

      layoutAny.centerMeasureBars([page], pageSetup, measureBarWidthMap);

      expect(owner.computedMeasureBarRightTrailingSpacing).toBe(3);
      expect(owner.computedMeasureBarRightOffsetX).toBe(0);
    } finally {
      layoutAny.getGlyphWidthFromCache = originalGetGlyphWidthFromCache;
    }
  });

  it('adds trailing spacing before a right measure bar followed by an empty element', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.melkiteRtl = false;

    const measureBarWidthMap = new Map<MeasureBar, number>([
      [MeasureBar.MeasureBarRight, 10],
    ]);

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getTrailingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'isonGlyph') {
        return 0.3;
      }
      return 0;
    });

    const layoutAny = LayoutService as any;
    const originalGetGlyphWidthFromCache = layoutAny.getGlyphWidthFromCache;
    layoutAny.getGlyphWidthFromCache = vi.fn(() => 100);

    try {
      const page = new Page();
      const line = new Line();
      const owner = new NoteElement();
      owner.quantitativeNeume = QuantitativeNeume.Ison;
      owner.measureBarRight = MeasureBar.MeasureBarRight;
      owner.x = 0;
      owner.neumeWidth = 110;
      const empty = new EmptyElement();
      line.elements = [owner, empty];
      page.lines = [line];

      layoutAny.centerMeasureBars([page], pageSetup, measureBarWidthMap);

      expect(owner.computedMeasureBarRightTrailingSpacing).toBe(3);
      expect(owner.computedMeasureBarRightOffsetX).toBe(0);
    } finally {
      layoutAny.getGlyphWidthFromCache = originalGetGlyphWidthFromCache;
    }
  });

  it('adds leading spacing after a left measure bar on the first note of a line', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.neumeDefaultFontSize = 10;
    pageSetup.melkiteRtl = false;

    const measureBarWidthMap = new Map<MeasureBar, number>([
      [MeasureBar.MeasureBarRight, 10],
    ]);

    (NeumeMappingService.getMapping as Mock).mockImplementation((neume) => {
      if (neume === QuantitativeNeume.Ison) {
        return { glyphName: 'isonGlyph' };
      }
      return { glyphName: 'otherGlyph' };
    });

    (fontService.getLeadingSpace as Mock).mockImplementation((_, glyph) => {
      if (glyph === 'isonGlyph') {
        return 0.25;
      }
      return 0;
    });

    const layoutAny = LayoutService as any;
    const originalGetGlyphWidthFromCache = layoutAny.getGlyphWidthFromCache;
    layoutAny.getGlyphWidthFromCache = vi.fn(() => 100);

    try {
      const page = new Page();
      const line = new Line();
      const note = new NoteElement();
      note.quantitativeNeume = QuantitativeNeume.Ison;
      note.measureBarLeft = MeasureBar.MeasureBarRight;
      note.x = 0;
      note.neumeWidth = 110;
      line.elements = [note];
      page.lines = [line];

      layoutAny.centerMeasureBars([page], pageSetup, measureBarWidthMap);

      expect(note.computedMeasureBarLeftLeadingSpacing).toBe(2.5);
      expect(note.computedMeasureBarLeftOffsetX).toBe(0);
    } finally {
      layoutAny.getGlyphWidthFromCache = originalGetGlyphWidthFromCache;
    }
  });
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
