import { describe, expect, it } from 'vitest';

import measuredConfigurations from '@/models/__fixtures__/mode-key-ink-bounds.json';
import {
  type ModeKeyInkBounds,
  selectCompactModeKeyMetrics,
} from '@/models/ModeKeyMetrics';
import { modeKeyTemplates } from '@/models/ModeKeys';

const noTempo = { top: 0, bottom: 0 };
const bounds = (ascent: number, descent: number): ModeKeyInkBounds => ({
  top: -ascent,
  bottom: descent,
});

describe('compact mode-key metrics', () => {
  it('contains complete forms jointly rather than selecting independent bounds', () => {
    const forms = [
      bounds(8, 2),
      bounds(8, 2),
      bounds(2, 8),
      bounds(2, 8),
      bounds(2, 2),
    ];
    expect(selectCompactModeKeyMetrics(forms, noTempo, 10)).toEqual({
      ascent: 9,
      descent: 9,
    });
  });

  it('rounds the required number of complete forms upward', () => {
    const forms = [
      ...Array.from({ length: 4 }, () => bounds(2, 1)),
      bounds(5, 1),
      bounds(20, 1),
    ];
    expect(selectCompactModeKeyMetrics(forms, noTempo, 10)).toEqual({
      ascent: 6,
      descent: 2,
    });
  });

  it('breaks height ties by greater coverage before preferring smaller ascent', () => {
    const forms = [
      ...Array.from({ length: 7 }, () => bounds(1, 1)),
      bounds(3, 1),
      bounds(3, 1),
      bounds(1, 3),
    ];
    expect(selectCompactModeKeyMetrics(forms, noTempo, 10)).toEqual({
      ascent: 4,
      descent: 2,
    });
  });

  it('makes equal-coverage height ties independent of repertoire ordering', () => {
    const forms = [
      bounds(1, 1),
      bounds(1, 1),
      bounds(1, 1),
      bounds(3, 1),
      bounds(1, 3),
    ];
    const expected = { ascent: 2, descent: 4 };
    expect(selectCompactModeKeyMetrics(forms, noTempo, 10)).toEqual(expected);
    expect(
      selectCompactModeKeyMetrics(forms.toReversed(), noTempo, 10),
    ).toEqual(expected);
  });

  it('contains standard tempos even when compact selection would omit their descent', () => {
    const forms = Array.from({ length: 5 }, () => bounds(10, 2));
    expect(selectCompactModeKeyMetrics(forms, bounds(4, 5), 10)).toEqual({
      ascent: 11,
      descent: 6,
    });
  });

  // Baseline-relative native Electron measurements from the font investigation:
  // 14.5 pt Regular, NeanesEngraving, zero stroke, all allowed diatonic variants.
  const targets = {
    didot: { ascent: 20.6676992893219, descent: 8.689779493804931 },
    naskh: { ascent: 20.68526382446289, descent: 8.952490200134277 },
    source: { ascent: 20.177555990219116, descent: 6.428848589782715 },
  };
  for (const config of measuredConfigurations) {
    it(`reproduces the measured compact profile for ${config.case}`, () => {
      const expectedForms = modeKeyTemplates.flatMap((template) =>
        template.optionalFthoras == null
          ? [`${template.id}:false`]
          : [`${template.id}:false`, `${template.id}:true`],
      );
      expect(config.forms.map((f) => `${f.id}:${f.optional}`)).toEqual(
        expectedForms,
      );
      const selected = selectCompactModeKeyMetrics(
        config.forms,
        config.tempoBounds,
        config.textFontSize,
      );
      const expected = targets[config.case as keyof typeof targets];
      expect(selected.ascent * 0.75).toBeCloseTo(expected.ascent, 8);
      expect(selected.descent * 0.75).toBeCloseTo(expected.descent, 8);
    });
  }
});
