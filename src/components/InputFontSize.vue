<template>
  <InputUnit
    :id="props.id"
    unit="pt"
    :min="4"
    :max="max"
    :step="0.5"
    :format-options="fraction1FormatOptions"
    :disabled="disabled"
    :nullable="nullable"
    :placeholder="placeholder"
    :default-value="defaultValue"
    :model-value="modelValue"
    :class="props.class"
    :input-class="props.inputClass"
    :button-class="props.buttonClass"
    @update:model-value="onModelValueChanged"
    @focus-within="$emit('focus-within')"
    @blur-within="$emit('blur-within')"
  />
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import { fraction1FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'focus-within': [];
  'blur-within': [];
}>();

const props = withDefaults(
  defineProps<{
    id?: string;
    // Accepts null only for nullable usages, where an empty field represents a
    // caller-defined fallback such as "default", "auto", or "normal".
    modelValue: number | null;
    max?: number;
    disabled?: boolean;
    // When true, clearing the field emits null (rather than being ignored) so the
    // consumer can fall back to its default. Mirrors InputUnit's nullable mode.
    nullable?: boolean;
    // Model-unit fallback. Nullable empty fields stay blank, but step from this
    // value when the user presses an arrow key or stepper.
    defaultValue?: number;
    placeholder?: string;
    class?: HTMLAttributes['class'];
    inputClass?: HTMLAttributes['class'];
    buttonClass?: HTMLAttributes['class'];
  }>(),
  {
    id: undefined,
    max: 100,
    disabled: false,
    nullable: false,
    defaultValue: undefined,
    placeholder: undefined,
    class: undefined,
    inputClass: undefined,
    buttonClass: undefined,
  },
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
