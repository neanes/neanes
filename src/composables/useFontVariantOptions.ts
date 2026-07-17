import type { SelectorParam } from 'i18next';
import { useTranslation } from 'i18next-vue';
import type { CSSProperties } from 'vue';
import { computed } from 'vue';

import type {
  CapsKey,
  FontVariantProperty,
  LigatureVariant,
  NumericKey,
  NumericVariant,
} from '@/utils/fontVariants';
import {
  applyNumericKey,
  CAPS_KEYS,
  composeLigatureVariant,
  composeNumericVariant,
  FONT_VARIANT_CAPS,
  FONT_VARIANT_LIGATURES,
  FONT_VARIANT_NUMERIC,
  isCapsKey,
  isNumericKey,
  NUMERIC_KEYS,
  parseLigatureVariant,
  parseNumericVariant,
  splitNumericKey,
  toNumericKey,
} from '@/utils/fontVariants';

const CAPS_LABELS: Record<CapsKey, SelectorParam<'toolbar'>> = {
  'small-caps': ($) => $.toolbar.richTextBox.caseSmallCaps,
  'all-small-caps': ($) => $.toolbar.richTextBox.caseAllSmallCaps,
};

const NUMERIC_LABELS: Record<NumericKey, SelectorParam<'toolbar'>> = {
  'lining-tabular': ($) => $.toolbar.richTextBox.numbersTabularLining,
  'oldstyle-tabular': ($) => $.toolbar.richTextBox.numbersTabularOldstyle,
  'oldstyle-proportional': ($) =>
    $.toolbar.richTextBox.numbersProportionalOldstyle,
  'lining-proportional': ($) => $.toolbar.richTextBox.numbersProportionalLining,
};

// The option lists and glyph-preview styles for the caps and figure/spacing
// button groups, shared by the properties panes and the paragraph styles
// dialog so every surface offers the same choices.
export function useFontVariantOptions() {
  const { t } = useTranslation();

  const capsOptions = computed(() =>
    CAPS_KEYS.map((value) => ({
      value,
      label: t(CAPS_LABELS[value], { ns: 'toolbar' }),
    })),
  );

  const numericOptions = computed(() =>
    NUMERIC_KEYS.map((value) => ({
      value,
      label: t(NUMERIC_LABELS[value], { ns: 'toolbar' }),
    })),
  );

  return { capsOptions, numericOptions };
}

// The decompose/recompose glue between the three longhand values and the
// caps/numeric/ligature controls, shared by FontVariantFields and the
// paragraph styles dialog so the control-model semantics cannot drift. Each
// surface supplies its own reads and write sink: FontVariantFields emits the
// recomposed longhand ('' when no features remain), while the dialog folds ''
// to a null override (an explicit "normal" that defeats the parent style).
export function useFontVariantControls(
  caps: () => string | null,
  numeric: () => string | null,
  ligatures: () => string | null,
  write: (property: FontVariantProperty, composed: string) => void,
) {
  const capsValue = computed(() => {
    const value = caps();

    return isCapsKey(value) ? value : undefined;
  });

  const numericVariant = computed(() => parseNumericVariant(numeric() ?? ''));

  const numericValue = computed(() => toNumericKey(numericVariant.value));

  const ligatureVariant = computed(() =>
    parseLigatureVariant(ligatures() ?? ''),
  );

  function onCapsChanged(value: unknown) {
    write(FONT_VARIANT_CAPS, isCapsKey(value) ? value : '');
  }

  function onNumericChanged(value: unknown) {
    onNumericVariantChanged(applyNumericKey(numericVariant.value, value));
  }

  function onNumericVariantChanged(variant: NumericVariant) {
    write(FONT_VARIANT_NUMERIC, composeNumericVariant(variant));
  }

  function onLigatureVariantChanged(variant: LigatureVariant) {
    write(FONT_VARIANT_LIGATURES, composeLigatureVariant(variant));
  }

  return {
    capsValue,
    numericVariant,
    numericValue,
    ligatureVariant,
    onCapsChanged,
    onNumericChanged,
    onNumericVariantChanged,
    onLigatureVariantChanged,
  };
}

// One entry per switch/checkbox in the numeric and ligature flag clusters:
// the stable DOM id suffix, the i18n label selector, and the pure read/update
// of the axis it controls, so the properties panes and the paragraph styles
// dialog stay in lockstep on flag semantics while keeping their own widgets.
export interface FontVariantFlag<V> {
  id: string;
  label: SelectorParam<'toolbar'>;
  value: (variant: V) => boolean;
  set: (variant: V, checked: boolean | 'indeterminate') => V;
}

export const NUMERIC_FLAGS: ReadonlyArray<FontVariantFlag<NumericVariant>> = [
  {
    id: 'fractions',
    label: ($) => $.toolbar.richTextBox.fractions,
    value: (variant) => variant.fractions !== null,
    // Fractions is its own axis (diagonal vs stacked), not a boolean flag.
    // The control only sets diagonal; a loaded `stacked` value reads as on
    // and is preserved until the fractions control itself is toggled.
    set: (variant, checked) => ({
      ...variant,
      fractions: checked === true ? 'diagonal' : null,
    }),
  },
  {
    id: 'slashed-zero',
    label: ($) => $.toolbar.richTextBox.slashedZero,
    value: (variant) => variant.slashedZero,
    set: (variant, checked) => ({ ...variant, slashedZero: checked === true }),
  },
  {
    id: 'ordinals',
    label: ($) => $.toolbar.richTextBox.ordinals,
    value: (variant) => variant.ordinal,
    set: (variant, checked) => ({ ...variant, ordinal: checked === true }),
  },
];

export const LIGATURE_FLAGS: ReadonlyArray<FontVariantFlag<LigatureVariant>> = [
  {
    id: 'common-ligatures',
    label: ($) => $.toolbar.richTextBox.commonLigatures,
    value: (variant) => variant.common,
    set: (variant, checked) => ({ ...variant, common: checked === true }),
  },
  {
    id: 'discretionary-ligatures',
    label: ($) => $.toolbar.richTextBox.discretionaryLigatures,
    value: (variant) => variant.discretionary,
    set: (variant, checked) => ({
      ...variant,
      discretionary: checked === true,
    }),
  },
  {
    id: 'historical-ligatures',
    label: ($) => $.toolbar.richTextBox.historicalLigatures,
    value: (variant) => variant.historical,
    set: (variant, checked) => ({ ...variant, historical: checked === true }),
  },
  {
    id: 'contextual-alternates',
    label: ($) => $.toolbar.richTextBox.contextualAlternates,
    value: (variant) => variant.contextual,
    set: (variant, checked) => ({ ...variant, contextual: checked === true }),
  },
];

const OPEN_TYPE_SAMPLE_STYLE: CSSProperties = {
  fontFamily: "'Source Serif', serif",
};

export function numericOptionStyle(value: string): CSSProperties {
  return {
    ...OPEN_TYPE_SAMPLE_STYLE,
    fontVariantNumeric: isNumericKey(value)
      ? composeNumericVariant({
          ...splitNumericKey(value),
          fractions: null,
          ordinal: false,
          slashedZero: false,
        })
      : 'normal',
  };
}

export function caseOptionStyle(value: string): CSSProperties {
  return {
    ...OPEN_TYPE_SAMPLE_STYLE,
    fontVariantCaps: isCapsKey(value) ? value : 'normal',
  };
}
