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

export function includeLyricsInLineHeight(
  lineHeight: number,
  lyricsTop: number,
  lyricsFontHeight: number,
) {
  return Math.max(lineHeight, lyricsTop + lyricsFontHeight);
}
