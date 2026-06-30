import type {
  DropCapElement,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import { ElementType, TextBoxAlignment } from '@/models/Element';
import type { Neume } from '@/models/Neumes';
import { TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import type { Page } from '@/models/Page';
import type { PageSetup } from '@/models/PageSetup';
import type { TextStyle } from '@/models/TextStyle';
import { BUILT_IN_TEXT_STYLE_IDS, resolveTextStyle } from '@/models/TextStyle';
import { resolveFontStyle } from '@/utils/fontStyle';
import { resolvePageMargins } from '@/utils/PageMargins';
import { resolveRunningMarkerText } from '@/utils/runningMarkers';
import { Unit } from '@/utils/Unit';

import { fontService } from '../FontService';
import type { SbmuflGlyphName } from '../NeumeMappingService';
import { NeumeMappingService } from '../NeumeMappingService';
import { TextMeasurementService } from '../TextMeasurementService';

const schemaVersion = 2;

// Schema changes
// 1 to 2: Positive lyricsVerticalOffset now moves lyrics down, making it consistent with other offsets in the schema

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

function convertAlignment(alignment: TextBoxAlignment) {
  switch (alignment) {
    case TextBoxAlignment.Center:
      return 'c';
    case TextBoxAlignment.Justify:
      return 'l';
    case TextBoxAlignment.Left:
      return 'l';
    case TextBoxAlignment.Right:
      return 'r';
  }
}

function convertFontName(fontFamily: string) {
  switch (fontFamily) {
    case 'Source Serif':
      return 'Source Serif 4';
    default:
      return fontFamily;
  }
}

function toPt(value: number) {
  return Number(Unit.toPt(value).toFixed(4));
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
    textStyles: TextStyle[],
    options: LatexExporterOptions,
  ) {
    const neumeDescent = TextMeasurementService.getFontBoundingBoxDescent(
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
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
    // TODO: Extend the LaTeX export schema to carry exact font face styles
    // such as Semibold, Caption, and Display. Until then, preserve the v2
    // output contract by projecting document styles onto CSS font-style and
    // font-weight, even though that loses non-CSS face information.
    const defaultTextBoxStyle = resolveTextStyle(
      textStyles,
      BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    );
    const defaultDropCapStyle = resolveTextStyle(
      textStyles,
      BUILT_IN_TEXT_STYLE_IDS.DropCap,
    );
    const lyricsStyle = resolveTextStyle(
      textStyles,
      BUILT_IN_TEXT_STYLE_IDS.Lyrics,
    );
    const defaultTextBoxFont = resolveFontStyle(
      defaultTextBoxStyle.fontFamily,
      defaultTextBoxStyle.fontStyle,
    );
    const defaultDropCapFont = resolveFontStyle(
      defaultDropCapStyle.fontFamily,
      defaultDropCapStyle.fontStyle,
    );
    const defaultLyricsFont = resolveFontStyle(
      lyricsStyle.fontFamily,
      lyricsStyle.fontStyle,
    );

    const lyricsFont = `${defaultLyricsFont.cssFontStyle} normal ${defaultLyricsFont.cssFontWeight} ${lyricsStyle.fontSize}px "${defaultLyricsFont.cssFontFamily}"`;

    const lyricAscent =
      TextMeasurementService.getFontBoundingBoxAscent(lyricsFont);

    const lyricsVerticalOffset =
      pageSetup.lyricsVerticalOffset + neumeDescent + lyricAscent;

    const result: LatexScore = {
      appVersion: APP_VERSION,
      schemaVersion,
      sectionNames: [],
      fontVersions: {
        Neanes: fontService.getMetadata('Neanes').fontVersion,
        NeanesRTL: fontService.getMetadata('NeanesRTL').fontVersion,
        NeanesStathisSeries: fontService.getMetadata('NeanesStathisSeries')
          .fontVersion,
      },
      pageSetup: {
        lineHeight: toPt(pageSetup.lineHeight),
        martyriaVerticalOffset:
          pageSetup.martyriaVerticalOffset != 0
            ? toPt(pageSetup.martyriaVerticalOffset)
            : undefined,
        fontFamilies: {
          dropCap: convertFontName(defaultDropCapStyle.fontFamily),
          lyrics: convertFontName(lyricsStyle.fontFamily),
          neume: convertFontName(pageSetup.neumeDefaultFontFamily),
          textBox: convertFontName(defaultTextBoxStyle.fontFamily),
        },
        fontSizes: {
          dropCap: toPt(defaultDropCapStyle.fontSize),
          lyrics: toPt(lyricsStyle.fontSize),
          modeKey: toPt(pageSetup.modeKeyDefaultFontSize),
          neume: toPt(pageSetup.neumeDefaultFontSize),
          textBox: toPt(defaultTextBoxStyle.fontSize),
        },
        dropCapDefaultFontWeight:
          defaultDropCapFont.cssFontWeight != '400'
            ? defaultDropCapFont.cssFontWeight
            : undefined,
        lyricsDefaultFontWeight:
          defaultLyricsFont.cssFontWeight != '400'
            ? defaultLyricsFont.cssFontWeight
            : undefined,
        textBoxDefaultFontWeight:
          defaultTextBoxFont.cssFontWeight != '400'
            ? defaultTextBoxFont.cssFontWeight
            : undefined,
        dropCapDefaultFontStyle:
          defaultDropCapFont.cssFontStyle != 'normal'
            ? defaultDropCapFont.cssFontStyle
            : undefined,
        lyricsDefaultFontStyle:
          defaultLyricsFont.cssFontStyle != 'normal'
            ? defaultLyricsFont.cssFontStyle
            : undefined,
        textBoxDefaultFontStyle:
          defaultTextBoxFont.cssFontStyle != 'normal'
            ? defaultTextBoxFont.cssFontStyle
            : undefined,
        lyricsVerticalOffset: toPt(lyricsVerticalOffset),
        lyricsMelismaSpacing: toPt(pageSetup.lyricsMelismaSpacing),
        lyricsMelismaThickness: toPt(pageSetup.lyricsMelismaThickness),
        colors: {
          accidental: pageSetup.accidentalDefaultColor.substring(1),
          breath: pageSetup.breathDefaultColor.substring(1),
          cross: pageSetup.crossDefaultColor.substring(1),
          dropCap: defaultDropCapStyle.color.substring(1),
          fthora: pageSetup.fthoraDefaultColor.substring(1),
          gorgon: pageSetup.gorgonDefaultColor.substring(1),
          heteron: pageSetup.heteronDefaultColor.substring(1),
          ison: pageSetup.isonDefaultColor.substring(1),
          koronis: pageSetup.koronisDefaultColor.substring(1),
          lyrics: lyricsStyle.color.substring(1),
          martyria: pageSetup.martyriaDefaultColor.substring(1),
          measureBar: pageSetup.measureBarDefaultColor.substring(1),
          measureNumber: pageSetup.measureNumberDefaultColor.substring(1),
          modeKey: pageSetup.modeKeyDefaultColor.substring(1),
          neume: pageSetup.neumeDefaultColor.substring(1),
          noteIndicator: pageSetup.noteIndicatorDefaultColor.substring(1),
          tempo: pageSetup.tempoDefaultColor.substring(1),
          textBox: defaultTextBoxStyle.color.substring(1),
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
              melismaWidth:
                note.melismaWidth > 0 ? toPt(note.melismaWidth) : undefined,
              isFullMelisma: note.isFullMelisma || undefined,
              isHyphen:
                (note.hyphenOffsets.length > 0 && note.isHyphen) || undefined,
              hyphenOffsets:
                note.hyphenOffsets.length > 0
                  ? note.hyphenOffsets.map((x) => toPt(x))
                  : undefined,
            } as LatexNoteElement;

            if (note.lyrics != '' || note.melismaText != '') {
              const resolvedLyricsStyle = resolveTextStyle(
                textStyles,
                note.lyricsTextStyleId,
                note.getTextStyleOverrides(),
              );
              const lyricsFont = resolveFontStyle(
                resolvedLyricsStyle.fontFamily,
                resolvedLyricsStyle.fontStyle,
              );

              noteInfo.lyrics =
                note.lyrics != '' ? note.lyrics : note.melismaText;
              noteInfo.lyricsLeftAlign = note.alignLeft || undefined;
              noteInfo.lyricsHorizontalOffset =
                note.lyricsHorizontalOffset != 0
                  ? toPt(note.lyricsHorizontalOffset)
                  : undefined;
              noteInfo.lyricsColor =
                resolvedLyricsStyle.color != lyricsStyle.color
                  ? resolvedLyricsStyle.color.substring(1)
                  : undefined;
              noteInfo.lyricsFontFamily =
                resolvedLyricsStyle.fontFamily != lyricsStyle.fontFamily
                  ? convertFontName(resolvedLyricsStyle.fontFamily)
                  : undefined;
              noteInfo.lyricsFontSize =
                resolvedLyricsStyle.fontSize != lyricsStyle.fontSize
                  ? toPt(resolvedLyricsStyle.fontSize)
                  : undefined;
              noteInfo.lyricsFontStyle =
                lyricsFont.cssFontStyle != defaultLyricsFont.cssFontStyle
                  ? lyricsFont.cssFontStyle
                  : undefined;
              noteInfo.lyricsFontWeight =
                lyricsFont.cssFontWeight != defaultLyricsFont.cssFontWeight
                  ? lyricsFont.cssFontWeight
                  : undefined;
            }

            pushExportedElement(noteInfo);
          } else if (element.elementType === ElementType.Martyria) {
            const martyria = element as MartyriaElement;

            pushExportedElement({
              type: 'martyria',
              x: toPt(element.x - resolvedMargins.left),
              width: toPt(martyria.neumeWidth),
              verticalOffset:
                martyria.verticalOffset != 0
                  ? toPt(martyria.verticalOffset)
                  : undefined,
              note: glyphName(martyria.note),
              rootSign: glyphName(martyria.rootSign),
              fthora: glyphName(martyria.fthora),
              measureBarLeft: glyphName(martyria.measureBarLeft),
              measureBarRight: glyphName(martyria.measureBarRight),
              tempoLeft: glyphName(martyria.tempoLeft),
              tempo: glyphName(martyria.tempo),
              tempoRight: glyphName(martyria.tempoRight),
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
            const resolvedDropCapStyle = resolveTextStyle(
              textStyles,
              dropCap.textStyleId,
              dropCap.getTextStyleOverrides(),
            );
            const resolvedDropCapFont = resolveFontStyle(
              resolvedDropCapStyle.fontFamily,
              resolvedDropCapStyle.fontStyle,
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
              fontFamily:
                resolvedDropCapStyle.fontFamily !=
                defaultDropCapStyle.fontFamily
                  ? convertFontName(resolvedDropCapStyle.fontFamily)
                  : undefined,
              fontSize:
                resolvedDropCapStyle.fontSize != defaultDropCapStyle.fontSize
                  ? toPt(resolvedDropCapStyle.fontSize)
                  : undefined,
              fontStyle:
                resolvedDropCapFont.cssFontStyle !=
                defaultDropCapFont.cssFontStyle
                  ? resolvedDropCapFont.cssFontStyle
                  : undefined,
              fontWeight:
                resolvedDropCapFont.cssFontWeight !=
                defaultDropCapFont.cssFontWeight
                  ? resolvedDropCapFont.cssFontWeight
                  : undefined,
              color:
                resolvedDropCapStyle.color != defaultDropCapStyle.color
                  ? resolvedDropCapStyle.color.substring(1)
                  : undefined,
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
              alignment: convertAlignment(modeKey.alignment),
              color:
                !modeKey.useDefaultStyle &&
                modeKey.color != pageSetup.modeKeyDefaultColor
                  ? modeKey.color.substring(1)
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
            const defaultFontFamily = textBox.inline
              ? lyricsStyle.fontFamily
              : defaultTextBoxStyle.fontFamily;
            const defaultFontSize = textBox.inline
              ? lyricsStyle.fontSize
              : defaultTextBoxStyle.fontSize;
            const defaultFont = textBox.inline
              ? defaultLyricsFont
              : defaultTextBoxFont;
            const defaultColor = textBox.inline
              ? lyricsStyle.color
              : defaultTextBoxStyle.color;
            const resolvedTextStyle = resolveTextStyle(
              textStyles,
              textBox.textStyleId,
              textBox.getTextStyleOverrides(),
            );
            const resolvedTextBoxFont = resolveFontStyle(
              resolvedTextStyle.fontFamily,
              resolvedTextStyle.fontStyle,
            );

            pushExportedElement({
              type: 'textbox',
              x: toPt(element.x - resolvedMargins.left),
              width: toPt(textBox.width),
              height: toPt(textBox.height),
              alignment: !textBox.multipanel
                ? convertAlignment(resolvedTextStyle.alignment)
                : undefined,
              inline: textBox.inline || undefined,
              content: textBox.content,
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
              fontFamily:
                resolvedTextStyle.fontFamily != defaultFontFamily
                  ? convertFontName(resolvedTextStyle.fontFamily)
                  : undefined,
              fontSize:
                resolvedTextStyle.fontSize != defaultFontSize
                  ? toPt(resolvedTextStyle.fontSize)
                  : undefined,
              fontStyle:
                resolvedTextBoxFont.cssFontStyle != defaultFont.cssFontStyle
                  ? resolvedTextBoxFont.cssFontStyle
                  : undefined,
              fontWeight:
                resolvedTextBoxFont.cssFontWeight != defaultFont.cssFontWeight
                  ? resolvedTextBoxFont.cssFontWeight
                  : undefined,
              color:
                resolvedTextStyle.color != defaultColor
                  ? resolvedTextStyle.color.substring(1)
                  : undefined,
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
    dropCap: string;
    lyrics: string;
    neume: string;
    textBox: string;
  };
  fontSizes: {
    dropCap: number;
    modeKey: number;
    neume: number;
    lyrics: number;
    textBox: number;
  };
  dropCapDefaultFontWeight: string | undefined;
  lyricsDefaultFontWeight: string | undefined;
  textBoxDefaultFontWeight: string | undefined;
  dropCapDefaultFontStyle: string | undefined;
  lyricsDefaultFontStyle: string | undefined;
  textBoxDefaultFontStyle: string | undefined;
  lyricsVerticalOffset: number;
  lyricsMelismaSpacing: number;
  lyricsMelismaThickness: number;
  colors: {
    accidental: string;
    breath: string;
    cross: string;
    dropCap: string;
    fthora: string;
    gorgon: string;
    heteron: string;
    ison: string;
    koronis: string;
    lyrics: string;
    martyria: string;
    measureBar: string;
    measureNumber: string;
    modeKey: string;
    neume: string;
    noteIndicator: string;
    tempo: string;
    textBox: string;
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
  measureNumber?: SbmuflGlyphName;
  measureNumberOffset?: LatexOffset;
  measureBarLeft?: SbmuflGlyphName;
  measureBarRight?: SbmuflGlyphName;
  melismaWidth?: number;
  isFullMelisma?: boolean;
  isHyphen?: boolean;
  hyphenOffsets?: number[];
  lyrics?: string;
  lyricsLeftAlign?: boolean;
  lyricsHorizontalOffset?: number;
  lyricsColor?: string;
  lyricsFontFamily?: string;
  lyricsFontSize?: number;
  lyricsFontStyle?: string;
  lyricsFontWeight?: string;
}

interface LatexMartyriaElement extends LatexBaseElement {
  x: number;
  verticalOffset?: number;
  note: SbmuflGlyphName;
  rootSign: SbmuflGlyphName;
  fthora?: SbmuflGlyphName;
  measureBarLeft?: SbmuflGlyphName;
  measureBarRight?: SbmuflGlyphName;
  tempoLeft?: SbmuflGlyphName;
  tempo?: SbmuflGlyphName;
  tempoRight?: SbmuflGlyphName;
}

interface LatexTempoElement extends LatexBaseElement {
  x: number;
  neume: SbmuflGlyphName;
}

interface LatexDropCapElement extends LatexBaseElement {
  x: number;
  content: string;
  verticalAdjustment?: number;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  fontWeight?: string;
  color?: string;
}

interface LatexTextBoxElement extends LatexBaseElement {
  x: number;
  height: number;
  alignment: 'l' | 'c' | 'r';
  inline?: boolean;
  content: string;
  multipanel?: boolean;
  contentLeft?: string;
  contentCenter?: string;
  contentRight?: string;
  marginTop?: number;
  marginBottom?: number;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  fontWeight?: string;
  color?: string;
}

interface LatexModeKeyElement extends LatexBaseElement {
  height: number;
  marginTop?: number;
  marginBottom?: number;
  alignment: 'l' | 'c' | 'r';
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
