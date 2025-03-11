import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  TempoElement,
  TextBoxAlignment,
  TextBoxElement,
} from '@/models/Element';
import { Neume, TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import { Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

import { fontService } from '../FontService';
import { NeumeMappingService, SbmuflGlyphName } from '../NeumeMappingService';
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
    case 'Omega':
      return 'EZ Omega';
    case 'PFGoudyInitials':
      return 'PFGoudy Initials';
    default:
      return fontFamily;
  }
}

function toPt(value: number) {
  return Number(Unit.toPt(value).toFixed(4));
}

export class LatexExporter {
  public export(
    pages: Page[],
    pageSetup: PageSetup,
    options: LatexExporterOptions,
  ) {
    const neumeDescent = TextMeasurementService.getFontBoundingBoxDescent(
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const lyricAscent = TextMeasurementService.getFontBoundingBoxAscent(
      pageSetup.lyricsFont,
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
          dropCap: convertFontName(pageSetup.dropCapDefaultFontFamily),
          lyrics: convertFontName(pageSetup.lyricsDefaultFontFamily),
          neume: convertFontName(pageSetup.neumeDefaultFontFamily),
          textBox: convertFontName(pageSetup.textBoxDefaultFontFamily),
        },
        fontSizes: {
          dropCap: toPt(pageSetup.dropCapDefaultFontSize),
          lyrics: toPt(pageSetup.lyricsDefaultFontSize),
          modeKey: toPt(pageSetup.modeKeyDefaultFontSize),
          neume: toPt(pageSetup.neumeDefaultFontSize),
          textBox: toPt(pageSetup.textBoxDefaultFontSize),
        },
        dropCapDefaultFontWeight:
          pageSetup.dropCapDefaultFontWeight != '400'
            ? pageSetup.dropCapDefaultFontWeight
            : undefined,
        lyricsDefaultFontWeight:
          pageSetup.lyricsDefaultFontWeight != '400'
            ? pageSetup.lyricsDefaultFontWeight
            : undefined,
        textBoxDefaultFontWeight:
          pageSetup.textBoxDefaultFontWeight != '400'
            ? pageSetup.textBoxDefaultFontWeight
            : undefined,
        dropCapDefaultFontStyle:
          pageSetup.dropCapDefaultFontStyle != 'normal'
            ? pageSetup.dropCapDefaultFontStyle
            : undefined,
        lyricsDefaultFontStyle:
          pageSetup.lyricsDefaultFontStyle != 'normal'
            ? pageSetup.lyricsDefaultFontStyle
            : undefined,
        textBoxDefaultFontStyle:
          pageSetup.textBoxDefaultFontStyle != 'normal'
            ? pageSetup.textBoxDefaultFontStyle
            : undefined,
        lyricsVerticalOffset: toPt(lyricsVerticalOffset),
        lyricsMelismaSpacing: toPt(pageSetup.lyricsMelismaSpacing),
        lyricsMelismaThickness: toPt(pageSetup.lyricsMelismaThickness),
        colors: {
          accidental: pageSetup.accidentalDefaultColor.substring(1),
          dropCap: pageSetup.dropCapDefaultColor.substring(1),
          fthora: pageSetup.fthoraDefaultColor.substring(1),
          gorgon: pageSetup.gorgonDefaultColor.substring(1),
          heteron: pageSetup.heteronDefaultColor.substring(1),
          ison: pageSetup.isonDefaultColor.substring(1),
          koronis: pageSetup.koronisDefaultColor.substring(1),
          lyrics: pageSetup.lyricsDefaultColor.substring(1),
          martyria: pageSetup.martyriaDefaultColor.substring(1),
          measureBar: pageSetup.measureBarDefaultColor.substring(1),
          measureNumber: pageSetup.measureNumberDefaultColor.substring(1),
          modeKey: pageSetup.modeKeyDefaultColor.substring(1),
          neume: pageSetup.neumeDefaultColor.substring(1),
          noteIndicator: pageSetup.noteIndicatorDefaultColor.substring(1),
          tempo: pageSetup.tempoDefaultColor.substring(1),
          textBox: pageSetup.textBoxDefaultColor.substring(1),
        },
      },
      sections: [],
    };

    // Create the default section
    let section: LatexSection = { default: true, lines: [] };

