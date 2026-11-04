<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div data-slot="table-container" class="relative w-full overflow-x-auto">
    <table
      data-slot="table"
      :class="cn('w-full caption-bottom text-xs', props.class)"
    >
      <slot />
    </table>
  </div>
</template>
