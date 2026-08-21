import { describe, expect, it } from 'vitest';

import { fontService } from '@/services/FontService';
import {
  getInitialMartyriaNeumeBaselineCorrection,
  getInitialMartyriaPitchTrailingGlueWidth,
  resolveInitialMartyriaAccessoryLayout,
  resolveInitialMartyriaPitchFontSizes,
} from '@/services/InitialMartyriaPitchMeasurementService';

describe('initial martyria pitch font sizes', () => {
  it('uses the signature-wide matched size for starting-note glyphs', () => {
    expect(
      resolveInitialMartyriaPitchFontSizes({
        textFontFamily: 'Overridden Text Font',
        textFontSize: 24,
        glyphFontSize: undefined,
        matchedNeumeFontSize: 60,
        neumeFontFamily: 'Neume Font',
        neumeFontSize: 42,
      }),
    ).toEqual({ textFontSize: 24, glyphFontSize: 60 });
  });

  it('scales the selected font standard glue by glyph size', () => {
    const fontFamily = 'Neanes';
    const glyphSize = 48;

    expect(
      getInitialMartyriaPitchTrailingGlueWidth(fontFamily, glyphSize),
    ).toBe(fontService.getStandardGlue(fontFamily).width * glyphSize);
  });

  it('preserves zero standard glue', () => {
    expect(getInitialMartyriaPitchTrailingGlueWidth('NeanesLegacy', 48)).toBe(
      0,
    );
  });
});

describe('initial martyria neume baseline correction', () => {
  it('uses the signature-wide matched size instead of a starting-note glyph size', () => {
    expect(
      getInitialMartyriaNeumeBaselineCorrection({
        hasCustomText: true,
        initialMartyriaBaseline: 0.08,
        matchedNeumeFontSize: 52,
        neumeFontSize: 42,
      }),
    ).toBeCloseTo(4.16);
  });

  it('falls back to the effective neume size when matching is unavailable', () => {
    expect(
      getInitialMartyriaNeumeBaselineCorrection({
        hasCustomText: true,
        initialMartyriaBaseline: 0.08,
        matchedNeumeFontSize: null,
        neumeFontSize: 42,
      }),
    ).toBeCloseTo(3.36);
  });
});

describe('initial martyria accessory layout', () => {
  it('uses the matched neume size and its corrected raised baseline', () => {
    expect(
      resolveInitialMartyriaAccessoryLayout({
        matchedNeumeFontSize: 60,
        neumeBaselineCorrection: 4,
        neumeFontSize: 42,
      }),
    ).toEqual({ fontSize: 60, baselineOffset: -23 });
  });

  it('falls back to the nominal neume size', () => {
    expect(
      resolveInitialMartyriaAccessoryLayout({
        matchedNeumeFontSize: null,
        neumeBaselineCorrection: 0,
        neumeFontSize: 40,
      }),
    ).toEqual({ fontSize: 40, baselineOffset: -18 });
  });
});
