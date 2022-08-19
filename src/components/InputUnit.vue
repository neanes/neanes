<template>
  <input
    :value="displayValue"
    @change="onValueChanged($event.target.value)"
    type="number"
    :min="min"
    :max="max"
    :step="step"
  />
</template>

<script lang="ts">
import { Unit } from '@/utils/Unit';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({ components: {} })
export default class InputUnit extends Vue {
  @Prop() value!: number;
  @Prop() unit!: 'pt' | 'in' | 'mm';
  @Prop() min!: number | undefined;
  @Prop() max!: number | undefined;
  @Prop() step!: number | undefined;
  @Prop() precision!: number | undefined;

  get displayValue() {
    let convertedValue = this.toDisplay(this.value);

    return convertedValue.toFixed(this.precision || 0);
  }

  onValueChanged(input: string) {
    let newValue = parseFloat(input);

    let storageValue = this.toStorage(newValue);

    if (this.min != null) {
      storageValue = Math.max(this.min, storageValue);
    }

    if (this.max != null) {
      storageValue = Math.min(this.max, storageValue);
    }

    this.$emit('input', storageValue);
  }

  toStorage(value: number) {
    switch (this.unit) {
      case 'pt':
        return Unit.fromPt(value);
      case 'in':
        return Unit.fromInch(value);
      case 'mm':
        return Unit.fromMm(value);
      default:
        console.error(`Unsupported unit ${this.unit}`);
        return value;
    }
  }

  toDisplay(value: number) {
    switch (this.unit) {
      case 'pt':
        return Unit.toPt(value);
      case 'in':
        return Unit.toInch(value);
      case 'mm':
        return Unit.toMm(value);
      default:
        console.error(`Unsupported unit ${this.unit}`);
        return value;
    }
  }
}
</script>

<style scoped></style>
