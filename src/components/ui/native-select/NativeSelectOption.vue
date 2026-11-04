<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <option
    data-slot="native-select-option"
    :class="cn('bg-[Canvas] text-[CanvasText]', props.class)"
  >
    <slot />
  </option>
</template>
