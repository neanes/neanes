<template>
  <InputUnit
    unit="pt"
    :min="4"
    :max="max"
    :step="0.5"
    :format-options="fraction1FormatOptions"
    :disabled="disabled"
    :nullable="nullable"
    :placeholder="placeholder"
    :empty-step-base-value="emptyStepBaseDisplayValue"
    :model-value="modelValue"
    @update:model-value="onModelValueChanged"
    @focuscapture="$emit('focuscapture')"
    @blurcapture="$emit('blurcapture')"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import { fraction1FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  focuscapture: [];
  blurcapture: [];
}>();
const props = defineProps({
  // Accepts null only for nullable usages (rich text), where an empty field
  // represents "Default". Non-nullable callers always pass a number.
  modelValue: {
    type: Number as PropType<number | null>,
    default: null,
  },
  max: {
    type: Number,
    default: 100,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  // When true, clearing the field emits null (rather than being ignored) so the
  // consumer can fall back to its default. Mirrors InputUnit's nullable mode.
  nullable: {
    type: Boolean,
    default: false,
  },
  // Storage-unit font size to use as the starting point when an empty nullable
  // field is stepped. The inner InputUnit converts it to the displayed pt value.
  emptyStepBaseValue: {
    type: Number,
    default: undefined,
  },
  placeholder: {
    type: String,
    default: undefined,
  },
});

const emptyStepBaseDisplayValue = computed(() =>
  props.emptyStepBaseValue == null
    ? undefined
    : Unit.toPt(props.emptyStepBaseValue),
);

function onModelValueChanged(value: number | null) {
  if (value == null) {
    if (props.nullable) {
      emit('update:modelValue', null);
    }
    return;
  }

  const points = Unit.toPt(value);
  emit('update:modelValue', Unit.fromPt(Math.round(points * 2) / 2));
}
</script>
