<template>
  <InputUnit
    unit="pt"
    :min="0"
    :max="strokeWidthMax"
    :step="strokeWidthStep"
    :precision="strokeWidthPrecision"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import InputUnit from '@/components/InputUnit.vue';

const strokeWidthMax = 5;
const strokeWidthStep = 0.1;
const strokeWidthPrecision = 2;

defineEmits(['update:modelValue']);
defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
});
</script>

<style scoped></style>
