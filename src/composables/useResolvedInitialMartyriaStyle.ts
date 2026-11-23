import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import type { ModeKeyElement } from '@/models/Element';
import { resolveModeKeyInitialMartyriaStyle } from '@/models/InitialMartyriaResolver';
import type {
  InitialMartyriaStyle,
  ResolvedInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { hasParagraphStyleOverrides } from '@/models/ParagraphStyle';

// Shared read-side derivation for the mode key toolbar, properties panel, and
// dialog: the initial martyria style the element renders with, its element
// overrides folded in, plus the appearance the typography controls bind to.
// Emit wiring intentionally stays per-caller (see useResolvedParagraphStyle).
export function useResolvedInitialMartyriaStyle(options: {
  element: MaybeRefOrGetter<
    Pick<
      ModeKeyElement,
      'initialMartyriaStyleId' | 'getParagraphStyleOverrides'
    >
  >;
  paragraphStyles: MaybeRefOrGetter<ParagraphStyle[]>;
  initialMartyriaStyles: MaybeRefOrGetter<InitialMartyriaStyle[]>;
  defaultInitialMartyriaStyleId: MaybeRefOrGetter<string>;
}) {
  const resolvedStyle = computed<ResolvedInitialMartyriaStyle>(() =>
    resolveModeKeyInitialMartyriaStyle({
      element: toValue(options.element),
      paragraphStyles: toValue(options.paragraphStyles),
      initialMartyriaStyles: toValue(options.initialMartyriaStyles),
      defaultInitialMartyriaStyleId: toValue(
        options.defaultInitialMartyriaStyleId,
      ),
    }),
  );

  const primaryAppearance = computed(
    () => resolvedStyle.value.primaryAppearance,
  );

  const hasOverrides = computed(() =>
    hasParagraphStyleOverrides(
      toValue(options.element).getParagraphStyleOverrides(),
    ),
  );

  return { resolvedStyle, primaryAppearance, hasOverrides };
}
