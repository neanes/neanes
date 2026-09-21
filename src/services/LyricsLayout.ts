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

// The nominal box height of a line, leading included.
export function getLineBoxHeight(metrics: LineVerticalMetrics) {
  return metrics.leadingBefore + metrics.contentHeight + metrics.leadingAfter;
}

// The part of an already placed line that the next line on the same page is
// positioned from. Null means the next line starts the page, in which case its
// own top leading is trimmed away.
export interface PlacedLine {
  contentBottom: number;
  leadingAfter: number;
}

export function placeLineOnPage(
  metrics: LineVerticalMetrics,
  previousLine: PlacedLine | null,
) {
  const lineTop =
    previousLine == null
      ? -metrics.leadingBefore
      : previousLine.contentBottom + previousLine.leadingAfter;

  return {
    lineTop,
    contentBottom: lineTop + metrics.leadingBefore + metrics.contentHeight,
  };
}

export function getMusicLineVerticalMetrics(
  lineHeight: number,
  lyricsBaseline: number,
): LineVerticalMetrics {
  // Use the baseline, not the letters' ink descent, so lyric content cannot
  // change half-leading or pagination.
  const contentHeight = lyricsBaseline;
  const resolvedLineHeight = Math.max(lineHeight, contentHeight);
  const halfLeading = (resolvedLineHeight - contentHeight) / 2;

  // Score neumes render with `line-height: normal`, so an element's line-box
  // origin is its own font ascender. Offsetting the origin by the top
  // half-leading puts that ascender directly below the leading.
  return {
    elementOffset: halfLeading,
    contentHeight,
    leadingBefore: halfLeading,
    leadingAfter: halfLeading,
  };
}
