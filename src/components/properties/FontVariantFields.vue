<template>
  <Field orientation="horizontal">
    <FieldLabel>{{
      $t(($) => $.toolbar.richTextBox.case, { ns: 'toolbar' })
    }}</FieldLabel>
    <div class="flex items-center gap-1">
      <ToggleGroup
        type="single"
        variant="outline"
        :model-value="capsValue"
        @update:model-value="onCapsChanged"
      >
        <AppTooltip
          v-for="option in capsOptions"
          :key="option.value"
          :tooltip="option.label"
        >
          <ToggleGroupItem
            :value="option.value"
            :aria-label="option.label"
            :disabled="!capsEnabled"
            :style="caseOptionStyle(option.value)"
            @mousedown.prevent
          >
            Aa
          </ToggleGroupItem>
        </AppTooltip>
      </ToggleGroup>
      <ParagraphStyleClearButton
        :disabled="!capsEnabled || !capsClearable"
        @clear="$emit('clear', FONT_VARIANT_CAPS)"
      />
    </div>
  </Field>

  <Field orientation="horizontal">
    <FieldLabel>{{
      $t(($) => $.toolbar.richTextBox.numbers, { ns: 'toolbar' })
    }}</FieldLabel>
    <div class="flex items-center gap-1">
      <ToggleGroup
        type="single"
        variant="outline"
        :model-value="numericValue"
        @update:model-value="onNumericChanged"
      >
        <AppTooltip
          v-for="option in numericOptions"
          :key="option.value"
          :tooltip="option.label"
        >
          <ToggleGroupItem
            :value="option.value"
            :aria-label="option.label"
            :disabled="!numericEnabled"
            :style="numericOptionStyle(option.value)"
            @mousedown.prevent
          >
            19
          </ToggleGroupItem>
        </AppTooltip>
      </ToggleGroup>
      <ParagraphStyleClearButton
        :disabled="!numericEnabled || !numericClearable"
        @clear="$emit('clear', FONT_VARIANT_NUMERIC)"
      />
    </div>
  </Field>

  <Field v-for="flag in NUMERIC_FLAGS" :key="flag.id" orientation="horizontal">
    <Switch
      :id="`${idPrefix}-${flag.id}`"
      :model-value="flag.value(numericVariant)"
      :disabled="!numericEnabled"
      @mousedown.prevent
      @update:model-value="
        onNumericVariantChanged(flag.set(numericVariant, $event))
      "
    />
    <FieldLabel :for="`${idPrefix}-${flag.id}`" @mousedown.prevent>
      {{ $t(flag.label, { ns: 'toolbar' }) }}
    </FieldLabel>
  </Field>

  <Field orientation="horizontal">
    <FieldLabel>{{
      $t(($) => $.toolbar.richTextBox.ligatures, { ns: 'toolbar' })
    }}</FieldLabel>
    <ParagraphStyleClearButton
      :disabled="!ligaturesEnabled || !ligaturesClearable"
      @clear="$emit('clear', FONT_VARIANT_LIGATURES)"
    />
  </Field>

  <Field v-for="flag in LIGATURE_FLAGS" :key="flag.id" orientation="horizontal">
    <Switch
      :id="`${idPrefix}-${flag.id}`"
      :model-value="flag.value(ligatureVariant)"
      :disabled="!ligaturesEnabled"
      @mousedown.prevent
      @update:model-value="
        onLigatureVariantChanged(flag.set(ligatureVariant, $event))
      "
    />
    <FieldLabel :for="`${idPrefix}-${flag.id}`" @mousedown.prevent>
      {{ $t(flag.label, { ns: 'toolbar' }) }}
    </FieldLabel>
  </Field>

  <Field
    v-if="alternateFlags.length > 0 || alternatesClearable"
    orientation="horizontal"
  >
    <FieldLabel>{{
      $t(($) => $.toolbar.richTextBox.alternates, { ns: 'toolbar' })
    }}</FieldLabel>
    <ParagraphStyleClearButton
      :disabled="!alternatesEnabled || !alternatesClearable"
      @clear="$emit('clear', FONT_VARIANT_ALTERNATES)"
    />
  </Field>

  <Field v-for="flag in alternateFlags" :key="flag.id" orientation="horizontal">
    <Switch
      :id="`${idPrefix}-${flag.id}`"
      :model-value="flag.value(alternatesVariant)"
      :disabled="!alternatesEnabled"
      @mousedown.prevent
      @update:model-value="
        onAlternatesVariantChanged(flag.set(alternatesVariant, $event))
      "
    />
    <FieldLabel :for="`${idPrefix}-${flag.id}`" @mousedown.prevent>
      {{ flag.label }}
    </FieldLabel>
  </Field>
</template>

<script setup lang="ts">
import AppTooltip from '@/components/AppTooltip.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import { Field, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAlternateFlags } from '@/composables/useFontAlternates';
import {
  caseOptionStyle,
  LIGATURE_FLAGS,
  NUMERIC_FLAGS,
  numericOptionStyle,
  useFontVariantControls,
  useFontVariantOptions,
} from '@/composables/useFontVariantOptions';
import type { FontVariantProperty } from '@/utils/fontVariants';
import {
  FONT_VARIANT_ALTERNATES,
  FONT_VARIANT_CAPS,
  FONT_VARIANT_LIGATURES,
  FONT_VARIANT_NUMERIC,
} from '@/utils/fontVariants';

// Shared controls for the four font-variant properties, used by the
// rich-text, text-box, drop-cap, and lyrics properties panes. The component
// owns the widgets; useFontVariantControls owns the decompose/recompose
// between a longhand value and its individual controls: the caller supplies
// the four effective longhand values and receives the recomposed longhand on
// change ('' when no features remain), or a clear event, keyed by the
// canonical property name. The stylistic-set and character-variant rows and
// the single-alternate switches come from the effective face (fontFamily +
// fontStyle), the sets and variants labeled with the names the font itself
// provides.

const props = withDefaults(
  defineProps<{
    idPrefix: string;
    caps: string | null;
    numeric: string | null;
    ligatures: string | null;
    alternates: string | null;
    fontFamily: string | null;
    fontStyle: string | null;
    capsEnabled?: boolean;
    numericEnabled?: boolean;
    ligaturesEnabled?: boolean;
    alternatesEnabled?: boolean;
    capsClearable: boolean;
    numericClearable: boolean;
    ligaturesClearable: boolean;
    alternatesClearable: boolean;
  }>(),
  {
    capsEnabled: true,
    numericEnabled: true,
    ligaturesEnabled: true,
    alternatesEnabled: true,
  },
);

const emit = defineEmits<{
  change: [property: FontVariantProperty, value: string];
  clear: [property: FontVariantProperty];
}>();

const { capsOptions, numericOptions } = useFontVariantOptions();

const {
  capsValue,
  numericVariant,
  numericValue,
  ligatureVariant,
  alternatesVariant,
  onCapsChanged,
  onNumericChanged,
  onNumericVariantChanged,
  onLigatureVariantChanged,
  onAlternatesVariantChanged,
} = useFontVariantControls(
  () => props.caps,
  () => props.numeric,
  () => props.ligatures,
  () => props.alternates,
  (property, composed) => emit('change', property, composed),
);

const alternateFlags = useAlternateFlags(
  () => props.fontFamily,
  () => props.fontStyle,
  () => alternatesVariant.value,
);
</script>
