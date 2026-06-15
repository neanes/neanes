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
    :class="rootClasses"
    :style="rootStyle"
    @focusin="onWidgetFocusIn"
    @focusout="onWidgetFocusOut"
  >
    <NumberFieldContent class="w-full max-w-full">
      <NumberFieldDecrement :class="buttonClass" />
      <NumberFieldInput
        :id="id"
        ref="inputRef"
        v-bind="inputAttrs"
        :class="inputClasses"
      />
      <NumberFieldIncrement :class="buttonClass" />
    </NumberFieldContent>
  </NumberField>
</template>

<script setup lang="ts">
import type { HTMLAttributes, StyleValue } from 'vue';
import { computed, nextTick, onBeforeUnmount, ref, useAttrs } from 'vue';

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
  // Focus entered / truly left the whole widget (input + stepper buttons),
  // debounced so intra-widget focus moves don't fire a spurious blur.
  focuscapture: [];
  blurcapture: [];
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

const inputRef = ref<InstanceType<typeof NumberFieldInput>>();

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

// The widget sizes to its content by default via --input-unit-width on the
// root. A width class passed by the consumer (e.g. w-28, w-36, w-full) lands
// here too and overrides it, so call sites control width with plain Tailwind.
const rootClasses = computed(() => [
  'w-[var(--input-unit-width)]',
  'min-w-20',
  'max-w-full',
  attrs.class as HTMLAttributes['class'],
]);

const inputClasses = 'bg-background w-full min-w-0';

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

// When the resolved value matches the current model, emitValue suppresses the
// update, so no new model flows back to reset the NumberField's text. Reka's
// empty-input path (and Enter key) can leave the input visually blank in that
// case, so re-sync the displayed text to the canonical value ourselves.
function resyncInput() {
  nextTick(() => {
    const el = inputRef.value?.$el as HTMLInputElement | undefined;

    if (el == null) {
      return;
    }

    const value = displayValue.value;

    el.value =
      value == null
        ? ''
        : new Intl.NumberFormat(undefined, resolvedFormatOptions.value).format(
            value,
          );
  });
}

const inputTextLength = computed(() => {
  const value = displayValue.value;
  let length: number;

  if (value == null) {
    length = Math.max(String(attrs.placeholder ?? '').length, 1);
  } else {
    length = Math.max(formatDisplayValue(value).length, 1);
  }

  if (negativeValuesAreAllowed.value && (value == null || value >= 0)) {
    length += negativeSignLength.value;
  }

  return length;
});

const rootStyle = computed<StyleValue>(() => [
  attrs.style as StyleValue,
  { '--input-unit-width': `calc(${inputTextLength.value}ch + 3.5rem)` },
]);

const negativeValuesAreAllowed = computed(
  () => props.min == null || props.min < 0,
);

const negativeSignLength = computed(() => {
  const formatter = new Intl.NumberFormat(
    undefined,
    resolvedFormatOptions.value,
  );

  return Math.max(formatter.format(-1).length - formatter.format(1).length, 0);
});

function formatDisplayValue(value: number) {
  return new Intl.NumberFormat(undefined, resolvedFormatOptions.value).format(
    value,
  );
}

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
  } else {
    resyncInput();
  }
}

// Track focus across the whole widget so the rich-text consumer can show/hide
// the selection marker. focusin/focusout bubble, so the handler on the
// NumberField root sees the input and stepper buttons; relatedTarget + an rAF
// re-check distinguish a real blur from intra-widget focus churn (steppers
// re-focus the input on click).
let widgetHasFocus = false;
let pendingBlurFrame: number | null = null;

function onWidgetFocusIn() {
  if (pendingBlurFrame != null) {
    cancelAnimationFrame(pendingBlurFrame);
    pendingBlurFrame = null;
  }

  if (!widgetHasFocus) {
    widgetHasFocus = true;
    emit('focuscapture');
  }
}

function onWidgetFocusOut(event: FocusEvent) {
  const container = event.currentTarget as HTMLElement | null;
  const next = event.relatedTarget as Node | null;

  if (next != null && container != null && container.contains(next)) {
    return;
  }

  if (pendingBlurFrame != null) {
    cancelAnimationFrame(pendingBlurFrame);
  }

  pendingBlurFrame = requestAnimationFrame(() => {
    pendingBlurFrame = null;

    const active = document.activeElement;

    if (container != null && active != null && container.contains(active)) {
      return;
    }

    if (widgetHasFocus) {
      widgetHasFocus = false;
      emit('blurcapture');
    }
  });
}

onBeforeUnmount(() => {
  if (pendingBlurFrame != null) {
    cancelAnimationFrame(pendingBlurFrame);
    pendingBlurFrame = null;
  }
});
</script>
