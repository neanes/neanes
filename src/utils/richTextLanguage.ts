import type { TextPartLanguageOption } from '@ckeditor/ckeditor5-language';
import {
  getLanguageDirection,
  type LanguageDirection,
} from '@ckeditor/ckeditor5-utils';
import type {
  Editor,
  ModelElement,
  ModelNode,
  ModelRootElement,
} from 'ckeditor5';

export const RICH_TEXT_LANGUAGE_OPTIONS = [
  { title: 'Greek', languageCode: 'el', textDirection: 'ltr' },
  { title: 'Arabic', languageCode: 'ar', textDirection: 'rtl' },
  { title: 'Romanian', languageCode: 'ro', textDirection: 'ltr' },
  { title: 'English', languageCode: 'en', textDirection: 'ltr' },
  { title: 'Indonesian', languageCode: 'id', textDirection: 'ltr' },
] satisfies TextPartLanguageOption[];

export const RICH_TEXT_NO_LANGUAGE_VALUE = '__none__';

export type RichTextLanguageOwner = {
  languageCode?: string | null;
  textDirection?: LanguageDirection | null;
};

export function getRichTextLanguage(
  owner: RichTextLanguageOwner,
): string | null {
  if (
    owner.languageCode == null ||
    owner.languageCode === '' ||
    owner.textDirection == null
  ) {
    return null;
  }

  return `${owner.languageCode}:${owner.textDirection}`;
}

export function setRichTextLanguage(
  owner: RichTextLanguageOwner,
  languageCode: string,
  textDirection: LanguageDirection,
) {
  owner.languageCode = languageCode;
  owner.textDirection = textDirection;
}

export function clearRichTextLanguage(owner: RichTextLanguageOwner) {
  owner.languageCode = null;
  owner.textDirection = null;
}

export function getRichTextLanguageAttributes(language: string | null): string {
  if (language == null) {
    return '';
  }

  const [languageCode, textDirection] = language.split(':');
  const escapedLanguageCode = languageCode
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  return ` lang="${escapedLanguageCode}" dir="${normalizeTextDirection(
    languageCode,
    textDirection,
  )}"`;
}

export function inferRichTextEditorLanguage(
  editor: Pick<Editor, 'model'>,
): string | null {
  let inferred: string | null = null;
  let isMixedOrMissing = false;

  walkEditorTextNodes(editor, (node) => {
    if (!isMeaningfulText(node.data)) {
      return;
    }

    const language = languageFromModelAttribute(node.getAttribute('language'));

    if (language == null) {
      isMixedOrMissing = true;
      return false;
    }

    if (inferred == null) {
      inferred = language;
      return;
    }

    if (!sameLanguage(inferred, language)) {
      isMixedOrMissing = true;
      return false;
    }
  });

  return isMixedOrMissing ? null : inferred;
}

export function hasMeaningfulRichTextEditorContent(
  editor: Pick<Editor, 'model'>,
): boolean {
  let hasMeaningfulText = false;

  walkEditorTextNodes(editor, (node) => {
    if (isMeaningfulText(node.data)) {
      hasMeaningfulText = true;
      return false;
    }
  });

  return hasMeaningfulText;
}

export function hasMeaningfulRichTextHtmlContent(html: string): boolean {
  return (
    html
      .replace(HTML_NBSP_ENTITY_REGEX, ' ')
      .replace(HTML_TAG_REGEX, '')
      .replace(/[\s\u00a0]/g, '').length > 0
  );
}

export function inferSharedRichTextEditorLanguage(
  editors: Array<Pick<Editor, 'model'> | undefined>,
): string | null {
  let detected: string | null = null;

  for (const editor of editors) {
    if (editor == null || !hasMeaningfulRichTextEditorContent(editor)) {
      continue;
    }

    const language = inferRichTextEditorLanguage(editor);

    if (language == null) {
      return null;
    }

    if (detected == null) {
      detected = language;
    } else if (!sameLanguage(detected, language)) {
      return null;
    }
  }

  return detected;
}

export function applyRichTextLanguageToEditor(
  editor: Pick<Editor, 'model'>,
  languageCode: string,
  textDirection: LanguageDirection,
) {
  const value = `${languageCode}:${textDirection}`;
  const model = editor.model;

  model.change((writer) => {
    for (const root of model.document.getRoots()) {
      const ranges = model.schema.getValidRanges(
        [writer.createRangeIn(root)],
        'language',
      );

      for (const range of ranges) {
        writer.setAttribute('language', value, range);
      }
    }
  });
}

function walkEditorTextNodes(
  editor: Pick<Editor, 'model'>,
  visit: (node: ModelNode & { data: string }) => false | void,
) {
  for (const root of editor.model.document.getRoots()) {
    if (!walkModelTextNodes(root, visit)) {
      return false;
    }
  }

  return true;
}

function walkModelTextNodes(
  element: ModelElement | ModelRootElement,
  visit: (node: ModelNode & { data: string }) => false | void,
): boolean {
  for (const child of element.getChildren()) {
    if (child.is('$text')) {
      if (visit(child) === false) {
        return false;
      }

      continue;
    }

    if (child.is('element')) {
      if (!walkModelTextNodes(child, visit)) {
        return false;
      }
    }
  }

  return true;
}

function languageFromModelAttribute(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function sameLanguage(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

export function getRichTextLanguageCode(language: string) {
  return language.split(':')[0];
}

export function getRichTextLanguageDirection(
  language: string,
): LanguageDirection {
  const [languageCode, textDirection] = language.split(':');
  return normalizeTextDirection(languageCode, textDirection);
}

function normalizeTextDirection(
  languageCode: string,
  textDirection: string | undefined,
): LanguageDirection {
  return textDirection === 'ltr' || textDirection === 'rtl'
    ? textDirection
    : getLanguageDirection(languageCode.toLowerCase());
}

function isMeaningfulText(text: string) {
  return text.replace(/\s/g, '').length > 0;
}

const HTML_TAG_REGEX = /<[^>]*>/g;
const HTML_NBSP_ENTITY_REGEX = /&(nbsp|#160|#xA0);/gi;
