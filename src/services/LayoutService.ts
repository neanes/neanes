import type { Box, Glue, InputItem, PositionedItem } from 'tex-linebreak';
import {
  adjustmentRatios,
  breakLines,
  forcedBreak,
  lineContentStart,
  MAX_COST,
  MaxAdjustmentExceededError,
  PARAGRAPH_START,
  positionItems,
} from 'tex-linebreak';

import type {
  DropCapElement,
  ImageBoxElement,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import {
  ElementType,
  EmptyElement,
  isAutomaticBreakProhibited,
  isBlockElement,
  isKeepWithNextActive,
  isRightAlignedMartyria,
  isTieNeume,
  LineBreakType,
} from '@/models/Element';
import type { Footer } from '@/models/Footer';
import type { Header } from '@/models/Header';
import type {
  BoxOverlayDiagnostics,
  ElementOverlayDiagnostics,
  GlueOverlayDiagnostics,
  LayoutDiagnosticItem,
  LayoutDiagnosticsOptions,
  LineLayoutDiagnostics,
} from '@/models/LayoutDiagnostics';
import {
  isMeasureBarAboveVariant,
  measureBarAboveToLeft,
  measureBarLeftToAbove,
} from '@/models/NeumeReplacements';
import type { Fthora, MeasureBar, Neume } from '@/models/Neumes';
import {
  GorgonNeume,
  NeumeSelection,
  Note,
  NoteIndicator,
  QuantitativeNeume,
  restNeumes,
  RootSign,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import {
  getNeumeValue,
  getNoteSpread,
  getSpreadIndex,
} from '@/models/NeumeValues';
import { Line, Page } from '@/models/Page';
import type { PageSetup } from '@/models/PageSetup';
import type {
  ParagraphStyle,
  ResolvedParagraphStyle,
} from '@/models/ParagraphStyle';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import {
  getNoteFromValue,
  getNoteValue,
  getScaleNoteFromValue,
  getScaleNoteValue,
  getShiftWithoutFthora,
  Scale,
  ScaleNote,
} from '@/models/Scales';
import type { Workspace } from '@/models/Workspace';
import {
  NeumeMappingService,
  type SbmuflGlyphName,
} from '@/services/NeumeMappingService';
import { TATWEEL } from '@/utils/constants';
import type { ResolvedFontStyle } from '@/utils/fontStyle';
import { resolveFontCss, resolveFontStyle } from '@/utils/fontStyle';
import { lowRootSignMap } from '@/utils/NeumeUtils';
import type { ResolvedPageMargins } from '@/utils/PageMargins';
import { resolvePageMargins } from '@/utils/PageMargins';
import type { RunningMarkerPageMetadata } from '@/utils/runningMarkers';
import { resolveNextRunningMarkerPageMetadata } from '@/utils/runningMarkers';
import { Unit } from '@/utils/Unit';

import { fontService } from './FontService';
import type { MelismaSyllables } from './MelismaHelperGreek';
import { MelismaHelperGreek } from './MelismaHelperGreek';
import {
  type InkBounds,
  TextMeasurementService,
} from './TextMeasurementService';

const fontHeightCache = new Map<string, number>();
const fontBoundingBoxDescentCache = new Map<string, number>();
const textWidthCache = new Map<string, number>();
const neumeWidthCache = new Map<string, number>();
const noteInkBoundsCache = new Map<string, InkBounds>();
const emptyElementWidth = 39;
const idealMaxAdjustmentRatio = 1;
const adjustmentRatioCapStep = 0.05;
const maxAdjustmentRatioSearchLimit = 4096;
const maxAdjustmentRatioSearchIterations = 24;
// A small positive lower bound for stretch budgets. Under the preferred
// adjustment-ratio cap of 1, each glue raised to this floor grows by at most
// this amount. A relaxed cap can multiply the contribution.
const minGlueStretch = 0.1;
const minGlueShrink = 0;
// Vertical slop when testing vareia collision boxes against measure bar
// boxes, so hairline gaps between adjacent glyph regions still count as
// overlapping.
const vareiaCollisionVerticalToleranceEm = 0.01;

interface BalancedMartyriaBoundary {
  leadingWidth: number;
  shrink: number;
  trailingWidth: number;
}

// The resolved constraint contribution for the optional breakpoint that
// follows a note. A zero cost means that no structural prohibition or active
// user keep applies; the label identifies the result in diagnostics.
interface BreakConstraint {
  cost: number;
  label: string;
}

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
  measureBarWidthMap: Map<MeasureBar, number>;
  paragraphStyles: ParagraphStyle[];
}

export interface OverlayDiagnosticsContext {
  measureBarWidthMap: Map<MeasureBar, number>;
  neumeFontAscent: number;
  neumeFontHeight: number;
}

interface ElementBox extends Box {
  element: ScoreElement;
}

interface CompletedParagraph {
  diagnostics: LineLayoutDiagnostics[] | null;
  paragraph: InputItem[];
  positions: PositionedItem[];
  ratios: number[];
  dropCapWidthPx: number;
  dropCapContinuationLines: number;
}

interface LayoutDiagnosticsCollector {
  currentOwner: ScoreElement | null;
  items: LayoutDiagnosticItem[];
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

  // When a martyria with a transferable measure bar is followed in the same
  // paragraph by a note without its own left bar, the martyria's post-break glue
  // is reduced by the bar width plus its collision-aware leading clearance, and
  // an anonymous spacer box of the same width is inserted before the note. On
  // the same line, the reduced glue and spacer cancel. At an automatic break,
  // the glue vanishes and the spacer reserves non-stretching leading space for
  // the transferred bar.
  pendingMartyriaBarTransferWidth: number;

  // When an eligible hyphenated note is followed immediately by a note with
  // lyrics, the previous note's post-break glue is reduced by any extra leading
  // room needed to render a line-start lyric hyphen before the next lyric.
  // An anonymous spacer box of the same width is inserted before the next
  // note so same-line positions cancel while a broken line keeps the room.
  pendingLeadingLyricHyphenReservationWidth: number;

  diagnostics: LayoutDiagnosticsCollector | null;

  // debug
  loggingEnabled: boolean;
}

interface LyricOverhangs {
  left: number;
  right: number;
}

interface LeadingLyricHyphenGeometry {
  hyphenOffset: number;
  reservationWidth: number;
}

interface NoteGlyphBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  collisionKind?: NoteCollisionGlyph['kind'];
}

interface NoteCollisionGlyph {
  glyphName: SbmuflGlyphName;
  kind: 'base' | 'mark' | 'inline';
  x: number;
  y: number;
  offsetX?: number | null;
  offsetY?: number | null;
}

type MeasureBarAnchorEdge = 'left' | 'right';

interface LineBreakSolution {
  breakpoints: number[];
  ratios: number[];
  maxPositiveAdjustmentRatio: number;
  requestedMaxAdjustmentRatio: number | null;
}

export class LayoutService {
  private static textBoxContentPreviews = new WeakMap<
    TextBoxElement,
    Partial<Pick<TextBoxElement, 'content' | 'contentBottom'>>
  >();

  public static setTextBoxContentPreview(
    element: TextBoxElement,
    preview: Partial<Pick<TextBoxElement, 'content' | 'contentBottom'>>,
  ) {
    this.textBoxContentPreviews.set(element, {
      ...this.textBoxContentPreviews.get(element),
      ...preview,
    });
  }

  public static clearTextBoxContentPreview(element: TextBoxElement) {
    this.textBoxContentPreviews.delete(element);
  }

  public static measureTextBoxIntrinsicWidth(
    element: TextBoxElement,
    content: string,
    contentBottom: string,
  ) {
    return Math.max(
      this.measurePlainTextWidth(
        content,
        element.computedFont,
        element.computedFontVariantCaps,
      ),
      this.measurePlainTextWidth(
        contentBottom,
        element.computedFont,
        element.computedFontVariantCaps,
      ),
    );
  }

  public static processPages(
    workspace: Workspace,
    options?: LayoutDiagnosticsOptions,
  ): Page[] {
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

    this.calculateMartyriae(elements, pageSetup);

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
      lyricsEndPx: LayoutService.getInitialLyricsEndPx(pageSetup),
      melismaLyricsEndPx: null,
      completedParagraphs: [],
      pendingDropCapWidthPx: 0,
      pendingDropCapContinuationLines: 0,
      pendingMartyriaBarTransferWidth: 0,
      pendingLeadingLyricHyphenReservationWidth: 0,
      diagnostics:
        options?.collectDiagnostics === true
          ? { currentOwner: null, items: [] }
          : null,
      loggingEnabled:
        import.meta.env.VITE_LAYOUT_SERVICE_LOGGING_ENABLED === 'true',
    };

    const pages: Page[] = [];

    let page: Page = new Page();
    page.physicalPageNumber = 1;

    pages.push(page);

    let currentPageHeightPx = 0;

    let lastLineHeightPx = 0;

    let lastElementWasPageBreak = false;

    // First, calculate some constants that will
    // be used later. This is so we don't unnecessarily
    // calculate them more than once during the loop.

    const neumeFont = this.getNeumeFont(pageSetup);

    const neumeHeight = TextMeasurementService.getFontHeight(neumeFont);

    const neumeAscent =
      TextMeasurementService.getFontBoundingBoxAscent(neumeFont);
    const defaultLyricsFontCss = this.getDefaultLyricsFont(
      score.paragraphStyles,
    );

    const oligonMidpoint = fontService.getMetrics(
      pageSetup.neumeDefaultFontFamily,
    ).oligonMidpoint;

    const lyricsVerticalOffset = neumeHeight + pageSetup.lyricsVerticalOffset;

    const lyricHeight =
      TextMeasurementService.getFontHeight(defaultLyricsFontCss);

    // The expected height of a line containing only neumes
    const neumeLineHeight = Math.max(
      lyricsVerticalOffset + lyricHeight,
      pageSetup.lineHeight,
    );

    const lyricAscent =
      TextMeasurementService.getFontBoundingBoxAscent(defaultLyricsFontCss);

    const measureBarWidthMap = this.getMeasureBarWidthMap(pageSetup);

    const noteWidthArgs: GetNoteWidthArgs = {
      lyricsVerticalOffset,
      measureBarWidthMap,
      paragraphStyles: score.paragraphStyles,
    };

    this.precomputeNoteGeometry(elements, pageSetup, noteWidthArgs);

    // Process Header and Footers
    // Only a single text box is supported right now
    for (const [show, containers] of [
      [score.pageSetup.showHeader, score.headers],
      [score.pageSetup.showFooter, score.footers],
    ] as const) {
      if (!show) {
        continue;
      }

      for (const headerFooter of [
        containers.default,
        containers.chapterOpening,
        containers.odd,
        containers.even,
        containers.firstPage,
      ]) {
        this.processHeaderFooter(
          headerFooter,
          pageSetup,
          neumeHeight,
          score.paragraphStyles,
          defaultLyricsFontCss,
        );
      }
    }

    // Keep this encoding's elasticity non-negative so adjustment ratios retain
    // their conventional meaning and tex-linebreak can use its suffix-floor
    // pruning. `width` is left untouched, preserving negative inline spacing
    // that users can create to overlap neumes.
    const inlineSpacing = this.getInlineSpacing(pageSetup);
    const standardGlueDefaults = fontService.getStandardGlue(
      pageSetup.neumeDefaultFontFamily,
    );

    const stretchRatio =
      standardGlueDefaults.width !== 0
        ? standardGlueDefaults.stretch / standardGlueDefaults.width
        : 0.5;

    const shrinkRatio =
      standardGlueDefaults.width !== 0
        ? standardGlueDefaults.shrink / standardGlueDefaults.width
        : 1 / 3;

    const standardGlue: Glue = {
      type: 'glue',
      width: inlineSpacing,
      stretch: Math.max(inlineSpacing * stretchRatio, minGlueStretch),
      shrink: Math.max(inlineSpacing * shrinkRatio, minGlueShrink),
    };

    const martyriaGlue = this.createMartyriaGlue(pageSetup);

    const rightMartyriaGlue: Glue = {
      type: 'glue',
      width: martyriaGlue.width,
      stretch: MAX_COST,
      shrink: martyriaGlue.shrink,
    };

