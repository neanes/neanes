<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="card-description"
    :class="cn('text-muted-foreground text-xs/relaxed', props.class)"
  >
    <slot />
  </div>
</template>
