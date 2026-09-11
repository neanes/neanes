import {
  getInitialMartyriaStackedTextGeometry,
  type InitialMartyriaStackedTextGeometry,
  type StackedTextRowBounds,
} from '@/models/InitialMartyriaStackedTextGeometry';
import { measureInitialMartyriaAtomBounds } from '@/services/InitialMartyriaPitchMeasurementService';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { resolveFontCss } from '@/utils/fontStyle';

const TOP_ROW_OFFSET_EM = 0.08;

export function measureInitialMartyriaStackedText(
  lines: string[],
  options: {
    fontFamily: string;
    fontStyle?: string;
    fontSize: number;
    fontVariantCaps?: string | null;
    strokeWidth?: number;
  },
): InitialMartyriaStackedTextGeometry {
  const cssFont = resolveFontCss({
    fontFamily: options.fontFamily,
    fontStyle: options.fontStyle ?? DEFAULT_FONT_STYLE,
    fontSize: options.fontSize,
  });
  const rows: StackedTextRowBounds[] = lines.map((line) =>
    measureInitialMartyriaAtomBounds(
      line,
      cssFont,
      options.fontVariantCaps ?? 'normal',
      options.strokeWidth,
    ),
  );

  return getInitialMartyriaStackedTextGeometry(
    rows[0],
    rows[1],
    options.fontSize * TOP_ROW_OFFSET_EM,
  );
}
