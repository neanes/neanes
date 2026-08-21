<script setup lang="ts">
import { PhSidebarSimple } from '@phosphor-icons/vue';
import type { HTMLAttributes } from 'vue';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useSidebar } from './utils';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const { toggleSidebar } = useSidebar();
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon-sm"
    :class="cn('', props.class)"
    @click="toggleSidebar"
  >
    <PhSidebarSimple class="cn-rtl-flip" />
    <span class="sr-only">Toggle Sidebar</span>
  </Button>
</template>
