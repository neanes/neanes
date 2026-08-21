<script setup lang="ts">
import { PhDotsThree } from '@phosphor-icons/vue';
import { reactiveOmit } from '@vueuse/core';
import type { PaginationEllipsisProps } from 'reka-ui';
import { PaginationEllipsis } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<
  PaginationEllipsisProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <PaginationEllipsis
    data-slot="pagination-ellipsis"
    v-bind="delegatedProps"
    :class="
      cn(
        'size-8 [&_svg:not([class*=size-])]:size-4 flex items-center justify-center',
        props.class,
      )
    "
  >
    <slot>
      <PhDotsThree />
      <span class="sr-only">More pages</span>
    </slot>
  </PaginationEllipsis>
</template>
