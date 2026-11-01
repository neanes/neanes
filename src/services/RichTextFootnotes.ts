import { Parser } from 'htmlparser2';

import {
  RICH_TEXT_BOX_CONTENT_KEYS,
  type RichTextBoxContentKey,
  type RichTextBoxElement,
} from '@/models/Element';

export const FOOTNOTE_CLASS = 'neanes-footnote';
export const FOOTNOTE_ATTRIBUTE = 'data-footnote-id';
export const FOOTNOTE_ELEMENT = 'footnoteReference';

// Parse HTML without a DOM so model operations also work in private documents.
export function richTextFootnoteIds(html: string): string[] {
  const ids: string[] = [];
  const objects: boolean[] = [];
  new Parser({
    onopentag(name, attributes) {
      if (
        name === 'span' &&
        attributes.class?.split(/\s+/).includes(FOOTNOTE_CLASS)
      ) {
        if (objects.some(Boolean)) {
          throw new Error('INVALID_FOOTNOTE_REFERENCE');
        }
        const id = attributes[FOOTNOTE_ATTRIBUTE];
        if (!id || !/^[a-f\d-]{36}$/i.test(id)) {
          throw new Error('INVALID_FOOTNOTE_REFERENCE');
        }
        ids.push(id);
      }
      objects.push(
        attributes.contenteditable === 'false' ||
          attributes.class
            ?.split(/\s+/)
            .some(
              (value) =>
                value === FOOTNOTE_CLASS || value === 'neanes-ck-neume',
            ) === true,
      );
    },
    onclosetag() {
      objects.pop();
    },
  }).end(html);
  return ids;
}

export function activeRichTextContentKeys(
  element: Pick<RichTextBoxElement, 'multipanel' | 'inline'>,
): readonly RichTextBoxContentKey[] {
  return element.multipanel
    ? (['contentLeft', 'contentCenter', 'contentRight'] as const)
    : element.inline
      ? (['content', 'contentBottom'] as const)
      : (['content'] as const);
}

export function richTextBoxFootnoteIds(element: RichTextBoxElement) {
  return activeRichTextContentKeys(element).flatMap((key) =>
    richTextFootnoteIds(element[key]),
  );
}

export function rewriteRichTextFootnoteIds(
  html: string,
  remap: Map<string, string>,
) {
  const replacements: { start: number; end: number; text: string }[] = [];
  const parser = new Parser({
    onopentag(name, attributes) {
      if (
        name === 'span' &&
        attributes.class?.split(/\s+/).includes(FOOTNOTE_CLASS)
      ) {
        const id = remap.get(attributes[FOOTNOTE_ATTRIBUTE]);
        if (id !== undefined) {
          replacements.push({
            start: parser.startIndex,
            end: parser.endIndex + 1,
            text: `<span class="${FOOTNOTE_CLASS}" ${FOOTNOTE_ATTRIBUTE}="${id}">`,
          });
        }
      }
    },
  });
  parser.end(html);
  for (const replacement of replacements.reverse()) {
    html =
      html.slice(0, replacement.start) +
      replacement.text +
      html.slice(replacement.end);
  }
  return html;
}

export function remapRichTextBoxFootnotes(
  element: RichTextBoxElement,
  remap: Map<string, string>,
) {
  for (const key of RICH_TEXT_BOX_CONTENT_KEYS) {
    element[key] = rewriteRichTextFootnoteIds(element[key], remap);
  }
}

export function richTextFootnoteHtml(id: string) {
  return `<span class="${FOOTNOTE_CLASS}" ${FOOTNOTE_ATTRIBUTE}="${id}"></span>`;
}

// Automation inserts at a source HTML boundary, never inside a tag or entity.
export function insertRichTextFootnote(
  html: string,
  offset: number,
  id: string,
) {
  let valid = false;
  const stack: string[] = [];
  const objects: boolean[] = [];
  const parser = new Parser({
    onopentag(name, attributes) {
      stack.push(name);
      objects.push(
        attributes.contenteditable === 'false' ||
          attributes.class
            ?.split(/\s+/)
            .some(
              (value) =>
                value === FOOTNOTE_CLASS || value === 'neanes-ck-neume',
            ) === true,
      );
      if (
        name === 'p' &&
        !objects.some(Boolean) &&
        offset === parser.endIndex + 1
      ) {
        valid = true;
      }
    },
    onclosetag() {
      stack.pop();
      objects.pop();
    },
    ontext() {
      if (
        stack.includes('p') &&
        !objects.some(Boolean) &&
        !stack.includes('script') &&
        !stack.includes('style') &&
        offset >= parser.startIndex &&
        offset <= parser.endIndex + 1
      ) {
        valid = true;
      }
    },
  });
  parser.end(html);
  if (
    !Number.isInteger(offset) ||
    !valid ||
    (/&[^;<>]*$/.test(html.slice(0, offset)) &&
      /^[^;&<>]*;/.test(html.slice(offset))) ||
    (offset > 0 &&
      /[\uD800-\uDBFF]/.test(html[offset - 1]) &&
      /[\uDC00-\uDFFF]/.test(html[offset]))
  ) {
    throw new Error('INVALID_ELEMENT_EDIT');
  }
  return html.slice(0, offset) + richTextFootnoteHtml(id) + html.slice(offset);
}
