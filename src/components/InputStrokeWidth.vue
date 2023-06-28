<template>
  <InputUnit
    unit="pt"
    :min="0"
    :max="strokeWidthMax"
    :step="strokeWidthStep"
    :precision="strokeWidthPrecision"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';
import InputUnit from '@/components/InputUnit.vue';

@Component({
  components: { InputUnit },
  emits: ['update:modelValue'],
})
export default class InputStrokeWidth extends Vue {
  @Prop() modelValue!: number;

  strokeWidthMax = 5;
  strokeWidthStep = 0.1;
  strokeWidthPrecision = 2;
}
</script>

<style scoped></style>
