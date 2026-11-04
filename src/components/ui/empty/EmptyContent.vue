<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="empty-content"
    :class="
      cn(
        'gap-2.5 text-xs flex w-full max-w-sm min-w-0 flex-col items-center text-balance',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
