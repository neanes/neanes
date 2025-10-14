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
import { defineComponent } from 'vue';

import InputUnit from '@/components/InputUnit.vue';

export default defineComponent({
  components: { InputUnit },
  emits: ['update:modelValue'],
  props: {
    modelValue: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      default: 100,
    },
  },

  data() {
    return {};
  },

  computed: {},

  methods: {
    round(value: number) {
      return Math.round(value * 2) / 2;
    },
  },
});
</script>

<style scoped></style>
