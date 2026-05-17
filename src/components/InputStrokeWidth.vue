<template>
  <InputUnit
    unit="pt"
    :min="0"
    :max="strokeWidthMax"
    :step="strokeWidthStep"
    :precision="strokeWidthPrecision"
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import InputUnit from '@/components/InputUnit.vue';

const strokeWidthMax = 5;
const strokeWidthStep = 0.1;
const strokeWidthPrecision = 2;

export default defineComponent({
  components: { InputUnit },
  props: {
    modelValue: {
      type: Number,
      required: true,
    },
  },
  emits: ['update:modelValue'],

  data() {
    return {
      strokeWidthMax,
      strokeWidthStep,
      strokeWidthPrecision,
    };
  },

  computed: {},

  methods: {},
});
</script>

<style scoped></style>
