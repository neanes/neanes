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
import { Component, Prop, Vue, Watch } from 'vue-facing-decorator';

import { Unit } from '@/utils/Unit';

@Component({
  components: {},
  emits: ['update:modelValue'],
})
export default class InputUnit extends Vue {
  @Prop() modelValue!: number;
  @Prop() unit!: 'px' | 'pt' | 'in' | 'mm' | 'percent' | 'unitless';
  @Prop({ default: false }) nullable!: boolean;
  /**
   * The minimum value allowed, in display units.
   */
  @Prop() min!: number | undefined;
  /**
   * The maximum value allowed, in display units.
   */
  @Prop() max!: number | undefined;
  /**
   * The step size, in display units.
   */
  @Prop() step!: number | undefined;
  /**
   * The number of decimal places that will be displayed.
   */
  @Prop() precision!: number | undefined;
  /**
   * The default value if the value is cleared
   */
  @Prop({ default: 0 }) defaultValue!: number;
  /**
   * Whether the input is disabled
   */
  @Prop({ default: false }) disabled!: boolean;
  /**
   * A special rounding function applied to the display value
   * before it is converted to the stored value.
   */
  @Prop() round!: ((x: number) => number) | undefined;

  get htmlElement() {
    return this.$el as HTMLInputElement;
  }

  get displayValue() {
    const convertedValue = this.toDisplay(this.modelValue);

    if (convertedValue == null) {
      return this.nullable ? '' : this.defaultValue.toString();
    }

    return this.precision != null
      ? convertedValue.toFixed(this.precision)
      : convertedValue.toString();
  }

  emitValue(v: number | null) {
    if (this.modelValue !== v) {
      this.$emit('update:modelValue', v);
    } else {
      this.htmlElement.value = this.displayValue;
    }
  }

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
  }

  toStorage(value: number) {
    switch (this.unit) {
      case 'px':
        return value;
      case 'pt':
        return Unit.fromPt(value);
      case 'in':
        return Unit.fromInch(value);
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
  }

  toDisplay(value: number | null) {
    if (value == null) {
      return null;
    }

    switch (this.unit) {
      case 'px':
        return value;
      case 'pt':
        return Unit.toPt(value);
      case 'in':
        return Unit.toInch(value);
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
  }

  @Watch('value')
  onValueChanged() {
    this.htmlElement.value = this.displayValue;
  }
}
</script>

<style scoped></style>
