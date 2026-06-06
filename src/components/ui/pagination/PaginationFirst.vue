<script setup lang="ts">
import { PhCaretDoubleLeft } from '@phosphor-icons/vue';
import { reactiveOmit } from '@vueuse/core';
import type { PaginationFirstProps } from 'reka-ui';
import { PaginationFirst, useForwardProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import type { ButtonVariants } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<
    PaginationFirstProps & {
      size?: ButtonVariants['size'];
      class?: HTMLAttributes['class'];
    }
  >(),
  {
    size: 'default',
  },
);

const delegatedProps = reactiveOmit(props, 'class', 'size');
const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <PaginationFirst
    data-slot="pagination-first"
    :class="cn(buttonVariants({ variant: 'ghost', size }), '', props.class)"
    v-bind="forwarded"
  >
    <slot>
      <PhCaretDoubleLeft data-icon="inline-start" />
      <span class="hidden sm:block">First</span>
    </slot>
  </PaginationFirst>
</template>
