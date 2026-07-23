import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';
import { resolveFontStyle } from '@/utils/fontStyle';
import {
  FONT_VARIANT_CSS_NAMES,
  FONT_VARIANT_PROPERTIES,
} from '@/utils/fontVariants';
import { getFontFamilyWithNeumeFallback } from '@/utils/getFontFamilyWithFallback';
import { richTextParagraphStyleClassName } from '@/utils/richTextParagraphStyleClasses';

export function buildRichTextParagraphStyleCss(
  paragraphStyles: ParagraphStyle[],
  pageSetup: PageSetup,
  selectorPrefix: string,
) {
  return paragraphStyles
    .map((style) => {
      const resolved = resolveParagraphStyle(paragraphStyles, style.id);
      const font = resolveFontStyle(resolved.fontFamily, resolved.fontStyle);
      const textDecoration =
        resolved.textDecoration === 'underline'
          ? 'text-decoration:underline;'
          : '';
      // A null value omits the declaration (rather than writing 'normal') so
      // the class does not defeat features inherited from an outer scope.
      const fontVariants = FONT_VARIANT_PROPERTIES.filter(
        (property) => resolved[property] != null,
      )
        .map(
          (property) =>
            `${FONT_VARIANT_CSS_NAMES[property]}:${resolved[property]};`,
        )
        .join('');
      const fontFamily = getFontFamilyWithNeumeFallback(
        font.cssFontFamily,
        pageSetup.neumeDefaultFontFamily,
      );

      return `${selectorPrefix} p.${richTextParagraphStyleClassName(style.id)}{font-family:${fontFamily};font-weight:${font.cssFontWeight};font-style:${font.cssFontStyle};font-size:${resolved.fontSize}px;color:${resolved.color};-webkit-text-stroke-width:${resolved.strokeWidth}px;-webkit-text-stroke-color:${resolved.strokeColor};line-height:${resolved.lineHeight ?? 'normal'};text-align:${resolved.alignment};${textDecoration}${fontVariants}}`;
    })
    .join('\n');
}
