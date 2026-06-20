<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import type { VariantProps } from 'class-variance-authority';
import type { ToolbarToggleItemProps } from 'reka-ui';
import { ToolbarToggleItem, useForwardProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { inject } from 'vue';

import { toggleVariants } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

type ToolbarToggleGroupVariants = VariantProps<typeof toggleVariants> & {
  spacing?: number;
};

const props = defineProps<
  ToolbarToggleItemProps & {
    class?: HTMLAttributes['class'];
    variant?: ToolbarToggleGroupVariants['variant'];
    size?: ToolbarToggleGroupVariants['size'];
  }
>();

const context = inject<ToolbarToggleGroupVariants>('toolbarToggleGroup');

const delegatedProps = reactiveOmit(props, 'class', 'size', 'variant');
const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <ToolbarToggleItem
    v-slot="slotProps"
    data-slot="toolbar-toggle-item"
    :data-variant="context?.variant || variant"
    :data-size="context?.size || size"
    :data-spacing="context?.spacing"
    v-bind="forwardedProps"
    :class="
      cn(
        'group-data-[spacing=0]/toolbar-toggle-group:rounded-none group-data-[spacing=0]/toolbar-toggle-group:px-2 group-data-[spacing=0]/toolbar-toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toolbar-toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-horizontal/toolbar-toggle-group:data-[spacing=0]:first:rounded-none group-data-vertical/toolbar-toggle-group:data-[spacing=0]:first:rounded-none group-data-horizontal/toolbar-toggle-group:data-[spacing=0]:last:rounded-none group-data-vertical/toolbar-toggle-group:data-[spacing=0]:last:rounded-none shrink-0 focus:z-10 focus-visible:z-10 group-data-horizontal/toolbar-toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toolbar-toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toolbar-toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toolbar-toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t',
        toggleVariants({
          variant: context?.variant || variant,
          size: context?.size || size,
        }),
        props.class,
      )
    "
  >
    <slot v-bind="slotProps" />
  </ToolbarToggleItem>
</template>
