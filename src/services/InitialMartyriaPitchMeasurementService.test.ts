import { describe, expect, it } from 'vitest';

import { fontService } from '@/services/FontService';
import {
  getInitialMartyriaNeumeBaselineCorrection,
  getInitialMartyriaPitchTrailingGlueWidth,
  resolveInitialMartyriaAccessoryLayout,
} from '@/services/InitialMartyriaPitchMeasurementService';

describe('initial martyria pitch trailing glue', () => {
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
  it('scales the font baseline by the signature-wide glyph size', () => {
    expect(
      getInitialMartyriaNeumeBaselineCorrection({
        initialMartyriaBaseline: 0.08,
        glyphFontSize: 52,
      }),
    ).toBeCloseTo(4.16);
  });
});

describe('initial martyria accessory layout', () => {
  it('uses the glyph size and its corrected raised baseline', () => {
    expect(
      resolveInitialMartyriaAccessoryLayout({
        glyphFontSize: 60,
        neumeBaselineCorrection: 4,
      }),
    ).toEqual({ fontSize: 60, baselineOffset: -23 });
  });

  it('lowers the accessory by a fixed fraction of the glyph size', () => {
    expect(
      resolveInitialMartyriaAccessoryLayout({
        glyphFontSize: 40,
        neumeBaselineCorrection: 0,
      }),
    ).toEqual({ fontSize: 40, baselineOffset: -18 });
  });
});
