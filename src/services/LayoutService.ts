import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  NoteElement,
  ModeKeyElement,
  ScoreElement,
  TextBoxElement,
  TempoElement,
  EmptyElement,
  LineBreakType,
} from '@/models/Element';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import {
  Fthora,
  MeasureBar,
  Neume,
  Note,
  NoteIndicator,
  QuantitativeNeume,
  RootSign,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { getNeumeValue } from '@/models/NeumeValues';
import { Line, Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import {
  getScaleNoteFromValue,
  getScaleNoteValue,
  Scale,
  ScaleNote,
} from '@/models/Scales';
import { TextMeasurementService } from './TextMeasurementService';
import { Score } from '@/models/Score';
import { Header } from '@/models/Header';
import { Footer } from '@/models/Footer';

const textWidthCache = new Map<string, number>();
const neumeWidthCache = new Map<string, number>();

interface GetNoteWidthArgs {
  lyricsVerticalOffset: number;
  vareiaWidth: number;
  measureBarRightWidth: number;
  measureBarTopWidth: number;
  runningElaphronWidth: number;
  elaphronWidth: number;
}

export class LayoutService {
  public static processPages(score: Score): Page[] {
    const pageSetup = score.pageSetup;
    const elements = score.staff.elements;

    elements.forEach((x, index) => (x.index = index));

    this.calculateMartyrias(elements);

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

    const noteWidthArgs: GetNoteWidthArgs = {
      lyricsVerticalOffset,
      vareiaWidth,
      measureBarRightWidth,
      measureBarTopWidth,
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
          ];

          if (
            nextElement != null &&
            nextElement.elementType === ElementType.Martyria
          ) {
            additionalWidth =
              this.getMartyriaWidth(nextElement as MartyriaElement, pageSetup) +
              pageSetup.neumeDefaultSpacing;
          } else if (
            noteElement.vocalExpressionNeume != null &&
            ties.includes(noteElement?.vocalExpressionNeume) &&
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
          break;
        }
        case ElementType.DropCap: {
          const dropCapElement = element as DropCapElement;
          const dropCapFontFamily =
            dropCapElement.fontFamily || pageSetup.dropCapDefaultFontFamily;
          const dropCapFontSize =
            dropCapElement.fontSize || pageSetup.dropCapDefaultFontSize;
          const dropCapFontWeight =
            dropCapElement.fontWeight || pageSetup.dropCapDefaultFontWeight;
          const dropCapFontStyle =
            dropCapElement.fontStyle || pageSetup.dropCapDefaultFontStyle;
          elementWidthPx = TextMeasurementService.getTextWidth(
            dropCapElement.content,
            `${dropCapFontStyle} normal ${dropCapFontWeight} ${dropCapFontSize}px "${dropCapFontFamily}"`,
          );
          break;
        }
        case ElementType.Empty: {
          const emptyElement = element as EmptyElement;
          elementWidthPx = 39;
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

      // Check if we need a new line
      if (
        currentLineWidthPx + elementWidthWithLyricsPx + additionalWidth >
          pageSetup.innerPageWidth ||
        lastElementWasLineBreak
      ) {
        line = new Line();

        page.lines.push(line);

        // Calculate the current page height
        currentPageHeightPx = 0;

        for (let line of page.lines) {
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
            const textbox = line.elements.find(
              (x) => x.elementType === ElementType.ModeKey,
            ) as ModeKeyElement;
            height = textbox.height;
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

      // Special logic to adjust drop caps.
      // This aligns the bottom of the drop cap with
      // the bottom of the lyrics.
      if (element.elementType === ElementType.DropCap) {
        const distanceFromTopToBottomOfLyrics =
          lyricsVerticalOffset + pageSetup.lyricsDefaultFontSize;

        const dropCapElement = element as DropCapElement;

        const dropCapFontFamily =
          dropCapElement.fontFamily || pageSetup.dropCapDefaultFontFamily;
        const dropCapFontSize =
          dropCapElement.fontSize || pageSetup.dropCapDefaultFontSize;
        const dropCapFontWeight =
          dropCapElement.fontWeight || pageSetup.dropCapDefaultFontWeight;
        const dropCapFontStyle =
          dropCapElement.fontStyle || pageSetup.dropCapDefaultFontStyle;

        const dropCapFont = `${dropCapFontStyle} normal ${dropCapFontWeight} ${dropCapFontSize}px "${dropCapFontFamily}"`;
        const fontHeight = TextMeasurementService.getFontHeight(dropCapFont);
        const fountBoundingBoxDescent =
          TextMeasurementService.getFontBoundingBoxDescent(
            dropCapElement.content,
            dropCapFont,
          );
        const adjustment =
          fontHeight -
          distanceFromTopToBottomOfLyrics -
          fountBoundingBoxDescent;

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
        if (lyricsStart <= currentLyricsEndPx + spacing) {
          const adjustment = currentLyricsEndPx - lyricsStart + spacing;
          element.x += adjustment;
          element.width += adjustment;
          elementWidthPx += adjustment;
          console.log('adjusting', adjustment, noteElement.lyrics);
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

        currentLyricsEndPx =
          noteElement.isMelisma && !noteElement.isHyphen ? neumeEnd : lyricsEnd;
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
          console.log('adjusting', adjustment);
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

        element.x = pageSetup.pageWidth - pageSetup.rightMargin - element.width;
      }
    }

    this.justifyLines(pages, pageSetup);

    this.addMelismas(pages, pageSetup);

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

      elementWidthPx = TextMeasurementService.getTextWidth(
        textBoxElement.content,
        textBoxElement.computedFont,
      );

      const minimumWidth = TextMeasurementService.getTextWidth(
        ' ',
        textBoxElement.computedFont,
      );

      elementWidthPx = Math.max(elementWidthPx, minimumWidth);
    } else {
      elementWidthPx = pageSetup.innerPageWidth;

      textBoxElement.computedFontFamily = textBoxElement.fontFamily;
      textBoxElement.computedFontSize = textBoxElement.fontSize;
      textBoxElement.computedColor = textBoxElement.color;
      textBoxElement.computedStrokeWidth = textBoxElement.strokeWidth;
      textBoxElement.computedFontWeight = textBoxElement.bold ? '700' : '400';
      textBoxElement.computedFontStyle = textBoxElement.italic
        ? 'italic'
        : 'normal';
    }

    const fontHeight = TextMeasurementService.getFontHeight(
      textBoxElement.computedFont,
    );

    if (textBoxElement.inline) {
      textBoxElement.height = neumeHeight;
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
        noteElement.lyrics,
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
      noteElement.lyricsHorizontalOffset += vareiaWidth;
      noteElement.neumeWidth += vareiaWidth;
    }

    // Handle special case for measure bars:
    // Shift the lyrics to the right so that they
    // are centered under the main neume
    if (noteElement.measureBarLeft === MeasureBar.MeasureBarRight) {
      noteElement.lyricsHorizontalOffset += measureBarRightWidth;
      noteElement.neumeWidth += measureBarRightWidth;
    }

    if (noteElement.measureBarLeft === MeasureBar.MeasureBarTop) {
      noteElement.lyricsHorizontalOffset += measureBarTopWidth;
      noteElement.neumeWidth += measureBarTopWidth;
    }

    if (noteElement.measureBarRight === MeasureBar.MeasureBarRight) {
      noteElement.lyricsHorizontalOffset -= measureBarRightWidth;
      noteElement.neumeWidth += measureBarRightWidth;
    }

    if (noteElement.measureBarRight === MeasureBar.MeasureBarTop) {
      noteElement.lyricsHorizontalOffset -= measureBarTopWidth;
      noteElement.neumeWidth += measureBarTopWidth;
    }

    // Handle special case for running elaphron:
    // Shift the lyrics to the right so that they
    // are centered under the elaphron
    if (noteElement.quantitativeNeume === QuantitativeNeume.RunningElaphron) {
      // The stand-alone apostrophos is not the same width
      // as the apostrophros in the running elaphron, but
      // the elaphrons are the same width in both neumes.
      const offset = runningElaphronWidth - elaphronWidth;
      noteElement.lyricsHorizontalOffset += offset;
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
    for (let page of pages) {
      for (let line of page.lines) {
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

        let alignCenter = line.elements.some(
          (x) =>
            x.lineBreak == true && x.lineBreakType === LineBreakType.Center,
        );

        let currentWidthPx = line.elements
          .map((x) => x.width)
          .reduce((sum, x) => sum + x, 0);

        let extraSpace = pageSetup.innerPageWidth - currentWidthPx;

        if (alignCenter) {
          for (let i = 0; i < line.elements.length; i++) {
            line.elements[i].x += extraSpace / 2;
          }
        } else {
          let spaceToAdd = extraSpace / (line.elements.length - 1);

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

    for (let page of pages) {
      for (let line of page.lines) {
        const noteElements = line.elements.filter(
          (x) => x.elementType === ElementType.Note,
        ) as NoteElement[];

        for (let element of noteElements) {
          const index = line.elements.indexOf(element);

          const isIntermediateMelismaAtStartOfLine =
            index === 0 && element.isMelisma && !element.isMelismaStart;

          // First, clear melisma fields, since
          // they may be stale
          element.melismaText = '';
          element.melismaWidth = 0;
          element.isFullMelisma = isIntermediateMelismaAtStartOfLine;

          if (element.isMelismaStart || isIntermediateMelismaAtStartOfLine) {
            // The final element in the melisma, or the final
            // element in the line
            let finalElement: NoteElement | null = null;

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
              start =
                element.x +
                element.neumeWidth +
                (element.lyricsWidth - element.neumeWidth) / 2;
            } else {
              start =
                element.x +
                element.neumeWidth / 2 +
                element.lyricsWidth / 2 +
                element.lyricsHorizontalOffset / 2;
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
                  (nextNoteElement.lyricsWidth - nextNoteElement.neumeWidth) /
                    2;
              } else {
                end =
                  nextNoteElement.x +
                  nextNoteElement.neumeWidth / 2 -
                  nextNoteElement.lyricsWidth / 2 +
                  nextNoteElement.lyricsHorizontalOffset;
              }

              element.melismaWidth = Math.max(end - start, 0);

              let numberOfHyphensNeeded = Math.floor(
                element.melismaWidth / pageSetup.hyphenSpacing,
              );

              // If this is the last note on the page, always show the hyphen
              if (numberOfHyphensNeeded == 0 && nextElement == null) {
                numberOfHyphensNeeded = 1;
                element.melismaWidth = Math.max(
                  element.melismaWidth,
                  widthOfHyphen + widthOfSpace,
                );
              }

              const minimumNumberOfSpacesNeeded = Math.ceil(
                (element.melismaWidth - widthOfHyphen) / widthOfSpace,
              );

              const minimumNumberOfSpacesBetweenHyphens = Math.floor(
                minimumNumberOfSpacesNeeded / 2,
              );

              if (
                numberOfHyphensNeeded == 0 &&
                element.melismaWidth >=
                  widthOfHyphen +
                    widthOfSpace * minimumNumberOfSpacesBetweenHyphens
              ) {
                numberOfHyphensNeeded = 1;
              }

              const numberOfSpacesNeeded = Math.ceil(
                (element.melismaWidth - numberOfHyphensNeeded * widthOfHyphen) /
                  widthOfSpace,
              );

              const numberOfSpacesBetweenHyphens = Math.floor(
                numberOfSpacesNeeded / (numberOfHyphensNeeded + 1),
              );

              for (let i = 0; i < numberOfHyphensNeeded + 1; i++) {
                for (let j = 0; j < numberOfSpacesBetweenHyphens; j++) {
                  element.melismaText += ' ';
                }

                if (i < numberOfHyphensNeeded) {
                  element.melismaText += '-';
                }
              }
            } else {
              const nextElementIsRunningElaphron =
                nextElement &&
                nextElement.elementType === ElementType.Note &&
                (nextElement as NoteElement).quantitativeNeume ===
                  QuantitativeNeume.RunningElaphron;

              // Special case for when the next neume is a running elaphron.
              // The melisma, which by convention must always be a final melisma,
              // should run all the way to the elaphron, instead of stopping at
              // the apostrophos. To handle this, set the final element to the
              // next element (the elaphron), later we will substract out the width
              // of the initial apostrophos in the running elaphron.
              if (nextElementIsRunningElaphron) {
                finalElement = nextElement as NoteElement;
              }

              if (finalElement == null) {
                end = element.x + element.neumeWidth;
              } else if (finalElement.lyricsWidth > finalElement.neumeWidth) {
                end =
                  finalElement.x -
                  (finalElement.lyricsWidth - finalElement.neumeWidth) / 2;
              } else if (nextElementIsRunningElaphron) {
                // The stand-alone apostrophos is not the same width
                // as the apostrophros in the running elaphron, but
                // the elaphrons are the same width in both neumes.
                end = finalElement.x + (runningElaphronWidth - elaphronWidth);
              } else {
                end = finalElement.x + finalElement.neumeWidth;
              }

              // Always show at least one underscore to indicate it's a melisma.
              element.melismaWidth = Math.max(end - start, widthOfUnderscore);

              const numberOfUnderScoresNeeded = Math.ceil(
                element.melismaWidth / widthOfUnderscore,
              );

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
        note.noteIndicatorNeume = noteIndicatorMap.get(
          ((currentNote % 7) + 7) % 7,
        )!;

        note.scaleNote = getScaleNoteFromValue(currentNote);

        if (note.fthora) {
          if (this.fthoraIsValid(note.fthora, currentNote)) {
            currentScale =
              this.getScaleFromFthora(note.fthora, currentNote) || currentScale;
            currentShift = this.getShift(
              currentNote,
              currentScale,
              note.fthora,
            );
          } else {
            note.fthora = null;
          }
        }
      } else if (element.elementType === ElementType.ModeKey) {
        const modeKey = element as ModeKeyElement;
        currentNote = getScaleNoteValue(modeKey.scaleNote);
        currentScale = modeKey.scale;
        currentShift = 0;

        if (modeKey.fthora) {
          currentShift = this.getShift(
            currentNote,
            currentScale,
            modeKey.fthora,
          );
        }
      } else if (element.elementType === ElementType.Martyria) {
        const martyria = element as MartyriaElement;

        if (!martyria.auto) {
          currentNote = reverseNoteMap.has(martyria.note)
            ? reverseNoteMap.get(martyria.note)!
            : currentNote;

          currentScale = martyria.scale;

          currentShift = 0;
        }

        if (currentNote < -6 || currentNote > 11) {
          martyria.error = true;
        } else {
          martyria.error = false;

          martyria.note = noteMap.get(currentNote) || Note.Pa;
          martyria.scale = currentScale;

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
              diatonicRootSignMap.get(currentScaleNote) || RootSign.Alpha;
          } else if (currentScale === Scale.Zygos) {
            martyria.rootSign =
              zygosRootSignMap.get(currentScaleNote) || RootSign.Alpha;
          } else if (currentScale === Scale.Kliton) {
            martyria.rootSign =
              klitonRootSignMap.get(currentScaleNote) || RootSign.Alpha;
          } else if (currentScale === Scale.Spathi) {
            martyria.rootSign =
              spathiRootSignMap.get(currentScaleNote) || RootSign.Alpha;
          } else if (currentScale === Scale.EnharmonicGa) {
            martyria.rootSign =
              enharmonicGaRootSignMap.get(currentScaleNote) || RootSign.Alpha;
          } else if (currentScale === Scale.EnharmonicVou) {
            martyria.rootSign =
              enharmonicVouRootSignMap.get(currentScaleNote) || RootSign.Alpha;
          } else if (currentScale === Scale.EnharmonicVouHigh) {
            martyria.rootSign =
              enharmonicVouHighRootSignMap.get(currentScaleNote) ||
              RootSign.Alpha;
          } else if (currentScale === Scale.EnharmonicZoHigh) {
            martyria.rootSign =
              enharmonicZoHighRootSignMap.get(currentScaleNote) ||
              RootSign.Alpha;
          } else if (currentScale === Scale.EnharmonicZo) {
            martyria.rootSign =
              enharmonicZoRootSignMap.get(currentScaleNote) || RootSign.Alpha;
          }

          if (currentNote <= reverseNoteMap.get(Note.KeLow)!) {
            martyria.rootSign =
              lowRootSignMap.get(martyria.rootSign) || martyria.rootSign;
          } else if (currentNote > reverseNoteMap.get(Note.KeLow)!) {
            martyria.rootSign =
              highRootSignMap.get(martyria.rootSign) || martyria.rootSign;
          }

          if (martyria.fthora) {
            if (this.fthoraIsValid(martyria.fthora, currentNote)) {
              currentScale =
                this.getScaleFromFthora(martyria.fthora, currentNote) ||
                currentScale;
              currentShift = this.getShift(
                currentNote,
                currentScale,
                martyria.fthora,
              );
            } else {
              martyria.fthora = null;
            }
          }
        }
      }
    }
  }

  private static getScaleFromFthora(fthora: Fthora, currentNote: number) {
    if (fthora.startsWith('Diatonic')) {
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
      return Scale.Spathi;
    }

    if (fthora.startsWith('Kliton')) {
      return Scale.Kliton;
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
    }

    return shift;
  }

  private static fthoraIsValid(fthora: Fthora, currentNote: number) {
    // Make sure chroa are on the correct notes
    if (
      fthora.startsWith('Zygos') &&
      currentNote !== getScaleNoteValue(ScaleNote.Thi)
    ) {
      return false;
    }

    if (
      fthora.startsWith('Kliton') &&
      currentNote !== getScaleNoteValue(ScaleNote.Thi)
    ) {
      return false;
    }

    if (
      fthora.startsWith('Spathi') &&
      currentNote !== getScaleNoteValue(ScaleNote.Ke)
    ) {
      return false;
    }

    if (
      fthora.startsWith('Enharmonic') &&
      currentNote !== getScaleNoteValue(ScaleNote.Zo) &&
      currentNote !== getScaleNoteValue(ScaleNote.Ga) &&
      currentNote !== getScaleNoteValue(ScaleNote.ZoHigh) &&
      currentNote !== getScaleNoteValue(ScaleNote.Vou) &&
      currentNote !== getScaleNoteValue(ScaleNote.VouHigh)
    ) {
      return false;
    }

    if (
      fthora.startsWith('GeneralSharp') &&
      currentNote !== getScaleNoteValue(ScaleNote.Ga)
    ) {
      return false;
    }

    if (
      fthora.startsWith('GeneralFlat') &&
      currentNote !== getScaleNoteValue(ScaleNote.Ke)
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
    text: string,
    pageSetup: PageSetup,
  ) {
    const key = `${text} | ${pageSetup.lyricsFont}`;

    let width = cache.get(key);

    if (width == null) {
      width = TextMeasurementService.getTextWidth(text, pageSetup.lyricsFont);

      cache.set(key, width);
    }

    return width;
  }
}

const noteMap = new Map<number, Note>([
  [-6, Note.VouLow],
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
  [5, Note.ZoHigh],
  [6, Note.NiHigh],
  [7, Note.PaHigh],
  [8, Note.VouHigh],
  [9, Note.GaHigh],
  [10, Note.ThiHigh],
  [11, Note.KeHigh],
]);

const noteIndicatorMap = new Map<number, NoteIndicator>([
  [0, NoteIndicator.Pa],
  [1, NoteIndicator.Vou],
  [2, NoteIndicator.Ga],
  [3, NoteIndicator.Thi],
  [4, NoteIndicator.Ke],
  [5, NoteIndicator.Zo],
  [6, NoteIndicator.Ni],
]);

const reverseNoteMap = new Map<Note, number>();

for (let [key, value] of noteMap) {
  reverseNoteMap.set(value, key);
}

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

const spathiRootSignMap = new Map<number, RootSign>(diatonicRootSignMap);
spathiRootSignMap.set(3, RootSign.Squiggle);
spathiRootSignMap.set(5, RootSign.Nana);
spathiRootSignMap.set(6, RootSign.DeltaDotted);

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

for (let [key, value] of lowRootSignMap) {
  highRootSignMap.set(value, key);
}
