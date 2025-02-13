import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  TempoElement,
  TextBoxAlignment,
} from '@/models/Element';
import { Neume, TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import { Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

import { NeumeMappingService } from '../NeumeMappingService';
import { TextMeasurementService } from '../TextMeasurementService';

const schemaVersion = 1;

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
  y = x ?? 0;

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
export class LatexExporter {
  public export(pages: Page[], pageSetup: PageSetup) {
    const neumeAscent = TextMeasurementService.getFontBoundingBoxAscent(
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const lyricAscent = TextMeasurementService.getFontBoundingBoxAscent(
      pageSetup.lyricsFont,
    );

    // TODO document this with a picture diagram explaining why this works
    const lyricsVerticalOffset =
      pageSetup.lyricsVerticalOffset + lyricAscent - neumeAscent;

    const result: any = {
      schemaVersion,
      pageSetup: {
        lineHeight: Unit.toPt(pageSetup.lineHeight),
        fontFamilies: {
          dropCap: convertFontName(pageSetup.dropCapDefaultFontFamily),
          lyrics: convertFontName(pageSetup.lyricsDefaultFontFamily),
          neume: convertFontName(pageSetup.neumeDefaultFontFamily),
        },
        dropCapDefaultFontSize: Unit.toPt(pageSetup.dropCapDefaultFontSize),
        modeKeyDefaultFontSize: Unit.toPt(pageSetup.modeKeyDefaultFontSize),
        neumeDefaultFontSize: Unit.toPt(pageSetup.neumeDefaultFontSize),
        lyricsDefaultFontSize: Unit.toPt(pageSetup.lyricsDefaultFontSize),
        dropCapDefaultFontWeight:
          pageSetup.dropCapDefaultFontWeight != '400'
            ? pageSetup.dropCapDefaultFontWeight
            : undefined,
        lyricsDefaultFontWeight:
          pageSetup.lyricsDefaultFontWeight != '400'
            ? pageSetup.lyricsDefaultFontWeight
            : undefined,
        dropCapDefaultFontStyle:
          pageSetup.dropCapDefaultFontStyle != 'normal'
            ? pageSetup.dropCapDefaultFontStyle
            : undefined,
        lyricsDefaultFontStyle:
          pageSetup.lyricsDefaultFontStyle != 'normal'
            ? pageSetup.lyricsDefaultFontStyle
            : undefined,
        lyricsVerticalOffset: Unit.toPt(lyricsVerticalOffset),
        lyricsMelismaSpacing: Unit.toPt(pageSetup.lyricsMelismaSpacing),
        lyricsMelismaThickness: Unit.toPt(pageSetup.lyricsMelismaThickness),
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
        },
      },
      lines: [],
    };

    for (const page of pages) {
      for (const line of page.lines) {
        const resultLine: any = { elements: [] };

        for (const element of line.elements) {
          if (element.elementType === ElementType.Note) {
            const note = element as NoteElement;
            resultLine.elements.push({
              type: 'note',
              x: Unit.toPt(element.x - pageSetup.leftMargin),
              width: Unit.toPt(note.neumeWidth),
              lyricsWidth: Unit.toPt(note.lyricsWidth),
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
              lyrics: note.lyrics != '' ? note.lyrics : undefined,
              alignLeft: note.alignLeft || undefined,
              lyricsHorizontalOffset:
                note.lyrics != ''
                  ? Unit.toPt(note.lyricsHorizontalOffset)
                  : undefined,
              lyricsColor:
                !note.lyricsUseDefaultStyle &&
                note.lyricsColor != pageSetup.lyricsDefaultColor
                  ? note.lyricsColor
                  : undefined,
              lyricsFontFamily:
                !note.lyricsUseDefaultStyle &&
                note.lyricsFontFamily != pageSetup.lyricsDefaultFontFamily
                  ? note.lyricsFontFamily
                  : undefined,
              lyricsFontSize:
                !note.lyricsUseDefaultStyle &&
                note.lyricsFontSize != pageSetup.lyricsDefaultFontSize
                  ? Unit.toPt(note.lyricsFontSize)
                  : undefined,
              lyricsFontStyle:
                !note.lyricsUseDefaultStyle &&
                note.lyricsFontStyle != pageSetup.lyricsDefaultFontStyle
                  ? note.lyricsFontStyle
                  : undefined,
              lyricsFontWeight:
                !note.lyricsUseDefaultStyle &&
                note.lyricsFontWeight != pageSetup.lyricsDefaultFontWeight
                  ? note.lyricsFontWeight
                  : undefined,
              melismaWidth:
                note.melismaWidth > 0
                  ? Unit.toPt(note.melismaWidth)
                  : undefined,
              isFullMelisma: note.isFullMelisma || undefined,
              isHyphen: note.isHyphen || undefined,
              hyphenOffsets:
                note.hyphenOffsets.length > 0
                  ? note.hyphenOffsets.map((x) => Unit.toPt(x))
                  : undefined,
            });
          } else if (element.elementType === ElementType.Martyria) {
            const martyria = element as MartyriaElement;
            resultLine.elements.push({
              type: 'martyria',
              x: Unit.toPt(element.x - pageSetup.leftMargin),
              width: Unit.toPt(martyria.neumeWidth),
              note: glyphName(martyria.note),
              rootSign: glyphName(martyria.rootSign),
              fthora: glyphName(martyria.fthora),
              measureBarLeft: glyphName(martyria.measureBarLeft),
              measureBarRight: glyphName(martyria.measureBarRight),
              tempoLeft: glyphName(martyria.tempoLeft),
              tempo: glyphName(martyria.tempo),
              tempoRight: glyphName(martyria.tempoRight),
            });
          } else if (element.elementType === ElementType.Tempo) {
            const tempo = element as TempoElement;
            resultLine.elements.push({
              type: 'tempo',
              x: Unit.toPt(element.x - pageSetup.leftMargin),
              width: Unit.toPt(tempo.neumeWidth),
              neume: glyphName(tempo.neume),
            });
          } else if (element.elementType === ElementType.DropCap) {
            const dropCap = element as DropCapElement;
            resultLine.elements.push({
              type: 'dropcap',
              x: Unit.toPt(element.x - pageSetup.leftMargin),
              width: Unit.toPt(dropCap.contentWidth),
              content: dropCap.content,
              fontSize: Unit.toPt(dropCap.computedFontSize),
              fontStyle:
                dropCap.fontStyle !== 'normal' ? dropCap.fontStyle : undefined,
              fontWeight:
                dropCap.fontWeight !== '400' ? dropCap.fontWeight : undefined,
              color: dropCap.computedColor.substring(1),
            });
          } else if (element.elementType === ElementType.ModeKey) {
            const modeKey = element as ModeKeyElement;
            resultLine.elements.push({
              type: 'modekey',
              width: Unit.toPt(modeKey.width),
              height: Unit.toPt(modeKey.height),
              marginTop:
                modeKey.marginTop != 0
                  ? Unit.toPt(modeKey.marginTop)
                  : undefined,
              marginBottom:
                modeKey.marginBottom != 0
                  ? Unit.toPt(modeKey.marginBottom)
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
            });
          }
        }

        if (resultLine.elements.length > 0) {
          result.lines.push(resultLine);
        }
      }
    }
    return result;
  }
}
