<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import type { VariantProps } from 'class-variance-authority';
import type { ToolbarToggleGroupEmits, ToolbarToggleGroupProps } from 'reka-ui';
import { ToolbarToggleGroup, useForwardPropsEmits } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { provide } from 'vue';

import type { toggleVariants } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

type ToolbarToggleGroupVariants = VariantProps<typeof toggleVariants> & {
  spacing?: number;
};

const props = withDefaults(
  defineProps<
    ToolbarToggleGroupProps & {
      class?: HTMLAttributes['class'];
      variant?: ToolbarToggleGroupVariants['variant'];
      size?: ToolbarToggleGroupVariants['size'];
      spacing?: number;
    }
  >(),
  {
    spacing: 0,
  },
);

const emits = defineEmits<ToolbarToggleGroupEmits>();

provide('toolbarToggleGroup', {
  variant: props.variant,
  size: props.size,
  spacing: props.spacing,
});

const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant');
const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ToolbarToggleGroup
    v-slot="slotProps"
    data-slot="toolbar-toggle-group"
    :data-size="size"
    :data-variant="variant"
    :data-spacing="spacing"
    :style="{
      '--gap': spacing,
    }"
    v-bind="forwarded"
    :class="
      cn(
        'rounded-none data-[size=sm]:rounded-none group/toolbar-toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] data-vertical:flex-col data-vertical:items-stretch',
        props.class,
      )
    "
  >
    <slot v-bind="slotProps" />
  </ToolbarToggleGroup>
</template>
