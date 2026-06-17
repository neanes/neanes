<template>
  <InputUnit
    :id="props.id"
    unit="unitless"
    :min="5"
    :max="999"
    :step="1"
    :format-options="fraction0FormatOptions"
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
import { fraction0FormatOptions } from '@/utils/numberFormatOptions';

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

const props = withDefaults(
  defineProps<{
    modelValue: number;
    disabled?: boolean;
    id?: string;
    class?: HTMLAttributes['class'];
    inputClass?: HTMLAttributes['class'];
    buttonClass?: HTMLAttributes['class'];
  }>(),
  {
    disabled: false,
    id: undefined,
    class: undefined,
    inputClass: undefined,
    buttonClass: undefined,
  },
);

function onModelValueChanged(value: number | null) {
  if (value != null) {
    emit('update:modelValue', Math.round(value));
  }
}
</script>
