<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="card-title"
    :class="
      cn(
        'text-sm font-medium group-data-[size=sm]/card:text-sm cn-font-heading',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
