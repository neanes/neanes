import {
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { paragraphStyleDefinition } from '@/services/documents/paragraphStyles';

type StyleReadOptions = {
  ids?: string[];
  includeResolved?: boolean;
  view?: 'definitions' | 'ids';
};

export function getParagraphStyles(
  styles: ParagraphStyle[],
  options: StyleReadOptions & { view: 'ids' },
): { styleIds: string[] };
export function getParagraphStyles(
  styles: ParagraphStyle[],
  options?: StyleReadOptions & { view?: 'definitions' },
): ReturnType<typeof readDefinitions>;
export function getParagraphStyles(
  styles: ParagraphStyle[],
  options: StyleReadOptions,
): { styleIds: string[] } | ReturnType<typeof readDefinitions>;
export function getParagraphStyles(
  styles: ParagraphStyle[],
  options: StyleReadOptions = {},
) {
  if (options.ids?.some((id) => !styles.some((style) => style.id === id))) {
    throw new Error('STYLE_NOT_FOUND');
  }
  const selected = styles.filter(
    (style) => options.ids === undefined || options.ids.includes(style.id),
  );
  if (options.view === 'ids') {
    return { styleIds: selected.map((style) => style.id) };
  }
  return readDefinitions(styles, selected, options.includeResolved);
}

function readDefinitions(
  styles: ParagraphStyle[],
  selected: ParagraphStyle[],
  includeResolved?: boolean,
) {
  return {
    styles: selected.map(paragraphStyleDefinition),
    ...(includeResolved !== false
      ? {
          resolvedStyles: selected.map((style) => ({
            id: style.id,
            builtIn: style.builtIn,
            displayName: style.displayName,
            values: resolveParagraphStyle(styles, style.id),
          })),
        }
      : {}),
    units: { dimensions: 'css-px', lineHeight: 'multiplier' },
  };
}
