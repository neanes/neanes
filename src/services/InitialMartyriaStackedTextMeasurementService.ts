import {
  getInitialMartyriaStackedTextGeometry,
  type InitialMartyriaStackedTextGeometry,
  type StackedTextRowBounds,
} from '@/models/InitialMartyriaStackedTextGeometry';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { resolveFontCss, resolveFontStyle } from '@/utils/fontStyle';

export function measureInitialMartyriaStackedText(
  lines: string[],
  options: {
    fontFamily: string;
    fontStyle?: string;
    fontSize: number;
    strokeWidth?: number;
    gap: number;
    baselineShift?: number;
  },
): InitialMartyriaStackedTextGeometry {
  const font = resolveFontStyle(options.fontFamily, options.fontStyle);
  const cssFont = resolveFontCss({
    fontFamily: font.cssFontFamily,
    fontStyle: font.cssFontStyle,
    fontSize: options.fontSize,
  });
  const rows: StackedTextRowBounds[] = lines.map((line) => {
    const metrics = TextMeasurementService.getTextMetrics(line, cssFont);
    return {
      advanceWidth: metrics.width,
      inkLeft: -metrics.actualBoundingBoxLeft,
      inkRight: metrics.actualBoundingBoxRight,
      inkTop: -metrics.actualBoundingBoxAscent,
      inkBottom: metrics.actualBoundingBoxDescent,
      lineAscent: metrics.fontBoundingBoxAscent,
      lineDescent: metrics.fontBoundingBoxDescent,
      strokeWidth: options.strokeWidth,
    };
  });

  return getInitialMartyriaStackedTextGeometry(
    rows,
    options.gap,
    options.baselineShift,
  );
}
