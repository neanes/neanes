<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import { cn } from 'cn';
import type { TabsContentProps } from 'reka-ui';
import { TabsContent } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  TabsContentProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <TabsContent
    data-slot="tabs-content"
    :class="cn('text-xs/relaxed flex-1 outline-none', props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </TabsContent>
</template>
