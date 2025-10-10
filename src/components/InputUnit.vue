<template>
  <input
    :value="displayValue"
    @change="onChange(($event.target as HTMLInputElement).value)"
    type="number"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { Unit } from '@/utils/Unit';

export default defineComponent({
  components: {},
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: [Number, null],
      required: true,
    },
    unit: {
      type: String as PropType<
        'pc' | 'pt' | 'in' | 'cm' | 'mm' | 'percent' | 'unitless'
      >,
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
      required: false,
    },
    /**
     * The maximum value allowed, in display units.
     */
    max: {
      type: Number,
      required: false,
    },
    /**
     * The step size, in display units.
     */
    step: {
      type: Number,
      required: false,
    },
    /**
     * The number of decimal places that will be displayed.
     */
    precision: {
      type: Number,
      required: false,
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
      required: false,
    },
  },

  data() {
    return {};
  },

  computed: {
    htmlElement() {
      return this.$el as HTMLInputElement;
    },

    displayValue() {
      const convertedValue = this.toDisplay(this.modelValue);

      if (convertedValue == null) {
        return this.nullable ? '' : this.defaultValue.toString();
      }

      return this.precision != null
        ? convertedValue.toFixed(this.precision)
        : convertedValue.toString();
    },
  },

  methods: {
    emitValue(v: number | null) {
      if (this.modelValue !== v) {
        this.$emit('update:modelValue', v);
      } else {
        this.htmlElement.value = this.displayValue;
      }
    },

    onChange(input: string) {
      if (input.trim() === '' && this.nullable) {
        return this.emitValue(null);
      }

      let newValue = parseFloat(input);

      if (isNaN(newValue)) {
        newValue = this.defaultValue;
      }

      if (this.round != null) {
        newValue = this.round(newValue);
      }

      let storageValue = this.toStorage(newValue);

      if (this.min != null) {
        storageValue = Math.max(this.toStorage(this.min), storageValue);
      }

      if (this.max != null) {
        storageValue = Math.min(this.toStorage(this.max), storageValue);
      }

      this.emitValue(storageValue);
    },

    toStorage(value: number) {
      switch (this.unit) {
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
          console.error(`Unsupported unit ${this.unit}`);
          return value;
      }
    },

    toDisplay(value: number | null) {
      if (value == null) {
        return null;
      }

      switch (this.unit) {
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
          console.error(`Unsupported unit ${this.unit}`);
          return value;
      }
    },
  },
});
</script>

<style scoped></style>
