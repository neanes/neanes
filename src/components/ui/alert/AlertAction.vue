<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="alert-action"
    :class="
      cn(
        'absolute top-[calc(--spacing(1.25))] right-[calc(--spacing(1.25))]',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
