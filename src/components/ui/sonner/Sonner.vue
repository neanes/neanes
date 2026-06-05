<script lang="ts" setup>
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from '@lucide/vue';
import { computed } from 'vue';
import type { ToasterProps } from 'vue-sonner';
import { Toaster as Sonner } from 'vue-sonner';

import { cn } from '@/lib/utils';

const props = defineProps<ToasterProps>();

const forwardedProps = computed(() => {
  const rest: Partial<ToasterProps> = { ...props };

  delete rest.class;
  delete rest.style;
  delete rest.toastOptions;

  return rest;
});

const defaultStyle = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
  '--border-radius': 'var(--radius)',
  '--gray2': 'hsl(var(--popover) / 0.9)',
  '--gray3': 'var(--border)',
  '--gray4': 'var(--border)',
  '--gray5': 'var(--border)',
  '--gray12': 'var(--popover-foreground)',
};

const toasterStyle = computed(() => ({
  ...defaultStyle,
  ...props.style,
}));

const toastOptions = computed<ToasterProps['toastOptions']>(() => ({
  ...props.toastOptions,
  classes: {
    ...props.toastOptions?.classes,
    toast: cn('rounded-none', props.toastOptions?.classes?.toast),
  },
}));
</script>

<template>
  <Sonner
    v-bind="forwardedProps"
    :class="cn('toaster group', props.class)"
    :style="toasterStyle"
    :toast-options="toastOptions"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>
