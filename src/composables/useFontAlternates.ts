import type { SelectorParam } from 'i18next';
import { useTranslation } from 'i18next-vue';
import type { ComputedRef, Ref } from 'vue';
import { computed, ref, watch } from 'vue';

import type {
  FontAlternates,
  FontAlternatesSwitch,
} from '@/services/FontAlternatesService';
import {
  EMPTY_FONT_ALTERNATES,
  getFontAlternates,
} from '@/services/FontAlternatesService';
import type {
  AlternatesVariant,
  SingleAlternateNotation,
} from '@/utils/fontVariants';

// The alternate features available in the face the given family+style
// resolves to, for the alternates controls. Bundled faces resolve from the
// build-time artifact immediately; a system face is parsed on demand
// (cached per face by the service), so its capability starts empty and
// fills in when the face's GSUB table has been read. It resets to empty
// while a new face loads so controls never show another font's features.
function useFontAlternates(
  fontFamily: () => string | null,
  fontStyle: () => string | null,
): Ref<FontAlternates> {
  const alternates = ref<FontAlternates>(EMPTY_FONT_ALTERNATES);

  let requestId = 0;

  // watch, not watchEffect: the getters may re-evaluate on unrelated changes
  // to their source (e.g. any edit to a paragraph style object), and only an
  // actual family/style change should reset and reload the capability.
  watch(
    [fontFamily, fontStyle],
    ([family, style]) => {
      const id = ++requestId;

      alternates.value = EMPTY_FONT_ALTERNATES;

      if (family == null || family.trim() === '') {
        return;
      }

      getFontAlternates(family, style).then((result) => {
        if (id === requestId) {
          alternates.value = result;
        }
      });
    },
    { immediate: true },
  );

  return alternates;
}

// One row in the font-derived alternates controls. Labels are already
// resolved because most come from the font itself rather than an i18n key.
export interface AlternateFlag {
  id: string;
  label: string;
  value: (variant: AlternatesVariant) => boolean;
  set: (
    variant: AlternatesVariant,
    checked: boolean | 'indeterminate',
  ) => AlternatesVariant;
}

// The numbered feature axes, each contributing one row per feature: the DOM
// id prefix and the generic label for a feature the font does not name.
const NUMBER_AXES: ReadonlyArray<{
  axis: 'stylisticSets' | 'characterVariants';
  idPrefix: string;
  label: SelectorParam<'toolbar'>;
}> = [
  {
    axis: 'stylisticSets',
    idPrefix: 'styleset',
    label: ($) => $.toolbar.richTextBox.stylisticSet,
  },
  {
    axis: 'characterVariants',
    idPrefix: 'character-variant',
    label: ($) => $.toolbar.richTextBox.characterVariant,
  },
];

// The switches for the single-alternate notations: the capability that shows
// each one and its i18n label, in the notations' canonical value order (see
// composeAlternatesVariant).
const SINGLE_ALTERNATE_SWITCHES: ReadonlyArray<{
  notation: SingleAlternateNotation;
  has: FontAlternatesSwitch;
  label: SelectorParam<'toolbar'>;
}> = [
  {
    notation: 'stylistic',
    has: 'hasStylistic',
    label: ($) => $.toolbar.richTextBox.stylisticAlternates,
  },
  {
    notation: 'swash',
    has: 'hasSwash',
    label: ($) => $.toolbar.richTextBox.swash,
  },
  {
    notation: 'ornaments',
    has: 'hasOrnaments',
    label: ($) => $.toolbar.richTextBox.ornaments,
  },
  {
    notation: 'annotation',
    has: 'hasAnnotation',
    label: ($) => $.toolbar.richTextBox.annotationForms,
  },
];

const historicalFormsFlag = (label: string): AlternateFlag => ({
  id: 'historical-forms',
  label,
  value: (variant) => variant.historicalForms,
  set: (variant, checked) => ({
    ...variant,
    historicalForms: checked === true,
  }),
});

// The alternates controls the current face and value call for, in display
// order: the historical-forms switch, one row per stylistic set and character
// variant, and the single-alternate switches (stylistic, swash, ornaments,
// annotation), each only when the face has the feature. A feature that is
// active in the current value but missing from the face (e.g. authored with
// another font) stays visible so it can be switched off. Features the font
// does not name fall back to a generic numbered label. Shared by
// FontVariantFields and the paragraph styles dialog so both surfaces offer
// the same controls.
export function useAlternateFlags(
  fontFamily: () => string | null,
  fontStyle: () => string | null,
  active: () => AlternatesVariant,
): ComputedRef<AlternateFlag[]> {
  const { t } = useTranslation();
  const fontAlternates = useFontAlternates(fontFamily, fontStyle);

  // One flag per feature number the face advertises or the value activates,
  // in ascending feature order, labeled with the font's own name for the
  // feature when it provides one.
  const numberFlags = ({
    axis,
    idPrefix,
    label,
  }: (typeof NUMBER_AXES)[number]): AlternateFlag[] => {
    const fallbackLabel = (number: number) =>
      t(label, { ns: 'toolbar', number });
    const labels = new Map<number, string>();

    for (const feature of fontAlternates.value[axis]) {
      labels.set(feature.number, feature.name ?? fallbackLabel(feature.number));
    }

    for (const number of active()[axis]) {
      if (!labels.has(number)) {
        labels.set(number, fallbackLabel(number));
      }
    }

    return [...labels.entries()]
      .sort(([a], [b]) => a - b)
      .map(([number, featureLabel]) => ({
        id: `${idPrefix}-${number}`,
        label: featureLabel,
        value: (variant) => variant[axis].includes(number),
        set: (variant, checked) => {
          const numbers = new Set(variant[axis]);

          if (checked === true) {
            numbers.add(number);
          } else {
            numbers.delete(number);
          }

          const next = { ...variant };
          next[axis] = [...numbers];
          return next;
        },
      }));
  };

  return computed<AlternateFlag[]>(() => [
    ...(fontAlternates.value.hasHistoricalForms || active().historicalForms
      ? [
          historicalFormsFlag(
            t(($) => $.toolbar.richTextBox.historicalForms, { ns: 'toolbar' }),
          ),
        ]
      : []),
    ...NUMBER_AXES.flatMap(numberFlags),
    ...SINGLE_ALTERNATE_SWITCHES.filter(
      ({ notation, has }) =>
        fontAlternates.value[has] || active()[notation] != null,
    ).map(({ notation, label }): AlternateFlag => ({
      id: notation,
      label: t(label, { ns: 'toolbar' }),
      value: (variant) => variant[notation] != null,
      // Keep a loaded later-alternate selection when the switch is already
      // on; switching on anew picks the first alternate.
      set: (variant, checked) => {
        const next = { ...variant };
        next[notation] = checked === true ? (variant[notation] ?? 1) : null;
        return next;
      },
    })),
  ]);
}
