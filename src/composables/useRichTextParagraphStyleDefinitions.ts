import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { richTextParagraphStyleClassName } from '@/utils/richTextParagraphStyleClasses';

// The CKEditor Style-plugin definitions for the score's paragraph styles,
// plus the cache-busting key that forces an editor rebuild when the style
// list changes. Shared by the editor-hosting components so the definition
// shape stays a single contract.
export function useRichTextParagraphStyleDefinitions(
  paragraphStyles: MaybeRefOrGetter<ParagraphStyle[]>,
) {
  const paragraphStyleDefinitions = computed(() =>
    toValue(paragraphStyles).map((style) => ({
      name: style.id,
      element: 'p',
      classes: [richTextParagraphStyleClassName(style.id)],
    })),
  );

  const paragraphStyleDefinitionKey = computed(() =>
    toValue(paragraphStyles)
      .map((style) => style.id)
      .join('|'),
  );

  return { paragraphStyleDefinitions, paragraphStyleDefinitionKey };
}
