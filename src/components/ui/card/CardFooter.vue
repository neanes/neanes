<script setup lang="ts">
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="card-footer"
    :class="
      cn(
        'rounded-none border-t p-4 group-data-[size=sm]/card:p-3 flex items-center',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
