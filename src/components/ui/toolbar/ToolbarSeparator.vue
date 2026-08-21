<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import type { ToolbarSeparatorProps } from 'reka-ui';
import { ToolbarSeparator, useForwardProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<
  ToolbarSeparatorProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ToolbarSeparator
    data-slot="toolbar-separator"
    v-bind="forwardedProps"
    :class="
      cn(
        'bg-border shrink-0 data-horizontal:mx-1 data-horizontal:h-4 data-horizontal:w-px data-vertical:my-1 data-vertical:h-px data-vertical:w-full',
        props.class,
      )
    "
  />
</template>
