<script setup lang="ts">
import { computed } from 'vue';

import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { AppTooltipValue } from './AppTooltip.types';
import { getShortcutKeyDisplayText } from './AppTooltip.utils';

const props = defineProps<{
  tooltip?: AppTooltipValue;
}>();

const label = computed(() =>
  props.tooltip == null
    ? undefined
    : typeof props.tooltip === 'string'
      ? props.tooltip
      : props.tooltip.label,
);

const shortcutKeys = computed(() => {
  if (typeof props.tooltip === 'string' || props.tooltip?.shortcut == null) {
    return [];
  }

  return props.tooltip.shortcut;
});

const shortcutDisplayKeys = computed(() =>
  shortcutKeys.value.map((key) => getShortcutKeyDisplayText(key)),
);

const ariaLabel = computed(() =>
  props.tooltip ? getAppTooltipAriaLabel(props.tooltip) : undefined,
);

function getAppTooltipAriaLabel(tooltip: AppTooltipValue) {
  if (typeof tooltip === 'string') {
    return tooltip;
  }

  const shortcut = tooltip.shortcut?.join(' + ');

  return shortcut ? `${tooltip.label} (${shortcut})` : tooltip.label;
}
</script>

<template>
  <Tooltip :disabled="!tooltip">
    <TooltipTrigger as-child>
      <!--
        The default slot must have exactly one root element: it is forwarded to
        TooltipTrigger via as-child, which merges trigger props/behavior onto the
        first element only. Bind the provided ariaLabel to the appropriate
        element so the visible tooltip text and aria-label stay in sync.
      -->
      <slot v-bind="{ ariaLabel }" />
    </TooltipTrigger>
    <TooltipContent
      v-if="tooltip"
      class="inline-block text-left whitespace-normal"
    >
      <span>{{ label }}</span>
      <span v-if="shortcutDisplayKeys.length > 0" class="ml-1">
        <span>(</span>
        <KbdGroup>
          <template v-for="(key, index) in shortcutDisplayKeys" :key="index">
            <span v-if="index > 0">+</span>
            <Kbd>{{ key }}</Kbd>
          </template>
        </KbdGroup>
        <span>)</span>
      </span>
    </TooltipContent>
  </Tooltip>
</template>
