<template>
  <input
    ref="input"
    :value="displayValue"
    type="number"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    @change="onChange(($event.target as HTMLInputElement).value)"
  />
</template>

<script lang="ts">
export type UnitOfMeasure =
  | 'pc'
  | 'pt'
  | 'in'
  | 'cm'
  | 'mm'
  | 'percent'
  | 'unitless';
</script>

<script setup lang="ts">
import { computed, PropType, useTemplateRef } from 'vue';

import { Unit } from '@/utils/Unit';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: [Number, null],
    required: true,
  },
  unit: {
    type: String as PropType<UnitOfMeasure>,
    required: true,
  },
  nullable: {
    type: Boolean,
    default: false,
  },
  /**
   * The minimum value allowed, in display units.
   */
  min: {
    type: Number,
    default: undefined,
  },
  /**
   * The maximum value allowed, in display units.
   */
  max: {
    type: Number,
    default: undefined,
  },
  /**
   * The step size, in display units.
   */
  step: {
    type: Number,
    default: undefined,
  },
  /**
   * The number of decimal places that will be displayed.
   */
  precision: {
    type: Number,
    default: undefined,
  },
  /**
   * The default value if the value is cleared
   */
  defaultValue: {
    type: Number,
    default: 0,
  },
  /**
   * Whether the input is disabled
   */
  disabled: {
    type: Boolean,
    default: false,
  },
  /**
   * A special rounding function applied to the display value
   * before it is converted to the stored value.
   */
  round: {
    type: Function as PropType<(x: number) => number>,
    default: undefined,
  },
});

const input = useTemplateRef<HTMLInputElement>('input');

const displayValue = computed(() => {
  const convertedValue = toDisplay(props.modelValue);

  if (convertedValue == null) {
    return props.nullable ? '' : props.defaultValue.toString();
  }

  return props.precision != null
    ? convertedValue.toFixed(props.precision)
    : convertedValue.toString();
});

function emitValue(v: number | null) {
  if (props.modelValue !== v) {
    emit('update:modelValue', v);
  } else {
    input.value!.value = displayValue.value;
  }
}

function onChange(input: string) {
  if (input.trim() === '' && props.nullable) {
    return emitValue(null);
  }

  let newValue = parseFloat(input);

  if (isNaN(newValue)) {
    newValue = props.defaultValue;
  }

  if (props.round != null) {
    newValue = props.round(newValue);
  }

  let storageValue = toStorage(newValue);

  if (props.min != null) {
    storageValue = Math.max(toStorage(props.min), storageValue);
  }

  if (props.max != null) {
    storageValue = Math.min(toStorage(props.max), storageValue);
  }

  emitValue(storageValue);
}

function toStorage(value: number) {
  switch (props.unit) {
    case 'pc':
      return Unit.fromPc(value);
    case 'pt':
      return Unit.fromPt(value);
    case 'in':
      return Unit.fromInch(value);
    case 'cm':
      return Unit.fromCm(value);
    case 'mm':
      return Unit.fromMm(value);
    case 'percent':
      return Unit.fromPercent(value);
    case 'unitless':
      return value;
    default:
      console.error(`Unsupported unit ${props.unit}`);
      return value;
  }
}

function toDisplay(value: number | null) {
  if (value == null) {
    return null;
  }

  switch (props.unit) {
    case 'pc':
      return Unit.toPc(value);
    case 'pt':
      return Unit.toPt(value);
    case 'in':
      return Unit.toInch(value);
    case 'cm':
      return Unit.toCm(value);
    case 'mm':
      return Unit.toMm(value);
    case 'percent':
      return Unit.toPercent(value);
    case 'unitless':
      return value;
    default:
      console.error(`Unsupported unit ${props.unit}`);
      return value;
  }
}
</script>

<style scoped></style>
