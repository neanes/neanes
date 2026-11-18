<script lang="ts" setup>
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <ol
    data-slot="breadcrumb-list"
    :class="
      cn(
        'text-muted-foreground gap-1.5 text-xs flex flex-wrap items-center wrap-break-word',
        props.class,
      )
    "
  >
    <slot />
  </ol>
</template>
