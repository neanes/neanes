<script lang="ts" setup>
import { PhDotsThree } from '@phosphor-icons/vue';
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <span
    data-slot="breadcrumb-ellipsis"
    role="presentation"
    aria-hidden="true"
    :class="
      cn('size-5 [&>svg]:size-4 flex items-center justify-center', props.class)
    "
  >
    <slot>
      <PhDotsThree />
    </slot>
    <span class="sr-only">More</span>
  </span>
</template>
