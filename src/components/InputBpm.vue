<template>
  <InputUnit
    unit="unitless"
    :min="5"
    :max="999"
    :step="1"
    :round="round"
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import InputUnit from '@/components/InputUnit.vue';

defineEmits(['update:modelValue']);
defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

function round(value: number) {
  return Math.round(value);
}
</script>

<style scoped></style>
