import { describe, expect, it } from 'vitest';

import { fontService } from './FontService';

describe('FontService.getLyricsHorizontalOffset', () => {
  it.each([
    ['Neanes', 'runningElafron', 0.544],
    ['Neanes', 'petastiRunningElafron', 0.504],
    ['NeanesLegacy', 'runningElafron', 0.534],
    ['NeanesLegacy', 'petastiRunningElafron', 0.342],
    ['NeanesRTL', 'runningElafron', -0.389],
    ['NeanesRTL', 'petastiRunningElafron', -0.32],
    ['NeanesRTLLegacy', 'runningElafron', -0.487],
    ['NeanesRTLLegacy', 'petastiRunningElafron', -0.338],
    ['NeanesStathisSeries', 'runningElafron', 0.72],
    ['NeanesStathisSeries', 'petastiRunningElafron', 0.721],
    ['NeanesStathisSeriesLegacy', 'runningElafron', 0.74],
    ['NeanesStathisSeriesLegacy', 'petastiRunningElafron', 0.39],
  ] as const)('derives the offset for %s %s', (font, glyph, offset) => {
    expect(fontService.getLyricsHorizontalOffset(font, glyph)).toBeCloseTo(
      offset,
      3,
    );
  });
});

describe('FontService.getElafronBounds', () => {
  it.each([
    ['NeanesStathisSeries', 'runningElafron', 0.72, 1.772],
    ['NeanesStathisSeries', 'petastiRunningElafron', 0.721, 1.847],
    ['NeanesRTL', 'runningElafron', -0.002, 1.104],
    ['NeanesRTL', 'petastiRunningElafron', 0.019, 1.024],
  ] as const)(
    'returns the generated bounds for %s %s',
    (font, glyph, left, right) => {
      expect(fontService.getElafronBounds(font, glyph)).toEqual({
        left,
        right,
      });
    },
  );
});

describe('FontService.resolveContextualSubstitutions', () => {
  it('applies a yporroi gorgon substitution across an unrelated mark', () => {
    expect(
      fontService.resolveContextualSubstitutions('Neanes', [
        'yporroi',
        'apli',
        'gorgonAbove',
      ]),
    ).toEqual(['yporroi.gorgon', 'apli', 'gorgonAbove']);
  });

  it('does not skip a mark in the gorgon attachment class', () => {
    expect(
      fontService.resolveContextualSubstitutions('Neanes', [
        'yporroi',
        'digorgon',
        'gorgonAbove',
      ]),
    ).toEqual(['yporroi.digorgon', 'digorgon', 'gorgonAbove']);
  });

  it('keeps marks significant for lookups without a mark attachment type', () => {
    expect(
      fontService.resolveContextualSubstitutions('Neanes', [
        'yporroi',
        'apli',
        'antikenoma',
      ]),
    ).toEqual(['yporroi', 'apli', 'antikenoma']);
  });
});
