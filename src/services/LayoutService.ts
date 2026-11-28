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
  RichTextBoxElement,
  RichTextFootnoteMarker,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import {
  ElementType,
  FootnoteAnchorElement,
  isAutomaticBreakProhibited,
  isBlockElement,
  isKeepWithNextActive,
  isRightAlignedMartyria,
  isTieNeume,
  LineBreakType,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
} from '@/models/Element';
import type { Footer } from '@/models/Footer';
import type { Footnote } from '@/models/Footnote';
import type { Header } from '@/models/Header';
import type {
  InitialMartyriaAmbitusLayout,
  InitialMartyriaLayout,
  InitialMartyriaRunLayout,
  InitialMartyriaSeparatorLayout,
  InitialMartyriaWordSpaceFont,
} from '@/models/InitialMartyriaLayout';
import {
  getInitialMartyriaContext,
  getInitialMartyriaFixedSeparatorSize,
  getInitialMartyriaSeparatorAfter,
  getInitialMartyriaSeparatorBefore,
  type InitialMartyriaSeparator,
  resolveInitialMartyriaStyle,
  resolveModeKeyInitialMartyriaStyle,
} from '@/models/InitialMartyriaResolver';
import {
  getInitialMartyriaNoteAppearance,
  type InitialMartyriaAppearance,
  type InitialMartyriaPitchNote,
  type InitialMartyriaStyle,
  type ResolvedInitialMartyriaRun,
  type ResolvedInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
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
  runningElaphronNeumes,
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
  getTextBoxParagraphStyleFallbackId,
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
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { assignMissingElementIds } from '@/models/Workspace';
import {
  FOOTNOTE_OVERFLOW_BOTTOM_PADDING,
  FOOTNOTE_OVERFLOW_NOTICE_HEIGHT,
  footnoteBodyGutter,
  footnoteBodyMarkerGap,
  footnoteMarkerFont,
  footnoteMarkerStyle,
  footnoteMarkerText,
  footnotePageSetup,
  positionFootnoteMarker,
  resolveFootnoteSpacing,
} from '@/services/FootnoteLayout';
import { needsFootnoteSettlement } from '@/services/FootnoteReferences';
import {
  elementFootnoteIds,
  orderedFootnotes,
} from '@/services/FootnoteService';
import {
  NeumeMappingService,
  type SbmuflGlyphName,
} from '@/services/NeumeMappingService';
import { FOOTNOTE_CLASS } from '@/services/RichTextFootnotes';
import { TATWEEL } from '@/utils/constants';
import { deepEquals } from '@/utils/deepEquals';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import type { ResolvedFontStyle } from '@/utils/fontStyle';
import { resolveFontCss, resolveFontStyle } from '@/utils/fontStyle';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { accumulate, now, profile, startSpan } from '@/utils/layoutProfiler';
import { lowRootSignMap } from '@/utils/NeumeUtils';
import type { ResolvedPageMargins } from '@/utils/PageMargins';
import { resolvePageMargins } from '@/utils/PageMargins';
import { getLastEmbeddedModeKey } from '@/utils/richTextModeKeys';
import { getFirstRunningMarker } from '@/utils/runningMarkers';
import { Unit } from '@/utils/Unit';

import { fontService } from './FontService';
import { automaticFootnoteMarker } from './FootnoteMarker';
import {
  getInitialMartyriaGlyphFontSize,
  getInitialMartyriaNeumeBaselineCorrection,
  getInitialMartyriaPitchTrailingGlueWidth,
  glyphText,
  measureInitialMartyriaPitchGeometry,
  resolveInitialMartyriaAccessoryLayout,
} from './InitialMartyriaPitchMeasurementService';
import { measureInitialMartyriaStackedCharacters } from './InitialMartyriaStackedCharactersMeasurementService';
import {
  getLyricsBaseline,
  getLyricsTop,
  includeLyricsInLineHeight,
} from './LyricsLayout';
import type { MelismaSyllables } from './MelismaHelperGreek';
import { MelismaHelperGreek } from './MelismaHelperGreek';
import { ModeKeyMetricsService } from './ModeKeyMetricsService';
import { buildContentPages } from './rendering/buildContentPages';
import {
  type InkBounds,
  TextMeasurementService,
} from './TextMeasurementService';

const textWidthCache = new Map<string, number>();
const neumeWidthCache = new Map<string, number>();
const noteInkBoundsCache = new Map<string, InkBounds>();
// Collision boxes depend only on a note's glyphs and the font data, which, as
// for the caches above, does not change for a given family. The cached boxes
// are frozen so that a caller that mutates them fails instead of corrupting
// later layouts.
const noteCollisionGlyphBoxesCache = new Map<string, readonly NoteGlyphBox[]>();
const idealMaxAdjustmentRatio = 1;
const adjustmentRatioCapStep = 0.05;
const maxAdjustmentRatioSearchLimit = 4096;
const maxAdjustmentRatioSearchIterations = 24;
// A small positive lower bound for stretch budgets. Under the preferred
// adjustment-ratio cap of 1, each glue raised to this floor grows by at most
// this amount. A relaxed cap can multiply the contribution.
const minGlueStretch = 0.1;
const minGlueShrink = 0;
// Pixel tolerance for geometry reconstructed after line positioning.
const melismaGeometryTolerance = 1e-9;
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

const runningElaphronSet = new Set(runningElaphronNeumes);

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
  lyricsBaseline: number;
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

export interface MusicalContext {
  note: number;
  scale: Scale;
  shift: number;
}

interface CompletedParagraph {
  diagnostics: LineLayoutDiagnostics[] | null;
  paragraph: InputItem[];
  positions: PositionedItem[];
  ratios: number[];
  lineHeights: number[];
  dropCapWidthPx: number;
  dropCapContinuationLines: number;
}

// Phase 1 state that carries from one paragraph into the next. Everything
// else in the layout workspace is reset when a paragraph ends.
interface Phase1CarriedState {
  greekMelismaIsActive: boolean;
  greekMelismaSyllables: MelismaSyllables | null;
  pendingGreekPairEndPx: number | null;
  afterExplicitBreak: boolean;
  placementGreekMelismaIsActive: boolean;
  showPreviousLineHyphen: boolean;
}

// One paragraph built by Phase 1: the element range that produced it, the
// carried state on entry and exit, and the broken paragraph.
interface PreparedParagraph {
  startIndex: number;
  endIndex: number;
  entry: Phase1CarriedState;
  exit: Phase1CarriedState;
  completed: CompletedParagraph;
  leadingHyphen: LeadingHyphen;
}

// Phase 1 reserves space for a hyphen before a note from the previous note.
interface LeadingHyphen {
  offset: number;
  width: number;
}

interface ContentLine {
  paragraph: CompletedParagraph;
  paragraphLineIndex: number;
  height: number;
  positions: { position: PositionedItem; index: number }[];
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

interface MelismaCenteringPlan {
  phase1Centered: boolean;
}

interface AtomicMelismaLayout {
  boundaries: Map<
    NoteElement,
    { width: number; protected: boolean; followsAtomicPrefix: boolean }
  >;
  centeringPlans: Map<NoteElement, MelismaCenteringPlan>;
  potentiallyCenteredGroupEndNotes: Set<NoteElement>;
}

type LayoutInput = Pick<Workspace, 'score' | 'nextId'>;
interface LinePlacement {
  line: Line;
  page: number;
  lineNumber: number;
  top: number;
  // How far a bar transferred to the first note moved it left.
  reservation: number;
}

interface PreviousLayout {
  paragraphs: PreparedParagraph[];
  elements: ScoreElement[];
  placements: Map<CompletedParagraph, LinePlacement[]>;
  musicalEntries: Map<ScoreElement, MusicalContext>;
  // The musical context at each footnote reference.
  footnoteContexts: Map<ScoreElement, MusicalContext>;
  // Each footnote's own objects and body elements, so a change to a body
  // element removed since is still recognized.
  footnoteObjects: Map<object, Footnote>;
}

type PreparationRange = Pick<PreparedParagraph, 'entry' | 'leadingHyphen'> & {
  start: number;
  end: number;
};

type LayoutStatus =
  | 'reused'
  | 'initial'
  | 'forced full'
  | 'footnote settlement'
  | 'locked lyrics'
  | 'diagnostics'
  | 'range unavailable'
  | 'bulk edit';

export interface LayoutReuseResult {
  status: LayoutStatus;
  prepared: number;
  totalParagraphs: number;
  postprocessedPages: number;
  boundaryParagraphs: number;
  shiftedLines: number;
  // Shifted lines that changed page, by direction, and those whose page
  // parity changed (facing margins).
  linesToLaterPage: number;
  linesToEarlierPage: number;
  parityChangedLines: number;
  // Elements the musical pass walked, or null for the whole score.
  musicalSpanElements: number | null;
  duration: number;
}

type LayoutOptions = LayoutDiagnosticsOptions & {
  incremental?: {
    changes: ReadonlySet<object> | null;
    forceFull?: boolean;
    report?: (result: LayoutReuseResult) => void;
  };
  provisionalFootnoteWidths?: boolean;
  breaksBefore?: ReadonlySet<ScoreElement>;
  onOverflowBreak?: (
    boundary: ScoreElement,
    elements: ScoreElement[],
    excess: number,
  ) => void;
};

export class LayoutService {
  private static readonly previousLayouts = new WeakMap<
    LayoutInput,
    PreviousLayout
  >();

  private static getPreparationRange(
    previous: PreviousLayout,
    elements: ScoreElement[],
    first: number,
    last: number,
  ): PreparationRange | null {
    const paragraph = previous.paragraphs[first];
    const start = paragraph.startIndex;
    const oldEnd = previous.paragraphs[last].endIndex + 1;
    const end = oldEnd + elements.length - previous.elements.length;
    if (
      start >= end ||
      (start > 0 && elements[start - 1] !== previous.elements[start - 1]) ||
      elements[end] !== previous.elements[oldEnd]
    ) {
      return null;
    }
    return {
      start,
      end,
      entry: paragraph.entry,
      leadingHyphen: paragraph.leadingHyphen,
    };
  }

  private static getLeadingHyphen(element: ScoreElement | undefined) {
    return element instanceof NoteElement
      ? {
          offset: element.leadingLyricHyphenOffset,
          width: element.leadingLyricHyphenReservationWidth,
        }
      : { offset: 0, width: 0 };
  }

  // An undefined element is the start of the score.
  private static endsParagraph(
    element: ScoreElement | undefined,
    next: ScoreElement | null,
  ) {
    return (
      element === undefined ||
      element.lineBreak ||
      element.pageBreak ||
      isBlockElement(element) ||
      isBlockElement(next) ||
      isRightAlignedMartyria(element) ||
      (this.isFillWidthElement(element) && !isRightAlignedMartyria(next))
    );
  }

  private static getFootnoteObjects(score: Score) {
    const objects = new Map<object, Footnote>();
    for (const footnote of score.footnotes) {
      objects.set(footnote, footnote);
      objects.set(footnote.staff, footnote);
      objects.set(footnote.staff.elements, footnote);
      for (const element of footnote.staff.elements) {
        objects.set(element, footnote);
      }
    }
    return objects;
  }

  // Footnote bodies are prepared in full on every pass, and they reach the
  // main staff only through pagination. A body change therefore stands for
  // its reference, whose paragraph gives the pass a range. The footnote list
  // changes only together with the references that add or remove an entry.
  private static getMainStaffChanges(
    changes: ReadonlySet<object>,
    score: Score,
    references: ReturnType<typeof orderedFootnotes>,
    footnoteObjects: Map<object, Footnote>,
    previousFootnoteObjects: Map<object, Footnote>,
  ): ReadonlySet<object> {
    if (footnoteObjects.size === 0 && previousFootnoteObjects.size === 0) {
      return changes;
    }
    const referenceById = new Map(
      references.map(({ footnote, reference }) => [footnote.id, reference]),
    );
    const result = new Set<object>();
    for (const changed of changes) {
      if (changed === score.footnotes) {
        continue;
      }
      const footnote =
        footnoteObjects.get(changed) ?? previousFootnoteObjects.get(changed);
      if (footnote === undefined) {
        result.add(changed);
        continue;
      }
      // An unreferenced body is not laid out.
      const reference = referenceById.get(footnote.id);
      if (reference !== undefined) {
        result.add(reference);
      }
    }
    return result;
  }

  // Elements before `start` and the last `suffixLength` elements are the
  // same in both layouts, or null if a change is not a staff element.
  private static getChangedRange(
    previous: PreviousLayout,
    elements: ScoreElement[],
    changes: Iterable<object>,
  ) {
    let start = previous.elements.length;
    let suffixLength = previous.elements.length;
    for (const changed of changes) {
      if (changed === elements) {
        continue;
      }
      if (!(changed instanceof ScoreElement)) {
        return null;
      }
      const index = changed.index;
      const oldIndex =
        previous.elements[index] === changed
          ? index
          : previous.elements.indexOf(changed);
      const newIndex = elements[index] === changed ? index : -1;
      if (oldIndex === -1 && newIndex === -1) {
        return null;
      }
      if (oldIndex >= 0) {
        start = Math.min(start, oldIndex);
        suffixLength = Math.min(
          suffixLength,
          previous.elements.length - oldIndex - 1,
        );
      }
      if (newIndex >= 0) {
        start = Math.min(start, newIndex);
        suffixLength = Math.min(suffixLength, elements.length - newIndex - 1);
      }
    }
    if (suffixLength === previous.elements.length) {
      return null;
    }
    return { start, suffixLength };
  }

  // The mode-key spans that contain the changed elements, from the reset
  // before them (or the score start) up to the next reset after them.
  private static getMusicalSpan(
    elements: ScoreElement[],
    { start, suffixLength }: { start: number; suffixLength: number },
  ) {
    let first = Math.min(start, elements.length) - 1;
    while (first > 0 && !this.resetsMusicalState(elements[first])) {
      first--;
    }
    let end = elements.length - suffixLength;
    while (end < elements.length && !this.resetsMusicalState(elements[end])) {
      end++;
    }
    return { start: Math.max(first, 0), end };
  }

  // Runs the musical pass over the changed mode-key spans only. Everything
  // outside them, including paragraph entry and footnote contexts, is kept
  // from the previous layout.
  private static calculateMusicalSpan(
    previous: PreviousLayout,
    elements: ScoreElement[],
    pageSetup: PageSetup,
    span: { start: number; end: number },
    musicalEntries: Map<ScoreElement, MusicalContext>,
    changedAmbitus: ModeKeyElement[],
  ) {
    const kept = (element: ScoreElement, end: number) =>
      elements[element.index] === element &&
      (element.index < span.start || element.index >= end);
    // The span records the checkpoint at its end.
    for (const [element, context] of previous.musicalEntries) {
      if (kept(element, span.end + 1)) {
        musicalEntries.set(element, context);
      }
    }
    // A later span's first element and the one before it are unchanged, so
    // its first checkpoint keeps its recorded entry. A reset ignores it. A
    // span at the score start starts from the default, since its first
    // element may have moved there, as when the opening mode key is deleted.
    const contexts = this.calculateMartyriae(
      elements,
      pageSetup,
      span.start === 0
        ? undefined
        : previous.musicalEntries.get(elements[span.start]),
      { musicalEntries, changedAmbitus },
      span,
    );
    for (const [element, context] of previous.footnoteContexts) {
      if (kept(element, span.end)) {
        contexts.set(element, context);
      }
    }
    return contexts;
  }

  private static findEditedParagraphs(
    previous: PreviousLayout,
    elements: ScoreElement[],
    changedRange: { start: number; suffixLength: number },
    musicalEntries: Map<ScoreElement, MusicalContext>,
    changedAmbitus: ModeKeyElement[],
  ) {
    // Mode keys whose ambitus changed are staff elements, so they only widen
    // the range.
    const ambitusRange = this.getChangedRange(
      previous,
      elements,
      changedAmbitus,
    );
    const start = Math.min(changedRange.start, ambitusRange?.start ?? Infinity);
    const suffixLength = Math.min(
      changedRange.suffixLength,
      ambitusRange?.suffixLength ?? Infinity,
    );
    let end = previous.elements.length - suffixLength;
    for (const [element, oldContext] of previous.musicalEntries) {
      const current = musicalEntries.get(element);
      if (current !== undefined && !deepEquals(current, oldContext)) {
        const oldIndex =
          element.index + (previous.elements.length - elements.length);
        if (oldIndex >= end && previous.elements[oldIndex] === element) {
          end = oldIndex + 1;
        }
      }
    }
    const delta = elements.length - previous.elements.length;
    const paragraphs = previous.paragraphs;
    let first = paragraphs.findIndex(
      (paragraph) => paragraph.endIndex >= start,
    );
    if (first === -1) {
      first = paragraphs.length - 1;
    }
    if (first < 0) {
      return null;
    }
    let boundaryParagraphs = 0;
    // A changed first element can change the previous paragraph's last glue,
    // its transferred bar, or the implicit break itself.
    if (first > 0 && paragraphs[first].startIndex === start) {
      const before = elements[start - 1];
      const following = elements[start] ?? null;
      const oldFollowing = previous.elements[start];
      const crossesNoteBoundary =
        (before instanceof NoteElement ||
          this.isMelismaContinuationElement(before)) &&
        (following instanceof NoteElement ||
          oldFollowing instanceof NoteElement);
      const transfersLeftBar =
        before instanceof NoteElement &&
        (following?.elementType === ElementType.Martyria ||
          oldFollowing.elementType === ElementType.Martyria);
      if (
        !this.endsParagraph(before, following) ||
        crossesNoteBoundary ||
        transfersLeftBar
      ) {
        first--;
        boundaryParagraphs++;
      }
    }

    let last = first;
    while (last + 1 < paragraphs.length) {
      const boundary = paragraphs[last].endIndex + 1;
      if (boundary >= end) {
        const nextIndex = boundary + delta;
        const next = elements[nextIndex];
        if (
          next === previous.elements[boundary] &&
          this.endsParagraph(elements[nextIndex - 1], next)
        ) {
          break;
        }
      }
      last++;
    }
    return { first, last, boundaryParagraphs };
  }

  public static processPages(
    workspace: LayoutInput,
    options?: LayoutOptions,
  ): Page[] {
    return profile('processPages', () =>
      this.processPagesUnprofiled(workspace, options),
    );
  }

  private static processPagesUnprofiled(
    workspace: LayoutInput,
    options?: LayoutOptions,
  ): Page[] {
    const score = workspace.score;
    const pageSetup = score.pageSetup;
    const elements = score.staff.elements;
    const incremental = options?.incremental;
    const report = incremental?.report;
    const start = report === undefined ? 0 : performance.now();
    const previous = this.previousLayouts.get(workspace);
    // Any pass mutates layout fields in place. An interrupted or detached pass
    // must never leave an earlier record eligible for reuse.
    this.previousLayouts.delete(workspace);
    const musicalEntries = new Map<ScoreElement, MusicalContext>();
    const changedAmbitus: ModeKeyElement[] = [];
    // Why this pass is a full layout, or null while reuse is still possible.
    let status: LayoutStatus | null = incremental?.forceFull
      ? 'forced full'
      : score.staff.lyrics.locked
        ? 'locked lyrics'
        : options?.collectDiagnostics
          ? 'diagnostics'
          : incremental === undefined ||
              options?.breaksBefore?.size ||
              options?.onOverflowBreak !== undefined ||
              options?.provisionalFootnoteWidths
            ? 'range unavailable'
            : null;
    const trackReuse = status === null;

    let endPhase = startSpan('processPages.saveElementState');
    assignMissingElementIds(workspace);
    score.staves.forEach((staff) =>
      staff.elements.forEach((element, index) => {
        element.index = index;

        this.saveElementState(element);
        if (element instanceof FootnoteAnchorElement) {
          element.footnoteNumber = null;
          element.footnoteMarker = null;
          element.footnoteMarkerOffset = 0;
        }
      }),
    );

    score.headersAndFooters.forEach((element) => {
      this.saveElementState(element);
    });

    endPhase();
    endPhase = startSpan('processPages.orderFootnotes');
    const references = orderedFootnotes(score, true);
    const hasFootnoteReferences = references.length > 0;
    // Only a pass that records its layout needs the footnote index.
    const footnoteObjects = trackReuse
      ? this.getFootnoteObjects(score)
      : new Map<object, Footnote>();
    if (status === null && needsFootnoteSettlement(score)) {
      status = 'footnote settlement';
    } else if (status === null && previous === undefined) {
      status = 'initial';
    }
    // Only a pass that can still reuse the previous layout maps its changes.
    const changes =
      status === null && previous !== undefined && incremental?.changes
        ? this.getMainStaffChanges(
            incremental.changes,
            score,
            references,
            footnoteObjects,
            previous.footnoteObjects,
          )
        : null;
    if (changes !== null && changes.size > 64) {
      status = 'bulk edit';
    }
    const changedRange =
      status === null && previous !== undefined && changes?.size
        ? this.getChangedRange(previous, elements, changes)
        : null;
    endPhase();
    endPhase = startSpan('processPages.calculateMartyriae');
    const musicalSpan =
      changedRange && this.getMusicalSpan(elements, changedRange);
    const musicalContexts =
      musicalSpan !== null && previous !== undefined
        ? this.calculateMusicalSpan(
            previous,
            elements,
            pageSetup,
            musicalSpan,
            musicalEntries,
            changedAmbitus,
          )
        : this.calculateMartyriae(
            elements,
            pageSetup,
            undefined,
            trackReuse ? { musicalEntries, changedAmbitus } : undefined,
          );
    endPhase();
    endPhase = startSpan('processPages.prepareFootnotes');
    const footnotes = this.prepareFootnotes(
      workspace,
      musicalContexts,
      references,
      options,
    );
    endPhase();
    endPhase = startSpan('processPages.prepareContentLines');
    const cacheLayout = trackReuse;
    const edit =
      changedRange !== null && previous !== undefined
        ? this.findEditedParagraphs(
            previous,
            elements,
            changedRange,
            musicalEntries,
            changedAmbitus,
          )
        : null;

    // Avoid doing most of a full pass and then paying again on fallback.
    const preparationLimit = Math.ceil((previous?.paragraphs.length ?? 0) / 2);
    const prepare = (range?: PreparationRange) =>
      this.prepareContentLines(
        elements,
        pageSetup,
        score.paragraphStyles,
        score.initialMartyriaStyles,
        score.defaultInitialMartyriaStyleId,
        options,
        range,
      );

    let reuse: PreparationRange | null = null;
    let content: ReturnType<typeof prepare> | undefined;
    let prepared = 0;
    const delta = elements.length - (previous?.elements.length ?? 0);
    if (edit !== null && previous !== undefined) {
      const range =
        edit.last - edit.first + 1 > preparationLimit
          ? undefined
          : this.getPreparationRange(previous, elements, edit.first, edit.last);
      if (range === undefined) {
        status = 'bulk edit';
      } else if (range !== null) {
        const candidate = prepare(range);
        prepared += candidate.paragraphs.length;
        // The last note can write a leading hyphen onto the first note of the
        // following paragraph. While this or carried state differs from what
        // that paragraph was prepared with, prepare it too, continuing from
        // the state the range ends with.
        status = 'bulk edit';
        while (prepared <= preparationLimit) {
          const next = previous.paragraphs[edit.last + 1];
          const exit = candidate.paragraphs.at(-1)!.exit;
          if (
            next === undefined ||
            (deepEquals(exit, next.entry) &&
              deepEquals(candidate.nextLeadingHyphen, next.leadingHyphen))
          ) {
            reuse = range;
            content = candidate;
            status = 'reused';
            break;
          }
          edit.last++;
          edit.boundaryParagraphs++;
          range.end = next.endIndex + 1 + delta;
          const added = prepare({
            start: next.startIndex + delta,
            end: range.end,
            entry: exit,
            leadingHyphen: candidate.nextLeadingHyphen,
          });
          prepared += added.paragraphs.length;
          this.appendPreparedContent(candidate, added);
        }
      }
    }
    if (content === undefined) {
      content = prepare();
      prepared += content.paragraphs.length;
    }
    if (report !== undefined && trackReuse) {
      // endsParagraph restates the paragraph rules of prepareContentLines to
      // place the musical checkpoints. Catch any drift between the two.
      const unchecked = content.paragraphs.find(
        ({ startIndex }) => !musicalEntries.has(elements[startIndex]),
      );
      if (unchecked !== undefined) {
        throw new Error(
          `Paragraph at element ${unchecked.startIndex} has no musical checkpoint`,
        );
      }
    }
    let paragraphs = content.paragraphs;
    if (reuse !== null && edit !== null && previous !== undefined) {
      const suffix = previous.paragraphs.slice(edit.last + 1);
      paragraphs = [
        ...previous.paragraphs.slice(0, edit.first),
        ...paragraphs,
        ...(delta === 0
          ? suffix
          : suffix.map((paragraph) => ({
              ...paragraph,
              startIndex: paragraph.startIndex + delta,
              endIndex: paragraph.endIndex + delta,
            }))),
      ];
    }
    endPhase();
    endPhase = startSpan('processPages.headersAndFooters');
    const {
      neumeHeight,
      neumeLineHeight,
      lyricsBaseline,
      defaultLyricsFontCss,
      measureBarWidthMap,
    } = content;

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
        );
      }
    }

    endPhase();
    endPhase = startSpan('processPages.paginate');
    const contentLines = this.getContentLines(
      paragraphs.map((paragraph) => paragraph.completed),
    );
    const { above, below, thickness } = resolveFootnoteSpacing(pageSetup);
    const paginationLines = contentLines.map((candidate) => {
      const { paragraph, paragraphLineIndex } = candidate;
      const elements: ScoreElement[] = [];
      for (const { position } of candidate.positions) {
        const item = paragraph.paragraph[position.item];
        if (item.type === 'box' && 'element' in item) {
          elements.push((item as ElementBox).element);
        }
      }
      const reservedContinuationLines =
        paragraphLineIndex === 0 ? paragraph.dropCapContinuationLines : 0;
      // Reserve the full drop-cap height, but only group lines belonging to
      // its paragraph.
      const continuationLines = Math.min(
        reservedContinuationLines,
        paragraph.lineHeights.length - 1,
      );
      return {
        height: candidate.height,
        elements,
        footnoteIds: hasFootnoteReferences
          ? elements.flatMap(elementFootnoteIds)
          : [],
        chapterMarker: pageSetup.headerFooterDifferentChapterOpening
          ? getFirstRunningMarker(elements, 'chapter')
          : null,
        pageBreak: elements.at(-1)?.pageBreak ?? false,
        continuationLines,
        additionalHeight: this.getLineSpanHeight(
          paragraph.lineHeights,
          1,
          reservedContinuationLines,
          neumeLineHeight,
        ),
      };
    });
    const breaksBefore = new Set<number>();
    const groupStarts: number[] = [];
    const onOverflowBreak = options?.onOverflowBreak;
    if (options?.breaksBefore?.size || onOverflowBreak) {
      let groupStart = 0;
      let groupEnd = -1;
      for (const [index, line] of paginationLines.entries()) {
        if (index > groupEnd || paginationLines[index - 1]?.pageBreak) {
          groupStart = index;
          groupEnd = index + line.continuationLines;
        }
        groupStarts.push(groupStart);
        if (
          line.elements.some((element) => options?.breaksBefore?.has(element))
        ) {
          breaksBefore.add(groupStart);
        }
      }
    }
    const decisions = buildContentPages(
      paginationLines,
      new Map([...footnotes].map(([id, body]) => [id, body.height])),
      {
        innerPageHeight: pageSetup.innerPageHeight,
        footnoteSpacing: above + below + thickness,
        getReservation: (pageNumber, isChapterOpening) =>
          this.getExtraHeaderFooterHeight(
            score,
            pageSetup,
            pageNumber,
            isChapterOpening,
          ),
        breaksBefore,
        onOverflowBreak: onOverflowBreak
          ? (index, first, excess, groupEnd) => {
              const line = paginationLines[index];
              const boundary = line.elements[0];
              if (groupStarts[index] === index && boundary) {
                onOverflowBreak(
                  boundary,
                  paginationLines
                    .slice(first, groupEnd)
                    .flatMap((candidate) => candidate.elements),
                  excess,
                );
              }
            }
          : undefined,
      },
    );
    const findPlacement = (candidate: ContentLine) =>
      previous?.placements.get(candidate.paragraph)?.[
        candidate.paragraphLineIndex
      ];
    const placements = new Map<CompletedParagraph, LinePlacement[]>();
    const phasePages: Page[] = [];
    let phasePage: Page | undefined;
    let previousLine: Line | null = null;
    let shiftedLines = 0;
    let linesToLaterPage = 0;
    let linesToEarlierPage = 0;
    let parityChangedLines = 0;
    endPhase();
    endPhase = startSpan('processPages.positionLines');
    const pages: Page[] = [];
    for (const [index, decision] of decisions.entries()) {
      const page = new Page();
      page.physicalPageNumber = index + 1;
      page.contentTop =
        pageSetup.topMargin + decision.reservation.extraHeaderHeightPx;
      page.footnoteOverflow = decision.footnoteOverflow;
      const margins = resolvePageMargins(pageSetup, page.physicalPageNumber);
      for (const placement of decision.lines) {
        const candidate = contentLines[placement.index];
        const cached = reuse === null ? undefined : findPlacement(candidate);
        const top = page.contentTop + placement.top;
        const lineNumber = page.lines.length + 1;
        let line: Line;
        let reservation: number;
        if (
          cached !== undefined &&
          cached.page === page.physicalPageNumber &&
          cached.lineNumber === lineNumber &&
          cached.top === top
        ) {
          ({ line, reservation } = cached);
        } else {
          // A reused line that moved is re-placed, not prepared again.
          if (cached !== undefined) {
            shiftedLines++;
            const pageDelta = page.physicalPageNumber - cached.page;
            if (pageDelta > 0) {
              linesToLaterPage++;
            } else if (pageDelta < 0) {
              linesToEarlierPage++;
            }
            if (pageDelta % 2 !== 0) {
              parityChangedLines++;
            }
          }
          ({ line, reservation } = this.positionContentLine(
            candidate,
            pageSetup,
            margins,
            top,
            page.physicalPageNumber,
            lineNumber,
            previousLine,
            neumeLineHeight,
            lyricsBaseline,
            defaultLyricsFontCss,
            measureBarWidthMap,
            cached?.reservation ?? null,
          ));
        }
        this.transferLineStartBar(previousLine, line);
        if (cached === undefined && reuse !== null) {
          if (phasePage?.physicalPageNumber !== page.physicalPageNumber) {
            phasePage = new Page();
            phasePage.physicalPageNumber = page.physicalPageNumber;
            phasePages.push(phasePage);
          }
          phasePage.lines.push(line);
        }
        page.lines.push(line);
        if (cacheLayout) {
          let records = placements.get(candidate.paragraph);
          if (records === undefined) {
            records = [];
            placements.set(candidate.paragraph, records);
          }
          records.push({
            line,
            page: page.physicalPageNumber,
            lineNumber,
            top,
            reservation,
          });
        }
        previousLine = line;
      }
      pages.push(page);
    }

    // The positioned elements now have their physical page numbers.
    const assigned =
      hasFootnoteReferences && pageSetup.footnoteNumbering === 'page'
        ? orderedFootnotes(score)
        : references;
    const markerWidths = this.measureRichTextFootnoteMarkers(
      assigned,
      pageSetup,
      score.paragraphStyles,
      options?.provisionalFootnoteWidths ?? false,
    );
    const assignedById = new Map(
      assigned.map((entry) => [entry.footnote.id, entry]),
    );
    const markersByBox = new Map<
      ScoreElement,
      Record<string, RichTextFootnoteMarker>
    >();
    for (const { footnote, reference, number, marker } of assigned) {
      if (reference instanceof FootnoteAnchorElement) {
        reference.footnoteNumber = number;
        reference.footnoteMarker = marker;
      } else {
        let markers = markersByBox.get(reference);
        if (markers === undefined) {
          markers = {};
          markersByBox.set(reference, markers);
        }
        markers[footnote.id] = {
          label: marker,
          width: markerWidths.get(footnote.id)!,
        };
      }
    }
    for (const [index, decision] of decisions.entries()) {
      if (decision.footnoteIds.length === 0) {
        continue;
      }
      pages[index].footnotes = decision.footnoteIds.map((id) => {
        const { reference, number, marker } = assignedById.get(id)!;
        return {
          id,
          number,
          marker,
          reference,
          lines: [],
          top: 0,
          height: footnotes.get(id)!.height,
          labelX: 0,
        };
      });
    }

    endPhase();
    endPhase = startSpan('processPages.centerMeasureBars');
    const postprocessPages = reuse === null ? pages : phasePages;
    this.centerMeasureBars(postprocessPages, pageSetup, measureBarWidthMap);
    endPhase();
    endPhase = startSpan('processPages.addMelismas');
    this.addMelismas(
      postprocessPages,
      pageSetup,
      defaultLyricsFontCss,
      measureBarWidthMap,
      content.atomicMelismaLayout.centeringPlans,
      content.blockedMelismaNotes,
      reuse !== null
        ? {
            following: elements[reuse.end] ?? null,
            greekIsActive: reuse.entry.placementGreekMelismaIsActive,
            greekSyllables: reuse.entry.greekMelismaSyllables,
            leadingHyphen: reuse.entry.showPreviousLineHyphen,
          }
        : undefined,
    );

    endPhase();
    endPhase = startSpan('processPages.alignIsonIndicators');
    if (pageSetup.alignIsonIndicators) {
      this.alignIsonIndicators(postprocessPages, pageSetup);
    }

    endPhase();
    endPhase = startSpan('processPages.footnoteBodies');
    const markerGap = footnoteBodyMarkerGap(score.paragraphStyles);
    for (const physicalPage of pages) {
      if (physicalPage.footnotes.length === 0) {
        continue;
      }
      const margins = resolvePageMargins(
        pageSetup,
        physicalPage.physicalPageNumber,
      );
      const decision = decisions[physicalPage.physicalPageNumber - 1];
      const bodiesHeight = physicalPage.footnotes.reduce(
        (sum, footnote) => sum + footnote.height,
        0,
      );
      let top =
        pageSetup.footnoteLocation === 'belowText'
          ? physicalPage.contentTop +
            decision.contentBottom +
            above +
            below +
            thickness
          : pageSetup.pageHeight -
            pageSetup.bottomMargin -
            decision.reservation.extraFooterHeightPx -
            bodiesHeight;
      if (physicalPage.footnoteOverflow) {
        // Invalid content stays editable below the physical page. Export rejects it.
        top =
          pageSetup.pageHeight +
          FOOTNOTE_OVERFLOW_NOTICE_HEIGHT +
          below +
          thickness;
        physicalPage.footnoteOverflowBottom =
          top + bodiesHeight + FOOTNOTE_OVERFLOW_BOTTOM_PADDING;
      }
      physicalPage.footnoteRuleTop = pageSetup.showFootnoteHorizontalRule
        ? top - below - thickness
        : null;
      physicalPage.footnoteRuleThickness = thickness;
      for (const body of physicalPage.footnotes) {
        const prepared = footnotes.get(body.id)!;
        const setup = footnotePageSetup(
          pageSetup,
          prepared.gutter,
          physicalPage.physicalPageNumber,
        );
        const bodyMargins = resolvePageMargins(
          setup,
          physicalPage.physicalPageNumber,
        );
        body.top = top;
        body.labelX = pageSetup.melkiteRtl
          ? margins.contentRight - prepared.gutter + markerGap
          : margins.contentLeft + prepared.gutter - markerGap;
        for (const candidate of prepared.lines) {
          const previousBodyLine = body.lines.at(-1) ?? null;
          const { line } = this.positionContentLine(
            candidate,
            setup,
            bodyMargins,
            top,
            physicalPage.physicalPageNumber,
            body.lines.length + 1,
            previousBodyLine,
            prepared.content.neumeLineHeight,
            prepared.content.lyricsBaseline,
            prepared.content.defaultLyricsFontCss,
            prepared.content.measureBarWidthMap,
          );
          this.transferLineStartBar(previousBodyLine, line);
          body.lines.push(line);
          line.footnoteId = body.id;
          top += candidate.height;
        }
        // An empty body has no lines but still reserves its label line.
        top = body.top + body.height;
        const bodyPage = new Page();
        bodyPage.physicalPageNumber = physicalPage.physicalPageNumber;
        bodyPage.lines = body.lines;
        this.centerMeasureBars(
          [bodyPage],
          setup,
          prepared.content.measureBarWidthMap,
        );
        this.addMelismas(
          [bodyPage],
          setup,
          prepared.content.defaultLyricsFontCss,
          prepared.content.measureBarWidthMap,
          prepared.content.atomicMelismaLayout.centeringPlans,
          prepared.content.blockedMelismaNotes,
        );
        if (setup.alignIsonIndicators) {
          this.alignIsonIndicators([bodyPage], setup);
        }
      }
    }

    if (hasFootnoteReferences) {
      for (const page of pages) {
        for (const line of page.lines) {
          for (const [
            element,
            position,
          ] of this.getFootnoteMarkerPositionsForLine(
            line.elements,
            pageSetup,
            score.paragraphStyles,
            measureBarWidthMap,
          )) {
            element.footnoteMarkerOffset = position.left;
            element.footnoteMarkerTop = position.top;
          }
        }
      }
    }

    // Record element updates
    endPhase();
    endPhase = startSpan('processPages.checkElementState');
    score.staves.forEach((staff) =>
      staff.elements.forEach((element) => {
        if (
          staff === score.staff &&
          element.elementType === ElementType.RichTextBox
        ) {
          const box = element as RichTextBoxElement;
          const markers = markersByBox.get(element);
          if (
            markers !== undefined ||
            Object.keys(box.footnoteMarkers).length > 0
          ) {
            box.footnoteMarkers = markers ?? {};
          }
        }
        this.checkElementState(element);
      }),
    );

    score.headersAndFooters.forEach((element) => {
      this.checkElementState(element);
    });
    endPhase();

    if (content.layoutWorkspace.loggingEnabled) {
      console.log(
        'avg ratio',
        paragraphs
          .map((paragraph) => paragraph.completed)
          .flatMap((p) => p.ratios)
          .reduce((sum, ratio, _, arr) => sum + ratio / arr.length, 0),
      );
    }

    if (cacheLayout) {
      this.previousLayouts.set(workspace, {
        paragraphs,
        elements: elements.slice(),
        placements,
        musicalEntries,
        footnoteContexts: musicalContexts,
        footnoteObjects,
      });
    }
    report?.({
      status: status ?? 'range unavailable',
      prepared,
      totalParagraphs: paragraphs.length,
      postprocessedPages: postprocessPages.length,
      boundaryParagraphs: edit?.boundaryParagraphs ?? 0,
      shiftedLines,
      linesToLaterPage,
      linesToEarlierPage,
      parityChangedLines,
      musicalSpanElements: musicalSpan && musicalSpan.end - musicalSpan.start,
      duration: performance.now() - start,
    });
    return pages;
  }

  private static prepareFootnotes(
    workspace: LayoutInput,
    musicalContexts: Map<ScoreElement, MusicalContext>,
    references: ReturnType<typeof orderedFootnotes>,
    options?: LayoutDiagnosticsOptions,
  ) {
    const score = workspace.score;
    const gutter = footnoteBodyGutter(score.paragraphStyles);
    return new Map(
      references.map(({ footnote, reference }) => {
        if (
          footnote.staff.elements.some(
            (element) => elementFootnoteIds(element).length > 0,
          )
        ) {
          throw new Error('NESTED_FOOTNOTES_UNSUPPORTED');
        }
        const setup = footnotePageSetup(score.pageSetup, gutter, 1);
        this.calculateMartyriae(
          footnote.staff.elements,
          setup,
          musicalContexts.get(reference),
        );
        const content = this.prepareContentLines(
          footnote.staff.elements,
          setup,
          score.paragraphStyles,
          score.initialMartyriaStyles,
          score.defaultInitialMartyriaStyleId,
          options,
        );
        const lines = this.getContentLines(
          content.layoutWorkspace.completedParagraphs,
        );
        for (const line of lines) {
          const { paragraph, paragraphLineIndex } = line;
          if (paragraphLineIndex === paragraph.lineHeights.length - 1) {
            // Reserve any part of the drop cap below its last actual line.
            const missingLines = Math.max(
              0,
              paragraph.dropCapContinuationLines - paragraphLineIndex,
            );
            line.height += missingLines * content.neumeLineHeight;
          }
        }
        return [
          footnote.id,
          {
            content,
            lines,
            gutter,
            // An empty body still shows its label line.
            height:
              lines.length === 0
                ? this.getEmptyFootnoteHeight(score.paragraphStyles)
                : lines.reduce((sum, line) => sum + line.height, 0),
          },
        ] as const;
      }),
    );
  }

  private static getEmptyFootnoteHeight(paragraphStyles: ParagraphStyle[]) {
    const style = resolveParagraphStyle(
      paragraphStyles,
      BUILT_IN_PARAGRAPH_STYLE_IDS.FootnoteText,
    );
    const textHeight =
      style.lineHeight == null
        ? TextMeasurementService.getFontHeight(resolveFontCss(style))
        : style.fontSize * style.lineHeight;
    // The label's marker renders with line-height 1 and may be larger than
    // the footnote text.
    return Math.max(
      textHeight,
      footnoteMarkerStyle(paragraphStyles, 'body').fontSize,
    );
  }

  private static getContentLines(
    paragraphs: CompletedParagraph[],
  ): ContentLine[] {
    return paragraphs.flatMap((paragraph) => {
      const lines: ContentLine[] = paragraph.lineHeights.map(
        (height, paragraphLineIndex) => ({
          paragraph,
          paragraphLineIndex,
          height,
          positions: [],
        }),
      );
      for (const [index, position] of paragraph.positions.entries()) {
        lines[position.line].positions.push({ position, index });
      }
      return lines;
    });
  }

  private static positionContentLine(
    candidate: ContentLine,
    pageSetup: PageSetup,
    resolvedMargins: ResolvedPageMargins,
    top: number,
    pageNumber: number,
    lineNumber: number,
    prevLine: Line | null,
    neumeLineHeight: number,
    lyricsBaseline: number,
    defaultLyricsFontCss: string,
    measureBarWidthMap: Map<MeasureBar, number>,
    // Re-place a line positioned by an earlier pass: write only its placement
    // and repeat the one-time line-start reservation's X offset.
    replacedReservation: number | null = null,
  ): { line: Line; reservation: number } {
    const { paragraph: completedParagraph, paragraphLineIndex } = candidate;
    const {
      paragraph,
      positions,
      ratios,
      diagnostics,
      lineHeights,
      dropCapWidthPx,
      dropCapContinuationLines,
    } = completedParagraph;
    const currentLine = new Line();
    let reservation = replacedReservation ?? 0;
    currentLine.adjustmentRatio = ratios[paragraphLineIndex]!;
    currentLine.diagnostics = diagnostics?.[paragraphLineIndex] ?? null;
    currentLine.paragraphEnd = paragraphLineIndex === lineHeights.length - 1;
    let centerOffsetPx = 0;
    for (const { index: posIndex, position } of candidate.positions) {
      const item = paragraph[position.item];
      if (item.type !== 'box') {
        continue;
      }
      const contentStart = pageSetup.melkiteRtl
        ? resolvedMargins.right
        : resolvedMargins.contentLeft;
      if (!('element' in item)) {
        continue;
      }
      const element = (item as ElementBox).element;
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

      element.y = top + marginTop;
      element.width = position.width;

      // Resolve the fill width after line breaking, up to the next
      // positioned item (such as a right-aligned martyria) or the line end.
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
          const nextItem = paragraph[nextPos.item];
          if (
            element.elementType === ElementType.RichTextBox &&
            !('element' in nextItem)
          ) {
            continue;
          }
          fillWidth = nextPos.xOffset - position.xOffset;
          break;
        }
        if (fillWidth == null) {
          const lineWidth =
            resolvedMargins.contentWidth - currentLine.indentation;
          fillWidth = lineWidth - position.xOffset;
        }
        element.width =
          element.elementType === ElementType.RichTextBox
            ? Math.max(0, fillWidth)
            : fillWidth;
      }

      element.line = lineNumber;
      element.page = pageNumber;

      this.adjustDropCapPosition(
        element,
        lineHeights,
        neumeLineHeight,
        lyricsBaseline,
      );

      // A left bar on the first element moves to the previous line in
      // transferLineStartBar.
      if (isFirstElementOnLine && replacedReservation !== null) {
        element.x -= replacedReservation;
      } else if (isFirstElementOnLine) {
        const previousElement = prevLine?.elements.at(-1);

        if (
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
              noteElement.computedMeasureBarLeftLeadingSpacing = leadingSpacing;
              noteElement.neumeWidth += reservedWidth;
              noteElement.lyricsHorizontalOffset += reservedWidth;
              element.x -= reservedWidth;
              reservation = reservedWidth;
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
        const nextPosition = positions[posIndex + 1];
        if (nextPosition?.line === position.line) {
          throw new Error(
            `Centered element must terminate its line: ${element.id ?? element.index}`,
          );
        }

        let centeredWidth = position.width;
        if (
          element.elementType === ElementType.RichTextBox &&
          this.isFillWidthElement(element)
        ) {
          // Its line-breaking width is zero. Center the visible text with
          // the preceding music and keep equal space at both line ends.
          const box = element as RichTextBoxElement;
          const template = document.createElement('template');
          centeredWidth = Math.min(
            box.width,
            Math.max(
              ...[box.content, box.contentBottom].map((html) => {
                template.innerHTML = html;
                return this.measurePlainTextWidth(
                  template.content.textContent ?? '',
                  defaultLyricsFontCss,
                );
              }),
            ),
          );
          box.width = centeredWidth;
        }

        centerOffsetPx =
          (resolvedMargins.contentWidth -
            currentLine.indentation -
            (position.xOffset + centeredWidth)) /
          2;
        for (const lineElement of currentLine.elements) {
          lineElement.x += centerOffsetPx;
        }
      }
    }
    return { line: currentLine, reservation };
  }

  // If a line starts with a left bar, draw it at the end of the previous line.
  private static transferLineStartBar(previousLine: Line | null, line: Line) {
    const last = previousLine?.elements.at(-1);
    if (last?.elementType === ElementType.Note) {
      const bar = this.getMeasureBarTransferredFromLineStart(
        line.elements[0] ?? null,
      );
      if (bar !== null) {
        (last as NoteElement).computedMeasureBarRight = bar;
      }
    }
  }

  // Append the paragraphs prepared from where target's range ends. The other
  // fields are fixed per page setup or read only during preparation.
  private static appendPreparedContent(
    target: ReturnType<typeof LayoutService.prepareContentLines>,
    added: ReturnType<typeof LayoutService.prepareContentLines>,
  ) {
    target.paragraphs.push(...added.paragraphs);
    target.nextLeadingHyphen = added.nextLeadingHyphen;
    for (const note of added.blockedMelismaNotes) {
      target.blockedMelismaNotes.add(note);
    }
    for (const [note, plan] of added.atomicMelismaLayout.centeringPlans) {
      target.atomicMelismaLayout.centeringPlans.set(note, plan);
    }
  }

  // Build an independent content sequence before assigning it to physical pages.
  // All musical and paragraph state is local to this invocation.
  private static prepareContentLines(
    elements: ScoreElement[],
    pageSetup: PageSetup,
    paragraphStyles: ParagraphStyle[],
    initialMartyriaStyles: InitialMartyriaStyle[],
    defaultInitialMartyriaStyleId: string,
    options?: LayoutDiagnosticsOptions,
    range?: PreparationRange,
  ) {
    const start = range?.start ?? 0;
    const end = range?.end ?? elements.length;
    if (range !== undefined && elements[end] instanceof NoteElement) {
      elements = elements.slice();
      elements[end] = Object.assign(new NoteElement(), elements[end]);
    }
    const nextNote =
      elements[end] instanceof NoteElement ? elements[end] : null;
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

    // First, calculate some constants that will
    // be used later. This is so we don't unnecessarily
    // calculate them more than once during the loop.

    const neumeFont = this.getNeumeFont(pageSetup);

    const neumeHeight = TextMeasurementService.getFontHeight(neumeFont);

    const neumeAscent =
      TextMeasurementService.getFontBoundingBoxAscent(neumeFont);
    const defaultLyricsFontCss = this.getDefaultLyricsFont(paragraphStyles);

    const oligonMidpoint = fontService.getMetrics(
      pageSetup.neumeDefaultFontFamily,
    ).oligonMidpoint;

    const defaultLyricsFontMetrics =
      TextMeasurementService.getCachedFontVerticalMetrics(defaultLyricsFontCss);

    const lyricHeight = defaultLyricsFontMetrics.height;

    const lyricAscent = defaultLyricsFontMetrics.ascent;

    const lyricsBaseline = getLyricsBaseline(
      neumeHeight,
      pageSetup.lyricsVerticalOffset,
      lyricAscent,
    );

    // The expected height of a line containing only neumes
    const neumeLineHeight = includeLyricsInLineHeight(
      pageSetup.lineHeight,
      getLyricsTop(lyricsBaseline, lyricAscent),
      lyricHeight,
    );

    const measureBarWidthMap = this.getMeasureBarWidthMap(pageSetup);

    const noteWidthArgs: GetNoteWidthArgs = {
      lyricsBaseline,
      measureBarWidthMap,
      paragraphStyles: paragraphStyles,
    };

    const endGeometry = startSpan('prepareContentLines.noteGeometry');
    this.precomputeNoteGeometry(
      elements,
      pageSetup,
      noteWidthArgs,
      start,
      end + (nextNote === null ? 0 : 1),
    );
    const firstElement = elements[start];
    if (range !== undefined && firstElement instanceof NoteElement) {
      firstElement.leadingLyricHyphenOffset = range.leadingHyphen.offset;
      firstElement.leadingLyricHyphenReservationWidth =
        range.leadingHyphen.width;
    }
    endGeometry();
    const endMelismas = startSpan('prepareContentLines.melismas');
    const greekMelismaPairs = this.prepareGreekMelismaPairs(
      elements,
      pageSetup,
      measureBarWidthMap,
      start,
      end,
      range?.entry.greekMelismaIsActive,
    );

    const atomicMelismaLayout = this.prepareAtomicMelismaLayout(
      elements,
      pageSetup,
      measureBarWidthMap,
      start,
      end,
    );

    endMelismas();

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
    const endParagraphs = startSpan('prepareContentLines.paragraphs');
    // Adjacent note boundaries share a note. Its collision inputs are fixed
    // during encoding, so only retain the last note's boxes.
    let collisionNote: NoteElement | null = null;
    let collisionBoxes: readonly NoteGlyphBox[] = [];
    const getCollisionBoxes = (note: NoteElement) => {
      if (note !== collisionNote) {
        collisionBoxes = this.getCachedNoteCollisionGlyphBoxes(
          note,
          pageSetup,
          measureBarWidthMap,
        );
        collisionNote = note;
      }
      return collisionBoxes;
    };
    // Measure each mode-key font once during this pass. A later pass can
    // then pick up newly loaded fonts.
    const modeKeyFontMetrics = new Map<
      string,
      ReturnType<typeof TextMeasurementService.getFontVerticalMetrics>
    >();
    const getModeKeyFontMetrics = (font: string) => {
      let metrics = modeKeyFontMetrics.get(font);
      if (metrics === undefined) {
        metrics = TextMeasurementService.getFontVerticalMetrics(font);
        modeKeyFontMetrics.set(font, metrics);
      }
      return metrics;
    };
    let phase1GreekMelismaIsActive = range?.entry.greekMelismaIsActive ?? false;
    let phase1GreekMelismaSyllables =
      range?.entry.greekMelismaSyllables ?? null;
    let pendingGreekPairEndPx = range?.entry.pendingGreekPairEndPx ?? null;
    // Orphaned continuation notes stay editable after an explicit break.
    let afterExplicitBreak = range?.entry.afterExplicitBreak ?? false;
    const blockedMelismaNotes = new Set<NoteElement>();
    let placementGreekMelismaIsActive =
      range?.entry.placementGreekMelismaIsActive ?? false;
    let showPreviousLineHyphen = range?.entry.showPreviousLineHyphen ?? false;
    const carriedState = (): Phase1CarriedState => ({
      greekMelismaIsActive: phase1GreekMelismaIsActive,
      greekMelismaSyllables: phase1GreekMelismaSyllables,
      pendingGreekPairEndPx,
      afterExplicitBreak,
      placementGreekMelismaIsActive,
      showPreviousLineHyphen,
    });
    const paragraphs: PreparedParagraph[] = [];
    let paragraphStartIndex = 0;
    let paragraphEntry = carriedState();
    const recordParagraph = (endIndex: number) => {
      paragraphs.push({
        startIndex: paragraphStartIndex,
        endIndex,
        entry: paragraphEntry,
        exit: carriedState(),
        leadingHyphen: this.getLeadingHyphen(elements[paragraphStartIndex]),
        completed: layoutWorkspace.completedParagraphs.at(-1)!,
      });
    };
    for (let i = start; i < end; i++) {
      if (layoutWorkspace.pendingParagraph.length === 0) {
        paragraphStartIndex = i;
        paragraphEntry = carriedState();
      }
      const element = elements[i];
      // Phase 2 shows a hyphen before the first note, even when that note
      // isn't the next element and Phase 1 reserved no space for it.
      showPreviousLineHyphen = false;
      if (this.isBreakElement(element)) {
        placementGreekMelismaIsActive = false;
        phase1GreekMelismaSyllables = null;
        pendingGreekPairEndPx = null;
      } else if (element.elementType === ElementType.Note) {
        if (afterExplicitBreak && this.isPartOfSameMelisma(element)) {
          blockedMelismaNotes.add(element as NoteElement);
        } else {
          afterExplicitBreak = false;
        }
      }
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
            paragraphStyles,
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
            richTextBoxElement.defaultLyricsFontHeight = lyricHeight;

            richTextBoxElement.defaultNeumeFontAscent = neumeAscent;

            richTextBoxElement.oligonMidpoint = oligonMidpoint;

            // The line breaker reserves no intrinsic width for fill boxes.
            elementWidthPx = richTextBoxElement.customWidth ?? 0;
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

          const resolvedInitialMartyriaStyle =
            resolveModeKeyInitialMartyriaStyle({
              element: modeKeyElement,
              paragraphStyles,
              initialMartyriaStyles,
              defaultInitialMartyriaStyleId,
            });
          this.layoutModeKey(
            modeKeyElement,
            pageSetup,
            resolvedInitialMartyriaStyle,
            false,
            getModeKeyFontMetrics,
          );
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
          const elementWidthPx = noteElement.neumeWidth;

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
          //   box(B_i)             note width
          //   penalty(cost, w_i)   candidate breakpoint
          //   glue(m_i, s^+, s^-)  same-line spacing that vanishes at breaks
          //   glue(a_i, 0, 0)      fixed spaceAfter that also vanishes at breaks
          //
          // This is the ordinary note-to-note form. Before a martyria, the
          // note's post-break glue is fixed because the martyria path replaces
          // it and supplies the boundary elasticity.
          //
          // m_i is the preferred same-line width. For ordinary note-to-note
          // boundaries, visual, measure-bar, lyric, and melisma minima are
          // preferred widths. Greek vowel clearance
          // also caps shrink so justification cannot remove that clearance.
          //
          // At a break, both post-break glues become leading glue on the next
          // line and are skipped by positionItems, so m_i, its elasticity, and
          // a_i disappear. L_{i+1} then protects the left edge of the next
          // line, and the penalty width w_i reserves break-only space for the
          // right projection, melisma overhang, and measure-bar transfers.
          // Terminal right-barline clearance is also reserved when the current
          // note's barline remains at line end.
          //
          // m_i usually starts from
          // s_0 + R_i - T_i^left - T_i^right + ell_i, then is raised to any
          // larger preferred visual, measure-bar, lyric, or carried-melisma
          // width. When a carried melisma ends at a centered lyric with a
          // positive left projection, the base starts at 0 if that lyric
          // begins a melisma Phase 1 centered, or if it begins no melisma and
          // the carried melisma is not hyphenated. See
          // calculateInterNoteSpacing.
          // R_i is the right projection, ell_i is the lyric-collision
          // correction, T_i^left is the absorbed portion of L_{i+1}, and
          // T_i^right is the portion of R_i that tucks under the next neume.
          // For hyphenated melismas,
          // ell_i also enforces that the visible lyric gap is wide enough to
          // hold the hyphen glyph when that hyphen is absorbed inside the
          // current neume and therefore contributes no overhang. m_i may also
          // stay negative when the user requests overlapping notes and no real
          // collision, lyric, or barline width requirement binds.
          //
          // If a paragraph ends immediately after a note, endParagraph moves
          // that note's trailing reservation (right projection, melisma
          // overhang, or terminal barline clearance) into the finishing glue,
          // because the trailing glue is removed. If a martyria replaces that
          // trailing glue, the martyria path preserves any remaining melisma
          // overhang and required terminal barline clearance there instead.
          // Ordinary note-to-martyria lyric collision still goes through
          // addLyricReservation.
          const greekPairEnd = greekMelismaPairs.get(noteElement);
          const isGreekPairEnd =
            greekMelismaPairs.get(elements[i - 1] as NoteElement) ===
            noteElement;
          const generatedBounds =
            noteElement.lyrics.length === 0 &&
            noteElement.isMelisma &&
            !isGreekPairEnd &&
            phase1GreekMelismaSyllables != null
              ? this.getGreekRepetitionBounds(
                  noteElement,
                  greekPairEnd,
                  this.getTextWidthFromCache(
                    noteElement,
                    phase1GreekMelismaSyllables.middle,
                  ),
                  pageSetup,
                  measureBarWidthMap,
                )
              : null;
          const projections = this.getLyricProjections(
            noteElement,
            noteElement.alignLeft,
          );
          const leftProjection = Math.max(
            projections.leftProjection,
            -(generatedBounds?.left ?? 0),
          );
          const rightProjection = projections.rightProjection;

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

          let greekRepetitionEndPx: number | null = null;
          if (noteElement.lyrics.length > 0) {
            const previousElement = elements[i - 1];
            const text =
              previousElement?.elementType === ElementType.DropCap
                ? `${(previousElement as DropCapElement).content}${noteElement.lyrics}`
                : noteElement.lyrics;
            phase1GreekMelismaSyllables =
              !pageSetup.disableGreekMelismata &&
              noteElement.isMelismaStart &&
              MelismaHelperGreek.isGreek(noteElement.lyrics)
                ? MelismaHelperGreek.getMelismaSyllable(text)
                : null;
            if (greekPairEnd != null) {
              pendingGreekPairEndPx = lyricsEnd;
            }
          } else if (isGreekPairEnd) {
            greekRepetitionEndPx = pendingGreekPairEndPx;
            pendingGreekPairEndPx = null;
          } else if (generatedBounds != null) {
            const end = layoutWorkspace.neumesEndPx + generatedBounds.right;
            if (greekPairEnd != null) {
              pendingGreekPairEndPx = end;
            } else {
              greekRepetitionEndPx = end;
            }
          } else {
            phase1GreekMelismaSyllables = null;
          }

          const neumeEnd =
            layoutWorkspace.neumesEndPx + elementWidthPx + inlineSpacing;

          layoutWorkspace.lyricsEndPx = noteElement.isMelismaStart
            ? neumeEnd
            : lyricsEnd;

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
              lyricsEnd + hyphenWidthForThisElement;
          } else if (!noteElement.isMelisma) {
            layoutWorkspace.melismaLyricsEndPx = null;
          }

          // The note box width (unchanged by the bar transfer).
          this.addBox(noteElement.neumeWidth, noteElement, layoutWorkspace);

          const nextNoteElement = this.getNoteIfPresentAt(elements, i + 1);
          const afterNextNoteElement = this.getNoteIfPresentAt(elements, i + 2);
          const nextGeneratedBounds =
            !this.endsMelismaAtExplicitBreak(noteElement) &&
            greekPairEnd == null &&
            nextNoteElement != null &&
            nextNoteElement.lyrics.length === 0 &&
            nextNoteElement.isMelisma &&
            phase1GreekMelismaSyllables != null
              ? this.getGreekRepetitionBounds(
                  nextNoteElement,
                  greekMelismaPairs.get(nextNoteElement),
                  this.getTextWidthFromCache(
                    nextNoteElement,
                    phase1GreekMelismaSyllables.middle,
                  ),
                  pageSetup,
                  measureBarWidthMap,
                )
              : null;
          const greekBoundaryMinimumWidth =
            this.getGreekMelismaBoundaryMinimumWidth(
              greekRepetitionEndPx ??
                (nextGeneratedBounds != null ? lyricsEnd : null),
              nextNoteElement,
              layoutWorkspace.neumesEndPx,
              pageSetup.lyricsMinimumSpacing,
              noteElement.spaceAfter,
              nextGeneratedBounds?.left,
            );
          let nextLeadingLyricHyphenReservation = 0;
          if (nextNoteElement != null) {
            nextNoteElement.leadingLyricHyphenOffset = 0;
            nextNoteElement.leadingLyricHyphenReservationWidth = 0;
          }
          if (
            noteElement.isHyphen &&
            !noteElement.pageBreak &&
            !blockedMelismaNotes.has(noteElement) &&
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
          showPreviousLineHyphen =
            !noteElement.pageBreak &&
            !blockedMelismaNotes.has(noteElement) &&
            this.mayShowLeadingLyricHyphen(
              noteElement,
              pageSetup,
              placementGreekMelismaIsActive,
            );
          placementGreekMelismaIsActive = this.getGreekMelismaIsActiveAfterNote(
            noteElement,
            pageSetup,
            placementGreekMelismaIsActive,
          );
          phase1GreekMelismaIsActive =
            LayoutService.getGreekMelismaIsActiveAfterNote(
              noteElement,
              pageSetup,
              phase1GreekMelismaIsActive,
            );

          const melismaBoundary =
            atomicMelismaLayout.boundaries.get(noteElement);
          const isInsideAtomicMelismaPrefix =
            melismaBoundary?.protected ?? false;
          const ordinaryBoundaryWidth =
            greekPairEnd != null
              ? this.getMelismaContinuationBoundaryWidth(
                  noteElement,
                  greekPairEnd,
                  pageSetup,
                  measureBarWidthMap,
                )
              : (melismaBoundary?.width ??
                this.calculateInterNoteSpacing(
                  noteElement,
                  rightProjection,
                  nextElement,
                  nextNoteElement,
                  nextNoteElement != null &&
                    (atomicMelismaLayout.centeringPlans.get(nextNoteElement)
                      ?.phase1Centered ??
                      false),
                  atomicMelismaLayout.potentiallyCenteredGroupEndNotes.has(
                    noteElement,
                  ),
                  layoutWorkspace,
                  minimumLyricGap,
                  measureBarWidthMap,
                  getCollisionBoxes,
                ));
          const m_i = Math.max(
            ordinaryBoundaryWidth,
            greekBoundaryMinimumWidth ?? -Infinity,
          );
          if (greekRepetitionEndPx != null) {
            // Reserve the vowel's overhang at a line end without adding its
            // clearance twice to the same-line boundary above.
            layoutWorkspace.melismaLyricsEndPx = Math.max(
              layoutWorkspace.melismaLyricsEndPx ?? -Infinity,
              greekRepetitionEndPx,
            );
          }

          // Combine the graded automatic penalties with the resolved absolute
          // constraint for this boundary, then clamp the total to MAX_COST.
          // An explicit break ends an atomic melisma group, so a prefix
          // boundary never carries one.
          const breakConstraint = this.getMelismaBreakConstraint(
            noteElement,
            nextElement,
            isInsideAtomicMelismaPrefix,
            greekPairEnd != null,
          );
          const breakCost = Math.min(
            MAX_COST,
            this.getBreakCost(
              noteElement,
              nextElement,
              afterNextNoteElement,
              melismaBoundary?.followsAtomicPrefix ?? false,
            ) + breakConstraint.cost,
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

          const postBreakGlue =
            greekPairEnd != null ||
            isInsideAtomicMelismaPrefix ||
            martyriaOwnsBoundaryGlue
              ? this.fixedGlue(m_i - nextLeadingLyricHyphenReservation)
              : this.createNotePostBreakGlue(
                  standardGlue,
                  m_i - nextLeadingLyricHyphenReservation,
                  greekBoundaryMinimumWidth == null
                    ? null
                    : greekBoundaryMinimumWidth -
                        nextLeadingLyricHyphenReservation,
                );

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
          const martyriaWidth = this.getMartyriaWidth(
            martyriaElement,
            pageSetup,
          );
          const elementWidthPx = martyriaWidth;
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
            measureBarWidthMap,
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
              measureBarWidthMap,
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
                  this.getElementRightInkOverhang(
                    previousNote,
                    pageSetup,
                    measureBarWidthMap,
                  ),
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
            this.addHSpace(
              this.getSpaceAfter(previousElement),
              layoutWorkspace,
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
          this.addBox(martyriaWidth, martyriaElement, layoutWorkspace);

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

          const elementWidthPx = this.getNeumeWidthFromCache(
            tempoElement.neume,
            pageSetup,
          );
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
            paragraphStyles,
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
        default:
          throw new Error(
            `Unhandled element type in layout service: ${elements[i].elementType}`,
          );
      }

      if (this.endsMelismaAtExplicitBreak(element)) {
        afterExplicitBreak = true;
        placementGreekMelismaIsActive = false;
        phase1GreekMelismaIsActive = false;
        phase1GreekMelismaSyllables = null;
        pendingGreekPairEndPx = null;
      }
      this.addHSpace(this.getSpaceAfter(elements[i]), layoutWorkspace);

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
        this.endParagraph(
          justifyLastLine,
          layoutWorkspace,
          measureBarWidthMap,
          neumeLineHeight,
          neumeHeight,
        );
        recordParagraph(i);
      }

      if (layoutWorkspace.diagnostics != null) {
        layoutWorkspace.diagnostics.currentOwner = null;
      }
    }

    // The last element did not end its paragraph.
    if (layoutWorkspace.pendingParagraph.length > 0) {
      this.endParagraph(
        false,
        layoutWorkspace,
        measureBarWidthMap,
        neumeLineHeight,
        neumeHeight,
      );
      recordParagraph(end - 1);
    }

    endParagraphs();

    return {
      layoutWorkspace,
      paragraphs,
      neumeHeight,
      neumeLineHeight,
      lyricsBaseline,
      defaultLyricsFontCss,
      measureBarWidthMap,
      atomicMelismaLayout,
      blockedMelismaNotes,
      nextLeadingHyphen: this.getLeadingHyphen(elements[end]),
    };
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

  // Finished-line obstacles use the rendered glyph origins, including barline
  // spacing. They are separate from the geometry used to break musical lines.
  private static getReferenceMarkerObstacles(
    element: ScoreElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ): NoteGlyphBox[] {
    const size = pageSetup.neumeDefaultFontSize;
    let boxes: NoteGlyphBox[];
    let width = element.width;
    if (
      element.elementType === ElementType.Note ||
      element.elementType === ElementType.Martyria
    ) {
      const owner = element as NoteElement | MartyriaElement;
      const isNote = element.elementType === ElementType.Note;
      const transferred =
        isNote &&
        owner.measureBarRight === null &&
        (owner as NoteElement).computedMeasureBarRight !== null;
      width =
        this.getMeasureBarOwnerWidth(owner) +
        (transferred ? 0 : owner.computedMeasureBarRightTrailingSpacing);
      boxes = isNote
        ? this.getNoteCollisionGlyphBoxes(
            owner as NoteElement,
            pageSetup,
            measureBarWidthMap,
          )
        : this.getMartyriaCollisionGlyphBoxes(
            owner as MartyriaElement,
            pageSetup,
          );
      for (const edge of ['left', 'right'] as const) {
        const bar =
          edge === 'left'
            ? this.getVisibleMeasureBarLeft(owner)
            : this.getVisibleMeasureBarRight(owner);
        if (bar === null) {
          continue;
        }
        const barWidth = measureBarWidthMap.get(bar)!;
        const offsetX = isNote
          ? this.emToPx(
              edge === 'left'
                ? (owner as NoteElement).measureBarLeftOffsetX
                : (owner as NoteElement).measureBarRightOffsetX,
              size,
            )
          : 0;
        const offsetY = isNote
          ? this.emToPx(
              edge === 'left'
                ? (owner as NoteElement).measureBarLeftOffsetY
                : (owner as NoteElement).measureBarRightOffsetY,
              size,
            )
          : pageSetup.martyriaVerticalOffset +
            (owner as MartyriaElement).verticalOffset;
        const x =
          edge === 'left'
            ? owner.computedMeasureBarLeftOffsetX + offsetX
            : this.getMeasureBarOwnerWidth(owner) -
              (transferred ? 0 : barWidth) +
              owner.computedMeasureBarRightTrailingSpacing +
              owner.computedMeasureBarRightOffsetX +
              offsetX;
        const stroke = pageSetup.measureBarDefaultStrokeWidth / 2;
        boxes.push(
          ...this.getGlyphCollisionBoxes(
            pageSetup.neumeDefaultFontFamily,
            NeumeMappingService.getMapping(bar).glyphName,
            x,
            offsetY,
            size,
          ).map((box) => ({
            left: box.left - stroke,
            right: box.right + stroke,
            top: box.top - stroke,
            bottom: box.bottom + stroke,
          })),
        );
      }
    } else if (element.elementType === ElementType.Tempo) {
      width = (element as TempoElement).neumeWidth;
      boxes = this.getGlyphCollisionBoxes(
        pageSetup.neumeDefaultFontFamily,
        NeumeMappingService.getMapping((element as TempoElement).neume)
          .glyphName,
        0,
        0,
        size,
      );
    } else {
      return [];
    }
    const x = pageSetup.melkiteRtl
      ? pageSetup.pageWidth - element.x - width
      : element.x;
    return boxes.map((box) => ({
      ...box,
      left: box.left + x,
      right: box.right + x,
      top: box.top + element.y,
      bottom: box.bottom + element.y,
    }));
  }

  // Shared by page layout and the positioning preview. Does not mutate elements.
  public static getFootnoteMarkerPositionsForLine(
    elements: ScoreElement[],
    pageSetup: PageSetup,
    paragraphStyles: ParagraphStyle[],
    measureBarWidthMap = this.getMeasureBarWidthMap(pageSetup),
  ) {
    const positions = new Map<
      FootnoteAnchorElement,
      ReturnType<typeof LayoutService.getFootnoteMarkerPosition>
    >();
    if (
      !elements.some(
        (element) =>
          element instanceof FootnoteAnchorElement &&
          element.footnoteMarker !== null,
      )
    ) {
      return positions;
    }
    const obstacles = elements.flatMap((element) =>
      this.getReferenceMarkerObstacles(element, pageSetup, measureBarWidthMap),
    );
    for (const element of elements) {
      if (
        element instanceof FootnoteAnchorElement &&
        element.footnoteMarker !== null
      ) {
        const x = pageSetup.melkiteRtl
          ? pageSetup.pageWidth -
            element.x -
            (element as NoteElement | MartyriaElement).neumeWidth
          : element.x;
        const position = this.getFootnoteMarkerPosition(
          element,
          pageSetup,
          paragraphStyles,
          element.footnoteMarker,
          obstacles.map((box) => ({
            ...box,
            left: box.left - x,
            right: box.right - x,
            top: box.top - element.y,
            bottom: box.bottom - element.y,
          })),
        );
        positions.set(element, position);
        obstacles.push({
          left: position.inkBox.left + x,
          right: position.inkBox.right + x,
          top: position.inkBox.top + element.y,
          bottom: position.inkBox.bottom + element.y,
        });
      }
    }
    return positions;
  }

  public static getFootnoteMarkerPosition(
    element: FootnoteAnchorElement,
    pageSetup: PageSetup,
    paragraphStyles: ParagraphStyle[],
    marker = element.footnoteMarker!,
    obstacles?: NoteGlyphBox[],
  ) {
    const context = this.createOverlayDiagnosticsContext(pageSetup);
    const size = pageSetup.neumeDefaultFontSize;
    let boxes: NoteGlyphBox[];
    let base: NoteGlyphBox[];
    if (element.elementType === ElementType.Note) {
      const noteBoxes = this.getNoteCollisionGlyphBoxes(
        element as NoteElement,
        pageSetup,
        context.measureBarWidthMap,
        null,
      );
      boxes = noteBoxes;
      base = noteBoxes.filter((box) => box.collisionKind === 'base');
    } else {
      boxes = this.getMartyriaCollisionGlyphBoxes(
        element as MartyriaElement,
        pageSetup,
      );
      base = boxes;
    }
    const { ink, style } = this.measureFootnoteMarker(
      marker,
      pageSetup,
      paragraphStyles,
    );
    const position = this.getFootnoteMarkerInkBox(
      element,
      pageSetup,
      base,
      obstacles ?? boxes,
      {
        width: ink.inkWidth,
        height: ink.inkAscent + ink.inkDescent,
        strokeWidth: style.strokeWidth,
      },
    );
    // Convert ink coordinates to the CSS text box (line-height: 1).
    const textLeft = position.left - ink.inkLeft;
    const markerBaseline =
      ink.fontAscent + (style.fontSize - ink.fontAscent - ink.fontDescent) / 2;
    return {
      inkBox: {
        left: position.left - style.strokeWidth / 2,
        right: position.right + style.strokeWidth / 2,
        top: position.top - style.strokeWidth / 2,
        bottom: position.bottom + style.strokeWidth / 2,
      },
      // Collision geometry is physical LTR; score elements use logical offsets.
      left: pageSetup.melkiteRtl
        ? (element as NoteElement | MartyriaElement).neumeWidth -
          textLeft -
          ink.advanceWidth
        : textLeft,
      top:
        position.top +
        ink.inkAscent -
        markerBaseline +
        context.neumeFontAscent +
        (context.neumeFontHeight - size) / 2,
    };
  }

  private static measureFootnoteMarker(
    marker: string,
    pageSetup: PageSetup,
    paragraphStyles: ParagraphStyle[],
  ) {
    const style = footnoteMarkerStyle(paragraphStyles);
    const ink = TextMeasurementService.getInkBounds(
      footnoteMarkerText(marker, pageSetup.footnoteReferenceParentheses),
      footnoteMarkerFont(paragraphStyles),
      style.fontVariantCaps ?? 'normal',
    );
    return { ink, style };
  }

  private static getFootnoteMarkerInkBox(
    element: FootnoteAnchorElement,
    pageSetup: PageSetup,
    base: NoteGlyphBox[],
    boxes: NoteGlyphBox[],
    metrics: { width: number; height: number; strokeWidth: number },
  ): NoteGlyphBox {
    const size = pageSetup.neumeDefaultFontSize;
    const { left, top } = positionFootnoteMarker(
      base,
      element.footnotePositionOverride ? [] : boxes,
      metrics.width,
      metrics.height,
      -size * 0.75,
      element.footnoteOffsetX * size,
      element.footnoteOffsetY * size,
      size * 0.08 + metrics.strokeWidth / 2,
    );
    return {
      left,
      right: left + metrics.width,
      top,
      bottom: top + metrics.height,
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
    const lines = text.split(/(?:\r\n|\r|\n)/g);
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

  private static measureRichTextFootnoteMarkers(
    references: ReturnType<typeof orderedFootnotes>,
    pageSetup: PageSetup,
    paragraphStyles: ParagraphStyle[],
    provisional: boolean,
  ) {
    const widths = new Map<string, number>();
    const richTextReferences = references.filter(
      ({ reference }) => reference.elementType === ElementType.RichTextBox,
    );
    if (richTextReferences.length === 0) {
      return widths;
    }

    // Use the same typography and browser shaping as the CKEditor widget.
    const sample = document.createElement('span');
    sample.className = FOOTNOTE_CLASS;
    sample.dir = 'auto';
    sample.style.position = 'absolute';
    sample.style.visibility = 'hidden';
    document.body.append(sample);
    try {
      const measured = new Map<string, number>();

      for (const {
        footnote,
        reference,
        number,
        marker,
      } of richTextReferences) {
        const style = resolveParagraphStyle(
          paragraphStyles,
          getTextBoxParagraphStyleFallbackId(
            (reference as RichTextBoxElement).inline,
          ),
        );
        const family = getFontFamilyWithFallback(style.fontFamily);
        const styleKey = JSON.stringify([family, style.fontSize]);
        const measure = (label: string) => {
          const key = JSON.stringify([styleKey, label]);
          let width = measured.get(key);
          if (width === undefined) {
            sample.textContent = label;
            width = sample.getBoundingClientRect().width;
            measured.set(key, width);
          }
          return width;
        };
        sample.style.setProperty('--footnote-reference-family', family);
        sample.style.setProperty(
          '--footnote-reference-size',
          `${style.fontSize}px`,
        );

        const label =
          provisional && number !== null
            ? automaticFootnoteMarker(pageSetup.firstFootnoteNumber, pageSetup)
            : marker;
        widths.set(footnote.id, measure(label));
      }
    } finally {
      sample.remove();
    }
    return widths;
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

  /**
   * Writes the typography and geometry a mode key renders with onto the
   * element, and returns the geometry for callers that also need its width.
   * Standalone keys share a compact allocation; embedded keys retain their
   * native font/ink allocation for the surrounding inline formatting context.
   */
  public static layoutModeKey(
    element: ModeKeyElement,
    pageSetup: PageSetup,
    resolvedStyle: ResolvedInitialMartyriaStyle,
    embedded = false,
    getFontMetrics = (font: string) =>
      TextMeasurementService.getFontVerticalMetrics(font),
  ) {
    const { primaryAppearance } = resolvedStyle;

    element.computedFontFamily = pageSetup.neumeDefaultFontFamily;
    element.computedFontSize = primaryAppearance.fontSize;
    element.computedColor = primaryAppearance.color;
    element.computedStrokeWidth = primaryAppearance.strokeWidth;

    const geometry = this.getInitialMartyriaGeometry(
      element,
      pageSetup,
      resolvedStyle,
      getFontMetrics,
    );

    if (!embedded) {
      const metrics = ModeKeyMetricsService.getMetrics(
        {
          resolvedStyle,
          neumeFontFamily: element.computedFontFamily,
          accessoryFontSize: geometry.layout.accessory.fontSize,
          accessoryBaselineOffset: geometry.layout.accessory.baselineOffset,
          tempoStrokeWidth: pageSetup.tempoDefaultStrokeWidth,
        },
        (template, optional) => {
          const sample = ModeKeyElement.createFromTemplate(template, optional);
          sample.computedFontFamily = element.computedFontFamily;
          sample.computedFontSize = primaryAppearance.fontSize;
          return this.getInitialMartyriaGeometry(
            sample,
            pageSetup,
            resolvedStyle,
            getFontMetrics,
          ).layout.inkBounds;
        },
      );
      geometry.top = -metrics.ascent;
      geometry.bottom = metrics.descent;
    }

    element.computedNeumeFontSize = geometry.neumeFontSize;
    element.computedTop = geometry.top;
    element.computedFlowTop = geometry.flowTop;
    element.computedInitialMartyriaLayout = geometry.layout;
    element.height = geometry.bottom - geometry.top;

    return geometry;
  }

  private static getInitialMartyriaGeometry(
    element: ModeKeyElement,
    pageSetup: PageSetup,
    resolvedStyle: ResolvedInitialMartyriaStyle,
    getFontMetrics: typeof TextMeasurementService.getFontVerticalMetrics,
  ) {
    const neumeFontFamily = element.computedFontFamily;
    const neumeFontSize = element.computedFontSize;
    const baseTextAppearance = resolvedStyle.primaryAppearance;
    const fixedSeparatorFontSize = baseTextAppearance.fontSize;
    const glyphFontSize = getInitialMartyriaGlyphFontSize(
      baseTextAppearance,
      neumeFontFamily,
    );
    const resolution = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedStyle,
      pageSetup,
      glyphFontSize,
    });
    const runs = resolution.runs;
    const fontMetrics = fontService.getMetrics(neumeFontFamily);
    const neumeBaselineCorrection = getInitialMartyriaNeumeBaselineCorrection({
      initialMartyriaBaseline: fontMetrics.initialMartyriaBaseline,
      glyphFontSize,
    });
    const accessory = resolveInitialMartyriaAccessoryLayout({
      glyphFontSize,
      neumeBaselineCorrection,
    });
    const baseFont = resolveFontCss(baseTextAppearance);
    const baseFontMetrics = getFontMetrics(baseFont);
    let top = -baseFontMetrics.ascent;
    let bottom = baseFontMetrics.descent;
    const inkBounds = { top: 0, bottom: 0 };
    const includeInk = (inkTop: number, inkBottom: number) => {
      inkBounds.top = Math.min(inkBounds.top, inkTop);
      inkBounds.bottom = Math.max(inkBounds.bottom, inkBottom);
      top = Math.min(top, inkTop);
      bottom = Math.max(bottom, inkBottom);
    };
    const flowFont = resolveFontCss({
      fontFamily: neumeFontFamily,
      fontStyle: DEFAULT_FONT_STYLE,
      fontSize: neumeFontSize,
    });
    let flowTop = -getFontMetrics(flowFont).ascent;
    let width = 0;

    // The text whose font a word space next to a run is set in.
    const getWordSpaceOwner = (
      run: ResolvedInitialMartyriaRun | undefined,
    ): InitialMartyriaAppearance | null => {
      if (run?.kind === 'startingPitch') {
        return run.noteText?.appearance ?? null;
      }
      if (run?.kind === 'text') {
        return run.appearance;
      }
      return null;
    };
    const getWordSpaceLayout = (
      appearance: InitialMartyriaAppearance,
    ): InitialMartyriaSeparatorLayout => {
      const wordSpaceFont: InitialMartyriaWordSpaceFont = {
        fontFamily: appearance.fontFamily,
        fontStyle: appearance.fontStyle,
        fontSize: appearance.fontSize,
      };
      return {
        kind: 'wordSpace',
        width: TextMeasurementService.getTextWidth(
          ' ',
          resolveFontCss(wordSpaceFont),
          appearance.fontVariantCaps,
        ),
        wordSpaceFont,
      };
    };
    // The separator in the slot before runs[index]; index === runs.length is
    // the slot after the last run.
    const getSeparatorLayout = (
      kind: InitialMartyriaSeparator,
      index: number,
    ): InitialMartyriaSeparatorLayout => {
      if (kind === 'none') {
        return { kind, width: 0, wordSpaceFont: null };
      }
      if (kind === 'wordSpace') {
        return getWordSpaceLayout(
          getWordSpaceOwner(runs[index - 1]) ??
            getWordSpaceOwner(runs[index]) ??
            baseTextAppearance,
        );
      }
      return {
        kind,
        width: getInitialMartyriaFixedSeparatorSize(fixedSeparatorFontSize),
        wordSpaceFont: null,
      };
    };

    const runLayouts: InitialMartyriaRunLayout[] = [];
    for (const [runIndex, run] of runs.entries()) {
      const separatorBefore = getSeparatorLayout(
        getInitialMartyriaSeparatorBefore(resolution, runIndex),
        runIndex,
      );
      width += separatorBefore.width;
      const appearance =
        run.kind === 'startingPitch'
          ? getInitialMartyriaNoteAppearance(run)
          : run.appearance;
      const { fontFamily, fontStyle, fontSize } = appearance;
      const strokeOverflow = appearance.strokeWidth / 2;

      if (run.kind === 'text' && run.content.layout === 'stackedCharacters') {
        const geometry = measureInitialMartyriaStackedCharacters(
          run.content.topCharacter,
          run.content.bottomCharacter,
          {
            fontFamily,
            fontStyle,
            fontSize,
            fontVariantCaps: appearance.fontVariantCaps,
            strokeWidth: appearance.strokeWidth,
          },
        );
        includeInk(geometry.top, geometry.bottom);
        flowTop = Math.min(flowTop, geometry.top);
        width += geometry.width;
        runLayouts.push({
          separatorBefore,
          fontSize,
          baselineShift: 0,
          stackedCharacters: {
            geometry,
            lineHeight: getFontMetrics(
              resolveFontCss({ fontFamily, fontStyle, fontSize }),
            ).height,
          },
          pitch: null,
        });
        continue;
      }

      if (run.kind === 'startingPitch') {
        const glyphAppearance = run.appearance;
        // The run is drawn in the glyph font, so its line box contributes to
        // the flow even when it holds no glyphs. The note names sit in flow on
        // the same baseline, so their text font's line box contributes too.
        const glyphFont = resolveFontCss(glyphAppearance);
        const noteTextFont = resolveFontCss({
          fontFamily,
          fontStyle,
          fontSize,
        });
        flowTop = Math.min(
          flowTop,
          -getFontMetrics(glyphFont).ascent,
          -getFontMetrics(noteTextFont).ascent,
        );
        // Glyph notes sit on the neume baseline like every other glyph; the
        // marks above them move with them.
        const noteBaselineShift =
          run.noteText == null ? -neumeBaselineCorrection : 0;
        const measureNote = (note: InitialMartyriaPitchNote | null) =>
          note == null
            ? null
            : measureInitialMartyriaPitchGeometry(
                note,
                run.noteText == null
                  ? glyphText(note.note, glyphAppearance.fontFamily)
                  : run.noteText.names[note.note],
                {
                  textFontFamily: fontFamily,
                  textFontStyle: fontStyle,
                  textFontSize: fontSize,
                  textFontVariantCaps: appearance.fontVariantCaps,
                  glyphFontFamily: glyphAppearance.fontFamily,
                  glyphFontStyle: glyphAppearance.fontStyle,
                  glyphFontSize: glyphAppearance.fontSize,
                  textStrokeWidth: appearance.strokeWidth,
                  glyphStrokeWidth: glyphAppearance.strokeWidth,
                },
              );
        const primary = measureNote(run.cluster.primary);
        const secondary = measureNote(run.cluster.secondary);
        for (const geometry of [primary, secondary]) {
          if (geometry == null) {
            continue;
          }
          const top = geometry.top - noteBaselineShift;
          includeInk(top, geometry.bottom - noteBaselineShift);
          flowTop = Math.min(flowTop, top);
          width += geometry.width;
        }
        const clusterSeparatorWidth = getInitialMartyriaFixedSeparatorSize(
          fixedSeparatorFontSize,
        );
        if (primary != null && secondary != null) {
          width += clusterSeparatorWidth;
        }
        const trailingGlueWidth = getInitialMartyriaPitchTrailingGlueWidth(
          glyphAppearance.fontFamily,
          glyphAppearance.fontSize,
        );
        const isTrailingQuantitativeNeume = (neume: Neume | undefined) =>
          neume === element.quantitativeNeumeRight ||
          neume === element.quantitativeNeumeRight2;
        const firstTrailingGlyph = run.cluster.trailingGlyphGroups[0]?.[0];
        const noteToTrailingWidth = isTrailingQuantitativeNeume(
          firstTrailingGlyph,
        )
          ? getWordSpaceLayout(getWordSpaceOwner(run) ?? baseTextAppearance)
              .width
          : trailingGlueWidth;
        const quantitativeTopOffset =
          fontMetrics.modeKeyQuantitativeBaseline * glyphAppearance.fontSize;
        const trailingGlyphTopOffsets: number[] = [];
        const glyphStrokeOverflow = glyphAppearance.strokeWidth / 2;
        for (const [
          groupIndex,
          group,
        ] of run.cluster.trailingGlyphGroups.entries()) {
          if (groupIndex > 0) {
            width += trailingGlueWidth;
          } else if (primary != null || secondary != null) {
            width += noteToTrailingWidth;
          }
          const trailingGlyphText = group
            .map((neume) => glyphText(neume, glyphAppearance.fontFamily))
            .join('');
          const trailingMetrics = TextMeasurementService.getTextMetrics(
            trailingGlyphText,
            glyphFont,
          );
          const topOffset = isTrailingQuantitativeNeume(group[0])
            ? quantitativeTopOffset
            : neumeBaselineCorrection;
          trailingGlyphTopOffsets.push(topOffset);
          includeInk(
            topOffset -
              trailingMetrics.actualBoundingBoxAscent -
              glyphStrokeOverflow,
            topOffset +
              trailingMetrics.actualBoundingBoxDescent +
              glyphStrokeOverflow,
          );
          width += trailingMetrics.width;
        }
        runLayouts.push({
          separatorBefore,
          fontSize: glyphAppearance.fontSize,
          baselineShift: 0,
          stackedCharacters: null,
          pitch: {
            textFontSize: fontSize,
            noteBaselineShift,
            primary,
            secondary,
            clusterSeparatorWidth,
            noteToTrailingWidth,
            trailingGlueWidth,
            trailingGlyphTopOffsets,
          },
        });
        continue;
      }

      const font = resolveFontCss({ fontFamily, fontStyle, fontSize });
      const text =
        run.kind === 'glyph'
          ? run.glyphs.map((neume) => glyphText(neume, fontFamily)).join('')
          : run.content.layout === 'inline'
            ? run.content.text
            : '';
      const metrics = TextMeasurementService.getTextMetrics(
        text,
        font,
        appearance.fontVariantCaps,
      );
      width += metrics.width;
      flowTop = Math.min(flowTop, -getFontMetrics(font).ascent);
      const glyphBaselineCorrection =
        run.kind === 'glyph' ? neumeBaselineCorrection : 0;
      includeInk(
        glyphBaselineCorrection -
          metrics.actualBoundingBoxAscent -
          strokeOverflow,
        glyphBaselineCorrection +
          metrics.actualBoundingBoxDescent +
          strokeOverflow,
      );
      runLayouts.push({
        separatorBefore,
        fontSize,
        baselineShift: -glyphBaselineCorrection,
        stackedCharacters: null,
        pitch: null,
      });
    }

    const trailingSeparator = getSeparatorLayout(
      getInitialMartyriaSeparatorAfter(resolution, runs.length - 1),
      runs.length,
    );
    width += trailingSeparator.width;

    if (element.tempo != null) {
      const tempoFont = resolveFontCss({
        fontFamily: neumeFontFamily,
        fontStyle: DEFAULT_FONT_STYLE,
        fontSize: accessory.fontSize,
      });
      const tempoMetrics = TextMeasurementService.getTextMetrics(
        glyphText(element.tempo, neumeFontFamily),
        tempoFont,
      );
      const tempoStrokeOverflow = pageSetup.tempoDefaultStrokeWidth / 2;
      includeInk(
        accessory.baselineOffset -
          tempoMetrics.actualBoundingBoxAscent -
          tempoStrokeOverflow,
        accessory.baselineOffset +
          tempoMetrics.actualBoundingBoxDescent +
          tempoStrokeOverflow,
      );
      width += accessory.tempoMarginLeft + tempoMetrics.width;
    }

    let ambitus: InitialMartyriaAmbitusLayout | null = null;
    if (element.showAmbitus) {
      const punctuationMetrics = TextMeasurementService.getTextMetrics(
        '(-)',
        baseFont,
        baseTextAppearance.fontVariantCaps,
      );
      const punctuationStrokeOverflow = baseTextAppearance.strokeWidth / 2;
      includeInk(
        -punctuationMetrics.actualBoundingBoxAscent - punctuationStrokeOverflow,
        punctuationMetrics.actualBoundingBoxDescent + punctuationStrokeOverflow,
      );

      const ambitusFont = resolveFontCss({
        fontFamily: neumeFontFamily,
        fontStyle: DEFAULT_FONT_STYLE,
        fontSize: accessory.fontSize,
      });
      const ambitusStrokeOverflow = pageSetup.martyriaDefaultStrokeWidth / 2;
      const ambitusBaseline = accessory.baselineOffset;
      const measureAmbitus = (neumes: Neume[]) =>
        TextMeasurementService.getTextMetrics(
          neumes.map((neume) => glyphText(neume, neumeFontFamily)).join(''),
          ambitusFont,
        );
      const lowMetrics = measureAmbitus([
        element.ambitusLowNote,
        element.ambitusLowRootSign,
      ]);
      const highMetrics = measureAmbitus([
        element.ambitusHighNote,
        element.ambitusHighRootSign,
      ]);
      for (const metrics of [lowMetrics, highMetrics]) {
        includeInk(
          ambitusBaseline -
            metrics.actualBoundingBoxAscent -
            ambitusStrokeOverflow,
          ambitusBaseline +
            metrics.actualBoundingBoxDescent +
            ambitusStrokeOverflow,
        );
      }
      // Pull each end note toward the parentheses so that 4px separates its
      // ink, rather than its advance box, from the punctuation.
      ambitus = {
        lowMarginLeft: 4 + lowMetrics.actualBoundingBoxLeft,
        highMarginRight:
          4 - (highMetrics.width - highMetrics.actualBoundingBoxRight),
      };
    }

    const layout: InitialMartyriaLayout = {
      inkBounds,
      resolution,
      primaryAppearance: baseTextAppearance,
      runs: runLayouts,
      trailingSeparator,
      accessory,
      ambitus,
    };

    return {
      bottom,
      flowTop,
      top,
      width,
      neumeFontSize: glyphFontSize,
      layout,
    };
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

  private static addHSpace(width: number, workspace: LayoutWorkspace) {
    if (width !== 0) {
      this.addGlue(this.fixedGlue(width), workspace, 'hspace');
    }
  }

  private static getSpaceAfter(element: ScoreElement | null) {
    if (
      element?.elementType === ElementType.Note ||
      element?.elementType === ElementType.Martyria ||
      element?.elementType === ElementType.Tempo
    ) {
      return (element as NoteElement | MartyriaElement | TempoElement)
        .spaceAfter;
    }

    return 0;
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
    const left = this.getMeasureBarLeftReserve(noteElement, measureBarWidthMap);
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
    const left = this.getMeasureBarLeftReserve(
      martyriaElement,
      measureBarWidthMap,
    );
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
    pageSetup: PageSetup,
    previousElement: ScoreElement | null,
  ): boolean {
    // Greek syllables stay centered on their own note. Shared pairs receive
    // their alignment separately; preserve the existing drop-cap placement.
    if (
      !pageSetup.disableGreekMelismata &&
      !pageSetup.melkiteRtl &&
      MelismaHelperGreek.isGreek(noteElement.lyrics) &&
      previousElement?.elementType !== ElementType.DropCap
    ) {
      return false;
    }
    // At an eligible melisma start, align the syllable left when its effective
    // lyric span exceeds the adjusted neume span.
    // NOTE: a syllable ending with a hyphen is only considered a melismatic note
    // if the next note is purely melismatic (i.e. the next note contains only a hyphen),
    // despite the unfortunate property name "isMelisma" being true.

    return (
      noteElement.isMelismaStart &&
      this.getUnpunctuatedLyricWidth(noteElement) >
        noteElement.neumeWidth - noteElement.lyricsHorizontalOffset &&
      (!noteElement.isHyphen ||
        (!this.endsMelismaAtExplicitBreak(noteElement) &&
          this.isPartOfSameMelisma(nextNoteElement)))
    );
  }

  private static prepareAtomicMelismaLayout(
    elements: ScoreElement[],
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    start = 0,
    end = elements.length,
  ): AtomicMelismaLayout {
    const layout: AtomicMelismaLayout = {
      boundaries: new Map(),
      centeringPlans: new Map(),
      potentiallyCenteredGroupEndNotes: new Set(),
    };

    if (pageSetup.melkiteRtl) {
      return layout;
    }

    for (let startIndex = start; startIndex < end; startIndex++) {
      const startElement = elements[startIndex];
      if (startElement.elementType !== ElementType.Note) {
        continue;
      }

      const startNote = startElement as NoteElement;
      if (!startNote.isMelismaStart || !startNote.alignLeft) {
        continue;
      }

      // addMelismas renders Greek melismas as repeated vowels rather than an
      // underscore, so their lyrics keep their existing layout.
      if (
        !pageSetup.disableGreekMelismata &&
        MelismaHelperGreek.isGreek(startNote.lyrics)
      ) {
        continue;
      }

      // Phase 2 permits melismas to cross a martyria, tempo, or inline text
      // box. Those elements have boundary geometry that is resolved while the
      // Knuth-Plass stream is built, including elastic glue and measure-bar
      // transfer. Mixed-element melismas intentionally remain left-aligned,
      // so do not apply the atomic centering rule to any segment of one.
      const containedLyricWidth =
        this.getCenteredMelismaContainedLyricWidth(startNote);
      const startQuantitativeNeumeOffset = this.getNoteBodyLeft(
        startNote,
        pageSetup,
        this.getMeasureBarLeftReserve(startNote, measureBarWidthMap),
      );

      const lyricRightFromStartQuantitativeNeume =
        this.getLyricTextRight(startNote, false) - startQuantitativeNeumeOffset;
      // Each group note and the preferred width of the boundary after it.
      const groupNotes: NoteElement[] = [];
      const groupBoundaryWidths: number[] = [];

      let note = startNote;
      let noteIndex = startIndex;
      let noteX = 0;
      let fullQuantitativeNeumeSpan = 0;
      let protectedBoundaryCount = 0;

      while (true) {
        groupNotes.push(note);
        fullQuantitativeNeumeSpan =
          noteX +
          note.neumeWidth -
          this.getFinalElementMeasureBarRightWidth(note, measureBarWidthMap) -
          startQuantitativeNeumeOffset;
        if (fullQuantitativeNeumeSpan < containedLyricWidth) {
          protectedBoundaryCount = groupNotes.length;
        }

        // An explicit break ends the group, so no prefix boundary carries one.
        if (this.endsMelismaAtExplicitBreak(note)) {
          break;
        }

        const nextElement = this.getElementAt(elements, noteIndex + 1);
        if (!this.isPartOfSameMelisma(nextElement)) {
          break;
        }

        const nextNote = nextElement as NoteElement;
        const boundaryWidth = this.getMelismaContinuationBoundaryWidth(
          note,
          nextNote,
          pageSetup,
          measureBarWidthMap,
        );
        groupBoundaryWidths.push(boundaryWidth);
        noteX += note.neumeWidth + note.spaceAfter + boundaryWidth;
        note = nextNote;
        noteIndex++;
      }

      if (
        !this.endsMelismaAtExplicitBreak(note) &&
        this.hasNonNoteMelismaContinuation(elements, noteIndex + 1)
      ) {
        continue;
      }
      const centeringPlan = { phase1Centered: false };
      layout.centeringPlans.set(startNote, centeringPlan);

      // Protect the boundary after each note whose span is still narrower
      // than the lyric, so the atomic run also includes the note after the
      // last such note. At preferred spacing, every permitted segment end
      // contains the centered lyric, including punctuation, unless the whole
      // group is too narrow. Negative spacing can narrow the span after it
      // first contains the lyric, so the first containing note is not enough.
      // When the whole group, which ends at the melisma's end or first
      // explicit break, is narrower than its lyric, every boundary is
      // protected.
      protectedBoundaryCount = Math.min(
        protectedBoundaryCount,
        groupBoundaryWidths.length,
      );

      for (let i = 0; i < groupBoundaryWidths.length; i++) {
        layout.boundaries.set(groupNotes[i], {
          width: groupBoundaryWidths[i],
          protected: i < protectedBoundaryCount,
          // Discourage the first legal break after the atomic prefix when
          // another continuation note follows, keeping the opening group together.
          followsAtomicPrefix:
            protectedBoundaryCount > 0 && i === protectedBoundaryCount,
        });
      }

      const lastNote = groupNotes[groupNotes.length - 1];

      // Reserve preferred clearance after groups likely to be centered.
      // Phase 2 still checks the actual space after justification.
      if (fullQuantitativeNeumeSpan < containedLyricWidth) {
        // The whole group is narrower than its lyric, so every internal
        // boundary is protected and fixed at its precomputed preferred
        // spacing, and the centered bounds are known before line breaking.
        // Represent those bounds during Phase 1 while retaining alignLeft
        // semantics, which keeps the lyric out of the internal melisma glue.
        startNote.lyricsHorizontalOffset =
          startQuantitativeNeumeOffset +
          this.getCenteredMelismaLyricTextLeft(
            startNote,
            fullQuantitativeNeumeSpan,
          );
        centeringPlan.phase1Centered = true;
        layout.potentiallyCenteredGroupEndNotes.add(lastNote);
      } else if (
        !startNote.isHyphen &&
        fullQuantitativeNeumeSpan - lyricRightFromStartQuantitativeNeume <
          pageSetup.lyricsMelismaCutoffWidth
      ) {
        layout.potentiallyCenteredGroupEndNotes.add(lastNote);
      }
    }

    return layout;
  }

  private static precomputeNoteGeometry(
    elements: ScoreElement[],
    pageSetup: PageSetup,
    noteWidthArgs: GetNoteWidthArgs,
    start = 0,
    end = elements.length,
  ) {
    // Most notes share a lyrics style, so resolve each distinct style and
    // override combination once per layout. Paragraph styles do not change
    // during a layout.
    const lyricsFonts = new Map<
      string,
      { css: string; fontVariantCaps: string; height: number }
    >();

    for (let i = start; i < end; i++) {
      const element = elements[i];
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
      const overrides = noteElement.getParagraphStyleOverrides();
      const lyricsFontKey = `${noteElement.lyricsParagraphStyleId}|${JSON.stringify(overrides)}`;
      let lyricsFont = lyricsFonts.get(lyricsFontKey);
      if (lyricsFont === undefined) {
        const resolvedLyricsStyle = resolveParagraphStyle(
          noteWidthArgs.paragraphStyles,
          noteElement.lyricsParagraphStyleId,
          overrides,
        );
        const css = resolveFontCss(resolvedLyricsStyle);
        lyricsFont = {
          css,
          fontVariantCaps: resolvedLyricsStyle.fontVariantCaps ?? 'normal',
          height:
            TextMeasurementService.getCachedFontVerticalMetrics(css).height,
        };
        lyricsFonts.set(lyricsFontKey, lyricsFont);
      }
      noteElement.lyricsFontCss = lyricsFont.css;
      noteElement.computedLyricsFontVariantCaps = lyricsFont.fontVariantCaps;
      noteElement.lyricsFontHeight = lyricsFont.height;
      this.getNoteWidth(noteElement, pageSetup, noteWidthArgs);
    }

    for (let i = start; i < end; i++) {
      const element = elements[i];
      if (element.elementType !== ElementType.Note) {
        continue;
      }

      const noteElement = element as NoteElement;
      noteElement.alignLeft = this.shouldAlignLeft(
        noteElement,
        this.getNoteIfPresentAt(elements, i + 1),
        pageSetup,
        i === 0 ? null : elements[i - 1],
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
    lineHeights: number[],
    neumeLineHeight: number,
    lyricsBaseline: number,
  ) {
    // Special logic to adjust drop caps. This aligns the bottom of the drop
    // cap with the lyrics baseline.
    if (element.elementType !== ElementType.DropCap) {
      return;
    }

    const dropCapElement = element as DropCapElement;

    const distanceFromTopToBottomOfLyrics =
      this.getLineSpanHeight(
        lineHeights,
        0,
        dropCapElement.computedLineSpan - 1,
        neumeLineHeight,
      ) + lyricsBaseline;

    const fontMetrics = TextMeasurementService.getCachedFontVerticalMetrics(
      dropCapElement.computedFont,
    );
    const adjustment = fontMetrics.ascent - distanceFromTopToBottomOfLyrics;

    if (dropCapElement.computedLineHeight == null) {
      dropCapElement.computedLineHeight =
        fontMetrics.height / dropCapElement.computedFontSize;
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
      // provide the space. Phase 1 may already have centered the lyric under
      // an atomic group while retaining alignLeft for this encoding. The
      // carried-melisma collision check handles overflow into the next lyric,
      // including one that begins another melisma.
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

  private static getUnpunctuatedLyricWidth(note: NoteElement) {
    return (
      note.lyricsWidth -
      note.lyricsLeadingPunctuationWidth -
      note.lyricsTrailingPunctuationWidth
    );
  }

  // The left edge of the rendered lyric text when it is centered beneath a
  // melisma's quantitative neumes, relative to the start quantitative neume.
  // Punctuation is excluded from the centered width.
  private static getCenteredMelismaLyricTextLeft(
    startNote: NoteElement,
    quantitativeNeumeSpan: number,
  ) {
    return (
      (quantitativeNeumeSpan - this.getUnpunctuatedLyricWidth(startNote)) / 2 -
      startNote.lyricsLeadingPunctuationWidth
    );
  }

  // The span needed to contain centered text and its uncentered punctuation.
  private static getCenteredMelismaContainedLyricWidth(note: NoteElement) {
    return (
      this.getUnpunctuatedLyricWidth(note) +
      2 *
        Math.max(
          note.lyricsLeadingPunctuationWidth,
          note.lyricsTrailingPunctuationWidth,
        )
    );
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

    // The carried state describes this pass. melismaText is written during
    // positioning and can still contain a vowel from an earlier layout.
    return !MelismaHelperGreek.isGreek(noteElement.lyrics);
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

  private static getStructuralInterNoteMinimumWidths(
    noteElement: NoteElement,
    nextNoteElement: NoteElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    inlineSpacing: number,
    leftTuck: number,
    getCollisionBoxes?: (note: NoteElement) => readonly NoteGlyphBox[],
  ) {
    const noteVisualMinimumWidth = this.getNoteVisualMinimumSpacing(
      noteElement,
      nextNoteElement,
      pageSetup,
      measureBarWidthMap,
      inlineSpacing,
      getCollisionBoxes,
    );
    // A zero visual minimum is the collision helper's generic lower clamp,
    // not a real geometry requirement when the user deliberately requests
    // negative spacing.
    const hasOnlyGenericVisualClamp =
      inlineSpacing < 0 && noteVisualMinimumWidth <= 0;
    // These helpers measure the total same-line distance between note boxes.
    // Inter-note glue excludes the following lyric's left projection, so
    // subtract its tuck to express the minima in glue coordinates.
    const visualMinimumWidth = hasOnlyGenericVisualClamp
      ? null
      : noteVisualMinimumWidth - leftTuck;
    const measureBarMinimumWidth = this.hasVisibleMeasureBarAtBoundary(
      noteElement,
      nextNoteElement,
    )
      ? this.getMeasureBarMinimumGlueWidth(
          noteElement,
          nextNoteElement,
          pageSetup,
          measureBarWidthMap,
        ) - leftTuck
      : null;

    return { measureBarMinimumWidth, visualMinimumWidth };
  }

  private static getMelismaContinuationBoundaryWidth(
    noteElement: NoteElement,
    nextNoteElement: NoteElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const inlineSpacing = this.getInlineSpacing(pageSetup);
    // A pure melisma continuation has no ordinary lyric projection. Its
    // preferred boundary is therefore the natural inline spacing raised only
    // by the same structural minima used by calculateInterNoteSpacing.
    const { measureBarMinimumWidth, visualMinimumWidth } =
      this.getStructuralInterNoteMinimumWidths(
        noteElement,
        nextNoteElement,
        pageSetup,
        measureBarWidthMap,
        inlineSpacing,
        0,
      );

    return Math.max(
      inlineSpacing,
      visualMinimumWidth ?? -Infinity,
      measureBarMinimumWidth ?? -Infinity,
    );
  }

  private static calculateInterNoteSpacing(
    noteElement: NoteElement,
    rightProjection: number,
    nextElement: ScoreElement | null,
    nextNoteElement: NoteElement | null,
    nextNoteStartsCenteredMelisma: boolean,
    noteEndsPotentiallyCenteredMelisma: boolean,
    workspace: LayoutWorkspace,
    minimumLyricGap: number,
    measureBarWidthMap: Map<MeasureBar, number>,
    getCollisionBoxes: (note: NoteElement) => readonly NoteGlyphBox[],
  ) {
    // Base m_i without the lyric-collision term ell_i. Can be
    // negative when T_i^left is large, i.e. when the cancellation
    // glue absorbs much of L_{i+1}. The library supports negative
    // glue widths.
    if (nextNoteElement == null) {
      const baseWidth =
        this.getInlineSpacing(workspace.pageSetup) + rightProjection;

      if (nextElement == null) {
        const terminalMeasureBarMinimum =
          this.getTerminalMeasureBarRightSpacing(
            noteElement,
            workspace.pageSetup,
            measureBarWidthMap,
          );

        return Math.max(baseWidth, terminalMeasureBarMinimum);
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
      return Math.max(baseWidth, measureBarMinimum);
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
    // The centered lyric may itself start a melisma only if Phase 1 has
    // already centered it beneath its group. That case applies after
    // hyphenated melismas too; a centered lyric that starts no melisma
    // requires a non-hyphenated carried melisma.
    const exitsMelismaIntoCenteredLyric =
      workspace.melismaLyricsEndPx != null &&
      ((noteElement.isMelisma && nextNoteStartsCenteredMelisma) ||
        (!noteElement.isHyphen &&
          !nextNoteElement.isMelisma &&
          !nextNoteElement.alignLeft)) &&
      leftProjection > 0;
    // On the same line, T_i^left absorbs whatever left projection the
    // next note actually has. At a break that width reappears via
    // glue(L_{i+1}).
    const leftTuck = leftProjection;
    const rightTuck = Math.min(rightProjection, nextOverhangs.left);
    const inlineSpacing = this.getInlineSpacing(workspace.pageSetup);
    const { measureBarMinimumWidth, visualMinimumWidth } =
      this.getStructuralInterNoteMinimumWidths(
        noteElement,
        nextNoteElement,
        workspace.pageSetup,
        measureBarWidthMap,
        inlineSpacing,
        leftTuck,
        getCollisionBoxes,
      );
    const ordinaryBaseWidth =
      inlineSpacing + rightProjection - leftTuck - rightTuck;

    // A centered lyric with a positive left projection after a carried
    // melisma starts at the current cursor, subject to the conditions on
    // exitsMelismaIntoCenteredLyric above. Fixed hspace is appended after
    // this automatically computed boundary width.
    // Collision and visual minima below can still increase this width.
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

    // The left-aligned Phase 1 lyric can end before the right edge of the
    // complete neume group. If that lyric will be centered in Phase 2, prevent
    // the following syllable from tucking into the portion of the group that
    // the centered lyric may occupy.
    const centeredMelismaFollowingLyricMinimumWidth =
      noteEndsPotentiallyCenteredMelisma && nextNoteElement.lyricsWidth > 0
        ? workspace.pageSetup.lyricsMinimumSpacing -
          leftTuck -
          this.getLyricTextLeft(nextNoteElement)
        : null;

    return Math.max(
      baseWidth,
      visualMinimumWidth ?? -Infinity,
      measureBarMinimumWidth ?? -Infinity,
      lyricMinimumWidth ?? -Infinity,
      melismaMinimumWidth ?? -Infinity,
      centeredMelismaFollowingLyricMinimumWidth ?? -Infinity,
    );
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
    getCollisionBoxes: (note: NoteElement) => readonly NoteGlyphBox[] = (
      note,
    ) => this.getNoteCollisionGlyphBoxes(note, pageSetup, measureBarWidthMap),
  ) {
    if (right == null) {
      return 0;
    }

    const leftBoxes = getCollisionBoxes(left);
    const rightBoxes = getCollisionBoxes(right);

    return this.getMinimumSpacingForNoteGlyphBoxes(
      left.neumeWidth,
      leftBoxes,
      rightBoxes,
      clearance,
    );
  }

  private static getMartyriaBoxWidth(martyriaElement: MartyriaElement) {
    return (
      martyriaElement.neumeWidth +
      martyriaElement.computedMeasureBarLeftLeadingSpacing +
      martyriaElement.quantitativeNeumeSpacing
    );
  }

  private static getMinimumSpacingForNoteGlyphBoxes(
    leftWidth: number,
    leftBoxes: readonly NoteGlyphBox[],
    rightBoxes: readonly NoteGlyphBox[],
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
          leftBox.right + clearance - leftWidth - rightBox.left,
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
    // Callers may add to the returned array.
    return [
      ...this.getCachedNoteCollisionGlyphBoxes(
        noteElement,
        pageSetup,
        measureBarWidthMap,
        leftBarReserveOverride,
      ),
    ];
  }

  private static getCachedNoteCollisionGlyphBoxes(
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
    let key = `${fontFamily}|${fontSize}|`;
    for (const glyph of glyphs) {
      const offsetX = glyph.offsetX ?? 0;
      const offsetY = glyph.offsetY ?? 0;
      key += `${glyph.glyphName},${glyph.kind}`;
      if (glyph.x !== 0 || glyph.y !== 0 || offsetX !== 0 || offsetY !== 0) {
        key += `,${glyph.x},${glyph.y},${offsetX},${offsetY}`;
      }
      key += ';';
    }
    let boxes = noteCollisionGlyphBoxesCache.get(key);
    if (boxes === undefined) {
      boxes = this.computeNoteCollisionGlyphBoxes(
        fontFamily,
        fontSize,
        glyphs,
      ).map((box) => Object.freeze(box));
      noteCollisionGlyphBoxesCache.set(key, boxes);
    }
    return boxes;
  }

  private static computeNoteCollisionGlyphBoxes(
    fontFamily: string,
    fontSize: number,
    glyphs: NoteCollisionGlyph[],
  ): NoteGlyphBox[] {
    const resolvedGlyphNames = fontService.resolveContextualSubstitutions(
      fontFamily,
      glyphs.map((glyph) => glyph.glyphName),
    );

    const baseIndex = glyphs.findIndex((glyph) => glyph.kind === 'base');
    const baseGlyphName = resolvedGlyphNames[baseIndex];

    const boxes = glyphs.flatMap((glyph, index) => {
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
    return boxes;
  }

  private static getNoteCollisionGlyphs(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    leftBarReserveOverride: number | null = null,
  ): NoteCollisionGlyph[] {
    const glyphs: NoteCollisionGlyph[] = [];
    const fontSize = pageSetup.neumeDefaultFontSize;
    const leftBarReserve = this.getMeasureBarLeftReserve(
      noteElement,
      measureBarWidthMap,
      leftBarReserveOverride,
    );
    const bodyLeft = this.getNoteBodyLeft(
      noteElement,
      pageSetup,
      leftBarReserve,
    );

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

    this.addNoteCollisionMarkGlyphs(glyphs, noteElement, bodyLeft);

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
    const leftBarReserve = this.getMeasureBarLeftReserve(
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

  private static getMeasureBarLeftReserve(
    owner: NoteElement | MartyriaElement,
    measureBarWidthMap: Map<MeasureBar, number>,
    reserveOverride: number | null = null,
  ) {
    if (reserveOverride != null) {
      return reserveOverride;
    }

    const measureBarLeft = this.getVisibleMeasureBarLeft(owner);

    if (measureBarLeft == null) {
      return 0;
    }

    return (
      (measureBarWidthMap.get(measureBarLeft) ?? 0) +
      owner.computedMeasureBarLeftLeadingSpacing
    );
  }

  private static getNoteBodyLeft(
    noteElement: NoteElement,
    pageSetup: PageSetup,
    leftBarReserve: number,
  ) {
    return (
      leftBarReserve +
      (!pageSetup.melkiteRtl
        ? this.getVareiaPrefixWidth(noteElement, pageSetup)
        : 0)
    );
  }

  private static addNoteCollisionMarkGlyphs(
    glyphs: NoteCollisionGlyph[],
    note: NoteElement,
    bodyLeft: number,
  ) {
    const add = (
      neume: Neume | null | undefined,
      offsetX?: number | null,
      offsetY?: number | null,
    ) => {
      if (neume != null && !isTieNeume(neume)) {
        glyphs.push({
          glyphName: NeumeMappingService.getMapping(neume).glyphName,
          kind: 'mark',
          x: bodyLeft,
          y: 0,
          offsetX,
          offsetY,
        });
      }
    };

    for (const slot of noteMarkSlots) {
      const neume = slot.neume(note);
      if (neume != null) {
        add(neume, slot.offsetX(note), slot.offsetY(note));
      }
    }

    const measureBarLeft = note.measureBarLeft ?? note.computedMeasureBarLeft;
    if (isMeasureBarAboveVariant(measureBarLeft)) {
      add(
        measureBarLeft,
        note.measureBarLeftOffsetX,
        note.measureBarLeftOffsetY,
      );
    }

    add(note.tie, note.tieOffsetX, note.tieOffsetY);
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

    const boxes = glyphs.flatMap((glyph) =>
      this.getGlyphCollisionBoxes(
        fontFamily,
        glyph.glyphName,
        glyph.x,
        glyph.y + verticalOffset,
        fontSize,
      ),
    );
    return boxes;
  }

  private static getMartyriaCollisionGlyphs(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ): NoteCollisionGlyph[] {
    const glyphs: NoteCollisionGlyph[] = [];
    const fontFamily = pageSetup.neumeDefaultFontFamily;
    const fontSize = pageSetup.neumeDefaultFontSize;
    let x = 0;

    const measureBarLeft = this.getVisibleMeasureBarLeft(martyriaElement);

    if (measureBarLeft != null) {
      x += this.getNeumeWidthFromCache(measureBarLeft, pageSetup);
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

    if (martyriaElement.alignRight && martyriaElement.quantitativeNeume) {
      x += martyriaElement.quantitativeNeumeSpacing;

      const quantitativeNeumeStartX = x;
      const quantitativeNeumeGlyphName = NeumeMappingService.getMapping(
        martyriaElement.quantitativeNeume,
      ).glyphName;

      glyphs.push({
        glyphName: quantitativeNeumeGlyphName,
        kind: 'inline',
        x,
        y: 0,
      });
      x += this.getNeumeWidthFromCache(
        martyriaElement.quantitativeNeume,
        pageSetup,
      );

      if (martyriaElement.quantitativeNeumeFthora) {
        const fthoraGlyphName = NeumeMappingService.getMapping(
          martyriaElement.quantitativeNeumeFthora,
        ).glyphName;
        const anchorOffset = fontService.getMarkOffset(
          fontFamily,
          quantitativeNeumeGlyphName,
          fthoraGlyphName,
        );

        glyphs.push({
          glyphName: fthoraGlyphName,
          kind: 'mark',
          x: quantitativeNeumeStartX + anchorOffset.x * fontSize,
          y: anchorOffset.y * fontSize,
        });
      }
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
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    if (!this.isVisualCollisionBoundaryElement(left)) {
      return { deficit: 0, requiredWidth: 0 };
    }

    if (!this.isVisualCollisionBoundaryElement(right)) {
      return { deficit: 0, requiredWidth: 0 };
    }

    const requiredWidth = this.getRequiredVisualSpacing(
      this.getElementRightInkOverhang(left, pageSetup, measureBarWidthMap),
      this.getElementLeftInkOverhang(right, pageSetup),
      pageSetup,
    );

    return {
      deficit: Math.max(0, requiredWidth - baseGlueWidth),
      requiredWidth,
    };
  }

  private static getRequiredVisualSpacing(
    leftRightInkOverhang: number,
    rightLeftInkOverhang: number,
    pageSetup: PageSetup,
  ) {
    return (
      this.getInlineSpacing(pageSetup) +
      leftRightInkOverhang +
      rightLeftInkOverhang
    );
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
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    if (element.elementType === ElementType.Note) {
      return this.getNoteRightInkOverhang(
        element as NoteElement,
        pageSetup,
        measureBarWidthMap,
      );
    }

    if (element.elementType === ElementType.Tempo) {
      const tempoElement = element as TempoElement;
      return this.getSingleNeumeRightInkOverhang(tempoElement.neume, pageSetup);
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
    const measureBarLeft = this.getVisibleMeasureBarLeft(martyriaElement);
    const measureBarLeftWidth =
      measureBarLeft != null
        ? this.getNeumeWidthFromCache(measureBarLeft, pageSetup)
        : 0;
    const measureBarLeftOverhang =
      measureBarLeft != null
        ? this.getSingleNeumeLeftInkOverhang(measureBarLeft, pageSetup)
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

    if (measureBarLeft != null) {
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
    const quantitativeNeume = martyriaElement.alignRight
      ? martyriaElement.quantitativeNeume
      : null;
    const inkOverhang =
      trailingNeume && trailingNeume !== quantitativeNeume
        ? this.getSingleNeumeRightInkOverhang(trailingNeume, pageSetup)
        : this.getMartyriaContentRightInkOverhang(martyriaElement, pageSetup);

    return inkOverhang;
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
    followsAtomicMelismaPrefix: boolean,
  ) {
    // TODO handle digorgon/trigorgon

    // Penalties are additive. Combinations of softer penalties can saturate to
    // MAX_COST and become prohibited. The three weaker penalties can stack to
    // at most 0.45 * MAX_COST, which stays below the strongly discouraged
    // threshold. The caller resolves outright prohibitions from the atomic
    // melisma prefix or getBreakConstraint, adds that constraint to this
    // total, and clamps the result to MAX_COST.
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
        ((noteElement.isMelismaStart &&
          nextNoteElement.isMelisma &&
          !nextNoteElement.isMelismaStart) ||
          followsAtomicMelismaPrefix)
      ) {
        // Discourage break immediately after a melisma start,
        // before its first continuation neume (between notes 0
        // and 1 of the melisma, 0-indexed), or at the first
        // permitted break after a multi-neume atomic lyric-covered
        // prefix. The latter boundary is always after a
        // continuation note, so the two cases never stack.
        // Comparable to TeX's \clubpenalty/\widowpenalty, but
        // weighted more heavily than beat-stealing breaks because
        // it can isolate the opening lyric-bearing group and risk
        // lyric overflow.
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
    const breakLinesStart = now();
    const breakpoints = breakLines(items, lineLengths, {
      maxAdjustmentRatio,
      initialMaxAdjustmentRatio: maxAdjustmentRatio ?? Number.POSITIVE_INFINITY,
      adjacentLooseTightPenalty: MAX_COST * 0.7,
    });
    accumulate('breakLines', breakLinesStart);
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
        // The penalty after a note is the unlabeled
        // boundary opportunity, so there is no existing label to preserve.
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
    neumeLineHeight: number,
    neumeHeight: number,
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
    const breakStart = now();
    const solution = this.breakParagraphOptimally(
      pendingParagraph,
      lineLengths,
    );
    accumulate('breakParagraph', breakStart);
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

    // Line assignments are now fixed, and every element's vertical metrics
    // were resolved during Phase 1. Plan exact heights before pagination so a
    // line never has to be corrected after its successor has been placed.
    const lineElements = ratios.map(() => [] as ScoreElement[]);
    for (const position of positions) {
      const item = pendingParagraph[position.item];
      if (item.type === 'box' && 'element' in item) {
        lineElements[position.line].push((item as ElementBox).element);
      }
    }
    const lineHeights = lineElements.map((elements) =>
      this.getLineHeight(
        elements,
        pageSetup.lineHeight,
        neumeLineHeight,
        neumeHeight,
      ),
    );

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
      lineHeights,
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
    elements: ScoreElement[],
    defaultLineHeight: number,
    neumeLineHeight: number,
    neumeHeight: number,
  ) {
    let textBox: TextBoxElement | null = null;
    let richTextBox: RichTextBoxElement | null = null;
    let modeKey: ModeKeyElement | null = null;
    let imageBox: ImageBoxElement | null = null;
    let hasNeumeContent = false;
    let resolvedNeumeLineHeight = neumeLineHeight;

    for (const element of elements) {
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
        case ElementType.Note: {
          hasNeumeContent = true;
          const note = element as NoteElement;
          if (note.lyrics.length > 0 || note.isMelisma) {
            resolvedNeumeLineHeight = includeLyricsInLineHeight(
              resolvedNeumeLineHeight,
              note.lyricsVerticalOffset,
              note.lyricsFontHeight,
            );
          }
          break;
        }
        case ElementType.Martyria:
        case ElementType.Tempo:
        case ElementType.DropCap:
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
      return resolvedNeumeLineHeight;
    }

    return defaultLineHeight;
  }

  private static getLineSpanHeight(
    lineHeights: number[],
    startLine: number,
    lineCount: number,
    fallbackLineHeight: number,
  ) {
    let height = 0;

    for (let i = startLine; i < startLine + lineCount; i++) {
      height += lineHeights[i] ?? fallbackLineHeight;
    }

    return height;
  }

  private static processHeaderFooter(
    container: Header | Footer,
    pageSetup: PageSetup,
    neumeHeight: number,
    paragraphStyles: ParagraphStyle[],
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

    if (textBoxElement.inline) {
      if (!textBoxElement.fillWidth && textBoxElement.customWidth != null) {
        elementWidthPx = textBoxElement.customWidth;
      } else {
        elementWidthPx = Math.max(
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
      modeKey.computedNeumeFontSizePrevious = modeKey.computedNeumeFontSize;
      modeKey.computedColorPrevious = modeKey.computedColor;
      modeKey.computedStrokeWidthPrevious = modeKey.computedStrokeWidth;
      modeKey.computedTopPrevious = modeKey.computedTop;
      modeKey.computedFlowTopPrevious = modeKey.computedFlowTop;
      modeKey.heightPrevious = modeKey.height;
      modeKey.computedInitialMartyriaLayoutPrevious =
        modeKey.computedInitialMartyriaLayout;
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
        martyria.widthPrevious !== martyria.width ||
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

      textbox.updated =
        textbox.widthPrevious !== textbox.width ||
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
        modeKey.computedNeumeFontSizePrevious !==
          modeKey.computedNeumeFontSize ||
        modeKey.computedColorPrevious !== modeKey.computedColor ||
        modeKey.computedStrokeWidthPrevious !== modeKey.computedStrokeWidth ||
        modeKey.computedTopPrevious !== modeKey.computedTop ||
        modeKey.computedFlowTopPrevious !== modeKey.computedFlowTop ||
        modeKey.heightPrevious !== modeKey.height ||
        !deepEquals(
          modeKey.computedInitialMartyriaLayoutPrevious,
          modeKey.computedInitialMartyriaLayout,
        ) ||
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
    const { lyricsBaseline, measureBarWidthMap } = args;

    noteElement.lyricsVerticalOffset = getLyricsTop(
      lyricsBaseline,
      TextMeasurementService.getCachedFontVerticalMetrics(
        noteElement.lyricsFontCss,
      ).ascent,
    );

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

    // Handle special cases for running elaphron: shift the lyrics toward the
    // elaphron so that they remain centered beneath it.
    if (runningElaphronSet.has(noteElement.quantitativeNeume)) {
      const glyphName = NeumeMappingService.getMapping(
        noteElement.quantitativeNeume,
      ).glyphName;
      noteElement.lyricsHorizontalOffset +=
        pageSetup.neumeDefaultFontSize *
        fontService.getLyricsHorizontalOffset(
          pageSetup.neumeDefaultFontFamily,
          glyphName,
        );
    }

    return noteElement.neumeWidth;
  }

  public static getMartyriaWidth(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    // Match the visual spacing that the same martyria and quantitative neume
    // would receive as adjacent score elements.
    martyriaElement.quantitativeNeumeSpacing =
      this.getMartyriaQuantitativeNeumeSpacing(martyriaElement, pageSetup);
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

    const measureBarLeft = this.getVisibleMeasureBarLeft(martyriaElement);

    if (measureBarLeft != null) {
      martyriaElement.neumeWidth += this.getNeumeWidthFromCache(
        measureBarLeft,
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

    return this.getMartyriaBoxWidth(martyriaElement);
  }

  public static addMelismas(
    pages: Page[],
    pageSetup: PageSetup,
    defaultLyricsFontCss: string,
    measureBarWidthMap: Map<MeasureBar, number>,
    centeringPlans: ReadonlyMap<NoteElement, MelismaCenteringPlan>,
    blockedMelismaNotes: ReadonlySet<NoteElement>,
    boundary?: {
      following: ScoreElement | null;
      greekIsActive: boolean;
      greekSyllables: MelismaSyllables | null;
      leadingHyphen: boolean;
    },
  ) {
    // First calculate some constants

    const widthOfSpace = TextMeasurementService.getTextWidth(
      ' ',
      defaultLyricsFontCss,
    );

    const runningElaphronLeftOffsets = new Map<QuantitativeNeume, number>();

    for (const quantitativeNeume of runningElaphronSet) {
      const glyphName =
        NeumeMappingService.getMapping(quantitativeNeume).glyphName;
      const bounds = fontService.getElafronBounds(
        pageSetup.neumeDefaultFontFamily,
        glyphName,
      );
      runningElaphronLeftOffsets.set(
        quantitativeNeume,
        bounds.left * pageSetup.neumeDefaultFontSize,
      );
    }

    // Hyphens and underscores end at the following lyric, so center long
    // melisma lyrics before laying any of them out.
    this.centerLongMelismaLyrics(
      pages,
      pageSetup,
      measureBarWidthMap,
      runningElaphronLeftOffsets,
      centeringPlans,
      boundary?.following,
    );
    const greekMelismaTexts = this.layoutGreekMelismaText(
      pages,
      pageSetup,
      measureBarWidthMap,
      boundary?.greekSyllables,
    );
    let phase2GreekMelismaIsActive = boundary?.greekIsActive ?? false;
    let previousLineEndingMayShowLeadingLyricHyphen =
      boundary?.leadingHyphen ?? false;
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];

      for (let lineIndex = 0; lineIndex < page.lines.length; lineIndex++) {
        const line = page.lines[lineIndex];

        const firstElementOnNextLine = this.getFirstElementOnNextLine(
          pages,
          pageIndex,
          lineIndex,
          boundary?.following,
        );

        const indexOfFirstNote = line.elements.findIndex(
          (x) => x.elementType === ElementType.Note,
        );
        let lineEndingMayShowLeadingLyricHyphen = false;

        for (let index = 0; index < line.elements.length; index++) {
          const currentElement = line.elements[index];

          if (this.isBreakElement(currentElement)) {
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
            !element.isMelismaStart &&
            !blockedMelismaNotes.has(element);
          const mayShowLeadingLyricHyphen =
            !blockedMelismaNotes.has(element) &&
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

          // A leading hyphen between written syllables is allowed at a line
          // break even though the melisma itself cannot cross it.
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
            continue;
          }

          if (greekMelismaTexts.has(element)) {
            element.melismaText = greekMelismaTexts.get(element)!;
            continue;
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

            if (
              nextElement !== firstElementOnNextLine &&
              nextElement?.elementType === ElementType.Note
            ) {
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
              const { end: unclampedEnd, nextLyricLimit } =
                this.getUnderscoreMelismaEnd(
                  element,
                  finalElement,
                  nextNoteElement,
                  pageSetup,
                  measureBarWidthMap,
                  runningElaphronLeftOffsets,
                );
              end =
                nextLyricLimit == null
                  ? unclampedEnd
                  : Math.min(unclampedEnd, nextLyricLimit);

              element.melismaWidth = Math.max(end - start, 0);

              // A lyric centered by centerLongMelismaLyrics always lands here.
              if (element.melismaWidth < pageSetup.lyricsMelismaCutoffWidth) {
                element.melismaWidth = 0;
              }
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

        const last = line.elements.at(-1);
        if (this.endsMelismaAtExplicitBreak(last)) {
          phase2GreekMelismaIsActive = false;
        }
        previousLineEndingMayShowLeadingLyricHyphen =
          last?.pageBreak !== true && lineEndingMayShowLeadingLyricHyphen;
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
            (followedByRightAlignedMartyria || nextElement == null)
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
              nextElement == null &&
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
    const bounds = this.getRelativeMeasureBarAnchorBounds(
      element,
      pageSetup,
      measureBarWidthMap,
      measureBar,
      edge,
    );
    return { left: element.x + bounds.left, right: element.x + bounds.right };
  }

  // Phase 1 must not read the position from the last layout. Adding and
  // subtracting that origin can change the collision test at an ink edge.
  private static getRelativeMeasureBarAnchorBounds(
    element: ScoreElement,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    measureBar: MeasureBar | null = null,
    edge: MeasureBarAnchorEdge | null = null,
  ) {
    if (
      element instanceof NoteElement ||
      element.elementType === ElementType.Martyria
    ) {
      const owner = element as NoteElement | MartyriaElement;
      const fallback = {
        left: this.getMeasureBarLeftReserve(owner, measureBarWidthMap),
        right:
          this.getMeasureBarOwnerWidth(owner) -
          this.getVisibleMeasureBarRightWidth(owner, measureBarWidthMap),
      };
      if (measureBar === null || edge === null) {
        return fallback;
      }
      if (owner instanceof NoteElement) {
        return this.getBoundsForMeasureBar(
          this.getNoteCollisionGlyphBoxes(owner, pageSetup, measureBarWidthMap),
          fallback,
          measureBar,
          edge,
          pageSetup,
          // Marks beside the bar do not clamp it.
          (box, barBox) => this.noteGlyphBoxesOverlap(box, barBox),
        );
      }
      if (
        (edge === 'left'
          ? this.getVisibleMeasureBarLeft(owner)
          : this.getVisibleMeasureBarRight(owner)) !== measureBar
      ) {
        return this.getMartyriaBoundsForMeasureBar(
          owner,
          fallback,
          measureBar,
          edge,
          pageSetup,
        );
      }
      return fallback;
    }

    return { left: 0, right: element.width };
  }

  // The horizontal extents of the owner glyph boxes that overlap the measure
  // bar's clearance box, or the fallback bounds if none do.
  private static getBoundsForMeasureBar(
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
      pageSetup,
    );
    const overlappingBoxes = ownerBoxes.filter((box) =>
      overlapsBar(box, barBox),
    );
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
    const fallback = this.getRelativeMeasureBarAnchorBounds(
      owner,
      pageSetup,
      measureBarWidthMap,
    );
    const bounds =
      owner instanceof NoteElement
        ? this.getRelativeMeasureBarAnchorBounds(
            owner,
            pageSetup,
            measureBarWidthMap,
            measureBar,
            edge,
          )
        : this.getMartyriaBoundsForMeasureBar(
            owner,
            fallback,
            measureBar,
            edge,
            pageSetup,
          );
    return edge === 'left'
      ? Math.max(0, fallback.left - bounds.left)
      : Math.max(0, bounds.right - fallback.right);
  }

  private static getMartyriaBoundsForMeasureBar(
    martyriaElement: MartyriaElement,
    fallbackBounds: { left: number; right: number },
    measureBar: MeasureBar,
    edge: MeasureBarAnchorEdge,
    pageSetup: PageSetup,
  ) {
    return this.getBoundsForMeasureBar(
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
    return {
      left:
        edge === 'left'
          ? fallbackBounds.left - clearance - barWidth
          : fallbackBounds.right,
      right:
        edge === 'left'
          ? fallbackBounds.left
          : fallbackBounds.right + clearance + barWidth,
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

    return this.getMartyriaBoxWidth(owner as MartyriaElement);
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
    const barBoxes = this.getMeasureBarCollisionBoxes(measureBar, 0, pageSetup);
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
    leftWidth: number,
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
    const ownerBounds = this.getRelativeMeasureBarAnchorBounds(
      leftAnchor,
      pageSetup,
      measureBarWidthMap,
      measureBar,
      'right',
    );
    const nextBounds = this.getRelativeMeasureBarAnchorBounds(
      rightAnchor,
      pageSetup,
      measureBarWidthMap,
      measureBar,
      'left',
    );

    return Math.max(
      0,
      ownerBounds.right +
        2 * clearance -
        ownerClampExtents.left -
        leftWidth -
        nextBounds.left +
        nextClampExtents.right,
    );
  }

  private static getMinimumSpacingForMeasureBarVareiaBoxes(
    leftWidth: number,
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
      leftWidth,
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
    if (left == null || right == null || !this.isMeasureBarOwner(left)) {
      return 0;
    }

    if (
      left.elementType === ElementType.Note &&
      right.elementType === ElementType.Martyria
    ) {
      const leftNote = left as NoteElement;
      const rightMartyria = right as MartyriaElement;
      const measureBarRight = this.getVisibleMeasureBarRight(leftNote);

      if (measureBarRight == null) {
        return 0;
      }

      const leftWidth = leftNote.neumeWidth;
      const fallbackBounds = this.getRelativeMeasureBarAnchorBounds(
        leftNote,
        pageSetup,
        measureBarWidthMap,
      );
      const barBoxes = this.getMeasureBarCollisionBoxes(
        measureBarRight,
        fallbackBounds.right,
        pageSetup,
      );
      const rightBoxes = this.getMartyriaCollisionGlyphBoxes(
        rightMartyria,
        pageSetup,
      );
      const clearance = this.getMeasureBarCollisionSpacing(pageSetup);

      return Math.max(
        this.getMinimumSpacingForNoteGlyphBoxes(
          leftWidth,
          barBoxes,
          rightBoxes,
          clearance,
        ),
        this.getCenteredClampMinimum(
          leftNote,
          rightMartyria,
          measureBarRight,
          leftWidth,
          pageSetup,
          measureBarWidthMap,
        ),
      );
    }

    if (
      left.elementType === ElementType.Martyria &&
      right.elementType === ElementType.Note
    ) {
      const leftMartyria = left as MartyriaElement;
      const rightNote = right as NoteElement;
      const measureBarLeft = this.getVisibleMeasureBarLeft(rightNote);

      if (measureBarLeft == null) {
        return 0;
      }

      const leftWidth = this.getMartyriaBoxWidth(leftMartyria);
      const leftBoxes = this.getMartyriaCollisionGlyphBoxes(
        leftMartyria,
        pageSetup,
      );
      const barBoxes = this.getMeasureBarCollisionBoxes(
        measureBarLeft,
        0,
        pageSetup,
      );
      const clearance = this.getMeasureBarCollisionSpacing(pageSetup);

      return this.getMinimumSpacingForNoteGlyphBoxes(
        leftWidth,
        leftBoxes,
        barBoxes,
        clearance,
      );
    }

    if (
      left.elementType !== ElementType.Note ||
      right.elementType !== ElementType.Note
    ) {
      return 0;
    }

    const leftNote = left as NoteElement;
    const rightNote = right as NoteElement;
    const measureBarRight = this.getVisibleMeasureBarRight(leftNote);
    const measureBarLeft = this.getVisibleMeasureBarLeft(rightNote);
    const clearance = this.getMeasureBarCollisionSpacing(pageSetup);
    const leftWidth = leftNote.neumeWidth;

    if (measureBarRight != null) {
      const fallbackBounds = this.getRelativeMeasureBarAnchorBounds(
        leftNote,
        pageSetup,
        measureBarWidthMap,
      );
      const barBoxes = this.getMeasureBarCollisionBoxes(
        measureBarRight,
        fallbackBounds.right,
        pageSetup,
      );
      const rightBoxes = this.getNoteCollisionGlyphBoxes(
        rightNote,
        pageSetup,
        measureBarWidthMap,
      );
      const collisionMinimum = Math.max(
        this.getMinimumSpacingForNoteGlyphBoxes(
          leftWidth,
          barBoxes,
          rightBoxes,
          clearance,
        ),
        this.getMinimumSpacingForMeasureBarVareiaBoxes(
          leftWidth,
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
          leftWidth,
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
        0,
        pageSetup,
      );

      return this.getMinimumSpacingForNoteGlyphBoxes(
        leftWidth,
        leftBoxes,
        barBoxes,
        clearance,
      );
    }

    return 0;
  }

  private static getMeasureBarCollisionBoxes(
    measureBar: MeasureBar,
    offsetX: number,
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

    return barBoxes.map((barBox) => ({
      left: offsetX + barBox.left,
      right: offsetX + barBox.right,
      top: barBox.top,
      bottom: barBox.bottom,
    }));
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
    const neumes: Neume[] = [noteElement.quantitativeNeume];
    for (const slot of noteMarkSlots) {
      const neume = slot.neume(noteElement);
      if (neume != null) {
        neumes.push(neume);
      }
    }
    return neumes;
  }

  private static getNoteNeumesForInkMeasurement(noteElement: NoteElement) {
    return this.getNoteNeumesForMeasurement(noteElement).filter(
      (neume) => !isTieNeume(neume),
    );
  }

  public static calculateMartyriae(
    elements: ScoreElement[],
    pageSetup: PageSetup,
    initialContext?: MusicalContext,
    checkpoints?: Pick<PreviousLayout, 'musicalEntries'> & {
      changedAmbitus: ModeKeyElement[];
    },
    // Only elements[start, end). The checkpoint at `end`, if any, is the
    // state the range ends with.
    { start, end } = { start: 0, end: elements.length },
  ) {
    let currentNote = initialContext?.note ?? 0;
    let currentShift = initialContext?.shift ?? 0;
    let currentNoteVirtual = currentNote + currentShift;
    let currentScale = initialContext?.scale ?? Scale.Diatonic;
    const contexts = new Map<ScoreElement, MusicalContext>();

    let ambitusLow: number = Number.MAX_SAFE_INTEGER;
    let ambitusHigh: number = Number.MIN_SAFE_INTEGER;
    let ambitusLowScale = Scale.Diatonic;
    let ambitusHighScale = Scale.Diatonic;
    let ambitusLowShift = 0;
    let ambitusHighShift = 0;
    let currentModeKey: ModeKeyElement | null = null;

    const finishAmbitus = (modeKey: ModeKeyElement) => {
      const check = checkpoints !== undefined && modeKey.showAmbitus;
      const low = modeKey.ambitusLowNote;
      const high = modeKey.ambitusHighNote;
      const lowRoot = modeKey.ambitusLowRootSign;
      const highRoot = modeKey.ambitusHighRootSign;
      this.assignAmbitus({
        currentModeKey: modeKey,
        ambitusLow,
        ambitusHigh,
        ambitusLowScale,
        ambitusLowShift,
        ambitusHighScale,
        ambitusHighShift,
      });
      if (
        check &&
        (low !== modeKey.ambitusLowNote ||
          high !== modeKey.ambitusHighNote ||
          lowRoot !== modeKey.ambitusLowRootSign ||
          highRoot !== modeKey.ambitusHighRootSign)
      ) {
        checkpoints.changedAmbitus.push(modeKey);
      }
    };

    const recordCheckpoint = (index: number) => {
      if (
        checkpoints !== undefined &&
        this.endsParagraph(elements[index - 1], elements[index])
      ) {
        checkpoints.musicalEntries.set(elements[index], {
          note: currentNote,
          scale: currentScale,
          shift: currentShift,
        });
      }
    };

    for (let index = start; index < end; index++) {
      const element = elements[index];
      recordCheckpoint(index);
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

        // Normalize every slot against the incoming pitch before choosing the
        // active fthora. Otherwise an invalid higher-priority slot can leave a
        // lower-priority mark visible until the next layout pass.
        for (const slot of noteFthoraSlots) {
          const carry = slot.getCarry(note);

          if (
            carry &&
            this.fthoraIsValid(carry, currentNotesVirtual, pageSetup)
          ) {
            slot.setFthora(note, carry);
          }

          const fthora = slot.getFthora(note);
          if (fthora) {
            if (this.fthoraIsValid(fthora, currentNotesVirtual, pageSetup)) {
              slot.setCarry(note, null);
            } else {
              slot.setCarry(note, fthora);
              slot.setFthora(note, null);
            }
          }
        }

        // Apply the first valid fthora (primary, then secondary, then tertiary).
        const activeSlot = noteFthoraSlots.find((slot) => slot.getFthora(note));

        if (activeSlot) {
          const fthora = activeSlot.getFthora(note)!;

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
            this.getScaleFromFthora(fthora, fthoraNoteVirtual) || currentScale;

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
          finishAmbitus(currentModeKey);
        }

        ambitusLow = Number.MAX_SAFE_INTEGER;
        ambitusHigh = Number.MIN_SAFE_INTEGER;

        currentModeKey = modeKey;
        ({
          note: currentNote,
          scale: currentScale,
          shift: currentShift,
        } = this.getModeKeyStartContext(modeKey));
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

            if (
              martyria.quantitativeNeumeFthoraCarry &&
              this.fthoraIsValid(
                martyria.quantitativeNeumeFthoraCarry,
                [currentNote],
                pageSetup,
              )
            ) {
              martyria.quantitativeNeumeFthora =
                martyria.quantitativeNeumeFthoraCarry;
              martyria.quantitativeNeumeFthoraCarry = null;
            }

            if (martyria.quantitativeNeumeFthora) {
              const fthora = martyria.quantitativeNeumeFthora;

              if (this.fthoraIsValid(fthora, [currentNote], pageSetup)) {
                currentScale =
                  this.getScaleFromFthora(fthora, currentNote) || currentScale;

                currentShift = this.getShift(
                  currentNote,
                  currentNoteVirtual,
                  currentScale,
                  fthora,
                  martyria.quantitativeNeumeChromaticFthoraNote,
                );

                martyria.quantitativeNeumeFthoraCarry = null;
              } else {
                martyria.quantitativeNeumeFthoraCarry = fthora;
                martyria.quantitativeNeumeFthora = null;
              }
            }
          }
        }
      } else if (element.elementType === ElementType.RichTextBox) {
        const richTextBox = element as RichTextBoxElement;
        const embeddedModeKey = richTextBox.modeChange
          ? null
          : getLastEmbeddedModeKey(richTextBox);

        if (richTextBox.modeChange || embeddedModeKey != null) {
          if (currentModeKey) {
            finishAmbitus(currentModeKey);
          }

          ambitusLow = Number.MAX_SAFE_INTEGER;
          ambitusHigh = Number.MIN_SAFE_INTEGER;

          currentModeKey = null;
          if (embeddedModeKey != null) {
            ({
              note: currentNote,
              scale: currentScale,
              shift: currentShift,
            } = this.getModeKeyStartContext(embeddedModeKey));
          } else {
            currentNote = getScaleNoteValue(richTextBox.modeChangePhysicalNote);
            currentScale = richTextBox.modeChangeScale;
            currentShift = 0;

            if (richTextBox.modeChangeVirtualNote) {
              currentNoteVirtual = getScaleNoteValue(
                richTextBox.modeChangeVirtualNote,
              );

              currentShift = getShiftWithoutFthora(
                currentNote,
                currentNoteVirtual,
                currentScale,
              );
            }
          }
        }
      }
      if (elementFootnoteIds(element).length > 0) {
        contexts.set(element, {
          note: currentNote,
          scale: currentScale,
          shift: currentShift,
        });
      }
    }

    if (end < elements.length) {
      recordCheckpoint(end);
    }
    if (currentModeKey) {
      finishAmbitus(currentModeKey);
    }
    return contexts;
  }

  // Mode keys and mode changes reset note, scale and shift from their own
  // fields and start a new ambitus, so no musical state crosses them.
  private static resetsMusicalState(element: ScoreElement) {
    return (
      element.elementType === ElementType.ModeKey ||
      (element.elementType === ElementType.RichTextBox &&
        ((element as RichTextBoxElement).modeChange ||
          getLastEmbeddedModeKey(element as RichTextBoxElement) != null))
    );
  }

  /** The note, scale, and shift a mode key starts the music in. */
  private static getModeKeyStartContext(modeKey: ModeKeyElement) {
    const note = getScaleNoteValue(modeKey.scaleNote);
    let scale = modeKey.scale;
    let shift = 0;

    if (modeKey.fthora) {
      scale = this.getScaleFromFthora(modeKey.fthora, note) || scale;
      shift = this.getShift(note, note, scale, modeKey.fthora, null);
    }

    return { note, scale, shift };
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
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const inkBounds = this.getNoteInkBoundsFromCache(noteElement, pageSetup);
    // Ink bounds are relative to the main glyph run. Translate its right edge
    // into note-box coordinates before comparing it with the neume width.
    const bodyLeft = this.getNoteBodyLeft(
      noteElement,
      pageSetup,
      this.getMeasureBarLeftReserve(noteElement, measureBarWidthMap),
    );

    return Math.max(0, bodyLeft + inkBounds.inkRight - noteElement.neumeWidth);
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

  private static getNeumeSequenceInkOverhangs(
    inkNeumes: Neume[],
    advanceNeumes: Neume[],
    pageSetup: PageSetup,
  ) {
    const inkBounds = this.getNeumeSequenceInkBoundsFromCache(
      inkNeumes,
      pageSetup,
    );
    const advanceWidth = this.getNeumeSequenceWidthFromCache(
      advanceNeumes,
      pageSetup,
    );

    return {
      left: inkBounds.leftOverhang,
      right: Math.max(0, inkBounds.inkRight - advanceWidth),
    };
  }

  private static getMartyriaBodyInkOverhangs(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    return this.getNeumeSequenceInkOverhangs(
      this.getMartyriaBodyNeumesForInkMeasurement(martyriaElement),
      this.getMartyriaBodyNeumesForWidthMeasurement(martyriaElement),
      pageSetup,
    );
  }

  private static getMartyriaQuantitativeNeumeInkOverhangs(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    const quantitativeNeume = martyriaElement.quantitativeNeume!;
    const neumes = [
      quantitativeNeume,
      martyriaElement.quantitativeNeumeFthora,
    ].filter((neume) => neume != null);
    return this.getNeumeSequenceInkOverhangs(
      neumes,
      [quantitativeNeume],
      pageSetup,
    );
  }

  private static getMartyriaQuantitativeNeumeSpacing(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    if (!martyriaElement.alignRight || !martyriaElement.quantitativeNeume) {
      return 0;
    }

    return this.getRequiredVisualSpacing(
      this.getMartyriaBodyInkOverhangs(martyriaElement, pageSetup).right,
      this.getMartyriaQuantitativeNeumeInkOverhangs(martyriaElement, pageSetup)
        .left,
      pageSetup,
    );
  }

  private static getMartyriaContentRightInkOverhang(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    return martyriaElement.alignRight && martyriaElement.quantitativeNeume
      ? this.getMartyriaQuantitativeNeumeInkOverhangs(
          martyriaElement,
          pageSetup,
        ).right
      : this.getMartyriaBodyInkOverhangs(martyriaElement, pageSetup).right;
  }

  private static getMartyriaTempoLeftSpacingDeficit(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    if (!martyriaElement.tempoLeft) {
      return 0;
    }

    const requiredWidth = this.getRequiredVisualSpacing(
      this.getSingleNeumeRightInkOverhang(martyriaElement.tempoLeft, pageSetup),
      this.getMartyriaBodyInkOverhangs(martyriaElement, pageSetup).left,
      pageSetup,
    );

    return Math.max(0, requiredWidth - martyriaElement.tempoLeftSpacing);
  }

  private static getMartyriaTempoRightSpacingDeficit(
    martyriaElement: MartyriaElement,
    pageSetup: PageSetup,
  ) {
    if (!martyriaElement.tempoRight) {
      return 0;
    }

    const requiredWidth = this.getRequiredVisualSpacing(
      this.getMartyriaContentRightInkOverhang(martyriaElement, pageSetup),
      this.getSingleNeumeLeftInkOverhang(martyriaElement.tempoRight, pageSetup),
      pageSetup,
    );

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

    if (!martyriaElement.error && martyriaElement.fthora != null) {
      neumes.push(martyriaElement.fthora);
    }

    if (martyriaElement.tempo != null) {
      neumes.push(martyriaElement.tempo);
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

  private static getFollowingLyricStarts(line: Line) {
    const starts = new Map<NoteElement, number>();
    let nextStart = Infinity;

    for (let index = line.elements.length - 1; index >= 0; index--) {
      const element = line.elements[index];
      if (this.isBreakElement(element)) {
        nextStart = Infinity;
      } else if (element.elementType === ElementType.Note) {
        const note = element as NoteElement;
        starts.set(note, nextStart);
        if (note.lyricsWidth > 0) {
          nextStart = Math.min(nextStart, note.x + this.getLyricTextLeft(note));
        }
      }
    }

    return starts;
  }

  private static getGreekRepetitionBounds(
    note: NoteElement,
    pairEnd: NoteElement | undefined,
    textWidth: number,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    if (pairEnd != null) {
      return this.getGreekMelismaPairTextBounds(
        note,
        pairEnd,
        0,
        note.neumeWidth +
          note.spaceAfter +
          this.getMelismaContinuationBoundaryWidth(
            note,
            pairEnd,
            pageSetup,
            measureBarWidthMap,
          ),
        textWidth,
        pageSetup,
        measureBarWidthMap,
      );
    }
    const left =
      (note.neumeWidth + note.lyricsHorizontalOffset - textWidth) / 2;
    return { left, right: left + textWidth };
  }

  private static getGreekMelismaTextEnd(
    note: NoteElement,
    textWidth: number,
    previousEnd: number | null,
    nextStart: number,
    minimumSpacing: number,
    noteX: number = note.x,
  ): number | null {
    // Generated Greek vowels are centered in the continuation's lyric box.
    const start =
      noteX + (note.neumeWidth + note.lyricsHorizontalOffset - textWidth) / 2;
    const end = start + textWidth;

    if (
      (previousEnd != null &&
        start < previousEnd + minimumSpacing - melismaGeometryTolerance) ||
      end + minimumSpacing > nextStart + melismaGeometryTolerance
    ) {
      return null;
    }

    return end;
  }

  private static getGreekMelismaBoundaryMinimumWidth(
    repetitionEnd: number | null,
    nextNote: NoteElement | null,
    cursor: number,
    minimumSpacing: number,
    spaceAfter: number,
    generatedTextLeft?: number,
  ) {
    if (
      repetitionEnd == null ||
      nextNote == null ||
      (nextNote.lyricsWidth === 0 && generatedTextLeft == null)
    ) {
      return null;
    }
    const { leftProjection } = this.getLyricProjections(
      nextNote,
      nextNote.alignLeft,
    );
    return (
      repetitionEnd +
      minimumSpacing -
      cursor -
      spaceAfter -
      (generatedTextLeft == null
        ? leftProjection
        : Math.max(0, -generatedTextLeft)) -
      (generatedTextLeft ?? this.getLyricTextLeft(nextNote))
    );
  }

  private static createNotePostBreakGlue(
    baseGlue: Glue,
    width: number,
    minimumWidth: number | null,
  ): Glue {
    return {
      ...baseGlue,
      width,
      shrink:
        minimumWidth == null
          ? baseGlue.shrink
          : Math.min(baseGlue.shrink, Math.max(0, width - minimumWidth)),
    };
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

  private static getFirstElementOnNextLine(
    pages: Page[],
    pageIndex: number,
    lineIndex: number,
    following: ScoreElement | null = null,
  ) {
    const lines = pages[pageIndex].lines;

    if (
      lineIndex + 1 < lines.length &&
      lines[lineIndex + 1].elements.length > 0
    ) {
      return lines[lineIndex + 1].elements[0];
    }

    if (
      pageIndex + 1 < pages.length &&
      pages[pageIndex + 1].lines.length > 0 &&
      pages[pageIndex + 1].lines[0].elements.length > 0
    ) {
      return pages[pageIndex + 1].lines[0].elements[0];
    }

    return following;
  }

  // Returns where an underscore melisma ends before any clamp against the
  // following lyric, and that clamp when it applies.
  private static getUnderscoreMelismaEnd(
    element: NoteElement,
    finalElement:
      NoteElement | MartyriaElement | TempoElement | TextBoxElement | null,
    nextNoteElement: NoteElement | null,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    runningElaphronLeftOffsets: ReadonlyMap<QuantitativeNeume, number>,
  ) {
    // Preserve the minimum gap to all visible text, including centered lyrics.
    const nextLyricLimit =
      nextNoteElement != null && nextNoteElement.lyricsWidth > 0
        ? nextNoteElement.x +
          this.getLyricTextLeft(nextNoteElement) -
          pageSetup.lyricsMinimumSpacing
        : null;
    const elaphronLeft =
      nextNoteElement == null
        ? undefined
        : runningElaphronLeftOffsets.get(nextNoteElement.quantitativeNeume);

    // Note the special case for when the next neume is a running elaphron.
    // The melisma, which by convention must always be a final melisma,
    // should run all the way to the elaphron, instead of stopping at
    // the apostrophos.
    if (nextNoteElement != null && elaphronLeft != null) {
      return {
        end:
          nextNoteElement.x +
          this.getMeasureBarLeftReserve(nextNoteElement, measureBarWidthMap) +
          elaphronLeft,
        nextLyricLimit,
      };
    }

    return {
      end:
        finalElement == null
          ? element.x + element.neumeWidth
          : finalElement.x +
            this.getFinalElementWidth(finalElement) -
            this.getFinalElementMeasureBarRightWidth(
              finalElement,
              measureBarWidthMap,
            ),
      nextLyricLimit,
    };
  }

  // Resolve eligible lyrics before drawing underscores and hyphens, whose
  // endpoints depend on the final lyric positions. Walk each line backwards
  // so clearance checks see the following lyric's final position, even with
  // lyricless notes between the groups.
  private static centerLongMelismaLyrics(
    pages: Page[],
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    runningElaphronLeftOffsets: ReadonlyMap<QuantitativeNeume, number>,
    centeringPlans: ReadonlyMap<NoteElement, MelismaCenteringPlan>,
    following?: ScoreElement | null,
  ) {
    if (centeringPlans.size === 0) {
      return;
    }

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const lines = pages[pageIndex].lines;

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        const firstElementOnNextLine = this.getFirstElementOnNextLine(
          pages,
          pageIndex,
          lineIndex,
          following,
        );
        let followingLyric: NoteElement | null = null;

        for (let index = line.elements.length - 1; index >= 0; index--) {
          const element = line.elements[index];
          if (element.elementType !== ElementType.Note) {
            continue;
          }
          const note = element as NoteElement;
          const nextLyric = followingLyric;
          if (note.lyricsWidth > 0) {
            followingLyric = note;
          }
          const plan = centeringPlans.get(note);
          if (plan == null) {
            continue;
          }

          // Phase 1 already reserved and applied these exact text bounds.
          // Finalize the alignment representation without measuring again:
          // rounding or cutoff checks must not undo that decision.
          if (plan.phase1Centered) {
            this.applyCenteredMelismaLyric(note, this.getLyricTextLeft(note));
            continue;
          }

          const { finalElement, nextElement } = this.findFinalAndNextElement(
            line,
            note,
            firstElementOnNextLine,
            index + 1,
          );
          const finalElementIndex =
            finalElement == null
              ? index
              : line.elements.indexOf(finalElement, index);
          const lastQuantitativeNote = this.previousNoteElement(
            line,
            finalElementIndex + 1,
          ) as NoteElement;

          if (!note.isHyphen) {
            // A clamp against the following lyric alone must not trigger
            // centering. Never use coordinates from the next line.
            const { end } = this.getUnderscoreMelismaEnd(
              note,
              finalElement,
              nextElement !== firstElementOnNextLine &&
                nextElement?.elementType === ElementType.Note
                ? (nextElement as NoteElement)
                : null,
              pageSetup,
              measureBarWidthMap,
              runningElaphronLeftOffsets,
            );
            if (
              end - (note.x + this.getLyricTextRight(note, false)) >=
              pageSetup.lyricsMelismaCutoffWidth - melismaGeometryTolerance
            ) {
              continue;
            }
          }

          const startQuantitativeNeumeOffset = this.getNoteBodyLeft(
            note,
            pageSetup,
            this.getMeasureBarLeftReserve(note, measureBarWidthMap),
          );
          const lastQuantitativeNeumeEnd =
            lastQuantitativeNote.x +
            lastQuantitativeNote.neumeWidth -
            this.getFinalElementMeasureBarRightWidth(
              lastQuantitativeNote,
              measureBarWidthMap,
            );
          const quantitativeNeumeSpan =
            lastQuantitativeNeumeEnd - note.x - startQuantitativeNeumeOffset;
          if (
            note.isHyphen &&
            quantitativeNeumeSpan >=
              this.getCenteredMelismaContainedLyricWidth(note) -
                melismaGeometryTolerance
          ) {
            continue;
          }
          const currentTextLeft = this.getLyricTextLeft(note);
          const lyricTextLeft =
            startQuantitativeNeumeOffset +
            this.getCenteredMelismaLyricTextLeft(note, quantitativeNeumeSpan);
          if (lyricTextLeft < currentTextLeft - melismaGeometryTolerance) {
            continue;
          }

          // Phase 1 reserved the existing lyric and the neume segment. A
          // rightward move must fit that envelope after justification,
          // including punctuation, and preserve clearance to the next lyric.
          const reservedRight = Math.max(
            note.x + currentTextLeft + note.lyricsWidth,
            lastQuantitativeNeumeEnd,
          );
          const nextLyricLimit =
            nextLyric == null
              ? Infinity
              : nextLyric.x +
                this.getLyricTextLeft(nextLyric) -
                pageSetup.lyricsMinimumSpacing;
          const textLeft = Math.max(currentTextLeft, lyricTextLeft);
          if (
            note.x + textLeft + note.lyricsWidth >
            Math.min(reservedRight, nextLyricLimit) + melismaGeometryTolerance
          ) {
            continue;
          }
          this.applyCenteredMelismaLyric(note, textLeft);
        }
      }
    }
  }

  private static getMelismaBreakConstraint(
    note: NoteElement,
    next: ScoreElement | null,
    atomicPrefix: boolean,
    greekPair: boolean,
  ) {
    if (greekPair) {
      return { cost: MAX_COST, label: 'greek-melisma-pair' };
    }
    return atomicPrefix
      ? { cost: MAX_COST, label: 'atomic-melisma-prefix' }
      : this.getBreakConstraint(note, next);
  }

  private static prepareGreekMelismaPairs(
    elements: ScoreElement[],
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    startIndex = 0,
    endIndex = elements.length,
    greekIsActive = false,
  ) {
    const pairs = this.getGreekMelismaPairs(
      elements,
      pageSetup,
      greekIsActive,
      startIndex,
      endIndex,
    );
    for (let index = startIndex; index < endIndex; index++) {
      const element = elements[index];
      if (element.elementType !== ElementType.Note) {
        continue;
      }
      const start = element as NoteElement;
      const end = pairs.get(start);
      if (
        end != null &&
        start.lyricsWidth > 0 &&
        elements[index - 1]?.elementType !== ElementType.DropCap
      ) {
        const bounds = this.getGreekMelismaPairTextBounds(
          start,
          end,
          0,
          start.neumeWidth +
            start.spaceAfter +
            this.getMelismaContinuationBoundaryWidth(
              start,
              end,
              pageSetup,
              measureBarWidthMap,
            ),
          start.lyricsWidth,
          pageSetup,
          measureBarWidthMap,
        );
        // Encode the shared lyric before line breaking, as for an atomic
        // English melisma. Internal pair spacing stays fixed.
        start.alignLeft = true;
        start.lyricsHorizontalOffset = bounds.left;
      }
    }
    return pairs;
  }

  private static getGreekMelismaPairs(
    elements: ScoreElement[],
    pageSetup: PageSetup,
    greekIsActive = false,
    startIndex = 0,
    endIndex = elements.length,
  ) {
    const pairs = new Map<NoteElement, NoteElement>();
    if (pageSetup.disableGreekMelismata || pageSetup.melkiteRtl) {
      return pairs;
    }
    for (let index = startIndex; index < endIndex; index++) {
      const element = elements[index];
      if (this.isBreakElement(element)) {
        greekIsActive = false;
      } else if (element.elementType === ElementType.Note) {
        const note = element as NoteElement;
        greekIsActive =
          note.lyrics.length > 0
            ? note.isMelismaStart && MelismaHelperGreek.isGreek(note.lyrics)
            : note.isMelisma && greekIsActive;
        const next = this.getNoteIfPresentAt(elements, index + 1);
        if (
          greekIsActive &&
          note.quantitativeNeume === QuantitativeNeume.Apostrophos &&
          !this.endsMelismaAtExplicitBreak(note) &&
          next?.quantitativeNeume === QuantitativeNeume.Hyporoe &&
          this.isPartOfSameMelisma(next) &&
          next.lyrics.length === 0
        ) {
          pairs.set(note, next);
        }
      }
      if (this.endsMelismaAtExplicitBreak(element)) {
        greekIsActive = false;
      }
    }
    return pairs;
  }

  private static getGreekMelismaPairTextBounds(
    start: NoteElement,
    end: NoteElement,
    startX: number,
    endX: number,
    textWidth: number,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
  ) {
    const left =
      startX +
      this.getNoteBodyLeft(
        start,
        pageSetup,
        this.getMeasureBarLeftReserve(start, measureBarWidthMap),
      );
    const right =
      endX +
      end.neumeWidth -
      this.getFinalElementMeasureBarRightWidth(end, measureBarWidthMap);
    const textLeft =
      left +
      (start.lyricsWidth > 0
        ? this.getCenteredMelismaLyricTextLeft(start, right - left)
        : (right - left - textWidth) / 2);
    return { left: textLeft, right: textLeft + textWidth };
  }

  private static layoutGreekMelismaText(
    pages: Page[],
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    initialSyllables: MelismaSyllables | null = null,
  ) {
    const texts = new Map<NoteElement, string>();
    if (pageSetup.disableGreekMelismata) {
      return texts;
    }

    let syllables = initialSyllables;
    for (const page of pages) {
      const resolvedMargins = resolvePageMargins(
        pageSetup,
        page.physicalPageNumber,
      );
      for (const line of page.lines) {
        const repetitions = new Map<
          NoteElement,
          { text: string; width: number }
        >();
        for (let index = 0; index < line.elements.length; index++) {
          const element = line.elements[index];
          if (this.isBreakElement(element)) {
            syllables = null;
          } else if (element.elementType === ElementType.Note) {
            const note = element as NoteElement;
            if (note.lyrics.length > 0) {
              let text = note.lyrics;
              const previous = line.elements[index - 1];
              if (previous?.elementType === ElementType.DropCap) {
                text = `${(previous as DropCapElement).content}${text}`;
              }
              syllables =
                note.isMelismaStart && MelismaHelperGreek.isGreek(note.lyrics)
                  ? MelismaHelperGreek.getMelismaSyllable(text)
                  : null;
            } else if (note.isMelisma && syllables != null) {
              repetitions.set(note, {
                text: syllables.middle,
                width: this.getTextWidthFromCache(note, syllables.middle),
              });
            } else {
              syllables = null;
            }
          }
        }

        for (const [note, text] of this.layoutGreekMelismaTextOnLine(
          line,
          pageSetup,
          measureBarWidthMap,
          repetitions,
          resolvedMargins,
        )) {
          texts.set(note, text);
        }
        if (this.endsMelismaAtExplicitBreak(line.elements.at(-1))) {
          syllables = null;
        }
      }
    }
    return texts;
  }

  private static layoutGreekMelismaTextOnLine(
    line: Line,
    pageSetup: PageSetup,
    measureBarWidthMap: Map<MeasureBar, number>,
    repetitions: ReadonlyMap<NoteElement, { text: string; width: number }>,
    resolvedMargins: ResolvedPageMargins,
  ) {
    const texts = new Map<NoteElement, string>();
    const groups: Array<{
      start: NoteElement;
      end: NoteElement;
      width: number;
      left: number;
      previousEnd: number;
      canCenter: boolean;
    }> = [];
    const gap = pageSetup.lyricsMinimumSpacing;
    const leftLimit = resolvedMargins.contentLeft + line.indentation;
    const rightLimit = resolvedMargins.contentRight;
    const followingStarts = this.getFollowingLyricStarts(line);
    const firstNote = line.elements.find(
      (element) => element.elementType === ElementType.Note,
    ) as NoteElement | undefined;
    const pairs = this.getGreekMelismaPairs(
      line.elements,
      pageSetup,
      firstNote != null && repetitions.has(firstNote),
    );
    let previousEnd: number | null = null;

    // Decide repetition visibility without moving text over omitted vowels.
    // Only apostrophos-hyporoe pairs share a centered lyric span.
    for (let index = 0; index < line.elements.length; index++) {
      const element = line.elements[index];
      if (element.elementType !== ElementType.Note) {
        if (this.isBreakElement(element)) {
          previousEnd = null;
        }
        continue;
      }
      const note = element as NoteElement;
      const pairEnd = pairs.get(note);
      if (note.lyricsWidth > 0) {
        const group = {
          start: note,
          end: pairEnd ?? note,
          width: note.lyricsWidth,
          left: note.x + this.getLyricTextLeft(note),
          previousEnd: previousEnd ?? leftLimit - gap,
          canCenter:
            pairEnd != null &&
            note.isMelismaStart &&
            MelismaHelperGreek.isGreek(note.lyrics) &&
            line.elements[index - 1]?.elementType !== ElementType.DropCap,
        };
        groups.push(group);
        previousEnd = Math.max(
          previousEnd ?? -Infinity,
          group.left + group.width,
        );
        if (pairEnd != null) {
          texts.set(pairEnd, '');
          index++;
        }
      } else if (repetitions.has(note)) {
        const repetition = repetitions.get(note)!;
        if (pairEnd != null) {
          const bounds = this.getGreekMelismaPairTextBounds(
            note,
            pairEnd,
            note.x,
            pairEnd.x,
            repetition.width,
            pageSetup,
            measureBarWidthMap,
          );
          const visible =
            bounds.left >=
              Math.max(
                leftLimit,
                previousEnd == null ? -Infinity : previousEnd + gap,
              ) -
                melismaGeometryTolerance &&
            bounds.right + gap <=
              followingStarts.get(pairEnd)! + melismaGeometryTolerance &&
            bounds.right <= rightLimit + melismaGeometryTolerance;
          texts.set(note, visible ? repetition.text : '');
          texts.set(pairEnd, '');
          if (visible) {
            note.lyricsHorizontalOffset =
              2 * (bounds.left - note.x) - note.neumeWidth + repetition.width;
            const group = {
              start: note,
              end: pairEnd,
              width: repetition.width,
              left: bounds.left,
              previousEnd: previousEnd ?? leftLimit - gap,
              canCenter: false,
            };
            groups.push(group);
            previousEnd = bounds.right;
          }
          index++;
          continue;
        }
        const candidateEnd = this.getGreekMelismaTextEnd(
          note,
          repetition.width,
          previousEnd,
          followingStarts.get(note)!,
          gap,
        );
        const end =
          candidateEnd != null &&
          candidateEnd - repetition.width >=
            leftLimit - melismaGeometryTolerance &&
          candidateEnd <= rightLimit + melismaGeometryTolerance
            ? candidateEnd
            : null;
        texts.set(note, end == null ? '' : repetition.text);
        if (end != null) {
          const group = {
            start: note,
            end: note,
            width: repetition.width,
            left: end - repetition.width,
            previousEnd: previousEnd ?? leftLimit - gap,
            canCenter: false,
          };
          groups.push(group);
          previousEnd = end;
        }
      }
    }

    // Use final note positions, as for English melismas. Preserve visibility
    // and the reserved envelope; an unsafe move keeps the original position.
    let nextStart = rightLimit + gap;
    for (let index = groups.length - 1; index >= 0; index--) {
      const current = groups[index];
      if (
        !pageSetup.melkiteRtl &&
        current.canCenter &&
        current.end !== current.start
      ) {
        const bodyLeft =
          current.start.x +
          this.getNoteBodyLeft(
            current.start,
            pageSetup,
            this.getMeasureBarLeftReserve(current.start, measureBarWidthMap),
          );
        const bodyRight =
          current.end.x +
          current.end.neumeWidth -
          this.getFinalElementMeasureBarRightWidth(
            current.end,
            measureBarWidthMap,
          );
        const span = bodyRight - bodyLeft;
        const left =
          bodyLeft + this.getCenteredMelismaLyricTextLeft(current.start, span);
        if (
          span > 0 &&
          left >= Math.max(leftLimit, current.previousEnd + gap) &&
          left + current.width <=
            Math.max(current.left + current.width, bodyRight) &&
          left + current.width + gap <= nextStart
        ) {
          this.applyCenteredMelismaLyric(current.start, left - current.start.x);
          current.left = left;
        }
      }
      nextStart = Math.min(nextStart, current.left);
    }
    return texts;
  }

  private static applyCenteredMelismaLyric(
    note: NoteElement,
    textLeft: number,
  ) {
    const shift = textLeft - this.getLyricTextLeft(note);
    note.alignLeft = false;
    note.lyricsHorizontalOffset =
      2 * textLeft - note.neumeWidth + note.lyricsWidth;
    note.leadingLyricHyphenOffset += shift;
  }

  private static hasNonNoteMelismaContinuation(
    elements: ScoreElement[],
    startIndex: number,
  ) {
    let crossedNonNoteElement = false;

    for (let i = startIndex; i < elements.length; i++) {
      const element = elements[i];
      if (element.elementType === ElementType.Note) {
        if (!this.isPartOfSameMelisma(element)) {
          return false;
        }

        if (crossedNonNoteElement) {
          return true;
        }
        if (this.endsMelismaAtExplicitBreak(element)) {
          return false;
        }

        continue;
      }

      if (
        this.endsMelismaAtExplicitBreak(element) ||
        !this.isMelismaContinuationElement(element)
      ) {
        return false;
      }

      crossedNonNoteElement = true;
    }

    return false;
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

  private static endsMelismaAtExplicitBreak(element: ScoreElement | undefined) {
    return element !== undefined && (element.lineBreak || element.pageBreak);
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
    if (this.endsMelismaAtExplicitBreak(line.elements.at(-1))) {
      firstElementOnNextLine = null;
    }

    let finalElement:
      NoteElement | MartyriaElement | TempoElement | TextBoxElement | null =
      null;

    let nextElement: ScoreElement | null = null;

    let nextNoteElement: ScoreElement | null = null;
    let needsNoteLookahead = true;
    for (let i = startIndex; i < line.elements.length; i++) {
      if (line.elements[i].elementType === ElementType.Note) {
        needsNoteLookahead = true;
      } else if (
        needsNoteLookahead &&
        this.isMelismaContinuationElement(line.elements[i])
      ) {
        nextNoteElement = this.nextNoteElement(line, i, firstElementOnNextLine);
        needsNoteLookahead = false;
      }

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
