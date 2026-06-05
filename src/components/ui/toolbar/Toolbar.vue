<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import type { ToolbarRootProps } from 'reka-ui';
import { ToolbarRoot, useForwardProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<
  ToolbarRootProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ToolbarRoot
    v-slot="slotProps"
    data-slot="toolbar"
    v-bind="forwardedProps"
    :class="
      cn(
        'flex h-8 w-fit items-center gap-0.5 rounded-none border p-1 data-vertical:h-fit data-vertical:flex-col data-vertical:items-stretch',
        props.class,
      )
    "
  >
    <slot v-bind="slotProps" />
  </ToolbarRoot>
</template>
