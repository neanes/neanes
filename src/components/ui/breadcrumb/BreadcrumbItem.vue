<script lang="ts" setup>
import { cn } from 'cn';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <li
    data-slot="breadcrumb-item"
    :class="cn('gap-1 inline-flex items-center', props.class)"
  >
    <slot />
  </li>
</template>
