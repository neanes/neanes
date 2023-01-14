<template>
  <InputUnit
    unit="unitless"
    :min="5"
    :max="999"
    :step="1"
    :round="round"
    :value="value"
    :disabled="disabled"
    @input="$emit('input', $event)"
  />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import InputUnit from '@/components/InputUnit.vue';

@Component({ components: { InputUnit } })
export default class InputBpm extends Vue {
  @Prop() value!: number;
  @Prop({ default: false }) disabled!: boolean;

  private round(value: number) {
    return Math.round(value);
  }
}
</script>

<style scoped></style>
