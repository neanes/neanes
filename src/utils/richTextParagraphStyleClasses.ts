const RICH_TEXT_PARAGRAPH_STYLE_CLASS_PREFIX = 'neanes-style-';

export function richTextParagraphStyleClassName(styleId: string) {
  return `${RICH_TEXT_PARAGRAPH_STYLE_CLASS_PREFIX}${styleId}`;
}

export type RichTextParagraphStyleClassFallbackResolver = (
  styleId: string,
) => string | null;

export function rewriteRichTextParagraphStyleClasses(
  html: string,
  resolveFallbackStyleId: RichTextParagraphStyleClassFallbackResolver,
) {
  if (html === '') {
    return html;
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const styledElements = template.content.querySelectorAll('[class]');
  let didRewrite = false;

  for (const element of styledElements) {
    const classes = Array.from(element.classList);
    const deletedClasses: string[] = [];

    for (const className of classes) {
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

      deletedClasses.push(className);
      const fallbackClassName =
        richTextParagraphStyleClassName(fallbackStyleId);

      if (!element.classList.contains(fallbackClassName)) {
        element.classList.add(fallbackClassName);
      }
    }

    if (deletedClasses.length > 0) {
      didRewrite = true;

      for (const className of deletedClasses) {
        element.classList.remove(className);
      }
    }
  }

  return didRewrite ? template.innerHTML : html;
}
