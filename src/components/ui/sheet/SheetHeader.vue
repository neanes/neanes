<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <div
    data-slot="sheet-header"
    :class="cn('gap-0.5 p-4 flex flex-col', props.class)"
  >
    <slot />
  </div>
</template>
