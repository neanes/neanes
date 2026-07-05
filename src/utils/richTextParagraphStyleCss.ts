import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';
import { resolveFontStyle } from '@/utils/fontStyle';
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

      return `${selectorPrefix} p.${richTextParagraphStyleClassName(style.id)}{font-family:${getFontFamilyWithNeumeFallback(
        font.cssFontFamily,
        pageSetup.neumeDefaultFontFamily,
      )};font-weight:${font.cssFontWeight};font-style:${font.cssFontStyle};font-size:${resolved.fontSize}px;color:${resolved.color};-webkit-text-stroke-width:${resolved.strokeWidth}px;line-height:${resolved.lineHeight ?? 'normal'};text-align:${resolved.alignment};${textDecoration}}`;
    })
    .join('\n');
}
