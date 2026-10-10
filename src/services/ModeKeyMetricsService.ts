import type { ResolvedInitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import type {
  CompactModeKeyMetrics,
  ModeKeyInkBounds,
} from '@/models/ModeKeyMetrics';
import { selectCompactModeKeyMetrics } from '@/models/ModeKeyMetrics';
import type { ModeKeyTemplate } from '@/models/ModeKeys';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { TempoSign } from '@/models/Neumes';
import { glyphText } from '@/services/InitialMartyriaPitchMeasurementService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { resolveFontCss } from '@/utils/fontStyle';

interface ModeKeyMetricsOptions {
  resolvedStyle: ResolvedInitialMartyriaStyle;
  neumeFontFamily: string;
  accessoryFontSize: number;
  accessoryBaselineOffset: number;
  tempoStrokeWidth: number;
}

const standardTempos = [
  TempoSign.VerySlow,
  TempoSign.Slower,
  TempoSign.Slow,
  TempoSign.Medium,
  TempoSign.Moderate,
  TempoSign.Quick,
  TempoSign.Quicker,
  TempoSign.VeryQuick,
];

/** Session-wide profiles shared by standalone keys, including across documents. */
export class ModeKeyMetricsService {
  private static profiles = new Map<string, CompactModeKeyMetrics>();
  private static observingFonts = false;

  public static getMetrics(
    options: ModeKeyMetricsOptions,
    measureForm: (
      template: ModeKeyTemplate,
      optional: boolean,
    ) => ModeKeyInkBounds,
  ): CompactModeKeyMetrics {
    if (!this.observingFonts) {
      document.fonts.addEventListener('loadingdone', () =>
        this.profiles.clear(),
      );
      this.observingFonts = true;
    }

    const { resolvedStyle, neumeFontFamily } = options;
    // Omit paint-only values and style identities: geometrically equivalent
    // configurations share a profile, while edited structures get a new key.
    const appearances = [
      resolvedStyle.mainAppearance,
      resolvedStyle.greekAppearance,
      resolvedStyle.primaryAppearance,
    ].map((appearance) => ({
      fontFamily: appearance.fontFamily,
      fontStyle: appearance.fontStyle,
      fontSize: appearance.fontSize,
      strokeWidth: appearance.strokeWidth,
      fontVariantCaps: appearance.fontVariantCaps,
      fontVariantNumeric: appearance.fontVariantNumeric,
      fontVariantLigatures: appearance.fontVariantLigatures,
      fontVariantAlternates: appearance.fontVariantAlternates,
      cssFont: resolveFontCss(appearance),
    }));
    const neumeFont = resolveFontCss({
      fontFamily: neumeFontFamily,
      fontStyle: DEFAULT_FONT_STYLE,
      fontSize: options.accessoryFontSize,
    });
    const key = JSON.stringify({
      structure: resolvedStyle.style.structure,
      useOrdinalForms: resolvedStyle.style.useOrdinalForms,
      appearances,
      neumeFont,
      accessoryBaselineOffset: options.accessoryBaselineOffset,
      tempoStrokeWidth: options.tempoStrokeWidth,
    });
    const cached = this.profiles.get(key);
    if (cached != null) {
      return cached;
    }

    const forms = modeKeyTemplates.flatMap((template) =>
      template.optionalFthoras == null
        ? [measureForm(template, false)]
        : [measureForm(template, false), measureForm(template, true)],
    );
    const strokeOverflow = options.tempoStrokeWidth / 2;
    const tempoBounds = { top: 0, bottom: 0 };
    for (const tempo of standardTempos) {
      const measured = TextMeasurementService.getTextMetrics(
        glyphText(tempo, neumeFontFamily),
        neumeFont,
      );
      tempoBounds.top = Math.min(
        tempoBounds.top,
        options.accessoryBaselineOffset -
          measured.actualBoundingBoxAscent -
          strokeOverflow,
      );
      tempoBounds.bottom = Math.max(
        tempoBounds.bottom,
        options.accessoryBaselineOffset +
          measured.actualBoundingBoxDescent +
          strokeOverflow,
      );
    }
    const metrics = selectCompactModeKeyMetrics(
      forms,
      tempoBounds,
      resolvedStyle.primaryAppearance.fontSize,
    );
    // A newly registered system-face alias can still be loading. Never retain
    // its temporary fallback measurements as the chosen font's profile.
    if (
      [neumeFont, ...appearances.map((a) => a.cssFont)].every((font) =>
        document.fonts.check(font),
      )
    ) {
      this.profiles.set(key, metrics);
    }
    return metrics;
  }
}
