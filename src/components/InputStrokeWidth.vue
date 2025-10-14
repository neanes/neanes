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
import { defineComponent } from 'vue';

import InputUnit from '@/components/InputUnit.vue';

const strokeWidthMax = 5;
const strokeWidthStep = 0.1;
const strokeWidthPrecision = 2;

export default defineComponent({
  components: { InputUnit },
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: Number,
      required: true,
    },
  },

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
