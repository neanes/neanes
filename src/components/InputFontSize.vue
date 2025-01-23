<template>
  <InputUnit
    unit="pt"
    :min="4"
    :max="max"
    :step="1"
    :round="round"
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
export default class InputFontSize extends Vue {
  @Prop() modelValue!: number;
  @Prop({ default: 100 }) max!: number;

  round(value: number) {
    return Math.round(value * 2) / 2;
  }
}
</script>

<style scoped></style>
