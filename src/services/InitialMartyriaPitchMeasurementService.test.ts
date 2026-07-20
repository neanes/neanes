import { describe, expect, it } from 'vitest';

import { resolveInitialMartyriaPitchFontSizes } from '@/services/InitialMartyriaPitchMeasurementService';

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
});
