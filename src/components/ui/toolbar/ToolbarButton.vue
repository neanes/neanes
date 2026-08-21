<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import type { ToolbarButtonProps } from 'reka-ui';
import { ToolbarButton, useForwardProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import type { ButtonVariants } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const props = withDefaults(
  defineProps<
    ToolbarButtonProps & {
      class?: HTMLAttributes['class'];
      variant?: ButtonVariants['variant'];
      size?: ButtonVariants['size'];
    }
  >(),
  {
    variant: 'ghost',
    size: 'sm',
  },
);

const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant');

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ToolbarButton
    v-slot="slotProps"
    data-slot="toolbar-button"
    :data-variant="variant"
    :data-size="size"
    v-bind="forwardedProps"
    :class="
      cn(buttonVariants({ variant, size }), 'data-vertical:w-full', props.class)
    "
  >
    <slot v-bind="slotProps" />
  </ToolbarButton>
</template>