    // Phase 1: Build paragraphs as sequences of boxes, glue, and penalties
    let phase1GreekMelismaIsActive = false;
    for (let i = 0; i < elements.length; i++) {
      if (layoutWorkspace.diagnostics != null) {
        layoutWorkspace.diagnostics.currentOwner = elements[i];
      }

      let lineBreak: boolean = elements[i].lineBreak || elements[i].pageBreak;
      let justifyLastLine = false;
      const nextElement = this.getElementAt(elements, i + 1);

      switch (elements[i].elementType) {
        case ElementType.TextBox: {
          // PROCESS TEXTBOX
          const textBoxElement = elements[i] as TextBoxElement;
          const isFillWidthTextBox = this.isFillWidthElement(textBoxElement);
          const elementWidthPx = LayoutService.processTextBoxElement(
            textBoxElement,
            pageSetup,
            neumeHeight,
            score.paragraphStyles,
            defaultLyricsFontCss,
          );

          this.addLyricReservation(
            elementWidthPx,
            elements[i],
            layoutWorkspace,
          );
          this.addBox(elementWidthPx, textBoxElement, layoutWorkspace);

          if (isFillWidthTextBox) {
            // Phase 1 uses the textbox's intrinsic width as a lower bound.
            // Phase 2 resolves the actual fill width from the next positioned
            // item or the line end.
            this.addFillWidthGlue(layoutWorkspace);
          } else {
            this.addGlue(standardGlue, layoutWorkspace, 'standard');
          }

          break;
        }
        case ElementType.RichTextBox: {
          // PROCESS RICHTEXTBOX
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
              this.getLyricsFontHeightFromCache(defaultLyricsFontCss);

            richTextBoxElement.defaultNeumeFontAscent = neumeAscent;

            richTextBoxElement.oligonMidpoint = oligonMidpoint;

            elementWidthPx = isFillWidthRichTextBox
              ? this.getFillWidthPlaceholderWidth(
                  richTextBoxElement,
                  defaultLyricsFontCss,
                )
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
            this.addGlue(standardGlue, layoutWorkspace, 'standard');
          }

          break;
        }
        case ElementType.ImageBox: {
          // PROCESS IMAGEBOX
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
          this.addGlue(standardGlue, layoutWorkspace, 'standard');

          break;
        }
        case ElementType.ModeKey: {
          // PROCESS MODEKEY
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
          this.addGlue(standardGlue, layoutWorkspace, 'standard');

          break;
        }
        case ElementType.Note: {
          // PROCESS NOTE
          const noteElement = elements[i] as NoteElement;
          const elementWidthPx = this.getNoteBoxAdvance(noteElement);

          // Consume any pending martyria bar transfer width.
          const martyriaBarTransferWidth =
            layoutWorkspace.pendingMartyriaBarTransferWidth;
          layoutWorkspace.pendingMartyriaBarTransferWidth = 0;
          const leadingLyricHyphenReservationWidth =
            layoutWorkspace.pendingLeadingLyricHyphenReservationWidth;
          layoutWorkspace.pendingLeadingLyricHyphenReservationWidth = 0;

          // Insert the anonymous spacer box immediately so that neumesEndPx
          // includes any pending break-only leading reservation before lyric
          // or projection math. On the same line these spacers cancel equal
          // reductions in the previous boundary's post-break glue, leaving the
          // note's position unchanged. At a break the spacer remains at the
          // start of the next line and reserves real room.
          const lineStartReservationWidth =
            martyriaBarTransferWidth + leadingLyricHyphenReservationWidth;
          if (lineStartReservationWidth > 0) {
            this.addAnonymousBox(
              lineStartReservationWidth,
              layoutWorkspace,
              'line-start-reservation',
            );
          }

          // Knuth-Plass encoding for notes with lyrics.
          //
          // Each note contributes:
          //
          //   penalty(inf)         protect the left projection
          //   glue(L_i, 0, 0)      fixed left projection
          //   box(B_i)             note advance: neumeWidth + spaceAfter
          //   penalty(cost, w_i)   candidate breakpoint
          //   glue(m_i, s^+, s^-)  same-line spacing that vanishes at breaks
          //
          // This is the ordinary note-to-note form. Before a martyria, the
          // note's post-break glue is fixed because the martyria path replaces
          // it and supplies the boundary elasticity.
          //
          // m_i is the preferred same-line width. For ordinary note-to-note
          // boundaries, visual, measure-bar, lyric, and melisma minima are all
          // preferred widths and do not cap the standard shrink budget s^-.
          //
          // At a break, the final glue becomes leading glue on the next line
          // and is skipped by positionItems, so m_i and its elasticity
          // disappear. L_{i+1} then protects the left edge of the next line,
          // and the penalty width w_i reserves break-only space for the right
          // projection, melisma overhang, and measure-bar transfers. Terminal
          // right-barline clearance is also reserved when the current note's
          // barline remains at line end.
          //
          // m_i usually starts from
          // s_0 + R_i - T_i^left - T_i^right + ell_i, then is raised to any
          // larger preferred visual, measure-bar, lyric, or carried-melisma
          // width. The carried-melisma-to-centered-lyric case starts at 0; see
          // calculateInterNoteSpacing.
          // R_i is the right projection, ell_i is the lyric-collision
          // correction, T_i^left is the absorbed portion of L_{i+1}, and
          // T_i^right is the portion of R_i that tucks under the next neume.
          // For hyphenated melismas,
          // ell_i also enforces that the visible lyric gap is wide enough to
          // hold the hyphen glyph when that hyphen is absorbed inside the
          // current neume and therefore contributes no overhang. m_i may also
          // stay negative when the user requests overlapping notes and no real
          // collision, lyric, or barline floor binds.
          //
          // If a paragraph ends immediately after a note, endParagraph moves
          // that note's trailing reservation (right projection, melisma
          // overhang, or terminal barline clearance) into the finishing glue,
          // because the trailing glue is removed. If a martyria replaces that
          // trailing glue, the martyria path preserves any remaining melisma
          // overhang and required terminal barline clearance there instead.
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
            this.addGlue(
              this.fixedGlue(leftProjection),
              layoutWorkspace,
              'left-projection',
            );
          }

          // Compute lyric and neume end positions in the idealized layout.
          const lyricsEnd =
            layoutWorkspace.neumesEndPx +
            this.getLyricTextRight(noteElement, false);

          const neumeEnd =
            layoutWorkspace.neumesEndPx +
            noteElement.neumeWidth +
            inlineSpacing;

          layoutWorkspace.lyricsEndPx = noteElement.isMelismaStart
            ? noteElement.spaceAfter + neumeEnd
            : noteElement.spaceAfter + lyricsEnd;

          const hyphenWidthForThisElement =
            noteElement.isMelismaStart && noteElement.isHyphen
              ? this.getTextWidthFromCache(noteElement, '-')
              : 0;
          // In the absorbed-hyphen case, the visible gap between syllables must
          // hold both the hyphen glyph and the ordinary lyric spacing before
          // the next syllable.
          const minimumLyricGap =
            pageSetup.lyricsMinimumSpacing + hyphenWidthForThisElement;
          if (noteElement.isMelismaStart) {
            layoutWorkspace.melismaLyricsEndPx =
              noteElement.spaceAfter + lyricsEnd + hyphenWidthForThisElement;
          } else if (!noteElement.isMelisma) {
            layoutWorkspace.melismaLyricsEndPx = null;
          }

          // The note box advance (unchanged by the bar transfer).
          this.addBox(elementWidthPx, noteElement, layoutWorkspace);

          const nextNoteElement = this.getNoteIfPresentAt(elements, i + 1);
          const afterNextNoteElement = this.getNoteIfPresentAt(elements, i + 2);
          let nextLeadingLyricHyphenReservation = 0;
          if (nextNoteElement != null) {
            nextNoteElement.leadingLyricHyphenOffset = 0;
            nextNoteElement.leadingLyricHyphenReservationWidth = 0;
          }
          if (
            noteElement.isHyphen &&
            nextNoteElement != null &&
            nextNoteElement.lyricsWidth > 0 &&
            LayoutService.mayShowLeadingLyricHyphen(
              noteElement,
              pageSetup,
              phase1GreekMelismaIsActive,
            )
          ) {
            const leadingLyricHyphenWidth = this.getTextWidthFromCache(
              nextNoteElement,
              '-',
            );
            const leadingLyricHyphenGeometry =
              this.getLeadingLyricHyphenGeometry(
                nextNoteElement,
                pageSetup,
                leadingLyricHyphenWidth,
              );
            nextNoteElement.leadingLyricHyphenOffset =
              leadingLyricHyphenGeometry.hyphenOffset;
            nextNoteElement.leadingLyricHyphenReservationWidth =
              leadingLyricHyphenGeometry.reservationWidth;
            nextLeadingLyricHyphenReservation =
              leadingLyricHyphenGeometry.reservationWidth;
          }
          layoutWorkspace.pendingLeadingLyricHyphenReservationWidth =
            nextLeadingLyricHyphenReservation;
          phase1GreekMelismaIsActive =
            LayoutService.getGreekMelismaIsActiveAfterNote(
              noteElement,
              pageSetup,
              phase1GreekMelismaIsActive,
            );

          const m_i = this.calculateInterNoteSpacing(
            noteElement,
            rightProjection,
            nextElement,
            nextNoteElement,
            layoutWorkspace,
            minimumLyricGap,
            measureBarWidthMap,
          );

          // Combine the graded automatic penalties with the resolved absolute
          // constraint for this boundary, then clamp the total to MAX_COST.
          const breakConstraint = this.getBreakConstraint(
            noteElement,
            nextElement,
          );
          const breakCost = Math.min(
            MAX_COST,
            this.getBreakCost(noteElement, nextElement, afterNextNoteElement) +
              breakConstraint.cost,
          );

          // Penalty width is conditional: only counted when a break occurs
          // here. It reserves space for:
          // 1. Right projection (lyric extending past the neume).
          // 2. Melisma lyric overhang past the neume.
          // 3. Measure bar transfer (the following note's left bar moves to
          //    this note's right side). getBreakPenaltyWidth also calculates a
          //    following martyria's left bar, but automatic breaks before a
          //    martyria are prohibited; explicit transfer is handled in Phase 2.
          // 4. Terminal clearance before the current note's right barline.
          // These costs are break-conditional and cannot go in m_i (which
          // vanishes at breaks via the post-break glue).
          const penaltyWidth = this.getBreakPenaltyWidth(
            noteElement,
            rightProjection,
            layoutWorkspace,
            nextElement,
            measureBarWidthMap,
          );

          // A following martyria replaces this note's trailing glue with its own
          // note-to-martyria glue, so the note must not contribute elasticity too.
          const martyriaOwnsBoundaryGlue =
            nextElement?.elementType === ElementType.Martyria;

          const postBreakGlue = martyriaOwnsBoundaryGlue
            ? this.fixedGlue(m_i - nextLeadingLyricHyphenReservation)
            : {
                ...standardGlue,
                width: m_i - nextLeadingLyricHyphenReservation,
              };

          // Break opportunity after the neume. The candidate penalty sits
          // immediately after the box, and the post-break glue contributes
          // same-line spacing and, ordinarily, elasticity. When a break is
          // taken, that glue becomes leading glue on the next line and is
          // skipped by positionItems.
          this.addPenalty(
            layoutWorkspace,
            breakCost,
            penaltyWidth,
            breakConstraint.label,
          );
          this.addGlue(postBreakGlue, layoutWorkspace);

          break;
        }
        case ElementType.Martyria: {
          // PROCESS MARTYRIA
          const martyriaElement = elements[i] as MartyriaElement;
          const previousElement = this.getElementAt(elements, i - 1);
          const elementWidthPx = this.getMartyriaWidth(
            martyriaElement,
            pageSetup,
          );
          const isParagraphStartMartyria =
            layoutWorkspace.pendingParagraph.length === 0;
          const lineStartMartyriaShift = martyriaElement.alignRight
            ? 0
            : this.getLineStartMartyriaShift(martyriaElement, 0, pageSetup);
          const useStandardLeadingGlue =
            !martyriaElement.alignRight &&
            (!!martyriaElement.tempoLeft ||
              previousElement?.elementType === ElementType.Tempo);
          const useStandardTrailingGlue =
            !martyriaElement.alignRight &&
            (!!martyriaElement.tempoRight ||
              nextElement?.elementType === ElementType.Tempo);
          const leadingGlueWidth = useStandardLeadingGlue
            ? standardGlue.width
            : martyriaGlue.width;
          const trailingGlue = useStandardTrailingGlue
            ? standardGlue
            : martyriaGlue;
          const trailingVisualSpacing = this.getVisualGlueSpacing(
            martyriaElement,
            nextElement,
            trailingGlue.width,
            pageSetup,
          );
          const rightSameLineMinimum = Math.max(
            this.getMeasureBarMinimumGlueWidth(
              martyriaElement,
              nextElement,
              pageSetup,
              measureBarWidthMap,
            ),
            trailingVisualSpacing.requiredWidth,
          );
          const previousNote =
            previousElement?.elementType === ElementType.Note
              ? (previousElement as NoteElement)
              : null;
          const nextNote =
            nextElement?.elementType === ElementType.Note
              ? (nextElement as NoteElement)
              : null;
          // This balancing pass is intentionally narrow. It applies only to
          // the ordinary note-martyria-note case where the martyria owns both
          // sides of the boundary glue and no inline measure bars or side
          // tempo signs need their existing special-case spacing rules.
          const balancedMartyriaNeighbors =
            !martyriaElement.alignRight &&
            previousNote != null &&
            nextNote != null &&
            !useStandardLeadingGlue &&
            !useStandardTrailingGlue &&
            LayoutService.getVisibleMeasureBarLeft(martyriaElement) == null &&
            LayoutService.getVisibleMeasureBarRight(martyriaElement) == null &&
            LayoutService.getVisibleMeasureBarRight(previousNote) == null &&
            LayoutService.getVisibleMeasureBarLeft(nextNote) == null
              ? { nextNote, previousNote }
              : null;
          let balancedBoundary: BalancedMartyriaBoundary | null = null;
          const skipLyricCollision =
            !martyriaElement.alignRight &&
            layoutWorkspace.pendingParagraph.length > 0 &&
            previousElement?.elementType === ElementType.Tempo;
          if (
            layoutWorkspace.pendingParagraph.length > 0 &&
            (martyriaElement.alignRight ||
              previousElement?.elementType === ElementType.Note ||
              previousElement?.elementType === ElementType.Tempo)
          ) {
            // Replacing a note's trailing glue would otherwise drop any
            // melisma lyric overhang carried in that glue. Preserve that width
            // and, for a right-aligned martyria, terminal barline clearance.
            // Ordinary lyric collision before a martyria is handled below
            // unless this is a tempo-to-martyria boundary.
            const trailingNoteReservations = this.getTrailingNoteReservations(
              layoutWorkspace,
              measureBarWidthMap,
            );
            const reservation =
              (trailingNoteReservations?.melismaOverhang ?? 0) +
              (martyriaElement.alignRight
                ? (trailingNoteReservations?.terminalMeasureBarSpacing ?? 0)
                : 0);
            const baseGlue = martyriaElement.alignRight
              ? rightMartyriaGlue
              : useStandardLeadingGlue
                ? standardGlue
                : martyriaGlue;
            const leadingVisualSpacing = this.getVisualGlueSpacing(
              previousElement,
              martyriaElement,
              baseGlue.width,
              pageSetup,
            );
            const leadingSameLineMinimum = Math.max(
              this.getMeasureBarMinimumGlueWidth(
                previousElement,
                martyriaElement,
                pageSetup,
                measureBarWidthMap,
              ),
              leadingVisualSpacing.requiredWidth,
            );
            const leadingStructuralDeficit = Math.max(
              leadingVisualSpacing.deficit,
              leadingSameLineMinimum - baseGlue.width,
            );
            this.removeGlue(layoutWorkspace);
            const martyriaBoundaryStart = layoutWorkspace.neumesEndPx;
            const previousLyricsEndPx = Math.max(
              layoutWorkspace.lyricsEndPx,
              layoutWorkspace.melismaLyricsEndPx ?? Number.NEGATIVE_INFINITY,
            );
            const leftStructuralWidth =
              baseGlue.width + Math.max(reservation, leadingStructuralDeficit);
            const leftLyricMinimum = Math.max(
              0,
              previousLyricsEndPx - martyriaBoundaryStart + leadingGlueWidth,
            );
            const leftBoundaryMinimum = Math.max(
              leftStructuralWidth,
              leftLyricMinimum,
            );

            if (balancedMartyriaNeighbors != null) {
              const { nextNote, previousNote } = balancedMartyriaNeighbors;
              // Balance the martyria against the nearest visible boundary on
              // each side. A lyric overhang toward the martyria replaces the
              // neume ink edge for that side; otherwise the neume ink edge
              // remains the visible boundary endpoint.
              const previousLyricRightOverhang = Math.max(
                0,
                previousLyricsEndPx - martyriaBoundaryStart,
              );
              // Natural balancing uses martyria glue width, but compression
              // may continue down to the hard visual and lyric clearance floor.
              const leftHardLyricMinimum = Math.max(
                0,
                previousLyricsEndPx -
                  martyriaBoundaryStart +
                  standardGlue.width,
              );
              const leftHardMinimum = Math.max(
                0,
                leadingSameLineMinimum,
                leftHardLyricMinimum,
              );
              const nextNoteLeftProjection = this.getLyricProjections(
                nextNote,
                nextNote.alignLeft,
              ).leftProjection;
              const rightBoundaryMinimum =
                Math.max(
                  trailingGlue.width + trailingVisualSpacing.deficit,
                  rightSameLineMinimum,
                ) + nextNoteLeftProjection;
              const rightHardMinimum =
                rightSameLineMinimum + nextNoteLeftProjection;
              const leftVisibleBoundaryWidth =
                this.getMartyriaLeftInkOverhang(martyriaElement, pageSetup) +
                Math.max(
                  previousLyricRightOverhang,
                  this.getElementRightInkOverhang(previousNote, pageSetup),
                );
              const rightVisibleBoundaryWidth =
                this.getMartyriaRightInkOverhang(martyriaElement, pageSetup) +
                Math.max(
                  nextNoteLeftProjection,
                  this.getElementLeftInkOverhang(nextNote, pageSetup),
                );
              const sharedVisibleWhitespace = Math.max(
                leftBoundaryMinimum - leftVisibleBoundaryWidth,
                rightBoundaryMinimum - rightVisibleBoundaryWidth,
              );
              const leadingWidth =
                sharedVisibleWhitespace + leftVisibleBoundaryWidth;
              const trailingWidth =
                sharedVisibleWhitespace +
                rightVisibleBoundaryWidth -
                nextNoteLeftProjection;
              balancedBoundary = {
                leadingWidth,
                shrink: Math.min(
                  baseGlue.shrink,
                  Math.max(0, leadingWidth - leftHardMinimum),
                  Math.max(
                    0,
                    trailingWidth + nextNoteLeftProjection - rightHardMinimum,
                  ),
                ),
                trailingWidth,
              };
            }
            const newGlue =
              balancedBoundary != null
                ? {
                    ...this.createMartyriaLeadingGlue(
                      baseGlue,
                      Math.max(
                        0,
                        balancedBoundary.leadingWidth - baseGlue.width,
                      ),
                      leftBoundaryMinimum,
                    ),
                    shrink: balancedBoundary.shrink,
                  }
                : this.createMartyriaLeadingGlue(
                    baseGlue,
                    Math.max(reservation, leadingStructuralDeficit),
                    leadingSameLineMinimum > 0
                      ? leadingSameLineMinimum
                      : undefined,
                  );
            // Pair a fixed spacer with a matching leading-glue reduction. On the
            // same line they cancel; at line start the leading glue is skipped
            // and the spacer reserves room for the martyria's left ink overhang.
            this.addGlue(
              this.offsetGlueWidth(newGlue, lineStartMartyriaShift),
              layoutWorkspace,
              'martyria-leading',
            );
          } else if (martyriaElement.alignRight) {
            // A paragraph-start right martyria still needs its leading glue in
            // the input stream, even though positionItems will skip it at line
            // start. Phase 2 supplies the explicit flush-right placement.
            this.addGlue(
              rightMartyriaGlue,
              layoutWorkspace,
              'martyria-leading',
            );
          }

          if (lineStartMartyriaShift > 0) {
            this.addAnonymousBox(
              lineStartMartyriaShift,
              layoutWorkspace,
              'martyria-shift',
            );
          }

          const lyricReservationParagraphStart =
            lineStartMartyriaShift > 0 ? isParagraphStartMartyria : undefined;

          if (skipLyricCollision) {
            layoutWorkspace.lyricsEndPx =
              layoutWorkspace.neumesEndPx + elementWidthPx;
          } else {
            this.addLyricReservation(
              elementWidthPx,
              martyriaElement,
              layoutWorkspace,
              leadingGlueWidth,
              lyricReservationParagraphStart,
              trailingGlue.width,
            );
          }
          this.addBox(elementWidthPx, martyriaElement, layoutWorkspace);

          // Compute the measure bar width that would transfer from this
          // martyria to the next line's first note at an automatic break in the
          // same paragraph. A note with its own left bar is not eligible. On the
          // same line, the reduced post-break glue is cancelled by an anonymous
          // spacer before the note. At a break, the glue vanishes and the spacer
          // reserves collision-aware leading space for the transferred bar.
          const nextNoteForBar = this.getNoteIfPresentAt(elements, i + 1);
          const martyriaTransferBar =
            this.getMartyriaTransferBar(martyriaElement);
          const martyriaBarTransferWidth =
            martyriaTransferBar &&
            nextNoteForBar &&
            !nextNoteForBar.measureBarLeft
              ? (measureBarWidthMap.get(martyriaTransferBar) ?? 0) +
                this.getMeasureBarLeftLeadingSpacingForMeasureBar(
                  nextNoteForBar,
                  martyriaTransferBar,
                  pageSetup,
                  measureBarWidthMap,
                )
              : 0;
          layoutWorkspace.pendingMartyriaBarTransferWidth =
            martyriaBarTransferWidth;

          // Martyria break opportunity. Keep the preferred martyria spacing
          // after the martyria when it stays mid-line, but make that spacing
          // disappear when a break is taken here. Embedded or standalone tempo
          // cases can switch that trailing spacing to standard glue.
          // The bar transfer width is subtracted so that on the same line it
          // is cancelled by the anonymous spacer box before the note; at a
          // break it vanishes along with the rest of the post-break glue.
          // When the quantitative neume is present, the renderer keeps its
          // fixed spacing inside the box as marginLeft.

          const breakPenaltyWidth = this.getTerminalMartyriaRightSpacing(
            martyriaElement,
            pageSetup,
            measureBarWidthMap,
          );

          this.addProtectedBreakpointEncoding(
            layoutWorkspace,
            this.fixedGlue(0),
            0,
            breakPenaltyWidth,
            balancedBoundary != null
              ? {
                  ...this.createMartyriaPostBreakGlue(
                    trailingGlue,
                    Math.max(
                      0,
                      balancedBoundary.trailingWidth - trailingGlue.width,
                    ),
                    martyriaBarTransferWidth,
                    rightSameLineMinimum,
                  ),
                  shrink: balancedBoundary.shrink,
                }
              : this.createMartyriaPostBreakGlue(
                  trailingGlue,
                  trailingVisualSpacing.deficit,
                  martyriaBarTransferWidth,
                  rightSameLineMinimum,
                ),
          );

          // Must run even when lineBreak is already true (from pageBreak or an
          // explicit lineBreak): the finishing glue must not stretch and
          // compete with rightMartyriaGlue, which would strand the martyria
          // mid-line.
          if (martyriaElement.alignRight) {
            lineBreak = true;
            justifyLastLine = true;
          }

          break;
        }
        case ElementType.Tempo: {
          // PROCESS TEMPO
          const tempoElement = elements[i] as TempoElement;
          const previousElement = this.getElementAt(elements, i - 1);

          const elementWidthPx =
            this.getNeumeWidthFromCache(tempoElement.neume, pageSetup) +
            tempoElement.spaceAfter;
          tempoElement.neumeWidth = elementWidthPx;
          const skipLyricCollision =
            previousElement?.elementType === ElementType.Martyria &&
            layoutWorkspace.pendingParagraph.length > 0 &&
            !(previousElement as MartyriaElement).alignRight;
          if (skipLyricCollision) {
            layoutWorkspace.lyricsEndPx =
              layoutWorkspace.neumesEndPx + elementWidthPx;
          } else {
            this.addLyricReservation(
              elementWidthPx,
              tempoElement,
              layoutWorkspace,
            );
          }
          this.addBox(elementWidthPx, tempoElement, layoutWorkspace);
          this.addGlue(standardGlue, layoutWorkspace, 'standard');

          break;
        }
        case ElementType.DropCap: {
          // PROCESS DROPCAP
          const dropCapElement = elements[i] as DropCapElement;
          const resolvedDropCapStyle = resolveParagraphStyle(
            score.paragraphStyles,
            dropCapElement.paragraphStyleId,
            dropCapElement.getParagraphStyleOverrides(),
          );
          const resolvedDropCapFont = resolveFontStyle(
            resolvedDropCapStyle.fontFamily,
            resolvedDropCapStyle.fontStyle,
          );

          this.applyComputedTextStyle(
            dropCapElement,
            resolvedDropCapStyle,
            resolvedDropCapFont,
          );

          dropCapElement.computedLineHeight = resolvedDropCapStyle.lineHeight;

          dropCapElement.computedLineSpan = 1;

          let elementWidthPx: number;

          if (dropCapElement.customWidth != null) {
            elementWidthPx = dropCapElement.customWidth;
          } else {
            elementWidthPx = TextMeasurementService.getTextWidth(
              dropCapElement.content,
              dropCapElement.computedFont,
              dropCapElement.computedFontVariantCaps,
            );
          }

          dropCapElement.contentWidth = elementWidthPx;

          // A drop cap can only span multiple lines when it starts a paragraph.
          if (layoutWorkspace.pendingParagraph.length === 0) {
            const lineSpan = dropCapElement.lineSpan;

            layoutWorkspace.pendingDropCapWidthPx =
              elementWidthPx + inlineSpacing;
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
          this.addGlue(standardGlue, layoutWorkspace, 'standard');

          break;
        }
        case ElementType.Empty: {
          if (i !== elements.length - 1) {
            throw new Error('Unexpected empty element at index ' + i);
          }

          const emptyElement = elements[i] as EmptyElement;
          const previousElement = this.getElementAt(elements, i - 1);
          const followsNonRightAlignedMartyria =
            previousElement?.elementType === ElementType.Martyria &&
            !(previousElement as MartyriaElement).alignRight;
          emptyElement.height = neumeHeight;

          this.addLyricReservation(
            emptyElementWidth,
            emptyElement,
            layoutWorkspace,
            undefined,
            followsNonRightAlignedMartyria ? true : undefined,
          );
          this.addBox(emptyElementWidth, emptyElement, layoutWorkspace);
          this.addGlue(standardGlue, layoutWorkspace, 'standard');

          lineBreak = true;

          break;
        }
        default:
          throw new Error(
            `Unhandled element type in layout service: ${elements[i].elementType}`,
          );
      }

      // A block element terminates its own line.
      if (!lineBreak && isBlockElement(elements[i])) {
        lineBreak = true;
        justifyLastLine = true;
      }

      // A fill-width element must terminate the paragraph so Phase 2 can
      // resolve its width against the line end. Leave justifyLastLine false so
      // the rest of the line is not justified. Exception: if the next element
      // is a right-aligned martyria, let the martyria handler terminate the
      // paragraph instead so the box fills up to that martyria.
      if (
        this.isFillWidthElement(elements[i]) &&
        !lineBreak &&
        !isRightAlignedMartyria(nextElement)
      ) {
        lineBreak = true;
      }

      // A line break is implied before a block text box, rich-text box, image
      // box, or mode key element.
      // TODO support inline mode keys
      if (isBlockElement(nextElement)) {
        lineBreak = true;
      }

      // Invariant: After processing each element, there should be trailing glue
      // at the end of the paragraph (for example a note's post-break glue,
      // martyria spacing glue, or ordinary spacing after another
      // element), even if the element has an (explicit or implicit) line break
      // and the paragraph is about to end. In the latter case, endParagraph()
      // removes that trailing glue and replaces it with finishing glue.
      if (lineBreak) {
        this.endParagraph(justifyLastLine, layoutWorkspace, measureBarWidthMap);
      }

