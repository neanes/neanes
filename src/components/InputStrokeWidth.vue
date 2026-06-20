<template>
  <InputUnit
    :id="props.id"
    unit="pt"
    :min="0"
    :max="strokeWidthMax"
    :step="strokeWidthStep"
    :format-options="fraction2FormatOptions"
    :model-value="props.modelValue"
    :disabled="props.disabled"
    :class="props.class"
    :input-class="props.inputClass"
    :button-class="props.buttonClass"
    @update:model-value="onModelValueChanged"
  />
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';

const strokeWidthMax = 5;
const strokeWidthStep = 0.1;

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const props = withDefaults(
  defineProps<{
    id?: string;
    modelValue: number;
    disabled?: boolean;
    class?: HTMLAttributes['class'];
    inputClass?: HTMLAttributes['class'];
    buttonClass?: HTMLAttributes['class'];
  }>(),
  {
    id: undefined,
    disabled: false,
    class: undefined,
    inputClass: undefined,
    buttonClass: undefined,
  },
);

function onModelValueChanged(value: number | null) {
  if (value != null) {
    emit('update:modelValue', value);
  }
}
</script>
