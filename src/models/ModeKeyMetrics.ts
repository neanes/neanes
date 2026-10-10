/** Visible ink relative to the primary text baseline, in unzoomed pixels. */
export interface ModeKeyInkBounds {
  top: number;
  bottom: number;
}

export interface CompactModeKeyMetrics {
  ascent: number;
  descent: number;
}

const COMPACT_COVERAGE = 0.8;
const LEADING_PER_SIDE = 0.1;
const MEASUREMENT_TOLERANCE = 1e-8;

/** Minimize height while jointly containing 80% of complete allowed forms. */
export function selectCompactModeKeyMetrics(
  forms: readonly ModeKeyInkBounds[],
  tempoBounds: ModeKeyInkBounds,
  textFontSize: number,
): CompactModeKeyMetrics {
  const envelopes = forms.map(({ top, bottom }) => ({
    ascent: Math.max(0, -top),
    descent: Math.max(0, bottom),
  }));
  const tempoAscent = Math.max(0, -tempoBounds.top);
  const tempoDescent = Math.max(0, tempoBounds.bottom);
  const required = Math.ceil(COMPACT_COVERAGE * forms.length);
  let best = {
    ascent: Math.max(tempoAscent, ...envelopes.map((e) => e.ascent)),
    descent: Math.max(tempoDescent, ...envelopes.map((e) => e.descent)),
    covered: forms.length,
  };

  for (const ascent of new Set(
    envelopes.map((e) => Math.max(tempoAscent, e.ascent)),
  )) {
    for (const descent of new Set(
      envelopes.map((e) => Math.max(tempoDescent, e.descent)),
    )) {
      const covered = envelopes.filter(
        (e) =>
          e.ascent <= ascent + MEASUREMENT_TOLERANCE &&
          e.descent <= descent + MEASUREMENT_TOLERANCE,
      ).length;
      if (covered < required) {
        continue;
      }
      const height = ascent + descent;
      const bestHeight = best.ascent + best.descent;
      if (
        height < bestHeight ||
        (height === bestHeight &&
          (covered > best.covered ||
            (covered === best.covered && ascent < best.ascent)))
      ) {
        best = { ascent, descent, covered };
      }
    }
  }

  const leading = LEADING_PER_SIDE * textFontSize;
  return {
    ascent: best.ascent + leading,
    descent: best.descent + leading,
  };
}
