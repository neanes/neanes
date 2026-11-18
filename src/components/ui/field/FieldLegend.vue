<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class'];
    variant?: 'legend' | 'label';
  }>(),
  {
    variant: 'legend',
  },
);
</script>

<template>
  <legend
    data-slot="field-legend"
    :data-variant="variant"
    :class="
      cn(
        'mb-2.5 font-medium data-[variant=label]:text-xs data-[variant=legend]:text-sm',
        props.class,
      )
    "
  >
    <slot />
  </legend>
</template>
