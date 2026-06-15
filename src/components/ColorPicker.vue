<template>
  <Popover :open="isOpen" @update:open="onOpenChange">
    <PopoverTrigger as-child>
      <Button
        v-bind="$attrs"
        type="button"
        variant="outline"
        :aria-label="$t(($) => $.toolbar.common.chooseColor, { ns: 'toolbar' })"
        class="h-6 w-[46px] rounded-[1px] bg-background p-[5px] hover:bg-background"
        @mousedown="onTriggerMousedown"
      >
        <span class="block size-full rounded-sm" :style="colorStyle" />
      </Button>
    </PopoverTrigger>
    <component
      :is="popoverContentComponent"
      align="start"
      class="w-auto border-0 bg-transparent p-0 shadow-none"
      @close-auto-focus="onContentCloseAutoFocus"
    >
      <ColorPickerRoot v-model="color" format="hex">
        <ColorPickerCanvas />
        <ColorPickerSliderHue />
        <ColorPickerInputHex />
        <div class="flex flex-wrap gap-1">
          <ColorPickerSwatch
            v-for="preset in presetColors"
            :key="preset"
            :value="preset"
          />
        </div>
      </ColorPickerRoot>
    </component>
  </Popover>
</template>

<script setup lang="ts">
import {
  ColorPickerCanvas,
  ColorPickerInputHex,
  ColorPickerRoot,
  ColorPickerSliderHue,
  ColorPickerSwatch,
} from '@vuelor/picker';
import type { PropType } from 'vue';
import { computed, ref, watch } from 'vue';

import RichTextPopoverContent from '@/components/RichTextPopoverContent.vue';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

defineOptions({ inheritAttrs: false });

const emit = defineEmits(['update:modelValue', 'update:open']);
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  historyKey: {
    type: String,
    default: 'colorPicker_presetColors',
  },
  richTextPortal: {
    type: Boolean,
    default: false,
  },
  defaultColors: {
    type: Array as PropType<string[]>,
    default: () => ['#000000', '#800000', '#FF0000'],
  },
});

const isOpen = ref(false);
const presetColors = ref<string[]>([]);
const maxHistorySize = 8;
const color = ref(props.modelValue);

const popoverContentComponent = computed(() =>
  props.richTextPortal ? RichTextPopoverContent : PopoverContent,
);

const colorStyle = computed(() => {
  return {
    backgroundColor: color.value,
  };
});

watch(
  () => props.modelValue,
  (newValue) => {
    color.value = newValue;
  },
);

// In rich-text mode the selection guard owns focus: keep the editable focused
// when opening, and let the guard (not Reka) decide where focus goes on close.
// Elsewhere keep Reka's default behavior so dialogs stay keyboard-accessible.
function onTriggerMousedown(event: MouseEvent) {
  if (props.richTextPortal) {
    event.preventDefault();
  }
}

function onContentCloseAutoFocus(event: Event) {
  if (props.richTextPortal) {
    event.preventDefault();
  }
}

function onOpenChange(open: boolean) {
  if (open) {
    presetColors.value = getPresetColors();
    isOpen.value = true;
    emit('update:open', true);
    return;
  }

  commitColor();
}

function commitColor() {
  const index = presetColors.value.indexOf(color.value);

  if (index >= 0) {
    presetColors.value.splice(index, 1);
  }

  presetColors.value.unshift(color.value);
  presetColors.value = presetColors.value.slice(0, maxHistorySize);
  localStorage.setItem(props.historyKey, JSON.stringify(presetColors.value));

  isOpen.value = false;

  if (color.value !== props.modelValue) {
    emit('update:modelValue', color.value);
  }

  emit('update:open', false);
}

function getPresetColors() {
  const defaultColors = normalizePresetColors(props.defaultColors);
  const savedColors = localStorage.getItem(props.historyKey);

  if (!savedColors) {
    return defaultColors;
  }

  try {
    const parsedColors = JSON.parse(savedColors);
    return Array.isArray(parsedColors)
      ? mergePresetColors(parsedColors, defaultColors)
      : defaultColors;
  } catch {
    return defaultColors;
  }
}

function normalizePresetColors(colors: unknown[]) {
  return colors.filter((color): color is string => typeof color === 'string');
}

function mergePresetColors(savedColors: unknown[], defaultColors: string[]) {
  return Array.from(
    new Set([...normalizePresetColors(savedColors), ...defaultColors]),
  ).slice(0, maxHistorySize);
}
</script>
