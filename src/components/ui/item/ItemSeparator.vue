<script setup lang="ts">
import { cn } from 'cn';
import type { SeparatorProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

import { Separator } from '@/components/ui/separator';

const props = defineProps<
  SeparatorProps & { class?: HTMLAttributes['class'] }
>();
</script>

<template>
  <Separator
    data-slot="item-separator"
    orientation="horizontal"
    :class="cn('my-2', props.class)"
  />
</template>
