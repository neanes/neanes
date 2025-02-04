import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  NoteElement,
} from '@/models/Element';
import { Neume } from '@/models/Neumes';
import { Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

import { NeumeMappingService } from '../NeumeMappingService';
import { TextMeasurementService } from '../TextMeasurementService';

function glyphName(neume: Neume | null) {
  if (neume == null) {
    return undefined;
  }

  return NeumeMappingService.getMapping(neume).glyphName;
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

export class LatexExporter {
  public export(pages: Page[], pageSetup: PageSetup) {
    const neumeAscent = TextMeasurementService.getFontBoundingBoxAscent(
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const lyricAscent = TextMeasurementService.getFontBoundingBoxAscent(
      pageSetup.lyricsFont,
    );

    // TODO document this with a picture diagram explaining why this works
    const lyricVerticalOffset =
      pageSetup.lyricsVerticalOffset + lyricAscent - neumeAscent;

    const result: any = {
      pageSetup: {
        lineHeight: Unit.toPt(pageSetup.lineHeight),
        neumeDefaultFontSize: Unit.toPt(pageSetup.neumeDefaultFontSize),
        lyricsDefaultFontSize: Unit.toPt(pageSetup.lyricsDefaultFontSize),
        lyricsVerticalOffset: Unit.toPt(lyricVerticalOffset),
        lyricsMelismaSpacing: Unit.toPt(pageSetup.lyricsMelismaSpacing),
        lyricsMelismaThickness: Unit.toPt(pageSetup.lyricsMelismaThickness),
        accidentalDefaultColor: pageSetup.accidentalDefaultColor.substring(1),
        fthoraDefaultColor: pageSetup.fthoraDefaultColor.substring(1),
        gorgonDefaultColor: pageSetup.gorgonDefaultColor.substring(1),
        isonDefaultColor: pageSetup.isonDefaultColor.substring(1),
        martyriaDefaultColor: pageSetup.martyriaDefaultColor.substring(1),
        measureNumberDefaultColor:
          pageSetup.measureNumberDefaultColor.substring(1),
      },
      lines: [],
    };

    for (const page of pages) {
      for (const line of page.lines) {
        const resultLine: any = { elements: [] };
        result.lines.push(resultLine);

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
              time: glyphName(note.timeNeume),
              timeOffset: getOffset(
                note.timeNeume,
                note.timeNeumeOffsetX,
                note.timeNeumeOffsetY,
              ),
              gorgon: glyphName(note.gorgonNeume),
              gorgonOffset: getOffset(
                note.gorgonNeume,
                note.gorgonNeumeOffsetX,
                note.gorgonNeumeOffsetY,
              ),
              fthora: glyphName(note.fthora),
              fthoraOffset: getOffset(
                note.fthora,
                note.fthoraOffsetX,
                note.fthoraOffsetY,
              ),
              secondaryFthora: glyphName(note.secondaryFthora),
              secondaryFthoraOffset: getOffset(
                note.secondaryFthora,
                note.secondaryFthoraOffsetX,
                note.secondaryFthoraOffsetY,
              ),
              tertiaryFthora: glyphName(note.tertiaryFthora),
              tertiaryFthoraOffset: getOffset(
                note.tertiaryFthora,
                note.tertiaryFthoraOffsetX,
                note.tertiaryFthoraOffsetY,
              ),
              vocalExpression: glyphName(note.vocalExpressionNeume),
              accidental: glyphName(note.accidental),
              accidentalOffset: getOffset(
                note.accidental,
                note.accidentalOffsetX,
                note.accidentalOffsetY,
              ),
              secondaryAccidental: glyphName(note.secondaryAccidental),
              secondaryAccidentalOffset: getOffset(
                note.secondaryAccidental,
                note.secondaryAccidentalOffsetX,
                note.secondaryAccidentalOffsetY,
              ),
              tertiaryAccidentalOffset: getOffset(
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
              melismaWidth:
                note.lyrics != '' ? Unit.toPt(note.melismaWidth) : undefined,
              isHyphen: note.isHyphen || undefined,
              hyphenOffsets:
                note.lyrics != ''
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
              fthora:
                martyria.fthora != null
                  ? glyphName(martyria.fthora)
                  : undefined,
              measureBarLeft: glyphName(martyria.measureBarLeft),
              measureBarRight: glyphName(martyria.measureBarRight),
            });
          } else if (element.elementType === ElementType.DropCap) {
            const dropCap = element as DropCapElement;
            resultLine.elements.push({
              type: 'dropcap',
              x: Unit.toPt(element.x - pageSetup.leftMargin),
              width: Unit.toPt(dropCap.contentWidth),
              content: dropCap.content,
              fontSize: Unit.toPt(dropCap.computedFontSize),
              color: dropCap.computedColor.substring(1),
            });
          }
        }
      }
    }
    return result;
  }
}
