<template>
  <!--
    Intentionally no :default-value: this wrapper resolves its own defaults in
    the displayValue computed. For nullable fields, displayValue is undefined
    when empty, which makes NumberField initialize in uncontrolled mode; a
    default-value here would render that initial value (e.g. 0) instead of the
    placeholder.
  -->
  <NumberField
    v-model="displayValue"
    :min="min"
    :max="max"
    :step="step"
    :step-snapping="stepSnapping"
    :format-options="resolvedFormatOptions"
    :disabled="disabled"
    class="w-fit max-w-full"
  >
    <NumberFieldContent class="w-fit max-w-full">
      <NumberFieldDecrement :class="buttonClass" />
      <NumberFieldInput
        :id="id"
        v-bind="inputAttrs"
        :class="inputClasses"
        :style="inputStyle"
      />
      <NumberFieldIncrement :class="buttonClass" />
    </NumberFieldContent>
  </NumberField>
</template>

<script setup lang="ts">
import type { HTMLAttributes, StyleValue } from 'vue';
import { computed, useAttrs } from 'vue';

import type { UnitOfMeasure } from '@/components/InputUnit.types';
import { toDisplay, toStorage } from '@/components/InputUnit.types';
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    id?: string;
    modelValue: number | null;
    unit: UnitOfMeasure;
    min?: number;
    max?: number;
    step?: number;
    stepSnapping?: boolean;
    formatOptions?: Intl.NumberFormatOptions;
    defaultValue?: number;
    nullable?: boolean;
    disabled?: boolean;
    buttonClass?: HTMLAttributes['class'];
  }>(),
  {
    id: undefined,
    min: undefined,
    max: undefined,
    step: undefined,
    stepSnapping: false,
    formatOptions: undefined,
    defaultValue: 0,
    nullable: false,
    disabled: false,
    buttonClass: undefined,
  },
);

const attrs = useAttrs();

const inputAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.style;
  delete rest.class;

  return rest;
});

const resolvedFormatOptions = computed<Intl.NumberFormatOptions>(() => ({
  useGrouping: false,
  ...props.formatOptions,
}));

const inputClasses = computed(() => [
  'bg-background',
  'w-[var(--input-unit-width)]',
  'min-w-20',
  'max-w-full',
  attrs.class as HTMLAttributes['class'],
]);

const displayValue = computed<number | undefined>({
  get() {
    const value = toDisplay(props.modelValue, props.unit);

    if (value == null) {
      return props.nullable ? undefined : props.defaultValue;
    }

    return value;
  },
  set(value) {
    if (value == null) {
      emitValue(
        props.nullable
          ? null
          : toStorage(clampDisplayValue(props.defaultValue), props.unit),
      );
      return;
    }

    emitValue(toStorage(clampDisplayValue(value), props.unit));
  },
});

const inputTextLength = computed(() => {
  const value = displayValue.value;

  if (value == null) {
    return Math.max(String(attrs.placeholder ?? '').length, 1);
  }

  return Math.max(
    new Intl.NumberFormat(undefined, resolvedFormatOptions.value).format(value)
      .length,
    1,
  );
});

const inputStyle = computed<StyleValue>(() => [
  attrs.style as StyleValue,
  { '--input-unit-width': `calc(${inputTextLength.value}ch + 3.5rem)` },
]);

function clampDisplayValue(value: number) {
  if (props.min != null && value < props.min) {
    return props.min;
  }

  if (props.max != null && value > props.max) {
    return props.max;
  }

  return value;
}

function emitValue(value: number | null) {
  if (props.modelValue !== value) {
    emit('update:modelValue', value);
  }
}
</script>
