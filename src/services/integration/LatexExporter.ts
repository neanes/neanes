import type {
  DropCapElement,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  TempoElement,
  TextBoxAlignment,
  TextBoxElement,
} from '@/models/Element';
import { ElementType } from '@/models/Element';
import type { Neume } from '@/models/Neumes';
import { TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import type { Page } from '@/models/Page';
import type { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type ParagraphStyle,
  type ParagraphStyleOverrides,
  type ResolvedParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { resolveFontCss } from '@/utils/fontStyle';
import {
  type OpenTypeFeatures,
  resolveOpenTypeFeatures,
} from '@/utils/fontVariants';
import { resolvePageMargins } from '@/utils/PageMargins';
import { resolveRunningMarkerText } from '@/utils/runningMarkers';
import { Unit } from '@/utils/Unit';

import { fontCatalog } from '../FontCatalog';
import { fontService } from '../FontService';
import type { SbmuflGlyphName } from '../NeumeMappingService';
import { NeumeMappingService } from '../NeumeMappingService';
import { TextMeasurementService } from '../TextMeasurementService';

export const LATEX_SCHEMA_VERSION = 3;

// Schema changes
// 1 to 2: Positive lyricsVerticalOffset now moves lyrics down, making it consistent with other offsets in the schema
// 2 to 3: Glyph positioning includes layout-resolved spacing, offsets,
// transferred measure-bar placement, and leading lyric hyphens. Text typography
// moved from page setup and element-specific font fields to an interned table of
// fully resolved text styles. Elements reference the final style they render
// with. Exact font face names and structured OpenType feature settings are
// preserved. Alignment is spelled out everywhere it appears, including on mode
// keys, which used to abbreviate it to a single letter. Every text style carries
// the exact PostScript name; export fails if Neanes cannot resolve one.

export class LatexExporterOptions {
  includeModeKeys: boolean = false;
  includeTextBoxes: boolean = false;
}

function glyphName(neume: Neume | null) {
  if (neume == null) {
    return undefined;
  }

  const mapping = NeumeMappingService.getMapping(neume);

  return mapping.salt == null
    ? mapping.glyphName
    : `${mapping.glyphName}.salt${String(mapping.salt).padStart(2, '0')}`;
}

function getOffset(
  markNeume: Neume | null,
  x: number | null,
  y: number | null,
) {
  if (markNeume == null) {
    return undefined;
  }

  x = x ?? 0;
  y = y ?? 0;

  if (x == 0 && y == 0) {
    return undefined;
  }

  return { x, y };
}

function convertFontName(fontFamily: string) {
  return fontFamily === 'Source Serif' ? 'Source Serif 4' : fontFamily;
}

function toPt(value: number) {
  return Number(Unit.toPt(value).toFixed(4));
}

export function getLatexNeumeFont(fontFamily: string) {
  const metadata = fontService.getMetadata(fontFamily);

  return {
    fontFamily,
    fontVersion: metadata.fontVersion,
  };
}

function convertColor(color: string) {
  return color.startsWith('#') ? color.substring(1) : color;
}

export class LatexFontFaceResolutionError extends Error {
  constructor(
    readonly fontFamily: string,
    readonly fontStyle: string,
  ) {
    super('latex-font-face-resolution-failed');
    this.name = 'LatexFontFaceResolutionError';
  }
}

export function convertResolvedTextStyle(
  style: ResolvedParagraphStyle,
): LatexTextStyle {
  const face = fontCatalog.resolveExportFace(style.fontFamily, style.fontStyle);

  if (face.postscriptName == null) {
    throw new LatexFontFaceResolutionError(style.fontFamily, style.fontStyle);
  }

  return {
    alignment: style.alignment,
    fontFamily: convertFontName(style.fontFamily),
    fontSize: toPt(style.fontSize),
    fontStyle: face.style,
    postscriptName: face.postscriptName,
    color: convertColor(style.color),
    strokeWidth: toPt(style.strokeWidth),
    strokeColor: convertColor(style.strokeColor),
    lineHeight: style.lineHeight === null ? 'normal' : style.lineHeight,
    textDecoration:
      style.textDecoration === null ? 'none' : style.textDecoration,
    fontFeatures: resolveOpenTypeFeatures(style),
  };
}

export class LatexTextStyleRegistry {
  readonly styles: LatexTextStyleDefinition[] = [];

  // The document's own paragraph style ids, and every id handed out so far. A
  // resolved style keeps the id of the paragraph style it came from when it is
  // that style unmodified, so the exported ids stay readable; everything else
  // gets a generated id that must not collide with either set.
  private readonly paragraphStyleIds: Set<string>;
  private readonly usedStyleIds: Set<string>;
  private readonly styleIdByValue = new Map<string, string>();
  private readonly styleIdBySource = new Map<string, string>();
  private readonly baseStyleValueByParagraphStyleId = new Map<string, string>();
  private nextGeneratedId = 1;

  constructor(private readonly paragraphStyles: ParagraphStyle[]) {
    this.paragraphStyleIds = new Set(paragraphStyles.map((style) => style.id));
    this.usedStyleIds = new Set(this.paragraphStyleIds);
  }

  getStyleId(
    paragraphStyleId: string,
    overrides: ParagraphStyleOverrides,
  ): string {
    const source = JSON.stringify([paragraphStyleId, overrides]);
    const existingSourceStyleId = this.styleIdBySource.get(source);
    if (existingSourceStyleId != null) {
      return existingSourceStyleId;
    }

    const style = convertResolvedTextStyle(
      resolveParagraphStyle(this.paragraphStyles, paragraphStyleId, overrides),
    );
    const value = JSON.stringify(style);
    const existingStyleId = this.styleIdByValue.get(value);
    if (existingStyleId != null) {
      this.styleIdBySource.set(source, existingStyleId);
      return existingStyleId;
    }

    const styleId =
      this.paragraphStyleIds.has(paragraphStyleId) &&
      value === this.baseStyleValue(paragraphStyleId)
        ? paragraphStyleId
        : this.nextStyleId();

    this.styles.push({ id: styleId, ...style });
    this.usedStyleIds.add(styleId);
    this.styleIdByValue.set(value, styleId);
    this.styleIdBySource.set(source, styleId);

    return styleId;
  }

  // What a paragraph style resolves to with no element overrides applied.
  private baseStyleValue(paragraphStyleId: string): string {
    let value = this.baseStyleValueByParagraphStyleId.get(paragraphStyleId);

    if (value == null) {
      value = JSON.stringify(
        convertResolvedTextStyle(
          resolveParagraphStyle(this.paragraphStyles, paragraphStyleId),
        ),
      );
      this.baseStyleValueByParagraphStyleId.set(paragraphStyleId, value);
    }

    return value;
  }

  private nextStyleId() {
    let styleId: string;
    do {
      styleId = `resolved-${this.nextGeneratedId++}`;
    } while (this.usedStyleIds.has(styleId));

    return styleId;
  }
}

function getSectionMarkerName(element: LatexExporterElement): string | null {
  if (
    element.elementType !== ElementType.TextBox &&
    element.elementType !== ElementType.RichTextBox
  ) {
    return null;
  }

  const runningMarkerElement = element as TextBoxElement | RichTextBoxElement;

  if (runningMarkerElement.runningMarkerRole !== 'section') {
    return null;
  }

  return resolveRunningMarkerText(runningMarkerElement);
}

export class LatexExporter {
  public export(
    pages: Page[],
    pageSetup: PageSetup,
    paragraphStyles: ParagraphStyle[],
    options: LatexExporterOptions,
  ) {
    const neumeDescent = TextMeasurementService.getFontBoundingBoxDescent(
      pageSetup.neumeDefaultFontCss,
    );

    /* 
**Calculating Lyrics Vertical Offset**
Latex and Electron align adjacent characters in different ways.
  - The browser aligns adjacent divs of different sizes by aligning the tops of the divs.
  - Latex aligns by font baseline. 

Below is a diagram that shows how pageSetup.lyricsVerticalOffset affects
the lyrics position in Neanes. To translate to Latex, we must measure
the distance between the neume and lyrics baselines.
-----------------------------------------------------------------------
                     +----------------+
                     |     Neume      |
                     |                |
                     |                |
Neume Baseline -->   |----------------|  ---
                     |                |   |   <-- Neume Descent
                     +----------------+  ---
                                         ---
                                          |
                                          |   <-- Lyrics Vertical Offset (Neanes)
                                          |
                                         ---                       
                     +----------------+  ---
                     |     Lyrics     |   |  <-- Lyrics Ascent
                     |                |   |
Lyrics Baseline -->  |----------------|  ---
                     |                |   
                     +----------------+ 

Distance Between Baselines = Lyrics Vertical Offset + Neume Descent + Lyrics Ascent 
*/
    const lyricsStyle = resolveParagraphStyle(
      paragraphStyles,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    );

    const lyricsFont = resolveFontCss(lyricsStyle);

    const lyricAscent =
      TextMeasurementService.getFontBoundingBoxAscent(lyricsFont);

    const lyricsVerticalOffset =
      pageSetup.lyricsVerticalOffset + neumeDescent + lyricAscent;
    const neumeFont = getLatexNeumeFont(pageSetup.neumeDefaultFontFamily);
    const textStyleRegistry = new LatexTextStyleRegistry(paragraphStyles);

    const result: LatexScore = {
      appVersion: APP_VERSION,
      schemaVersion: LATEX_SCHEMA_VERSION,
      sectionNames: [],
      fontVersions: {
        [neumeFont.fontFamily]: neumeFont.fontVersion,
      },
      textStyles: textStyleRegistry.styles,
      pageSetup: {
        lineHeight: toPt(pageSetup.lineHeight),
        martyriaVerticalOffset:
          pageSetup.martyriaVerticalOffset != 0
            ? toPt(pageSetup.martyriaVerticalOffset)
            : undefined,
        fontFamilies: {
          neume: neumeFont.fontFamily,
        },
        fontSizes: {
          modeKey: toPt(pageSetup.modeKeyDefaultFontSize),
          neume: toPt(pageSetup.neumeDefaultFontSize),
        },
        lyricsVerticalOffset: toPt(lyricsVerticalOffset),
        lyricsMelismaSpacing: toPt(pageSetup.lyricsMelismaSpacing),
        lyricsMelismaThickness: toPt(pageSetup.lyricsMelismaThickness),
        colors: {
          accidental: convertColor(pageSetup.accidentalDefaultColor),
          breath: convertColor(pageSetup.breathDefaultColor),
          cross: convertColor(pageSetup.crossDefaultColor),
          fthora: convertColor(pageSetup.fthoraDefaultColor),
          gorgon: convertColor(pageSetup.gorgonDefaultColor),
          heteron: convertColor(pageSetup.heteronDefaultColor),
          ison: convertColor(pageSetup.isonDefaultColor),
          koronis: convertColor(pageSetup.koronisDefaultColor),
          martyria: convertColor(pageSetup.martyriaDefaultColor),
          measureBar: convertColor(pageSetup.measureBarDefaultColor),
          measureNumber: convertColor(pageSetup.measureNumberDefaultColor),
          modeKey: convertColor(pageSetup.modeKeyDefaultColor),
          neume: convertColor(pageSetup.neumeDefaultColor),
          noteIndicator: convertColor(pageSetup.noteIndicatorDefaultColor),
          tempo: convertColor(pageSetup.tempoDefaultColor),
        },
      },
      sections: [],
    };

    let section: LatexSection = { default: true, lines: [] };
    let pendingSectionName: string | null = null;

    for (const page of pages) {
      const resolvedMargins = resolvePageMargins(
        pageSetup,
        page.physicalPageNumber,
      );
      for (const line of page.lines) {
        let resultLine: LatexLine = { elements: [] };

        const pushCurrentLine = () => {
          if (resultLine.elements.length > 0) {
            section.lines.push(resultLine);
            resultLine = { elements: [] };
          }
        };

        const startSection = (name: string) => {
          pushCurrentLine();

          if (section.lines.length > 0) {
            result.sections.push(section);
          }

          section = { name, lines: [] };
        };

        const pushExportedElement = (latexElement: LatexElement) => {
          if (pendingSectionName != null) {
            startSection(pendingSectionName);
            pendingSectionName = null;
          }

          resultLine.elements.push(latexElement);
        };

        for (const element of line.elements) {
          const sectionMarkerName = getSectionMarkerName(
            element as LatexExporterElement,
          );
          const emitsTextBox =
            element.elementType === ElementType.TextBox &&
            options.includeTextBoxes;

          if (sectionMarkerName != null) {
            if (emitsTextBox) {
              startSection(sectionMarkerName);
              pendingSectionName = null;
            } else {
              pendingSectionName = sectionMarkerName;
            }
          }

          if (element.elementType === ElementType.Note) {
            const note = element as NoteElement;
            const noteInfo = {
              type: 'note',
              x: toPt(element.x - resolvedMargins.left),
              width: toPt(note.neumeWidth),
              quantitativeNeume: glyphName(note.quantitativeNeume),
              vareia: note.vareia || undefined,
              vareiaOffset: getOffset(
                VocalExpressionNeume.Vareia,
                note.vareiaOffsetX,
                note.vareiaOffsetY,
              ),
              vareiaInternalSpacing:
                note.vareiaInternalSpacing != 0
                  ? toPt(note.vareiaInternalSpacing)
                  : undefined,
              stavros: note.stavros || undefined,
              stavrosOffset: note.stavros
                ? getOffset(
                    VocalExpressionNeume.Cross_Top,
                    note.stavrosOffsetX,
                    note.stavrosOffsetY,
                  )
                : undefined,
              time: glyphName(note.timeNeume),
              timeOffset: getOffset(
                note.timeNeume,
                note.timeNeumeOffsetX,
                note.timeNeumeOffsetY,
              ),
              koronis: note.koronis || undefined,
              koronisOffset: note.koronis
                ? getOffset(
                    TimeNeume.Koronis,
                    note.koronisOffsetX,
                    note.koronisOffsetY,
                  )
                : undefined,
              tie: glyphName(note.tie),
              tieOffset: getOffset(note.tie, note.tieOffsetX, note.tieOffsetY),
              gorgon: glyphName(note.gorgonNeume),
              gorgonOffset: getOffset(
                note.gorgonNeume,
                note.gorgonNeumeOffsetX,
                note.gorgonNeumeOffsetY,
              ),
              gorgonSecondary: glyphName(note.secondaryGorgonNeume),
              gorgonSecondaryOffset: getOffset(
                note.secondaryGorgonNeume,
                note.secondaryGorgonNeumeOffsetX,
                note.secondaryGorgonNeumeOffsetY,
              ),
              fthora: glyphName(note.fthora),
              fthoraOffset: getOffset(
                note.fthora,
                note.fthoraOffsetX,
                note.fthoraOffsetY,
              ),
              fthoraSecondary: glyphName(note.secondaryFthora),
              fthoraSecondaryOffset: getOffset(
                note.secondaryFthora,
                note.secondaryFthoraOffsetX,
                note.secondaryFthoraOffsetY,
              ),
              fthoraTertiary: glyphName(note.tertiaryFthora),
              fthoraTertiaryOffset: getOffset(
                note.tertiaryFthora,
                note.tertiaryFthoraOffsetX,
                note.tertiaryFthoraOffsetY,
              ),
              vocalExpression: glyphName(note.vocalExpressionNeume),
              vocalExpressionOffset: getOffset(
                note.vocalExpressionNeume,
                note.vocalExpressionNeumeOffsetX,
                note.vocalExpressionNeumeOffsetY,
              ),
              accidental: glyphName(note.accidental),
              accidentalOffset: getOffset(
                note.accidental,
                note.accidentalOffsetX,
                note.accidentalOffsetY,
              ),
              accidentalSecondary: glyphName(note.secondaryAccidental),
              accidentalSecondaryOffset: getOffset(
                note.secondaryAccidental,
                note.secondaryAccidentalOffsetX,
                note.secondaryAccidentalOffsetY,
              ),
              accidentalTertiary: glyphName(note.tertiaryAccidental),
              accidentalTertiaryOffset: getOffset(
                note.tertiaryAccidental,
                note.tertiaryAccidentalOffsetX,
                note.tertiaryAccidentalOffsetY,
              ),
              ison: glyphName(note.ison),
              isonOffset: getOffset(
                note.ison,
                note.isonOffsetX,
                note.computedIsonOffsetY,
              ),
              noteIndicator: glyphName(
                note.noteIndicator ? note.noteIndicatorNeume : null,
              ),
              noteIndicatorOffset: getOffset(
                note.noteIndicator ? note.noteIndicatorNeume : null,
                note.noteIndicatorOffsetX,
                note.noteIndicatorOffsetY,
              ),
              measureNumber: glyphName(note.measureNumber),
              measureNumberOffset: getOffset(
                note.measureNumber,
                note.measureNumberOffsetX,
                note.measureNumberOffsetY,
              ),
              measureBarLeft:
                glyphName(note.measureBarLeft) ??
                glyphName(note.computedMeasureBarLeft),
              measureBarRight:
                glyphName(note.measureBarRight) ??
                glyphName(note.computedMeasureBarRight),
              measureBarLeftOffset: getOffset(
                note.measureBarLeft ?? note.computedMeasureBarLeft,
                note.measureBarLeftOffsetX,
                note.measureBarLeftOffsetY,
              ),
              measureBarRightOffset: getOffset(
                note.measureBarRight ?? note.computedMeasureBarRight,
                note.measureBarRightOffsetX,
                note.measureBarRightOffsetY,
              ),
              measureBarRightIsTransferred:
                (note.measureBarRight == null &&
                  note.computedMeasureBarRight != null) ||
                undefined,
              computedMeasureBarLeftOffsetX:
                note.computedMeasureBarLeftOffsetX != 0
                  ? toPt(note.computedMeasureBarLeftOffsetX)
                  : undefined,
              computedMeasureBarRightOffsetX:
                note.computedMeasureBarRightOffsetX != 0
                  ? toPt(note.computedMeasureBarRightOffsetX)
                  : undefined,
              computedMeasureBarLeftLeadingSpacing:
                note.computedMeasureBarLeftLeadingSpacing != 0
                  ? toPt(note.computedMeasureBarLeftLeadingSpacing)
                  : undefined,
              computedMeasureBarRightTrailingSpacing:
                note.computedMeasureBarRightTrailingSpacing != 0
                  ? toPt(note.computedMeasureBarRightTrailingSpacing)
                  : undefined,
              melismaWidth:
                note.melismaWidth > 0 ? toPt(note.melismaWidth) : undefined,
              isFullMelisma: note.isFullMelisma || undefined,
              isHyphen:
                (note.hyphenOffsets.length > 0 && note.isHyphen) || undefined,
              hyphenOffsets:
                note.hyphenOffsets.length > 0
                  ? note.hyphenOffsets.map((x) => toPt(x))
                  : undefined,
              leadingLyricHyphenOffset: note.showLeadingLyricHyphen
                ? toPt(note.leadingLyricHyphenOffset)
                : undefined,
            } as LatexNoteElement;

            const hasLyrics = note.lyrics != '' || note.melismaText != '';

            if (hasLyrics) {
              noteInfo.lyrics =
                note.lyrics != '' ? note.lyrics : note.melismaText;
              noteInfo.lyricsLeftAlign = note.alignLeft || undefined;
              noteInfo.lyricsHorizontalOffset =
                note.lyricsHorizontalOffset != 0
                  ? toPt(note.lyricsHorizontalOffset)
                  : undefined;
            }

            if (hasLyrics || note.isFullMelisma) {
              noteInfo.lyricsStyleId = textStyleRegistry.getStyleId(
                note.lyricsParagraphStyleId,
                note.getParagraphStyleOverrides(),
              );
            }

            pushExportedElement(noteInfo);
          } else if (element.elementType === ElementType.Martyria) {
            const martyria = element as MartyriaElement;

            pushExportedElement({
              type: 'martyria',
              x: toPt(element.x - resolvedMargins.left),
              width: toPt(
                martyria.neumeWidth +
                  martyria.computedMeasureBarLeftLeadingSpacing +
                  martyria.computedMeasureBarRightTrailingSpacing +
                  martyria.padding,
              ),
              verticalOffset:
                martyria.verticalOffset != 0
                  ? toPt(martyria.verticalOffset)
                  : undefined,
              note: glyphName(martyria.note),
              rootSign: glyphName(martyria.rootSign),
              fthora: glyphName(martyria.fthora),
              measureBarLeft: glyphName(martyria.measureBarLeft),
              measureBarRight: glyphName(martyria.measureBarRight),
              computedMeasureBarLeftOffsetX:
                martyria.computedMeasureBarLeftOffsetX != 0
                  ? toPt(martyria.computedMeasureBarLeftOffsetX)
                  : undefined,
              computedMeasureBarRightOffsetX:
                martyria.computedMeasureBarRightOffsetX != 0
                  ? toPt(martyria.computedMeasureBarRightOffsetX)
                  : undefined,
              computedMeasureBarLeftLeadingSpacing:
                martyria.computedMeasureBarLeftLeadingSpacing != 0
                  ? toPt(martyria.computedMeasureBarLeftLeadingSpacing)
                  : undefined,
              computedMeasureBarRightTrailingSpacing:
                martyria.computedMeasureBarRightTrailingSpacing != 0
                  ? toPt(martyria.computedMeasureBarRightTrailingSpacing)
                  : undefined,
              tempoLeft: glyphName(martyria.tempoLeft),
              tempoLeftOffsetX:
                martyria.computedTempoLeftOffsetX != 0
                  ? toPt(martyria.computedTempoLeftOffsetX)
                  : undefined,
              tempoLeftSpacing:
                martyria.tempoLeftSpacing != 0
                  ? toPt(martyria.tempoLeftSpacing)
                  : undefined,
              tempo: glyphName(martyria.tempo),
              tempoRight: glyphName(martyria.tempoRight),
              tempoRightSpacing:
                martyria.tempoRightSpacing != 0
                  ? toPt(martyria.tempoRightSpacing)
                  : undefined,
              quantitativeNeume:
                martyria.alignRight && martyria.quantitativeNeume != null
                  ? glyphName(martyria.quantitativeNeume)
                  : undefined,
              quantitativeNeumeSpacing:
                martyria.padding != 0 ? toPt(martyria.padding) : undefined,
            } as LatexMartyriaElement);
          } else if (element.elementType === ElementType.Tempo) {
            const tempo = element as TempoElement;
            pushExportedElement({
              type: 'tempo',
              x: toPt(element.x - resolvedMargins.left),
              width: toPt(tempo.neumeWidth),
              neume: glyphName(tempo.neume),
            } as LatexTempoElement);
          } else if (element.elementType === ElementType.DropCap) {
            const dropCap = element as DropCapElement;
            const dropCapOverrides = dropCap.getParagraphStyleOverrides();
            const resolvedDropCapStyle = resolveParagraphStyle(
              paragraphStyles,
              dropCap.paragraphStyleId,
              dropCapOverrides,
            );
            let verticalAdjustment = 0;

            if (resolvedDropCapStyle.lineHeight != null) {
              const fontHeight = TextMeasurementService.getFontHeight(
                dropCap.computedFont,
              );

              const originalLineHeight = fontHeight / dropCap.computedFontSize;

              verticalAdjustment =
                ((resolvedDropCapStyle.lineHeight - originalLineHeight) *
                  dropCap.computedFontSize) /
                2;
            }

            pushExportedElement({
              type: 'dropcap',
              x: toPt(element.x - resolvedMargins.left),
              width: toPt(dropCap.contentWidth),
              verticalAdjustment:
                verticalAdjustment != 0 ? toPt(verticalAdjustment) : undefined,
              content: dropCap.content,
              styleId: textStyleRegistry.getStyleId(
                dropCap.paragraphStyleId,
                dropCapOverrides,
              ),
            } as LatexDropCapElement);
          } else if (
            element.elementType === ElementType.ModeKey &&
            options.includeModeKeys
          ) {
            const modeKey = element as ModeKeyElement;
            pushExportedElement({
              type: 'modekey',
              width: toPt(modeKey.width),
              height: toPt(modeKey.height),
              marginTop:
                modeKey.marginTop != 0 ? toPt(modeKey.marginTop) : undefined,
              marginBottom:
                modeKey.marginBottom != 0
                  ? toPt(modeKey.marginBottom)
                  : undefined,
              alignment: modeKey.alignment,
              color:
                !modeKey.useDefaultStyle &&
                modeKey.color != pageSetup.modeKeyDefaultColor
                  ? convertColor(modeKey.color)
                  : undefined,
              fontSize:
                !modeKey.useDefaultStyle &&
                modeKey.fontSize != pageSetup.modeKeyDefaultFontSize
                  ? toPt(modeKey.fontSize)
                  : undefined,
              isPlagal: modeKey.isPlagal || undefined,
              isVarys: modeKey.isVarys || undefined,
              martyria: glyphName(modeKey.martyria),
              note: glyphName(modeKey.note),
              fthoraAboveNote: glyphName(modeKey.fthoraAboveNote),
              quantitativeNeumeAboveNote: glyphName(
                modeKey.quantitativeNeumeAboveNote,
              ),
              note2: glyphName(modeKey.note2),
              fthoraAboveNote2: glyphName(modeKey.fthoraAboveNote2),
              quantitativeNeumeAboveNote2: glyphName(
                modeKey.quantitativeNeumeAboveNote2,
              ),
              quantitativeNeumeRight: glyphName(modeKey.quantitativeNeumeRight),
              fthoraAboveQuantitativeNeumeRight: glyphName(
                modeKey.fthoraAboveQuantitativeNeumeRight,
              ),
              tempo: glyphName(modeKey.tempo),
              tempoAlignRight: modeKey.tempoAlignRight || undefined,
              showAmbitus: modeKey.showAmbitus || undefined,
              ambitusHighNote: modeKey.showAmbitus
                ? glyphName(modeKey.ambitusHighNote)
                : undefined,
              ambitusHighRootSign: modeKey.showAmbitus
                ? glyphName(modeKey.ambitusHighRootSign)
                : undefined,
              ambitusLowNote: modeKey.showAmbitus
                ? glyphName(modeKey.ambitusLowNote)
                : undefined,
              ambitusLowRootSign: modeKey.showAmbitus
                ? glyphName(modeKey.ambitusLowRootSign)
                : undefined,
            } as LatexModeKeyElement);
          } else if (
            element.elementType === ElementType.TextBox &&
            options.includeTextBoxes
          ) {
            const textBox = element as TextBoxElement;
            pushExportedElement({
              type: 'textbox',
              x: toPt(element.x - resolvedMargins.left),
              width: toPt(textBox.width),
              height: toPt(textBox.height),
              inline: textBox.inline || undefined,
              content: textBox.content,
              contentBottom: textBox.inline ? textBox.contentBottom : undefined,
              multipanel: textBox.multipanel || undefined,
              contentLeft: textBox.multipanel ? textBox.contentLeft : undefined,
              contentCenter: textBox.multipanel
                ? textBox.contentCenter
                : undefined,
              contentRight: textBox.multipanel
                ? textBox.contentRight
                : undefined,
              marginTop:
                textBox.marginTop != 0 ? toPt(textBox.marginTop) : undefined,
              marginBottom:
                textBox.marginBottom != 0
                  ? toPt(textBox.marginBottom)
                  : undefined,
              styleId: textStyleRegistry.getStyleId(
                textBox.paragraphStyleId,
                textBox.getParagraphStyleOverrides(),
              ),
            } as LatexTextBoxElement);
          }
        }

        pushCurrentLine();
      }
    }

    // Add the last section
    if (section.lines.length > 0) {
      result.sections.push(section);
    }

    result.sectionNames = result.sections
      .filter((x) => x.name != null)
      .map((x) => x.name!);

    return result;
  }
}

interface LatexScore {
  appVersion: string;
  schemaVersion: number;
  sectionNames: string[];
  fontVersions: Record<string, string>;
  textStyles: LatexTextStyleDefinition[];
  pageSetup: LatexPageSetup;
  sections: LatexSection[];
}

interface LatexSection {
  name?: string;
  default?: boolean;
  lines: LatexLine[];
}

interface LatexPageSetup {
  lineHeight: number;
  martyriaVerticalOffset?: number;
  fontFamilies: {
    neume: string;
  };
  fontSizes: {
    modeKey: number;
    neume: number;
  };
  lyricsVerticalOffset: number;
  lyricsMelismaSpacing: number;
  lyricsMelismaThickness: number;
  colors: {
    accidental: string;
    breath: string;
    cross: string;
    fthora: string;
    gorgon: string;
    heteron: string;
    ison: string;
    koronis: string;
    martyria: string;
    measureBar: string;
    measureNumber: string;
    modeKey: string;
    neume: string;
    noteIndicator: string;
    tempo: string;
  };
}

interface LatexLine {
  elements: LatexElement[];
}

interface LatexOffset {
  x: number;
  y: number;
}

type LatexExporterElement =
  | NoteElement
  | MartyriaElement
  | TempoElement
  | DropCapElement
  | ModeKeyElement
  | TextBoxElement
  | RichTextBoxElement;

type LatexElement =
  | LatexNoteElement
  | LatexMartyriaElement
  | LatexTempoElement
  | LatexDropCapElement
  | LatexTextBoxElement
  | LatexModeKeyElement;

interface LatexBaseElement {
  type: 'note' | 'martyria' | 'tempo' | 'dropcap' | 'modekey' | 'textbox';
  width: number;
}

interface LatexNoteElement extends LatexBaseElement {
  x: number;
  quantitativeNeume: SbmuflGlyphName;
  vareia?: boolean;
  vareiaOffset?: LatexOffset;
  vareiaInternalSpacing?: number;
  stavros?: boolean;
  stavrosOffset?: LatexOffset;
  time?: SbmuflGlyphName;
  timeOffset?: LatexOffset;
  koronis?: boolean;
  koronisOffset?: LatexOffset;
  tie?: SbmuflGlyphName;
  tieOffset?: LatexOffset;
  gorgon?: SbmuflGlyphName;
  gorgonOffset?: LatexOffset;
  gorgonSecondary?: SbmuflGlyphName;
  gorgonSecondaryOffset?: LatexOffset;
  fthora?: SbmuflGlyphName;
  fthoraOffset?: LatexOffset;
  fthoraSecondary?: SbmuflGlyphName;
  fthoraSecondaryOffset?: LatexOffset;
  fthoraTertiary?: SbmuflGlyphName;
  fthoraTertiaryOffset?: LatexOffset;
  vocalExpression?: SbmuflGlyphName;
  vocalExpressionOffset?: LatexOffset;
  accidental?: SbmuflGlyphName;
  accidentalOffset?: LatexOffset;
  accidentalSecondary?: SbmuflGlyphName;
  accidentalSecondaryOffset?: LatexOffset;
  accidentalTertiary?: SbmuflGlyphName;
  accidentalTertiaryOffset?: LatexOffset;
  ison?: SbmuflGlyphName;
  isonOffset?: LatexOffset;
  noteIndicator?: SbmuflGlyphName;
  noteIndicatorOffset?: LatexOffset;
  measureNumber?: SbmuflGlyphName;
  measureNumberOffset?: LatexOffset;
  measureBarLeft?: SbmuflGlyphName;
  measureBarRight?: SbmuflGlyphName;
  measureBarLeftOffset?: LatexOffset;
  measureBarRightOffset?: LatexOffset;
  measureBarRightIsTransferred?: boolean;
  computedMeasureBarLeftOffsetX?: number;
  computedMeasureBarRightOffsetX?: number;
  computedMeasureBarLeftLeadingSpacing?: number;
  computedMeasureBarRightTrailingSpacing?: number;
  melismaWidth?: number;
  isFullMelisma?: boolean;
  isHyphen?: boolean;
  hyphenOffsets?: number[];
  leadingLyricHyphenOffset?: number;
  lyrics?: string;
  lyricsLeftAlign?: boolean;
  lyricsHorizontalOffset?: number;
  lyricsStyleId?: string;
}

interface LatexMartyriaElement extends LatexBaseElement {
  x: number;
  verticalOffset?: number;
  note: SbmuflGlyphName;
  rootSign: SbmuflGlyphName;
  fthora?: SbmuflGlyphName;
  measureBarLeft?: SbmuflGlyphName;
  measureBarRight?: SbmuflGlyphName;
  computedMeasureBarLeftOffsetX?: number;
  computedMeasureBarRightOffsetX?: number;
  computedMeasureBarLeftLeadingSpacing?: number;
  computedMeasureBarRightTrailingSpacing?: number;
  tempoLeft?: SbmuflGlyphName;
  tempoLeftOffsetX?: number;
  tempoLeftSpacing?: number;
  tempo?: SbmuflGlyphName;
  tempoRight?: SbmuflGlyphName;
  tempoRightSpacing?: number;
  quantitativeNeume?: SbmuflGlyphName;
  quantitativeNeumeSpacing?: number;
}

interface LatexTempoElement extends LatexBaseElement {
  x: number;
  neume: SbmuflGlyphName;
}

interface LatexDropCapElement extends LatexBaseElement {
  x: number;
  content: string;
  verticalAdjustment?: number;
  styleId: string;
}

interface LatexTextBoxElement extends LatexBaseElement {
  x: number;
  height: number;
  inline?: boolean;
  content: string;
  contentBottom?: string;
  multipanel?: boolean;
  contentLeft?: string;
  contentCenter?: string;
  contentRight?: string;
  marginTop?: number;
  marginBottom?: number;
  styleId: string;
}

export interface LatexTextStyle {
  alignment: TextBoxAlignment;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  postscriptName: string;
  color: string;
  strokeWidth: number;
  strokeColor: string;
  lineHeight: number | 'normal';
  textDecoration: 'underline' | 'none';
  fontFeatures: OpenTypeFeatures;
}

export interface LatexTextStyleDefinition extends LatexTextStyle {
  id: string;
}

interface LatexModeKeyElement extends LatexBaseElement {
  height: number;
  marginTop?: number;
  marginBottom?: number;
  alignment: TextBoxAlignment;
  color?: string;
  fontSize?: number;
  isPlagal?: boolean;
  isVarys?: boolean;
  martyria?: SbmuflGlyphName;
  note?: SbmuflGlyphName;
  fthoraAboveNote?: SbmuflGlyphName;
  note2?: SbmuflGlyphName;
  fthoraAboveNote2?: SbmuflGlyphName;
  quantitativeNeumeAboveNote2?: SbmuflGlyphName;
  quantitativeNeumeRight?: SbmuflGlyphName;
  fthoraAboveQuantitativeNeumeRight?: SbmuflGlyphName;
  tempo?: SbmuflGlyphName;
  tempoAlignRight?: boolean;
  showAmbitus?: boolean;
  ambitusHighNote?: SbmuflGlyphName;
  ambitusHighRootSign?: SbmuflGlyphName;
  ambitusLowNote?: SbmuflGlyphName;
  ambitusLowRootSign?: SbmuflGlyphName;
}
