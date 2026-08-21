<script setup lang="ts">
import { PhCaretLeft } from '@phosphor-icons/vue';
import { reactiveOmit } from '@vueuse/core';
import type { PaginationPrevProps } from 'reka-ui';
import { PaginationPrev, useForwardProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import type { ButtonVariants } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<
    PaginationPrevProps & {
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
  <PaginationPrev
    data-slot="pagination-previous"
    :class="
      cn(buttonVariants({ variant: 'ghost', size }), 'pl-1.5!', props.class)
    "
    v-bind="forwarded"
  >
    <slot>
      <PhCaretLeft data-icon="inline-start" class="cn-rtl-flip" />
      <span class="hidden sm:block">Previous</span>
    </slot>
  </PaginationPrev>
</template>
