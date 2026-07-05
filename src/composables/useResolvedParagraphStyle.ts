import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import type {
  ParagraphStyle,
  ParagraphStyleOverrides,
} from '@/models/ParagraphStyle';
import {
  hasParagraphStyleOverrides,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';

// Shared read-side derivation for the element toolbars and properties panels:
// the element's paragraph style resolved with its overrides folded in, plus
// the values the style controls bind to. Emit wiring intentionally stays
// per-caller (see useFontStyleControls).
export function useResolvedParagraphStyle(
  paragraphStyles: MaybeRefOrGetter<ParagraphStyle[]>,
  styleId: MaybeRefOrGetter<string>,
  overrides: MaybeRefOrGetter<ParagraphStyleOverrides>,
) {
  const resolvedParagraphStyle = computed(() =>
    resolveParagraphStyle(
      toValue(paragraphStyles),
      toValue(styleId),
      toValue(overrides),
    ),
  );

  const underline = computed(
    () => resolvedParagraphStyle.value.textDecoration === 'underline',
  );

  const underlineValues = computed(() =>
    underline.value ? ['underline'] : [],
  );

  const hasOverrides = computed(() =>
    hasParagraphStyleOverrides(toValue(overrides)),
  );

  return { resolvedParagraphStyle, underline, underlineValues, hasOverrides };
}
