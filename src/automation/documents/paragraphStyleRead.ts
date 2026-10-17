import {
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { paragraphStyleDefinition } from '@/services/documents/paragraphStyles';

export function getParagraphStyles(
  styles: ParagraphStyle[],
  options: { ids?: string[]; includeResolved?: boolean } = {},
) {
  if (options.ids?.some((id) => !styles.some((style) => style.id === id))) {
    throw new Error('STYLE_NOT_FOUND');
  }
  const selected = styles.filter(
    (style) => options.ids === undefined || options.ids.includes(style.id),
  );
  return {
    styles: selected.map(paragraphStyleDefinition),
    ...(options.includeResolved !== false
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
