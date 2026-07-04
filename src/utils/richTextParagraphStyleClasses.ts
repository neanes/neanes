const RICH_TEXT_PARAGRAPH_STYLE_CLASS_PREFIX = 'neanes-style-';

export function richTextParagraphStyleClassName(styleId: string) {
  return `${RICH_TEXT_PARAGRAPH_STYLE_CLASS_PREFIX}${styleId}`;
}

export function rewriteRichTextParagraphStyleClasses(
  html: string,
  resolveFallbackStyleId: (styleId: string) => string | null,
) {
  if (html === '') {
    return html;
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const styledElements = template.content.querySelectorAll('[class]');
  let didRewrite = false;

  for (const element of styledElements) {
    for (const className of Array.from(element.classList)) {
      if (!className.startsWith(RICH_TEXT_PARAGRAPH_STYLE_CLASS_PREFIX)) {
        continue;
      }

      const styleId = className.slice(
        RICH_TEXT_PARAGRAPH_STYLE_CLASS_PREFIX.length,
      );
      const fallbackStyleId = resolveFallbackStyleId(styleId);

      if (fallbackStyleId == null) {
        continue;
      }

      element.classList.remove(className);
      element.classList.add(richTextParagraphStyleClassName(fallbackStyleId));
      didRewrite = true;
    }
  }

  return didRewrite ? template.innerHTML : html;
}
