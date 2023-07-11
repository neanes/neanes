<template>
  <InputUnit
    unit="unitless"
    :min="5"
    :max="999"
    :step="1"
    :round="round"
    :modelValue="modelValue"
    :disabled="disabled"
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
export default class InputBpm extends Vue {
  @Prop() modelValue!: number;
  @Prop({ default: false }) disabled!: boolean;

  round(value: number) {
    return Math.round(value);
  }
}
</script>

<style scoped></style>