      if (layoutWorkspace.diagnostics != null) {
        layoutWorkspace.diagnostics.currentOwner = null;
      }
    }

    // Phase 2: Place completed paragraphs onto pages
    const extraHeaderFooterHeightCache = new Map<
      number,
      { extraHeaderHeightPx: number; extraFooterHeightPx: number }
    >();

    // Running-marker metadata is a left fold over pages: a page's metadata
    // depends only on its own content and the previous page's metadata.
    // Pages are appended in order, so fold each page exactly once when it
    // has completed, and resolve the current, still-filling page on demand
    // without folding it in.
    let completedRunningMarkerPageCount = 0;
    let completedRunningMarkerMetadata: RunningMarkerPageMetadata | null = null;
    const resolveCurrentPageIsChapterOpening = () => {
      while (completedRunningMarkerPageCount < pages.length - 1) {
        completedRunningMarkerMetadata = resolveNextRunningMarkerPageMetadata(
          pages[completedRunningMarkerPageCount],
          completedRunningMarkerMetadata,
        );
        completedRunningMarkerPageCount++;
      }

      return resolveNextRunningMarkerPageMetadata(
        page,
        completedRunningMarkerMetadata,
      ).isChapterOpening;
    };

    // Keep header/footer overflow reservation stable within a physical page.
    // This mitigates intra-page drift when oversized headers/footers extend
    // outside the margins, but it is not a predictive pagination fix and does
    // not guarantee those out-of-margin layouts will behave correctly.
    const getCachedExtraHeaderFooterHeight = () => {
      const physicalPageNumber = page.physicalPageNumber;
      const cachedHeights =
        extraHeaderFooterHeightCache.get(physicalPageNumber);

      if (cachedHeights != null) {
        return cachedHeights;
      }

      // Running markers only affect header/footer selection, so skip the
      // page scan entirely when neither is shown.
      const isChapterOpening =
        pageSetup.showHeader || pageSetup.showFooter
          ? resolveCurrentPageIsChapterOpening()
          : false;
      const extraHeights = this.getExtraHeaderFooterHeight(
        score,
        pageSetup,
        physicalPageNumber,
        isChapterOpening,
      );
      extraHeaderFooterHeightCache.set(physicalPageNumber, extraHeights);

      return extraHeights;
    };

    // Page margins depend only on the physical page number, so resolve them
    // once per page instead of once per positioned element.
    const resolvedPageMarginsCache = new Map<number, ResolvedPageMargins>();
    const getCachedResolvedPageMargins = () => {
      const physicalPageNumber = page.physicalPageNumber;
      let resolvedMargins = resolvedPageMarginsCache.get(physicalPageNumber);

      if (resolvedMargins == null) {
        resolvedMargins = resolvePageMargins(pageSetup, physicalPageNumber);
        resolvedPageMarginsCache.set(physicalPageNumber, resolvedMargins);
      }

      return resolvedMargins;
    };

    for (const [
      completedParagraphIndex,
      completedParagraph,
    ] of layoutWorkspace.completedParagraphs.entries()) {
      const {
        diagnostics,
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
          newLine.diagnostics = diagnostics?.[nextLineIndex] ?? null;
          page.lines.push(newLine);

          paragraphLineIndex += 1;

          // New lines start with the default allocation until their content
          // determines the final line height.
          lastLineHeightPx = pageSetup.lineHeight;
          currentPageHeightPx += lastLineHeightPx;
        }

        // Calculate the height of the headers/footers of the current page
        let { extraHeaderHeightPx, extraFooterHeightPx } =
          getCachedExtraHeaderFooterHeight();

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
          page.physicalPageNumber = pages.length + 1;
          page.lines.push(lastLine);
          pages.push(page);
          currentPageHeightPx = lastLineHeightPx;

          // Consume the page-break trigger. Subsequent positioned items
          // belonging to the same break (glues, penalties without an
          // associated element) hit the `continue` below and skip the
          // `lastElementWasPageBreak` update, so without this reset the
          // flag re-fires this branch and leaves an empty page behind.
          lastElementWasPageBreak = false;

          // Recalculate the height of the headers/footers of the new page
          ({ extraHeaderHeightPx, extraFooterHeightPx } =
            getCachedExtraHeaderFooterHeight());
        }

        if (!('element' in item)) {
          continue;
        }
        const element = (item as ElementBox).element;
        const resolvedMargins = getCachedResolvedPageMargins();
        const contentStart = pageSetup.melkiteRtl
          ? resolvedMargins.right
          : resolvedMargins.contentLeft;

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

        if (
          isFirstElementOnLine &&
          element.elementType === ElementType.Martyria &&
          !(element as MartyriaElement).alignRight
        ) {
          currentLine.indentation += this.getLineStartMartyriaShift(
            element as MartyriaElement,
            position.xOffset,
            pageSetup,
          );
        }

        element.x = contentStart + position.xOffset + currentLine.indentation;

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
            if (nextPos.line > position.line) {
              break;
            }
            if (nextPos.line === position.line) {
              fillWidth = nextPos.xOffset - position.xOffset;
              break;
            }
          }
          if (fillWidth == null) {
            const lineWidth =
              resolvedMargins.contentWidth - currentLine.indentation;
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
          const previousElement = prevLine
            ? prevLine.elements[prevLine.elements.length - 1]
            : null;

          if (previousElement?.elementType === ElementType.Note) {
            // If the new line starts with a left measure, apply it to the
            // right of the previous line
            const previousNoteElement = previousElement as NoteElement;
            const transferredMeasureBar =
              this.getMeasureBarTransferredFromLineStart(element);
            if (transferredMeasureBar) {
              previousNoteElement.computedMeasureBarRight =
                transferredMeasureBar;
            }
          } else if (
            element.elementType === ElementType.Note &&
            previousElement?.elementType === ElementType.Martyria &&
            paragraphLineIndex > 0
          ) {
            const noteElement = element as NoteElement;
            // If the previous line ends with a martyria with a barline, apply
            // it to the left of the new line. Only transfer within the same
            // paragraph (paragraphLineIndex > 0); when a martyria ends a
            // paragraph (right-aligned or explicit line break), no bar is
            // transferred to the next paragraph's first note.
            const previousMartyriaElement = previousElement as MartyriaElement;
            const normalizedMeasureBar = this.getMartyriaTransferBar(
              previousMartyriaElement,
            );
            // Only transfer if the note doesn't already have its own
            // measureBarLeft: getNoteWidth already accounted for the
            // explicit one in Phase 1.
            if (normalizedMeasureBar && !noteElement.measureBarLeft) {
              noteElement.computedMeasureBarLeft = normalizedMeasureBar;
              // Phase 1 reserved non-stretching leading space for this
              // barline and its collision-aware clearance via an anonymous
              // spacer box before the note. Shift the note left so the
              // rendered barline occupies that reserved space instead of
              // adding extra width. Adjust neumeWidth and
              // lyricsHorizontalOffset so lyrics center under the neume body.
              const barlineWidth =
                measureBarWidthMap.get(normalizedMeasureBar) ?? 0;
              if (barlineWidth > 0) {
                const leadingSpacing = this.getMeasureBarLeftLeadingSpacing(
                  noteElement,
                  pageSetup,
                  measureBarWidthMap,
                );
                const reservedWidth = barlineWidth + leadingSpacing;
                noteElement.computedMeasureBarLeftLeadingSpacing =
                  leadingSpacing;
                noteElement.neumeWidth += reservedWidth;
                noteElement.lyricsHorizontalOffset += reservedWidth;
                element.x -= reservedWidth;
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
          isRightAlignedMartyria(element) &&
          currentLine.elements.length === 1
        ) {
          const martyriaElement = element as MartyriaElement;
          const rightInkReservation =
            this.getVisibleMeasureBarRight(martyriaElement) == null
              ? this.getMartyriaRightInkOverhang(martyriaElement, pageSetup)
              : 0;
          element.x = pageSetup.melkiteRtl
            ? resolvedMargins.right + rightInkReservation
            : pageSetup.pageWidth -
              resolvedMargins.right -
              element.width -
              rightInkReservation;
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
            (resolvedMargins.contentWidth -
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

    this.centerMeasureBars(pages, pageSetup, measureBarWidthMap);
    this.addMelismas(
      pages,
      pageSetup,
      defaultLyricsFontCss,
      measureBarWidthMap,
    );

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

    if (layoutWorkspace.loggingEnabled) {
      console.log(
        'avg ratio',
        layoutWorkspace.completedParagraphs
          .flatMap((p) => p.ratios)
          .reduce((sum, ratio, _, arr) => sum + ratio / arr.length, 0),
      );
    }

    return pages;
  }

  public static getElementOverlayDiagnostics(
    element: ScoreElement,
    nextElement: ScoreElement | null,
    pageSetup: PageSetup,
    context: OverlayDiagnosticsContext,
  ): ElementOverlayDiagnostics {
    const { measureBarWidthMap, neumeFontAscent, neumeFontHeight } = context;

    if (element.elementType === ElementType.Note) {
      const noteElement = element as NoteElement;
      const projections = this.getLyricProjections(
        noteElement,
        noteElement.alignLeft,
      );
      const nextNoteElement =
        nextElement?.elementType === ElementType.Note
          ? (nextElement as NoteElement)
          : null;
      const nextLeftProjection =
        nextNoteElement == null
          ? 0
          : this.getLyricProjections(nextNoteElement, nextNoteElement.alignLeft)
              .leftProjection;
      const nextOverhangs =
        nextNoteElement == null
          ? null
          : this.getNeumeOverhangs(nextNoteElement, nextNoteElement.alignLeft);
      const collisionBoxes = this.getNoteCollisionGlyphBoxes(
        noteElement,
        pageSetup,
        measureBarWidthMap,
      );

      const noteInkBox = this.getOverlayBoundsFromBoxes(collisionBoxes);
      const noteAdvanceBox = this.getNoteOverlayAdvanceBox(
        noteElement,
        measureBarWidthMap,
        neumeFontHeight,
      );

      const baselineOffset =
        neumeFontAscent +
        (neumeFontHeight - pageSetup.neumeDefaultFontSize) / 2;

      if (noteInkBox) {
        noteInkBox.top += baselineOffset;
      }

      return {
        advanceBox: noteAdvanceBox,
        collisionBoxes: collisionBoxes.map((box) => ({
          height: box.bottom - box.top,
          kind: box.collisionKind,
          left: box.left,
          top: box.top + baselineOffset,
          width: box.right - box.left,
        })),
        glyph: noteElement.quantitativeNeume,
        inkBox: noteInkBox,
        leftProjection: projections.leftProjection,
        leftTuck: nextNoteElement == null ? null : nextLeftProjection,
        lyricBox:
          noteElement.lyricsWidth > 0
            ? {
                height: noteElement.lyricsFontHeight,
                left: this.getLyricTextLeft(noteElement),
                top: noteElement.lyricsVerticalOffset,
                width: noteElement.lyricsWidth,
              }
            : null,
        rightProjection: projections.rightProjection,
        rightTuck:
          nextNoteElement == null || nextOverhangs == null
            ? null
            : Math.min(projections.rightProjection, nextOverhangs.left),
        rootNeume: null,
      };
    }

    if (element.elementType === ElementType.Martyria) {
      const martyriaElement = element as MartyriaElement;
      const collisionBoxes = this.getMartyriaCollisionGlyphBoxes(
        martyriaElement,
        pageSetup,
      );

      const martyriaInkBox = this.getOverlayBoundsFromBoxes(collisionBoxes);
      const martyriaAdvanceBox = this.getMartyriaOverlayAdvanceBox(
        martyriaElement,
        pageSetup,
        measureBarWidthMap,
        neumeFontHeight,
      );

      const baselineOffset =
        neumeFontAscent +
        (neumeFontHeight - pageSetup.neumeDefaultFontSize) / 2;

      if (martyriaInkBox) {
        martyriaInkBox.top += baselineOffset;
      }

      return {
        advanceBox: martyriaAdvanceBox,
        collisionBoxes: collisionBoxes.map((box) => ({
          height: box.bottom - box.top,
          left: box.left,
          top: box.top + baselineOffset,
          width: box.right - box.left,
        })),
        glyph: martyriaElement.note,
        inkBox: martyriaInkBox,
        leftProjection: null,
        leftTuck: null,
        lyricBox: null,
        rightProjection: null,
        rightTuck: null,
        rootNeume: martyriaElement.rootSign,
      };
    }

    if (element.elementType === ElementType.Tempo) {
      const tempoElement = element as TempoElement;

      return {
        advanceBox: {
          height: neumeFontHeight,
          left: 0,
          top: 0,
          width: tempoElement.neumeWidth,
        },
        collisionBoxes: [],
        glyph: tempoElement.neume,
        inkBox: null,
        leftProjection: null,
        leftTuck: null,
        lyricBox: null,
        rightProjection: null,
        rightTuck: null,
        rootNeume: null,
      };
    }

    if (element.elementType === ElementType.Empty) {
      return {
        advanceBox: {
          height: (element as EmptyElement).height,
          left: 0,
          top: 0,
          width: element.width,
        },
        collisionBoxes: [],
        glyph: null,
        inkBox: null,
        leftProjection: null,
        leftTuck: null,
        lyricBox: null,
        rightProjection: null,
        rightTuck: null,
        rootNeume: null,
      };
    }

    return {
      advanceBox: null,
      collisionBoxes: [],
      glyph: null,
      inkBox: null,
      leftProjection: null,
      leftTuck: null,
      lyricBox: null,
      rightProjection: null,
      rightTuck: null,
      rootNeume: null,
    };
  }

  public static createOverlayDiagnosticsContext(
    pageSetup: PageSetup,
  ): OverlayDiagnosticsContext {
    const font = this.getNeumeFont(pageSetup);

    return {
      measureBarWidthMap: this.getMeasureBarWidthMap(pageSetup),
      neumeFontAscent:
        fontService.getMetrics(pageSetup.neumeDefaultFontFamily).ascent *
        pageSetup.neumeDefaultFontSize,
      neumeFontHeight: TextMeasurementService.getFontHeight(font),
    };
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
      'fill-width',
    );
  }

  private static getDiagnosticBoxLabel(element: ScoreElement) {
    switch (element.elementType) {
      case ElementType.Note: {
        return 'note';
      }
      case ElementType.Martyria: {
        return 'martyria';
      }
      case ElementType.TextBox:
        return 'text-box';
      case ElementType.RichTextBox:
        return 'rich-text-box';
      case ElementType.ImageBox:
        return 'image';
      case ElementType.ModeKey: {
        return 'mode-key';
      }
      case ElementType.Tempo: {
        return 'tempo';
      }
      case ElementType.DropCap:
        return 'drop-cap';
      case ElementType.Empty:
        return 'empty';
      default:
        return String(element.elementType);
    }
  }

  private static getNeumeFont(pageSetup: PageSetup) {
    return pageSetup.neumeDefaultFontCss;
  }

  private static getInlineSpacing(pageSetup: PageSetup) {
    return (
      pageSetup.neumeDefaultFontSize *
        fontService.getStandardGlue(pageSetup.neumeDefaultFontFamily).width +
      pageSetup.neumeDefaultSpacing
    );
  }

  private static getMeasureBarCollisionSpacing(pageSetup: PageSetup) {
    return this.getInlineSpacing(pageSetup);
  }

  private static getInitialLyricsEndPx(pageSetup: PageSetup) {
    return -this.getInlineSpacing(pageSetup);
  }

  private static measurePlainTextWidth(
    text: string,
    font: string,
    fontVariantCaps: string = 'normal',
  ) {
    const template = document.createElement('template');
    template.innerHTML = text;
    const plainText = template.content.textContent ?? '';
    const lines = plainText.split(/(?:\r\n|\r|\n)/g);
    let maxWidth = 0;

    for (const line of lines) {
      const lineWidth = TextMeasurementService.getTextWidth(
        line,
        font,
        fontVariantCaps,
      );
      if (lineWidth > maxWidth) {
        maxWidth = lineWidth;
      }
    }

    return Math.max(
      TextMeasurementService.getTextWidth(' ', font, fontVariantCaps),
      maxWidth,
      1,
    );
  }

  private static measureRichTextWidth(
    html: string,
    defaultLyricsFontCss: string,
  ) {
    const template = document.createElement('template');
    template.innerHTML = html;
    const plainText = template.content.textContent ?? '';

    return this.measurePlainTextWidth(plainText, defaultLyricsFontCss);
  }

  private static getFillWidthPlaceholderWidth(
    element: ScoreElement,
    defaultLyricsFontCss: string,
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
          textBoxElement.computedFontVariantCaps,
        ),
        this.measurePlainTextWidth(
          textBoxElement.contentBottom,
          textBoxElement.computedFont,
          textBoxElement.computedFontVariantCaps,
        ),
      );
    }

    if (
      element.elementType === ElementType.RichTextBox &&
      (element as RichTextBoxElement).inline
    ) {
      const richTextBoxElement = element as RichTextBoxElement;
      return Math.max(
        this.measureRichTextWidth(
          richTextBoxElement.content,
          defaultLyricsFontCss,
        ),
        this.measureRichTextWidth(
          richTextBoxElement.contentBottom,
          defaultLyricsFontCss,
        ),
      );
    }

    return this.measurePlainTextWidth('', defaultLyricsFontCss);
  }

  private static addLyricReservation(
    elementWidthPx: number,
    element: ScoreElement,
    workspace: LayoutWorkspace,
    glueWidth?: number,
    isParagraphStartOverride?: boolean,
    lyricEndGlueWidth?: number,
  ) {
    glueWidth = glueWidth ?? this.getInlineSpacing(workspace.pageSetup);
    lyricEndGlueWidth = lyricEndGlueWidth ?? glueWidth;
    // Skip lyric collision for non-inline block elements (TextBox, RichTextBox,
    // ImageBox, ModeKey), which occupy the full line width and have no lyrics
    // to collide with. Fill-width inline elements still need collision
    // handling: their width is deferred to Phase 2, but their left edge is
    // already known in Phase 1.
    if (isBlockElement(element)) {
      return;
    }

    const previousLyricsEndPx =
      workspace.melismaLyricsEndPx == null
        ? workspace.lyricsEndPx
        : Math.max(workspace.lyricsEndPx, workspace.melismaLyricsEndPx);

    // Maintain at least glueWidth between the previous lyric end and the
    // current element.
    if (workspace.neumesEndPx <= previousLyricsEndPx + glueWidth) {
      const adjustment =
        previousLyricsEndPx - workspace.neumesEndPx + glueWidth;
      const isParagraphStart =
        isParagraphStartOverride ?? workspace.pendingParagraph.length === 0;

      // A zero-width spacer would only add a box to pendingParagraph without
      // advancing neumesEndPx. The immediately-following addBox call already
      // supplies the box that anchors any later glue as a legal breakpoint,
      // so the spacer is redundant when adjustment is 0. This mirrors the
      // martyria bar-transfer call site, which is also guarded by > 0.
      //
      // Likewise, the first visible inline element in a paragraph should stay
      // flush with the left margin. Reserve the lyric space in lyricsEndPx, but
      // let the element's own box be the first paragraph item instead of
      // prepending an anonymous spacer box that positionItems would place at x=0.
      if (adjustment > 0 && !isParagraphStart) {
        this.addAnonymousBox(adjustment, workspace, 'lyric-collision');
      }
    }

    workspace.lyricsEndPx =
      workspace.neumesEndPx + elementWidthPx + lyricEndGlueWidth;
  }

  private static addBox(
    width: number,
    element: ScoreElement,
    workspace: LayoutWorkspace,
  ) {
    const box: ElementBox = {
      type: 'box',
      width,
      element,
    };

    this.pushParagraphItem(
      box,
      workspace,
      element,
      false,
      this.getDiagnosticBoxLabel(element),
    );
    workspace.neumesEndPx += width;
  }

  private static addAnonymousBox(
    width: number,
    workspace: LayoutWorkspace,
    label?: string,
  ) {
    this.pushAnonymousParagraphItem({ type: 'box', width }, workspace, label);
    workspace.neumesEndPx += width;
  }

  private static addGlue(
    glue: Glue,
    workspace: LayoutWorkspace,
    label?: string,
  ) {
    this.pushParagraphItem(glue, workspace, undefined, false, label);
    workspace.neumesEndPx += glue.width;
  }

  // Resolves the structural or user-set constraint on the explicit penalty
  // breakpoint that follows a note.
  private static getBreakConstraint(
    element: ScoreElement,
    nextElement: ScoreElement | null,
  ): BreakConstraint {
    if (isKeepWithNextActive(element, nextElement)) {
      return { cost: MAX_COST, label: 'keep-with-next' };
    }

    if (isAutomaticBreakProhibited(element, nextElement)) {
      return { cost: MAX_COST, label: 'prevent-automatic-break' };
    }

    return { cost: 0, label: 'break-penalty' };
  }

  private static fixedGlue(width: number): Glue {
    return {
      type: 'glue',
      width,
      stretch: 0,
      shrink: 0,
    };
  }

  private static offsetGlueWidth(glue: Glue, offset: number): Glue {
    return offset === 0
      ? glue
      : {
          ...glue,
          width: glue.width - offset,
        };
  }

  private static getMeasureBarWidthMap(pageSetup: PageSetup) {
    const font = this.getNeumeFont(pageSetup);

    return new Map(
      [...measureBarLeftToAbove.keys()].map((measureBar) => [
        measureBar,
        TextMeasurementService.getTextWidth(
          NeumeMappingService.getMapping(measureBar).text,
          font,
        ),
      ]),
    );
  }

  private static createMartyriaGlue(pageSetup: PageSetup): Glue {
    const martyriaGlue = fontService.getMartyriaGlue(
      pageSetup.neumeDefaultFontFamily,
    );

    return {
      type: 'glue',
      width: pageSetup.neumeDefaultFontSize * martyriaGlue.width,
      stretch: Math.max(
        pageSetup.neumeDefaultFontSize * martyriaGlue.stretch,
        minGlueStretch,
      ),
      shrink: Math.max(
        minGlueShrink,
        pageSetup.neumeDefaultFontSize * martyriaGlue.shrink,
      ),
    };
  }

  private static createMartyriaLeadingGlue(
    baseGlue: Glue,
    reservation: number,
    minimumWidth?: number,
  ): Glue {
    const width = baseGlue.width + reservation;

    return {
      ...baseGlue,
      width,
      shrink:
        minimumWidth == null
          ? baseGlue.shrink
          : Math.min(baseGlue.shrink, Math.max(0, width - minimumWidth)),
    };
  }

  private static createMartyriaPostBreakGlue(
    baseGlue: Glue,
    trailingPadding: number,
    barTransferWidth: number,
    minimumSameLineWidth: number,
  ): Glue {
    return {
      ...baseGlue,
      width: baseGlue.width + trailingPadding - barTransferWidth,
      shrink: Math.min(
        baseGlue.shrink,
        Math.max(0, baseGlue.width + trailingPadding - minimumSameLineWidth),
      ),
    };
  }

  private static addPenalty(
    workspace: LayoutWorkspace,
    cost: number,
    width: number,
    label?: string,
  ) {
    const penalty = {
      type: 'penalty' as const,
      cost,
      width,
      flagged: false,
    };

    this.pushParagraphItem(penalty, workspace, undefined, false, label);
  }

  private static pushAnonymousParagraphItem(
    item: InputItem,
    workspace: LayoutWorkspace,
    label?: string,
  ) {
    this.pushParagraphItem(item, workspace, undefined, true, label);
  }

  private static pushParagraphItem(
    item: InputItem,
    workspace: LayoutWorkspace,
    ownerOverride?: ScoreElement | null,
    anonymous = false,
    label?: string,
  ) {
    workspace.pendingParagraph.push(item);
    this.recordDiagnosticItem(workspace, item, ownerOverride, anonymous, label);
  }

  private static recordDiagnosticItem(
    workspace: LayoutWorkspace,
    item: InputItem,
    ownerOverride?: ScoreElement | null,
    anonymous = false,
    label?: string,
  ) {
    const diagnostics = workspace.diagnostics;

    if (diagnostics == null) {
      return;
    }

    const owner =
      ownerOverride === undefined ? diagnostics.currentOwner : ownerOverride;

    const diagnosticItem: LayoutDiagnosticItem = {
      anonymous,
      ownerElementId: owner?.id ?? null,
      ownerElementIndex: owner?.index ?? null,
      ownerElementType: owner?.elementType ?? null,
      type: item.type,
      width: item.width,
      label,
    };

    if (item.type === 'glue') {
      diagnosticItem.stretch = item.stretch;
      diagnosticItem.shrink = item.shrink;
    } else if (item.type === 'penalty') {
      diagnosticItem.cost = item.cost;
      diagnosticItem.flagged = item.flagged;
      diagnosticItem.forcedBreak = item.cost <= -MAX_COST;
      diagnosticItem.infinitePenalty = item.cost >= MAX_COST;
    }

    diagnostics.items.push(diagnosticItem);
  }

  private static computeLineDiagnostics(
    items: InputItem[],
    diagnosticItems: LayoutDiagnosticItem[],
    lineLengths: number | number[],
    breakpoints: number[],
    ratios: number[],
    paragraphIndex: number,
    positions: PositionedItem[],
  ): LineLayoutDiagnostics[] {
    const lines: LineLayoutDiagnostics[] = [];

    for (let lineIndex = 0; lineIndex < breakpoints.length - 1; lineIndex++) {
      const breakpoint = breakpoints[lineIndex + 1];
      const previousBreakpoint =
        lineIndex === 0 ? PARAGRAPH_START : breakpoints[lineIndex];
      const contentStart = lineContentStart(
        items,
        previousBreakpoint,
        breakpoint,
      );
      const targetWidth = Array.isArray(lineLengths)
        ? lineLengths[lineIndex]
        : lineLengths;
      const adjustmentRatio = ratios[lineIndex] ?? 0;

      let naturalContentWidth = 0;
      let totalStretch = 0;
      let totalShrink = 0;

      for (let itemIndex = contentStart; itemIndex <= breakpoint; itemIndex++) {
        const item = items[itemIndex];

        if (item.type === 'box') {
          naturalContentWidth += item.width;
        } else if (
          item.type === 'glue' &&
          itemIndex !== contentStart &&
          itemIndex !== breakpoint
        ) {
          naturalContentWidth += item.width;
          totalStretch += item.stretch;
          totalShrink += item.shrink;
        } else if (
          item.type === 'penalty' &&
          itemIndex === breakpoint &&
          item.width > 0
        ) {
          naturalContentWidth += item.width;
        }
      }

      const stretchUsed =
        adjustmentRatio > 0 ? adjustmentRatio * totalStretch : 0;
      const shrinkUsed =
        adjustmentRatio < 0 ? Math.abs(adjustmentRatio) * totalShrink : 0;

      const { anonymousBoxOverlays, glueOverlays, nonAnonymousBoxOverlays } =
        this.getOverlayDiagnosticsForLine(
          items,
          diagnosticItems,
          positions,
          contentStart,
          breakpoint,
          lineIndex,
        );

      lines.push({
        actualContentWidth: naturalContentWidth + stretchUsed - shrinkUsed,
        adjustmentRatio,
        anonymousBoxOverlays,
        glueOverlays,
        itemGroups: this.groupDiagnosticItems(
          diagnosticItems.slice(contentStart, breakpoint + 1),
        ),
        naturalContentWidth,
        nonAnonymousBoxOverlays,
        paragraphIndex,
        paragraphLineIndex: lineIndex,
        recomputedBadness: Number.isFinite(adjustmentRatio)
          ? 100 * Math.abs(adjustmentRatio) ** 3
          : null,
        shrinkUsed,
        stretchUsed,
        targetWidth,
      });
    }

    return lines;
  }

  private static getOverlayDiagnosticsForLine(
    items: InputItem[],
    diagnosticItems: LayoutDiagnosticItem[],
    positions: PositionedItem[],
    contentStart: number,
    breakpoint: number,
    lineIndex: number,
  ) {
    const positionsByItem = new Map<number, PositionedItem>();

    for (const position of positions) {
      if (position.line === lineIndex) {
        positionsByItem.set(position.item, position);
      }
    }

    const anonymousBoxOverlays: BoxOverlayDiagnostics[] = [];
    const nonAnonymousBoxOverlays: BoxOverlayDiagnostics[] = [];
    const glueOverlays: GlueOverlayDiagnostics[] = [];

    for (let itemIndex = contentStart; itemIndex <= breakpoint; itemIndex++) {
      const item = items[itemIndex];
      const diagnosticItem = diagnosticItems[itemIndex];
      const position = positionsByItem.get(itemIndex);

      if (position == null || diagnosticItem == null) {
        continue;
      }

      if (item.type === 'box' && diagnosticItem.type === 'box') {
        (diagnosticItem.anonymous
          ? anonymousBoxOverlays
          : nonAnonymousBoxOverlays
        ).push({
          anonymous: diagnosticItem.anonymous,
          label: diagnosticItem.label,
          left: position.xOffset,
          ownerElementId: diagnosticItem.ownerElementId,
          ownerElementIndex: diagnosticItem.ownerElementIndex,
          ownerElementType: diagnosticItem.ownerElementType,
          width: position.width,
        });
      } else if (item.type === 'glue' && diagnosticItem.type === 'glue') {
        glueOverlays.push({
          actualWidth: position.width,
          anonymous: diagnosticItem.anonymous,
          label: diagnosticItem.label,
          left: position.xOffset,
          ownerElementId: diagnosticItem.ownerElementId,
          ownerElementIndex: diagnosticItem.ownerElementIndex,
          ownerElementType: diagnosticItem.ownerElementType,
          preferredWidth: diagnosticItem.width,
          shrink: diagnosticItem.shrink ?? 0,
          stretch: diagnosticItem.stretch ?? 0,
        });
      }
    }

    return { anonymousBoxOverlays, glueOverlays, nonAnonymousBoxOverlays };
  }
  private static groupDiagnosticItems(items: LayoutDiagnosticItem[]) {
    const groups: LineLayoutDiagnostics['itemGroups'] = [];

    for (const item of items) {
      const previousGroup = groups[groups.length - 1];

      if (
        previousGroup != null &&
        previousGroup.ownerElementId === item.ownerElementId &&
        previousGroup.ownerElementIndex === item.ownerElementIndex &&
        previousGroup.ownerElementType === item.ownerElementType
      ) {
        previousGroup.anonymous = previousGroup.anonymous && item.anonymous;
        previousGroup.items.push(item);
        continue;
      }

      groups.push({
        anonymous: item.anonymous,
        items: [item],
        ownerElementId: item.ownerElementId,
        ownerElementIndex: item.ownerElementIndex,
        ownerElementType: item.ownerElementType,
      });
    }

    return groups;
  }

  private static getNoteOverlayAdvanceBox(
    noteElement: NoteElement,
    measureBarWidthMap: Map<MeasureBar, number>,
    height: number,
  ) {
    const left = this.getNoteLeftBarReserve(noteElement, measureBarWidthMap);
    const rightMeasureBarWidth = this.getVisibleMeasureBarRightWidth(
      noteElement,
      measureBarWidthMap,
    );

    return {
      height,
      left,
      top: 0,
      width: Math.max(0, noteElement.neumeWidth - left - rightMeasureBarWidth),
    };
  }

  private static getMartyriaOverlayAdvanceBox(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    height: number,
  ) {
    const left = this.hasInlineMeasureBarLeft(martyriaElement)
      ? (measureBarWidthMap.get(martyriaElement.measureBarLeft!) ?? 0) +
        martyriaElement.computedMeasureBarLeftLeadingSpacing
      : 0;
    const rightMeasureBarWidth = this.getVisibleMeasureBarRightWidth(
      martyriaElement,
      measureBarWidthMap,
    );

    return {
      height,
      left,
      top: pageSetup.martyriaVerticalOffset + martyriaElement.verticalOffset,
      width: Math.max(
        0,
        martyriaElement.neumeWidth - left - rightMeasureBarWidth,
      ),
    };
  }

  private static getVisibleMeasureBarRightWidth(
    owner: NoteElement | MartyriaElement,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const measureBarRight = this.getVisibleMeasureBarRight(owner);

    return measureBarRight == null
      ? 0
      : (measureBarWidthMap.get(measureBarRight) ?? 0);
  }

  private static getOverlayBoundsFromBoxes(
    boxes: Array<{ left: number; right: number; top: number; bottom: number }>,
  ) {
    if (boxes.length === 0) {
      return null;
    }

    const left = Math.min(...boxes.map((box) => box.left));
    const right = Math.max(...boxes.map((box) => box.right));
    const top = Math.min(...boxes.map((box) => box.top));
    const bottom = Math.max(...boxes.map((box) => box.bottom));

    return {
      height: bottom - top,
      left,
      top,
      width: right - left,
    };
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
    this.addGlue(preBreakGlue, workspace, 'pre-break');
    this.addPenalty(workspace, breakCost, breakWidth, 'break-penalty');
    this.addGlue(postBreakGlue, workspace, 'post-break');
  }

  private static shouldAlignLeft(
    noteElement: NoteElement,
    nextNoteElement: NoteElement | null,
  ): boolean {
    // At an eligible melisma start, align the syllable left when its effective
    // lyric span exceeds the adjusted neume span.
    // NOTE: a syllable ending with a hyphen is only considered a melismatic note
    // if the next note is purely melismatic (i.e. the next note contains only a hyphen),
    // despite the unfortunate property name "isMelisma" being true.

    return (
      noteElement.isMelismaStart &&
      noteElement.lyricsWidth -
        noteElement.lyricsLeadingPunctuationWidth -
        noteElement.lyricsTrailingPunctuationWidth >
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
      noteElement.computedMeasureBarLeftOffsetX = 0;
      noteElement.computedMeasureBarRightOffsetX = 0;
      noteElement.computedMeasureBarLeftLeadingSpacing = 0;
      noteElement.computedMeasureBarRightTrailingSpacing = 0;
      noteElement.showLeadingLyricHyphen = false;
      noteElement.leadingLyricHyphenOffset = 0;
      noteElement.leadingLyricHyphenReservationWidth = 0;

      noteElement.computedIsonOffsetY = noteElement.isonOffsetY;
      const resolvedLyricsStyle = this.getResolvedLyricsStyle(
        noteElement,
        noteWidthArgs.paragraphStyles,
      );
      noteElement.lyricsFontCss = resolveFontCss(resolvedLyricsStyle);
      noteElement.computedLyricsFontVariantCaps =
        resolvedLyricsStyle.fontVariantCaps ?? 'normal';
      noteElement.lyricsFontHeight = this.getLyricsFontHeightFromCache(
        noteElement.lyricsFontCss,
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

      this.applyPunctuationHorizontalOffset(noteElement, pageSetup);
    }
  }

  private static applyPunctuationHorizontalOffset(
    noteElement: NoteElement,
    pageSetup: PageSetup,
  ) {
    if (
      noteElement.lyrics.length === 0 ||
      !pageSetup.ignorePunctuationWhenPositioningLyrics
    ) {
      return;
    }

    noteElement.lyricsHorizontalOffset -=
      noteElement.lyricsLeadingPunctuationWidth;

    if (!noteElement.alignLeft) {
      noteElement.lyricsHorizontalOffset +=
        noteElement.lyricsTrailingPunctuationWidth;
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
      getHeaderForPage: (page: number, isChapterOpening?: boolean) => Header;
      getFooterForPage: (page: number, isChapterOpening?: boolean) => Footer;
      shouldShowHeaderRuleForPageIndex: (
        page: number,
        isChapterOpening?: boolean,
      ) => boolean;
      shouldShowFooterRuleOnPage: (
        page: number,
        isChapterOpening?: boolean,
      ) => boolean;
    },
    pageSetup: PageSetup,
    pageNumber: number,
    isChapterOpening: boolean,
  ): { extraHeaderHeightPx: number; extraFooterHeightPx: number } {
    let extraHeaderHeightPx = 0;
    let extraFooterHeightPx = 0;

    if (score.pageSetup.showHeader) {
      const header = score.getHeaderForPage(pageNumber, isChapterOpening);

      // Currently, headers and footers may only contain a single
      // text box.
      let headerHeightPx = (header.elements[0] as TextBoxElement).height;

      if (
        score.shouldShowHeaderRuleForPageIndex(pageNumber, isChapterOpening)
      ) {
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
      const footer = score.getFooterForPage(pageNumber, isChapterOpening);

      // Currently, headers and footers may only contain a single
      // text box.
      let footerHeightPx = (footer.elements[0] as TextBoxElement).height;

      if (score.shouldShowFooterRuleOnPage(pageNumber, isChapterOpening)) {
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
      // shouldAlignLeft selects eligible melisma starts that pass its
      // lyric-vs-neume width test. The lyric extends to the right under
      // subsequent melisma neumes, so rightProjection is 0: those neumes
      // provide the space. The melisma-to-non-melisma collision check handles
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

  private static getLyricTextLeft(noteElement: NoteElement) {
    return noteElement.alignLeft
      ? noteElement.lyricsHorizontalOffset
      : (noteElement.neumeWidth -
          noteElement.lyricsWidth +
          noteElement.lyricsHorizontalOffset) /
          2;
  }

  // The right edge of the rendered lyric text relative to the note box. In
  // RTL scores a positive lyricsHorizontalOffset moves the text the opposite
  // way, so its sign flips.
  private static getLyricTextRight(noteElement: NoteElement, rtl: boolean) {
    const lyricsHorizontalOffset = rtl
      ? -noteElement.lyricsHorizontalOffset
      : noteElement.lyricsHorizontalOffset;

    return noteElement.alignLeft
      ? lyricsHorizontalOffset + noteElement.lyricsWidth
      : (noteElement.neumeWidth +
          noteElement.lyricsWidth +
          lyricsHorizontalOffset) /
          2;
  }

  private static getLeadingLyricHyphenGeometry(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    hyphenWidth: number,
  ): LeadingLyricHyphenGeometry {
    const gap = pageSetup.lyricsMinimumSpacing;
    const rawLyricTextStartOffset = this.getLyricTextLeft(noteElement);

    const lyricTextStartOffset =
      noteElement.lyricsWidth === 0 ? 0 : rawLyricTextStartOffset;

    const hyphenOffset = lyricTextStartOffset - gap - hyphenWidth;
    const leftProjection = this.getLyricProjections(
      noteElement,
      noteElement.alignLeft,
    ).leftProjection;

    return {
      hyphenOffset,
      reservationWidth: Math.max(0, -(leftProjection + hyphenOffset)),
    };
  }

  public static mayShowLeadingLyricHyphen(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    greekMelismaIsActive: boolean = false,
  ): boolean {
    if (!noteElement.isHyphen) {
      return false;
    }

    if (pageSetup.disableGreekMelismata) {
      return true;
    }

    if (noteElement.isMelismaStart) {
      return !MelismaHelperGreek.isGreek(noteElement.lyrics);
    }

    if (noteElement.isMelisma && greekMelismaIsActive) {
      return false;
    }

    return (
      !MelismaHelperGreek.isGreek(noteElement.lyrics) &&
      !MelismaHelperGreek.isGreek(noteElement.melismaText)
    );
  }

  private static getGreekMelismaIsActiveAfterNote(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    greekMelismaIsActive: boolean,
  ) {
    if (pageSetup.disableGreekMelismata) {
      return false;
    }

    if (noteElement.isMelismaStart) {
      return MelismaHelperGreek.isGreek(noteElement.lyrics);
    }

    return noteElement.isMelisma && greekMelismaIsActive;
  }

  private static preventBreak(workspace: LayoutWorkspace) {
    this.addPenalty(workspace, MAX_COST, 0, 'prevent-break');
  }

  private static resolvePreferredInterNoteSpacing(
    naturalWidth: number,
    preferredMinimumWidths: Array<number | null>,
  ) {
    const preferredWidths = preferredMinimumWidths.filter(
      (width): width is number => width != null,
    );
    const preferredMinimumWidth =
      preferredWidths.length > 0 ? Math.max(...preferredWidths) : null;

    return Math.max(
      naturalWidth,
      preferredMinimumWidth ?? Number.NEGATIVE_INFINITY,
    );
  }

  private static calculateInterNoteSpacing(
    noteElement: NoteElement,
    rightProjection: number,
    nextElement: ScoreElement | null,
    nextNoteElement: NoteElement | null,
    workspace: LayoutWorkspace,
    minimumLyricGap: number,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    // Base m_i without the lyric-collision term ell_i. Can be
    // negative when T_i^left is large, i.e. when the cancellation
    // glue absorbs much of L_{i+1}. The library supports negative
    // glue widths.
    if (nextNoteElement == null) {
      const baseWidth =
        this.getInlineSpacing(workspace.pageSetup) + rightProjection;

      if (nextElement?.elementType === ElementType.Empty) {
        const terminalMeasureBarMinimum =
          this.getTerminalMeasureBarRightSpacing(
            noteElement,
            workspace.pageSetup,
            measureBarWidthMap,
          );

        return this.resolvePreferredInterNoteSpacing(baseWidth, [
          terminalMeasureBarMinimum,
        ]);
      }

      if (!this.shouldUseMeasureBarMinimumForNonNoteSpacing(nextElement)) {
        return baseWidth;
      }

      const measureBarMinimum = this.getMeasureBarMinimumGlueWidth(
        noteElement,
        nextElement,
        workspace.pageSetup,
        measureBarWidthMap,
      );
      return this.resolvePreferredInterNoteSpacing(baseWidth, [
        measureBarMinimum,
      ]);
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
    const exitsMelismaIntoCenteredLyric =
      workspace.melismaLyricsEndPx != null &&
      !noteElement.isHyphen &&
      !nextNoteElement.isMelisma &&
      !nextNoteElement.alignLeft &&
      leftProjection > 0;
    // On the same line, T_i^left absorbs whatever left projection the
    // next note actually has. At a break that width reappears via
    // glue(L_{i+1}).
    const leftTuck = leftProjection;
    const rightTuck = Math.min(rightProjection, nextOverhangs.left);
    const inlineSpacing = this.getInlineSpacing(workspace.pageSetup);
    const noteVisualMinimumWidth = this.getNoteVisualMinimumSpacing(
      noteElement,
      nextNoteElement,
      workspace.pageSetup,
      measureBarWidthMap,
      inlineSpacing,
    );
    // A zero visual minimum is the collision helper's generic lower clamp,
    // not a real geometry requirement when the user deliberately requests
    // negative spacing.
    const hasOnlyGenericVisualClamp =
      inlineSpacing < 0 && noteVisualMinimumWidth <= 0;
    // The visual and measure-bar helpers below both measure the total
    // same-line distance between note boxes. m_i intentionally excludes
    // L_{i+1}, so subtract the tuck to convert those widths into m_i space,
    // or long lyrics on the next note can no longer tuck left.
    const visualMinimumWidth = hasOnlyGenericVisualClamp
      ? null
      : noteVisualMinimumWidth - leftTuck;
    const hasVisibleMeasureBar = this.hasVisibleMeasureBarAtBoundary(
      noteElement,
      nextNoteElement,
    );
    const measureBarMinimumWidth = hasVisibleMeasureBar
      ? this.getMeasureBarMinimumGlueWidth(
          noteElement,
          nextNoteElement,
          workspace.pageSetup,
          measureBarWidthMap,
        ) - leftTuck
      : null;
    const ordinaryBaseWidth =
      inlineSpacing + rightProjection - leftTuck - rightTuck;

    // When a carried melisma ends at a centered lyric, align that lyric's
    // left edge with the current cursor. The current cursor is already after
    // noteElement.spaceAfter, so user-defined extra spacing is preserved.
    const baseWidth = exitsMelismaIntoCenteredLyric ? 0 : ordinaryBaseWidth;

    // Lyric collision check: the visual gap between lyrics on the
    // same line includes the neume overhangs (room inside the neume
    // that the lyric doesn't occupy). Only add spacing when the
    // lyrics would actually be too close. For hyphenated melismas,
    // this same visual gap is also where the hyphen is drawn, so in
    // the absorbed-hyphen case it must reserve the hyphen width plus
    // the ordinary lyricsMinimumSpacing.
    //
    // Also handles melisma transitions by measuring the carried lyric's
    // signed distance from the current cursor.
    let lyricMinimumWidth: number | null = null;
    if (nextNoteElement.lyricsWidth > 0 && noteElement.lyricsWidth > 0) {
      lyricMinimumWidth =
        minimumLyricGap -
        currentOverhangs.right -
        nextOverhangs.left +
        rightProjection;
    }

    const melismaMinimumWidth =
      nextNoteElement.lyricsWidth > 0
        ? this.getMelismaMinimumSpacing(
            workspace,
            nextNoteElement,
            nextOverhangs.left,
          )
        : null;

    return this.resolvePreferredInterNoteSpacing(baseWidth, [
      visualMinimumWidth,
      measureBarMinimumWidth,
      lyricMinimumWidth,
      melismaMinimumWidth,
    ]);
  }

  private static shouldUseMeasureBarMinimumForNonNoteSpacing(
    element: ScoreElement | null,
  ) {
    return (
      element != null &&
      this.isMeasureBarAnchorElement(element) &&
      !this.isMeasureBarOwner(element)
    );
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

  private static getMelismaMinimumSpacing(
    workspace: LayoutWorkspace,
    nextNoteElement: NoteElement,
    nextLeftOverhang: number,
  ) {
    if (
      workspace.melismaLyricsEndPx == null ||
      (nextNoteElement.isMelisma && !nextNoteElement.isMelismaStart)
    ) {
      return null;
    }

    // Signed distance from the current cursor to the carried melisma lyric's
    // right edge. The gap formula is valid whether that edge is before or
    // after the cursor.
    const carriedLyricEndFromCursor =
      workspace.melismaLyricsEndPx - workspace.neumesEndPx;

    // T_i^left and L_{i+1} cancel, so the same-line gap is independent
    // of the next note's left projection.
    return (
      workspace.pageSetup.lyricsMinimumSpacing -
      nextLeftOverhang +
      carriedLyricEndFromCursor
    );
  }

  private static getNoteVisualMinimumSpacing(
    left: NoteElement,
    right: NoteElement | null,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    clearance: number,
  ) {
    if (right == null) {
      return 0;
    }

    const leftBoxes = this.getNoteCollisionGlyphBoxes(
      left,
      pageSetup,
      measureBarWidthMap,
    );
    const rightBoxes = this.getNoteCollisionGlyphBoxes(
      right,
      pageSetup,
      measureBarWidthMap,
    );

    return this.getMinimumSpacingForNoteGlyphBoxes(
      this.getNoteBoxAdvance(left),
      leftBoxes,
      rightBoxes,
      clearance,
    );
  }

  private static getNoteBoxAdvance(noteElement: NoteElement) {
    return noteElement.neumeWidth + noteElement.spaceAfter;
  }

  private static getMartyriaBoxAdvance(martyriaElement: MartyriaElement) {
    return (
      martyriaElement.neumeWidth +
      martyriaElement.computedMeasureBarLeftLeadingSpacing +
      martyriaElement.padding +
      martyriaElement.spaceAfter
    );
  }

  private static getMinimumSpacingForNoteGlyphBoxes(
    leftAdvanceWidth: number,
    leftBoxes: NoteGlyphBox[],
    rightBoxes: NoteGlyphBox[],
    clearance: number,
    verticalTolerance = 0,
  ) {
    let spacing = 0;

    for (const leftBox of leftBoxes) {
      for (const rightBox of rightBoxes) {
        if (
          !this.noteGlyphBoxesVerticallyOverlapWithTolerance(
            leftBox,
            rightBox,
            verticalTolerance,
          )
        ) {
          continue;
        }

        spacing = Math.max(
          spacing,
          leftBox.right + clearance - leftAdvanceWidth - rightBox.left,
        );
      }
    }

    return Math.max(0, spacing);
  }

  private static noteGlyphBoxesVerticallyOverlap(
    left: NoteGlyphBox,
    right: NoteGlyphBox,
  ) {
    return left.top < right.bottom && right.top < left.bottom;
  }

  private static noteGlyphBoxesOverlap(
    left: NoteGlyphBox,
    right: NoteGlyphBox,
  ) {
    return (
      left.left < right.right &&
      right.left < left.right &&
      this.noteGlyphBoxesVerticallyOverlap(left, right)
    );
  }

  private static getNoteCollisionGlyphBoxes(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    leftBarReserveOverride: number | null = null,
  ) {
    const fontFamily = pageSetup.neumeDefaultFontFamily;
    const fontSize = pageSetup.neumeDefaultFontSize;
    const glyphs = this.getNoteCollisionGlyphs(
      noteElement,
      pageSetup,
      measureBarWidthMap,
      leftBarReserveOverride,
    );
    const resolvedGlyphNames = fontService.resolveContextualSubstitutions(
      fontFamily,
      glyphs.map((glyph) => glyph.glyphName),
    );

    const baseIndex = glyphs.findIndex((glyph) => glyph.kind === 'base');
    const baseGlyphName = resolvedGlyphNames[baseIndex];

    return glyphs.flatMap((glyph, index) => {
      const glyphName = resolvedGlyphNames[index];
      let x = glyph.x;
      let y = glyph.y;

      if (glyph.kind === 'mark') {
        const anchorOffset = fontService.getMarkOffset(
          fontFamily,
          baseGlyphName,
          glyphName,
        );

        x += anchorOffset.x * fontSize + this.emToPx(glyph.offsetX, fontSize);
        y += anchorOffset.y * fontSize + this.emToPx(glyph.offsetY, fontSize);
      }

      return this.getGlyphCollisionBoxes(
        fontFamily,
        glyphName,
        x,
        y,
        fontSize,
      ).map((box) => ({ ...box, collisionKind: glyph.kind }));
    });
  }

  private static getNoteCollisionGlyphs(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    leftBarReserveOverride: number | null = null,
  ): NoteCollisionGlyph[] {
    const glyphs: NoteCollisionGlyph[] = [];
    const fontSize = pageSetup.neumeDefaultFontSize;
    const leftBarReserve = this.getNoteLeftBarReserve(
      noteElement,
      measureBarWidthMap,
      leftBarReserveOverride,
    );
    const bodyLeft =
      leftBarReserve +
      (!pageSetup.melkiteRtl
        ? this.getVareiaPrefixWidth(noteElement, pageSetup)
        : 0);

    if (noteElement.vareia && !pageSetup.melkiteRtl) {
      glyphs.push(
        this.getVareiaCollisionGlyph(noteElement, leftBarReserve, fontSize),
      );
    }

    glyphs.push({
      glyphName: NeumeMappingService.getMapping(noteElement.quantitativeNeume)
        .glyphName,
      kind: 'base',
      x: bodyLeft,
      y: 0,
    });

    for (const mark of this.getNoteCollisionMarks(noteElement)) {
      glyphs.push({
        glyphName: NeumeMappingService.getMapping(mark.neume).glyphName,
        kind: 'mark',
        x: bodyLeft,
        y: 0,
        offsetX: mark.offsetX,
        offsetY: mark.offsetY,
      });
    }

    if (noteElement.vareia && pageSetup.melkiteRtl) {
      glyphs.push(
        this.getVareiaCollisionGlyph(
          noteElement,
          this.getRtlVareiaX(noteElement, bodyLeft, pageSetup),
          fontSize,
        ),
      );
    }

    return glyphs;
  }

  // In Melkite RTL layout the vareia renders after the note body instead of
  // prefixing it.
  private static getRtlVareiaX(
    noteElement: NoteElement,
    bodyLeft: number,
    pageSetup: PageSetup,
  ) {
    const bodyWidth = this.getNeumeSequenceWidthFromCache(
      this.getNoteNeumesForMeasurement(noteElement),
      pageSetup,
    );

    return bodyLeft + bodyWidth + noteElement.vareiaInternalSpacing;
  }

  private static getVareiaCollisionGlyph(
    noteElement: NoteElement,
    x: number,
    fontSize: number,
  ): NoteCollisionGlyph {
    return {
      glyphName: NeumeMappingService.getMapping(VocalExpressionNeume.Vareia)
        .glyphName,
      kind: 'inline',
      x: x + this.emToPx(noteElement.vareiaOffsetX, fontSize),
      y: this.emToPx(noteElement.vareiaOffsetY, fontSize),
    };
  }

  private static getVareiaCollisionBoxes(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    leftBarReserveOverride: number | null = null,
  ) {
    if (!noteElement.vareia) {
      return [];
    }

    const fontFamily = pageSetup.neumeDefaultFontFamily;
    const fontSize = pageSetup.neumeDefaultFontSize;
    const leftBarReserve = this.getNoteLeftBarReserve(
      noteElement,
      measureBarWidthMap,
      leftBarReserveOverride,
    );
    const vareiaLeft = pageSetup.melkiteRtl
      ? this.getRtlVareiaX(noteElement, leftBarReserve, pageSetup)
      : leftBarReserve;

    const glyph = this.getVareiaCollisionGlyph(
      noteElement,
      vareiaLeft,
      fontSize,
    );

    return this.getGlyphCollisionBoxes(
      fontFamily,
      glyph.glyphName,
      glyph.x,
      glyph.y,
      fontSize,
    );
  }

  private static getNoteLeftBarReserve(
    noteElement: NoteElement,
    measureBarWidthMap: Map<MeasureBar, number>,
    reserveOverride: number | null = null,
  ) {
    if (reserveOverride != null) {
      return reserveOverride;
    }

    const measureBarLeft = this.getVisibleMeasureBarLeft(noteElement);

    if (measureBarLeft == null) {
      return 0;
    }

    return (
      (measureBarWidthMap.get(measureBarLeft) ?? 0) +
      noteElement.computedMeasureBarLeftLeadingSpacing
    );
  }

  private static getNoteCollisionMarks(noteElement: NoteElement) {
    const marks: Array<{
      neume: Neume;
      offsetX?: number | null;
      offsetY?: number | null;
    }> = [];

    const add = (
      neume: Neume | null | undefined,
      offsetX?: number | null,
      offsetY?: number | null,
    ) => {
      if (neume != null && !isTieNeume(neume)) {
        marks.push({ neume, offsetX, offsetY });
      }
    };

    for (const slot of noteMarkSlots) {
      add(
        slot.neume(noteElement),
        slot.offsetX(noteElement),
        slot.offsetY(noteElement),
      );
    }

    const measureBarLeft =
      noteElement.measureBarLeft ?? noteElement.computedMeasureBarLeft;
    if (isMeasureBarAboveVariant(measureBarLeft)) {
      add(
        measureBarLeft,
        noteElement.measureBarLeftOffsetX,
        noteElement.measureBarLeftOffsetY,
      );
    }

    add(noteElement.tie, noteElement.tieOffsetX, noteElement.tieOffsetY);

    return marks;
  }

  private static getMartyriaCollisionGlyphBoxes(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    const fontFamily = pageSetup.neumeDefaultFontFamily;
    const fontSize = pageSetup.neumeDefaultFontSize;
    const verticalOffset =
      pageSetup.martyriaVerticalOffset + martyriaElement.verticalOffset;
    const glyphs = this.getMartyriaCollisionGlyphs(martyriaElement, pageSetup);

    return glyphs.flatMap((glyph) =>
      this.getGlyphCollisionBoxes(
        fontFamily,
        glyph.glyphName,
        glyph.x,
        glyph.y + verticalOffset,
        fontSize,
      ),
    );
  }

  private static getMartyriaCollisionGlyphs(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ): NoteCollisionGlyph[] {
    const glyphs: NoteCollisionGlyph[] = [];
    const fontFamily = pageSetup.neumeDefaultFontFamily;
    const fontSize = pageSetup.neumeDefaultFontSize;
    let x = 0;

    if (this.hasInlineMeasureBarLeft(martyriaElement)) {
      x += this.getNeumeWidthFromCache(
        martyriaElement.measureBarLeft!,
        pageSetup,
      );
      x += martyriaElement.computedMeasureBarLeftLeadingSpacing;
    }

    if (martyriaElement.tempoLeft) {
      glyphs.push({
        glyphName: NeumeMappingService.getMapping(martyriaElement.tempoLeft)
          .glyphName,
        kind: 'inline',
        x: x + martyriaElement.computedTempoLeftOffsetX,
        y: 0,
      });
      x += this.getNeumeWidthFromCache(martyriaElement.tempoLeft, pageSetup);
      x += martyriaElement.tempoLeftSpacing;
    }

    const bodyNeumes =
      this.getMartyriaBodyNeumesForWidthMeasurement(martyriaElement);
    const bodyStartX = x;
    const noteGlyphName = NeumeMappingService.getMapping(
      bodyNeumes[0],
    ).glyphName;
    for (const neume of bodyNeumes) {
      glyphs.push({
        glyphName: NeumeMappingService.getMapping(neume).glyphName,
        kind: 'inline',
        x,
        y: 0,
      });
      x += this.getNeumeWidthFromCache(neume, pageSetup);
    }

    if (!martyriaElement.error) {
      const rootSignGlyphName = NeumeMappingService.getMapping(
        martyriaElement.rootSign,
      ).glyphName;
      const anchorOffset = fontService.getMarkOffset(
        fontFamily,
        noteGlyphName,
        rootSignGlyphName,
      );

      glyphs.push({
        glyphName: rootSignGlyphName,
        kind: 'mark',
        x: bodyStartX + anchorOffset.x * fontSize,
        y: anchorOffset.y * fontSize,
      });
    }

    if (!martyriaElement.error && martyriaElement.fthora != null) {
      const fthoraGlyphName = NeumeMappingService.getMapping(
        martyriaElement.fthora,
      ).glyphName;
      const anchorOffset = fontService.getMarkOffset(
        fontFamily,
        noteGlyphName,
        fthoraGlyphName,
      );

      glyphs.push({
        glyphName: fthoraGlyphName,
        kind: 'inline',
        x: bodyStartX + anchorOffset.x * fontSize,
        y: anchorOffset.y * fontSize,
      });
    }

    for (const neume of this.getMartyriaBodyOverlayNeumes(
      martyriaElement,
    ).filter(
      (neume) =>
        neume !== martyriaElement.rootSign && neume !== martyriaElement.fthora,
    )) {
      glyphs.push({
        glyphName: NeumeMappingService.getMapping(neume).glyphName,
        kind: 'inline',
        x,
        y: 0,
      });
    }

    if (martyriaElement.tempoRight) {
      x += martyriaElement.tempoRightSpacing;
      glyphs.push({
        glyphName: NeumeMappingService.getMapping(martyriaElement.tempoRight)
          .glyphName,
        kind: 'inline',
        x,
        y: 0,
      });
    }

    return glyphs;
  }

  private static getGlyphBox(
    fontFamily: string,
    glyphName: SbmuflGlyphName,
    x: number,
    y: number,
    fontSize: number,
  ): NoteGlyphBox {
    const bBox = fontService.getGlyphBBox(fontFamily, glyphName);

    return this.getGlyphBBoxBox(bBox, x, y, fontSize);
  }

  private static getGlyphCollisionBoxes(
    fontFamily: string,
    glyphName: SbmuflGlyphName,
    x: number,
    y: number,
    fontSize: number,
  ): NoteGlyphBox[] {
    const regionBoxes = fontService
      .getGlyphCollisionRegions(fontFamily, glyphName)
      .map((region) => this.getGlyphBBoxBox(region, x, y, fontSize));

    return regionBoxes.length > 0
      ? regionBoxes
      : [this.getGlyphBox(fontFamily, glyphName, x, y, fontSize)];
  }

  private static getGlyphBBoxBox(
    bBox: { bBoxNE: [number, number]; bBoxSW: [number, number] },
    x: number,
    y: number,
    fontSize: number,
  ): NoteGlyphBox {
    return {
      left: x + bBox.bBoxSW[0] * fontSize,
      right: x + bBox.bBoxNE[0] * fontSize,
      top: y - bBox.bBoxNE[1] * fontSize,
      bottom: y - bBox.bBoxSW[1] * fontSize,
    };
  }

  private static emToPx(value: number | null | undefined, fontSize: number) {
    return (value ?? 0) * fontSize;
  }

  private static getVisualGlueSpacing(
    left: ScoreElement | null,
    right: ScoreElement | null,
    baseGlueWidth: number,
    pageSetup: PageSetup,
  ) {
    if (!this.isVisualCollisionBoundaryElement(left)) {
      return { deficit: 0, requiredWidth: 0 };
    }

    if (!this.isVisualCollisionBoundaryElement(right)) {
      return { deficit: 0, requiredWidth: 0 };
    }

    const requiredWidth =
      this.getInlineSpacing(pageSetup) +
      this.getElementRightInkOverhang(left, pageSetup) +
      this.getElementLeftInkOverhang(right, pageSetup);

    return {
      deficit: Math.max(0, requiredWidth - baseGlueWidth),
      requiredWidth,
    };
  }

  private static getLineStartMartyriaShift(
    martyriaElement: MartyriaElement,
    lineStartOffset: number,
    pageSetup: PageSetup,
  ) {
    return Math.max(
      0,
      this.getMartyriaLeftInkOverhang(martyriaElement, pageSetup) -
        lineStartOffset,
    );
  }

  private static isVisualCollisionBoundaryElement(
    element: ScoreElement | null,
  ): element is NoteElement | MartyriaElement | TempoElement {
    return (
      element?.elementType === ElementType.Note ||
      element?.elementType === ElementType.Martyria ||
      element?.elementType === ElementType.Tempo
    );
  }

  private static getElementLeftInkOverhang(
    element: NoteElement | MartyriaElement | TempoElement,
    pageSetup: PageSetup,
  ) {
    if (element.elementType === ElementType.Note) {
      return this.getNoteLeftInkOverhang(element as NoteElement, pageSetup);
    }

    if (element.elementType === ElementType.Tempo) {
      return this.getSingleNeumeLeftInkOverhang(
        (element as TempoElement).neume,
        pageSetup,
      );
    }

    return this.getMartyriaLeftInkOverhang(
      element as MartyriaElement,
      pageSetup,
    );
  }

  private static getElementRightInkOverhang(
    element: NoteElement | MartyriaElement | TempoElement,
    pageSetup: PageSetup,
  ) {
    if (element.elementType === ElementType.Note) {
      return this.getNoteRightInkOverhang(element as NoteElement, pageSetup);
    }

    if (element.elementType === ElementType.Tempo) {
      const tempoElement = element as TempoElement;
      return this.getRightInkOverhangAfterSpace(
        this.getSingleNeumeRightInkOverhang(tempoElement.neume, pageSetup),
        tempoElement.spaceAfter,
      );
    }

    return this.getMartyriaRightInkOverhang(
      element as MartyriaElement,
      pageSetup,
    );
  }

  private static getMartyriaLeftInkOverhang(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    const measureBarLeftWidth = this.hasInlineMeasureBarLeft(martyriaElement)
      ? this.getNeumeWidthFromCache(martyriaElement.measureBarLeft!, pageSetup)
      : 0;
    const measureBarLeftOverhang = this.hasInlineMeasureBarLeft(martyriaElement)
      ? this.getSingleNeumeLeftInkOverhang(
          martyriaElement.measureBarLeft!,
          pageSetup,
        )
      : 0;
    const tempoLeftOverhang = martyriaElement.tempoLeft
      ? Math.max(
          0,
          this.getSingleNeumeLeftInkOverhang(
            martyriaElement.tempoLeft,
            pageSetup,
          ) -
            measureBarLeftWidth -
            martyriaElement.computedTempoLeftOffsetX,
        )
      : 0;

    if (this.hasInlineMeasureBarLeft(martyriaElement)) {
      return Math.max(measureBarLeftOverhang, tempoLeftOverhang);
    }

    if (martyriaElement.tempoLeft) {
      return tempoLeftOverhang;
    }

    return this.getMartyriaBodyInkOverhangs(martyriaElement, pageSetup).left;
  }

  private static getMartyriaRightInkOverhang(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    const trailingNeume = this.getMartyriaTrailingNeume(martyriaElement);
    const inkOverhang = trailingNeume
      ? this.getSingleNeumeRightInkOverhang(trailingNeume, pageSetup)
      : this.getMartyriaBodyInkOverhangs(martyriaElement, pageSetup).right;

    return this.getRightInkOverhangAfterSpace(
      inkOverhang,
      martyriaElement.spaceAfter,
    );
  }

  private static getRightInkOverhangAfterSpace(
    inkOverhang: number,
    spaceAfter: number,
  ) {
    return Math.max(0, inkOverhang - spaceAfter);
  }

  private static hasInlineMeasureBarLeft(martyriaElement: MartyriaElement) {
    return (
      martyriaElement.measureBarLeft != null &&
      !isMeasureBarAboveVariant(martyriaElement.measureBarLeft)
    );
  }

  private static getMartyriaTrailingNeume(
    martyriaElement: MartyriaElement,
  ): Neume | null {
    if (martyriaElement.measureBarRight) {
      return martyriaElement.measureBarRight;
    }

    if (martyriaElement.tempoRight) {
      return martyriaElement.tempoRight;
    }

    if (martyriaElement.alignRight && martyriaElement.quantitativeNeume) {
      return martyriaElement.quantitativeNeume;
    }

    return null;
  }

  private static getBreakCost(
    noteElement: NoteElement,
    nextElement: ScoreElement | null,
    afterNextNoteElement: NoteElement | null,
  ) {
    // TODO handle digorgon/trigorgon

    // Penalties are additive. Combinations of softer penalties can saturate to
    // MAX_COST and become prohibited. The three weaker penalties can stack to
    // at most 0.45 * MAX_COST, which stays below the strongly discouraged
    // threshold. Outright prohibitions are resolved in getBreakConstraint; the
    // caller adds that constraint to this total and clamps the result to
    // MAX_COST.
    let breakCost = 0;

    if (nextElement?.elementType === ElementType.Note) {
      const nextNoteElement = nextElement as NoteElement;
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
        // Discourage a break before a configured beat-stealing quantitative
        // neume or supported quantitative-neume/time-mark combination. This
        // remains a weak penalty because such breaks are not uncommon in the
        // classical sources.
        breakCost += MAX_COST * 0.1;
      }
    }

    return breakCost;
  }

  private static getBreakPenaltyWidth(
    noteElement: NoteElement,
    rightProjection: number,
    workspace: LayoutWorkspace,
    nextElement: ScoreElement | null,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    let penaltyWidth = Math.max(
      rightProjection,
      this.getMelismaOverhang(workspace, workspace.neumesEndPx),
    );

    const measureBarRight = this.getVisibleMeasureBarRight(noteElement);
    if (measureBarRight != null) {
      penaltyWidth += this.getTerminalMeasureBarRightSpacingForMeasureBar(
        noteElement,
        measureBarRight,
        workspace.pageSetup,
        measureBarWidthMap,
      );
    }

    const transferredMeasureBarRight =
      this.getMeasureBarTransferredFromLineStart(nextElement);

    if (transferredMeasureBarRight != null) {
      penaltyWidth += measureBarWidthMap.get(transferredMeasureBarRight) ?? 0;
      if (measureBarRight == null) {
        penaltyWidth += this.getTerminalMeasureBarRightSpacingForMeasureBar(
          noteElement,
          transferredMeasureBarRight,
          workspace.pageSetup,
          measureBarWidthMap,
        );
      }
    }

    return penaltyWidth;
  }

  // The bar a martyria donates to the note that follows it at a line break:
  // an Above bar normalizes to its inline-left equivalent; otherwise the
  // martyria's right bar transfers.
  private static getMartyriaTransferBar(martyriaElement: MartyriaElement) {
    return isMeasureBarAboveVariant(martyriaElement.measureBarLeft)
      ? measureBarAboveToLeft.get(martyriaElement.measureBarLeft)
      : martyriaElement.measureBarRight;
  }

  private static getMeasureBarTransferredFromLineStart(
    element: ScoreElement | null,
  ) {
    if (element?.elementType === ElementType.Note) {
      const measureBarLeft = (element as NoteElement).measureBarLeft;

      return measureBarLeft != null && !isMeasureBarAboveVariant(measureBarLeft)
        ? measureBarLeft
        : null;
    }

    if (element?.elementType === ElementType.Martyria) {
      const measureBarLeft = (element as MartyriaElement).measureBarLeft;

      return isMeasureBarAboveVariant(measureBarLeft)
        ? (measureBarAboveToLeft.get(measureBarLeft) ?? null)
        : (measureBarLeft ?? null);
    }

    return null;
  }

  private static getTrailingElementReservations(
    workspace: LayoutWorkspace,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
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

      if (
        element.elementType !== ElementType.Note &&
        element.elementType !== ElementType.Martyria
      ) {
        return null;
      }

      if (element.elementType === ElementType.Martyria) {
        const martyriaElement = element as MartyriaElement;
        const terminalMeasureBarSpacing = this.getTerminalMartyriaRightSpacing(
          martyriaElement,
          workspace.pageSetup,
          measureBarWidthMap,
        );

        return {
          elementType: ElementType.Martyria,
          melismaOverhang: 0,
          terminalMeasureBarSpacing,
          finishingGlueWidth: terminalMeasureBarSpacing,
        };
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
      const terminalMeasureBarSpacing = this.getTerminalMeasureBarRightSpacing(
        noteElement,
        workspace.pageSetup,
        measureBarWidthMap,
      );

      return {
        elementType: ElementType.Note,
        melismaOverhang,
        terminalMeasureBarSpacing,
        finishingGlueWidth:
          Math.max(rightProjection, melismaOverhang) +
          terminalMeasureBarSpacing,
      };
    }

    return null;
  }

  private static getTrailingNoteReservations(
    workspace: LayoutWorkspace,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const reservations = this.getTrailingElementReservations(
      workspace,
      measureBarWidthMap,
    );

    return reservations?.elementType === ElementType.Note ? reservations : null;
  }

  // Remove trailing glue from the paragraph. Only strips consecutive trailing
  // glue items, such as the note's post-break glue, martyria spacing glue, or
  // the ordinary spacing left by other elements. The note's breakpoint penalty
  // is preserved; its trailing post-break glue, which now carries the stretch
  // and shrink budget, is among the glue removed.
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
      workspace.diagnostics?.items.pop();
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

  private static isNoteBox(
    item: InputItem,
  ): item is ElementBox & { element: NoteElement } {
    return (
      item.type === 'box' &&
      'element' in item &&
      (item as ElementBox).element.elementType === ElementType.Note
    );
  }

  private static isRuntPenaltyNote(
    noteElement: NoteElement,
    nextNoteElement: NoteElement | null,
  ) {
    return (
      restNeumes.includes(noteElement.quantitativeNeume) ||
      (this.isPartOfSameMelisma(noteElement) &&
        !this.isPartOfSameMelisma(nextNoteElement))
    );
  }

  /**
   * Penalizes breakpoints that would leave only one or two notes on the
   * paragraph's final line, walking the tail backwards until both candidate
   * breakpoints have been passed.
   *
   * At each candidate breakpoint exactly one note is tested: the note that
   * would begin the final line. It earns a penalty only when it is a rest or
   * the last continuation note of a melisma. Breakpoints that are already
   * prohibited (cost >= MAX_COST) are left untouched.
   *
   * Only breakpoints that immediately follow a note box are considered, so the
   * free breakpoint after a martyria is out of scope even though it can strand
   * a tail of its own.
   *
   * Only note boxes count toward the tail. Every other box is transparent to
   * this rule, including a terminal right-aligned martyria, which is visually
   * the last element but is not part of the short musical tail being measured.
   *
   * @param items The paragraph's items, mutated in place.
   * @param diagnosticItems The parallel diagnostics mirror, or null when
   *   diagnostics are not being collected.
   */
  public static applyRuntPenalty(
    items: InputItem[],
    diagnosticItems: LayoutDiagnosticItem[] | null,
  ) {
    let tailNoteCount = 0;
    let tailNote: NoteElement | null = null;
    let nextTailNote: NoteElement | null = null;

    for (let i = items.length - 1; i >= 1; i--) {
      const item = items[i];

      if (this.isNoteBox(item)) {
        tailNoteCount++;

        if (tailNoteCount > 2) {
          return;
        }

        nextTailNote = tailNote;
        tailNote = item.element;
        continue;
      }

      if (
        tailNote == null ||
        item.type !== 'penalty' ||
        item.cost >= MAX_COST ||
        !this.isNoteBox(items[i - 1]) ||
        !this.isRuntPenaltyNote(tailNote, nextTailNote)
      ) {
        continue;
      }

      // Discourage a short tail with a flat penalty, weighted like the melisma
      // penalties in getBreakCost. This deliberately stacks with those rules
      // when the tail is a melisma tail: they describe the shape of the
      // melisma, this one describes the shape of the final line.
      //
      // The total is capped at 0.95 * MAX_COST, the worst cost getBreakCost
      // can assign to a breakpoint that is still a legal break: one strong
      // penalty (0.5) plus all three weaker ones (0.45). That keeps the break
      // a preference rather than a prohibition, keeps the result inside the
      // range the break rules themselves use, and keeps it monotone in the
      // base cost, so an intrinsically worse breakpoint never ends up cheaper.
      if (item.cost < MAX_COST * 0.95) {
        item.cost = Math.min(item.cost + MAX_COST * 0.15, MAX_COST * 0.95);
      }

      if (diagnosticItems != null) {
        // The only penalty that can immediately follow a note box is the
        // unlabeled break opportunity pushed after the neume, so there is no
        // existing label to preserve here.
        const diagnosticItem = diagnosticItems[i];
        diagnosticItem.cost = item.cost;
        diagnosticItem.label = `runt-${tailNoteCount}-note`;
      }
    }
  }

  private static endParagraph(
    justifyLastLine: boolean,
    workspace: LayoutWorkspace,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const { pageSetup, pendingParagraph, completedParagraphs } = workspace;

    if (pendingParagraph.length === 0) {
      throw new Error('Cannot end an empty paragraph');
    }

    // If the paragraph ends immediately after a note or martyria, the trailing
    // glue can contain the element's right-edge reservation. removeGlue strips
    // it, so materialize the reservation into the finishing glue width instead.
    const trailingElementReservations = this.getTrailingElementReservations(
      workspace,
      measureBarWidthMap,
    );
    const finishingGlueWidth = trailingElementReservations
      ? trailingElementReservations.finishingGlueWidth
      : 0;

    // Remove the existing glue so that we can apply finishing glue
    this.removeGlue(workspace);

    // Prevent break before finishing glue
    this.preventBreak(workspace);

    // Apply finishing glue. The width reserves space for the last trailing
    // element's right-edge lyric extent, when applicable, and any terminal
    // barline clearance. The stretch absorbs remaining line slack (0 for
    // justified paragraphs, `MAX_COST` otherwise).
    const finishingGlueStretch = justifyLastLine ? 0 : MAX_COST;
    this.addGlue(
      {
        type: 'glue',
        width: finishingGlueWidth,
        stretch: finishingGlueStretch,
        shrink: 0,
      },
      workspace,
      'finishing',
    );

    // Force break and end paragraph
    this.forceBreak(workspace);

    // Discourage breakpoints that leave a one- or two-note final line.
    this.applyRuntPenalty(
      pendingParagraph,
      workspace.diagnostics?.items ?? null,
    );

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

    // Run the ratio-capped optimal line breaker.
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
    const diagnosticPositions =
      workspace.diagnostics != null
        ? positionItems(pendingParagraph, lineLengths, breakpoints, {
            includeGlue: true,
          })
        : null;
    if (workspace.loggingEnabled) {
      console.log('Positions', positions);
      console.log('Adjustment ratios', ratios);
    }

    completedParagraphs.push({
      diagnostics:
        workspace.diagnostics != null
          ? this.computeLineDiagnostics(
              pendingParagraph,
              workspace.diagnostics.items,
              lineLengths,
              breakpoints,
              ratios,
              completedParagraphs.length,
              diagnosticPositions ?? positions,
            )
          : null,
      paragraph: pendingParagraph,
      positions,
      ratios,
      dropCapWidthPx: workspace.pendingDropCapWidthPx,
      dropCapContinuationLines: workspace.pendingDropCapContinuationLines,
    });

    // Reset state
    workspace.pendingParagraph = [];
    workspace.neumesEndPx = 0;
    workspace.lyricsEndPx = LayoutService.getInitialLyricsEndPx(pageSetup);
    workspace.melismaLyricsEndPx = null;
    workspace.pendingDropCapWidthPx = 0;
    workspace.pendingDropCapContinuationLines = 0;
    workspace.pendingMartyriaBarTransferWidth = 0;
    workspace.pendingLeadingLyricHyphenReservationWidth = 0;
    if (workspace.diagnostics != null) {
      workspace.diagnostics.items = [];
      workspace.diagnostics.currentOwner = null;
    }
  }

  private static forceBreak(workspace: LayoutWorkspace) {
    this.pushAnonymousParagraphItem(forcedBreak(), workspace, 'forced-break');
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

  private static processHeaderFooter(
    container: Header | Footer,
    pageSetup: PageSetup,
    neumeHeight: number,
    paragraphStyles: ParagraphStyle[],
    defaultLyricsFontCss: string,
  ) {
    // Currently headers and footers may only contain a single text box.
    // It may be a rich textbox, but we don't need to do any
    // processing in that case.
    if (
      container.elements.length > 0 &&
      container.elements[0].elementType === ElementType.TextBox
    ) {
      const element = container.elements[0] as TextBoxElement;

      element.width = this.processTextBoxElement(
        element,
        pageSetup,
        neumeHeight,
        paragraphStyles,
        defaultLyricsFontCss,
      );
    } else if (
      container.elements.length > 0 &&
      container.elements[0].elementType === ElementType.RichTextBox
    ) {
      const element = container.elements[0] as RichTextBoxElement;
      element.width = pageSetup.innerPageWidth;
    }
  }

  // The computed text style fields shared by text boxes and drop caps.
  // Per-type computed fields (underline, alignment, line height, line span)
  // stay at the call sites.
  private static applyComputedTextStyle(
    element: TextBoxElement | DropCapElement,
    resolvedStyle: ResolvedParagraphStyle,
    resolvedFont: ResolvedFontStyle,
  ) {
    element.computedFontFamily = resolvedFont.cssFontFamily;
    element.computedFontSize = resolvedStyle.fontSize;
    element.computedColor = resolvedStyle.color;
    element.computedStrokeWidth = resolvedStyle.strokeWidth;
    element.computedStrokeColor = resolvedStyle.strokeColor;
    element.computedFontWeight = resolvedFont.cssFontWeight;
    element.computedFontStyle = resolvedFont.cssFontStyle;
    element.computedFontVariantCaps = resolvedStyle.fontVariantCaps ?? 'normal';
    element.computedFontVariantNumeric =
      resolvedStyle.fontVariantNumeric ?? 'normal';
    element.computedFontVariantLigatures =
      resolvedStyle.fontVariantLigatures ?? 'normal';
    element.computedFontVariantAlternates =
      resolvedStyle.fontVariantAlternates ?? 'normal';
  }

  private static processTextBoxElement(
    textBoxElement: TextBoxElement,
    pageSetup: PageSetup,
    neumeHeight: number,
    paragraphStyles: ParagraphStyle[],
    defaultLyricsFontCss: string,
  ) {
    let elementWidthPx = 0;
    const resolvedParagraphStyle = resolveParagraphStyle(
      paragraphStyles,
      textBoxElement.paragraphStyleId,
      textBoxElement.getParagraphStyleOverrides(),
    );
    const resolvedTextBoxFont = resolveFontStyle(
      resolvedParagraphStyle.fontFamily,
      resolvedParagraphStyle.fontStyle,
    );

    this.applyComputedTextStyle(
      textBoxElement,
      resolvedParagraphStyle,
      resolvedTextBoxFont,
    );
    textBoxElement.computedUnderline =
      resolvedParagraphStyle.textDecoration === 'underline';
    textBoxElement.computedAlignment = resolvedParagraphStyle.alignment;

    const contentPreview = this.textBoxContentPreviews.get(textBoxElement);
    const content = contentPreview?.content ?? textBoxElement.content;
    const contentBottom =
      contentPreview?.contentBottom ?? textBoxElement.contentBottom;

    if (textBoxElement.inline) {
      if (textBoxElement.fillWidth) {
        // Width is computed in Phase 2 after line breaking. During Phase 1 we
        // use the textbox's intrinsic no-wrap width so the line breaker can
        // move it to the next line when the remaining space is too small.
        elementWidthPx = this.getFillWidthPlaceholderWidth(
          textBoxElement,
          defaultLyricsFontCss,
        );
      } else if (textBoxElement.customWidth != null) {
        elementWidthPx = textBoxElement.customWidth;
      } else {
        elementWidthPx = this.measureTextBoxIntrinsicWidth(
          textBoxElement,
          content,
          contentBottom,
        );
      }
    } else {
      elementWidthPx = pageSetup.innerPageWidth;

      textBoxElement.computedLineHeight = resolvedParagraphStyle.lineHeight;
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

  private static getResolvedLyricsStyle(
    noteElement: NoteElement,
    paragraphStyles: ParagraphStyle[],
  ) {
    return resolveParagraphStyle(
      paragraphStyles,
      noteElement.lyricsParagraphStyleId,
      noteElement.getParagraphStyleOverrides(),
    );
  }

  private static getDefaultLyricsFont(paragraphStyles: ParagraphStyle[]) {
    return resolveFontCss(
      resolveParagraphStyle(
        paragraphStyles,
        BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      ),
    );
  }

  private static saveElementState(element: ScoreElement) {
    // Save the current element state so we can determine which elements updated
    element.updated = false;

    element.widthPrevious = element.width;

    if (element.elementType === ElementType.Martyria) {
      const martyria = element as MartyriaElement;
      martyria.errorPrevious = martyria.error;
      martyria.notePrevious = martyria.note;
      martyria.rootSignPrevious = martyria.rootSign;
      martyria.computedTempoLeftOffsetXPrevious =
        martyria.computedTempoLeftOffsetX;
      martyria.tempoLeftSpacingPrevious = martyria.tempoLeftSpacing;
      martyria.tempoRightSpacingPrevious = martyria.tempoRightSpacing;
      martyria.computedMeasureBarLeftOffsetXPrevious =
        martyria.computedMeasureBarLeftOffsetX;
      martyria.computedMeasureBarRightOffsetXPrevious =
        martyria.computedMeasureBarRightOffsetX;
      martyria.computedMeasureBarLeftLeadingSpacingPrevious =
        martyria.computedMeasureBarLeftLeadingSpacing;
      martyria.computedMeasureBarRightTrailingSpacingPrevious =
        martyria.computedMeasureBarRightTrailingSpacing;
    } else if (element.elementType === ElementType.Note) {
      const note = element as NoteElement;
      note.fthoraPrevious = note.fthora;
      note.secondaryFthoraPrevious = note.secondaryFthora;
      note.tertiaryFthoraPrevious = note.tertiaryFthora;
      note.computedMeasureBarLeftPrevious = note.computedMeasureBarLeft;
      note.computedMeasureBarRightPrevious = note.computedMeasureBarRight;
      note.computedMeasureBarLeftOffsetXPrevious =
        note.computedMeasureBarLeftOffsetX;
      note.computedMeasureBarRightOffsetXPrevious =
        note.computedMeasureBarRightOffsetX;
      note.computedMeasureBarLeftLeadingSpacingPrevious =
        note.computedMeasureBarLeftLeadingSpacing;
      note.computedMeasureBarRightTrailingSpacingPrevious =
        note.computedMeasureBarRightTrailingSpacing;
      note.computedIsonOffsetYPrevious = note.computedIsonOffsetY;
      note.vareiaInternalSpacingPrevious = note.vareiaInternalSpacing;
    } else if (element.elementType === ElementType.TextBox) {
      const textbox = element as TextBoxElement;
      textbox.computedFontFamilyPrevious = textbox.computedFontFamily;
      textbox.computedFontSizePrevious = textbox.computedFontSize;
      textbox.computedFontWeightPrevious = textbox.computedFontWeight;
      textbox.computedFontStylePrevious = textbox.computedFontStyle;
      textbox.computedColorPrevious = textbox.computedColor;
      textbox.computedStrokeWidthPrevious = textbox.computedStrokeWidth;
      textbox.computedStrokeColorPrevious = textbox.computedStrokeColor;
      textbox.computedLineHeightPrevious = textbox.computedLineHeight;
      textbox.computedUnderlinePrevious = textbox.computedUnderline;
      textbox.computedAlignmentPrevious = textbox.computedAlignment;
      textbox.computedFontVariantCapsPrevious = textbox.computedFontVariantCaps;
      textbox.computedFontVariantNumericPrevious =
        textbox.computedFontVariantNumeric;
      textbox.computedFontVariantLigaturesPrevious =
        textbox.computedFontVariantLigatures;
      textbox.computedFontVariantAlternatesPrevious =
        textbox.computedFontVariantAlternates;
    } else if (element.elementType === ElementType.ModeKey) {
      const modeKey = element as ModeKeyElement;
      modeKey.computedFontFamilyPrevious = modeKey.computedFontFamily;
      modeKey.computedFontSizePrevious = modeKey.computedFontSize;
      modeKey.computedHeightAdjustmentPrevious =
        modeKey.computedHeightAdjustment;
      modeKey.computedColorPrevious = modeKey.computedColor;
      modeKey.computedStrokeWidthPrevious = modeKey.computedStrokeWidth;
      modeKey.ambitusHighNotePrevious = modeKey.ambitusHighNote;
      modeKey.ambitusHighRootSignPrevious = modeKey.ambitusHighRootSign;
      modeKey.ambitusLowNotePrevious = modeKey.ambitusLowNote;
      modeKey.ambitusLowRootSignPrevious = modeKey.ambitusLowRootSign;
    } else if (element.elementType === ElementType.DropCap) {
      const dropCap = element as DropCapElement;
      dropCap.computedFontFamilyPrevious = dropCap.computedFontFamily;
      dropCap.computedFontSizePrevious = dropCap.computedFontSize;
      dropCap.computedFontWeightPrevious = dropCap.computedFontWeight;
      dropCap.computedFontStylePrevious = dropCap.computedFontStyle;
      dropCap.computedColorPrevious = dropCap.computedColor;
      dropCap.computedStrokeWidthPrevious = dropCap.computedStrokeWidth;
      dropCap.computedStrokeColorPrevious = dropCap.computedStrokeColor;
      dropCap.computedLineHeightPrevious = dropCap.computedLineHeight;
      dropCap.computedFontVariantCapsPrevious = dropCap.computedFontVariantCaps;
      dropCap.computedFontVariantNumericPrevious =
        dropCap.computedFontVariantNumeric;
      dropCap.computedFontVariantLigaturesPrevious =
        dropCap.computedFontVariantLigatures;
      dropCap.computedFontVariantAlternatesPrevious =
        dropCap.computedFontVariantAlternates;
    }
  }

  private static checkElementState(element: ScoreElement) {
    if (!element.updated && element.elementType === ElementType.Martyria) {
      const martyria = element as MartyriaElement;
      martyria.updated =
        martyria.errorPrevious !== martyria.error ||
        martyria.notePrevious !== martyria.note ||
        martyria.rootSignPrevious !== martyria.rootSign ||
        martyria.computedTempoLeftOffsetXPrevious !==
          martyria.computedTempoLeftOffsetX ||
        martyria.tempoLeftSpacingPrevious !== martyria.tempoLeftSpacing ||
        martyria.tempoRightSpacingPrevious !== martyria.tempoRightSpacing ||
        martyria.computedMeasureBarLeftOffsetXPrevious !==
          martyria.computedMeasureBarLeftOffsetX ||
        martyria.computedMeasureBarRightOffsetXPrevious !==
          martyria.computedMeasureBarRightOffsetX ||
        martyria.computedMeasureBarLeftLeadingSpacingPrevious !==
          martyria.computedMeasureBarLeftLeadingSpacing ||
        martyria.computedMeasureBarRightTrailingSpacingPrevious !==
          martyria.computedMeasureBarRightTrailingSpacing;
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
        note.computedMeasureBarLeftOffsetXPrevious !==
          note.computedMeasureBarLeftOffsetX ||
        note.computedMeasureBarRightOffsetXPrevious !==
          note.computedMeasureBarRightOffsetX ||
        note.computedMeasureBarLeftLeadingSpacingPrevious !==
          note.computedMeasureBarLeftLeadingSpacing ||
        note.computedMeasureBarRightTrailingSpacingPrevious !==
          note.computedMeasureBarRightTrailingSpacing ||
        note.computedIsonOffsetYPrevious !== note.computedIsonOffsetY ||
        note.vareiaInternalSpacingPrevious !== note.vareiaInternalSpacing;
    }

    if (!element.updated && element.elementType === ElementType.TextBox) {
      const textbox = element as TextBoxElement;
      const hasContentPreview = this.textBoxContentPreviews.has(textbox);

      textbox.updated =
        (!hasContentPreview && textbox.widthPrevious !== textbox.width) ||
        textbox.computedFontFamilyPrevious !== textbox.computedFontFamily ||
        textbox.computedFontSizePrevious !== textbox.computedFontSize ||
        textbox.computedFontWeightPrevious !== textbox.computedFontWeight ||
        textbox.computedFontStylePrevious !== textbox.computedFontStyle ||
        textbox.computedColorPrevious !== textbox.computedColor ||
        textbox.computedStrokeWidthPrevious !== textbox.computedStrokeWidth ||
        textbox.computedStrokeColorPrevious !== textbox.computedStrokeColor ||
        textbox.computedLineHeightPrevious !== textbox.computedLineHeight ||
        textbox.computedUnderlinePrevious !== textbox.computedUnderline ||
        textbox.computedAlignmentPrevious !== textbox.computedAlignment ||
        textbox.computedFontVariantCapsPrevious !==
          textbox.computedFontVariantCaps ||
        textbox.computedFontVariantNumericPrevious !==
          textbox.computedFontVariantNumeric ||
        textbox.computedFontVariantLigaturesPrevious !==
          textbox.computedFontVariantLigatures ||
        textbox.computedFontVariantAlternatesPrevious !==
          textbox.computedFontVariantAlternates;
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
        modeKey.computedStrokeWidthPrevious !== modeKey.computedStrokeWidth ||
        modeKey.ambitusHighNote !== modeKey.ambitusHighNotePrevious ||
        modeKey.ambitusHighRootSign !== modeKey.ambitusHighRootSignPrevious ||
        modeKey.ambitusLowNote !== modeKey.ambitusLowNotePrevious ||
        modeKey.ambitusLowRootSign !== modeKey.ambitusLowRootSignPrevious;
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
        dropCap.computedStrokeColorPrevious !== dropCap.computedStrokeColor ||
        dropCap.computedLineHeightPrevious !== dropCap.computedLineHeight ||
        dropCap.computedFontVariantCapsPrevious !==
          dropCap.computedFontVariantCaps ||
        dropCap.computedFontVariantNumericPrevious !==
          dropCap.computedFontVariantNumeric ||
        dropCap.computedFontVariantLigaturesPrevious !==
          dropCap.computedFontVariantLigatures ||
        dropCap.computedFontVariantAlternatesPrevious !==
          dropCap.computedFontVariantAlternates;
    }
  }

  public static getNoteWidth(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    args: GetNoteWidthArgs,
  ) {
    const { lyricsVerticalOffset, measureBarWidthMap } = args;

    noteElement.lyricsVerticalOffset = lyricsVerticalOffset;

    // Measure the full note run so the browser applies any contextual
    // substitutions before we use the width for layout.
    noteElement.neumeWidth = this.getNeumeSequenceWidthFromCache(
      this.getNoteNeumesForMeasurement(noteElement),
      pageSetup,
    );

    noteElement.lyricsHorizontalOffset = 0;
    noteElement.lyricsTrailingPunctuationWidth = 0;
    noteElement.lyricsLeadingPunctuationWidth = 0;

    if (noteElement.lyrics.length > 0) {
      noteElement.lyricsWidth = this.getTextWidthFromCache(noteElement);

      if (pageSetup.ignorePunctuationWhenPositioningLyrics) {
        // Adjust for leading punctuation
        noteElement.lyricsLeadingPunctuationWidth = this.getTextWidthFromCache(
          noteElement,
          null,
          true,
        );

        // Adjust for trailing punctuation
        noteElement.lyricsTrailingPunctuationWidth = this.getTextWidthFromCache(
          noteElement,
          null,
          false,
          true,
        );
      }
    } else {
      noteElement.lyricsWidth = 0;
    }

    // Handle special case for vareia: shift the lyrics toward the main neume
    // so that they remain centered beneath it.
    noteElement.vareiaInternalSpacing = 0;
    if (noteElement.vareia) {
      noteElement.vareiaInternalSpacing =
        pageSetup.neumeDefaultFontSize *
        fontService.getVareiaGap(pageSetup.neumeDefaultFontFamily);
      const vareiaPrefixWidth = this.getVareiaPrefixWidth(
        noteElement,
        pageSetup,
      );

      if (pageSetup.melkiteRtl) {
        noteElement.lyricsHorizontalOffset -= vareiaPrefixWidth;
      } else {
        noteElement.lyricsHorizontalOffset += vareiaPrefixWidth;
      }

      noteElement.neumeWidth += vareiaPrefixWidth;
    }

    // Handle special case for measure bars: adjust the lyric offset so that
    // the lyrics remain centered beneath the main neume.
    const measureBarLeft = noteElement.measureBarLeft;

    const measureBarLeftWidth =
      measureBarLeft != null ? measureBarWidthMap.get(measureBarLeft) : null;

    if (measureBarLeftWidth != null) {
      noteElement.computedMeasureBarLeftLeadingSpacing =
        this.getMeasureBarLeftLeadingSpacing(
          noteElement,
          pageSetup,
          measureBarWidthMap,
        );
      const reservedWidth =
        measureBarLeftWidth + noteElement.computedMeasureBarLeftLeadingSpacing;
      noteElement.lyricsHorizontalOffset += reservedWidth;
      noteElement.neumeWidth += reservedWidth;
    }

    const measureBarRight = noteElement.measureBarRight;

    const measureBarRightWidth =
      measureBarRight != null ? measureBarWidthMap.get(measureBarRight) : null;

    if (measureBarRightWidth != null) {
      noteElement.lyricsHorizontalOffset -= measureBarRightWidth;
      noteElement.neumeWidth += measureBarRightWidth;
    }

    // Handle special case for running elaphron: shift the lyrics toward the
    // elaphron so that they remain centered beneath it.
    if (noteElement.quantitativeNeume === QuantitativeNeume.RunningElaphron) {
      const offset = this.getRunningElaphronOffset(pageSetup);

      if (pageSetup.melkiteRtl) {
        noteElement.lyricsHorizontalOffset -= offset;
      } else {
        noteElement.lyricsHorizontalOffset += offset;
      }
    }

    return this.getNoteBoxAdvance(noteElement);
  }

  public static getMartyriaWidth(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    // The renderer applies padding as marginLeft on the quantitative neume in
    // NeumeBoxMartyria.vue, so only that case should keep fixed spacing inside
    // the box.
    martyriaElement.padding =
      martyriaElement.alignRight && martyriaElement.quantitativeNeume
        ? this.getInlineSpacing(pageSetup)
        : 0;
    martyriaElement.tempoLeftSpacing = martyriaElement.tempoLeft
      ? this.getInlineSpacing(pageSetup)
      : 0;
    martyriaElement.tempoRightSpacing = martyriaElement.tempoRight
      ? this.getInlineSpacing(pageSetup)
      : 0;
    if (martyriaElement.tempoRight) {
      martyriaElement.tempoRightSpacing +=
        this.getMartyriaTempoRightSpacingDeficit(martyriaElement, pageSetup);
    }
    martyriaElement.computedTempoLeftOffsetX = martyriaElement.tempoLeft
      ? -this.getMartyriaTempoLeftSpacingDeficit(martyriaElement, pageSetup)
      : 0;

    martyriaElement.neumeWidth = this.getNeumeWidthFromCache(
      !martyriaElement.error ? martyriaElement.note : Note.Pa,
      pageSetup,
    );

    if (martyriaElement.tempoLeft) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        martyriaElement.tempoLeft,
        pageSetup,
      );
      martyriaElement.neumeWidth += martyriaElement.tempoLeftSpacing;
    }

    if (martyriaElement.tempoRight) {
      martyriaElement.neumeWidth += martyriaElement.tempoRightSpacing;
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        martyriaElement.tempoRight,
        pageSetup,
      );
    }

    const hasInlineMeasureBarLeft =
      this.hasInlineMeasureBarLeft(martyriaElement);

    if (hasInlineMeasureBarLeft) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        martyriaElement.measureBarLeft!,
        pageSetup,
      );
    }

    martyriaElement.computedMeasureBarLeftLeadingSpacing =
      this.getMeasureBarBaseLeftLeadingSpacing(martyriaElement, pageSetup);

    if (martyriaElement.measureBarRight) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        martyriaElement.measureBarRight,
        pageSetup,
      );
    }

    if (martyriaElement.alignRight && martyriaElement.quantitativeNeume) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        martyriaElement.quantitativeNeume,
        pageSetup,
      );
    }

    return this.getMartyriaBoxAdvance(martyriaElement);
  }

  public static addMelismas(
    pages: Page[],
    pageSetup: PageSetup,
    defaultLyricsFontCss: string,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    // First calculate some constants

    const widthOfSpace = TextMeasurementService.getTextWidth(
      ' ',
      defaultLyricsFontCss,
    );

    const elaphronWidth = this.getNeumeWidthFromCache(
      QuantitativeNeume.Elaphron,
      pageSetup,
    );
    const runningElaphronOffset = this.getRunningElaphronOffset(pageSetup);

    let melismaSyllables: MelismaSyllables | null = null;
    let melismaLyricsEnd: number | null = null;
    let phase2GreekMelismaIsActive = false;
    let previousLineEndingMayShowLeadingLyricHyphen = false;

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];

      for (let lineIndex = 0; lineIndex < page.lines.length; lineIndex++) {
        const line = page.lines[lineIndex];

        melismaLyricsEnd = null;

        let firstElementOnNextLine: ScoreElement | null = null;

        if (
          lineIndex + 1 < page.lines.length &&
          page.lines[lineIndex + 1].elements.length > 0
        ) {
          firstElementOnNextLine = page.lines[lineIndex + 1].elements[0];
        } else if (
          pageIndex + 1 < pages.length &&
          pages[pageIndex + 1].lines.length > 0 &&
          pages[pageIndex + 1].lines[0].elements.length > 0
        ) {
          firstElementOnNextLine = pages[pageIndex + 1].lines[0].elements[0];
        }

        const indexOfFirstNote = line.elements.findIndex(
          (x) => x.elementType === ElementType.Note,
        );
        let lineEndingMayShowLeadingLyricHyphen = false;

        for (let index = 0; index < line.elements.length; index++) {
          const currentElement = line.elements[index];

          if (this.isBreakElement(currentElement)) {
            melismaSyllables = null;
            phase2GreekMelismaIsActive = false;
            previousLineEndingMayShowLeadingLyricHyphen = false;
            lineEndingMayShowLeadingLyricHyphen = false;
            continue;
          }

          if (currentElement.elementType !== ElementType.Note) {
            continue;
          }

          const element = currentElement as NoteElement;

          // We do not simply check for index === 0 because we also want
          // to include the case where the first letter of the melisma
          // is a drop cap at the beginning of the line
          const isIntermediateMelismaAtStartOfLine =
            index === indexOfFirstNote &&
            element.isMelisma &&
            !element.isMelismaStart;
          const mayShowLeadingLyricHyphen =
            LayoutService.mayShowLeadingLyricHyphen(
              element,
              pageSetup,
              phase2GreekMelismaIsActive,
            );

          // First, clear melisma fields, since
          // they may be stale
          element.melismaText = '';
          element.hyphenOffsets = [];
          element.showLeadingLyricHyphen = false;
          element.melismaWidth = 0;
          element.isFullMelisma = isIntermediateMelismaAtStartOfLine;

          if (
            index === indexOfFirstNote &&
            element.lyricsWidth > 0 &&
            previousLineEndingMayShowLeadingLyricHyphen
          ) {
            element.showLeadingLyricHyphen = true;
          }

          if (line.elements[line.elements.length - 1] === element) {
            lineEndingMayShowLeadingLyricHyphen = mayShowLeadingLyricHyphen;
          }

          phase2GreekMelismaIsActive =
            LayoutService.getGreekMelismaIsActiveAfterNote(
              element,
              pageSetup,
              phase2GreekMelismaIsActive,
            );

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
                  element,
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
            } else {
              // The melisma starts at the right edge of the rendered lyric
              // text regardless of whether the lyrics or the neume is wider.
              start =
                element.x +
                this.getLyricTextRight(element, pageSetup.melkiteRtl);
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
                      measureBarWidthMap,
                    );
                } else {
                  end = element.x + element.neumeWidth;
                }
              } else {
                // End at the next syllable's rendered text start.
                end =
                  nextNoteElement.x + this.getLyricTextLeft(nextNoteElement);
              }

              element.melismaWidth = Math.max(end - start, 0);

              const widthOfHyphenForThisElement = this.getTextWidthFromCache(
                element,
                '-',
              );

              const hyphenSpacing = Math.max(
                pageSetup.hyphenSpacing,
                widthOfHyphenForThisElement,
              );

              /*
               * Hyphens are laid out as a centered "comb" with fixed spacing P.
               *
               *   <------------------- total gap L ------------------->
               *
               *   |<- C ->|<------ P ------>|<------ P ------>|<- C ->|
               *   ------------------------------------------------------------
               *           -                 -                 -
               *           ^                 ^                 ^
               *       hyphen 0          hyphen 1          hyphen 2
               *
               * where:
               *   L = available width for the melisma
               *   P = center-to-center spacing between adjacent hyphens
               *   d = hyphen width
               *   C = minimum clearance from each end to the nearest hyphen
               *
               * The number of hyphens is:
               *
               *   n = floor((L - d - 2*C) / P) + 1
               *
               * The comb width is:
               *
               *   combWidth = (n - 1) * P + d
               *
               * The comb is then centered:
               *
               *   startOffset = (L - combWidth) / 2
               *
               * Hyphen i (0-based) is placed at:
               *
               *   offset_i = startOffset + i * P
               *
               * This guarantees:
               *   - Uniform interior spacing (P).
               *   - Equal end gaps.
               *   - End gaps are always >= C (assuming n was computed by the formula above).
               *   - A single hyphen (n = 1) is automatically centered.
               */

              let L = element.melismaWidth;
              const P = hyphenSpacing;
              const C = pageSetup.minimumSyllableToHyphenClearance;
              const d = widthOfHyphenForThisElement;

              const availableWidth = L - d - 2 * C;

              let numberOfHyphensNeeded =
                availableWidth < 0 ? 0 : Math.floor(availableWidth / P) + 1;

              // If this is the last note on the page, always show the hyphen
              if (numberOfHyphensNeeded == 0 && nextElement == null) {
                numberOfHyphensNeeded = 1;
                element.melismaWidth = Math.max(
                  element.melismaWidth,
                  widthOfHyphenForThisElement + widthOfSpace,
                );

                L = element.melismaWidth;
              }

              element.hyphenOffsets = [];

              if (
                numberOfHyphensNeeded == 0 &&
                element.melismaWidth >= widthOfHyphenForThisElement
              ) {
                numberOfHyphensNeeded = 1;
              }

              if (numberOfHyphensNeeded > 0) {
                const combWidth = (numberOfHyphensNeeded - 1) * P + d;
                const startOffset = (L - combWidth) / 2;

                for (let i = 0; i < numberOfHyphensNeeded; i++) {
                  element.hyphenOffsets.push(startOffset + i * P);
                }
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
                end = nextNoteElement.x + runningElaphronOffset;

                if (nextNoteElement.lyricsWidth > elaphronWidth) {
                  if (nextNoteElement.alignLeft) {
                    end = Math.min(
                      end,
                      nextNoteElement.x +
                        runningElaphronOffset -
                        pageSetup.lyricsMinimumSpacing,
                    );
                  } else {
                    end = Math.min(
                      end,
                      nextNoteElement.x +
                        runningElaphronOffset -
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
                      measureBarWidthMap,
                    );
                }

                // Clamp to the next syllable's rendered text start when that
                // text is left-aligned (selected by shouldAlignLeft) or
                // projects left of its neume.
                if (
                  nextNoteElement != null &&
                  (nextNoteElement.alignLeft ||
                    nextNoteElement.lyricsWidth > nextNoteElement.neumeWidth)
                ) {
                  end = Math.min(
                    end,
                    nextNoteElement.x +
                      this.getLyricTextLeft(nextNoteElement) -
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
                -this.getLyricsFontBoundingBoxDescentFromCache(element);
            } else {
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
                      measureBarWidthMap,
                    );
                } else {
                  end = element.x + element.neumeWidth;
                }
              } else {
                // The syllable is centered under the neume, so the melisma
                // ends at the left edge of the lyrics regardless of whether
                // the lyrics or the neume is wider.
                end =
                  nextNoteElement.x +
                  nextNoteElement.neumeWidth / 2 -
                  nextNoteElement.lyricsWidth / 2 -
                  nextNoteElement.lyricsHorizontalOffset / 2;
              }

              const widthOfTatweelForThisElement = this.getTextWidthFromCache(
                element,
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

        previousLineEndingMayShowLeadingLyricHyphen =
          lineEndingMayShowLeadingLyricHyphen;
      }
    }
  }

  private static centerMeasureBars(
    pages: Page[],
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const direction = pageSetup.melkiteRtl ? -1 : 1;

    for (const page of pages) {
      for (const line of page.lines) {
        for (let i = 0; i < line.elements.length; i++) {
          const element = line.elements[i];

          if (
            element.elementType !== ElementType.Note &&
            element.elementType !== ElementType.Martyria
          ) {
            continue;
          }

          const owner = element as NoteElement | MartyriaElement;
          owner.computedMeasureBarLeftOffsetX = 0;
          owner.computedMeasureBarRightOffsetX = 0;
          owner.computedMeasureBarLeftLeadingSpacing =
            this.getMeasureBarLeftLeadingSpacing(
              owner,
              pageSetup,
              measureBarWidthMap,
            );
          owner.computedMeasureBarRightTrailingSpacing = 0;

          const previousAnchor = this.findAdjacentMeasureBarAnchor(
            line.elements,
            i,
            -1,
          );
          const nextAnchor = this.findAdjacentMeasureBarAnchor(
            line.elements,
            i,
            1,
          );
          const nextElement =
            i + 1 < line.elements.length ? line.elements[i + 1] : null;
          const measureBarLeft = this.getVisibleMeasureBarLeft(owner);
          if (measureBarLeft) {
            const barWidth = measureBarWidthMap.get(measureBarLeft) ?? 0;
            if (barWidth > 0) {
              if (!pageSetup.melkiteRtl && !previousAnchor) {
                const resolvedMargins = resolvePageMargins(
                  pageSetup,
                  page.physicalPageNumber,
                );
                owner.computedMeasureBarLeftOffsetX =
                  resolvedMargins.left - owner.x;
              } else if (previousAnchor) {
                const previousBounds = this.getMeasureBarAnchorBounds(
                  previousAnchor,
                  pageSetup,
                  measureBarWidthMap,
                  measureBarLeft,
                  'right',
                );
                const ownerBounds = this.getMeasureBarAnchorBounds(
                  owner,
                  pageSetup,
                  measureBarWidthMap,
                  measureBarLeft,
                  'left',
                );
                const followsMartyria =
                  previousAnchor.elementType === ElementType.Martyria;
                const previousClampExtents = this.getMeasureBarClampExtents(
                  previousAnchor,
                  measureBarLeft,
                  barWidth,
                  { anchorExtents: followsMartyria, vareiaExtents: false },
                  pageSetup,
                  measureBarWidthMap,
                );
                const previousCenterBounds = this.getMeasureBarAnchorBounds(
                  previousAnchor,
                  pageSetup,
                  measureBarWidthMap,
                );
                const ownerCenterBounds = this.getMeasureBarAnchorBounds(
                  owner,
                  pageSetup,
                  measureBarWidthMap,
                );
                const centeredLeft = followsMartyria
                  ? (previousCenterBounds.right +
                      ownerCenterBounds.left -
                      barWidth) /
                    2
                  : (previousBounds.right + ownerBounds.left - barWidth) / 2;
                const barSpacing = followsMartyria
                  ? this.getMeasureBarCollisionSpacing(pageSetup)
                  : this.getInlineSpacing(pageSetup);
                const rightLimit = ownerBounds.left - barWidth - barSpacing;
                const targetLeft = Math.min(
                  Math.max(
                    centeredLeft,
                    previousBounds.right +
                      barSpacing -
                      previousClampExtents.left,
                  ),
                  rightLimit,
                );
                owner.computedMeasureBarLeftOffsetX =
                  direction * (targetLeft - owner.x);
              }
            }
          }

          const measureBarRight = this.getVisibleMeasureBarRight(owner);
          const followedByRightAlignedMartyria =
            isRightAlignedMartyria(nextAnchor);
          if (
            measureBarRight &&
            nextAnchor &&
            !followedByRightAlignedMartyria
          ) {
            const barWidth = measureBarWidthMap.get(measureBarRight) ?? 0;
            if (barWidth > 0) {
              const normalLeft =
                owner.x + this.getMeasureBarOwnerWidth(owner) - barWidth;
              const nextIsMartyria =
                nextAnchor.elementType === ElementType.Martyria;
              const barSpacing = nextIsMartyria
                ? this.getMeasureBarCollisionSpacing(pageSetup)
                : this.getInlineSpacing(pageSetup);
              const nextBounds = this.getMeasureBarAnchorBounds(
                nextAnchor,
                pageSetup,
                measureBarWidthMap,
                measureBarRight,
                'left',
              );
              const useCollisionExtents =
                nextIsMartyria ||
                this.measureBarHasCollisionRegions(measureBarRight, pageSetup);
              const nextClampExtents = this.getMeasureBarClampExtents(
                nextAnchor,
                measureBarRight,
                barWidth,
                { anchorExtents: useCollisionExtents, vareiaExtents: true },
                pageSetup,
                measureBarWidthMap,
              );
              const ownerClampExtents = this.getMeasureBarClampExtents(
                owner,
                measureBarRight,
                barWidth,
                { anchorExtents: useCollisionExtents, vareiaExtents: false },
                pageSetup,
                measureBarWidthMap,
              );
              const ownerBounds = this.getMeasureBarAnchorBounds(
                owner,
                pageSetup,
                measureBarWidthMap,
                measureBarRight,
                'right',
              );
              const ownerCenterBounds = this.getMeasureBarAnchorBounds(
                owner,
                pageSetup,
                measureBarWidthMap,
              );
              const nextCenterBounds = this.getMeasureBarAnchorBounds(
                nextAnchor,
                pageSetup,
                measureBarWidthMap,
              );
              const centeredLeft = nextIsMartyria
                ? (ownerCenterBounds.right + nextCenterBounds.left - barWidth) /
                  2
                : (ownerBounds.right + nextBounds.left - barWidth) / 2;
              const targetLeft = Math.min(
                Math.max(
                  centeredLeft,
                  ownerBounds.right + barSpacing - ownerClampExtents.left,
                ),
                nextBounds.left - nextClampExtents.right - barSpacing,
              );
              owner.computedMeasureBarRightOffsetX =
                direction * (targetLeft - normalLeft);
            }
          } else if (
            measureBarRight &&
            (followedByRightAlignedMartyria ||
              nextElement == null ||
              nextElement.elementType === ElementType.Empty)
          ) {
            owner.computedMeasureBarRightTrailingSpacing =
              this.getTerminalMeasureBarRightSpacing(
                owner,
                pageSetup,
                measureBarWidthMap,
              );
            if (
              !pageSetup.melkiteRtl &&
              owner.elementType === ElementType.Note &&
              (nextElement == null ||
                nextElement.elementType === ElementType.Empty) &&
              !(owner as NoteElement).lineBreak &&
              !(owner as NoteElement).pageBreak &&
              (owner as NoteElement).measureBarRight == null &&
              (owner as NoteElement).computedMeasureBarRight != null
            ) {
              const barWidth = measureBarWidthMap.get(measureBarRight) ?? 0;
              if (barWidth > 0) {
                const resolvedMargins = resolvePageMargins(
                  pageSetup,
                  page.physicalPageNumber,
                );
                const naturalLeft =
                  owner.x +
                  this.getMeasureBarOwnerWidth(owner) +
                  owner.computedMeasureBarRightTrailingSpacing;
                const targetLeft =
                  pageSetup.pageWidth - resolvedMargins.right - barWidth;
                owner.computedMeasureBarRightOffsetX = targetLeft - naturalLeft;
              }
            }
          }
        }
      }
    }
  }

  private static findAdjacentMeasureBarAnchor(
    elements: ScoreElement[],
    startIndex: number,
    direction: -1 | 1,
  ) {
    for (
      let i = startIndex + direction;
      i >= 0 && i < elements.length;
      i += direction
    ) {
      const element = elements[i];
      if (this.isMeasureBarAnchorElement(element)) {
        return element;
      }
      if (!this.isMelismaContinuationElement(element)) {
        return null;
      }
    }

    return null;
  }

  private static isMeasureBarAnchorElement(element: ScoreElement) {
    return (
      element.elementType === ElementType.Note ||
      element.elementType === ElementType.Martyria ||
      element.elementType === ElementType.Tempo ||
      element.elementType === ElementType.DropCap ||
      (element.elementType === ElementType.TextBox &&
        (element as TextBoxElement).inline) ||
      (element.elementType === ElementType.RichTextBox &&
        (element as RichTextBoxElement).inline) ||
      (element.elementType === ElementType.ImageBox &&
        (element as ImageBoxElement).inline)
    );
  }

  private static getMeasureBarAnchorBounds(
    element: ScoreElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    measureBar: MeasureBar | null = null,
    edge: MeasureBarAnchorEdge | null = null,
  ) {
    if (
      element.elementType === ElementType.Note ||
      element.elementType === ElementType.Martyria
    ) {
      const owner = element as NoteElement | MartyriaElement;
      const measureBarLeft = this.getVisibleMeasureBarLeft(owner);
      const measureBarRight = this.getVisibleMeasureBarRight(owner);
      const left =
        owner.x +
        (measureBarLeft != null
          ? (measureBarWidthMap.get(measureBarLeft) ?? 0) +
            owner.computedMeasureBarLeftLeadingSpacing
          : 0);
      const right =
        owner.x +
        this.getMeasureBarOwnerWidth(owner) -
        (measureBarRight != null
          ? (measureBarWidthMap.get(measureBarRight) ?? 0)
          : 0);

      if (element.elementType === ElementType.Note) {
        return measureBar == null || edge == null
          ? { left, right }
          : this.getNoteBoundsForMeasureBar(
              element as NoteElement,
              { left, right },
              measureBar,
              edge,
              pageSetup,
              measureBarWidthMap,
            );
      }

      if (
        measureBar != null &&
        edge != null &&
        (edge === 'left'
          ? this.getVisibleMeasureBarLeft(owner) !== measureBar
          : this.getVisibleMeasureBarRight(owner) !== measureBar)
      ) {
        return this.getMartyriaBoundsForMeasureBar(
          element as MartyriaElement,
          { left, right },
          measureBar,
          edge,
          pageSetup,
        );
      }

      return { left, right };
    }

    return {
      left: element.x,
      right: element.x + element.width,
    };
  }

  private static getNoteBoundsForMeasureBar(
    noteElement: NoteElement,
    fallbackBounds: { left: number; right: number },
    measureBar: MeasureBar,
    edge: MeasureBarAnchorEdge,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    return this.getBoundsForMeasureBar(
      noteElement.x,
      this.getNoteCollisionGlyphBoxes(
        noteElement,
        pageSetup,
        measureBarWidthMap,
      ),
      fallbackBounds,
      measureBar,
      edge,
      pageSetup,
      // Notes test full 2D overlap so marks beside the bar do not clamp it.
      (box, barBox) => this.noteGlyphBoxesOverlap(box, barBox),
    );
  }

  // The horizontal extents of the owner glyph boxes that overlap the measure
  // bar's clearance box, or the fallback bounds if none do.
  private static getBoundsForMeasureBar(
    ownerX: number,
    ownerBoxes: NoteGlyphBox[],
    fallbackBounds: { left: number; right: number },
    measureBar: MeasureBar,
    edge: MeasureBarAnchorEdge,
    pageSetup: PageSetup,
    overlapsBar: (box: NoteGlyphBox, barBox: NoteGlyphBox) => boolean,
  ) {
    const barBox = this.getMeasureBarClearanceBox(
      measureBar,
      edge,
      fallbackBounds,
      ownerX,
      pageSetup,
    );
    const overlappingBoxes = ownerBoxes
      .filter((box) => overlapsBar(box, barBox))
      .map((box) => ({
        left: ownerX + box.left,
        right: ownerX + box.right,
      }));

    if (overlappingBoxes.length === 0) {
      return fallbackBounds;
    }

    return {
      left: Math.min(...overlappingBoxes.map((box) => box.left)),
      right: Math.max(...overlappingBoxes.map((box) => box.right)),
    };
  }

  private static getMeasureBarInkOverhang(
    owner: NoteElement | MartyriaElement,
    measureBar: MeasureBar,
    edge: MeasureBarAnchorEdge,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const fallbackBounds = this.getMeasureBarAnchorBounds(
      owner,
      pageSetup,
      measureBarWidthMap,
    );
    const bounds =
      owner.elementType === ElementType.Note
        ? this.getNoteBoundsForMeasureBar(
            owner as NoteElement,
            fallbackBounds,
            measureBar,
            edge,
            pageSetup,
            measureBarWidthMap,
          )
        : this.getMartyriaBoundsForMeasureBar(
            owner as MartyriaElement,
            fallbackBounds,
            measureBar,
            edge,
            pageSetup,
          );

    return edge === 'left'
      ? Math.max(0, fallbackBounds.left - bounds.left)
      : Math.max(0, bounds.right - fallbackBounds.right);
  }

  private static getMartyriaBoundsForMeasureBar(
    martyriaElement: MartyriaElement,
    fallbackBounds: { left: number; right: number },
    measureBar: MeasureBar,
    edge: MeasureBarAnchorEdge,
    pageSetup: PageSetup,
  ) {
    return this.getBoundsForMeasureBar(
      martyriaElement.x,
      this.getMartyriaCollisionGlyphBoxes(martyriaElement, pageSetup),
      fallbackBounds,
      measureBar,
      edge,
      pageSetup,
      // Martyriae test vertical overlap only: the whole body clamps the bar
      // regardless of horizontal distance.
      (box, barBox) => this.noteGlyphBoxesVerticallyOverlap(box, barBox),
    );
  }

  private static getMeasureBarClearanceBox(
    measureBar: MeasureBar,
    edge: MeasureBarAnchorEdge,
    fallbackBounds: { left: number; right: number },
    ownerX: number,
    pageSetup: PageSetup,
  ) {
    const barBox = this.getGlyphBox(
      pageSetup.neumeDefaultFontFamily,
      NeumeMappingService.getMapping(measureBar).glyphName,
      0,
      0,
      pageSetup.neumeDefaultFontSize,
    );
    const clearance = this.getMeasureBarCollisionSpacing(pageSetup);
    const barWidth = barBox.right - barBox.left;
    const clearanceLeft =
      edge === 'left'
        ? fallbackBounds.left - ownerX - clearance - barWidth
        : fallbackBounds.right - ownerX;
    const clearanceRight =
      edge === 'left'
        ? fallbackBounds.left - ownerX
        : fallbackBounds.right - ownerX + clearance + barWidth;

    return {
      left: clearanceLeft,
      right: clearanceRight,
      top: barBox.top,
      bottom: barBox.bottom,
    };
  }

  private static getMeasureBarCollisionExtentsForAnchor(
    anchor: ScoreElement,
    measureBar: MeasureBar,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    if (
      anchor.elementType !== ElementType.Note &&
      anchor.elementType !== ElementType.Martyria
    ) {
      return null;
    }

    const anchorBoxes =
      anchor.elementType === ElementType.Note
        ? this.getNoteCollisionGlyphBoxes(
            anchor as NoteElement,
            pageSetup,
            measureBarWidthMap,
          )
        : this.getMartyriaCollisionGlyphBoxes(
            anchor as MartyriaElement,
            pageSetup,
          );

    return this.getOverlappingMeasureBarExtents(
      measureBar,
      anchorBoxes,
      0,
      pageSetup,
    );
  }

  // The horizontal extents of the measure bar's collision boxes that
  // vertically overlap any of the given glyph boxes, or null if none do.
  private static getOverlappingMeasureBarExtents(
    measureBar: MeasureBar,
    boxes: NoteGlyphBox[],
    verticalTolerance: number,
    pageSetup: PageSetup,
  ) {
    const barBoxes = this.getMeasureBarCollisionBoxes(
      measureBar,
      'left',
      { left: 0, right: 0 },
      0,
      pageSetup,
    ).filter((barBox) =>
      boxes.some((box) =>
        this.noteGlyphBoxesVerticallyOverlapWithTolerance(
          barBox,
          box,
          verticalTolerance,
        ),
      ),
    );

    if (barBoxes.length === 0) {
      return null;
    }

    return {
      left: Math.min(...barBoxes.map((box) => box.left)),
      right: Math.max(...barBoxes.map((box) => box.right)),
    };
  }

  private static getMeasureBarOwnerWidth(owner: NoteElement | MartyriaElement) {
    if (owner.elementType === ElementType.Note) {
      return owner.neumeWidth;
    }

    const martyriaElement = owner as MartyriaElement;
    return (
      this.getMartyriaBoxAdvance(martyriaElement) - martyriaElement.spaceAfter
    );
  }

  private static getTerminalMeasureBarSpacing(pageSetup: PageSetup) {
    return this.getInlineSpacing(pageSetup);
  }

  private static getTerminalMeasureBarRightSpacing(
    owner: NoteElement | MartyriaElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const measureBar = this.getVisibleMeasureBarRight(owner);

    if (measureBar == null) {
      return 0;
    }

    return this.getTerminalMeasureBarRightSpacingForMeasureBar(
      owner,
      measureBar,
      pageSetup,
      measureBarWidthMap,
    );
  }

  private static getTerminalMartyriaRightSpacing(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    if (this.getVisibleMeasureBarRight(martyriaElement) != null) {
      return this.getTerminalMeasureBarRightSpacing(
        martyriaElement,
        pageSetup,
        measureBarWidthMap,
      );
    }

    return this.getMartyriaRightInkOverhang(martyriaElement, pageSetup);
  }

  private static getTerminalMeasureBarRightSpacingForMeasureBar(
    owner: NoteElement | MartyriaElement,
    measureBar: MeasureBar,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const inkOverhang =
      owner.elementType === ElementType.Note
        ? this.getMeasureBarInkOverhang(
            owner as NoteElement,
            measureBar,
            'right',
            pageSetup,
            measureBarWidthMap,
          )
        : 0;

    return this.getTerminalMeasureBarSpacing(pageSetup) + inkOverhang;
  }

  private static getMeasureBarLeftLeadingSpacing(
    owner: NoteElement | MartyriaElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const measureBar = this.getVisibleMeasureBarLeft(owner);

    if (measureBar == null) {
      return 0;
    }

    return this.getMeasureBarLeftLeadingSpacingForMeasureBar(
      owner,
      measureBar,
      pageSetup,
      measureBarWidthMap,
    );
  }

  private static getMeasureBarLeftLeadingSpacingForMeasureBar(
    owner: NoteElement | MartyriaElement,
    measureBar: MeasureBar,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const leadingSpacing = this.getTerminalMeasureBarSpacing(pageSetup);

    if (leadingSpacing === 0) {
      return 0;
    }

    if (owner.elementType !== ElementType.Note) {
      return leadingSpacing;
    }

    const barWidth = measureBarWidthMap.get(measureBar) ?? 0;
    const barBoxes = this.getMeasureBarCollisionBoxes(
      measureBar,
      'left',
      { left: 0, right: 0 },
      0,
      pageSetup,
    );
    const noteBoxes = this.getNoteCollisionGlyphBoxes(
      owner as NoteElement,
      pageSetup,
      measureBarWidthMap,
      barWidth + leadingSpacing,
    );

    return (
      leadingSpacing +
      Math.max(
        this.getMeasureBarCollisionDeficit(
          noteBoxes,
          barBoxes,
          'left',
          leadingSpacing,
        ),
        this.getMeasureBarVareiaCollisionDeficit(
          owner as NoteElement,
          barBoxes,
          'left',
          leadingSpacing,
          pageSetup,
          measureBarWidthMap,
          barWidth + leadingSpacing,
        ),
      )
    );
  }

  private static getMeasureBarBaseLeftLeadingSpacing(
    owner: NoteElement | MartyriaElement,
    pageSetup: PageSetup,
  ) {
    const measureBar = this.getVisibleMeasureBarLeft(owner);

    return measureBar == null
      ? 0
      : this.getTerminalMeasureBarSpacing(pageSetup);
  }

  private static getMeasureBarMinimumGlueWidth(
    left: ScoreElement | null,
    right: ScoreElement | null,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    let measureBarCount = 0;
    let measureBarRight: MeasureBar | null = null;
    let measureBarLeft: MeasureBar | null = null;

    if (left != null && this.isMeasureBarOwner(left)) {
      measureBarRight = this.getVisibleMeasureBarRight(left);
      if (measureBarRight != null) {
        measureBarCount++;
      }
    }

    if (right != null && this.isMeasureBarOwner(right)) {
      measureBarLeft = this.getVisibleMeasureBarLeft(right);
      if (measureBarLeft != null) {
        measureBarCount++;
      }
    }

    const internalLeftBarSpacing =
      right != null && this.isMeasureBarOwner(right)
        ? this.getMeasureBarBaseLeftLeadingSpacing(right, pageSetup)
        : 0;
    const leftCollisionMeasureBar = measureBarLeft ?? measureBarRight;
    const rightCollisionMeasureBar = measureBarRight ?? measureBarLeft;
    const rightInkOverhang =
      rightCollisionMeasureBar != null &&
      (left?.elementType === ElementType.Note ||
        (left?.elementType === ElementType.Martyria &&
          right?.elementType === ElementType.Note &&
          measureBarLeft != null))
        ? this.getMeasureBarInkOverhang(
            left as NoteElement | MartyriaElement,
            rightCollisionMeasureBar,
            'right',
            pageSetup,
            measureBarWidthMap,
          )
        : 0;
    const leftInkOverhang =
      leftCollisionMeasureBar != null &&
      (right?.elementType === ElementType.Note ||
        (left?.elementType === ElementType.Note &&
          right?.elementType === ElementType.Martyria &&
          measureBarRight != null))
        ? this.getMeasureBarInkOverhang(
            right as NoteElement | MartyriaElement,
            leftCollisionMeasureBar,
            'left',
            pageSetup,
            measureBarWidthMap,
          )
        : 0;

    return Math.max(
      0,
      this.getInlineSpacing(pageSetup) * (measureBarCount > 0 ? 2 : 1) -
        internalLeftBarSpacing +
        rightInkOverhang +
        leftInkOverhang,
      this.getMeasureBarCollisionMinimumGlueWidth(
        left,
        right,
        pageSetup,
        measureBarWidthMap,
      ),
    );
  }

  private static getMeasureBarCollisionDeficit(
    noteBoxes: NoteGlyphBox[],
    barBoxes: NoteGlyphBox[],
    edge: MeasureBarAnchorEdge,
    clearance: number,
    verticalTolerance = 0,
  ) {
    let deficit = 0;

    for (const noteBox of noteBoxes) {
      for (const barBox of barBoxes) {
        if (
          !this.noteGlyphBoxesVerticallyOverlapWithTolerance(
            noteBox,
            barBox,
            verticalTolerance,
          )
        ) {
          continue;
        }

        deficit = Math.max(
          deficit,
          edge === 'left'
            ? barBox.right + clearance - noteBox.left
            : noteBox.right + clearance - barBox.left,
        );
      }
    }

    return Math.max(0, deficit);
  }

  private static getMeasureBarVareiaCollisionDeficit(
    noteElement: NoteElement,
    barBoxes: NoteGlyphBox[],
    edge: MeasureBarAnchorEdge,
    clearance: number,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    leftBarReserveOverride: number | null = null,
  ) {
    const vareiaBoxes = this.getVareiaCollisionBoxes(
      noteElement,
      pageSetup,
      measureBarWidthMap,
      leftBarReserveOverride,
    );

    return this.getMeasureBarCollisionDeficit(
      vareiaBoxes,
      barBoxes,
      edge,
      clearance,
      this.emToPx(
        vareiaCollisionVerticalToleranceEm,
        pageSetup.neumeDefaultFontSize,
      ),
    );
  }

  private static getMeasureBarVareiaCollisionExtents(
    noteElement: NoteElement,
    measureBar: MeasureBar,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const vareiaBoxes = this.getVareiaCollisionBoxes(
      noteElement,
      pageSetup,
      measureBarWidthMap,
    );

    return this.getOverlappingMeasureBarExtents(
      measureBar,
      vareiaBoxes,
      this.emToPx(
        vareiaCollisionVerticalToleranceEm,
        pageSetup.neumeDefaultFontSize,
      ),
      pageSetup,
    );
  }

  // The horizontal extents of the measure bar that must stay clear of the
  // anchor, assembled from the anchor's collision extents and, for notes, the
  // vareia extents. Falls back to the bar's full advance when a source is
  // disabled or finds no overlap.
  private static getMeasureBarClampExtents(
    anchor: ScoreElement,
    measureBar: MeasureBar,
    barWidth: number,
    options: { anchorExtents: boolean; vareiaExtents: boolean },
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    let extents = { left: 0, right: barWidth };

    if (options.anchorExtents) {
      extents =
        this.getMeasureBarCollisionExtentsForAnchor(
          anchor,
          measureBar,
          pageSetup,
          measureBarWidthMap,
        ) ?? extents;
    }

    if (options.vareiaExtents && anchor.elementType === ElementType.Note) {
      const vareiaExtents = this.getMeasureBarVareiaCollisionExtents(
        anchor as NoteElement,
        measureBar,
        pageSetup,
        measureBarWidthMap,
      );
      if (vareiaExtents != null) {
        extents.left = Math.min(extents.left, vareiaExtents.left);
        extents.right = Math.max(extents.right, vareiaExtents.right);
      }
    }

    return extents;
  }

  // The Phase 1 glue floor that keeps a centered measure bar feasible: enough
  // room between the anchors' ink bounds for the bar's clamp extents plus
  // clearance on both sides. Phase 3's centerMeasureBars clamps the bar
  // within the same geometry.
  private static getCenteredClampMinimum(
    leftAnchor: NoteElement | MartyriaElement,
    rightAnchor: NoteElement | MartyriaElement,
    measureBar: MeasureBar,
    leftAdvance: number,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const barWidth = measureBarWidthMap.get(measureBar) ?? 0;
    const clearance = this.getMeasureBarCollisionSpacing(pageSetup);
    const ownerClampExtents = this.getMeasureBarClampExtents(
      leftAnchor,
      measureBar,
      barWidth,
      { anchorExtents: true, vareiaExtents: false },
      pageSetup,
      measureBarWidthMap,
    );
    const nextClampExtents = this.getMeasureBarClampExtents(
      rightAnchor,
      measureBar,
      barWidth,
      { anchorExtents: true, vareiaExtents: true },
      pageSetup,
      measureBarWidthMap,
    );
    const ownerBounds = this.getMeasureBarAnchorBounds(
      leftAnchor,
      pageSetup,
      measureBarWidthMap,
      measureBar,
      'right',
    );
    const nextBounds = this.getMeasureBarAnchorBounds(
      rightAnchor,
      pageSetup,
      measureBarWidthMap,
      measureBar,
      'left',
    );
    const ownerBoundsRight = ownerBounds.right - leftAnchor.x;
    const nextBoundsLeft = nextBounds.left - rightAnchor.x;

    return Math.max(
      0,
      ownerBoundsRight +
        2 * clearance -
        ownerClampExtents.left -
        leftAdvance -
        nextBoundsLeft +
        nextClampExtents.right,
    );
  }

  private static getMinimumSpacingForMeasureBarVareiaBoxes(
    leftAdvanceWidth: number,
    barBoxes: NoteGlyphBox[],
    noteElement: NoteElement,
    clearance: number,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const vareiaBoxes = this.getVareiaCollisionBoxes(
      noteElement,
      pageSetup,
      measureBarWidthMap,
    );

    return this.getMinimumSpacingForNoteGlyphBoxes(
      leftAdvanceWidth,
      barBoxes,
      vareiaBoxes,
      clearance,
      this.emToPx(
        vareiaCollisionVerticalToleranceEm,
        pageSetup.neumeDefaultFontSize,
      ),
    );
  }

  private static noteGlyphBoxesVerticallyOverlapWithTolerance(
    left: NoteGlyphBox,
    right: NoteGlyphBox,
    tolerance: number,
  ) {
    return (
      left.top < right.bottom + tolerance && right.top < left.bottom + tolerance
    );
  }

  private static getMeasureBarCollisionMinimumGlueWidth(
    left: ScoreElement | null,
    right: ScoreElement | null,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    if (
      left?.elementType === ElementType.Note &&
      right?.elementType === ElementType.Martyria
    ) {
      const leftNote = left as NoteElement;
      const rightMartyria = right as MartyriaElement;
      const measureBarRight = this.getVisibleMeasureBarRight(leftNote);

      if (measureBarRight == null) {
        return 0;
      }

      const fallbackBounds = this.getMeasureBarAnchorBounds(
        leftNote,
        pageSetup,
        measureBarWidthMap,
      );
      const barBoxes = this.getMeasureBarCollisionBoxes(
        measureBarRight,
        'right',
        fallbackBounds,
        leftNote.x,
        pageSetup,
      );
      const rightBoxes = this.getMartyriaCollisionGlyphBoxes(
        rightMartyria,
        pageSetup,
      );
      const clearance = this.getMeasureBarCollisionSpacing(pageSetup);
      const leftAdvance = this.getNoteBoxAdvance(leftNote);

      return Math.max(
        this.getMinimumSpacingForNoteGlyphBoxes(
          leftAdvance,
          barBoxes,
          rightBoxes,
          clearance,
        ),
        this.getCenteredClampMinimum(
          leftNote,
          rightMartyria,
          measureBarRight,
          leftAdvance,
          pageSetup,
          measureBarWidthMap,
        ),
      );
    }

    if (
      left?.elementType === ElementType.Martyria &&
      right?.elementType === ElementType.Note
    ) {
      const leftMartyria = left as MartyriaElement;
      const rightNote = right as NoteElement;
      const measureBarLeft = this.getVisibleMeasureBarLeft(rightNote);

      if (measureBarLeft == null) {
        return 0;
      }

      const leftBoxes = this.getMartyriaCollisionGlyphBoxes(
        leftMartyria,
        pageSetup,
      );
      const barBoxes = this.getMeasureBarCollisionBoxes(
        measureBarLeft,
        'left',
        { left: 0, right: 0 },
        0,
        pageSetup,
      );
      const leftAdvance = this.getMartyriaBoxAdvance(leftMartyria);
      const clearance = this.getMeasureBarCollisionSpacing(pageSetup);

      return this.getMinimumSpacingForNoteGlyphBoxes(
        leftAdvance,
        leftBoxes,
        barBoxes,
        clearance,
      );
    }

    if (
      left?.elementType !== ElementType.Note ||
      right?.elementType !== ElementType.Note
    ) {
      return 0;
    }

    const leftNote = left as NoteElement;
    const rightNote = right as NoteElement;
    const measureBarRight = this.getVisibleMeasureBarRight(leftNote);
    const measureBarLeft = this.getVisibleMeasureBarLeft(rightNote);
    const clearance = this.getMeasureBarCollisionSpacing(pageSetup);
    const leftAdvance = this.getNoteBoxAdvance(leftNote);

    if (measureBarRight != null) {
      const fallbackBounds = this.getMeasureBarAnchorBounds(
        leftNote,
        pageSetup,
        measureBarWidthMap,
      );
      const barBoxes = this.getMeasureBarCollisionBoxes(
        measureBarRight,
        'right',
        fallbackBounds,
        leftNote.x,
        pageSetup,
      );
      const rightBoxes = this.getNoteCollisionGlyphBoxes(
        rightNote,
        pageSetup,
        measureBarWidthMap,
      );
      const collisionMinimum = Math.max(
        this.getMinimumSpacingForNoteGlyphBoxes(
          leftAdvance,
          barBoxes,
          rightBoxes,
          clearance,
        ),
        this.getMinimumSpacingForMeasureBarVareiaBoxes(
          leftAdvance,
          barBoxes,
          rightNote,
          clearance,
          pageSetup,
          measureBarWidthMap,
        ),
      );
      if (!this.measureBarHasCollisionRegions(measureBarRight, pageSetup)) {
        return collisionMinimum;
      }

      return Math.max(
        collisionMinimum,
        this.getCenteredClampMinimum(
          leftNote,
          rightNote,
          measureBarRight,
          leftAdvance,
          pageSetup,
          measureBarWidthMap,
        ),
      );
    }

    if (measureBarLeft != null) {
      const leftBoxes = this.getNoteCollisionGlyphBoxes(
        leftNote,
        pageSetup,
        measureBarWidthMap,
      );
      const barBoxes = this.getMeasureBarCollisionBoxes(
        measureBarLeft,
        'left',
        { left: 0, right: 0 },
        0,
        pageSetup,
      );

      return this.getMinimumSpacingForNoteGlyphBoxes(
        leftAdvance,
        leftBoxes,
        barBoxes,
        clearance,
      );
    }

    return 0;
  }

  private static getMeasureBarCollisionBoxes(
    measureBar: MeasureBar,
    edge: MeasureBarAnchorEdge,
    fallbackBounds: { left: number; right: number },
    ownerX: number,
    pageSetup: PageSetup,
  ) {
    const fontFamily = pageSetup.neumeDefaultFontFamily;
    const glyphName = NeumeMappingService.getMapping(measureBar).glyphName;
    const fontSize = pageSetup.neumeDefaultFontSize;
    const regionBoxes = fontService
      .getGlyphCollisionRegions(fontFamily, glyphName)
      .map((region) => this.getGlyphBBoxBox(region, 0, 0, fontSize));
    const barBoxes =
      regionBoxes.length > 0
        ? regionBoxes
        : [this.getGlyphBox(fontFamily, glyphName, 0, 0, fontSize)];

    return barBoxes.map((barBox) => {
      const barLeft =
        edge === 'left'
          ? barBox.left
          : fallbackBounds.right - ownerX + barBox.left;
      const barRight =
        edge === 'left'
          ? barBox.right
          : fallbackBounds.right - ownerX + barBox.right;

      return {
        left: barLeft,
        right: barRight,
        top: barBox.top,
        bottom: barBox.bottom,
      };
    });
  }

  private static measureBarHasCollisionRegions(
    measureBar: MeasureBar,
    pageSetup: PageSetup,
  ) {
    const glyphName = NeumeMappingService.getMapping(measureBar).glyphName;
    return (
      fontService.getGlyphCollisionRegions(
        pageSetup.neumeDefaultFontFamily,
        glyphName,
      ).length > 0
    );
  }

  private static isMeasureBarOwner(
    element: ScoreElement,
  ): element is NoteElement | MartyriaElement {
    return (
      element.elementType === ElementType.Note ||
      element.elementType === ElementType.Martyria
    );
  }

  private static getVisibleMeasureBarLeft(
    owner: NoteElement | MartyriaElement,
  ) {
    const measureBar =
      owner.elementType === ElementType.Note
        ? ((owner as NoteElement).measureBarLeft ??
          (owner as NoteElement).computedMeasureBarLeft)
        : (owner as MartyriaElement).measureBarLeft;

    return measureBar != null && !isMeasureBarAboveVariant(measureBar)
      ? measureBar
      : null;
  }

  private static hasVisibleMeasureBarAtBoundary(
    left: NoteElement,
    right: NoteElement,
  ) {
    return (
      this.getVisibleMeasureBarRight(left) != null ||
      this.getVisibleMeasureBarLeft(right) != null
    );
  }

  private static getVisibleMeasureBarRight(
    owner: NoteElement | MartyriaElement,
  ) {
    return owner.elementType === ElementType.Note
      ? ((owner as NoteElement).measureBarRight ??
          (owner as NoteElement).computedMeasureBarRight)
      : (owner as MartyriaElement).measureBarRight;
  }

  private static getNoteNeumesForMeasurement(noteElement: NoteElement) {
    return [
      noteElement.quantitativeNeume,
      ...noteMarkSlots.map((slot) => slot.neume(noteElement)),
    ].filter((x) => x != null);
  }

  private static getNoteNeumesForInkMeasurement(noteElement: NoteElement) {
    return this.getNoteNeumesForMeasurement(noteElement).filter(
      (neume) => !isTieNeume(neume),
    );
  }

  public static calculateMartyriae(
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
        for (const slot of noteFthoraSlots) {
          const carry = slot.getCarry(note);

          if (
            carry &&
            this.fthoraIsValid(carry, currentNotesVirtual, pageSetup)
          ) {
            slot.setFthora(note, carry);
            slot.setCarry(note, null);
          }
        }

        // Apply the first present fthora (primary, then secondary, then
        // tertiary), demoting it back to a carry when it is invalid here.
        const activeSlot = noteFthoraSlots.find((slot) => slot.getFthora(note));

        if (activeSlot) {
          const fthora = activeSlot.getFthora(note)!;

          if (this.fthoraIsValid(fthora, currentNotesVirtual, pageSetup)) {
            const spreadIndex = getSpreadIndex(
              fthora,
              note.quantitativeNeume,
              activeSlot.selection,
            );
            const fthoraNote =
              spreadIndex != -1 ? currentNotes[spreadIndex] : currentNote;

            const fthoraNoteVirtual =
              spreadIndex != -1
                ? currentNotesVirtual[spreadIndex]
                : currentNoteVirtual;

            // Scale is based off the virtual note
            currentScale =
              this.getScaleFromFthora(fthora, fthoraNoteVirtual) ||
              currentScale;

            // Shift is based off the true note
            currentShift = this.getShift(
              fthoraNote,
              fthoraNoteVirtual,
              currentScale,
              fthora,
              activeSlot.getChromaticFthoraNote(note),
            );

            note.noteIndicatorNeume = noteIndicatorMap.get(
              (((fthoraNote + currentShift) % 7) + 7) % 7,
            )!;
            activeSlot.setCarry(note, null);
          } else {
            activeSlot.setCarry(note, fthora);
            activeSlot.setFthora(note, null);
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
    } else {
      rootSign =
        scaleRootSignMaps.get(currentScale)?.get(currentScaleNote) ||
        RootSign.Alpha;
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
    } else {
      const anchorNote = scaleShiftAnchorMap.get(currentScale);

      if (anchorNote != null) {
        shift = getScaleNoteValue(anchorNote) - currentNote;
      }
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

  private static getNeumeWidthFromCache(neume: Neume, pageSetup: PageSetup) {
    return this.getNeumeSequenceWidthFromCache([neume], pageSetup);
  }

  // The stand-alone apostrophos is not the same width as the apostrophos in
  // the running elaphron, but the elaphrons are the same width in both
  // neumes, so this offset locates the elaphron body inside the composite
  // glyph.
  private static getRunningElaphronOffset(pageSetup: PageSetup) {
    return (
      this.getNeumeWidthFromCache(
        QuantitativeNeume.RunningElaphron,
        pageSetup,
      ) - this.getNeumeWidthFromCache(QuantitativeNeume.Elaphron, pageSetup)
    );
  }

  private static getNeumeSequenceWidthFromCache(
    neumes: Array<Neume>,
    pageSetup: PageSetup,
  ) {
    const key = `${neumes.join(',')} | ${pageSetup.neumeDefaultFontSize} | ${pageSetup.neumeDefaultFontFamily}`;

    let width = neumeWidthCache.get(key);

    if (width == null) {
      const text = neumes
        .map((neume) => NeumeMappingService.getMapping(neume).text)
        .join('');

      width = TextMeasurementService.getTextWidth(
        text,
        this.getNeumeFont(pageSetup),
      );

      neumeWidthCache.set(key, width);
    }

    return width;
  }

  private static getNoteInkBoundsFromCache(
    noteElement: NoteElement,
    pageSetup: PageSetup,
  ) {
    const neumes = this.getNoteNeumesForInkMeasurement(noteElement);
    return this.getNeumeSequenceInkBoundsFromCache(neumes, pageSetup);
  }

  private static getNoteRightInkOverhang(
    noteElement: NoteElement,
    pageSetup: PageSetup,
  ) {
    const inkBounds = this.getNoteInkBoundsFromCache(noteElement, pageSetup);
    const measureBarLeft = this.getVisibleMeasureBarLeft(noteElement);
    // Ink bounds are relative to the main glyph run. Translate its right edge
    // into note-box coordinates before comparing it with the layout advance.
    const bodyLeft =
      (measureBarLeft != null
        ? this.getNeumeWidthFromCache(measureBarLeft, pageSetup) +
          noteElement.computedMeasureBarLeftLeadingSpacing
        : 0) +
      (!pageSetup.melkiteRtl && noteElement.vareia
        ? this.getVareiaPrefixWidth(noteElement, pageSetup)
        : 0);

    return Math.max(
      0,
      bodyLeft + inkBounds.inkRight - this.getNoteBoxAdvance(noteElement),
    );
  }

  private static getNeumeSequenceInkBoundsFromCache(
    neumes: Neume[],
    pageSetup: PageSetup,
  ) {
    const key = `${neumes.join(',')} | ${pageSetup.neumeDefaultFontSize} | ${pageSetup.neumeDefaultFontFamily}`;

    let bounds = noteInkBoundsCache.get(key);

    if (bounds == null) {
      const text = neumes
        .map((neume) => NeumeMappingService.getMapping(neume).text)
        .join('');
      const font = this.getNeumeFont(pageSetup);

      bounds = TextMeasurementService.getInkBounds(text, font);

      noteInkBoundsCache.set(key, bounds);
    }

    return bounds;
  }

  private static getMartyriaBodyInkOverhangs(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    const inkBounds = this.getNeumeSequenceInkBoundsFromCache(
      this.getMartyriaBodyNeumesForInkMeasurement(martyriaElement),
      pageSetup,
    );
    const bodyWidth = this.getNeumeSequenceWidthFromCache(
      this.getMartyriaBodyNeumesForWidthMeasurement(martyriaElement),
      pageSetup,
    );

    return {
      left: Math.max(0, -inkBounds.inkLeft),
      right: Math.max(0, inkBounds.inkRight - bodyWidth),
    };
  }

  private static getMartyriaTempoLeftSpacingDeficit(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    if (!martyriaElement.tempoLeft) {
      return 0;
    }

    const requiredWidth =
      this.getInlineSpacing(pageSetup) +
      this.getSingleNeumeRightInkOverhang(
        martyriaElement.tempoLeft,
        pageSetup,
      ) +
      this.getMartyriaBodyInkOverhangs(martyriaElement, pageSetup).left;

    return Math.max(0, requiredWidth - martyriaElement.tempoLeftSpacing);
  }

  private static getMartyriaTempoRightSpacingDeficit(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    if (!martyriaElement.tempoRight) {
      return 0;
    }

    const requiredWidth =
      this.getInlineSpacing(pageSetup) +
      this.getMartyriaBodyInkOverhangs(martyriaElement, pageSetup).right +
      this.getSingleNeumeLeftInkOverhang(martyriaElement.tempoRight, pageSetup);

    return Math.max(0, requiredWidth - martyriaElement.tempoRightSpacing);
  }

  private static getMartyriaBodyNeumesForInkMeasurement(
    martyriaElement: MartyriaElement,
  ) {
    const neumes =
      this.getMartyriaBodyNeumesForWidthMeasurement(martyriaElement);

    if (!martyriaElement.error) {
      neumes.push(martyriaElement.rootSign);
    }

    // Keep this in the same order as the zero-advance marks rendered inside
    // NeumeBoxMartyria after the note/root-sign stack.
    neumes.push(...this.getMartyriaBodyOverlayNeumes(martyriaElement));

    return neumes;
  }

  private static getMartyriaBodyOverlayNeumes(
    martyriaElement: MartyriaElement,
  ): Neume[] {
    const neumes: Neume[] = [];

    if (martyriaElement.tempo != null) {
      neumes.push(martyriaElement.tempo);
    }

    if (!martyriaElement.error && martyriaElement.fthora != null) {
      neumes.push(martyriaElement.fthora);
    }

    if (isMeasureBarAboveVariant(martyriaElement.measureBarLeft)) {
      neumes.push(martyriaElement.measureBarLeft);
    }

    return neumes;
  }

  private static getMartyriaBodyNeumesForWidthMeasurement(
    martyriaElement: MartyriaElement,
  ): Neume[] {
    return [!martyriaElement.error ? martyriaElement.note : Note.Pa];
  }

  private static getSingleNeumeLeftInkOverhang(
    neume: Neume,
    pageSetup: PageSetup,
  ) {
    return this.getNeumeSequenceInkBoundsFromCache([neume], pageSetup)
      .leftOverhang;
  }

  private static getSingleNeumeRightInkOverhang(
    neume: Neume,
    pageSetup: PageSetup,
  ) {
    return this.getNeumeSequenceInkBoundsFromCache([neume], pageSetup)
      .rightOverhang;
  }

  private static getNoteLeftInkOverhang(
    noteElement: NoteElement,
    pageSetup: PageSetup,
  ) {
    const inkBounds = this.getNoteInkBoundsFromCache(noteElement, pageSetup);
    return Math.max(
      0,
      inkBounds.leftOverhang -
        this.getVareiaPrefixWidth(noteElement, pageSetup),
    );
  }

  private static getVareiaPrefixWidth(
    noteElement: NoteElement,
    pageSetup: PageSetup,
  ) {
    return noteElement.vareia
      ? this.getNeumeWidthFromCache(VocalExpressionNeume.Vareia, pageSetup) +
          noteElement.vareiaInternalSpacing
      : 0;
  }

  private static getTextWidthFromCache(
    element: NoteElement,
    textOverride: string | null = null,
    trimLeadingPunctuation: boolean = false,
    trimTrailingPunctuation: boolean = false,
  ) {
    // The note's lyric font is resolved once per pass in
    // precomputeNoteGeometry; re-resolving it here would put the full
    // style-chain walk on the per-measurement hot path.
    const font = element.lyricsFontCss;

    let text = textOverride ?? element.lyrics;

    if (trimLeadingPunctuation) {
      const match = text.match(/^\p{P}+/u);
      text = match ? match[0] : '';
    }

    if (trimTrailingPunctuation) {
      const match = text.match(/\p{P}+$/u);
      text = match ? match[0] : '';
    }

    if (text === '') {
      return 0;
    }

    const fontVariantCaps = element.computedLyricsFontVariantCaps;
    const key = `${text} | ${font} | ${fontVariantCaps}`;

    let width = textWidthCache.get(key);

    if (width == null) {
      width = TextMeasurementService.getTextWidth(text, font, fontVariantCaps);

      textWidthCache.set(key, width);
    }

    return width;
  }

  private static getLyricsFontBoundingBoxDescentFromCache(
    element: NoteElement,
  ) {
    const font = element.lyricsFontCss;

    const key = font;

    let descent = fontBoundingBoxDescentCache.get(key);

    if (descent == null) {
      descent = TextMeasurementService.getFontBoundingBoxDescent(font);

      fontBoundingBoxDescentCache.set(key, descent);
    }

    return descent;
  }

  private static getLyricsFontHeightFromCache(font: string) {
    const key = font;

    let height = fontHeightCache.get(key);

    if (height == null) {
      height = TextMeasurementService.getFontHeight(font);

      fontHeightCache.set(key, height);
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
      NoteElement | MartyriaElement | TempoElement | TextBoxElement | null =
      null;

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
          NoteElement | MartyriaElement | TempoElement | TextBoxElement;
        nextElement = null;
      } else {
        finalElement = line.elements[line.elements.length - 1] as
          NoteElement | MartyriaElement | TempoElement | TextBoxElement;
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

const highRootSignMap = new Map<RootSign, RootSign>();

for (const [key, value] of lowRootSignMap) {
  highRootSignMap.set(value, key);
}

// Scales whose base root sign is a per-note table lookup. The chromatic scales
// derive their base root sign separately in getRootSign via note parity.
const scaleRootSignMaps = new Map<Scale, Map<number, RootSign>>([
  [Scale.Diatonic, diatonicRootSignMap],
  [Scale.Zygos, zygosRootSignMap],
  [Scale.Kliton, klitonRootSignMap],
  [Scale.Spathi, spathiKeRootSignMap],
  [Scale.SpathiGa, spathiGaRootSignMap],
  [Scale.EnharmonicGa, enharmonicGaRootSignMap],
  [Scale.EnharmonicVou, enharmonicVouRootSignMap],
  [Scale.EnharmonicVouHigh, enharmonicVouHighRootSignMap],
  [Scale.EnharmonicZoHigh, enharmonicZoHighRootSignMap],
  [Scale.EnharmonicZo, enharmonicZoRootSignMap],
]);

// Scales that shift to a fixed anchor note. The chromatic and diatonic
// scales are handled separately in getShift.
const scaleShiftAnchorMap = new Map<Scale, ScaleNote>([
  [Scale.Kliton, ScaleNote.Thi],
  [Scale.Zygos, ScaleNote.Thi],
  [Scale.Spathi, ScaleNote.Ke],
  [Scale.SpathiGa, ScaleNote.Ga],
  [Scale.EnharmonicGa, ScaleNote.Ga],
  [Scale.EnharmonicVou, ScaleNote.Vou],
  [Scale.EnharmonicVouHigh, ScaleNote.VouHigh],
  [Scale.EnharmonicZo, ScaleNote.Zo],
  [Scale.EnharmonicZoHigh, ScaleNote.ZoHigh],
]);

// The three fthora slots on a note (primary, secondary, tertiary) share the
// carry and apply logic in calculateMartyriae. Their selection and field
// accessors identify the slot-specific state.
const noteFthoraSlots: Array<{
  selection: NeumeSelection;
  getFthora: (note: NoteElement) => Fthora | null;
  setFthora: (note: NoteElement, fthora: Fthora | null) => void;
  getCarry: (note: NoteElement) => Fthora | null;
  setCarry: (note: NoteElement, fthora: Fthora | null) => void;
  getChromaticFthoraNote: (note: NoteElement) => ScaleNote | null;
}> = [
  {
    selection: NeumeSelection.Primary,
    getFthora: (note) => note.fthora,
    setFthora: (note, fthora) => {
      note.fthora = fthora;
    },
    getCarry: (note) => note.fthoraCarry,
    setCarry: (note, fthora) => {
      note.fthoraCarry = fthora;
    },
    getChromaticFthoraNote: (note) => note.chromaticFthoraNote,
  },
  {
    selection: NeumeSelection.Secondary,
    getFthora: (note) => note.secondaryFthora,
    setFthora: (note, fthora) => {
      note.secondaryFthora = fthora;
    },
    getCarry: (note) => note.secondaryFthoraCarry,
    setCarry: (note, fthora) => {
      note.secondaryFthoraCarry = fthora;
    },
    getChromaticFthoraNote: (note) => note.secondaryChromaticFthoraNote,
  },
  {
    selection: NeumeSelection.Tertiary,
    getFthora: (note) => note.tertiaryFthora,
    setFthora: (note, fthora) => {
      note.tertiaryFthora = fthora;
    },
    getCarry: (note) => note.tertiaryFthoraCarry,
    setCarry: (note, fthora) => {
      note.tertiaryFthoraCarry = fthora;
    },
    getChromaticFthoraNote: (note) => note.tertiaryChromaticFthoraNote,
  },
];

// The ordered list of optional marks shared by the shaped-width and collision
// paths. Each path adds or excludes its own special cases separately.
const noteMarkSlots: Array<{
  neume: (note: NoteElement) => Neume | null;
  offsetX: (note: NoteElement) => number | null;
  offsetY: (note: NoteElement) => number | null;
}> = [
  {
    neume: (note) => (note.stavros ? VocalExpressionNeume.Cross_Top : null),
    offsetX: (note) => note.stavrosOffsetX,
    offsetY: (note) => note.stavrosOffsetY,
  },
  {
    neume: (note) => note.vocalExpressionNeume,
    offsetX: (note) => note.vocalExpressionNeumeOffsetX,
    offsetY: (note) => note.vocalExpressionNeumeOffsetY,
  },
  {
    neume: (note) => note.timeNeume,
    offsetX: (note) => note.timeNeumeOffsetX,
    offsetY: (note) => note.timeNeumeOffsetY,
  },
  {
    neume: (note) => (note.koronis ? TimeNeume.Koronis : null),
    offsetX: (note) => note.koronisOffsetX,
    offsetY: (note) => note.koronisOffsetY,
  },
  {
    neume: (note) => note.gorgonNeume,
    offsetX: (note) => note.gorgonNeumeOffsetX,
    offsetY: (note) => note.gorgonNeumeOffsetY,
  },
  {
    neume: (note) => note.secondaryGorgonNeume,
    offsetX: (note) => note.secondaryGorgonNeumeOffsetX,
    offsetY: (note) => note.secondaryGorgonNeumeOffsetY,
  },
  {
    neume: (note) => note.fthora,
    offsetX: (note) => note.fthoraOffsetX,
    offsetY: (note) => note.fthoraOffsetY,
  },
  {
    neume: (note) => note.secondaryFthora,
    offsetX: (note) => note.secondaryFthoraOffsetX,
    offsetY: (note) => note.secondaryFthoraOffsetY,
  },
  {
    neume: (note) => note.tertiaryFthora,
    offsetX: (note) => note.tertiaryFthoraOffsetX,
    offsetY: (note) => note.tertiaryFthoraOffsetY,
  },
  {
    neume: (note) => note.accidental,
    offsetX: (note) => note.accidentalOffsetX,
    offsetY: (note) => note.accidentalOffsetY,
  },
  {
    neume: (note) => note.secondaryAccidental,
    offsetX: (note) => note.secondaryAccidentalOffsetX,
    offsetY: (note) => note.secondaryAccidentalOffsetY,
  },
  {
    neume: (note) => note.tertiaryAccidental,
    offsetX: (note) => note.tertiaryAccidentalOffsetX,
    offsetY: (note) => note.tertiaryAccidentalOffsetY,
  },
  {
    neume: (note) => (note.noteIndicator ? note.noteIndicatorNeume : null),
    offsetX: (note) => note.noteIndicatorOffsetX,
    offsetY: (note) => note.noteIndicatorOffsetY,
  },
  {
    neume: (note) => note.ison,
    offsetX: (note) => note.isonOffsetX,
    offsetY: (note) => note.computedIsonOffsetY,
  },
  {
    neume: (note) => note.measureNumber,
    offsetX: (note) => note.measureNumberOffsetX,
    offsetY: (note) => note.measureNumberOffsetY,
  },
];
