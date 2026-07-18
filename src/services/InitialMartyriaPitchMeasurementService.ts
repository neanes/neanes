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
import { resolveFontCss, resolveFontStyle } from '@/utils/fontStyle';

export interface InitialMartyriaPitchMeasurementOptions {
  textFontFamily: string;
  textFontStyle?: string;
  textFontSize: number;
  glyphFontFamily: string;
  glyphFontStyle?: string;
  glyphFontSize: number;
  textStrokeWidth?: number;
  glyphStrokeWidth?: number;
  baselineShift?: number;
}

function atomBounds(
  text: string,
  fontFamily: string,
  fontStyle: string | undefined,
  fontSize: number,
  strokeWidth?: number,
): PitchAtomBounds {
  const font = resolveFontStyle(fontFamily, fontStyle);
  const metrics = TextMeasurementService.getTextMetrics(
    text,
    resolveFontCss({
      fontFamily: font.cssFontFamily,
      fontStyle: font.cssFontStyle,
      fontSize,
    }),
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

function glyphText(neume: Neume) {
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
        );
  return getInitialMartyriaPitchGeometry(
    text,
    fthora,
    quantitative,
    Math.max(options.textStrokeWidth ?? 0, options.glyphStrokeWidth ?? 0) / 2,
    options.baselineShift,
  );
}

export function resolveInitialMartyriaPitchFontSizes(options: {
  textFontFamily: string;
  textFontStyle?: string;
  textFontSize?: number;
  glyphFontSize?: number;
  matchedNeumeFontSize?: number | null;
  neumeFontFamily: string;
  neumeFontSize: number;
}) {
  const matchedNeumeFontSize =
    'matchedNeumeFontSize' in options
      ? options.matchedNeumeFontSize
      : getMatchedNeumeFontSize(options);
  const glyphFontSize =
    options.glyphFontSize ?? matchedNeumeFontSize ?? options.neumeFontSize;
  return {
    textFontSize: options.textFontSize ?? glyphFontSize,
    glyphFontSize,
  };
}

function getMatchedNeumeFontSize(options: {
  textFontFamily: string;
  textFontStyle?: string;
  textFontSize?: number;
  neumeFontFamily: string;
  neumeFontSize: number;
}) {
  const textFont = resolveFontStyle(
    options.textFontFamily,
    options.textFontStyle,
  );
  const textCapitalHeight = TextMeasurementService.getTextHeight(
    'H',
    resolveFontCss({
      fontFamily: textFont.cssFontFamily,
      fontStyle: textFont.cssFontStyle,
      fontSize: options.textFontSize ?? options.neumeFontSize,
    }),
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

export function getInitialMartyriaPitchTextBounds(
  note: InitialMartyriaPitchNote | null,
  noteText: string,
  options: InitialMartyriaPitchMeasurementOptions,
) {
  if (note == null) {
    return null;
  }
  return measureInitialMartyriaPitchGeometry(note, noteText, options);
}
