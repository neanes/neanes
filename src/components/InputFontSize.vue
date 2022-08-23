<template>
  <InputUnit
    unit="pt"
    :min="4"
    :max="100"
    :step="1"
    :round="round"
    :value="value"
    @input="$emit('input', $event)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import InputUnit from '@/components/InputUnit.vue';

@Component({ components: { InputUnit } })
export default class InputFontSize extends Vue {
  @Prop() value!: number;

  private round(value: number) {
    return Math.round(value * 2) / 2;
  }
}
</script>

<style scoped></style>
