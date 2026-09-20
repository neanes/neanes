import type {
  DropCapElement,
  NoteElement,
  ScoreElement,
} from '@/models/Element';
import { ElementType } from '@/models/Element';

export function getLyricsBaseline(
  neumeHeight: number,
  lyricsVerticalOffset: number,
  defaultLyricsFontAscent: number,
) {
  return neumeHeight + lyricsVerticalOffset + defaultLyricsFontAscent;
}

export function getLyricsTop(lyricsBaseline: number, lyricsFontAscent: number) {
  return lyricsBaseline - lyricsFontAscent;
}

export interface LineVerticalMetrics {
  elementOffset: number;
  contentHeight: number;
  leadingBefore: number;
  leadingAfter: number;
}

// A line whose box height is fixed by its content (text boxes, mode keys,
// images) has no leading to distribute and is positioned from its own origin.
export function getFixedLineVerticalMetrics(
  contentHeight: number,
): LineVerticalMetrics {
  return {
    elementOffset: 0,
    contentHeight,
    leadingBefore: 0,
    leadingAfter: 0,
  };
}

export type LyricDescenderElement = NoteElement | DropCapElement;

export function getLyricDescenderElementsByLine(
  lines: ScoreElement[][],
): LyricDescenderElement[][] {
  const result = lines.map(() => [] as LyricDescenderElement[]);

  for (const [lineIndex, elements] of lines.entries()) {
    for (const element of elements) {
      if (element.elementType === ElementType.Note) {
        const note = element as NoteElement;
        if (note.lyrics.length > 0) {
          result[lineIndex].push(note);
        }
      } else if (element.elementType === ElementType.DropCap) {
        const dropCap = element as DropCapElement;
        const alignedLineIndex = lineIndex + dropCap.computedLineSpan - 1;

        if (dropCap.content.length > 0 && alignedLineIndex < result.length) {
          result[alignedLineIndex].push(dropCap);
        }
      }
    }
  }

  return result;
}

export function getEffectiveLyricsInkDescent<T>(
  elements: T[],
  measure: (element: T) => number,
) {
  return elements.reduce(
    (effectiveDescent, element) => Math.max(effectiveDescent, measure(element)),
    0,
  );
}

export function placeLineOnPage(
  metrics: LineVerticalMetrics,
  previousContentBottom: number | null,
  previousLeadingAfter: number,
) {
  const lineTop =
    previousContentBottom == null
      ? -metrics.leadingBefore
      : previousContentBottom + previousLeadingAfter;

  return {
    lineTop,
    contentBottom: lineTop + metrics.leadingBefore + metrics.contentHeight,
  };
}

// `minContentBottomOffset` extends the content below the element origin for
// content that is anchored there rather than on the lyrics baseline, such as
// an inline image. It has to reach the content, not just the line height: the
// difference between the line height and the content becomes leading, which is
// split evenly above and below, so only half of it would sit under the anchor.
export function getMusicLineVerticalMetrics(
  lineHeight: number,
  neumeAscenderOffset: number,
  lyricsBaseline: number,
  effectiveLyricsInkDescent: number,
  minContentBottomOffset: number,
) {
  const contentBottomOffset = Math.max(
    lyricsBaseline + effectiveLyricsInkDescent,
    minContentBottomOffset,
  );
  const contentHeight = contentBottomOffset - neumeAscenderOffset;
  const resolvedLineHeight = Math.max(lineHeight, contentHeight);
  const halfLeading = (resolvedLineHeight - contentHeight) / 2;

  // Score elements are positioned from the music font's line-box origin,
  // which is not the same as the ascender. Offset that origin so the
  // ascender itself begins after the top half-leading.
  return {
    elementOffset: halfLeading - neumeAscenderOffset,
    contentHeight,
    leadingBefore: halfLeading,
    leadingAfter: halfLeading,
  };
}