    for (const page of pages) {
      for (const line of page.lines) {
        const resultLine: LatexLine = { elements: [] };

        for (const element of line.elements) {
          // Check for the start of a new section
          if (element.sectionName != null) {
            // If the previous section has lines, add it to the results
            if (section.lines.length > 0) {
              result.sections.push(section);
            }

            section = { name: element.sectionName, lines: [] };
          }

          if (element.elementType === ElementType.Note) {
            const note = element as NoteElement;
            const noteInfo = {
              type: 'note',
              x: toPt(element.x - pageSetup.leftMargin),
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
                note.isonOffsetY,
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
              noteInfo.lyrics =
                note.lyrics != '' ? note.lyrics : note.melismaText;
              noteInfo.lyricsLeftAlign = note.alignLeft || undefined;
              noteInfo.lyricsHorizontalOffset =
                note.lyricsHorizontalOffset != 0
                  ? toPt(note.lyricsHorizontalOffset)
                  : undefined;
              noteInfo.lyricsColor =
                !note.lyricsUseDefaultStyle &&
                note.lyricsColor != pageSetup.lyricsDefaultColor
                  ? note.lyricsColor.substring(1)
                  : undefined;
              noteInfo.lyricsFontFamily =
                !note.lyricsUseDefaultStyle &&
                note.lyricsFontFamily != pageSetup.lyricsDefaultFontFamily
                  ? convertFontName(note.lyricsFontFamily)
                  : undefined;
              noteInfo.lyricsFontSize =
                !note.lyricsUseDefaultStyle &&
                note.lyricsFontSize != pageSetup.lyricsDefaultFontSize
                  ? toPt(note.lyricsFontSize)
                  : undefined;
              noteInfo.lyricsFontStyle =
                !note.lyricsUseDefaultStyle &&
                note.lyricsFontStyle != pageSetup.lyricsDefaultFontStyle
                  ? note.lyricsFontStyle
                  : undefined;
              noteInfo.lyricsFontWeight =
                !note.lyricsUseDefaultStyle &&
                note.lyricsFontWeight != pageSetup.lyricsDefaultFontWeight
                  ? note.lyricsFontWeight
                  : undefined;
            }

            resultLine.elements.push(noteInfo);
          } else if (element.elementType === ElementType.Martyria) {
            const martyria = element as MartyriaElement;

            resultLine.elements.push({
              type: 'martyria',
              x: toPt(element.x - pageSetup.leftMargin),
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
            resultLine.elements.push({
              type: 'tempo',
              x: toPt(element.x - pageSetup.leftMargin),
              width: toPt(tempo.neumeWidth),
              neume: glyphName(tempo.neume),
            } as LatexTempoElement);
          } else if (element.elementType === ElementType.DropCap) {
            const dropCap = element as DropCapElement;

            let verticalAdjustment = 0;

            if (dropCap.lineHeight != null) {
              const fontHeight = TextMeasurementService.getFontHeight(
                dropCap.computedFont,
              );

              const originalLineHeight = fontHeight / dropCap.computedFontSize;

              verticalAdjustment =
                ((dropCap.lineHeight - originalLineHeight) *
                  dropCap.computedFontSize) /
                2;
            }

            resultLine.elements.push({
              type: 'dropcap',
              x: toPt(element.x - pageSetup.leftMargin),
              width: toPt(dropCap.contentWidth),
              verticalAdjustment:
                verticalAdjustment != 0 ? toPt(verticalAdjustment) : undefined,
              content: dropCap.content,
              fontFamily:
                !dropCap.useDefaultStyle &&
                dropCap.fontFamily != pageSetup.dropCapDefaultFontFamily
                  ? convertFontName(dropCap.fontFamily)
                  : undefined,
              fontSize:
                !dropCap.useDefaultStyle &&
                dropCap.fontSize != pageSetup.dropCapDefaultFontSize
                  ? toPt(dropCap.fontSize)
                  : undefined,
              fontStyle:
                !dropCap.useDefaultStyle &&
                dropCap.computedFontStyle != pageSetup.dropCapDefaultFontStyle
                  ? dropCap.computedFontStyle
                  : undefined,
              fontWeight:
                !dropCap.useDefaultStyle &&
                dropCap.computedFontWeight != pageSetup.dropCapDefaultFontWeight
                  ? dropCap.computedFontWeight
                  : undefined,
              color:
                !dropCap.useDefaultStyle &&
                dropCap.color != pageSetup.dropCapDefaultColor
                  ? dropCap.color.substring(1)
                  : undefined,
            } as LatexDropCapElement);
          } else if (
            element.elementType === ElementType.ModeKey &&
            options.includeModeKeys
          ) {
            const modeKey = element as ModeKeyElement;
            resultLine.elements.push({
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
                  ? modeKey.color
                  : undefined,
              fontSize:
                !modeKey.useDefaultStyle &&
                modeKey.fontSize != pageSetup.modeKeyDefaultFontSize
                  ? modeKey.fontSize
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
            resultLine.elements.push({
              type: 'textbox',
              x: toPt(element.x - pageSetup.leftMargin),
              width: toPt(textBox.width),
              height: toPt(textBox.height),
              alignment: !textBox.multipanel
                ? convertAlignment(textBox.alignment)
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
                !textBox.useDefaultStyle &&
                textBox.fontFamily != pageSetup.textBoxDefaultFontFamily
                  ? convertFontName(textBox.fontFamily)
                  : undefined,
              fontSize:
                !textBox.useDefaultStyle &&
                textBox.fontSize != pageSetup.textBoxDefaultFontSize
                  ? toPt(textBox.fontSize)
                  : undefined,
              fontStyle:
                !textBox.useDefaultStyle &&
                textBox.computedFontStyle != pageSetup.textBoxDefaultFontStyle
                  ? textBox.computedFontStyle
                  : undefined,
              fontWeight:
                !textBox.useDefaultStyle &&
                textBox.computedFontWeight != pageSetup.textBoxDefaultFontWeight
                  ? textBox.computedFontWeight
                  : undefined,
              color:
                !textBox.useDefaultStyle &&
                textBox.color != pageSetup.textBoxDefaultColor
                  ? textBox.color.substring(1)
                  : undefined,
            } as LatexTextBoxElement);
          }
        }

        if (resultLine.elements.length > 0) {
          section.lines.push(resultLine);
        }
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
