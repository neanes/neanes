<template>
  <InputUnit
    unit="pt"
    :min="4"
    :max="max"
    :step="0.5"
    :format-options="fraction1FormatOptions"
    :model-value="modelValue"
    @update:model-value="onModelValueChanged"
  />
</template>

<script setup lang="ts">
import InputUnit from '@/components/InputUnit.vue';
import { fraction1FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();
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

function onModelValueChanged(value: number | null) {
  if (value != null) {
    const points = Unit.toPt(value);
    emit('update:modelValue', Unit.fromPt(Math.round(points * 2) / 2));
  }
}
</script>
