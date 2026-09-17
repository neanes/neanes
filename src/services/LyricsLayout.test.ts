import { describe, expect, it } from 'vitest';

import {
  getLyricsBaseline,
  getLyricsTop,
  includeLyricsInLineHeight,
} from './LyricsLayout';

describe('lyrics layout', () => {
  it('preserves the default lyric top', () => {
    const neumeHeight = 48;
    const verticalOffset = -4;
    const defaultAscent = 12;
    const baseline = getLyricsBaseline(
      neumeHeight,
      verticalOffset,
      defaultAscent,
    );

    expect(getLyricsTop(baseline, defaultAscent)).toBe(
      neumeHeight + verticalOffset,
    );
  });

  it('aligns fonts with different ascents to the same baseline', () => {
    const baseline = 56;
    const smallTop = getLyricsTop(baseline, 12);
    const largeTop = getLyricsTop(baseline, 20);

    expect(smallTop + 12).toBe(baseline);
    expect(largeTop + 20).toBe(baseline);
  });

  it('expands a line for lyrics that extend below its default height', () => {
    expect(includeLyricsInLineHeight(60, 40, 16)).toBe(60);
    expect(includeLyricsInLineHeight(60, 34, 30)).toBe(64);
  });
});
