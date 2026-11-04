<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="item-actions"
    :class="cn('gap-2 flex items-center', props.class)"
  >
    <slot />
  </div>
</template>
