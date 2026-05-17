<template>
  <InputUnit
    unit="unitless"
    :min="5"
    :max="999"
    :step="1"
    :round="round"
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import InputUnit from '@/components/InputUnit.vue';

export default defineComponent({
  components: { InputUnit },
  props: {
    modelValue: {
      type: Number,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],

  data() {
    return {};
  },

  computed: {},

  methods: {
    round(value: number) {
      return Math.round(value);
    },
  },
});
</script>

<style scoped></style>
