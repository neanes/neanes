import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import {
  getFontStyleOptions,
  remapFontStyleForFamily,
  toggleFontStyleAxis,
} from '@/utils/fontStyle';
import { parseStyleAxes, type StyleAxis } from '@/utils/fontStyleAxes';

// The Bold/Italic shortcut buttons, in display order. Each flips one axis of the
// font style; underline is a separate text decoration handled by each caller.
export const FONT_STYLE_AXES: StyleAxis[] = ['bold', 'italic'];

// Shared family + style mechanics for the non-rich text surfaces (text boxes,
// lyrics, and drop caps, in both their toolbar and properties panels). The
// caller supplies the element's current font family and font style as
// refs/getters; the returned helpers translate the Bold/Italic toggle group and
// the font-family picker into a new font style. The composable is intentionally
// agnostic about the element's field names and about how underline is stored, so
// each caller keeps its own thin `emit('update', ...)` wiring.
export function useFontStyleControls(
  fontFamily: MaybeRefOrGetter<string>,
  fontStyle: MaybeRefOrGetter<string>,
) {
  const fontStyleOptions = computed(() =>
    getFontStyleOptions(toValue(fontFamily)),
  );

  function isFontStyleAxisActive(axis: StyleAxis): boolean {
    return parseStyleAxes(toValue(fontStyle))[axis];
  }

  function isFontStyleAxisToggleEnabled(axis: StyleAxis): boolean {
    return (
      toggleFontStyleAxis(toValue(fontFamily), toValue(fontStyle), axis) != null
    );
  }

  // The active Bold/Italic axes as toggle-group values, e.g. [] or ['bold'] or
  // ['bold', 'italic'].
  const activeStyleAxisValues = computed(() =>
    FONT_STYLE_AXES.filter((axis) => isFontStyleAxisActive(axis)),
  );

  // Given the toggle group's new selection, flip whichever Bold/Italic axes
  // changed against the current style and return the resulting style string.
  function applyStyleAxisToggles(nextValues: readonly string[]): string {
    let style = toValue(fontStyle);

    for (const axis of FONT_STYLE_AXES) {
      if (nextValues.includes(axis) !== isFontStyleAxisActive(axis)) {
        style = toggleFontStyleAxis(toValue(fontFamily), style, axis) ?? style;
      }
    }

    return style;
  }

  // The font style carried to a newly chosen family: the same face where it
  // exists, otherwise the closest bold/italic match the family offers.
  function remapStyleForFamily(nextFontFamily: string): string {
    return remapFontStyleForFamily(toValue(fontStyle), nextFontFamily);
  }

  return {
    fontStyleOptions,
    activeStyleAxisValues,
    isFontStyleAxisActive,
    isFontStyleAxisToggleEnabled,
    applyStyleAxisToggles,
    remapStyleForFamily,
  };
}
