import { describe, expect, it } from 'vitest';

import { fontService } from '@/services/FontService';
import {
  getInitialMartyriaPitchTrailingGlueWidth,
  resolveInitialMartyriaPitchFontSizes,
} from '@/services/InitialMartyriaPitchMeasurementService';

describe('initial martyria pitch font sizes', () => {
  it('uses the neume size when no matching text run exists', () => {
    expect(
      resolveInitialMartyriaPitchFontSizes({
        textFontFamily: 'Unused Text Font',
        glyphFontSize: undefined,
        matchedNeumeFontSize: null,
        neumeFontFamily: 'Unused Neume Font',
        neumeFontSize: 42,
      }),
    ).toEqual({ textFontSize: 42, glyphFontSize: 42 });
  });

  it('does not resize automatic source text to the matched glyph size', () => {
    expect(
      resolveInitialMartyriaPitchFontSizes({
        textFontFamily: 'Text Font',
        glyphFontSize: undefined,
        matchedNeumeFontSize: 60,
        neumeFontFamily: 'Neume Font',
        neumeFontSize: 42,
      }),
    ).toEqual({ textFontSize: 42, glyphFontSize: 60 });
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
