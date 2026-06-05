<template>
  <InputUnit
    unit="pt"
    :min="4"
    :max="max"
    :step="0.5"
    :model-value="modelValue"
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
  max: {
    type: Number,
    default: 100,
  },
});
</script>
