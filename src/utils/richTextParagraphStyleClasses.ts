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
      if (!className.startsWith('neanes-style-')) {
        continue;
      }

      const styleId = className.slice('neanes-style-'.length);
      const fallbackStyleId = resolveFallbackStyleId(styleId);

      if (fallbackStyleId == null) {
        continue;
      }

      deletedClasses.push(className);
      const fallbackClassName = `neanes-style-${fallbackStyleId}`;

      if (!element.classList.contains(fallbackClassName)) {
        element.classList.add(fallbackClassName);
      }

      didRewrite = true;
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
