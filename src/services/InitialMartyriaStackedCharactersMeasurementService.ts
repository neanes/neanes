import {
  getInitialMartyriaStackedCharactersGeometry,
  type InitialMartyriaStackedCharactersGeometry,
  type StackedCharacterBounds,
} from '@/models/InitialMartyriaStackedCharactersGeometry';
import { measureInitialMartyriaAtomBounds } from '@/services/InitialMartyriaPitchMeasurementService';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { resolveFontCss } from '@/utils/fontStyle';

const TOP_ROW_OFFSET_EM = 0.08;

export function measureInitialMartyriaStackedCharacters(
  topCharacter: string,
  bottomCharacter: string,
  options: {
    fontFamily: string;
    fontStyle?: string;
    fontSize: number;
    fontVariantCaps?: string | null;
    strokeWidth?: number;
  },
): InitialMartyriaStackedCharactersGeometry {
  const cssFont = resolveFontCss({
    fontFamily: options.fontFamily,
    fontStyle: options.fontStyle ?? DEFAULT_FONT_STYLE,
    fontSize: options.fontSize,
  });
  const measureCharacter = (character: string): StackedCharacterBounds =>
    measureInitialMartyriaAtomBounds(
      character,
      cssFont,
      options.fontVariantCaps ?? 'normal',
      options.strokeWidth,
    );

  return getInitialMartyriaStackedCharactersGeometry(
    measureCharacter(topCharacter),
    measureCharacter(bottomCharacter),
    options.fontSize * TOP_ROW_OFFSET_EM,
  );
}
