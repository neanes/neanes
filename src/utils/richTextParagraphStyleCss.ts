import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';
import { resolveFontStyle } from '@/utils/fontStyle';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';

export function buildRichTextParagraphStyleCss(
  paragraphStyles: ParagraphStyle[],
  pageSetup: PageSetup,
  selectorPrefix: string,
) {
  return paragraphStyles
    .map((style) => {
      const resolved = resolveParagraphStyle(paragraphStyles, style.id);
      const font = resolveFontStyle(resolved.fontFamily, resolved.fontStyle);

      return `${selectorPrefix} p.neanes-style-${style.id}{font-family:${getFontFamilyWithFallback(
        font.cssFontFamily,
        pageSetup.neumeDefaultFontFamily + 'Legacy',
      )};font-weight:${font.cssFontWeight};font-style:${font.cssFontStyle};font-size:${resolved.fontSize}px;color:${resolved.color};-webkit-text-stroke-width:${resolved.strokeWidth}px;line-height:${resolved.lineHeight ?? 'normal'};text-align:${resolved.alignment};}`;
    })
    .join('\n');
}
