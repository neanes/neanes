import {
  adjustmentRatios,
  Box,
  breakLines,
  forcedBreak,
  Glue,
  InputItem,
  MAX_COST,
  MaxAdjustmentExceededError,
  PositionedItem,
  positionItems,
} from 'knuth-plass-linebreak';

import {
  DropCapElement,
  ElementType,
  EmptyElement,
  ImageBoxElement,
  LineBreakType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import { Footer } from '@/models/Footer';
import { Header } from '@/models/Header';
import { measureBarAboveToLeft } from '@/models/NeumeReplacements';
import {
  Fthora,
  GorgonNeume,
  MeasureBar,
  Neume,
  NeumeSelection,
  Note,
  NoteIndicator,
  QuantitativeNeume,
  RootSign,
  Tie,
  VocalExpressionNeume,
} from '@/models/Neumes';
import {
  getNeumeValue,
  getNoteSpread,
  getSpreadIndex,
} from '@/models/NeumeValues';
import { Line, Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import {
  getNoteFromValue,
  getNoteValue,
  getScaleNoteFromValue,
  getScaleNoteValue,
  getShiftWithoutFthora,
  Scale,
  ScaleNote,
} from '@/models/Scales';
import { Workspace } from '@/models/Workspace';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { TATWEEL } from '@/utils/constants';
import { Unit } from '@/utils/Unit';

import { fontService } from './FontService';
import { MelismaHelperGreek, MelismaSyllables } from './MelismaHelperGreek';
import { TextMeasurementService } from './TextMeasurementService';

const fontHeightCache = new Map<string, number>();
const fontBoundingBoxDescentCache = new Map<string, number>();
const textWidthCache = new Map<string, number>();
const neumeWidthCache = new Map<string, number>();
const emptyElementWidth = 39;
const idealMaxAdjustmentRatio = 1;
const adjustmentRatioCapStep = 0.05;
const maxAdjustmentRatioSearchLimit = 4096;
const maxAdjustmentRatioSearchIterations = 24;

const tieSet = new Set<VocalExpressionNeume | Tie>([
  VocalExpressionNeume.HeteronConnecting,
  VocalExpressionNeume.HeteronConnectingLong,
  VocalExpressionNeume.HomalonConnecting,
  Tie.YfenAbove,
  Tie.YfenBelow,
]);

const kentemataSet = new Set<QuantitativeNeume>([
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.KentemataPlusOligon,
]);

const beatStealingSet = new Set<QuantitativeNeume>([
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
  QuantitativeNeume.PetastiPlusRunningElaphron,
  QuantitativeNeume.RunningElaphron,
]);

const beatStealingWithGorgonSet = new Set<QuantitativeNeume>([
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.DoubleHamili,
  QuantitativeNeume.DoubleHamiliApostrofos,
  QuantitativeNeume.DoubleHamiliElafron,
  QuantitativeNeume.DoubleHamiliElafronApostrofos,
  QuantitativeNeume.Elaphron,
  QuantitativeNeume.ElaphronPlusApostrophos,
  QuantitativeNeume.Hamili,
  QuantitativeNeume.HamiliPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphron,
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Ison,
  QuantitativeNeume.Oligon,
  QuantitativeNeume.OligonKentimaDoubleYpsiliLeft,
  QuantitativeNeume.OligonKentimaDoubleYpsiliRight,
  QuantitativeNeume.OligonKentimataDoubleYpsili,
  QuantitativeNeume.OligonKentimataTripleYpsili,
  QuantitativeNeume.OligonKentimaTripleYpsili,
  QuantitativeNeume.OligonPlusApostrophos,
  QuantitativeNeume.OligonPlusDoubleHypsili,
  QuantitativeNeume.OligonPlusElaphron,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
  QuantitativeNeume.OligonPlusHamili,
  QuantitativeNeume.OligonPlusHyporoe,
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
  QuantitativeNeume.OligonPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
  QuantitativeNeume.OligonPlusHypsiliRight,
  QuantitativeNeume.OligonPlusIson,
  QuantitativeNeume.OligonPlusKentima,
  QuantitativeNeume.OligonPlusKentimaAbove,
  QuantitativeNeume.OligonPlusKentimaBelow,
  QuantitativeNeume.OligonTripleYpsili,
  QuantitativeNeume.Petasti,
  QuantitativeNeume.PetastiDoubleHamili,
  QuantitativeNeume.PetastiDoubleHamiliApostrofos,
  QuantitativeNeume.PetastiHamili,
  QuantitativeNeume.PetastiHamiliApostrofos,
  QuantitativeNeume.PetastiHamiliElafron,
  QuantitativeNeume.PetastiHamiliElafronApostrofos,
  QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft,
  QuantitativeNeume.PetastiKentimaDoubleYpsiliRight,
  QuantitativeNeume.PetastiKentimataDoubleYpsili,
  QuantitativeNeume.PetastiKentimataTripleYpsili,
  QuantitativeNeume.PetastiKentimaTripleYpsili,
  QuantitativeNeume.PetastiPlusApostrophos,
  QuantitativeNeume.PetastiPlusDoubleHypsili,
  QuantitativeNeume.PetastiPlusElaphron,
  QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
  QuantitativeNeume.PetastiPlusHyporoe,
  QuantitativeNeume.PetastiPlusHypsiliLeft,
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
  QuantitativeNeume.PetastiPlusHypsiliRight,
  QuantitativeNeume.PetastiPlusKentimaAbove,
  QuantitativeNeume.PetastiPlusOligon,
  QuantitativeNeume.PetastiTripleYpsili,
  QuantitativeNeume.PetastiWithIson,
  QuantitativeNeume.TripleHamili,
  QuantitativeNeume.VareiaDotted,
  QuantitativeNeume.VareiaDotted2,
  QuantitativeNeume.VareiaDotted3,
  QuantitativeNeume.VareiaDotted4,
]);

const gorgonNeumeSet = new Set<GorgonNeume>([
  GorgonNeume.Argon,
  GorgonNeume.Diargon,
  GorgonNeume.Gorgon_Bottom,
  GorgonNeume.GorgonDottedLeft,
  GorgonNeume.GorgonDottedRight,
  GorgonNeume.Gorgon_Top,
  GorgonNeume.Hemiolion,
]);

const beatStealingWithSecondaryGorgonSet = new Set<QuantitativeNeume>([
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
]);

const secondaryGorgonNeumeSet = new Set<GorgonNeume>([
  GorgonNeume.GorgonDottedLeftSecondary,
  GorgonNeume.GorgonDottedRightSecondary,
  GorgonNeume.GorgonSecondary,
]);

interface GetNoteWidthArgs {
  lyricsVerticalOffset: number;
  vareiaWidth: number;
  measureBarWidthMap: Map<MeasureBar, number>;
  runningElaphronWidth: number;
  elaphronWidth: number;
}

interface ElementBox extends Box {
  element: ScoreElement;
}

interface CompletedParagraph {
  paragraph: InputItem[];
  positions: PositionedItem[];
  ratios: number[];
  dropCapWidthPx: number;
  dropCapContinuationLines: number;
}

interface LayoutWorkspace {
  pageSetup: PageSetup;

  // The paragraph whose construction is currently in progress. Once a paragraph
  // has been constructed, it is broken into lines and we begin constructing the
  // next paragraph.
  pendingParagraph: InputItem[];

  // The next three values are offsets from within an idealized one-line
  // paragraph of infinite width where no stretching or shrinking has been
  // applied. They are used to calculate the widths of invisible boxes to
  // prevent lyrics from being spaced too closely. They apply to the pending
  // paragraph and are reset when the paragraph ends.
  neumesEndPx: number;
  lyricsEndPx: number;
  melismaLyricsEndPx: number | null;

  // Paragraphs that have been broken into lines and are ready to be placed onto
  // a page (or multiple pages, if necessary). Once the lines of a paragraph
  // have been placed onto page(s), that paragraph is removed from this list.
  completedParagraphs: CompletedParagraph[];

  // Multiline drop cap state for the paragraph currently being built.
  pendingDropCapWidthPx: number;
  pendingDropCapContinuationLines: number;

  // When a martyria with a transferable measure bar is followed by a note,
  // the martyria's post-break glue is reduced by this width and an anonymous
  // spacer box of the same width is inserted before the note. On the same
  // line, the reduced glue and the spacer cancel, leaving the note's own
  // box position unchanged. At a break the post-break glue vanishes; the
  // spacer remains at the start of the next line and reserves leading space
  // for the transferred bar.
  pendingMartyriaBarTransferWidth: number;

  // debug
  loggingEnabled: boolean;
}

interface LyricOverhangs {
  left: number;
  right: number;
}

interface LineBreakSolution {
  breakpoints: number[];
  ratios: number[];
  maxPositiveAdjustmentRatio: number;
  requestedMaxAdjustmentRatio: number | null;
}

export class LayoutService {
  public static processPages(workspace: Workspace): Page[] {
    const score = workspace.score;
    const pageSetup = score.pageSetup;
    const elements = score.staff.elements;

    elements.forEach((element, index) => {
      element.index = index;

      if (element.id == null && element.elementType !== ElementType.Empty) {
        element.id = workspace.nextId;
      }

      this.saveElementState(element);
    });

    score.headersAndFooters.forEach((element) => {
      this.saveElementState(element);
    });

    this.calculateMartyrias(elements, pageSetup);

    // Always make sure this is an empty element at the end of the score.
    // If this case is true, we have a bug, but this will prevent
    // users corrupting their score.
    if (elements[elements.length - 1].elementType !== ElementType.Empty) {
      elements.push(new EmptyElement());
    }

    const layoutWorkspace: LayoutWorkspace = {
      pageSetup,
      pendingParagraph: [],
      neumesEndPx: 0,
      lyricsEndPx: -pageSetup.neumeDefaultSpacing,
      melismaLyricsEndPx: null,
      completedParagraphs: [],
      pendingDropCapWidthPx: 0,
      pendingDropCapContinuationLines: 0,
      pendingMartyriaBarTransferWidth: 0,
      loggingEnabled: false,
    };

    const pages: Page[] = [];

    let page: Page = new Page();

    pages.push(page);

    let currentPageHeightPx = 0;

    let lastLineHeightPx = 0;

    let lastElementWasPageBreak = false;

    // First, calculate some constants that will
    // be used later. This is so we don't unnecessarily
    // calculate them more than once during the loop.

    const neumeHeight = TextMeasurementService.getFontHeight(
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const neumeAscent = TextMeasurementService.getFontBoundingBoxAscent(
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const oligonMidpoint = fontService.getMetrics(
      pageSetup.neumeDefaultFontFamily,
    ).oligonMidpoint;

    const lyricsVerticalOffset = neumeHeight + pageSetup.lyricsVerticalOffset;

    const lyricHeight = TextMeasurementService.getFontHeight(
      pageSetup.lyricsFont,
    );

    // The expected height of a line containing only neumes
    const neumeLineHeight = Math.max(
      lyricsVerticalOffset + lyricHeight,
      pageSetup.lineHeight,
    );

    const lyricAscent = TextMeasurementService.getFontBoundingBoxAscent(
      pageSetup.lyricsFont,
    );

    const vareiaMapping = NeumeMappingService.getMapping(
      VocalExpressionNeume.Vareia,
    );
    const vareiaWidth = TextMeasurementService.getTextWidth(
      vareiaMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarRightMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarRight,
    );
    const measureBarRightWidth = TextMeasurementService.getTextWidth(
      measureBarRightMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarTopMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarTop,
    );
    const measureBarTopWidth = TextMeasurementService.getTextWidth(
      measureBarTopMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarDoubleMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarDouble,
    );
    const measureBarDoubleWidth = TextMeasurementService.getTextWidth(
      measureBarDoubleMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarTheseosMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarTheseos,
    );
    const measureBarTheseosWidth = TextMeasurementService.getTextWidth(
      measureBarTheseosMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarShortDoubleMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarShortDouble,
    );
    const measureBarShortDoubleWidth = TextMeasurementService.getTextWidth(
      measureBarShortDoubleMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarShortTheseosMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarShortTheseos,
    );
    const measureBarShortTheseosWidth = TextMeasurementService.getTextWidth(
      measureBarShortTheseosMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarWidthMap = new Map<MeasureBar, number>();
    measureBarWidthMap.set(MeasureBar.MeasureBarRight, measureBarRightWidth);
    measureBarWidthMap.set(MeasureBar.MeasureBarTop, measureBarTopWidth);
    measureBarWidthMap.set(MeasureBar.MeasureBarDouble, measureBarDoubleWidth);
    measureBarWidthMap.set(
      MeasureBar.MeasureBarTheseos,
      measureBarTheseosWidth,
    );
    measureBarWidthMap.set(
      MeasureBar.MeasureBarShortDouble,
      measureBarShortDoubleWidth,
    );
    measureBarWidthMap.set(
      MeasureBar.MeasureBarShortTheseos,
      measureBarShortTheseosWidth,
    );

    const elaphronMapping = NeumeMappingService.getMapping(
      QuantitativeNeume.Elaphron,
    );
    const elaphronWidth = TextMeasurementService.getTextWidth(
      elaphronMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const runningElaphronMapping = NeumeMappingService.getMapping(
      QuantitativeNeume.RunningElaphron,
    );
    const runningElaphronWidth = TextMeasurementService.getTextWidth(
      runningElaphronMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const widthOfHyphen = TextMeasurementService.getTextWidth(
      '-',
      pageSetup.lyricsFont,
    );

    const noteWidthArgs: GetNoteWidthArgs = {
      lyricsVerticalOffset,
      vareiaWidth,
      measureBarWidthMap,
      runningElaphronWidth,
      elaphronWidth,
    };

    this.precomputeNoteGeometry(elements, pageSetup, noteWidthArgs);

    // Process Header and Footers
    // Only a single text box is supported right now
    if (score.pageSetup.showHeader) {
      this.processHeader(score.headers.default, pageSetup, neumeHeight);
      this.processHeader(score.headers.odd, pageSetup, neumeHeight);
      this.processHeader(score.headers.even, pageSetup, neumeHeight);
      this.processHeader(score.headers.firstPage, pageSetup, neumeHeight);
    }

    if (score.pageSetup.showFooter) {
      this.processFooter(score.footers.default, pageSetup, neumeHeight);
      this.processFooter(score.footers.odd, pageSetup, neumeHeight);
      this.processFooter(score.footers.even, pageSetup, neumeHeight);
      this.processFooter(score.footers.firstPage, pageSetup, neumeHeight);
    }

    const standardGlue: Glue = {
      type: 'glue',
      width: pageSetup.neumeDefaultSpacing,
      stretch: Math.max(pageSetup.neumeDefaultSpacing * 0.5, 0.1),
      shrink: pageSetup.neumeDefaultSpacing * 0.5,
    };

    // Martyria extra-stretch factor: linear ramp from 0.01em at 0.1pt to
    // 0.2em at the default spacing, clamped at both ends.
    const spacingRamp =
      (pageSetup.neumeDefaultSpacing - Unit.fromPt(0.1)) /
      (new PageSetup().neumeDefaultSpacing - Unit.fromPt(0.1));

    const martyriaGlue: Glue = {
      type: 'glue',
      width: pageSetup.neumeDefaultSpacing,
      stretch:
        pageSetup.neumeDefaultSpacing * 0.5 +
        pageSetup.neumeDefaultFontSize *
          (0.01 + 0.19 * Math.min(1, Math.max(0, spacingRamp))),
      shrink: pageSetup.neumeDefaultSpacing * 0.5,
    };

    const rightMartyriaGlue: Glue = {
      type: 'glue',
      width: pageSetup.neumeDefaultSpacing,
      stretch: MAX_COST,
      shrink: pageSetup.neumeDefaultSpacing * 0.5,
    };

    // Phase 1: Build paragraphs as sequences of boxes, glue, and penalties
    for (let i = 0; i < elements.length; i++) {
      let lineBreak: boolean = elements[i].lineBreak || elements[i].pageBreak;
      let lineBreakType: LineBreakType =
        elements[i].lineBreakType || LineBreakType.Left;

      switch (elements[i].elementType) {
        case ElementType.TextBox: {
          const textBoxElement = elements[i] as TextBoxElement;
          const isFillWidthTextBox = this.isFillWidthElement(textBoxElement);
          const elementWidthPx = LayoutService.processTextBoxElement(
            textBoxElement,
            pageSetup,
            neumeHeight,
          );

          if (isFillWidthTextBox) {
            // Phase 1 uses the textbox's intrinsic width as a lower bound.
            // Phase 2 resolves the actual fill width from the next positioned
            // item or the line end.
            this.addLyricReservation(
              elementWidthPx,
              elements[i],
              layoutWorkspace,
            );
            this.addBox(elementWidthPx, textBoxElement, layoutWorkspace);
            this.addFillWidthGlue(layoutWorkspace);
          } else {
            this.addLyricReservation(
              elementWidthPx,
              elements[i],
              layoutWorkspace,
            );
            this.addBox(elementWidthPx, textBoxElement, layoutWorkspace);
            this.addGlue(standardGlue, layoutWorkspace);
          }

          if (!textBoxElement.inline && !lineBreak) {
            lineBreak = true;
            lineBreakType = LineBreakType.Justify;
          }

          // A fill-width element must terminate the paragraph so Phase 2 can
          // resolve its width against the line end. Use Left so the rest of the
          // line is not justified. Exception: if the next element is a
          // right-aligned martyria, let the martyria handler terminate the
          // paragraph instead so the box fills up to that martyria.
          if (
            isFillWidthTextBox &&
            !lineBreak &&
            this.shouldTerminateAfterFillWidthElement(elements, i)
          ) {
            lineBreak = true;
            lineBreakType = LineBreakType.Left;
          }

          break;
        }
        case ElementType.RichTextBox: {
          const richTextBoxElement = elements[i] as RichTextBoxElement;
          const isFillWidthRichTextBox =
            this.isFillWidthElement(richTextBoxElement);

          let elementWidthPx: number;

          if (richTextBoxElement.inline) {
            // TODO Why is the same information being added to each text box element, you might ask?
            // Because theoretically we should use the values for the previous neume/lyrics
            // immediately before the inline text box. However, currently it's not possible to mix
            // and match neume fonts, so it doesn't matter. If it were possible, it would be necessary to put the
            // information on each text box because it could be different for each box.
            richTextBoxElement.defaultLyricsFontHeight =
              this.getLyricsFontHeightFromCache(
                fontHeightCache,
                pageSetup.lyricsFont,
              );

            richTextBoxElement.defaultNeumeFontAscent = neumeAscent;

            richTextBoxElement.oligonMidpoint = oligonMidpoint;

            elementWidthPx = isFillWidthRichTextBox
              ? this.getFillWidthPlaceholderWidth(richTextBoxElement, pageSetup)
              : richTextBoxElement.customWidth!;
            richTextBoxElement.height = neumeHeight;
          } else {
            elementWidthPx = pageSetup.innerPageWidth;
          }

          this.addLyricReservation(
            elementWidthPx,
            richTextBoxElement,
            layoutWorkspace,
          );
          this.addBox(elementWidthPx, richTextBoxElement, layoutWorkspace);
          if (isFillWidthRichTextBox) {
            this.addFillWidthGlue(layoutWorkspace);
          } else {
            this.addGlue(standardGlue, layoutWorkspace);
          }

          if (!richTextBoxElement.inline && !lineBreak) {
            lineBreak = true;
            lineBreakType = LineBreakType.Justify;
          }

          // A fill-width element must terminate the paragraph so Phase 2 can
          // resolve its width against the line end. Use Left so the rest of the
          // line is not justified. Exception: if the next element is a
          // right-aligned martyria, let the martyria handler terminate the
          // paragraph instead so the box fills up to that martyria.
          if (
            isFillWidthRichTextBox &&
            !lineBreak &&
            this.shouldTerminateAfterFillWidthElement(elements, i)
          ) {
            lineBreak = true;
            lineBreakType = LineBreakType.Left;
          }

          break;
        }
        case ElementType.ImageBox: {
          const imageBoxElement = elements[i] as ImageBoxElement;

          const elementWidthPx = imageBoxElement.inline
            ? imageBoxElement.imageWidth
            : pageSetup.innerPageWidth;
          this.addLyricReservation(
            elementWidthPx,
            imageBoxElement,
            layoutWorkspace,
          );
          this.addBox(elementWidthPx, imageBoxElement, layoutWorkspace);
          this.addGlue(standardGlue, layoutWorkspace);

          if (!imageBoxElement.inline && !lineBreak) {
            lineBreak = true;
            lineBreakType = LineBreakType.Justify;
          }

          break;
        }
        case ElementType.ModeKey: {
          const modeKeyElement = elements[i] as ModeKeyElement;

          // Compute properties
          modeKeyElement.computedFontFamily = pageSetup.neumeDefaultFontFamily;

          modeKeyElement.computedFontSize = modeKeyElement.useDefaultStyle
            ? pageSetup.modeKeyDefaultFontSize
            : modeKeyElement.fontSize;

          modeKeyElement.computedColor = modeKeyElement.useDefaultStyle
            ? pageSetup.modeKeyDefaultColor
            : modeKeyElement.color;

          modeKeyElement.computedStrokeWidth = modeKeyElement.useDefaultStyle
            ? pageSetup.modeKeyDefaultStrokeWidth
            : modeKeyElement.strokeWidth;

          modeKeyElement.computedHeightAdjustment =
            modeKeyElement.useDefaultStyle
              ? pageSetup.modeKeyDefaultHeightAdjustment
              : modeKeyElement.heightAdjustment;

          modeKeyElement.height =
            TextMeasurementService.getFontHeight(
              `${modeKeyElement.computedFontSize}px ${modeKeyElement.computedFontFamily}`,
            ) + modeKeyElement.computedHeightAdjustment;

          this.addBox(
            pageSetup.innerPageWidth,
            modeKeyElement,
            layoutWorkspace,
          );
          this.addGlue(standardGlue, layoutWorkspace);

          if (!lineBreak) {
            lineBreak = true;
            lineBreakType = LineBreakType.Justify;
          }

          break;
        }
        case ElementType.Note: {
          const noteElement = elements[i] as NoteElement;
          const elementWidthPx =
            noteElement.spaceAfter + noteElement.neumeWidth;

          // Consume any pending martyria bar transfer width.
          const martyriaBarTransferWidth =
            layoutWorkspace.pendingMartyriaBarTransferWidth;
          layoutWorkspace.pendingMartyriaBarTransferWidth = 0;

          // Insert the anonymous spacer box immediately so that neumesEndPx
          // includes the bar transfer width before any lyric or projection
          // math. On the same line the spacer cancels the martyria's reduced
          // post-break glue, leaving the note's position unchanged. At a
          // break the spacer remains at the start of the next line and
          // reserves leading space for the transferred bar.
          if (martyriaBarTransferWidth > 0) {
            this.addAnonymousBox(martyriaBarTransferWidth, layoutWorkspace);
          }

          // Knuth-Plass encoding for notes with lyrics.
          //
          // Each note contributes:
          //
          //   penalty(inf)         protect the left projection
          //   glue(L_i, 0, 0)      fixed left projection
          //   box(B_i)             the neume
          //   penalty(inf)         protect the neume
          //   glue(0, s^+, s^-)    stretch that remains at line end
          //   penalty(cost, w_i)   candidate breakpoint
          //   glue(m_i, 0, 0)      same-line spacing that vanishes at breaks
          //
          // On the same line, each note boundary contributes m_i of width plus
          // s^+ of stretch for justification.
          //
          // At a break, the final glue becomes leading glue on the next line
          // and is skipped by positionItems, so m_i disappears. The stretch
          // glue stays on the current line. L_{i+1} then protects the left edge
          // of the next line, and the penalty width w_i reserves break-only
          // space for the right projection, melisma overhang, and measure-bar
          // transfers.
          //
          // m_i = s_0 + R_i - T_i^left - T_i^right + ell_i, where R_i is the
          // right projection, ell_i is the lyric-collision correction, T_i^left
          // is the absorbed portion of L_{i+1}, and T_i^right is the portion of
          // R_i that tucks under the next neume. For hyphenated melismas, ell_i
          // also enforces that the visible lyric gap is wide enough to hold the
          // hyphen glyph when that hyphen is absorbed inside the current neume
          // and therefore contributes no overhang. m_i may be negative if a
          // large left projection is absorbed.
          //
          // If a paragraph ends immediately after a note, endParagraph moves
          // that note's trailing reservation (right projection or melisma
          // overhang) into the finishing glue, because the trailing glue is
          // removed. If a martyria replaces that trailing glue, the martyria
          // path preserves any remaining melisma overhang there instead.
          // Ordinary note-to-martyria lyric collision still goes through
          // addLyricReservation.
          const { leftProjection, rightProjection } =
            LayoutService.getLyricProjections(
              noteElement,
              noteElement.alignLeft,
            );

          // Left projection (protected by infinity penalty)
          if (leftProjection > 0) {
            this.preventBreak(layoutWorkspace);
            this.addGlue(this.fixedGlue(leftProjection), layoutWorkspace);
          }

          // Compute lyric and neume end positions in the idealized layout.
          let lyricsEnd: number;

          if (noteElement.alignLeft) {
            lyricsEnd =
              layoutWorkspace.neumesEndPx +
              noteElement.lyricsHorizontalOffset +
              noteElement.lyricsWidth;
          } else {
            // Otherwise the lyrics are centered under the neume
            lyricsEnd =
              layoutWorkspace.neumesEndPx +
              noteElement.lyricsHorizontalOffset / 2 +
              noteElement.neumeWidth / 2 +
              noteElement.lyricsWidth / 2;
          }

          const neumeEnd =
            layoutWorkspace.neumesEndPx +
            noteElement.neumeWidth +
            pageSetup.neumeDefaultSpacing;

          layoutWorkspace.lyricsEndPx = noteElement.isMelismaStart
            ? noteElement.spaceAfter + neumeEnd
            : noteElement.spaceAfter + lyricsEnd;

          const hyphenWidthForThisElement =
            noteElement.isMelismaStart && noteElement.isHyphen
              ? noteElement.lyricsUseDefaultStyle
                ? widthOfHyphen
                : this.getTextWidthFromCache(
                    textWidthCache,
                    noteElement,
                    pageSetup,
                    '-',
                  )
              : 0;
          // In the absorbed-hyphen case, the visible gap between syllables must
          // hold both the hyphen glyph and the ordinary lyric spacing before
          // the next syllable.
          const minimumLyricGap =
            pageSetup.lyricsMinimumSpacing + hyphenWidthForThisElement;
          if (noteElement.isMelismaStart && noteElement.isHyphen) {
            layoutWorkspace.melismaLyricsEndPx =
              noteElement.spaceAfter + lyricsEnd + hyphenWidthForThisElement;
          } else if (noteElement.isMelismaStart) {
            layoutWorkspace.melismaLyricsEndPx =
              noteElement.spaceAfter + lyricsEnd;
          } else if (!noteElement.isMelisma) {
            layoutWorkspace.melismaLyricsEndPx = null;
          }

          // The neume box (unchanged by the bar transfer).
          this.addBox(elementWidthPx, noteElement, layoutWorkspace);

          const nextElement = this.getElementAt(elements, i + 1);
          const nextNoteElement = this.getNoteIfPresentAt(elements, i + 1);
          const afterNextNoteElement = this.getNoteIfPresentAt(elements, i + 2);

          const m_i = this.calculateInterNoteSpacing(
            noteElement,
            rightProjection,
            nextNoteElement,
            layoutWorkspace,
            minimumLyricGap,
          );

          // Compute the break penalty cost for this inter-note space. Penalties
          // are additive: when multiple conditions apply to the same
          // breakpoint, their costs are summed.
          const breakCost = this.getBreakCost(
            noteElement,
            nextElement,
            afterNextNoteElement,
          );

          // Penalty width is conditional: only counted when a break occurs
          // here. It reserves space for:
          // 1. Right projection (lyric extending past the neume).
          // 2. Melisma lyric overhang past the neume.
          // 3. Measure bar transfer (the next note's left bar moves to this
          //    note's right side at a break).
          // These costs are break-conditional and cannot go in m_i (which
          // vanishes at breaks via the cancellation glue).
          const penaltyWidth = this.getBreakPenaltyWidth(
            rightProjection,
            layoutWorkspace,
            nextNoteElement,
            measureBarWidthMap,
          );

          // Break opportunity after the neume. The pre-break glue stays on the
          // current line; the post-break glue becomes leading glue on the next
          // line and is skipped by positionItems.
          this.addProtectedBreakpointEncoding(
            layoutWorkspace,
            { ...standardGlue, width: 0 },
            breakCost,
            penaltyWidth,
            this.fixedGlue(m_i),
          );

          break;
        }
        case ElementType.Martyria: {
          const martyriaElement = elements[i] as MartyriaElement;

          if (layoutWorkspace.pendingParagraph.length > 0) {
            // Replacing the trailing note glue would otherwise drop any melisma
            // lyric overhang carried in that glue. Preserve only the melisma
            // overhang here; ordinary lyric collision before a martyria is
            // handled by addLyricReservation below.
            const trailingNoteReservations =
              this.getTrailingNoteReservations(layoutWorkspace);
            const reservation = trailingNoteReservations
              ? trailingNoteReservations.melismaOverhang
              : 0;
            const baseGlue = martyriaElement.alignRight
              ? rightMartyriaGlue
              : martyriaGlue;
            const newGlue = {
              ...baseGlue,
              width: baseGlue.width + reservation,
            };
            this.removeGlue(layoutWorkspace);
            this.addGlue(newGlue, layoutWorkspace);
          } else if (martyriaElement.alignRight) {
            // A paragraph-start right martyria still needs its leading glue in
            // the input stream, even though positionItems will skip it at line
            // start. Phase 2 supplies the explicit flush-right placement.
            // Cannot use addGlue() here because the paragraph is empty.
            layoutWorkspace.pendingParagraph.push(rightMartyriaGlue);
            layoutWorkspace.neumesEndPx += rightMartyriaGlue.width;
          }

          const elementWidthPx = this.getMartyriaWidth(
            martyriaElement,
            pageSetup,
          );
          this.addLyricReservation(
            elementWidthPx,
            martyriaElement,
            layoutWorkspace,
          );
          this.addBox(elementWidthPx, martyriaElement, layoutWorkspace);

          // Compute the measure bar width that would transfer from this
          // martyria to the next line's first note. On the same line, the
          // reduced post-break glue is cancelled by an anonymous spacer box
          // inserted before the note, so the note's position is unchanged.
          // At a break, the post-break glue vanishes; the spacer remains at
          // the start of the next line and reserves leading space for the bar.
          const nextNoteForBar = this.getNoteIfPresentAt(elements, i + 1);
          const martyriaTransferBar = martyriaElement.measureBarLeft?.endsWith(
            'Above',
          )
            ? measureBarAboveToLeft.get(martyriaElement.measureBarLeft)
            : martyriaElement.measureBarRight;
          const martyriaBarTransferWidth =
            martyriaTransferBar &&
            nextNoteForBar &&
            !nextNoteForBar.measureBarLeft
              ? (measureBarWidthMap.get(martyriaTransferBar) ?? 0)
              : 0;
          layoutWorkspace.pendingMartyriaBarTransferWidth =
            martyriaBarTransferWidth;

          // Martyria break opportunity. Keep the full trailing spacing after
          // the martyria when it stays mid-line, but make both the fixed
          // padding and the ordinary martyria spacing disappear when a break is
          // taken here. Only the ordinary martyria spacing remains elastic.
          // The bar transfer width is subtracted so that on the same line it
          // is cancelled by the anonymous spacer box before the note; at a
          // break it vanishes along with the rest of the post-break glue.
          // When the quantitative neume is present, part of the total martyria
          // padding is rendered inside the box as marginLeft; only the
          // remainder goes into trailing glue.
          const martyriaTrailingPadding =
            pageSetup.neumeDefaultFontSize *
              pageSetup.spaceAfterMartyriaFactor -
            martyriaElement.padding;
          this.addProtectedBreakpointEncoding(
            layoutWorkspace,
            this.fixedGlue(0),
            0,
            0,
            {
              ...martyriaGlue,
              width:
                martyriaGlue.width +
                martyriaTrailingPadding -
                martyriaBarTransferWidth,
            },
          );

          if (martyriaElement.alignRight && !lineBreak) {
            lineBreak = true;
            lineBreakType = LineBreakType.Justify;
          }

          break;
        }
        case ElementType.Tempo: {
          const tempoElement = elements[i] as TempoElement;
          const temoMapping = NeumeMappingService.getMapping(
            tempoElement.neume,
          );

          const elementWidthPx =
            TextMeasurementService.getTextWidth(
              temoMapping.text,
              `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
            ) + tempoElement.spaceAfter;
          tempoElement.neumeWidth = elementWidthPx;
          this.addLyricReservation(
            elementWidthPx,
            tempoElement,
            layoutWorkspace,
          );
          this.addBox(elementWidthPx, tempoElement, layoutWorkspace);
          this.addGlue(standardGlue, layoutWorkspace);

          break;
        }
        case ElementType.DropCap: {
          const dropCapElement = elements[i] as DropCapElement;

          dropCapElement.computedFontFamily = dropCapElement.useDefaultStyle
            ? pageSetup.dropCapDefaultFontFamily
            : dropCapElement.fontFamily;

          dropCapElement.computedFontSize = dropCapElement.useDefaultStyle
            ? pageSetup.dropCapDefaultFontSize
            : dropCapElement.fontSize;

          dropCapElement.computedColor = dropCapElement.useDefaultStyle
            ? pageSetup.dropCapDefaultColor
            : dropCapElement.color;

          dropCapElement.computedStrokeWidth = dropCapElement.useDefaultStyle
            ? pageSetup.dropCapDefaultStrokeWidth
            : dropCapElement.strokeWidth;

          dropCapElement.computedFontWeight = dropCapElement.useDefaultStyle
            ? pageSetup.dropCapDefaultFontWeight
            : dropCapElement.fontWeight;

          dropCapElement.computedFontStyle = dropCapElement.useDefaultStyle
            ? pageSetup.dropCapDefaultFontStyle
            : dropCapElement.fontStyle;

          dropCapElement.computedLineHeight = dropCapElement.useDefaultStyle
            ? pageSetup.dropCapDefaultLineHeight
            : dropCapElement.lineHeight;

          dropCapElement.computedLineSpan = 1;

          let elementWidthPx: number;

          if (dropCapElement.customWidth != null) {
            elementWidthPx = dropCapElement.customWidth;
          } else {
            elementWidthPx = TextMeasurementService.getTextWidth(
              dropCapElement.content,
              dropCapElement.computedFont,
            );
          }

          dropCapElement.contentWidth = elementWidthPx;

          // A drop cap can only span multiple lines when it starts a paragraph.
          if (layoutWorkspace.pendingParagraph.length === 0) {
            const lineSpan = dropCapElement.useDefaultStyle
              ? pageSetup.dropCapDefaultLineSpan
              : dropCapElement.lineSpan;

            layoutWorkspace.pendingDropCapWidthPx =
              elementWidthPx + pageSetup.neumeDefaultSpacing;
            layoutWorkspace.pendingDropCapContinuationLines = Math.max(
              0,
              lineSpan - 1,
            );
            dropCapElement.computedLineSpan = lineSpan;
          }

          this.addLyricReservation(
            elementWidthPx,
            dropCapElement,
            layoutWorkspace,
          );
          this.addBox(elementWidthPx, dropCapElement, layoutWorkspace);
          this.addGlue(standardGlue, layoutWorkspace);

          break;
        }
        case ElementType.Empty: {
          if (i !== elements.length - 1) {
            throw new Error('Unexpected empty element at index ' + i);
          }

          const emptyElement = elements[i] as EmptyElement;
          emptyElement.height = neumeHeight;

          this.addLyricReservation(
            emptyElementWidth,
            emptyElement,
            layoutWorkspace,
          );
          this.addBox(emptyElementWidth, emptyElement, layoutWorkspace);
          this.addGlue(standardGlue, layoutWorkspace);

          lineBreak = true;

          break;
        }
        default:
          throw new Error(
            `Unhandled element type in layout service: ${elements[i].elementType}`,
          );
      }

      // A line break is implied before a block text box, rich-text box, image
      // box, or mode key element.
      {
        const nextElement: ScoreElement | null =
          i + 1 < elements.length ? elements[i + 1] : null;
        if (nextElement?.elementType === ElementType.TextBox) {
          const textBoxElement = nextElement as TextBoxElement;
          if (!textBoxElement.inline) {
            lineBreak = true;
          }
        } else if (nextElement?.elementType === ElementType.RichTextBox) {
          const richTextBoxElement = nextElement as RichTextBoxElement;
          if (!richTextBoxElement.inline) {
            lineBreak = true;
          }
        } else if (nextElement?.elementType === ElementType.ImageBox) {
          const imageBoxElement = nextElement as ImageBoxElement;
          if (!imageBoxElement.inline) {
            lineBreak = true;
          }
        } else if (nextElement?.elementType === ElementType.ModeKey) {
          // TODO support inline mode keys
          lineBreak = true;
        }
      }

      // Invariant: After processing each element, there should be trailing glue
      // at the end of the paragraph (for example a note's post-break fixed
      // glue, martyria spacing glue, or ordinary spacing after another
      // element), even if the element has an (explicit or implicit) line break
      // and the paragraph is about to end. In the latter case, endParagraph()
      // removes that trailing glue and replaces it with finishing glue.
      if (lineBreak) {
        this.endParagraph(lineBreakType, layoutWorkspace);
      }
    }

    // Phase 2: Place completed paragraphs onto pages
    for (const [
      completedParagraphIndex,
      completedParagraph,
    ] of layoutWorkspace.completedParagraphs.entries()) {
      const {
        paragraph,
        positions,
        ratios,
        dropCapWidthPx,
        dropCapContinuationLines,
      } = completedParagraph;

      // Tracks the current line index within this completed paragraph.
      let paragraphLineIndex = -1;

      for (const [posIndex, position] of positions.entries()) {
        const item = paragraph[position.item];
        if (item.type !== 'box') {
          // No need to position glue items
          continue;
        }

        // Check if we need a new line
        if (position.line > paragraphLineIndex) {
          if (page.lines.length > 0) {
            const previousLine = page.lines[page.lines.length - 1];
            const previousLineHeightPx = this.getLineHeight(
              previousLine,
              pageSetup.lineHeight,
              neumeLineHeight,
              neumeHeight,
            );

            currentPageHeightPx += previousLineHeightPx - lastLineHeightPx;
            lastLineHeightPx = previousLineHeightPx;
          }

          const newLine = new Line();
          const nextLineIndex = paragraphLineIndex + 1;
          const adjustmentRatio = ratios[nextLineIndex];
          if (adjustmentRatio == null) {
            throw new Error(
              `Missing adjustment ratio for completed paragraph ${completedParagraphIndex}, line ${nextLineIndex}`,
            );
          }
          newLine.adjustmentRatio = adjustmentRatio;
          page.lines.push(newLine);

          paragraphLineIndex += 1;

          // New lines start with the default allocation until their content
          // determines the final line height.
          lastLineHeightPx = pageSetup.lineHeight;
          currentPageHeightPx += lastLineHeightPx;
        }

        // Calculate the height of the headers/footers of the current page
        let { extraHeaderHeightPx, extraFooterHeightPx } =
          this.getExtraHeaderFooterHeight(score, pageSetup, pages.length);

        const innerPageHeight =
          pageSetup.innerPageHeight - extraHeaderHeightPx - extraFooterHeightPx;
        const additionalHeight =
          paragraphLineIndex === 0
            ? neumeLineHeight * dropCapContinuationLines
            : 0;
        const requiresNewPage =
          currentPageHeightPx + additionalHeight > innerPageHeight ||
          lastElementWasPageBreak;

        // Keep multiline drop caps on the same page as their continuation lines
        // when possible.
        if (requiresNewPage) {
          const lastLine = page.lines.pop()!;

          page = new Page();
          page.lines.push(lastLine);
          pages.push(page);
          currentPageHeightPx = lastLineHeightPx;

          // Recalculate the height of the headers/footers of the new page
          ({ extraHeaderHeightPx, extraFooterHeightPx } =
            this.getExtraHeaderFooterHeight(score, pageSetup, pages.length));
        }

        if (!('element' in item)) {
          continue;
        }
        const element = (item as ElementBox).element;

        const currentLine = page.lines[page.lines.length - 1];
        const isFirstElementOnLine = currentLine.elements.length === 0;

        // Indent only the continuation lines covered by a multiline drop cap.
        if (
          isFirstElementOnLine &&
          paragraphLineIndex > 0 &&
          paragraphLineIndex <= dropCapContinuationLines
        ) {
          currentLine.indentation = dropCapWidthPx;
        }

        element.x =
          pageSetup.leftMargin + position.xOffset + currentLine.indentation;

        // marginTop offsets the element within its line's allocated space
        // (whose height already includes marginTop + marginBottom).
        let marginTop = 0;
        if (element.elementType === ElementType.TextBox) {
          marginTop = (element as TextBoxElement).marginTop;
        } else if (element.elementType === ElementType.RichTextBox) {
          marginTop = (element as RichTextBoxElement).marginTop;
        } else if (element.elementType === ElementType.ModeKey) {
          marginTop = (element as ModeKeyElement).marginTop;
        }

        element.y =
          pageSetup.topMargin +
          extraHeaderHeightPx +
          marginTop +
          currentPageHeightPx -
          lastLineHeightPx;
        element.width = position.width;

        // Fill-width elements were encoded using their intrinsic placeholder
        // width in Phase 1. Now that line breaking is done, compute their
        // actual width from the next positioned item or line end.
        if (this.isFillWidthElement(element)) {
          let fillWidth: number | null = null;
          for (
            let nextIdx = posIndex + 1;
            nextIdx < positions.length;
            nextIdx++
          ) {
            const nextPos = positions[nextIdx];
            if (nextPos.line > position.line) break;
            if (nextPos.line === position.line) {
              fillWidth = nextPos.xOffset - position.xOffset;
              break;
            }
          }
          if (fillWidth == null) {
            const lineWidth =
              pageSetup.innerPageWidth - currentLine.indentation;
            fillWidth = lineWidth - position.xOffset;
          }
          element.width = fillWidth;
        }

        element.line = page.lines.length;
        element.page = pages.length;

        this.adjustDropCapPosition(
          element,
          neumeLineHeight,
          lyricsVerticalOffset,
          lyricAscent,
        );

        // Measure bar transfer logic between lines
        let prevLine =
          page.lines.length > 1 ? page.lines[page.lines.length - 2] : null;
        if (prevLine === null && pages.length > 1) {
          const prevPage = pages[pages.length - 2];
          prevLine = prevPage.lines[prevPage.lines.length - 1];
        }

        if (isFirstElementOnLine) {
          if (element.elementType === ElementType.Note) {
            const noteElement = element as NoteElement;
            const previousElement = prevLine
              ? prevLine.elements[prevLine.elements.length - 1]
              : null;
            if (previousElement?.elementType === ElementType.Note) {
              // If the new line starts with a left measure, apply it to the
              // right of the previous line
              const previousNoteElement = previousElement as NoteElement;
              if (
                noteElement.measureBarLeft &&
                !noteElement.measureBarLeft.endsWith('Above')
              ) {
                previousNoteElement.computedMeasureBarRight =
                  noteElement.measureBarLeft;
              }
            } else if (
              previousElement?.elementType === ElementType.Martyria &&
              paragraphLineIndex > 0
            ) {
              // If the previous line ends with a martyria with a barline, apply
              // it to the left of the new line. Only transfer within the same
              // paragraph (paragraphLineIndex > 0); when a martyria ends a
              // paragraph (right-aligned or explicit line break), no bar is
              // transferred to the next paragraph's first note.
              const previousMartyriaElement =
                previousElement as MartyriaElement;
              const normalizedMeasureBar =
                previousMartyriaElement.measureBarLeft?.endsWith('Above')
                  ? measureBarAboveToLeft.get(
                      previousMartyriaElement.measureBarLeft,
                    )
                  : previousMartyriaElement.measureBarRight;
              // Only transfer if the note doesn't already have its own
              // measureBarLeft: getNoteWidth already accounted for the
              // explicit one in Phase 1.
              if (normalizedMeasureBar && !noteElement.measureBarLeft) {
                noteElement.computedMeasureBarLeft = normalizedMeasureBar;
                // Phase 1 reserved leading space for this barline via an
                // anonymous spacer box before the note. Shift the note left
                // so the rendered barline occupies that reserved space
                // instead of adding extra width. Adjust neumeWidth and
                // lyricsHorizontalOffset so lyrics center under the neume body.
                const barlineWidth =
                  measureBarWidthMap.get(normalizedMeasureBar) ?? 0;
                if (barlineWidth > 0) {
                  noteElement.neumeWidth += barlineWidth;
                  noteElement.lyricsHorizontalOffset += barlineWidth;
                  element.x -= barlineWidth;
                }
              }
            }
          } else if (element.elementType === ElementType.Martyria) {
            // If the new line starts with a left measure, apply it to the right
            // of the previous line
            const martyriaElement = element as MartyriaElement;
            const previousElement = prevLine
              ? prevLine.elements[prevLine.elements.length - 1]
              : null;
            if (previousElement?.elementType === ElementType.Note) {
              const previousNoteElement = previousElement as NoteElement;
              const normalizedMeasureBar =
                martyriaElement.measureBarLeft?.endsWith('Above')
                  ? measureBarAboveToLeft.get(martyriaElement.measureBarLeft)
                  : martyriaElement.measureBarLeft;
              if (normalizedMeasureBar) {
                previousNoteElement.computedMeasureBarRight =
                  normalizedMeasureBar;
              }
            }
          }
        }

        currentLine.elements.push(element);

        // Right-aligned martyriae need an explicit placement override when they
        // start a paragraph: the leading `MAX_COST`-stretch glue used in Phase
        // 1 is skipped at line start by positionItems, so it cannot push the
        // martyria to the right edge on its own.
        if (
          element.elementType === ElementType.Martyria &&
          (element as MartyriaElement).alignRight &&
          currentLine.elements.length === 1
        ) {
          element.x =
            pageSetup.pageWidth -
            pageSetup.rightMargin -
            this.getMartyriaWidth(element as MartyriaElement, pageSetup);
        }

        // Special logic for centered lines
        if (element.lineBreakType === LineBreakType.Center) {
          const nextPosition =
            posIndex + 1 < positions.length ? positions[posIndex + 1] : null;
          if (nextPosition?.line === position.line) {
            throw new Error(
              `Centered element must terminate its line: ${element.id ?? element.index}`,
            );
          }

          const centerOffsetPx =
            (pageSetup.innerPageWidth -
              currentLine.indentation -
              (position.xOffset + position.width)) /
            2;
          for (const lineElement of currentLine.elements) {
            lineElement.x += centerOffsetPx;
          }
        }

        lastElementWasPageBreak = element.pageBreak;
      }
    }

    this.addMelismas(pages, pageSetup);

    if (pageSetup.alignIsonIndicators) {
      this.alignIsonIndicators(pages, pageSetup);
    }

    // Record element updates
    elements.forEach((element) => {
      this.checkElementState(element);
    });

    score.headersAndFooters.forEach((element) => {
      this.checkElementState(element);
    });

    return pages;
  }

  private static isFillWidthElement(element: ScoreElement): boolean {
    return (
      (element.elementType === ElementType.RichTextBox &&
        (element as RichTextBoxElement).inline &&
        (element as RichTextBoxElement).customWidth == null) ||
      (element.elementType === ElementType.TextBox &&
        (element as TextBoxElement).inline &&
        (element as TextBoxElement).fillWidth)
    );
  }

  private static addFillWidthGlue(layoutWorkspace: LayoutWorkspace) {
    // Let the line breaker reserve the remaining line width for the fill-width
    // element without forcing justification elsewhere on the line.
    this.addGlue(
      {
        type: 'glue',
        width: 0,
        stretch: MAX_COST,
        shrink: 0,
      },
      layoutWorkspace,
    );
  }

  private static shouldTerminateAfterFillWidthElement(
    elements: ScoreElement[],
    index: number,
  ) {
    const nextEl = elements[index + 1];

    return !(
      nextEl?.elementType === ElementType.Martyria &&
      (nextEl as MartyriaElement).alignRight
    );
  }

  private static measurePlainTextWidth(text: string, font: string) {
    const lines = text.split(/(?:\r\n|\r|\n)/g);
    let maxWidth = 0;

    for (const line of lines) {
      const lineWidth = TextMeasurementService.getTextWidth(line, font);
      if (lineWidth > maxWidth) {
        maxWidth = lineWidth;
      }
    }

    return Math.max(
      TextMeasurementService.getTextWidth(' ', font),
      maxWidth,
      1,
    );
  }

  private static measureRichTextWidth(html: string, pageSetup: PageSetup) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const plainText = template.content.textContent ?? '';

    return this.measurePlainTextWidth(plainText, pageSetup.lyricsFont);
  }

  private static getFillWidthPlaceholderWidth(
    element: ScoreElement,
    pageSetup: PageSetup,
  ) {
    if (
      element.elementType === ElementType.TextBox &&
      (element as TextBoxElement).inline
    ) {
      const textBoxElement = element as TextBoxElement;
      return Math.max(
        this.measurePlainTextWidth(
          textBoxElement.content,
          textBoxElement.computedFont,
        ),
        this.measurePlainTextWidth(
          textBoxElement.contentBottom,
          textBoxElement.computedFont,
        ),
      );
    }

    if (
      element.elementType === ElementType.RichTextBox &&
      (element as RichTextBoxElement).inline
    ) {
      const richTextBoxElement = element as RichTextBoxElement;
      return Math.max(
        this.measureRichTextWidth(richTextBoxElement.content, pageSetup),
        this.measureRichTextWidth(richTextBoxElement.contentBottom, pageSetup),
      );
    }

    return this.measurePlainTextWidth('', pageSetup.lyricsFont);
  }

  private static addLyricReservation(
    elementWidthPx: number,
    element: ScoreElement,
    workspace: LayoutWorkspace,
  ) {
    const { pageSetup } = workspace;

    // Skip lyric collision for non-inline block elements (TextBox, RichTextBox,
    // ImageBox, ModeKey), which occupy the full line width and have no lyrics
    // to collide with. Fill-width inline elements still need collision
    // handling: their width is deferred to Phase 2, but their left edge is
    // already known in Phase 1.
    if (this.isBlockElement(element)) {
      return;
    }

    const previousLyricsEndPx =
      workspace.melismaLyricsEndPx == null
        ? workspace.lyricsEndPx
        : Math.max(workspace.lyricsEndPx, workspace.melismaLyricsEndPx);

    // Maintain at least neumeDefaultSpacing between the previous lyric end and
    // the current element.
    if (
      workspace.neumesEndPx <=
      previousLyricsEndPx + pageSetup.neumeDefaultSpacing
    ) {
      const adjustment =
        previousLyricsEndPx -
        workspace.neumesEndPx +
        pageSetup.neumeDefaultSpacing;
      this.addAnonymousBox(adjustment, workspace);
    }

    workspace.lyricsEndPx =
      workspace.neumesEndPx + elementWidthPx + pageSetup.neumeDefaultSpacing;
  }

  private static isBlockElement(element: ScoreElement): boolean {
    return (
      (element.elementType === ElementType.TextBox &&
        !(element as TextBoxElement).inline) ||
      (element.elementType === ElementType.RichTextBox &&
        !(element as RichTextBoxElement).inline) ||
      (element.elementType === ElementType.ImageBox &&
        !(element as ImageBoxElement).inline) ||
      element.elementType === ElementType.ModeKey
    );
  }

  private static addBox(
    width: number,
    element: ScoreElement,
    workspace: LayoutWorkspace,
  ) {
    const { pendingParagraph } = workspace;

    const box: ElementBox = {
      type: 'box',
      width,
      element,
    };

    pendingParagraph.push(box);

    workspace.neumesEndPx += width;
  }

  private static addAnonymousBox(width: number, workspace: LayoutWorkspace) {
    workspace.pendingParagraph.push({ type: 'box', width });
    workspace.neumesEndPx += width;
  }

  private static addGlue(glue: Glue, workspace: LayoutWorkspace) {
    const { pendingParagraph } = workspace;

    if (pendingParagraph.length === 0) {
      throw new Error('Cannot add glue to the beginning of a paragraph');
    }

    pendingParagraph.push(glue);

    workspace.neumesEndPx += glue.width;
  }

  private static fixedGlue(width: number): Glue {
    return {
      type: 'glue',
      width,
      stretch: 0,
      shrink: 0,
    };
  }

  private static addPenalty(
    workspace: LayoutWorkspace,
    cost: number,
    width: number,
  ) {
    workspace.pendingParagraph.push({
      type: 'penalty',
      cost,
      width,
      flagged: false,
    });
  }

  private static addProtectedBreakpointEncoding(
    workspace: LayoutWorkspace,
    preBreakGlue: Glue,
    breakCost: number,
    breakWidth: number,
    postBreakGlue: Glue,
  ) {
    // The breakpoint must occur at the penalty, not immediately before the
    // pre-break glue, so the post-break glue is skipped on the next line.
    this.preventBreak(workspace);
    this.addGlue(preBreakGlue, workspace);
    this.addPenalty(workspace, breakCost, breakWidth);
    this.addGlue(postBreakGlue, workspace);
  }

  private static shouldAlignLeft(
    noteElement: NoteElement,
    nextNoteElement: NoteElement | null,
  ): boolean {
    // At the start of a melisma, the syllable is aligned to the
    // left of the neume, but only if the lyrics are wider than the neume.
    // NOTE: a syllable ending with a hyphen is only considered a melismatic note
    // if the next note is purely melismatic (i.e. the next note contains only a hyphen),
    // despite the unfortunate property name "isMelisma" being true.
    return (
      noteElement.isMelismaStart &&
      noteElement.lyricsWidth >
        noteElement.neumeWidth - noteElement.lyricsHorizontalOffset &&
      (!noteElement.isHyphen ||
        (nextNoteElement != null &&
          nextNoteElement.isMelisma &&
          !nextNoteElement.isMelismaStart))
    );
  }

  private static precomputeNoteGeometry(
    elements: ScoreElement[],
    pageSetup: PageSetup,
    noteWidthArgs: GetNoteWidthArgs,
  ) {
    for (const element of elements) {
      if (element.elementType !== ElementType.Note) {
        continue;
      }

      const noteElement = element as NoteElement;

      // Reset computed barlines before Phase 1 width calculation so
      // stale values from the previous processPages call do not
      // inflate the width used for line breaking. Phase 2 will
      // recompute transferred barlines from the chosen breakpoints.
      noteElement.computedMeasureBarLeft = null;
      noteElement.computedMeasureBarRight = null;

      noteElement.computedIsonOffsetY = noteElement.isonOffsetY;
      noteElement.lyricsFontHeight = this.getNoteLyricsFontHeightFromCache(
        fontHeightCache,
        noteElement,
        pageSetup,
      );
      this.getNoteWidth(noteElement, pageSetup, noteWidthArgs);
    }

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.elementType !== ElementType.Note) {
        continue;
      }

      const noteElement = element as NoteElement;
      noteElement.alignLeft = this.shouldAlignLeft(
        noteElement,
        this.getNoteIfPresentAt(elements, i + 1),
      );
    }
  }

  private static getElementAt(
    elements: ScoreElement[],
    index: number,
  ): ScoreElement | null {
    return index < elements.length ? elements[index] : null;
  }

  private static getNoteIfPresentAt(
    elements: ScoreElement[],
    index: number,
  ): NoteElement | null {
    const element = this.getElementAt(elements, index);
    return element?.elementType === ElementType.Note
      ? (element as NoteElement)
      : null;
  }

  private static getExtraHeaderFooterHeight(
    score: {
      pageSetup: PageSetup;
      getHeaderForPage: (page: number) => Header;
      getFooterForPage: (page: number) => Footer;
    },
    pageSetup: PageSetup,
    pageNumber: number,
  ): { extraHeaderHeightPx: number; extraFooterHeightPx: number } {
    let extraHeaderHeightPx = 0;
    let extraFooterHeightPx = 0;

    if (score.pageSetup.showHeader) {
      const header = score.getHeaderForPage(pageNumber);

      // Currently, headers and footers may only contain a single
      // text box.
      let headerHeightPx = (header.elements[0] as TextBoxElement).height;

      if (score.pageSetup.showHeaderHorizontalRule) {
        headerHeightPx +=
          score.pageSetup.headerHorizontalRuleMarginBottom +
          score.pageSetup.headerHorizontalRuleMarginTop +
          score.pageSetup.headerHorizontalRuleThickness;
      }

      extraHeaderHeightPx = Math.max(
        0,
        headerHeightPx - (pageSetup.topMargin - pageSetup.headerMargin),
      );
    }

    if (score.pageSetup.showFooter) {
      const footer = score.getFooterForPage(pageNumber);

      // Currently, headers and footers may only contain a single
      // text box.
      let footerHeightPx = (footer.elements[0] as TextBoxElement).height;

      if (score.pageSetup.showFooterHorizontalRule) {
        footerHeightPx +=
          score.pageSetup.footerHorizontalRuleMarginBottom +
          score.pageSetup.footerHorizontalRuleMarginTop +
          score.pageSetup.footerHorizontalRuleThickness;
      }

      extraFooterHeightPx = Math.max(
        0,
        footerHeightPx - (pageSetup.bottomMargin - pageSetup.footerMargin),
      );
    }

    return { extraHeaderHeightPx, extraFooterHeightPx };
  }

  private static adjustDropCapPosition(
    element: ScoreElement,
    neumeLineHeight: number,
    lyricsVerticalOffset: number,
    lyricAscent: number,
  ) {
    // Special logic to adjust drop caps.
    // This aligns the bottom of the drop cap with
    // the bottom of the lyrics.
    if (element.elementType !== ElementType.DropCap) {
      return;
    }

    const dropCapElement = element as DropCapElement;

    const distanceFromTopToBottomOfLyrics =
      (dropCapElement.computedLineSpan - 1) * neumeLineHeight +
      lyricsVerticalOffset +
      lyricAscent;

    const fontHeight = TextMeasurementService.getFontHeight(
      dropCapElement.computedFont,
    );
    const fontBoundingBoxAscent =
      TextMeasurementService.getFontBoundingBoxAscent(
        dropCapElement.computedFont,
      );
    const adjustment = fontBoundingBoxAscent - distanceFromTopToBottomOfLyrics;

    if (dropCapElement.computedLineHeight == null) {
      dropCapElement.computedLineHeight =
        fontHeight / dropCapElement.computedFontSize;
    }

    element.y -= adjustment;
  }

  private static getLyricProjections(
    noteElement: NoteElement,
    alignLeft: boolean,
  ) {
    if (noteElement.lyricsWidth === 0) {
      return { leftProjection: 0, rightProjection: 0 };
    }

    const w = noteElement.lyricsWidth;
    const n = noteElement.neumeWidth;
    const h = noteElement.lyricsHorizontalOffset;

    if (alignLeft) {
      // alignLeft is set for melisma starts whose lyric is wider than
      // the neume. The lyric extends to the right under subsequent
      // melisma neumes, so rightProjection is 0: those neumes provide
      // the space. The melisma-to-non-melisma collision check handles
      // the rare case where the lyric overflows past the melisma.
      return {
        leftProjection: Math.max(0, -h),
        rightProjection: 0,
      };
    }

    return {
      leftProjection: Math.max(0, (w - n - h) / 2),
      rightProjection: Math.max(0, (w - n + h) / 2),
    };
  }

  private static preventBreak(workspace: LayoutWorkspace) {
    this.addPenalty(workspace, MAX_COST, 0);
  }

  private static calculateInterNoteSpacing(
    noteElement: NoteElement,
    rightProjection: number,
    nextNoteElement: NoteElement | null,
    workspace: LayoutWorkspace,
    minimumLyricGap: number,
  ) {
    // Base m_i without the lyric-collision term ell_i. Can be
    // negative when T_i^left is large, i.e. when the cancellation
    // glue absorbs much of L_{i+1}. The library supports negative
    // glue widths.
    if (nextNoteElement == null) {
      return workspace.pageSetup.neumeDefaultSpacing + rightProjection;
    }

    const currentOverhangs = this.getNeumeOverhangs(
      noteElement,
      noteElement.alignLeft,
    );
    const nextOverhangs = this.getNeumeOverhangs(
      nextNoteElement,
      nextNoteElement.alignLeft,
    );
    const { leftProjection } = this.getLyricProjections(
      nextNoteElement,
      nextNoteElement.alignLeft,
    );
    // On the same line, T_i^left absorbs whatever left projection the
    // next note actually has. At a break that width reappears via
    // glue(L_{i+1}).
    const leftTuck = leftProjection;
    const rightTuck = Math.min(rightProjection, nextOverhangs.left);
    const baseWidth =
      workspace.pageSetup.neumeDefaultSpacing +
      rightProjection -
      leftTuck -
      rightTuck;

    if (nextNoteElement.lyricsWidth === 0) {
      return baseWidth;
    }

    // Lyric collision check: the visual gap between lyrics on the
    // same line includes the neume overhangs (room inside the neume
    // that the lyric doesn't occupy). Only add spacing when the
    // lyrics would actually be too close. For hyphenated melismas,
    // this same visual gap is also where the hyphen is drawn, so in
    // the absorbed-hyphen case it must reserve the hyphen width plus
    // the ordinary lyricsMinimumSpacing.
    //
    // Also handles melisma-to-non-melisma transitions: when a
    // carried melisma lyric from a previous note extends past note i's neume,
    // extra spacing may be needed before the next syllable.
    let collisionAdjustment = 0;
    if (noteElement.lyricsWidth > 0) {
      const lyricGap =
        baseWidth +
        currentOverhangs.right +
        nextOverhangs.left -
        rightProjection;
      if (lyricGap < minimumLyricGap) {
        collisionAdjustment = minimumLyricGap - lyricGap;
      }
    }

    collisionAdjustment = Math.max(
      collisionAdjustment,
      this.getMelismaCollisionAdjustment(
        workspace,
        nextNoteElement,
        baseWidth,
        nextOverhangs.left,
      ),
    );

    return baseWidth + collisionAdjustment;
  }

  private static getMelismaOverhang(
    workspace: LayoutWorkspace,
    neumesEndPx: number,
  ) {
    return workspace.melismaLyricsEndPx != null
      ? Math.max(0, workspace.melismaLyricsEndPx - neumesEndPx)
      : 0;
  }

  private static getNeumeOverhangs(
    noteElement: NoteElement,
    alignLeft: boolean,
  ): LyricOverhangs {
    if (alignLeft) {
      return {
        left: Math.max(0, noteElement.lyricsHorizontalOffset),
        right: Math.max(
          0,
          noteElement.neumeWidth -
            noteElement.lyricsHorizontalOffset -
            noteElement.lyricsWidth,
        ),
      };
    }

    return {
      left: Math.max(
        0,
        (noteElement.neumeWidth +
          noteElement.lyricsHorizontalOffset -
          noteElement.lyricsWidth) /
          2,
      ),
      right: Math.max(
        0,
        (noteElement.neumeWidth -
          noteElement.lyricsHorizontalOffset -
          noteElement.lyricsWidth) /
          2,
      ),
    };
  }

  private static getMelismaCollisionAdjustment(
    workspace: LayoutWorkspace,
    nextNoteElement: NoteElement,
    baseWidth: number,
    nextLeftOverhang: number,
  ) {
    if (
      workspace.melismaLyricsEndPx == null ||
      (nextNoteElement.isMelisma && !nextNoteElement.isMelismaStart)
    ) {
      return 0;
    }

    // A carried melisma can protrude farther than the measured lyric
    // text, especially when a trailing hyphen extends past the neume.
    // If the hyphen fits entirely inside the current neume, that case
    // is handled earlier by the ordinary lyric-gap check via
    // lyricsMinimumSpacing + hyphenWidth, so melismaOverhang
    // legitimately remains 0 here.
    const melismaOverhang = this.getMelismaOverhang(
      workspace,
      workspace.neumesEndPx,
    );
    if (melismaOverhang <= 0) {
      return 0;
    }

    // The final same-line gap between the melisma lyric's right edge
    // and the next syllable's left edge depends only on baseWidth,
    // the next note's left overhang, and the carried melisma
    // overhang: T_i^left and L_{i+1} cancel, so the result is
    // independent of the next note's left projection.
    const melismaGap = baseWidth + nextLeftOverhang - melismaOverhang;
    return Math.max(0, workspace.pageSetup.lyricsMinimumSpacing - melismaGap);
  }

  private static getBreakCost(
    noteElement: NoteElement,
    nextElement: ScoreElement | null,
    afterNextNoteElement: NoteElement | null,
  ) {
    const noteTied =
      !noteElement.pageBreak &&
      !noteElement.lineBreak &&
      (tieSet.has(noteElement.vocalExpressionNeume!) ||
        tieSet.has(noteElement.tie!));

    // TODO handle digorgon/trigorgon

    // Penalties are additive and clamped at MAX_COST. Some breakpoints
    // are prohibited outright with MAX_COST; combinations of softer
    // penalties can also saturate to MAX_COST and become prohibited.
    // The three 0.15-level penalties can stack to at most 0.45 * MAX_COST,
    // which stays below the strongly discouraged threshold.
    let breakCost = 0;

    if (nextElement?.elementType === ElementType.Martyria) {
      // Prohibit a break before a martyria.
      breakCost += MAX_COST;
    } else if (nextElement?.elementType === ElementType.Note) {
      const nextNoteElement = nextElement as NoteElement;
      if (noteTied) {
        // Prohibit a break across a tie (connecting heteron,
        // homalon, or yfen).
        breakCost += MAX_COST;
      }
      if (noteElement.vareia) {
        // Strongly discourage break after a vareia, comparable to
        // TeX's \relpenalty (0.5 * MAX_COST).
        breakCost += MAX_COST * 0.5;
      }
      if (kentemataSet.has(nextNoteElement.quantitativeNeume)) {
        // Strongly discourage break before a kentimata. The kentimata
        // are the upbeat associated with the previous neume's
        // downbeat, so it is awkward to place a break before
        // them. Comparable to TeX's \relpenalty (0.5 * MAX_COST).
        breakCost += MAX_COST * 0.5;
      }
      if (
        !noteElement.pageBreak &&
        !noteElement.lineBreak &&
        noteElement.isMelismaStart &&
        nextNoteElement.isMelisma &&
        !nextNoteElement.isMelismaStart
      ) {
        // Discourage break immediately after a melisma start,
        // before its first continuation neume (between notes 0
        // and 1 of the melisma, 0-indexed). Comparable to TeX's
        // \clubpenalty/\widowpenalty, but weighted more heavily
        // than beat-stealing breaks because it can isolate the
        // melisma-start syllable and risk lyric overflow.
        breakCost += MAX_COST * 0.2;
      }
      const isPenultimateMelismaNote =
        afterNextNoteElement == null ||
        !afterNextNoteElement.isMelisma ||
        afterNextNoteElement.isMelismaStart;
      if (
        noteElement.isMelisma &&
        nextNoteElement.isMelisma &&
        !nextNoteElement.isMelismaStart &&
        isPenultimateMelismaNote
      ) {
        // Discourage break between the second-to-last and last notes
        // of a melisma (between notes n-2 and n-1, 0-indexed).
        breakCost += MAX_COST * 0.15;
      }
      if (
        beatStealingSet.has(nextNoteElement.quantitativeNeume) ||
        (beatStealingWithGorgonSet.has(nextNoteElement.quantitativeNeume) &&
          nextNoteElement.gorgonNeume &&
          gorgonNeumeSet.has(nextNoteElement.gorgonNeume)) ||
        (beatStealingWithSecondaryGorgonSet.has(
          nextNoteElement.quantitativeNeume,
        ) &&
          nextNoteElement.secondaryGorgonNeume &&
          secondaryGorgonNeumeSet.has(nextNoteElement.secondaryGorgonNeume))
      ) {
        // Discourage break before a beat-stealing neume (running
        // elaphron, or a neume with a gorgon). This remains a weak
        // penalty because such breaks are not uncommon in the
        // classical sources.
        breakCost += MAX_COST * 0.1;
      }
    }

    return Math.min(breakCost, MAX_COST);
  }

  private static getBreakPenaltyWidth(
    rightProjection: number,
    workspace: LayoutWorkspace,
    nextNoteElement: NoteElement | null,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    let penaltyWidth = Math.max(
      rightProjection,
      this.getMelismaOverhang(workspace, workspace.neumesEndPx),
    );

    if (
      nextNoteElement?.measureBarLeft &&
      !nextNoteElement.measureBarLeft.endsWith('Above')
    ) {
      penaltyWidth +=
        measureBarWidthMap.get(nextNoteElement.measureBarLeft) ?? 0;
    }

    return penaltyWidth;
  }

  private static getTrailingNoteReservations(workspace: LayoutWorkspace) {
    const { pendingParagraph } = workspace;

    let trailingGlueWidth = 0;
    let i = pendingParagraph.length - 1;

    while (i >= 0 && pendingParagraph[i].type === 'glue') {
      trailingGlueWidth += (pendingParagraph[i] as Glue).width;
      i--;
    }

    for (; i >= 0; i--) {
      const item = pendingParagraph[i];
      if (item.type !== 'box' || !('element' in item)) {
        continue;
      }

      const element = (item as ElementBox).element;

      if (element.elementType !== ElementType.Note) {
        return null;
      }

      const noteElement = element as NoteElement;
      const { rightProjection } = this.getLyricProjections(
        noteElement,
        noteElement.alignLeft,
      );
      const neumesEndWithoutTrailingGlue =
        workspace.neumesEndPx - trailingGlueWidth;
      const melismaOverhang = this.getMelismaOverhang(
        workspace,
        neumesEndWithoutTrailingGlue,
      );

      return {
        melismaOverhang,
        finishingGlueWidth: Math.max(rightProjection, melismaOverhang),
      };
    }

    return null;
  }

  // Remove trailing glue from the paragraph. Only strips consecutive trailing
  // glue items, such as note cancellation glue, martyria spacing glue, or the
  // ordinary spacing left by other elements. The note's breakpoint penalty and
  // vanishing stretch glue are preserved.
  private static removeGlue(workspace: LayoutWorkspace) {
    const { pendingParagraph } = workspace;

    if (pendingParagraph.length === 0) {
      throw new Error('Cannot remove non-existent glue');
    }

    const lastElement = pendingParagraph[pendingParagraph.length - 1];
    if (lastElement.type !== 'glue') {
      throw new Error('Cannot remove non-glue: ' + lastElement.type);
    }

    while (
      pendingParagraph.length > 0 &&
      pendingParagraph[pendingParagraph.length - 1].type === 'glue'
    ) {
      const removed = pendingParagraph.pop()!;
      workspace.neumesEndPx -= (removed as Glue).width;
    }
  }

  private static getMaxPositiveAdjustmentRatio(ratios: number[]) {
    let maxPositiveAdjustmentRatio = 0;

    for (const ratio of ratios) {
      if (ratio <= 0) {
        continue;
      }
      if (!Number.isFinite(ratio)) {
        return Number.POSITIVE_INFINITY;
      }
      maxPositiveAdjustmentRatio = Math.max(maxPositiveAdjustmentRatio, ratio);
    }

    return maxPositiveAdjustmentRatio;
  }

  private static relaxMaxAdjustmentRatioCap(minimalCap: number) {
    if (minimalCap <= idealMaxAdjustmentRatio) {
      return idealMaxAdjustmentRatio;
    }

    return (
      Math.ceil(minimalCap / adjustmentRatioCapStep) * adjustmentRatioCapStep
    );
  }

  private static breakParagraphWithRatioCap(
    items: InputItem[],
    lineLengths: number | number[],
    maxAdjustmentRatio: number | null,
  ): LineBreakSolution {
    const breakpoints = breakLines(items, lineLengths, {
      maxAdjustmentRatio,
      initialMaxAdjustmentRatio: maxAdjustmentRatio ?? Number.POSITIVE_INFINITY,
      adjacentLooseTightPenalty: MAX_COST * 0.7,
    });
    const ratios = adjustmentRatios(items, lineLengths, breakpoints);

    return {
      breakpoints,
      ratios,
      maxPositiveAdjustmentRatio: this.getMaxPositiveAdjustmentRatio(ratios),
      requestedMaxAdjustmentRatio: maxAdjustmentRatio,
    };
  }

  private static tryBreakParagraphWithRatioCap(
    items: InputItem[],
    lineLengths: number | number[],
    maxAdjustmentRatio: number,
  ): LineBreakSolution | null {
    try {
      const solution = this.breakParagraphWithRatioCap(
        items,
        lineLengths,
        maxAdjustmentRatio,
      );

      return solution.maxPositiveAdjustmentRatio <= maxAdjustmentRatio
        ? solution
        : null;
    } catch (error) {
      if (error instanceof MaxAdjustmentExceededError) {
        return null;
      }
      throw error;
    }
  }

  private static breakParagraphOptimally(
    items: InputItem[],
    lineLengths: number | number[],
  ): LineBreakSolution {
    const tightSolution = this.tryBreakParagraphWithRatioCap(
      items,
      lineLengths,
      idealMaxAdjustmentRatio,
    );
    if (tightSolution != null) {
      return tightSolution;
    }

    let low = idealMaxAdjustmentRatio;
    let high = 2;
    let bestSolution = this.tryBreakParagraphWithRatioCap(
      items,
      lineLengths,
      high,
    );

    while (bestSolution == null && high < maxAdjustmentRatioSearchLimit) {
      low = high;
      high *= 2;
      bestSolution = this.tryBreakParagraphWithRatioCap(
        items,
        lineLengths,
        high,
      );
    }

    if (bestSolution == null) {
      return this.breakParagraphWithRatioCap(items, lineLengths, null);
    }

    for (let i = 0; i < maxAdjustmentRatioSearchIterations; i++) {
      if (
        high - low <= adjustmentRatioCapStep ||
        this.relaxMaxAdjustmentRatioCap(low) ===
          this.relaxMaxAdjustmentRatioCap(high)
      ) {
        break;
      }

      const mid = (low + high) / 2;
      const candidate = this.tryBreakParagraphWithRatioCap(
        items,
        lineLengths,
        mid,
      );

      if (candidate == null) {
        low = mid;
      } else {
        high = mid;
        bestSolution = candidate;
      }
    }

    const relaxedCap = this.relaxMaxAdjustmentRatioCap(
      bestSolution.maxPositiveAdjustmentRatio,
    );

    return this.breakParagraphWithRatioCap(items, lineLengths, relaxedCap);
  }

  private static endParagraph(
    lineBreakType: LineBreakType,
    workspace: LayoutWorkspace,
  ) {
    const { pageSetup, pendingParagraph, completedParagraphs } = workspace;

    if (pendingParagraph.length === 0) {
      throw new Error('Cannot end an empty paragraph');
    }

    // If the paragraph ends immediately after a note, the trailing
    // cancellation glue contains that note's right-edge reservation.
    // removeGlue strips it, so materialize the reservation into the
    // finishing glue width instead.
    const trailingNoteReservations =
      this.getTrailingNoteReservations(workspace);
    const finishingGlueWidth = trailingNoteReservations
      ? trailingNoteReservations.finishingGlueWidth
      : 0;

    // Remove the existing glue so that we can apply finishing glue
    this.removeGlue(workspace);

    // Prevent break before finishing glue
    this.preventBreak(workspace);

    // Apply finishing glue. The width reserves space for the last
    // note's right-edge lyric extent. The stretch absorbs remaining
    // line slack (0 for justified paragraphs, `MAX_COST` otherwise).
    const finishingGlueStretch =
      lineBreakType === LineBreakType.Justify ? 0 : MAX_COST;
    this.addGlue(
      {
        type: 'glue',
        width: finishingGlueWidth,
        stretch: finishingGlueStretch,
        shrink: 0,
      },
      workspace,
    );

    // Force break and end paragraph
    this.forceBreak(workspace);

    // Compute per-line widths for multiline drop caps
    let lineLengths: number | number[];
    if (workspace.pendingDropCapContinuationLines > 0) {
      const widths = new Array(pendingParagraph.length + 1).fill(
        pageSetup.innerPageWidth,
      );
      const reducedWidth =
        pageSetup.innerPageWidth - workspace.pendingDropCapWidthPx;

      for (
        let j = 1;
        j <= workspace.pendingDropCapContinuationLines && j < widths.length;
        j++
      ) {
        widths[j] = reducedWidth;
      }

      lineLengths = widths;
    } else {
      lineLengths = pageSetup.innerPageWidth;
    }

    // Run the total-fit algorithm for line breaking
    if (workspace.loggingEnabled) {
      console.log('Breaking lines', pendingParagraph);
    }
    const solution = this.breakParagraphOptimally(
      pendingParagraph,
      lineLengths,
    );
    const { breakpoints, ratios } = solution;

    // We have a winner
    if (workspace.loggingEnabled) {
      console.log('Breakpoints', breakpoints);
      console.log(
        'Requested max adjustment ratio',
        solution.requestedMaxAdjustmentRatio,
      );
    }
    const positions: PositionedItem[] = positionItems(
      pendingParagraph,
      lineLengths,
      breakpoints,
    );
    if (workspace.loggingEnabled) {
      console.log('Positions', positions);
      console.log('Adjustment ratios', ratios);
    }
    completedParagraphs.push({
      paragraph: pendingParagraph,
      positions,
      ratios,
      dropCapWidthPx: workspace.pendingDropCapWidthPx,
      dropCapContinuationLines: workspace.pendingDropCapContinuationLines,
    });

    // Reset state
    workspace.pendingParagraph = [];
    workspace.neumesEndPx = 0;
    workspace.lyricsEndPx = -workspace.pageSetup.neumeDefaultSpacing;
    workspace.melismaLyricsEndPx = null;
    workspace.pendingDropCapWidthPx = 0;
    workspace.pendingDropCapContinuationLines = 0;
    workspace.pendingMartyriaBarTransferWidth = 0;
  }

  private static forceBreak(workspace: LayoutWorkspace) {
    const { pendingParagraph } = workspace;
    pendingParagraph.push(forcedBreak());
  }

  private static getLineHeight(
    line: Line,
    defaultLineHeight: number,
    neumeLineHeight: number,
    neumeHeight: number,
  ) {
    let textBox: TextBoxElement | null = null;
    let richTextBox: RichTextBoxElement | null = null;
    let modeKey: ModeKeyElement | null = null;
    let imageBox: ImageBoxElement | null = null;
    let hasNeumeContent = false;

    for (const element of line.elements) {
      switch (element.elementType) {
        case ElementType.TextBox:
          if (!(element as TextBoxElement).inline) {
            textBox = element as TextBoxElement;
          }
          break;
        case ElementType.RichTextBox:
          if (richTextBox === null && !(element as RichTextBoxElement).inline) {
            richTextBox = element as RichTextBoxElement;
          }
          break;
        case ElementType.ModeKey:
          if (modeKey === null) {
            modeKey = element as ModeKeyElement;
          }
          break;
        case ElementType.ImageBox:
          if (imageBox === null) {
            imageBox = element as ImageBoxElement;
          }
          break;
        case ElementType.Martyria:
        case ElementType.Note:
        case ElementType.Tempo:
        case ElementType.DropCap:
        case ElementType.Empty:
          hasNeumeContent = true;
          break;
      }

      if (textBox !== null) {
        break;
      }
    }

    if (textBox !== null) {
      return textBox.height + textBox.marginTop + textBox.marginBottom;
    }

    if (richTextBox !== null) {
      return (
        richTextBox.height + richTextBox.marginTop + richTextBox.marginBottom
      );
    }

    if (modeKey !== null) {
      return modeKey.height + modeKey.marginTop + modeKey.marginBottom;
    }

    if (imageBox !== null) {
      return imageBox.inline
        ? Math.max(imageBox.imageHeight, neumeHeight)
        : imageBox.imageHeight;
    }

    if (hasNeumeContent) {
      return neumeLineHeight;
    }

    return defaultLineHeight;
  }

  private static processHeader(
    header: Header,
    pageSetup: PageSetup,
    neumeHeight: number,
  ) {
    // Currently headers may only contain a single text box.
    // It may be a rich textbox, but we don't need to do any
    // processing in that case.
    if (
      header.elements.length > 0 &&
      header.elements[0].elementType === ElementType.TextBox
    ) {
      const element = header.elements[0] as TextBoxElement;

      element.width = this.processTextBoxElement(
        element,
        pageSetup,
        neumeHeight,
      );
    } else if (
      header.elements.length > 0 &&
      header.elements[0].elementType === ElementType.RichTextBox
    ) {
      const element = header.elements[0] as RichTextBoxElement;
      element.width = pageSetup.innerPageWidth;
    }
  }

  private static processFooter(
    footer: Footer,
    pageSetup: PageSetup,
    neumeHeight: number,
  ) {
    // Currently footers may only contain a single text box.
    // It may be a rich textbox, but we don't need to do any
    // processing in that case.
    if (
      footer.elements.length > 0 &&
      footer.elements[0].elementType === ElementType.TextBox
    ) {
      const element = footer.elements[0] as TextBoxElement;

      element.width = this.processTextBoxElement(
        element,
        pageSetup,
        neumeHeight,
      );
    } else if (
      footer.elements.length > 0 &&
      footer.elements[0].elementType === ElementType.RichTextBox
    ) {
      const element = footer.elements[0] as RichTextBoxElement;
      element.width = pageSetup.innerPageWidth;
    }
  }

  private static processTextBoxElement(
    textBoxElement: TextBoxElement,
    pageSetup: PageSetup,
    neumeHeight: number,
  ) {
    let elementWidthPx = 0;

    if (textBoxElement.inline) {
      textBoxElement.computedFontFamily = textBoxElement.useDefaultStyle
        ? pageSetup.lyricsDefaultFontFamily
        : textBoxElement.fontFamily;

      textBoxElement.computedFontSize = textBoxElement.useDefaultStyle
        ? pageSetup.lyricsDefaultFontSize
        : textBoxElement.fontSize;

      textBoxElement.computedColor = textBoxElement.useDefaultStyle
        ? pageSetup.lyricsDefaultColor
        : textBoxElement.color;

      textBoxElement.computedStrokeWidth = textBoxElement.useDefaultStyle
        ? pageSetup.lyricsDefaultStrokeWidth
        : textBoxElement.strokeWidth;

      textBoxElement.computedFontWeight = textBoxElement.useDefaultStyle
        ? pageSetup.lyricsDefaultFontWeight
        : textBoxElement.bold
          ? '700'
          : '400';

      textBoxElement.computedFontStyle = textBoxElement.useDefaultStyle
        ? pageSetup.lyricsDefaultFontStyle
        : textBoxElement.italic
          ? 'italic'
          : 'normal';

      if (textBoxElement.fillWidth) {
        // Width is computed in Phase 2 after line breaking. During Phase 1 we
        // use the textbox's intrinsic no-wrap width so the line breaker can
        // move it to the next line when the remaining space is too small.
        elementWidthPx = this.getFillWidthPlaceholderWidth(
          textBoxElement,
          pageSetup,
        );
      } else if (textBoxElement.customWidth != null) {
        elementWidthPx = textBoxElement.customWidth;
      } else {
        elementWidthPx = this.measurePlainTextWidth(
          textBoxElement.content,
          textBoxElement.computedFont,
        );
      }
    } else {
      elementWidthPx = pageSetup.innerPageWidth;

      textBoxElement.computedFontFamily = textBoxElement.useDefaultStyle
        ? pageSetup.textBoxDefaultFontFamily
        : textBoxElement.fontFamily;

      textBoxElement.computedFontSize = textBoxElement.useDefaultStyle
        ? pageSetup.textBoxDefaultFontSize
        : textBoxElement.fontSize;

      textBoxElement.computedColor = textBoxElement.useDefaultStyle
        ? pageSetup.textBoxDefaultColor
        : textBoxElement.color;

      textBoxElement.computedStrokeWidth = textBoxElement.useDefaultStyle
        ? pageSetup.textBoxDefaultStrokeWidth
        : textBoxElement.strokeWidth;

      textBoxElement.computedFontWeight = textBoxElement.useDefaultStyle
        ? pageSetup.textBoxDefaultFontWeight
        : textBoxElement.bold
          ? '700'
          : '400';

      textBoxElement.computedFontStyle = textBoxElement.useDefaultStyle
        ? pageSetup.textBoxDefaultFontStyle
        : textBoxElement.italic
          ? 'italic'
          : 'normal';

      textBoxElement.computedLineHeight = textBoxElement.useDefaultStyle
        ? pageSetup.textBoxDefaultLineHeight
        : textBoxElement.lineHeight;
    }

    if (textBoxElement.inline) {
      textBoxElement.height = neumeHeight;
      textBoxElement.minHeight = Unit.fromPt(0.5);
    } else if (textBoxElement.customHeight != null) {
      textBoxElement.height = textBoxElement.customHeight;
      textBoxElement.minHeight = textBoxElement.customHeight;
    } else {
      const fontHeight = TextMeasurementService.getFontHeight(
        textBoxElement.computedFont,
      );
      textBoxElement.minHeight = fontHeight;
    }

    return elementWidthPx;
  }

  private static saveElementState(element: ScoreElement) {
    // Save the current element state so we can determine which elements updated
    element.updated = false;

    element.widthPrevious = element.width;

    if (element.elementType === ElementType.Martyria) {
      const martyria = element as MartyriaElement;
      martyria.notePrevious = martyria.note;
      martyria.rootSignPrevious = martyria.rootSign;
    } else if (element.elementType === ElementType.Note) {
      const note = element as NoteElement;
      note.fthoraPrevious = note.fthora;
      note.secondaryFthoraPrevious = note.secondaryFthora;
      note.tertiaryFthoraPrevious = note.tertiaryFthora;
      note.computedMeasureBarLeftPrevious = note.computedMeasureBarLeft;
      note.computedMeasureBarRightPrevious = note.computedMeasureBarRight;
      note.computedIsonOffsetYPrevious = note.computedIsonOffsetY;
    } else if (element.elementType === ElementType.TextBox) {
      const textbox = element as TextBoxElement;
      textbox.heightPrevious = textbox.height;
      textbox.computedFontFamilyPrevious = textbox.computedFontFamily;
      textbox.computedFontSizePrevious = textbox.computedFontSize;
      textbox.computedFontWeightPrevious = textbox.computedFontWeight;
      textbox.computedFontStylePrevious = textbox.computedFontStyle;
      textbox.computedColorPrevious = textbox.computedColor;
      textbox.computedStrokeWidthPrevious = textbox.computedStrokeWidth;
      textbox.computedLineHeightPrevious = textbox.computedLineHeight;
    } else if (element.elementType === ElementType.ModeKey) {
      const modeKey = element as ModeKeyElement;
      modeKey.computedFontFamilyPrevious = modeKey.computedFontFamily;
      modeKey.computedFontSizePrevious = modeKey.computedFontSize;
      modeKey.computedHeightAdjustmentPrevious =
        modeKey.computedHeightAdjustment;
      modeKey.computedColorPrevious = modeKey.computedColor;
      modeKey.computedStrokeWidthPrevious = modeKey.computedStrokeWidth;
    } else if (element.elementType === ElementType.DropCap) {
      const dropCap = element as DropCapElement;
      dropCap.computedFontFamilyPrevious = dropCap.computedFontFamily;
      dropCap.computedFontSizePrevious = dropCap.computedFontSize;
      dropCap.computedFontWeightPrevious = dropCap.computedFontWeight;
      dropCap.computedFontStylePrevious = dropCap.computedFontStyle;
      dropCap.computedColorPrevious = dropCap.computedColor;
      dropCap.computedStrokeWidthPrevious = dropCap.computedStrokeWidth;
      dropCap.computedLineHeightPrevious = dropCap.computedLineHeight;
    }
  }

  private static checkElementState(element: ScoreElement) {
    if (!element.updated && element.elementType === ElementType.Martyria) {
      const martyria = element as MartyriaElement;
      martyria.updated =
        martyria.notePrevious !== martyria.note ||
        martyria.rootSignPrevious !== martyria.rootSign;
    }

    if (!element.updated && element.elementType === ElementType.Note) {
      const note = element as NoteElement;

      // Refresh notes that have note indicators. Indicators should be rare enough
      // that we don't need to check whether any scale notes actually changed
      note.updated =
        note.noteIndicator ||
        note.fthoraPrevious !== note.fthora ||
        note.secondaryFthoraPrevious !== note.secondaryFthora ||
        note.tertiaryFthoraPrevious !== note.tertiaryFthora ||
        note.computedMeasureBarLeftPrevious !== note.computedMeasureBarLeft ||
        note.computedMeasureBarRightPrevious !== note.computedMeasureBarRight ||
        note.computedIsonOffsetYPrevious !== note.computedIsonOffsetY;
    }

    if (!element.updated && element.elementType === ElementType.TextBox) {
      const textbox = element as TextBoxElement;

      textbox.updated =
        textbox.widthPrevious !== textbox.width ||
        textbox.computedFontFamilyPrevious !== textbox.computedFontFamily ||
        textbox.computedFontSizePrevious !== textbox.computedFontSize ||
        textbox.computedFontWeightPrevious !== textbox.computedFontWeight ||
        textbox.computedFontStylePrevious !== textbox.computedFontStyle ||
        textbox.computedColorPrevious !== textbox.computedColor ||
        textbox.computedStrokeWidthPrevious !== textbox.computedStrokeWidth ||
        textbox.computedLineHeightPrevious !== textbox.computedLineHeight;
    }

    if (!element.updated && element.elementType === ElementType.RichTextBox) {
      const textbox = element as RichTextBoxElement;

      textbox.updated = textbox.widthPrevious !== textbox.width;
    }

    if (!element.updated && element.elementType === ElementType.ModeKey) {
      const modeKey = element as ModeKeyElement;

      modeKey.updated =
        modeKey.widthPrevious !== modeKey.width ||
        modeKey.computedFontFamilyPrevious !== modeKey.computedFontFamily ||
        modeKey.computedFontSizePrevious !== modeKey.computedFontSize ||
        modeKey.computedHeightAdjustmentPrevious !==
          modeKey.computedHeightAdjustment ||
        modeKey.computedColorPrevious !== modeKey.computedColor ||
        modeKey.computedStrokeWidthPrevious !== modeKey.computedStrokeWidth;
    }

    if (!element.updated && element.elementType === ElementType.DropCap) {
      const dropCap = element as DropCapElement;

      dropCap.updated =
        dropCap.widthPrevious !== dropCap.width ||
        dropCap.computedFontFamilyPrevious !== dropCap.computedFontFamily ||
        dropCap.computedFontSizePrevious !== dropCap.computedFontSize ||
        dropCap.computedFontWeightPrevious !== dropCap.computedFontWeight ||
        dropCap.computedFontStylePrevious !== dropCap.computedFontStyle ||
        dropCap.computedColorPrevious !== dropCap.computedColor ||
        dropCap.computedStrokeWidthPrevious !== dropCap.computedStrokeWidth ||
        dropCap.computedLineHeightPrevious !== dropCap.computedLineHeight;
    }
  }

  public static getNoteWidth(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    args: GetNoteWidthArgs,
  ) {
    const {
      lyricsVerticalOffset,
      vareiaWidth,
      measureBarWidthMap,
      runningElaphronWidth,
      elaphronWidth,
    } = args;

    noteElement.lyricsVerticalOffset = lyricsVerticalOffset;

    noteElement.neumeWidth = this.getNeumeWidthFromCache(
      neumeWidthCache,
      noteElement.quantitativeNeume,
      pageSetup,
    );

    if (noteElement.lyrics.length > 0) {
      noteElement.lyricsWidth = this.getTextWidthFromCache(
        textWidthCache,
        noteElement,
        pageSetup,
      );
    } else {
      noteElement.lyricsWidth = 0;
    }

    noteElement.lyricsHorizontalOffset = 0;

    // Handle special case for vareia:
    // Shift the lyrics to the right so that they
    // are centered under the main neume
    if (noteElement.vareia) {
      if (pageSetup.melkiteRtl) {
        noteElement.lyricsHorizontalOffset -= vareiaWidth;
      } else {
        noteElement.lyricsHorizontalOffset += vareiaWidth;
      }

      noteElement.neumeWidth += vareiaWidth;
    }

    // Handle special case for measure bars:
    // Shift the lyrics to the right so that they
    // are centered under the main neume
    const measureBarLeft = noteElement.measureBarLeft;

    const measureBarLeftWidth =
      measureBarLeft != null ? measureBarWidthMap.get(measureBarLeft) : null;

    if (measureBarLeftWidth != null) {
      noteElement.lyricsHorizontalOffset += measureBarLeftWidth;
      noteElement.neumeWidth += measureBarLeftWidth;
    }

    const measureBarRight = noteElement.measureBarRight;

    const measureBarRightWidth =
      measureBarRight != null ? measureBarWidthMap.get(measureBarRight) : null;

    if (measureBarRightWidth != null) {
      noteElement.lyricsHorizontalOffset -= measureBarRightWidth;
      noteElement.neumeWidth += measureBarRightWidth;
    }

    // Handle special case for running elaphron:
    // Shift the lyrics to the right so that they
    // are centered under the elaphron
    if (noteElement.quantitativeNeume === QuantitativeNeume.RunningElaphron) {
      // The stand-alone apostrophos is not the same width
      // as the apostrophros in the running elaphron, but
      // the elaphrons are the same width in both neumes.
      const offset = runningElaphronWidth - elaphronWidth;

      if (pageSetup.melkiteRtl) {
        noteElement.lyricsHorizontalOffset -= offset;
      } else {
        noteElement.lyricsHorizontalOffset += offset;
      }
    }

    return noteElement.spaceAfter + noteElement.neumeWidth;
  }

  public static getMartyriaWidth(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    const mappingNote = !martyriaElement.error
      ? NeumeMappingService.getMapping(martyriaElement.note)
      : NeumeMappingService.getMapping(Note.Pa);
    const mappingRoot = !martyriaElement.error
      ? NeumeMappingService.getMapping(martyriaElement.rootSign)
      : NeumeMappingService.getMapping(RootSign.Alpha);
    const mappingMeasureBarLeft = martyriaElement.measureBarLeft
      ? NeumeMappingService.getMapping(martyriaElement.measureBarLeft)
      : null;
    const mappingMeasureBarRight = martyriaElement.measureBarRight
      ? NeumeMappingService.getMapping(martyriaElement.measureBarRight)
      : null;
    const mappingTempoLeft = martyriaElement.tempoLeft
      ? NeumeMappingService.getMapping(martyriaElement.tempoLeft)
      : null;
    const mappingTempoRight = martyriaElement.tempoRight
      ? NeumeMappingService.getMapping(martyriaElement.tempoRight)
      : null;
    const mappingQuantitativeNeume =
      martyriaElement.alignRight && martyriaElement.quantitativeNeume
        ? NeumeMappingService.getMapping(martyriaElement.quantitativeNeume)
        : null;

    // Split the total padding between inline rendering and trailing glue.
    // The renderer applies padding as marginLeft on the quantitative neume
    // in NeumeBoxMartyria.vue, so only that case should keep it inside the box.
    martyriaElement.padding =
      martyriaElement.alignRight && martyriaElement.quantitativeNeume
        ? pageSetup.neumeDefaultFontSize * pageSetup.spaceAfterMartyriaFactor
        : 0;

    martyriaElement.neumeWidth = this.getNeumeWidthFromCache(
      neumeWidthCache,
      martyriaElement.note,
      pageSetup,
    );

    if (martyriaElement.tempoLeft) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        neumeWidthCache,
        martyriaElement.tempoLeft,
        pageSetup,
      );
    }

    if (martyriaElement.tempoRight) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        neumeWidthCache,
        martyriaElement.tempoRight,
        pageSetup,
      );
    }

    if (martyriaElement.measureBarLeft) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        neumeWidthCache,
        martyriaElement.measureBarLeft,
        pageSetup,
      );
    }

    if (martyriaElement.measureBarRight) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        neumeWidthCache,
        martyriaElement.measureBarRight,
        pageSetup,
      );
    }

    if (martyriaElement.alignRight && martyriaElement.quantitativeNeume) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        neumeWidthCache,
        martyriaElement.quantitativeNeume,
        pageSetup,
      );
    }

    return (
      martyriaElement.spaceAfter +
      (martyriaElement.padding +
        TextMeasurementService.getTextWidth(
          mappingNote.text,
          `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
        ) +
        TextMeasurementService.getTextWidth(
          mappingRoot.text,
          `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
        ) +
        (mappingMeasureBarLeft
          ? TextMeasurementService.getTextWidth(
              mappingMeasureBarLeft.text,
              `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
            )
          : 0) +
        (mappingMeasureBarRight
          ? TextMeasurementService.getTextWidth(
              mappingMeasureBarRight.text,
              `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
            )
          : 0) +
        (mappingTempoLeft
          ? TextMeasurementService.getTextWidth(
              mappingTempoLeft.text,
              `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
            )
          : 0) +
        (mappingTempoRight
          ? TextMeasurementService.getTextWidth(
              mappingTempoRight.text,
              `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
            )
          : 0) +
        (mappingQuantitativeNeume
          ? TextMeasurementService.getTextWidth(
              mappingQuantitativeNeume.text,
              `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
            )
          : 0))
    );
  }

  public static addMelismas(pages: Page[], pageSetup: PageSetup) {
    // First calculate some constants

    const widthOfTatweel = TextMeasurementService.getTextWidth(
      TATWEEL,
      pageSetup.lyricsFont,
    );

    const widthOfHyphen = TextMeasurementService.getTextWidth(
      '-',
      pageSetup.lyricsFont,
    );

    const widthOfSpace = TextMeasurementService.getTextWidth(
      ' ',
      pageSetup.lyricsFont,
    );

    const elaphronMapping = NeumeMappingService.getMapping(
      QuantitativeNeume.Elaphron,
    );
    const elaphronWidth = TextMeasurementService.getTextWidth(
      elaphronMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const runningElaphronMapping = NeumeMappingService.getMapping(
      QuantitativeNeume.RunningElaphron,
    );
    const runningElaphronWidth = TextMeasurementService.getTextWidth(
      runningElaphronMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const neumeFont = `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`;
    const melismaMeasureBarWidthMap = new Map<MeasureBar, number>();
    for (const bar of [
      MeasureBar.MeasureBarRight,
      MeasureBar.MeasureBarTop,
      MeasureBar.MeasureBarDouble,
      MeasureBar.MeasureBarTheseos,
      MeasureBar.MeasureBarShortDouble,
      MeasureBar.MeasureBarShortTheseos,
    ]) {
      const mapping = NeumeMappingService.getMapping(bar);
      melismaMeasureBarWidthMap.set(
        bar,
        TextMeasurementService.getTextWidth(mapping.text, neumeFont),
      );
    }

    let melismaSyllables: MelismaSyllables | null = null;
    let melismaLyricsEnd: number | null = null;

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];

      for (let lineIndex = 0; lineIndex < page.lines.length; lineIndex++) {
        const line = page.lines[lineIndex];

        melismaLyricsEnd = null;

        let firstElementOnNextLine: ScoreElement | null = null;

        if (lineIndex + 1 < page.lines.length) {
          firstElementOnNextLine = page.lines[lineIndex + 1].elements[0];
        } else if (pageIndex + 1 < pages.length) {
          firstElementOnNextLine = pages[pageIndex + 1].lines[0].elements[0];
        }

        const noteElements = line.elements.filter(
          (x) => x.elementType === ElementType.Note,
        ) as NoteElement[];

        const indexOfFirstNote = line.elements.findIndex(
          (x) => x.elementType === ElementType.Note,
        );

        for (const element of noteElements) {
          const index = line.elements.indexOf(element);

          // We do not simply check for index === 0 because we also want
          // to include the case where the first letter of the melisma
          // is a drop cap at the beginning of the line
          const isIntermediateMelismaAtStartOfLine =
            index === indexOfFirstNote &&
            element.isMelisma &&
            !element.isMelismaStart;

          // First, clear melisma fields, since
          // they may be stale
          element.melismaText = '';
          element.hyphenOffsets = [];
          element.melismaWidth = 0;
          element.isFullMelisma = isIntermediateMelismaAtStartOfLine;

          if (
            !pageSetup.disableGreekMelismata &&
            MelismaHelperGreek.isGreek(element.lyrics)
          ) {
            if (element.isMelismaStart) {
              let text = element.lyrics;

              // If the previous element is a drop cap, we need to
              // prepend the drop cap content to the melisma text
              if (index > 0) {
                const previousElement = line.elements[index - 1];
                if (previousElement.elementType === ElementType.DropCap) {
                  text = `${(previousElement as DropCapElement).content}${text}`;
                }
              }

              melismaSyllables = MelismaHelperGreek.getMelismaSyllable(text);

              melismaLyricsEnd =
                element.x +
                element.lyricsHorizontalOffset / 2 +
                element.neumeWidth / 2 +
                element.lyricsWidth / 2;
            } else {
              melismaSyllables = null;
            }

            continue;
          } else if (element.lyrics.length > 0) {
            melismaSyllables = null;
          }

          if (melismaSyllables != null) {
            if (element.isMelisma) {
              element.melismaText = melismaSyllables.middle;

              // Check the width of the melisma text and hide it if it's
              //  too close to previous the lyrics
              if (melismaLyricsEnd != null) {
                const lyricsWidth = this.getTextWidthFromCache(
                  textWidthCache,
                  element,
                  pageSetup,
                  element.melismaText,
                );

                const melismaLyricsStart =
                  element.x +
                  element.lyricsHorizontalOffset / 2 +
                  element.neumeWidth / 2 -
                  lyricsWidth / 2;

                if (melismaLyricsEnd > melismaLyricsStart) {
                  element.melismaText = '';
                }
              }
              continue;
            } else {
              melismaSyllables = null;
            }
          }

          if (element.isMelismaStart || isIntermediateMelismaAtStartOfLine) {
            // finalElement: The final element in the melisma, or the final
            // element in the line
            // nextElement: The next element in the line after the final element,
            // if there is one.
            const { finalElement, nextElement } = this.findFinalAndNextElement(
              line,
              element,
              firstElementOnNextLine,
              index + 1,
            );

            let start = 0;
            let end = 0;

            let nextNoteElement: NoteElement | null = null;

            if (nextElement?.elementType === ElementType.Note) {
              nextNoteElement = nextElement as NoteElement;
            }

            // Calculate the start of the melisma
            if (isIntermediateMelismaAtStartOfLine) {
              // Special case. No lyrics, so start at the
              // beginning of the neume.
              start = element.x;
            } else if (element.alignLeft) {
              if (!pageSetup.melkiteRtl) {
                start =
                  element.x +
                  element.lyricsHorizontalOffset +
                  element.lyricsWidth;
              } else {
                start =
                  element.x -
                  element.lyricsHorizontalOffset +
                  element.lyricsWidth;
              }
            } else if (element.lyricsWidth > element.neumeWidth) {
              if (!pageSetup.melkiteRtl) {
                start =
                  element.x +
                  element.neumeWidth +
                  element.lyricsHorizontalOffset / 2 +
                  (element.lyricsWidth - element.neumeWidth) / 2;
              } else {
                start =
                  element.x +
                  element.neumeWidth -
                  element.lyricsHorizontalOffset / 2 +
                  (element.lyricsWidth - element.neumeWidth) / 2;
              }
            } else {
              if (!pageSetup.melkiteRtl) {
                start =
                  element.x +
                  element.neumeWidth / 2 +
                  element.lyricsWidth / 2 +
                  element.lyricsHorizontalOffset / 2;
              } else {
                start =
                  element.x +
                  element.neumeWidth / 2 +
                  element.lyricsWidth / 2 -
                  element.lyricsHorizontalOffset / 2;
              }
            }

            // Calculate the end and the final melisma width
            if (element.isHyphen) {
              if (nextNoteElement == null) {
                if (finalElement) {
                  end =
                    finalElement.x +
                    this.getFinalElementWidth(finalElement) -
                    this.getFinalElementMeasureBarRightWidth(
                      finalElement,
                      melismaMeasureBarWidthMap,
                    );
                } else {
                  end = element.x + element.neumeWidth;
                }
              } else if (
                nextNoteElement.lyricsWidth > nextNoteElement.neumeWidth
              ) {
                // At the start of a melisma, the syllable is aligned to the
                // left of the neume, but only if the lyrics are wider than the neume
                if (nextNoteElement.alignLeft) {
                  end =
                    nextNoteElement.x + nextNoteElement.lyricsHorizontalOffset;
                } else {
                  // Otherwise, the syllable is centered under the neume
                  end =
                    nextNoteElement.x -
                    (nextNoteElement.lyricsWidth -
                      nextNoteElement.neumeWidth -
                      nextNoteElement.lyricsHorizontalOffset) /
                      2;
                }
              } else {
                end =
                  nextNoteElement.x +
                  nextNoteElement.neumeWidth / 2 -
                  nextNoteElement.lyricsWidth / 2 +
                  nextNoteElement.lyricsHorizontalOffset / 2;
              }

              element.melismaWidth = Math.max(end - start, 0);

              const widthOfHyphenForThisElement = element.lyricsUseDefaultStyle
                ? widthOfHyphen
                : this.getTextWidthFromCache(
                    textWidthCache,
                    element,
                    pageSetup,
                    '-',
                  );

              const hyphenSpacing = Math.max(
                pageSetup.hyphenSpacing,
                widthOfHyphenForThisElement,
              );

              let numberOfHyphensNeeded = Math.floor(
                element.melismaWidth / hyphenSpacing,
              );
              // If this is the last note on the page, always show the hyphen
              if (numberOfHyphensNeeded == 0 && nextElement == null) {
                numberOfHyphensNeeded = 1;
                element.melismaWidth = Math.max(
                  element.melismaWidth,
                  widthOfHyphenForThisElement + widthOfSpace,
                );
              }

              if (
                numberOfHyphensNeeded == 0 &&
                element.melismaWidth >= widthOfHyphenForThisElement
              ) {
                numberOfHyphensNeeded = 1;
              }

              for (let i = 1; i <= numberOfHyphensNeeded; i++) {
                element.hyphenOffsets.push(
                  element.melismaWidth * (i / (numberOfHyphensNeeded + 1)) -
                    widthOfHyphenForThisElement / 2,
                );
              }
            } else if (!pageSetup.melkiteRtl) {
              // Else not a hyphen, so an underscore
              const nextElementIsRunningElaphron =
                nextElement &&
                nextElement.elementType === ElementType.Note &&
                (nextElement as NoteElement).quantitativeNeume ===
                  QuantitativeNeume.RunningElaphron;

              // Note the special case for when the next neume is a running elaphron.
              // The melisma, which by convention must always be a final melisma,
              // should run all the way to the elaphron, instead of stopping at
              // the apostrophos.

              if (nextNoteElement != null && nextElementIsRunningElaphron) {
                // The stand-alone apostrophos is not the same width
                // as the apostrophros in the running elaphron, but
                // the elaphrons are the same width in both neumes.
                end =
                  nextNoteElement.x + (runningElaphronWidth - elaphronWidth);

                if (nextNoteElement.lyricsWidth > elaphronWidth) {
                  if (nextNoteElement.alignLeft) {
                    end = Math.min(
                      end,
                      nextNoteElement.x +
                        (runningElaphronWidth - elaphronWidth) -
                        pageSetup.lyricsMinimumSpacing,
                    );
                  } else {
                    end = Math.min(
                      end,
                      nextNoteElement.x +
                        (runningElaphronWidth - elaphronWidth) -
                        (nextNoteElement.lyricsWidth - elaphronWidth) / 2 -
                        pageSetup.lyricsMinimumSpacing,
                    );
                  }
                }
              } else {
                if (finalElement == null) {
                  end = element.x + element.neumeWidth;
                } else {
                  end =
                    finalElement.x +
                    this.getFinalElementWidth(finalElement) -
                    this.getFinalElementMeasureBarRightWidth(
                      finalElement,
                      melismaMeasureBarWidthMap,
                    );
                }

                if (nextNoteElement != null && nextNoteElement.alignLeft) {
                  // At the start of a melisma, the syllable is aligned to the
                  // left of the neume, but only if the lyrics are wider than the neume
                  end = Math.min(
                    end,
                    nextNoteElement.x +
                      nextNoteElement.lyricsHorizontalOffset -
                      pageSetup.lyricsMinimumSpacing,
                  );
                } else if (
                  nextNoteElement != null &&
                  nextNoteElement.lyricsWidth > nextNoteElement.neumeWidth
                ) {
                  // Otherwise, the lyrics are centered under the element.
                  end = Math.min(
                    end,
                    nextNoteElement.x +
                      nextNoteElement.lyricsHorizontalOffset / 2 -
                      (nextNoteElement.lyricsWidth -
                        nextNoteElement.neumeWidth) /
                        2 -
                      pageSetup.lyricsMinimumSpacing,
                  );
                }
              }

              element.melismaWidth = Math.max(end - start, 0);

              if (element.melismaWidth < pageSetup.lyricsMelismaCutoffWidth) {
                element.melismaWidth = 0;
              }

              // Calculate the distance from the alphabetic baseline to the bottom of the font bounding box
              element.melismaOffsetTop =
                -this.getLyricsFontBoundingBoxDescentFromCache(
                  fontBoundingBoxDescentCache,
                  element,
                  pageSetup,
                );
            } else if (pageSetup.melkiteRtl) {
              const nextNoteElement = nextElement as NoteElement;

              if (
                nextElement == null ||
                nextElement.elementType !== ElementType.Note
              ) {
                if (finalElement) {
                  end =
                    finalElement.x +
                    this.getFinalElementWidth(finalElement) -
                    this.getFinalElementMeasureBarRightWidth(
                      finalElement,
                      melismaMeasureBarWidthMap,
                    );
                } else {
                  end = element.x + element.neumeWidth;
                }
              } else if (
                nextNoteElement.lyricsWidth > nextNoteElement.neumeWidth
              ) {
                end =
                  nextNoteElement.x -
                  (nextNoteElement.lyricsWidth -
                    nextNoteElement.neumeWidth +
                    nextNoteElement.lyricsHorizontalOffset) /
                    2;
              } else {
                end =
                  nextNoteElement.x +
                  nextNoteElement.neumeWidth / 2 -
                  nextNoteElement.lyricsWidth / 2 -
                  nextNoteElement.lyricsHorizontalOffset / 2;
              }

              const widthOfTatweelForThisElement = element.lyricsUseDefaultStyle
                ? widthOfTatweel
                : this.getTextWidthFromCache(
                    textWidthCache,
                    element,
                    pageSetup,
                    TATWEEL,
                  );

              // Always show at least one underscore to indicate it's a melisma.
              element.melismaWidth = Math.max(
                end - start,
                widthOfTatweelForThisElement,
              );

              const numberOfUnderScoresNeeded = Math.ceil(
                element.melismaWidth / widthOfTatweelForThisElement,
              );

              for (let i = 0; i < numberOfUnderScoresNeeded; i++) {
                element.melismaText += TATWEEL;
              }
            }
          }
        }
      }
    }
  }

  public static calculateMartyrias(
    elements: ScoreElement[],
    pageSetup: PageSetup,
  ) {
    let currentNote = 0;
    let currentNoteVirtual = 0;
    let currentScale = Scale.Diatonic;
    let currentShift = 0;

    let ambitusLow: number = Number.MAX_SAFE_INTEGER;
    let ambitusHigh: number = Number.MIN_SAFE_INTEGER;
    let ambitusLowScale = Scale.Diatonic;
    let ambitusHighScale = Scale.Diatonic;
    let ambitusLowShift = 0;
    let ambitusHighShift = 0;
    let currentModeKey: ModeKeyElement | null = null;

    for (const element of elements) {
      if (element.elementType === ElementType.Note) {
        const note = element as NoteElement;

        currentNote += getNeumeValue(note.quantitativeNeume)!;
        currentNoteVirtual = currentNote + currentShift;

        note.noteIndicatorNeume = noteIndicatorMap.get(
          ((currentNote % 7) + 7) % 7,
        )!;

        const noteSpread = getNoteSpread(note.quantitativeNeume);

        const currentNotes = noteSpread.map((x) => currentNote + x);
        const currentNotesVirtual = noteSpread.map(
          (x) => currentNoteVirtual + x,
        );

        note.scaleNotes = noteSpread.map((x) =>
          getScaleNoteFromValue(currentNote + x),
        );

        note.scaleNotesVirtual = noteSpread.map((x) =>
          getScaleNoteFromValue(currentNoteVirtual + x),
        );

        // Handle fthora carries
        if (
          note.fthoraCarry &&
          this.fthoraIsValid(note.fthoraCarry, currentNotesVirtual, pageSetup)
        ) {
          note.fthora = note.fthoraCarry;
          note.fthoraCarry = null;
        }

        if (
          note.secondaryFthoraCarry &&
          this.fthoraIsValid(
            note.secondaryFthoraCarry,
            currentNotesVirtual,
            pageSetup,
          )
        ) {
          note.secondaryFthora = note.secondaryFthoraCarry;
          note.secondaryFthoraCarry = null;
        }

        if (
          note.tertiaryFthoraCarry &&
          this.fthoraIsValid(
            note.tertiaryFthoraCarry,
            currentNotesVirtual,
            pageSetup,
          )
        ) {
          note.tertiaryFthora = note.tertiaryFthoraCarry;
          note.tertiaryFthoraCarry = null;
        }

        if (note.fthora) {
          if (this.fthoraIsValid(note.fthora, currentNotesVirtual, pageSetup)) {
            const spreadIndex = getSpreadIndex(
              note.fthora,
              note.quantitativeNeume,
              NeumeSelection.Primary,
            );
            const fthoraNote =
              spreadIndex != -1 ? currentNotes[spreadIndex] : currentNote;

            const fthoraNoteVirtual =
              spreadIndex != -1
                ? currentNotesVirtual[spreadIndex]
                : currentNoteVirtual;

            // Scale is based off the virtual note
            currentScale =
              this.getScaleFromFthora(note.fthora, fthoraNoteVirtual) ||
              currentScale;

            // Shift is based off the true note
            currentShift = this.getShift(
              fthoraNote,
              fthoraNoteVirtual,
              currentScale,
              note.fthora,
              note.chromaticFthoraNote,
            );

            note.noteIndicatorNeume = noteIndicatorMap.get(
              (((fthoraNote + currentShift) % 7) + 7) % 7,
            )!;
            note.fthoraCarry = null;
          } else {
            note.fthoraCarry = note.fthora;
            note.fthora = null;
          }
        } else if (note.secondaryFthora) {
          if (
            this.fthoraIsValid(
              note.secondaryFthora,
              currentNotesVirtual,
              pageSetup,
            )
          ) {
            const spreadIndex = getSpreadIndex(
              note.secondaryFthora,
              note.quantitativeNeume,
              NeumeSelection.Secondary,
            );

            const fthoraNote =
              spreadIndex != -1 ? currentNotes[spreadIndex] : currentNote;

            const fthoraNoteVirtual =
              spreadIndex != -1
                ? currentNotesVirtual[spreadIndex]
                : currentNoteVirtual;

            // Scale is based off the virtual note
            currentScale =
              this.getScaleFromFthora(
                note.secondaryFthora,
                fthoraNoteVirtual,
              ) || currentScale;

            // Shift is based off the true note
            currentShift = this.getShift(
              fthoraNote,
              fthoraNoteVirtual,
              currentScale,
              note.secondaryFthora,
              note.secondaryChromaticFthoraNote,
            );

            note.noteIndicatorNeume = noteIndicatorMap.get(
              (((fthoraNote + currentShift) % 7) + 7) % 7,
            )!;
            note.secondaryFthoraCarry = null;
          } else {
            note.secondaryFthoraCarry = note.secondaryFthora;
            note.secondaryFthora = null;
          }
        } else if (note.tertiaryFthora) {
          if (
            this.fthoraIsValid(
              note.tertiaryFthora,
              currentNotesVirtual,
              pageSetup,
            )
          ) {
            const spreadIndex = getSpreadIndex(
              note.tertiaryFthora,
              note.quantitativeNeume,
              NeumeSelection.Tertiary,
            );
            const fthoraNote =
              spreadIndex != -1 ? currentNotes[spreadIndex] : currentNote;

            const fthoraNoteVirtual =
              spreadIndex != -1
                ? currentNotesVirtual[spreadIndex]
                : currentNoteVirtual;

            // Scale is based off the virtual note
            currentScale =
              this.getScaleFromFthora(note.tertiaryFthora, fthoraNoteVirtual) ||
              currentScale;

            // Shift is based off the true note
            currentShift = this.getShift(
              fthoraNote,
              fthoraNoteVirtual,
              currentScale,
              note.tertiaryFthora,
              note.tertiaryChromaticFthoraNote,
            );

            note.noteIndicatorNeume = noteIndicatorMap.get(
              (((fthoraNote + currentShift) % 7) + 7) % 7,
            )!;
            note.tertiaryFthoraCarry = null;
          } else {
            note.tertiaryFthoraCarry = note.tertiaryFthora;
            note.tertiaryFthora = null;
          }
        }

        for (const noteValue of currentNotes) {
          if (noteValue < ambitusLow) {
            ambitusLow = noteValue;
            ambitusLowScale = currentScale;
            ambitusLowShift = currentShift;
          }
          if (noteValue > ambitusHigh) {
            ambitusHigh = noteValue;
            ambitusHighScale = currentScale;
            ambitusHighShift = currentShift;
          }
        }
      } else if (element.elementType === ElementType.ModeKey) {
        const modeKey = element as ModeKeyElement;

        if (currentModeKey) {
          if (currentModeKey) {
            this.assignAmbitus({
              currentModeKey,
              ambitusLow,
              ambitusHigh,
              ambitusLowScale,
              ambitusLowShift,
              ambitusHighScale,
              ambitusHighShift,
            });
          }
        }

        ambitusLow = Number.MAX_SAFE_INTEGER;
        ambitusHigh = Number.MIN_SAFE_INTEGER;

        currentModeKey = modeKey;
        currentNote = getScaleNoteValue(modeKey.scaleNote);
        currentScale = modeKey.scale;
        currentShift = 0;

        if (modeKey.fthora) {
          currentScale =
            this.getScaleFromFthora(modeKey.fthora, currentNote) ||
            currentScale;

          currentShift = this.getShift(
            currentNote,
            currentNote,
            currentScale,
            modeKey.fthora,
            null,
          );
        }
      } else if (element.elementType === ElementType.Martyria) {
        const martyria = element as MartyriaElement;

        if (!martyria.auto) {
          currentNote = getNoteValue(martyria.note);

          currentScale = martyria.scale;

          currentShift = 0;
        }

        if (currentNote < -9 || currentNote > 11) {
          martyria.error = true;
        } else {
          martyria.error = false;

          martyria.note = getNoteFromValue(currentNote);
          martyria.scale = currentScale;

          const currentScaleNote = currentNote + currentShift;

          martyria.rootSign = this.getRootSign(
            currentScale,
            currentScaleNote,
            currentNote,
            martyria.rootSignOverride,
          );

          // Handle fthora carry
          if (
            martyria.fthoraCarry &&
            this.fthoraIsValid(martyria.fthoraCarry, [currentNote], pageSetup)
          ) {
            martyria.fthora = martyria.fthoraCarry;
            martyria.fthoraCarry = null;
          }

          if (martyria.fthora) {
            if (this.fthoraIsValid(martyria.fthora, [currentNote], pageSetup)) {
              currentScale =
                this.getScaleFromFthora(martyria.fthora, currentNote) ||
                currentScale;

              currentShift = this.getShift(
                currentNote,
                currentScaleNote,
                currentScale,
                martyria.fthora,
                martyria.chromaticFthoraNote,
              );

              martyria.fthoraCarry = null;
            } else {
              martyria.fthoraCarry = martyria.fthora;
              martyria.fthora = null;
            }
          }

          if (martyria.alignRight && martyria.quantitativeNeume) {
            currentNote += getNeumeValue(martyria.quantitativeNeume)!;
            currentNoteVirtual = currentNote + currentShift;
          }
        }
      } else if (
        element.elementType === ElementType.RichTextBox &&
        (element as RichTextBoxElement).modeChange
      ) {
        const modeKey = element as RichTextBoxElement;

        if (currentModeKey) {
          this.assignAmbitus({
            currentModeKey,
            ambitusLow,
            ambitusHigh,
            ambitusLowScale,
            ambitusLowShift,
            ambitusHighScale,
            ambitusHighShift,
          });
        }

        ambitusLow = Number.MAX_SAFE_INTEGER;
        ambitusHigh = Number.MIN_SAFE_INTEGER;

        currentModeKey = null;
        currentNote = getScaleNoteValue(modeKey.modeChangePhysicalNote);
        currentScale = modeKey.modeChangeScale;
        currentShift = 0;

        if (modeKey.modeChangeVirtualNote) {
          currentNoteVirtual = getScaleNoteValue(modeKey.modeChangeVirtualNote);

          currentShift = getShiftWithoutFthora(
            currentNote,
            currentNoteVirtual,
            currentScale,
          );
        }
      }
    }

    if (currentModeKey) {
      currentModeKey.ambitusLowNote = getNoteFromValue(ambitusLow) ?? Note.Pa;
      currentModeKey.ambitusHighNote = getNoteFromValue(ambitusHigh) ?? Note.Pa;
      currentModeKey.ambitusLowRootSign =
        ambitusLow !== Number.MAX_SAFE_INTEGER
          ? this.getRootSign(
              ambitusLowScale,
              ambitusLow + ambitusLowShift,
              ambitusLow,
            )
          : RootSign.Alpha;
      currentModeKey.ambitusHighRootSign =
        ambitusHigh !== Number.MIN_SAFE_INTEGER
          ? this.getRootSign(
              ambitusHighScale,
              ambitusHigh + ambitusHighShift,
              ambitusHigh,
            )
          : RootSign.Alpha;
    }
  }

  public static assignAmbitus({
    currentModeKey,
    ambitusLow,
    ambitusHigh,
    ambitusLowScale,
    ambitusLowShift,
    ambitusHighScale,
    ambitusHighShift,
  }: {
    currentModeKey: ModeKeyElement;
    ambitusLow: number;
    ambitusHigh: number;
    ambitusLowScale: Scale;
    ambitusLowShift: number;
    ambitusHighScale: Scale;
    ambitusHighShift: number;
  }) {
    currentModeKey.ambitusLowNote = getNoteFromValue(ambitusLow) ?? Note.Pa;
    currentModeKey.ambitusHighNote = getNoteFromValue(ambitusHigh) ?? Note.Pa;
    currentModeKey.ambitusLowRootSign =
      ambitusLow !== Number.MAX_SAFE_INTEGER
        ? this.getRootSign(
            ambitusLowScale,
            ambitusLow + ambitusLowShift,
            ambitusLow,
          )
        : RootSign.Alpha;
    currentModeKey.ambitusHighRootSign =
      ambitusHigh !== Number.MIN_SAFE_INTEGER
        ? this.getRootSign(
            ambitusHighScale,
            ambitusHigh + ambitusHighShift,
            ambitusHigh,
          )
        : RootSign.Alpha;
  }

  public static alignIsonIndicators(pages: Page[], pageSetup: PageSetup) {
    for (const page of pages) {
      for (const line of page.lines) {
        const notes = line.elements.filter(
          (x) => x.elementType === ElementType.Note,
        ) as NoteElement[];
        const notesWithIson = notes.filter((x) => x.ison != null);

        // The minOffset represents the highest position in this coordinate system.
        // 0 is the default position, positive moves down, negative moves up.
        let minOffset = Number.MAX_VALUE;

        for (const note of notesWithIson) {
          const base = NeumeMappingService.getMapping(note.quantitativeNeume);
          const mark = NeumeMappingService.getMapping(note.ison!);
          const offset = fontService.getMarkAnchorOffset(
            pageSetup.neumeDefaultFontFamily,
            base.glyphName,
            mark.glyphName,
          );

          const totalOffset = offset.y + (note.isonOffsetY ?? 0);

          if (totalOffset < minOffset) {
            minOffset = totalOffset;
          }

          note.isonOffsetYBeforeAdjustment = totalOffset;
        }

        for (const note of notesWithIson) {
          note.computedIsonOffsetY =
            minOffset -
            note.isonOffsetYBeforeAdjustment +
            (note.isonOffsetY ?? 0);
        }
      }
    }
  }

  private static getRootSign(
    currentScale: Scale,
    currentScaleNote: number,
    currentNote: number,
    rootSignOverride?: RootSign | null,
  ) {
    let rootSign: RootSign = RootSign.Alpha;

    if (rootSignOverride != null) {
      rootSign = rootSignOverride;
    } else if (currentScale === Scale.HardChromatic) {
      rootSign = currentScaleNote % 2 === 0 ? RootSign.Squiggle : RootSign.Tilt;
    } else if (currentScale === Scale.SoftChromatic) {
      rootSign =
        currentScaleNote % 2 === 0
          ? RootSign.SoftChromaticPaRootSign
          : RootSign.SoftChromaticSquiggle;
    } else if (currentScale === Scale.Diatonic) {
      rootSign = diatonicRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    } else if (currentScale === Scale.Zygos) {
      rootSign = zygosRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    } else if (currentScale === Scale.Kliton) {
      rootSign = klitonRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    } else if (currentScale === Scale.Spathi) {
      rootSign = spathiKeRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    } else if (currentScale === Scale.SpathiGa) {
      rootSign = spathiGaRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    } else if (currentScale === Scale.EnharmonicGa) {
      rootSign =
        enharmonicGaRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    } else if (currentScale === Scale.EnharmonicVou) {
      rootSign =
        enharmonicVouRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    } else if (currentScale === Scale.EnharmonicVouHigh) {
      rootSign =
        enharmonicVouHighRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    } else if (currentScale === Scale.EnharmonicZoHigh) {
      rootSign =
        enharmonicZoHighRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    } else if (currentScale === Scale.EnharmonicZo) {
      rootSign =
        enharmonicZoRootSignMap.get(currentScaleNote) || RootSign.Alpha;
    }

    if (currentNote <= getNoteValue(Note.KeLow)) {
      rootSign = lowRootSignMap.get(rootSign) || rootSign;
    } else if (currentNote > getNoteValue(Note.KeLow)) {
      rootSign = highRootSignMap.get(rootSign) || rootSign;
    }

    return rootSign;
  }

  public static getScaleFromFthora(fthora: Fthora, currentNote: number) {
    if (
      fthora.startsWith('Diatonic') ||
      fthora.startsWith('GeneralSharp') ||
      fthora.startsWith('GeneralFlat')
    ) {
      return Scale.Diatonic;
    }

    if (fthora.startsWith('HardChromatic')) {
      return Scale.HardChromatic;
    }

    if (fthora.startsWith('SoftChromatic')) {
      return Scale.SoftChromatic;
    }

    if (fthora.startsWith('Enharmonic')) {
      if (currentNote === getScaleNoteValue(ScaleNote.Ga)) {
        return Scale.EnharmonicGa;
      }
      if (currentNote === getScaleNoteValue(ScaleNote.ZoHigh)) {
        return Scale.EnharmonicZoHigh;
      }
      if (currentNote === getScaleNoteValue(ScaleNote.Zo)) {
        return Scale.EnharmonicZo;
      }
      if (currentNote === getScaleNoteValue(ScaleNote.Vou)) {
        return Scale.EnharmonicVou;
      }
      if (currentNote === getScaleNoteValue(ScaleNote.VouHigh)) {
        return Scale.EnharmonicVouHigh;
      } else {
        // Default to enharmonic zo high if the fthora was placed on a non-standard note
        // This helps with correct martyria calculation.
        return Scale.EnharmonicZoHigh;
      }
    }

    if (fthora.startsWith('Zygos')) {
      return Scale.Zygos;
    }

    if (fthora.startsWith('Spathi')) {
      if (currentNote === getScaleNoteValue(ScaleNote.Ke)) {
        return Scale.Spathi;
      }
      if (currentNote === getScaleNoteValue(ScaleNote.Ga)) {
        return Scale.SpathiGa;
      }

      // If fthora restrictions are disabled, default to Spathi from Ke
      return Scale.Spathi;
    }

    if (fthora.startsWith('Kliton')) {
      return Scale.Kliton;
    }

    return null;
  }

  public static getShift(
    currentNote: number,
    currentNoteVirtual: number,
    currentScale: Scale,
    fthora: Fthora,
    chromaticFthoraNote: ScaleNote | null,
  ) {
    let shift = 0;

    if (currentScale === Scale.HardChromatic) {
      const fthoraNote = getScaleNoteValue(
        chromaticFthoraNote ??
          (fthora.startsWith('HardChromaticPa') ? ScaleNote.Pa : ScaleNote.Thi),
      );

      shift = fthoraNote - currentNote;
      shift %= 4;
    } else if (currentScale === Scale.SoftChromatic) {
      const fthoraNote = getScaleNoteValue(
        chromaticFthoraNote ??
          (fthora.startsWith('SoftChromaticPa') ? ScaleNote.Pa : ScaleNote.Thi),
      );

      shift = fthoraNote - currentNote;
      shift %= 4;
    } else if (currentScale === Scale.Diatonic) {
      let fthoraNote = currentNote;

      if (fthora.startsWith('DiatonicNiLow')) {
        fthoraNote = getScaleNoteValue(ScaleNote.Ni);
      } else if (fthora.startsWith('DiatonicPa')) {
        fthoraNote = getScaleNoteValue(ScaleNote.Pa);
      } else if (fthora.startsWith('DiatonicVou')) {
        fthoraNote = getScaleNoteValue(ScaleNote.Vou);
      } else if (fthora.startsWith('DiatonicGa')) {
        fthoraNote = getScaleNoteValue(ScaleNote.Ga);
      } else if (fthora.startsWith('DiatonicThi')) {
        fthoraNote = getScaleNoteValue(ScaleNote.Thi);
      } else if (fthora.startsWith('DiatonicKe')) {
        fthoraNote = getScaleNoteValue(ScaleNote.Ke);
      } else if (fthora.startsWith('DiatonicZo')) {
        fthoraNote = getScaleNoteValue(ScaleNote.ZoHigh);
      } else if (fthora.startsWith('DiatonicNiHigh')) {
        fthoraNote = getScaleNoteValue(ScaleNote.NiHigh);
      } else if (fthora.startsWith('GeneralFlat')) {
        fthoraNote = currentNoteVirtual;
      } else if (fthora.startsWith('GeneralSharp')) {
        fthoraNote = currentNoteVirtual;
      }

      shift = fthoraNote - currentNote;
    } else if (currentScale === Scale.Kliton) {
      shift = getScaleNoteValue(ScaleNote.Thi) - currentNote;
    } else if (currentScale === Scale.Zygos) {
      shift = getScaleNoteValue(ScaleNote.Thi) - currentNote;
    } else if (currentScale === Scale.Spathi) {
      shift = getScaleNoteValue(ScaleNote.Ke) - currentNote;
    } else if (currentScale === Scale.SpathiGa) {
      shift = getScaleNoteValue(ScaleNote.Ga) - currentNote;
    } else if (currentScale === Scale.EnharmonicGa) {
      shift = getScaleNoteValue(ScaleNote.Ga) - currentNote;
    } else if (currentScale === Scale.EnharmonicVou) {
      shift = getScaleNoteValue(ScaleNote.Vou) - currentNote;
    } else if (currentScale === Scale.EnharmonicVouHigh) {
      shift = getScaleNoteValue(ScaleNote.VouHigh) - currentNote;
    } else if (currentScale === Scale.EnharmonicZo) {
      shift = getScaleNoteValue(ScaleNote.Zo) - currentNote;
    } else if (currentScale === Scale.EnharmonicZoHigh) {
      shift = getScaleNoteValue(ScaleNote.ZoHigh) - currentNote;
    }

    return shift;
  }

  private static fthoraIsValid(
    fthora: Fthora,
    currentNotes: number[],
    pageSetup: PageSetup,
  ) {
    if (pageSetup.noFthoraRestrictions) {
      return true;
    }

    // Make sure chroa are on the correct notes
    if (
      fthora.startsWith('Zygos') &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.Thi))
    ) {
      return false;
    }

    if (
      fthora.startsWith('Kliton') &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.Thi))
    ) {
      return false;
    }

    if (
      fthora.startsWith('Spathi') &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.Ke)) &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.Ga))
    ) {
      return false;
    }

    if (
      fthora.startsWith('Enharmonic') &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.Zo)) &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.Ga)) &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.ZoHigh)) &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.Vou)) &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.VouHigh))
    ) {
      return false;
    }

    if (
      fthora.startsWith('GeneralSharp') &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.Ga))
    ) {
      return false;
    }

    if (
      fthora.startsWith('GeneralFlat') &&
      !currentNotes.includes(getScaleNoteValue(ScaleNote.Ke))
    ) {
      return false;
    }

    return true;
  }

  private static getNeumeWidthFromCache(
    cache: Map<string, number>,
    neume: Neume,
    pageSetup: PageSetup,
  ) {
    const key = `${neume} | ${pageSetup.neumeDefaultFontSize} | ${pageSetup.neumeDefaultFontFamily}`;

    let width = cache.get(key);

    if (width == null) {
      const neumeMapping = NeumeMappingService.getMapping(neume);

      width = TextMeasurementService.getTextWidth(
        neumeMapping.text,
        `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
      );

      cache.set(key, width);
    }

    return width;
  }

  private static getTextWidthFromCache(
    cache: Map<string, number>,
    element: NoteElement,
    pageSetup: PageSetup,
    textOverride: string | null = null,
  ) {
    const font = element.lyricsUseDefaultStyle
      ? pageSetup.lyricsFont
      : element.lyricsFont;

    const text = textOverride ?? element.lyrics;

    const key = `${text} | ${font}`;

    let width = cache.get(key);

    if (width == null) {
      width = TextMeasurementService.getTextWidth(text, font);

      cache.set(key, width);
    }

    return width;
  }

  private static getLyricsFontBoundingBoxDescentFromCache(
    cache: Map<string, number>,
    element: NoteElement,
    pageSetup: PageSetup,
  ) {
    const font = element.lyricsUseDefaultStyle
      ? pageSetup.lyricsFont
      : element.lyricsFont;

    const key = font;

    let descent = cache.get(key);

    if (descent == null) {
      descent = TextMeasurementService.getFontBoundingBoxDescent(font);

      cache.set(key, descent);
    }

    return descent;
  }

  private static getNoteLyricsFontHeightFromCache(
    cache: Map<string, number>,
    element: NoteElement,
    pageSetup: PageSetup,
  ) {
    const font = element.lyricsUseDefaultStyle
      ? pageSetup.lyricsFont
      : element.lyricsFont;

    return this.getLyricsFontHeightFromCache(cache, font);
  }

  private static getLyricsFontHeightFromCache(
    cache: Map<string, number>,
    font: string,
  ) {
    const key = font;

    let height = cache.get(key);

    if (height == null) {
      height = TextMeasurementService.getFontHeight(font);

      cache.set(key, height);
    }

    return height;
  }

  private static getFinalElementWidth(
    element: NoteElement | MartyriaElement | TempoElement | TextBoxElement,
  ) {
    if (element.elementType === ElementType.Martyria) {
      return (element as MartyriaElement).neumeWidth;
    } else if (element.elementType === ElementType.Note) {
      return (element as NoteElement).neumeWidth;
    } else if (element.elementType === ElementType.Tempo) {
      return (element as TempoElement).neumeWidth;
    } else {
      return (element as TextBoxElement).width;
    }
  }

  private static getFinalElementMeasureBarRightWidth(
    element: NoteElement | MartyriaElement | TempoElement | TextBoxElement,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    let measureBarRight: MeasureBar | null = null;

    if (element.elementType === ElementType.Note) {
      const note = element as NoteElement;
      measureBarRight = note.measureBarRight;
    } else if (element.elementType === ElementType.Martyria) {
      measureBarRight = (element as MartyriaElement).measureBarRight;
    }

    if (measureBarRight != null) {
      return measureBarWidthMap.get(measureBarRight) ?? 0;
    }

    return 0;
  }

  private static isPartOfSameMelisma(element: ScoreElement | null) {
    return (
      element?.elementType === ElementType.Note &&
      (element as NoteElement).isMelisma &&
      !(element as NoteElement).isMelismaStart
    );
  }

  /**
   * Returns true if a melisma can continue through this element.
   */
  private static isMelismaContinuationElement(element: ScoreElement) {
    return (
      element.elementType === ElementType.Martyria ||
      element.elementType === ElementType.Tempo ||
      (element.elementType === ElementType.TextBox &&
        (element as TextBoxElement).inline)
    );
  }

  private static nextNoteElement(
    line: Line,
    startIndex: number,
    firstElementOnNextLine: ScoreElement | null = null,
  ) {
    for (let i = startIndex + 1; i < line.elements.length; i++) {
      if (line.elements[i].elementType === ElementType.Note) {
        return line.elements[i];
      }
    }

    return firstElementOnNextLine;
  }

  private static previousNoteElement(line: Line, startIndex: number) {
    for (let i = startIndex - 1; i >= 0; i--) {
      if (line.elements[i].elementType === ElementType.Note) {
        return line.elements[i];
      }
    }

    return null;
  }

  private static isBreakElement(element: ScoreElement) {
    return (
      !this.isMelismaContinuationElement(element) &&
      element.elementType !== ElementType.Note
    );
  }

  /**
   * For a given melismatic element on a line, this finds the final element of the melisma
   * and the element after the final element, if there is one.
   * @param line The line being processed
   * @param element The element that started the melisma
   * @param firstElementOnNextLine The first element on the next line
   * @param startIndex The index to start searching at. Should be the element's index + 1.
   * @returns The final element in the melisma, and the next element after the melisma.
   */
  public static findFinalAndNextElement(
    line: Line,
    element: NoteElement,
    firstElementOnNextLine: ScoreElement | null,
    startIndex: number,
  ) {
    let finalElement:
      | NoteElement
      | MartyriaElement
      | TempoElement
      | TextBoxElement
      | null = null;

    let nextElement: ScoreElement | null = null;

    for (let i = startIndex; i < line.elements.length; i++) {
      const nextNoteElement = this.nextNoteElement(
        line,
        i,
        firstElementOnNextLine,
      );

      // Break if we find an element that is not part of the same melisma
      // or we find a group of continuation elements followed by a note that is not part of the same melisma
      if (
        (line.elements[i].elementType === ElementType.Note &&
          !this.isPartOfSameMelisma(line.elements[i])) ||
        (this.isMelismaContinuationElement(line.elements[i]) &&
          nextNoteElement != null &&
          !this.isPartOfSameMelisma(nextNoteElement)) ||
        this.isBreakElement(line.elements[i])
      ) {
        finalElement = (line.elements[i - 1] as NoteElement) ?? null;
        nextElement = line.elements[i];
        break;
      }
    }

    if (finalElement == null) {
      if (
        element.isHyphen ||
        !this.isPartOfSameMelisma(firstElementOnNextLine)
      ) {
        finalElement = this.previousNoteElement(line, line.elements.length) as
          | NoteElement
          | MartyriaElement
          | TempoElement
          | TextBoxElement;
        nextElement = null;
      } else {
        finalElement = line.elements[line.elements.length - 1] as
          | NoteElement
          | MartyriaElement
          | TempoElement
          | TextBoxElement;
        nextElement = firstElementOnNextLine;
      }
    }

    return { finalElement, nextElement };
  }
}

const noteIndicatorMap = new Map<number, NoteIndicator>([
  [0, NoteIndicator.Pa],
  [1, NoteIndicator.Vou],
  [2, NoteIndicator.Ga],
  [3, NoteIndicator.Thi],
  [4, NoteIndicator.Ke],
  [5, NoteIndicator.Zo],
  [6, NoteIndicator.Ni],
]);

const diatonicRootSignMap = new Map<number, RootSign>([
  [-9, RootSign.NanaLow],
  [-8, RootSign.DeltaLow],
  [-7, RootSign.AlphaLow],
  [-6, RootSign.LegetosLow],
  [-5, RootSign.NanaLow],
  [-4, RootSign.DeltaLow],
  [-3, RootSign.AlphaLow],
  [-2, RootSign.Zo],
  [-1, RootSign.Delta],
  [0, RootSign.Alpha],
  [1, RootSign.Legetos],
  [2, RootSign.Nana],
  [3, RootSign.DeltaDotted],
  [4, RootSign.AlphaDotted],
  [5, RootSign.Legetos],
  [6, RootSign.Nana],
  [7, RootSign.Alpha],
  [8, RootSign.Legetos],
  [9, RootSign.Nana],
  [10, RootSign.DeltaDotted],
  [11, RootSign.AlphaDotted],
]);

const zygosRootSignMap = new Map<number, RootSign>(diatonicRootSignMap);
zygosRootSignMap.set(0, RootSign.Squiggle);
zygosRootSignMap.set(1, RootSign.Zygos);
zygosRootSignMap.set(2, RootSign.Squiggle);
zygosRootSignMap.set(3, RootSign.Zygos);

const klitonRootSignMap = new Map<number, RootSign>(diatonicRootSignMap);
klitonRootSignMap.set(0, RootSign.Delta);
klitonRootSignMap.set(1, RootSign.Alpha);
klitonRootSignMap.set(2, RootSign.Legetos);
klitonRootSignMap.set(3, RootSign.Nana);

const spathiKeRootSignMap = new Map<number, RootSign>(diatonicRootSignMap);
spathiKeRootSignMap.set(3, RootSign.Squiggle);
spathiKeRootSignMap.set(5, RootSign.Nana);
spathiKeRootSignMap.set(6, RootSign.DeltaDotted);

const spathiGaRootSignMap = new Map<number, RootSign>(diatonicRootSignMap);
spathiGaRootSignMap.set(0, RootSign.DeltaDotted);
spathiGaRootSignMap.set(1, RootSign.AlphaDotted);
spathiGaRootSignMap.set(3, RootSign.Tilt);
spathiGaRootSignMap.set(4, RootSign.Squiggle);

const enharmonicGaRootSignMap = new Map<number, RootSign>(diatonicRootSignMap);
enharmonicGaRootSignMap.set(-1, RootSign.Nana);
enharmonicGaRootSignMap.set(0, RootSign.Delta);
enharmonicGaRootSignMap.set(1, RootSign.Alpha);

const enharmonicZoRootSignMap = new Map<number, RootSign>(diatonicRootSignMap);
enharmonicZoRootSignMap.set(-2, RootSign.Nana);

const enharmonicZoHighRootSignMap = new Map<number, RootSign>(
  diatonicRootSignMap,
);
enharmonicZoHighRootSignMap.set(5, RootSign.Nana);

const enharmonicVouRootSignMap = new Map<number, RootSign>(diatonicRootSignMap);
enharmonicVouRootSignMap.set(1, RootSign.Nana);
enharmonicVouRootSignMap.set(-2, RootSign.Nana);

const enharmonicVouHighRootSignMap = new Map<number, RootSign>(
  diatonicRootSignMap,
);
enharmonicVouHighRootSignMap.set(6, RootSign.DeltaDotted);
enharmonicVouHighRootSignMap.set(7, RootSign.Alpha);
enharmonicVouHighRootSignMap.set(8, RootSign.Nana);

const lowRootSignMap = new Map<RootSign, RootSign>([
  [RootSign.Legetos, RootSign.LegetosLow],
  [RootSign.Nana, RootSign.NanaLow],
  [RootSign.Delta, RootSign.DeltaLow],
  [RootSign.DeltaDotted, RootSign.DeltaDottedLow],
  [RootSign.Alpha, RootSign.AlphaLow],
  [RootSign.AlphaDotted, RootSign.AlphaDottedLow],
  [RootSign.Zo, RootSign.ZoLow],
  [RootSign.SoftChromaticPaRootSign, RootSign.SoftChromaticPaRootSignLow],
  [RootSign.SoftChromaticSquiggle, RootSign.SoftChromaticSquiggleLow],
  [RootSign.Tilt, RootSign.TiltLow],
  [RootSign.Squiggle, RootSign.SquiggleLow],
  [RootSign.Zygos, RootSign.ZygosLow],
]);

const highRootSignMap = new Map<RootSign, RootSign>();

for (const [key, value] of lowRootSignMap) {
  highRootSignMap.set(value, key);
}
