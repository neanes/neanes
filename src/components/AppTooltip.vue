<script setup lang="ts">
import { computed } from 'vue';

import { Kbd, KbdGroup } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { AppTooltipValue } from './AppTooltip.types';

const props = defineProps<{
  tooltip?: AppTooltipValue;
}>();

const shortcutKeyGlyphs: Record<string, string> = {
  alt: '⌥',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  arrowup: '↑',
  backspace: '⌫',
  capslock: '⇪',
  cmd: '⌘',
  command: '⌘',
  control: '⌃',
  ctrl: '⌃',
  delete: '⌦',
  del: '⌦',
  down: '↓',
  enter: '↵',
  esc: '⎋',
  escape: '⎋',
  left: '←',
  meta: '⌘',
  option: '⌥',
  return: '↵',
  right: '→',
  shift: '⇧',
  tab: '⇥',
  up: '↑',
};

const tooltipDetails = computed(() => {
  const tooltip = props.tooltip;

  if (tooltip == null) {
    return undefined;
  }

  const label = typeof tooltip === 'string' ? tooltip : tooltip.label;
  const shortcutKeys =
    typeof tooltip === 'string' ? [] : (tooltip.shortcut ?? []);
  const shortcut = shortcutKeys.join(' + ');

  return {
    label,
    shortcutDisplayKeys: shortcutKeys.map((key) =>
      getShortcutKeyDisplayText(key),
    ),
    ariaLabel: shortcut ? `${label} (${shortcut})` : label,
  };
});

function getShortcutKeyDisplayText(key: string) {
  return shortcutKeyGlyphs[key.replace(/\s+/g, '').toLowerCase()] ?? key;
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
      <slot v-bind="{ ariaLabel: tooltipDetails?.ariaLabel }" />
    </TooltipTrigger>
    <TooltipContent
      v-if="tooltipDetails"
      class="inline-block text-left whitespace-normal"
    >
      <span>{{ tooltipDetails.label }}</span>
      <span v-if="tooltipDetails.shortcutDisplayKeys.length > 0" class="ml-1">
        <span>(</span>
        <KbdGroup>
          <template
            v-for="(key, index) in tooltipDetails.shortcutDisplayKeys"
            :key="index"
          >
            <span v-if="index > 0">+</span>
            <Kbd>{{ key }}</Kbd>
          </template>
        </KbdGroup>
        <span>)</span>
      </span>
    </TooltipContent>
  </Tooltip>
</template>
