<template>
  <InputUnit
    unit="pt"
    :min="0"
    :max="strokeWidthMax"
    :step="strokeWidthStep"
    :precision="strokeWidthPrecision"
    :value="value"
    @input="$emit('input', $event)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import InputUnit from '@/components/InputUnit.vue';

@Component({ components: { InputUnit } })
export default class InputStrokeWidth extends Vue {
  @Prop() value!: number;

  strokeWidthMax = 5;
  strokeWidthStep = 0.1;
  strokeWidthPrecision = 2;
}
</script>

<style scoped></style>
