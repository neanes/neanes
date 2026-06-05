<template>
  <InputUnit
    unit="pt"
    :min="0"
    :max="strokeWidthMax"
    :step="strokeWidthStep"
    :format-options="fraction2FormatOptions"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import InputUnit from '@/components/InputUnit.vue';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';

const strokeWidthMax = 5;
const strokeWidthStep = 0.1;

defineEmits(['update:modelValue']);
defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
});
</script>
