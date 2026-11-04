<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="sidebar-group"
    data-sidebar="group"
    :class="cn('p-2 relative flex w-full min-w-0 flex-col', props.class)"
  >
    <slot />
  </div>
</template>
