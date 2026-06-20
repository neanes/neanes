<script lang="ts" setup>
import { PhCaretRight } from '@phosphor-icons/vue';
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <li
    data-slot="breadcrumb-separator"
    role="presentation"
    aria-hidden="true"
    :class="cn('[&>svg]:size-3.5', props.class)"
  >
    <slot>
      <PhCaretRight class="cn-rtl-flip" />
    </slot>
  </li>
</template>
