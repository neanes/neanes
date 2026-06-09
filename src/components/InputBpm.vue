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
    @update:model-value="onModelValueChanged"
  />
</template>

<script setup lang="ts">
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
  }>(),
  {
    disabled: false,
    id: undefined,
  },
);

function onModelValueChanged(value: number | null) {
  if (value != null) {
    emit('update:modelValue', Math.round(value));
  }
}
</script>
