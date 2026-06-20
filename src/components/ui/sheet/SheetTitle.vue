<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import type { DialogTitleProps } from 'reka-ui';
import { DialogTitle } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { cn } from '@/lib/utils';

const props = defineProps<
  DialogTitleProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <DialogTitle
    data-slot="sheet-title"
    :class="
      cn('text-foreground text-sm font-medium cn-font-heading', props.class)
    "
    v-bind="delegatedProps"
  >
    <slot />
  </DialogTitle>
</template>
