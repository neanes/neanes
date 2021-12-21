import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  NoteElement,
  ModeKeyElement,
  ScoreElement,
  TextBoxElement,
  TempoElement,
} from '@/models/Element';
import { neumeMap } from '@/models/NeumeMappings';
import {
  Fthora,
  MeasureBar,
  Note,
  RootSign,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { getNeumeValue } from '@/models/NeumeValues';
import { Line, Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import { getScaleNoteValue, Scale } from '@/models/Scales';
import { TextMeasurementService } from './TextMeasurementService';

export class LayoutService {
  public static processPages(elements: ScoreElement[], pageSetup: PageSetup) {
    this.calculateMartyrias(elements);

    const defaultNeumeElementWidthPx = 39;

    const pages: Page[] = [];

    let page: Page = {
      lines: [],
    };

    let line: Line = {
      elements: [],
    };

    page.lines.push(line);
    pages.push(page);

    let currentPageHeightPx = 0;
    let currentLineWidthPx = 0;

    let lastLineHeightPx = 0;

    let lastElementWasLineBreak = false;
    let lastElementWasPageBreak = false;

    for (let element of elements) {
      let elementWidthPx = defaultNeumeElementWidthPx;

      if (element.elementType === ElementType.TextBox) {
        let textBoxElement = element as TextBoxElement;

        elementWidthPx = pageSetup.innerPageWidth;
        textBoxElement.height = Math.ceil(
          TextMeasurementService.getTextHeight(
            textBoxElement.content,
            `${textBoxElement.fontSize}px ${textBoxElement.fontFamily}`,
          ),
        );
      }

      if (element.elementType === ElementType.ModeKey) {
        let modeKeyElement = element as ModeKeyElement;

        elementWidthPx = pageSetup.innerPageWidth;
        modeKeyElement.height = Math.ceil(
          Math.max(
            TextMeasurementService.getFontHeight(
              `${modeKeyElement.fontSize}px Oxeia`,
            ),
            TextMeasurementService.getFontHeight(
              `${modeKeyElement.fontSize}px EzSpecial2`,
            ),
          ),
        );
      }

      if (element.elementType === ElementType.StaffText) {
        line.elements.push(element);
        continue;
      }

      if (element.elementType === ElementType.Note) {
        const noteElement = element as NoteElement;
        const mapping = neumeMap.get(noteElement.quantitativeNeume)!;
        let vareiaWidth = 0;
        let measureBarWidth = 0;

        if (
          noteElement.vocalExpressionNeume != null &&
          noteElement.vocalExpressionNeume === VocalExpressionNeume.Vareia
        ) {
          const vareiaMapping = neumeMap.get(VocalExpressionNeume.Vareia)!;
          vareiaWidth = Math.floor(
            TextMeasurementService.getTextWidth(
              vareiaMapping.text,
              `${pageSetup.neumeDefaultFontSize}px ${vareiaMapping.fontFamily}`,
            ),
          );
        }

        if (noteElement.measureBar != null) {
          const measureBarMapping = neumeMap.get(noteElement.measureBar)!;
          measureBarWidth = Math.floor(
            TextMeasurementService.getTextWidth(
              measureBarMapping.text,
              `${pageSetup.neumeDefaultFontSize}px ${measureBarMapping.fontFamily}`,
            ),
          );
        }

        const neumeWidth = TextMeasurementService.getTextWidth(
          mapping.text,
          `${pageSetup.neumeDefaultFontSize}px ${mapping.fontFamily}`,
        );

        noteElement.neumeWidth = Math.floor(
          neumeWidth + vareiaWidth + measureBarWidth,
        );
        noteElement.lyricsWidth = Math.floor(
          TextMeasurementService.getTextWidth(
            noteElement.lyrics,
            `${pageSetup.lyricsDefaultFontSize}px ${pageSetup.lyricsDefaultFontFamily}`,
          ),
        );

        elementWidthPx = Math.max(
          noteElement.neumeWidth,
          noteElement.lyricsWidth,
        );
      } else if (element.elementType === ElementType.Martyria) {
        const martyriaElement = element as MartyriaElement;
        const mappingNote = neumeMap.get(martyriaElement.note)!;
        const mappingRoot = neumeMap.get(martyriaElement.rootSign)!;
        const mappingApostrophe = neumeMap.get(Note.Apostrophe)!;
        const mappingMeasureBar = martyriaElement.measureBar
          ? neumeMap.get(martyriaElement.measureBar)!
          : null;

        elementWidthPx = Math.floor(
          TextMeasurementService.getTextWidth(
            mappingNote.text,
            `${pageSetup.neumeDefaultFontSize}px ${mappingNote.fontFamily}`,
          ) +
            TextMeasurementService.getTextWidth(
              mappingRoot.text,
              `${pageSetup.neumeDefaultFontSize}px ${mappingRoot.fontFamily}`,
            ) +
            (martyriaElement.apostrophe
              ? TextMeasurementService.getTextWidth(
                  mappingApostrophe.text,
                  `${pageSetup.neumeDefaultFontSize}px ${mappingApostrophe.fontFamily}`,
                )
              : 0) +
            (martyriaElement.measureBar
              ? TextMeasurementService.getTextWidth(
                  mappingMeasureBar!.text,
                  `${pageSetup.neumeDefaultFontSize}px ${
                    mappingMeasureBar!.fontFamily
                  }`,
                )
              : 0),
        );
      } else if (element.elementType === ElementType.Tempo) {
        const tempoElement = element as TempoElement;
        const mapping = neumeMap.get(tempoElement.neume)!;

        elementWidthPx = Math.floor(
          TextMeasurementService.getTextWidth(
            mapping.text,
            `${pageSetup.neumeDefaultFontSize}px ${mapping.fontFamily}`,
          ),
        );
      } else if (element.elementType === ElementType.DropCap) {
        const dropCapElement = element as DropCapElement;
        const dropCapFontFamily =
          dropCapElement.fontFamily || pageSetup.dropCapDefaultFontFamily;
        const dropCapFontSize =
          dropCapElement.fontSize || pageSetup.dropCapDefaultFontSize;
        elementWidthPx = Math.floor(
          TextMeasurementService.getTextWidth(
            dropCapElement.content,
            `${dropCapFontSize}px ${dropCapFontFamily}`,
          ),
        );
      }

      if (
        currentLineWidthPx + elementWidthPx > pageSetup.innerPageWidth ||
        lastElementWasLineBreak
      ) {
        line = {
          elements: [],
        };

        page.lines.push(line);

        // Calculate the current page height
        currentPageHeightPx = 0;

        for (let line of page.lines) {
          let height = 0;

          if (
            line.elements.some((x) => x.elementType === ElementType.TextBox)
          ) {
            const textbox = line.elements.find(
              (x) => x.elementType === ElementType.TextBox,
            ) as TextBoxElement;
            height = Math.max(10, textbox.height * 2);
          } else if (
            line.elements.some((x) => x.elementType === ElementType.ModeKey)
          ) {
            const textbox = line.elements.find(
              (x) => x.elementType === ElementType.ModeKey,
            ) as ModeKeyElement;
            height = Math.max(10, textbox.height);
          } else {
            height = pageSetup.lineHeight;
          }

          currentPageHeightPx += height;

          if (page.lines.indexOf(line) === page.lines.length - 1) {
            lastLineHeightPx = height;
          }
        }

        currentLineWidthPx = 0;
      }

      if (
        currentPageHeightPx > pageSetup.innerPageHeight ||
        lastElementWasPageBreak
      ) {
        page = {
          lines: [],
        };

        line = {
          elements: [],
        };

        page.lines.push(line);
        pages.push(page);

        currentPageHeightPx = 0;
        currentLineWidthPx = 0;
        lastLineHeightPx = 0;
      }

      element.x = pageSetup.leftMargin + currentLineWidthPx;
      element.y = pageSetup.topMargin + currentPageHeightPx - lastLineHeightPx;
      element.width = elementWidthPx + pageSetup.neumeDefaultSpacing;

      // Special logic to adjust drop caps.
      // This aligns the bottom of the drop cap with
      // the bottom of the lyrics.
      if (element.elementType === ElementType.DropCap) {
        const distanceFromTopToBottomOfLyrics =
          pageSetup.lyricsVerticalOffset + pageSetup.lyricsDefaultFontSize;
        const dropCapElement = element as DropCapElement;
        const dropCapFontFamily =
          dropCapElement.fontFamily || pageSetup.dropCapDefaultFontFamily;
        const dropCapFontSize =
          dropCapElement.fontSize || pageSetup.dropCapDefaultFontSize;
        const dropCapFont = `${dropCapFontSize}px ${dropCapFontFamily}`;
        const fontHeight = TextMeasurementService.getFontHeight(dropCapFont);
        const fountBoundingBoxDescent =
          TextMeasurementService.getFontBoundingBoxDescent(
            dropCapElement.content,
            dropCapFont,
          );
        const adjustment = Math.floor(
          fontHeight -
            distanceFromTopToBottomOfLyrics -
            fountBoundingBoxDescent,
        );

        element.y -= adjustment;
      }

      // Special case when lyrics are longer than the neume.
      // This shifts the note element to the right to account for the
      // extra length of the lyrics to the left of the neume.
      // Thus, the lyrics start at the (previous) x position instead of the neume.
      if (element.elementType === ElementType.Note) {
        const noteElement = element as NoteElement;

        if (noteElement.lyricsWidth > noteElement.neumeWidth) {
          const adjustment =
            (noteElement.lyricsWidth - noteElement.neumeWidth) / 2;
          element.x += adjustment;
        }
      }

      currentLineWidthPx += elementWidthPx + pageSetup.neumeDefaultSpacing;
      line.elements.push(element);

      lastElementWasLineBreak = element.lineBreak;
      lastElementWasPageBreak = element.pageBreak;
    }

    this.justifyLines(pages, pageSetup);

    this.addMelismas(pages, pageSetup);

    return pages;
  }

  public static justifyLines(pages: Page[], pageSetup: PageSetup) {
    for (let page of pages) {
      for (let line of page.lines) {
        if (
          pages.indexOf(page) === pages.length - 1 &&
          page.lines.indexOf(line) === page.lines.length - 1
        ) {
          continue;
        }

        if (line.elements.some((x) => x.lineBreak == true)) {
          continue;
        }

        if (line.elements.some((x) => x.pageBreak == true)) {
          continue;
        }

        let currentWidthPx = line.elements
          .map((x) => x.width)
          .reduce((sum, x) => sum + x, 0);

        let extraSpace = pageSetup.innerPageWidth - currentWidthPx;

        let spaceToAdd = extraSpace / line.elements.length;

        for (let [elementIndex, element] of line.elements.entries()) {
          element.x += spaceToAdd * (elementIndex + 1);
        }
      }
    }
  }

  public static addMelismas(pages: Page[], pageSetup: PageSetup) {
    let widthOfUnderscore = TextMeasurementService.getTextWidth(
      '_',
      `${pageSetup.lyricsDefaultFontSize}px ${pageSetup.lyricsDefaultFontFamily}`,
    );

    for (let page of pages) {
      for (let line of page.lines) {
        const noteElements = line.elements.filter(
          (x) => x.elementType === ElementType.Note,
        ) as NoteElement[];

        for (let element of noteElements) {
          const index = line.elements.indexOf(element);

          // Special logic when this is the first intermediate melisma on a line
          if (index === 0 && element.isMelisma && !element.isMelismaStart) {
            if (this.isIntermediateMelisma(element, line.elements)) {
              const nextElement = line.elements[index + 1] as NoteElement;

              let lyrics2Left = 0;

              if (nextElement.lyricsWidth > nextElement.neumeWidth) {
                lyrics2Left =
                  nextElement.x -
                  (nextElement.lyricsWidth - nextElement.neumeWidth) / 2;
              } else {
                lyrics2Left =
                  nextElement.x +
                  nextElement.neumeWidth / 2 -
                  nextElement.lyricsWidth / 2;
              }

              const width = lyrics2Left - element.x;
              const numberOfUnderScoresNeeded =
                width > 0 ? Math.ceil(width / widthOfUnderscore) : 1;

              element.melismaOffsetLeft =
                (numberOfUnderScoresNeeded * widthOfUnderscore -
                  element.neumeWidth) /
                2;

              element.melismaText = '';

              for (let i = 0; i < numberOfUnderScoresNeeded; i++) {
                element.melismaText += '_';
              }
            } else if (this.isFinalMelisma(element, line.elements)) {
              const width = element.neumeWidth;
              const numberOfUnderScoresNeeded =
                width > 0 ? Math.ceil(width / widthOfUnderscore) : 1;

              element.melismaOffsetLeft =
                (numberOfUnderScoresNeeded * widthOfUnderscore -
                  element.neumeWidth) /
                2;

              element.melismaText = '';

              for (let i = 0; i < numberOfUnderScoresNeeded; i++) {
                element.melismaText += '_';
              }
            }
          } else {
            element.melismaOffsetLeft = null;

            if (this.isIntermediateMelisma(element, line.elements)) {
              const nextElement = line.elements[index + 1] as NoteElement;

              let lyrics1Right = 0;
              let lyrics2Left = 0;

              if (element.lyricsWidth > element.neumeWidth) {
                lyrics1Right =
                  element.x +
                  element.neumeWidth +
                  (element.lyricsWidth - element.neumeWidth) / 2;
              } else {
                lyrics1Right =
                  element.x + element.neumeWidth / 2 + element.lyricsWidth / 2;
              }

              if (nextElement.lyricsWidth > nextElement.neumeWidth) {
                lyrics2Left =
                  nextElement.x -
                  (nextElement.lyricsWidth - nextElement.neumeWidth) / 2;
              } else {
                lyrics2Left =
                  nextElement.x +
                  nextElement.neumeWidth / 2 -
                  nextElement.lyricsWidth / 2;
              }

              // Stretch from the end of the lyrics in the current element
              // to the beginning of the lyrics in the next element
              let width = lyrics2Left - lyrics1Right;

              let numberOfUnderScoresNeeded =
                width > 0 ? Math.ceil(width / widthOfUnderscore) : 1;

              element.melismaText = '';

              for (let i = 0; i < numberOfUnderScoresNeeded; i++) {
                element.melismaText += '_';
              }
            } else if (this.isFinalMelisma(element, line.elements)) {
              const lyricsLeft =
                element.x + element.neumeWidth / 2 - element.lyricsWidth / 2;
              const neumeRight = element.x + element.neumeWidth;

              // Stretch from the start of the lyrics to the end of the neume
              let width = element.neumeWidth / 2 - element.lyricsWidth / 2;

              let numberOfUnderScoresNeeded = Math.floor(
                width / widthOfUnderscore,
              );

              element.melismaText = '';

              for (let i = 0; i < numberOfUnderScoresNeeded; i++) {
                element.melismaText += '_';
              }
            }
          }
        }
      }
    }
  }

  public static calculateMartyrias(elements: ScoreElement[]) {
    let currentNote = 0;
    let currentScale = Scale.Diatonic;
    let currentShift = 0;

    for (let element of elements) {
      if (element.elementType === ElementType.Note) {
        const note = element as NoteElement;
        currentNote += getNeumeValue(note.quantitativeNeume)!;

        if (note.fthora) {
          currentScale = this.getScaleFromFthora(note.fthora) || currentScale;
          currentShift = this.getShift(currentNote, currentScale, note.fthora);
        }
      } else if (element.elementType === ElementType.ModeKey) {
        const modeKey = element as ModeKeyElement;
        currentNote = getScaleNoteValue(modeKey.scaleNote);
        currentScale = modeKey.scale;
        if (modeKey.fthora) {
          currentShift = this.getShift(
            currentNote,
            currentScale,
            modeKey.fthora,
          );
        }
      } else if (element.elementType === ElementType.Martyria) {
        const martyria = element as MartyriaElement;

        if (martyria.auto) {
          if (currentNote < -5 || currentNote > 11) {
            martyria.error = true;
          } else {
            martyria.error = false;

            martyria.note = this.noteMap.get(currentNote)!;

            const currentScaleNote = currentNote + currentShift;

            if (currentScale === Scale.HardChromatic) {
              martyria.rootSign =
                currentScaleNote % 2 === 0 ? RootSign.Squiggle : RootSign.Tilt;
            } else if (currentScale === Scale.SoftChromatic) {
              martyria.rootSign =
                currentScaleNote % 2 === 0
                  ? RootSign.SoftChromaticPaRootSign
                  : RootSign.SoftChromaticSquiggle;
            } else if (currentScale === Scale.Diatonic) {
              martyria.rootSign =
                this.diatonicRootSignMap.get(currentScaleNote)!;
            }

            martyria.apostrophe = currentNote > 4;
          }

          if (martyria.fthora) {
            currentScale =
              this.getScaleFromFthora(martyria.fthora) || currentScale;
            currentShift = this.getShift(
              currentNote,
              currentScale,
              martyria.fthora,
            );
          }
        }
      }
    }
  }

  public static isIntermediateMelisma(
    element: NoteElement,
    elements: ScoreElement[],
  ) {
    const index = elements.indexOf(element);

    if (element.isMelisma) {
      let nextElement = elements[index + 1] as NoteElement;

      return (
        nextElement && nextElement.isMelisma && !nextElement.isMelismaStart
      );
    }

    return false;
  }

  public static isFinalMelisma(element: NoteElement, elements: ScoreElement[]) {
    const index = elements.indexOf(element);

    if (element.isMelisma) {
      let nextElement = elements[index + 1] as NoteElement;

      return (
        !nextElement || !nextElement.isMelisma || nextElement.isMelismaStart
      );
    }

    return false;
  }

  private static noteMap = new Map<number, Note>([
    [-5, Note.GaLow],
    [-4, Note.ThiLow],
    [-3, Note.KeLow],
    [-2, Note.Zo],
    [-1, Note.Ni],
    [0, Note.Pa],
    [1, Note.Vou],
    [2, Note.Ga],
    [3, Note.Thi],
    [4, Note.Ke],
    [5, Note.Zo],
    [6, Note.Ni],
    [7, Note.Pa],
    [8, Note.Vou],
    [9, Note.Ga],
    [10, Note.Thi],
    [11, Note.Ke],
  ]);

  private static diatonicRootSignMap = new Map<number, RootSign>([
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

  private static getScaleFromFthora(fthora: Fthora) {
    if (fthora.startsWith('Diatonic')) {
      return Scale.Diatonic;
    }

    if (fthora.startsWith('HardChromatic')) {
      return Scale.HardChromatic;
    }

    if (fthora.startsWith('SoftChromatic')) {
      return Scale.SoftChromatic;
    }

    return null;
  }

  private static getShift(
    currentNote: number,
    currentScale: Scale,
    fthora: Fthora,
  ) {
    let shift = 0;

    if (currentScale === Scale.HardChromatic) {
      if (currentNote % 2 === 0) {
        shift = fthora.startsWith('HardChromaticPa') ? 0 : 1;
      } else {
        shift = fthora.startsWith('HardChromaticThi') ? 0 : 1;
      }
    } else if (currentScale === Scale.SoftChromatic) {
      if (currentNote % 2 === 0) {
        shift = fthora.startsWith('SoftChromaticPa') ? 0 : 1;
      } else {
        shift = fthora.startsWith('SoftChromaticThi') ? 0 : 1;
      }
    } else if (currentScale === Scale.Diatonic) {
      let fthoraNote = 0;

      if (fthora.startsWith('DiatonicNiLow')) {
        fthoraNote = -1;
      } else if (fthora.startsWith('DiatonicPa')) {
        fthoraNote = 0;
      } else if (fthora.startsWith('DiatonicVou')) {
        fthoraNote = 1;
      } else if (fthora.startsWith('DiatonicGa')) {
        fthoraNote = 2;
      } else if (fthora.startsWith('DiatonicThi')) {
        fthoraNote = 3;
      } else if (fthora.startsWith('DiatonicKe')) {
        fthoraNote = 4;
      } else if (fthora.startsWith('DiatonicZo')) {
        fthoraNote = 5;
      } else if (fthora.startsWith('DiatonicNiHigh')) {
        fthoraNote = 6;
      }

      shift = fthoraNote - currentNote;
    }

    return shift;
  }
}
