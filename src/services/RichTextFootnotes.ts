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
      if (isFootnoteSpan(name, attributes)) {
        if (objects.some(Boolean)) {
          throw new Error('INVALID_FOOTNOTE_REFERENCE');
        }
        const id = attributes[FOOTNOTE_ATTRIBUTE];
        if (!isRichTextFootnoteId(id)) {
          throw new Error('INVALID_FOOTNOTE_REFERENCE');
        }
        ids.push(id);
      }
      objects.push(isRichTextObject(attributes));
    },
    onclosetag() {
      objects.pop();
    },
  }).end(html);
  return ids;
}

function isFootnoteSpan(name: string, attributes: Record<string, string>) {
  return (
    name === 'span' &&
    attributes.class?.split(/\s+/).includes(FOOTNOTE_CLASS) === true
  );
}

function isRichTextFootnoteId(id: string | undefined): id is string {
  return id !== undefined && /^[a-f\d-]{36}$/i.test(id);
}

function isRichTextObject(attributes: Record<string, string>) {
  return (
    attributes.contenteditable === 'false' ||
    attributes.class
      ?.split(/\s+/)
      .some(
        (value) => value === FOOTNOTE_CLASS || value === 'neanes-ck-neume',
      ) === true
  );
}

// Removes each footnote span that richTextFootnoteIds would reject, and each
// valid one that `keep` rejects. `keep` sees valid ids in document order. A
// removed span takes its contents with it: a marker holds no user text.
export function removeRichTextFootnotes(
  html: string,
  keep: (id: string) => boolean,
) {
  if (!html.includes(FOOTNOTE_CLASS)) {
    return html;
  }
  const removals: { start: number; end: number }[] = [];
  const objects: boolean[] = [];
  let removing: { start: number; depth: number } | null = null;
  const parser = new Parser({
    onopentag(name, attributes) {
      if (removing === null && isFootnoteSpan(name, attributes)) {
        const id = attributes[FOOTNOTE_ATTRIBUTE];
        if (objects.some(Boolean) || !isRichTextFootnoteId(id) || !keep(id)) {
          removing = { start: parser.startIndex, depth: objects.length };
        }
      }
      objects.push(isRichTextObject(attributes));
    },
    onclosetag(_name, isImplied) {
      objects.pop();
      if (removing !== null && objects.length === removing.depth) {
        // An implied close happens at the tag that forced it, which stays.
        removals.push({
          start: removing.start,
          end: isImplied ? parser.startIndex : parser.endIndex + 1,
        });
        removing = null;
      }
    },
  });
  parser.end(html);
  return applyEdits(html, removals);
}

// Replaces each [start, end) range of `html` with its text. Ranges are in
// document order and do not overlap.
function applyEdits(
  html: string,
  edits: readonly { start: number; end: number; text?: string }[],
) {
  const parts: string[] = [];
  let start = 0;
  for (const edit of edits) {
    parts.push(html.slice(start, edit.start), edit.text ?? '');
    start = edit.end;
  }
  parts.push(html.slice(start));
  return parts.join('');
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
      if (isFootnoteSpan(name, attributes)) {
        const id = remap.get(attributes[FOOTNOTE_ATTRIBUTE]);
        if (id !== undefined) {
          replacements.push({
            start: parser.startIndex,
            end: parser.endIndex + 1,
            text: `<span ${Object.entries({
              ...attributes,
              [FOOTNOTE_ATTRIBUTE]: id,
            })
              .map(
                ([key, value]) =>
                  `${key}="${value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}"`,
              )
              .join(' ')}>`,
          });
        }
      }
    },
  });
  parser.end(html);
  return applyEdits(html, replacements);
}

export function remapRichTextBoxFootnotes(
  element: RichTextBoxElement,
  remap: Map<string, string>,
) {
  for (const key of RICH_TEXT_BOX_CONTENT_KEYS) {
    element[key] = rewriteRichTextFootnoteIds(element[key], remap);
  }
}

// Older CKEditor output inserted a block filler into an empty marker span.
export function removeRichTextFootnoteFillers(html: string) {
  const filler = '&nbsp;';
  if (!html.includes(`${filler}</span>`)) {
    return html;
  }

  const removals: { start: number; end: number }[] = [];
  const parser = new Parser({
    onopentag(name, attributes) {
      const offset = parser.endIndex + 1;
      if (
        isFootnoteSpan(name, attributes) &&
        attributes[FOOTNOTE_ATTRIBUTE] !== undefined &&
        html.startsWith(`${filler}</span>`, offset)
      ) {
        removals.push({ start: offset, end: offset + filler.length });
      }
    },
  });
  parser.end(html);
  return applyEdits(html, removals);
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
      objects.push(isRichTextObject(attributes));
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
