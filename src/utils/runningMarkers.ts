import type { RichTextBoxElement, RunningMarkerRole } from '@/models/Element';
import { ElementType, TextBoxElement } from '@/models/Element';
import type { Page } from '@/models/Page';

const blockBoundaryTags = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'div',
  'dl',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);

export interface RunningMarkerPageMetadata {
  chapter: string;
  section: string;
  isChapterOpening: boolean;
}

interface RunningMarkerState {
  chapter: string;
  section: string;
}

export function resolveRunningMarkerPageMetadata(
  pages: Page[],
): RunningMarkerPageMetadata[] {
  const metadata: RunningMarkerPageMetadata[] = [];
  let state: RunningMarkerState = {
    chapter: '',
    section: '',
  };

  for (const page of pages) {
    const firstChapter = getFirstRunningMarkerForPage(page, 'chapter');
    const firstSection = getFirstRunningMarkerForPage(page, 'section');

    const nextChapter = firstChapter ?? state.chapter;
    const nextSection =
      firstSection ?? (firstChapter != null ? '' : state.section);

    metadata.push({
      chapter: nextChapter,
      section: nextSection,
      isChapterOpening: firstChapter != null && nextChapter !== state.chapter,
    });

    state = {
      chapter: nextChapter,
      section: nextSection,
    };
  }

  return metadata;
}

function getFirstRunningMarkerForPage(
  page: Page,
  role: RunningMarkerRole,
): string | null {
  for (const line of page.lines) {
    for (const element of line.elements) {
      if (
        element.elementType === ElementType.TextBox ||
        element.elementType === ElementType.RichTextBox
      ) {
        const runningMarkerElement = element as
          TextBoxElement | RichTextBoxElement;

        if (runningMarkerElement.runningMarkerRole !== role) {
          continue;
        }

        const text = resolveRunningMarkerText(runningMarkerElement);

        if (text != null) {
          return text;
        }
      }
    }
  }

  return null;
}

export function resolveRunningMarkerText(
  element: TextBoxElement | RichTextBoxElement,
): string | null {
  const override = normalizeRunningMarkerText(element.runningMarkerText);

  if (override != null) {
    return override;
  }

  if (element instanceof TextBoxElement) {
    return normalizeRunningMarkerText(
      getTextBoxVisibleTextSegments(element).join(' '),
    );
  }

  return normalizeRunningMarkerText(
    getRichTextVisibleTextSegments(element).join(' '),
  );
}

function getTextBoxVisibleTextSegments(element: TextBoxElement): string[] {
  const values = element.multipanel
    ? [element.contentLeft, element.contentCenter, element.contentRight]
    : element.inline
      ? [element.content, element.contentBottom]
      : [element.content];

  return values
    .map((value) => normalizeRunningMarkerText(value))
    .filter((value): value is string => value != null);
}

function getRichTextVisibleTextSegments(element: RichTextBoxElement): string[] {
  const values = element.multipanel
    ? [element.contentLeft, element.contentCenter, element.contentRight]
    : element.inline
      ? [element.content, element.contentBottom]
      : [element.content];

  return values
    .map((value) => normalizeRunningMarkerText(stripHtmlToPlainText(value)))
    .filter((value): value is string => value != null);
}

function stripHtmlToPlainText(html: string): string {
  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.innerHTML = html;
    return getNodePlainText(container);
  }

  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(
      /<\/?(address|article|aside|blockquote|div|dl|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)[^>]*>/gi,
      ' ',
    )
    .replace(/<[^>]*>/g, '');
}

function getNodePlainText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();

  if (tagName === 'br') {
    return ' ';
  }

  const childText = Array.from(element.childNodes)
    .map((child) => getNodePlainText(child))
    .join('');

  return isBlockBoundaryTag(tagName) ? ` ${childText} ` : childText;
}

function isBlockBoundaryTag(tagName: string) {
  return blockBoundaryTags.has(tagName);
}

function normalizeRunningMarkerText(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, ' ').trim();

  return normalized ? normalized : null;
}
