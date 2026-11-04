<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="popover-header"
    :class="cn('flex flex-col gap-1 text-xs', props.class)"
  >
    <slot />
  </div>
</template>
