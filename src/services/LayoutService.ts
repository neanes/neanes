import {
  DropCapElement,
  ElementType,
  EmptyElement,
  ImageBoxElement,
  LineBreakType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import { Footer } from '@/models/Footer';
import { Header } from '@/models/Header';
import { measureBarAboveToLeft } from '@/models/NeumeReplacements';
import {
  Fthora,
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
  Scale,
  ScaleNote,
} from '@/models/Scales';
import { Score } from '@/models/Score';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { TATWEEL } from '@/utils/constants';

import { TextMeasurementService } from './TextMeasurementService';

const fontHeightCache = new Map<string, number>();
const fontBoundingBoxDescentCache = new Map<string, number>();
const textWidthCache = new Map<string, number>();
const neumeWidthCache = new Map<string, number>();
const emptyElementWidth = 39;

interface GetNoteWidthArgs {
  lyricsVerticalOffset: number;
  vareiaWidth: number;
  measureBarRightWidth: number;
  measureBarTopWidth: number;
  measureBarDoubleWidth: number;
  measureBarTheseosWidth: number;
  measureBarShortDoubleWidth: number;
  measureBarShortTheseosWidth: number;
  runningElaphronWidth: number;
  elaphronWidth: number;
}
export class LayoutService {
  public static processPages(score: Score): Page[] {
    const pageSetup = score.pageSetup;
    const elements = score.staff.elements;

    elements.forEach((element, index) => {
      element.index = index;

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

    const pages: Page[] = [];

    let page: Page = new Page();

    let line: Line = new Line();

    page.lines.push(line);
    pages.push(page);

    let currentPageHeightPx = 0;
    let currentLineWidthPx = 0;

    let lastLineHeightPx = 0;

    let lastElementWasLineBreak = false;
    let lastElementWasPageBreak = false;

    // First, calculate some constants that will
    // be used later. This is so we don't unnecessarily
    // calculate them more than once during the loop.

    const neumeHeight = TextMeasurementService.getFontHeight(
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const lyricsVerticalOffset = neumeHeight + pageSetup.lyricsVerticalOffset;

    const lyricHeight = TextMeasurementService.getFontHeight(
      pageSetup.lyricsFont,
    );

    const vareiaMapping = NeumeMappingService.getMapping(
      VocalExpressionNeume.Vareia,
    )!;
    const vareiaWidth = TextMeasurementService.getTextWidth(
      vareiaMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarRightMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarRight,
    )!;
    const measureBarRightWidth = TextMeasurementService.getTextWidth(
      measureBarRightMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarTopMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarTop,
    )!;
    const measureBarTopWidth = TextMeasurementService.getTextWidth(
      measureBarTopMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarDoubleMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarDouble,
    )!;
    const measureBarDoubleWidth = TextMeasurementService.getTextWidth(
      measureBarDoubleMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarTheseosMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarTheseos,
    )!;
    const measureBarTheseosWidth = TextMeasurementService.getTextWidth(
      measureBarTheseosMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarShortDoubleMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarShortDouble,
    )!;
    const measureBarShortDoubleWidth = TextMeasurementService.getTextWidth(
      measureBarShortDoubleMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const measureBarShortTheseosMapping = NeumeMappingService.getMapping(
      MeasureBar.MeasureBarShortTheseos,
    )!;
    const measureBarShortTheseosWidth = TextMeasurementService.getTextWidth(
      measureBarShortTheseosMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const elaphronMapping = NeumeMappingService.getMapping(
      QuantitativeNeume.Elaphron,
    )!;
    const elaphronWidth = TextMeasurementService.getTextWidth(
      elaphronMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const runningElaphronMapping = NeumeMappingService.getMapping(
      QuantitativeNeume.RunningElaphron,
    )!;
    const runningElaphronWidth = TextMeasurementService.getTextWidth(
      runningElaphronMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const widthOfUnderscore = TextMeasurementService.getTextWidth(
      '_',
      pageSetup.lyricsFont,
    );

    const widthOfHyphen = TextMeasurementService.getTextWidth(
      '-',
      pageSetup.lyricsFont,
    );

    const noteWidthArgs: GetNoteWidthArgs = {
      lyricsVerticalOffset,
      vareiaWidth,
      measureBarRightWidth,
      measureBarTopWidth,
      measureBarDoubleWidth,
      measureBarTheseosWidth,
      measureBarShortDoubleWidth,
      measureBarShortTheseosWidth,
      runningElaphronWidth,
      elaphronWidth,
    };

    // Process Header and Footers
    // Only a single text box is supported right now
    this.processHeader(score.headers.default, pageSetup, neumeHeight);
    this.processHeader(score.headers.odd, pageSetup, neumeHeight);
    this.processHeader(score.headers.even, pageSetup, neumeHeight);
    this.processHeader(score.headers.firstPage, pageSetup, neumeHeight);

    this.processFooter(score.footers.default, pageSetup, neumeHeight);
    this.processFooter(score.footers.odd, pageSetup, neumeHeight);
    this.processFooter(score.footers.even, pageSetup, neumeHeight);
    this.processFooter(score.footers.firstPage, pageSetup, neumeHeight);

    let currentLyricsEndPx =
      pageSetup.leftMargin - pageSetup.lyricsMinimumSpacing;

    let currentMelismaLyricsEndPx: number | null = null;

    let elementWithTrailingSpace: ScoreElement | null = null;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      let elementWidthPx = 0;
      let elementWidthWithLyricsPx = 0;
      let additionalWidth = 0;

      const currentPageNumber = pages.length;

      const header = score.getHeaderForPage(currentPageNumber);
      const footer = score.getFooterForPage(currentPageNumber);

      // Currently, headers and footers may only contain a single
      // text box.
      const headerHeightPx =
        header != null ? (header.elements[0] as TextBoxElement).height : 0;
      const footerHeightPx =
        footer != null ? (footer.elements[0] as TextBoxElement).height : 0;

      const extraHeaderHeightPx = Math.max(
        0,
        headerHeightPx - (pageSetup.topMargin - pageSetup.headerMargin),
      );

      const extraFooterHeightPx = Math.max(
        0,
        footerHeightPx - (pageSetup.bottomMargin - pageSetup.footerMargin),
      );

      const innerPageHeight =
        pageSetup.innerPageHeight - extraHeaderHeightPx - extraFooterHeightPx;

      switch (element.elementType) {
        case ElementType.TextBox:
          elementWidthPx = LayoutService.processTextBoxElement(
            element as TextBoxElement,
            pageSetup,
            neumeHeight,
          );
          break;
        case ElementType.ImageBox:
          {
            const imageBox = element as ImageBoxElement;
            elementWidthPx = imageBox.inline
              ? imageBox.imageWidth
              : pageSetup.innerPageWidth;
          }
          break;
        case ElementType.ModeKey: {
          const modeKeyElement = element as ModeKeyElement;

          elementWidthPx = pageSetup.innerPageWidth;

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
          break;
        }
        case ElementType.Note: {
          const noteElement = element as NoteElement;

          elementWidthPx = this.getNoteWidth(
            noteElement,
            pageSetup,
            noteWidthArgs,
          );

          const nextElement = elements[i + 1];

          // Keep note and martyria together
          // and keep two tied notes together

          const ties = [
            VocalExpressionNeume.HeteronConnecting,
            VocalExpressionNeume.HeteronConnectingLong,
            VocalExpressionNeume.HomalonConnecting,
            Tie.YfenAbove,
            Tie.YfenBelow,
          ];

          const noteTied =
            ties.includes(noteElement.vocalExpressionNeume!) ||
            ties.includes(noteElement.tie!);

          if (
            nextElement != null &&
            nextElement.elementType === ElementType.Martyria
          ) {
            additionalWidth =
              this.getMartyriaWidth(nextElement as MartyriaElement, pageSetup) +
              pageSetup.neumeDefaultSpacing;
          } else if (
            noteTied &&
            nextElement?.elementType === ElementType.Note
          ) {
            additionalWidth =
              this.getNoteWidth(
                nextElement as NoteElement,
                pageSetup,
                noteWidthArgs,
              ) + pageSetup.neumeDefaultSpacing;
          }
          break;
        }
        case ElementType.Martyria: {
          const martyriaElement = element as MartyriaElement;

          elementWidthPx = this.getMartyriaWidth(martyriaElement, pageSetup);
          break;
        }
        case ElementType.Tempo: {
          const tempoElement = element as TempoElement;
          const temoMapping = NeumeMappingService.getMapping(
            tempoElement.neume,
          )!;

          elementWidthPx =
            TextMeasurementService.getTextWidth(
              temoMapping.text,
              `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
            ) + tempoElement.spaceAfter;
          tempoElement.neumeWidth = elementWidthPx;
          break;
        }
        case ElementType.DropCap: {
          const dropCapElement = element as DropCapElement;

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

          elementWidthPx = TextMeasurementService.getTextWidth(
            dropCapElement.content,
            dropCapElement.computedFont,
          );
          break;
        }
        case ElementType.Empty: {
          const emptyElement = element as EmptyElement;
          elementWidthPx = emptyElementWidth;
          emptyElement.height = neumeHeight;
          break;
        }
        default:
          console.warn(
            `Unhandled element type in layout service: ${element.elementType}`,
          );
      }

      if (element.elementType === ElementType.Note) {
        const noteElement = element as NoteElement;

        elementWidthWithLyricsPx = Math.max(
          elementWidthPx,
          noteElement.lyricsWidth,
        );
      } else {
        elementWidthWithLyricsPx = elementWidthPx;
      }

      if (element.elementType === ElementType.Note) {
        const noteElement = element as NoteElement;
        noteElement.computedMeasureBarLeft = null;
        noteElement.computedMeasureBarRight = null;
      }

      // Check if we need a new line
      if (
        currentLineWidthPx + elementWidthWithLyricsPx + additionalWidth >
          pageSetup.innerPageWidth ||
        lastElementWasLineBreak
      ) {
        if (element.elementType === ElementType.Note) {
          const noteElement = element as NoteElement;
          const previousElement = elements[i - 1];
          if (previousElement?.elementType === ElementType.Note) {
            // If the new line starts with a left measure, apply it to the right
            // of the previous line
            const previousNoteElement = previousElement as NoteElement;
            if (
              noteElement.measureBarLeft &&
              (noteElement.elementType === ElementType.Martyria ||
                !noteElement.measureBarLeft.endsWith('Above'))
            ) {
              previousNoteElement.computedMeasureBarRight =
                noteElement.measureBarLeft;
            }
          } else if (previousElement?.elementType === ElementType.Martyria) {
            // If the previous line ends with a martyria with a barline, apply
            // it to the left of the new line
            const previousMartyriaElement = previousElement as MartyriaElement;
            const normalizedMeasureBar =
              previousMartyriaElement.measureBarLeft?.endsWith('Above')
                ? measureBarAboveToLeft.get(
                    previousMartyriaElement.measureBarLeft,
                  )
                : previousMartyriaElement.measureBarRight;
            if (normalizedMeasureBar) {
              noteElement.computedMeasureBarLeft = normalizedMeasureBar;
            }
          }
        } else if (element.elementType === ElementType.Martyria) {
          // If the new line starts with a left measure, apply it to the right
          // of the previous line
          const martyriaElement = element as MartyriaElement;
          const previousElement = elements[i - 1];
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

        line = new Line();

        page.lines.push(line);

        // Calculate the current page height
        currentPageHeightPx = 0;

        for (const line of page.lines) {
          let height = 0;

          if (
            line.elements.some(
              (x) =>
                x.elementType === ElementType.TextBox &&
                !(x as TextBoxElement).inline,
            )
          ) {
            const textbox = line.elements.find(
              (x) => x.elementType === ElementType.TextBox,
            ) as TextBoxElement;
            height = textbox.height;
          } else if (
            line.elements.some((x) => x.elementType === ElementType.ModeKey)
          ) {
            const modekey = line.elements.find(
              (x) => x.elementType === ElementType.ModeKey,
            ) as ModeKeyElement;
            height = modekey.height;
          } else if (
            line.elements.some((x) => x.elementType === ElementType.ImageBox)
          ) {
            const imageBox = line.elements.find(
              (x) => x.elementType === ElementType.ImageBox,
            ) as ImageBoxElement;
            height = imageBox.inline
              ? Math.max(imageBox.imageHeight, neumeHeight)
              : imageBox.imageHeight;
          } else if (
            line.elements.some((x) =>
              [
                ElementType.Martyria,
                ElementType.Note,
                ElementType.Tempo,
                ElementType.DropCap,
                ElementType.Empty,
              ].includes(x.elementType),
            )
          ) {
            height = Math.max(
              lyricsVerticalOffset + lyricHeight,
              pageSetup.lineHeight,
            );
          } else {
            height = pageSetup.lineHeight;
          }

          currentPageHeightPx += height;

          if (page.lines.indexOf(line) === page.lines.length - 1) {
            lastLineHeightPx = height;
          }
        }

        currentLineWidthPx = 0;
        currentLyricsEndPx =
          pageSetup.leftMargin - pageSetup.lyricsMinimumSpacing;
        currentMelismaLyricsEndPx = null;

        if (elementWithTrailingSpace != null) {
          elementWithTrailingSpace.width -= pageSetup.neumeDefaultSpacing;
          elementWithTrailingSpace = null;
        }
      }

      // Check if we need a new page
      if (currentPageHeightPx > innerPageHeight || lastElementWasPageBreak) {
        page = new Page();

        line = new Line();

        page.lines.push(line);
        pages.push(page);

        currentPageHeightPx = 0;
        currentLineWidthPx = 0;
        lastLineHeightPx = 0;
        currentLyricsEndPx =
          pageSetup.leftMargin - pageSetup.lyricsMinimumSpacing;
        currentMelismaLyricsEndPx = null;

        if (elementWithTrailingSpace != null) {
          elementWithTrailingSpace.width -= pageSetup.neumeDefaultSpacing;
          elementWithTrailingSpace = null;
        }
      }

      element.x = pageSetup.leftMargin + currentLineWidthPx;
      element.y =
        pageSetup.topMargin +
        extraHeaderHeightPx +
        currentPageHeightPx -
        lastLineHeightPx;
      element.width = elementWidthPx;

      element.line = page.lines.length;
      element.page = pages.length;

      // Special logic to adjust drop caps.
      // This aligns the bottom of the drop cap with
      // the bottom of the lyrics.
      if (element.elementType === ElementType.DropCap) {
        const distanceFromTopToBottomOfLyrics =
          lyricsVerticalOffset + pageSetup.lyricsDefaultFontSize;

        const dropCapElement = element as DropCapElement;

        const fontHeight = TextMeasurementService.getFontHeight(
          dropCapElement.computedFont,
        );
        const fontBoundingBoxDescent =
          TextMeasurementService.getFontBoundingBoxDescent(
            dropCapElement.computedFont,
          );
        const adjustment =
          fontHeight - distanceFromTopToBottomOfLyrics - fontBoundingBoxDescent;

        element.y -= adjustment;
      }

      // Special case when lyrics are longer than the neume.
      // This shifts the note element to the right to account for the
      // extra length of the lyrics to the left of the neume.
      // Thus, the lyrics start at the (previous) x position instead of the neume.
      if (element.elementType === ElementType.Note) {
        const noteElement = element as NoteElement;

        const lyricsStart =
          noteElement.x +
          noteElement.lyricsHorizontalOffset / 2 +
          noteElement.neumeWidth / 2 -
          noteElement.lyricsWidth / 2;

        const spacing = pageSetup.lyricsMinimumSpacing;

        // Ensure that there is at least a small width between the start of
        // this notes lyrics and the end of the previous note's lyrics
        if (
          currentMelismaLyricsEndPx != null &&
          (!noteElement.isMelisma || noteElement.isMelismaStart) &&
          lyricsStart <= currentMelismaLyricsEndPx + spacing
        ) {
          const adjustment = currentMelismaLyricsEndPx - lyricsStart + spacing;
          element.x += adjustment;
          element.width += adjustment;
          elementWidthPx += adjustment;
        } else if (lyricsStart <= currentLyricsEndPx + spacing) {
          const adjustment = currentLyricsEndPx - lyricsStart + spacing;
          element.x += adjustment;
          element.width += adjustment;
          elementWidthPx += adjustment;
        }

        const lyricsEnd =
          noteElement.x +
          noteElement.lyricsHorizontalOffset / 2 +
          noteElement.neumeWidth / 2 +
          noteElement.lyricsWidth / 2;

        const neumeEnd =
          noteElement.x +
          noteElement.neumeWidth +
          pageSetup.neumeDefaultSpacing;

        currentLyricsEndPx = noteElement.isMelismaStart
          ? neumeEnd
          : noteElement.spaceAfter + lyricsEnd;

        if (noteElement.isMelismaStart && noteElement.isHyphen) {
          const widthOfHyphenForThisElement = noteElement.lyricsUseDefaultStyle
            ? widthOfHyphen
            : this.getTextWidthFromCache(
                textWidthCache,
                noteElement,
                pageSetup,
                '-',
              );

          currentMelismaLyricsEndPx =
            noteElement.spaceAfter + lyricsEnd + widthOfHyphenForThisElement;
        } else if (noteElement.isMelismaStart) {
          const widthOfUnderscoreForThisElement =
            noteElement.lyricsUseDefaultStyle
              ? widthOfUnderscore
              : this.getTextWidthFromCache(
                  textWidthCache,
                  noteElement,
                  pageSetup,
                  '_',
                );

          currentMelismaLyricsEndPx =
            noteElement.spaceAfter +
            lyricsEnd +
            widthOfUnderscoreForThisElement;
        } else if (!noteElement.isMelisma) {
          currentMelismaLyricsEndPx = null;
        }
      } else {
        // Ensure that there is at least a small width between other elements
        if (element.x <= currentLyricsEndPx + pageSetup.neumeDefaultSpacing) {
          const adjustment =
            currentLyricsEndPx - element.x + pageSetup.neumeDefaultSpacing;
          element.x += adjustment;
          currentLyricsEndPx =
            element.x + element.width + pageSetup.neumeDefaultSpacing;
          element.width += adjustment;
          elementWidthPx += adjustment;
        } else {
          currentLyricsEndPx =
            element.x + element.width + pageSetup.neumeDefaultSpacing;
        }
      }

      currentLineWidthPx += elementWidthPx;

      // Add extra space between neumes
      if (
        [
          ElementType.Martyria,
          ElementType.Note,
          ElementType.Tempo,
          ElementType.DropCap,
        ].includes(element.elementType)
      ) {
        currentLineWidthPx += pageSetup.neumeDefaultSpacing;
        element.width += pageSetup.neumeDefaultSpacing;
        elementWithTrailingSpace = element;
      } else {
        elementWithTrailingSpace = null;
      }

      line.elements.push(element);

      lastElementWasLineBreak = element.lineBreak;
      lastElementWasPageBreak = element.pageBreak;

      // Handle special case for right-aligned martyria
      if (
        element.elementType === ElementType.Martyria &&
        (element as MartyriaElement).alignRight
      ) {
        lastElementWasLineBreak = true;

        // Must not use the element.width because this may include
        // additional width due to lyrics, neume spacing, etc.
        element.x =
          pageSetup.pageWidth -
          pageSetup.rightMargin -
          this.getMartyriaWidth(element as MartyriaElement, pageSetup);
      }
    }

    this.justifyLines(pages, pageSetup);

    this.addMelismas(pages, pageSetup);

    // Record element updates
    elements.forEach((element) => {
      this.checkElementState(element);
    });

    score.headersAndFooters.forEach((element) => {
      this.checkElementState(element);
    });

    return pages;
  }

  private static processHeader(
    header: Header,
    pageSetup: PageSetup,
    neumeHeight: number,
  ) {
    // Currently headers may only contain a single text box
    if (header.elements.length > 0) {
      const element = header.elements[0] as TextBoxElement;

      element.width = this.processTextBoxElement(
        element,
        pageSetup,
        neumeHeight,
      );
    }
  }

  private static processFooter(
    footer: Footer,
    pageSetup: PageSetup,
    neumeHeight: number,
  ) {
    // Currently footers may only contain a single text box
    if (footer.elements.length > 0) {
      const element = footer.elements[0] as TextBoxElement;

      element.width = this.processTextBoxElement(
        element,
        pageSetup,
        neumeHeight,
      );
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

      const lines = textBoxElement.content.split(/(?:\r\n|\r|\n)/g);

      let maxWidth = 0;

      for (const line of lines) {
        const lineWidth = TextMeasurementService.getTextWidth(
          line,
          textBoxElement.computedFont,
        );

        if (lineWidth > maxWidth) {
          maxWidth = lineWidth;
        }
      }

      elementWidthPx = maxWidth;

      const minimumWidth = TextMeasurementService.getTextWidth(
        ' ',
        textBoxElement.computedFont,
      );

      elementWidthPx = Math.max(elementWidthPx, minimumWidth);
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

    const fontHeight = TextMeasurementService.getFontHeight(
      textBoxElement.computedFont,
    );

    if (textBoxElement.inline) {
      textBoxElement.height = neumeHeight;
    } else if (textBoxElement.multipanel) {
      const height = Math.max(
        LayoutService.calculateTextBoxHeight(
          textBoxElement.contentLeft,
          fontHeight,
        ),
        LayoutService.calculateTextBoxHeight(
          textBoxElement.contentCenter,
          fontHeight,
        ),
        LayoutService.calculateTextBoxHeight(
          textBoxElement.contentRight,
          fontHeight,
        ),
      );

      textBoxElement.height = Math.max(height, fontHeight);
    } else {
      let height = 0;

      // First calculate the lines generated by the user entering
      // new line characters
      const lines = textBoxElement.content.split(/(?:\r\n|\r|\n)/g);

      for (let i = 0; i < lines.length; i++) {
        // If the last line is blank, don't include the height
        if (i === lines.length - 1 && lines[i] === '') {
          continue;
        }

        // For each line, it's possible that the line may wrap because it's too long.
        const lineCount = Math.ceil(
          TextMeasurementService.getTextWidth(
            lines[i],
            textBoxElement.computedFont,
          ) / elementWidthPx,
        );

        // We take the max of the lineCount in case the line contains
        // nothing (i.e. the user entered empty lines to add space between lines)
        height += Math.max(lineCount, 1) * fontHeight;
      }

      // Height should be at least the font height
      textBoxElement.height = Math.max(height, fontHeight);
    }

    return elementWidthPx;
  }

  private static calculateTextBoxHeight(content: string, fontHeight: number) {
    const lines = content.split(/(?:\r\n|\r|\n)/g);

    let height = 0;

    for (let i = 0; i < lines.length; i++) {
      // If the last line is blank, don't include the height
      if (i === lines.length - 1 && lines[i] === '') {
        continue;
      }
      height += fontHeight;
    }

    return height;
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
        note.computedMeasureBarRightPrevious !== note.computedMeasureBarRight;
    }

    if (!element.updated && element.elementType === ElementType.TextBox) {
      const textbox = element as TextBoxElement;

      textbox.updated =
        textbox.widthPrevious !== textbox.width ||
        textbox.heightPrevious !== textbox.height ||
        textbox.computedFontFamilyPrevious !== textbox.computedFontFamily ||
        textbox.computedFontSizePrevious !== textbox.computedFontSize ||
        textbox.computedFontWeightPrevious !== textbox.computedFontWeight ||
        textbox.computedFontStylePrevious !== textbox.computedFontStyle ||
        textbox.computedColorPrevious !== textbox.computedColor ||
        textbox.computedStrokeWidthPrevious !== textbox.computedStrokeWidth ||
        textbox.computedLineHeightPrevious !== textbox.computedLineHeight;
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
      measureBarRightWidth,
      measureBarTopWidth,
      measureBarDoubleWidth,
      measureBarTheseosWidth,
      measureBarShortDoubleWidth,
      measureBarShortTheseosWidth,
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
    const measureBarLeft =
      noteElement.measureBarLeft || noteElement.computedMeasureBarLeft;
    if (measureBarLeft === MeasureBar.MeasureBarRight) {
      noteElement.lyricsHorizontalOffset += measureBarRightWidth;
      noteElement.neumeWidth += measureBarRightWidth;
    } else if (measureBarLeft === MeasureBar.MeasureBarTop) {
      noteElement.lyricsHorizontalOffset += measureBarTopWidth;
      noteElement.neumeWidth += measureBarTopWidth;
    } else if (measureBarLeft === MeasureBar.MeasureBarDouble) {
      noteElement.lyricsHorizontalOffset += measureBarDoubleWidth;
      noteElement.neumeWidth += measureBarDoubleWidth;
    } else if (measureBarLeft === MeasureBar.MeasureBarTheseos) {
      noteElement.lyricsHorizontalOffset += measureBarTheseosWidth;
      noteElement.neumeWidth += measureBarTheseosWidth;
    } else if (measureBarLeft === MeasureBar.MeasureBarShortDouble) {
      noteElement.lyricsHorizontalOffset += measureBarShortDoubleWidth;
      noteElement.neumeWidth += measureBarShortDoubleWidth;
    } else if (measureBarLeft === MeasureBar.MeasureBarShortTheseos) {
      noteElement.lyricsHorizontalOffset += measureBarShortTheseosWidth;
      noteElement.neumeWidth += measureBarShortTheseosWidth;
    }

    const measureBarRight =
      noteElement.measureBarRight || noteElement.computedMeasureBarRight;
    if (measureBarRight === MeasureBar.MeasureBarRight) {
      noteElement.lyricsHorizontalOffset -= measureBarRightWidth;
      noteElement.neumeWidth += measureBarRightWidth;
    } else if (measureBarRight === MeasureBar.MeasureBarTop) {
      noteElement.lyricsHorizontalOffset -= measureBarTopWidth;
      noteElement.neumeWidth += measureBarTopWidth;
    } else if (measureBarRight === MeasureBar.MeasureBarDouble) {
      noteElement.lyricsHorizontalOffset -= measureBarDoubleWidth;
      noteElement.neumeWidth += measureBarDoubleWidth;
    } else if (measureBarRight === MeasureBar.MeasureBarTheseos) {
      noteElement.lyricsHorizontalOffset -= measureBarTheseosWidth;
      noteElement.neumeWidth += measureBarTheseosWidth;
    } else if (measureBarRight === MeasureBar.MeasureBarShortDouble) {
      noteElement.lyricsHorizontalOffset -= measureBarShortDoubleWidth;
      noteElement.neumeWidth += measureBarShortDoubleWidth;
    } else if (measureBarRight === MeasureBar.MeasureBarShortTheseos) {
      noteElement.lyricsHorizontalOffset -= measureBarShortTheseosWidth;
      noteElement.neumeWidth += measureBarShortTheseosWidth;
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
      ? NeumeMappingService.getMapping(martyriaElement.note)!
      : NeumeMappingService.getMapping(Note.Pa)!;
    const mappingRoot = !martyriaElement.error
      ? NeumeMappingService.getMapping(martyriaElement.rootSign)!
      : NeumeMappingService.getMapping(RootSign.Alpha)!;
    const mappingMeasureBarLeft = martyriaElement.measureBarLeft
      ? NeumeMappingService.getMapping(martyriaElement.measureBarLeft)!
      : null;
    const mappingMeasureBarRight = martyriaElement.measureBarRight
      ? NeumeMappingService.getMapping(martyriaElement.measureBarRight)!
      : null;

    // Add in padding to give some extra space between
    // the martyria and the next neume
    const padding = pageSetup.neumeDefaultFontSize * 0.148;

    martyriaElement.neumeWidth = this.getNeumeWidthFromCache(
      neumeWidthCache,
      martyriaElement.note,
      pageSetup,
    );

    return (
      martyriaElement.spaceAfter +
      (padding +
        TextMeasurementService.getTextWidth(
          mappingNote.text,
          `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
        ) +
        TextMeasurementService.getTextWidth(
          mappingRoot.text,
          `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
        ) +
        (martyriaElement.measureBarLeft
          ? TextMeasurementService.getTextWidth(
              mappingMeasureBarLeft!.text,
              `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
            )
          : 0) +
        (martyriaElement.measureBarRight
          ? TextMeasurementService.getTextWidth(
              mappingMeasureBarRight!.text,
              `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
            )
          : 0))
    );
  }

  public static justifyLines(pages: Page[], pageSetup: PageSetup) {
    for (const page of pages) {
      for (const line of page.lines) {
        if (
          pages.indexOf(page) === pages.length - 1 &&
          page.lines.indexOf(line) === page.lines.length - 1
        ) {
          continue;
        }

        if (
          line.elements.some(
            (x) =>
              x.lineBreak == true && x.lineBreakType === LineBreakType.Left,
          )
        ) {
          continue;
        }

        if (line.elements.some((x) => x.pageBreak == true)) {
          continue;
        }

        if (
          line.elements.some(
            (x) =>
              x.elementType === ElementType.Martyria &&
              (x as MartyriaElement).alignRight == true,
          )
        ) {
          continue;
        }

        if (line.elements.length < 2) {
          continue;
        }

        const alignCenter = line.elements.some(
          (x) =>
            x.lineBreak == true && x.lineBreakType === LineBreakType.Center,
        );

        const currentWidthPx = line.elements
          .map((x) => x.width)
          .reduce((sum, x) => sum + x, 0);

        const extraSpace = pageSetup.innerPageWidth - currentWidthPx;

        if (alignCenter) {
          for (let i = 0; i < line.elements.length; i++) {
            line.elements[i].x += extraSpace / 2;
          }
        } else {
          const spaceToAdd = extraSpace / (line.elements.length - 1);

          for (let i = 1; i < line.elements.length; i++) {
            line.elements[i].x += spaceToAdd * i;
          }
        }
      }
    }
  }

  public static addMelismas(pages: Page[], pageSetup: PageSetup) {
    // First calculate some constants
    const widthOfUnderscore = TextMeasurementService.getTextWidth(
      '_',
      pageSetup.lyricsFont,
    );

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
    )!;
    const elaphronWidth = TextMeasurementService.getTextWidth(
      elaphronMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    const runningElaphronMapping = NeumeMappingService.getMapping(
      QuantitativeNeume.RunningElaphron,
    )!;
    const runningElaphronWidth = TextMeasurementService.getTextWidth(
      runningElaphronMapping.text,
      `${pageSetup.neumeDefaultFontSize}px ${pageSetup.neumeDefaultFontFamily}`,
    );

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];

      for (let lineIndex = 0; lineIndex < page.lines.length; lineIndex++) {
        const line = page.lines[lineIndex];

        let firstElementOnNextLine: ScoreElement | null = null;

        if (lineIndex + 1 < page.lines.length) {
          firstElementOnNextLine = page.lines[lineIndex + 1].elements[0];
        } else if (pageIndex + 1 < pages.length) {
          firstElementOnNextLine = pages[pageIndex + 1].lines[0].elements[0];
        }

        const noteElements = line.elements.filter(
          (x) => x.elementType === ElementType.Note,
        ) as NoteElement[];

        for (const element of noteElements) {
          const index = line.elements.indexOf(element);

          const isIntermediateMelismaAtStartOfLine =
            index === 0 && element.isMelisma && !element.isMelismaStart;

          // First, clear melisma fields, since
          // they may be stale
          element.melismaText = '';
          element.hyphenOffsets = [];
          element.melismaWidth = 0;
          element.isFullMelisma = isIntermediateMelismaAtStartOfLine;

          if (element.isMelismaStart || isIntermediateMelismaAtStartOfLine) {
            // The final element in the melisma, or the final
            // element in the line
            let finalElement:
              | NoteElement
              | MartyriaElement
              | TempoElement
              | null = null;

            // The next element in the line after the final element,
            // if there is one.
            let nextElement: ScoreElement | null = null;

            for (let i = index + 1; i < line.elements.length; i++) {
              if (
                line.elements[i].elementType === ElementType.Note &&
                (line.elements[i] as NoteElement).isMelisma &&
                !(line.elements[i] as NoteElement).isMelismaStart
              ) {
                finalElement = line.elements[i] as NoteElement;
              } else if (
                (line.elements[i].elementType === ElementType.Martyria ||
                  line.elements[i].elementType === ElementType.Tempo) &&
                ((i + 1 === line.elements.length &&
                  firstElementOnNextLine?.elementType === ElementType.Note &&
                  (firstElementOnNextLine as NoteElement).isMelisma &&
                  !(firstElementOnNextLine as NoteElement).isMelismaStart) ||
                  (i + 1 < line.elements.length &&
                    line.elements[i + 1].elementType === ElementType.Note &&
                    (line.elements[i + 1] as NoteElement).isMelisma &&
                    !(line.elements[i + 1] as NoteElement).isMelismaStart))
              ) {
                // If the next element is a martyria or tempo sign, then check
                // the next note to see if the melisma should continue through
                // the martyria or tempo sign.
                finalElement =
                  line.elements[i].elementType === ElementType.Martyria
                    ? (line.elements[i] as MartyriaElement)
                    : (line.elements[i] as TempoElement);
              } else {
                nextElement = line.elements[i];
                break;
              }
            }

            let start = 0;
            let end = 0;

            if (isIntermediateMelismaAtStartOfLine) {
              // Special case. No lyrics, so start at the
              // beginning of the neume.
              start = element.x;
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

            if (element.isHyphen) {
              const nextNoteElement = nextElement as NoteElement;

              if (
                nextElement == null ||
                nextElement.elementType !== ElementType.Note
              ) {
                if (finalElement) {
                  end = finalElement.x + finalElement.neumeWidth;
                } else {
                  end = element.x + element.neumeWidth;
                }
              } else if (
                nextNoteElement.lyricsWidth > nextNoteElement.neumeWidth
              ) {
                end =
                  nextNoteElement.x -
                  (nextNoteElement.lyricsWidth -
                    nextNoteElement.neumeWidth -
                    nextNoteElement.lyricsHorizontalOffset) /
                    2;
              } else {
                end =
                  nextNoteElement.x +
                  nextNoteElement.neumeWidth / 2 -
                  nextNoteElement.lyricsWidth / 2 +
                  nextNoteElement.lyricsHorizontalOffset / 2;
              }

              element.melismaWidth = Math.max(end - start, 0);

              let numberOfHyphensNeeded = Math.floor(
                element.melismaWidth / pageSetup.hyphenSpacing,
              );

              const widthOfHyphenForThisElement = element.lyricsUseDefaultStyle
                ? widthOfHyphen
                : this.getTextWidthFromCache(
                    textWidthCache,
                    element,
                    pageSetup,
                    '-',
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
              const nextElementIsRunningElaphron =
                nextElement &&
                nextElement.elementType === ElementType.Note &&
                (nextElement as NoteElement).quantitativeNeume ===
                  QuantitativeNeume.RunningElaphron;

              // Note the special case for when the next neume is a running elaphron.
              // The melisma, which by convention must always be a final melisma,
              // should run all the way to the elaphron, instead of stopping at
              // the apostrophos.

              const nextNoteElement = nextElement as NoteElement;

              if (
                nextNoteElement != null &&
                nextNoteElement.lyricsWidth >
                  nextNoteElement.neumeWidth +
                    nextNoteElement.lyricsHorizontalOffset
              ) {
                end =
                  nextNoteElement.x +
                  nextNoteElement.lyricsHorizontalOffset / 2 -
                  (nextNoteElement.lyricsWidth - nextNoteElement.neumeWidth) /
                    2 -
                  pageSetup.lyricsMinimumSpacing;
              } else if (
                nextElementIsRunningElaphron &&
                nextNoteElement.lyricsWidth > elaphronWidth
              ) {
                end =
                  nextNoteElement.x +
                  (runningElaphronWidth - elaphronWidth) -
                  (nextNoteElement.lyricsWidth - elaphronWidth) / 2 -
                  pageSetup.lyricsMinimumSpacing;
              } else if (nextElementIsRunningElaphron) {
                // The stand-alone apostrophos is not the same width
                // as the apostrophros in the running elaphron, but
                // the elaphrons are the same width in both neumes.
                end =
                  nextNoteElement.x + (runningElaphronWidth - elaphronWidth);
              } else if (finalElement == null) {
                end = element.x + element.neumeWidth;
              } else {
                end = finalElement.x + finalElement.neumeWidth;
              }

              const widthOfUnderscoreForThisElement =
                element.lyricsUseDefaultStyle
                  ? widthOfUnderscore
                  : this.getTextWidthFromCache(
                      textWidthCache,
                      element,
                      pageSetup,
                      '_',
                    );

              // Always show at least one underscore to indicate it's a melisma.
              element.melismaWidth = Math.max(
                end - start,
                widthOfUnderscoreForThisElement,
              );

              // Calculate the distance from the alphabetic baseline to the bottom of the font bounding box
              element.melismaOffsetTop =
                -this.getFontBoundingBoxDescentFromCache(
                  fontBoundingBoxDescentCache,
                  element,
                  pageSetup,
                );

              element.melismaHeight = this.getFontHeightFromCache(
                fontHeightCache,
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
                  end = finalElement.x + finalElement.neumeWidth;
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
        note.noteIndicatorNeume = noteIndicatorMap.get(
          ((currentNote % 7) + 7) % 7,
        )!;

        const noteSpread = getNoteSpread(note.quantitativeNeume);

        const currentNotes = noteSpread.map((x) => currentNote + x);

        note.scaleNotes = noteSpread.map((x) =>
          getScaleNoteFromValue(currentNote + x),
        );

        // Handle fthora carries
        if (
          note.fthoraCarry &&
          this.fthoraIsValid(note.fthoraCarry, currentNotes, pageSetup)
        ) {
          note.fthora = note.fthoraCarry;
          note.fthoraCarry = null;
        }

        if (
          note.secondaryFthoraCarry &&
          this.fthoraIsValid(note.secondaryFthoraCarry, currentNotes, pageSetup)
        ) {
          note.secondaryFthora = note.secondaryFthoraCarry;
          note.secondaryFthoraCarry = null;
        }

        if (
          note.tertiaryFthoraCarry &&
          this.fthoraIsValid(note.tertiaryFthoraCarry, currentNotes, pageSetup)
        ) {
          note.tertiaryFthora = note.tertiaryFthoraCarry;
          note.tertiaryFthoraCarry = null;
        }

        if (note.fthora) {
          if (this.fthoraIsValid(note.fthora, currentNotes, pageSetup)) {
            const spreadIndex = getSpreadIndex(
              note.fthora,
              note.quantitativeNeume,
              NeumeSelection.Primary,
            );
            const fthoraNote =
              spreadIndex != -1 ? currentNotes[spreadIndex] : currentNote;

            currentScale =
              this.getScaleFromFthora(note.fthora, fthoraNote) || currentScale;

            currentShift = this.getShift(
              fthoraNote,
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
            this.fthoraIsValid(note.secondaryFthora, currentNotes, pageSetup)
          ) {
            const spreadIndex = getSpreadIndex(
              note.secondaryFthora,
              note.quantitativeNeume,
              NeumeSelection.Secondary,
            );
            const fthoraNote =
              spreadIndex != -1 ? currentNotes[spreadIndex] : currentNote;

            currentScale =
              this.getScaleFromFthora(note.secondaryFthora, fthoraNote) ||
              currentScale;

            currentShift = this.getShift(
              fthoraNote,
              currentScale,
              note.secondaryFthora,
              note.chromaticFthoraNote,
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
            this.fthoraIsValid(note.tertiaryFthora, currentNotes, pageSetup)
          ) {
            const spreadIndex = getSpreadIndex(
              note.tertiaryFthora,
              note.quantitativeNeume,
              NeumeSelection.Tertiary,
            );
            const fthoraNote =
              spreadIndex != -1 ? currentNotes[spreadIndex] : currentNote;

            currentScale =
              this.getScaleFromFthora(note.tertiaryFthora, fthoraNote) ||
              currentScale;

            currentShift = this.getShift(
              fthoraNote,
              currentScale,
              note.tertiaryFthora,
              note.chromaticFthoraNote,
            );

            note.noteIndicatorNeume = noteIndicatorMap.get(
              (((fthoraNote + currentShift) % 7) + 7) % 7,
            )!;
            note.tertiaryFthoraCarry = null;
          } else {
            note.tertiaryFthoraCarry = note.tertiaryFthoraCarry;
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
          currentModeKey.ambitusLowNote =
            getNoteFromValue(ambitusLow) ?? Note.Pa;
          currentModeKey.ambitusHighNote =
            getNoteFromValue(ambitusHigh) ?? Note.Pa;
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
    } else if (currentScale === Scale.Kliton) {
      shift = getScaleNoteValue(ScaleNote.Thi) - currentNote;
    } else if (currentScale === Scale.Zygos) {
      shift = getScaleNoteValue(ScaleNote.Thi) - currentNote;
    } else if (currentScale === Scale.Spathi) {
      shift = getScaleNoteValue(ScaleNote.Ke) - currentNote;
    } else if (currentScale === Scale.SpathiGa) {
      shift = getScaleNoteValue(ScaleNote.Ga) - currentNote;
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
      const neumeMapping = NeumeMappingService.getMapping(neume)!;

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

  private static getFontBoundingBoxDescentFromCache(
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

  private static getFontHeightFromCache(
    cache: Map<string, number>,
    element: NoteElement,
    pageSetup: PageSetup,
  ) {
    const font = element.lyricsUseDefaultStyle
      ? pageSetup.lyricsFont
      : element.lyricsFont;

    const key = font;

    let height = cache.get(key);

    if (height == null) {
      height = TextMeasurementService.getFontHeight(font);

      cache.set(key, height);
    }

    return height;
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
  [RootSign.Alpha, RootSign.AlphaLow],
  [RootSign.SoftChromaticPaRootSign, RootSign.SoftChromaticPaRootSignLow],
  [RootSign.SoftChromaticSquiggle, RootSign.SoftChromaticSquiggleLow],
  [RootSign.Tilt, RootSign.TiltLow],
  [RootSign.Squiggle, RootSign.SquiggleLow],
]);

const highRootSignMap = new Map<RootSign, RootSign>();

for (const [key, value] of lowRootSignMap) {
  highRootSignMap.set(value, key);
}
