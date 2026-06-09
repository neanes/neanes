<script lang="ts" setup>
import {
  PhCheckCircle,
  PhCircleNotch,
  PhInfo,
  PhWarning,
  PhX,
  PhXCircle,
} from '@phosphor-icons/vue';
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
      <PhCheckCircle class="size-4" />
    </template>
    <template #info-icon>
      <PhInfo class="size-4" />
    </template>
    <template #warning-icon>
      <PhWarning class="size-4" />
    </template>
    <template #error-icon>
      <PhXCircle class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <PhCircleNotch class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <PhX class="size-4" />
    </template>
  </Sonner>
</template>
