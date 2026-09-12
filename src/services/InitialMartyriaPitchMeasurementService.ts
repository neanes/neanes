import type { InitialMartyriaAccessoryLayout } from '@/models/InitialMartyriaLayout';
import type {
  InitialMartyriaPitchGeometry,
  PitchAtomBounds,
} from '@/models/InitialMartyriaPitchGeometry';
import { getInitialMartyriaPitchGeometry } from '@/models/InitialMartyriaPitchGeometry';
import type { InitialMartyriaPitchNote } from '@/models/InitialMartyriaStyle';
import type { Neume } from '@/models/Neumes';
import { fontService } from '@/services/FontService';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { resolveFontCss } from '@/utils/fontStyle';

export interface InitialMartyriaPitchMeasurementOptions {
  textFontFamily: string;
  textFontStyle: string;
  textFontSize: number;
  textFontVariantCaps: string;
  glyphFontFamily: string;
  glyphFontStyle: string;
  glyphFontSize: number;
  textStrokeWidth: number;
  glyphStrokeWidth: number;
}

/** Ink and advance bounds of one measured run, relative to its baseline. */
export function measureInitialMartyriaAtomBounds(
  text: string,
  cssFont: string,
  fontVariantCaps: string,
  strokeWidth: number | undefined,
): PitchAtomBounds {
  const metrics = TextMeasurementService.getTextMetrics(
    text,
    cssFont,
    fontVariantCaps,
  );
  return {
    advanceWidth: metrics.width,
    inkLeft: -metrics.actualBoundingBoxLeft,
    inkRight: metrics.actualBoundingBoxRight,
    inkTop: -metrics.actualBoundingBoxAscent,
    inkBottom: metrics.actualBoundingBoxDescent,
    lineAscent: metrics.fontBoundingBoxAscent,
    lineDescent: metrics.fontBoundingBoxDescent,
    strokeWidth,
  };
}

function atomBounds(
  text: string,
  fontFamily: string,
  fontStyle: string,
  fontSize: number,
  strokeWidth: number,
  fontVariantCaps: string,
): PitchAtomBounds {
  return measureInitialMartyriaAtomBounds(
    text,
    resolveFontCss({ fontFamily, fontStyle, fontSize }),
    fontVariantCaps,
    strokeWidth,
  );
}

export function glyphText(neume: Neume) {
  return NeumeMappingService.getMapping(neume)?.text ?? '?';
}

export function measureInitialMartyriaPitchGeometry(
  note: InitialMartyriaPitchNote,
  noteText: string,
  options: InitialMartyriaPitchMeasurementOptions,
): InitialMartyriaPitchGeometry {
  const text = atomBounds(
    noteText,
    options.textFontFamily,
    options.textFontStyle,
    options.textFontSize,
    options.textStrokeWidth,
    options.textFontVariantCaps,
  );
  const fthora =
    note.fthoraAbove == null
      ? undefined
      : atomBounds(
          glyphText(note.fthoraAbove),
          options.glyphFontFamily,
          options.glyphFontStyle,
          options.glyphFontSize,
          options.glyphStrokeWidth,
          'normal',
        );
  const quantitative =
    note.quantitativeNeumeAbove == null
      ? undefined
      : atomBounds(
          glyphText(note.quantitativeNeumeAbove),
          options.glyphFontFamily,
          options.glyphFontStyle,
          options.glyphFontSize,
          options.glyphStrokeWidth,
          'normal',
        );
  return getInitialMartyriaPitchGeometry(
    text,
    fthora,
    quantitative,
    Math.max(options.textStrokeWidth, options.glyphStrokeWidth) / 2,
  );
}

export function getInitialMartyriaPitchTrailingGlueWidth(
  neumeFontFamily: string,
  glyphFontSize: number,
) {
  return fontService.getStandardGlue(neumeFontFamily).width * glyphFontSize;
}

/**
 * The music font size whose capital height matches the text's, or null when
 * either font has no usable capital height.
 */
export function getMatchedNeumeFontSize(options: {
  textFontFamily: string;
  textFontStyle: string;
  textFontSize: number;
  textFontVariantCaps: string;
  neumeFontFamily: string;
}) {
  const textCapitalHeight = TextMeasurementService.getTextHeight(
    'H',
    resolveFontCss({
      fontFamily: options.textFontFamily,
      fontStyle: options.textFontStyle,
      fontSize: options.textFontSize,
    }),
    options.textFontVariantCaps,
  );
  const capitalHeight = fontService.getMetrics(
    options.neumeFontFamily,
  ).capitalHeight;
  return Number.isFinite(textCapitalHeight) &&
    Number.isFinite(capitalHeight) &&
    capitalHeight > 0
    ? textCapitalHeight / capitalHeight
    : null;
}

/** How far music-font glyphs are raised to sit on the text baseline. */
export function getInitialMartyriaNeumeBaselineCorrection(options: {
  initialMartyriaBaseline: number;
  glyphFontSize: number;
}) {
  return options.initialMartyriaBaseline * options.glyphFontSize;
}

const TEMPO_MARGIN_LEFT = 8;

/** The tempo and ambitus glyphs share the signature's glyph size. */
export function resolveInitialMartyriaAccessoryLayout(options: {
  glyphFontSize: number;
  neumeBaselineCorrection: number;
}): InitialMartyriaAccessoryLayout {
  return {
    fontSize: options.glyphFontSize,
    baselineOffset:
      options.neumeBaselineCorrection - 0.45 * options.glyphFontSize,
    tempoMarginLeft: TEMPO_MARGIN_LEFT,
  };
}
