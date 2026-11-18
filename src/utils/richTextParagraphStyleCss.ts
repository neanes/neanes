import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';
import { resolveFontStyle } from '@/utils/fontStyle';
import { fontVariantCssDeclarations } from '@/utils/fontVariants';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { richTextParagraphStyleClassName } from '@/utils/richTextParagraphStyleClasses';

export function buildRichTextNeumeCss(
  selectorPrefix: string,
  neumeFontFamily: string,
) {
  return `${selectorPrefix}{position:relative;}
${selectorPrefix} .neanes-ck-neume{display:inline-block;position:relative;font-family:${neumeFontFamily};}
${selectorPrefix} .neanes-ck-neume-align-right{position:absolute!important;left:initial!important;}
${selectorPrefix} .neanes-ck-neume-plagal{display:inline-flex;flex-direction:column;vertical-align:middle;align-items:center;font-family:inherit;}`;
}

export function buildRichTextParagraphStyleCss(
  paragraphStyles: ParagraphStyle[],
  selectorPrefix: string,
) {
  return paragraphStyles
    .map((style) => {
      const resolved = resolveParagraphStyle(paragraphStyles, style.id);
      const font = resolveFontStyle(resolved.fontFamily, resolved.fontStyle);
      // Explicit resets prevent another workspace's rules for the same style ID
      // from supplying features that this resolved paragraph style clears.
      const textDecoration = `text-decoration:${resolved.textDecoration ?? 'none'};`;
      const fontVariants = fontVariantCssDeclarations(resolved).join('');
      const fontFamily = getFontFamilyWithFallback(font.cssFontFamily);

      return `${selectorPrefix} p.${richTextParagraphStyleClassName(style.id)}{font-family:${fontFamily};font-weight:${font.cssFontWeight};font-style:${font.cssFontStyle};font-size:${resolved.fontSize}px;color:${resolved.color};-webkit-text-stroke-width:${resolved.strokeWidth}px;-webkit-text-stroke-color:${resolved.strokeColor};line-height:${resolved.lineHeight ?? 'normal'};text-align:${resolved.alignment};${textDecoration}${fontVariants}}`;
    })
    .join('\n');
}
