import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import type { ModeKeyElement } from '@/models/Element';
import { resolveModeKeyInitialMartyriaStyle } from '@/models/InitialMartyriaResolver';
import type {
  InitialMartyriaStyle,
  ResolvedInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
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
  pageSetup: MaybeRefOrGetter<
    Pick<PageSetup, 'initialMartyriaStyleId' | 'neumeDefaultFontFamily'>
  >;
  paragraphStyles: MaybeRefOrGetter<ParagraphStyle[]>;
  initialMartyriaStyles: MaybeRefOrGetter<InitialMartyriaStyle[]>;
}) {
  const resolvedStyle = computed<ResolvedInitialMartyriaStyle>(() =>
    resolveModeKeyInitialMartyriaStyle({
      element: toValue(options.element),
      pageSetup: toValue(options.pageSetup),
      paragraphStyles: toValue(options.paragraphStyles),
      initialMartyriaStyles: toValue(options.initialMartyriaStyles),
    }),
  );

  const mainAppearance = computed(() => resolvedStyle.value.mainAppearance);

  const hasOverrides = computed(() =>
    hasParagraphStyleOverrides(
      toValue(options.element).getParagraphStyleOverrides(),
    ),
  );

  return { resolvedStyle, mainAppearance, hasOverrides };
}
