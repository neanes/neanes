<template>
  <Popover :open="isOpen" @update:open="onOpenChange">
    <PopoverTrigger as-child>
      <Button
        v-bind="$attrs"
        type="button"
        variant="outline"
        :aria-label="$t(($) => $.toolbar.common.chooseColor, { ns: 'toolbar' })"
        class="h-6 w-[46px] rounded-[1px] bg-background p-[5px] hover:bg-background"
      >
        <span class="block size-full rounded-sm" :style="colorStyle" />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      class="w-auto border-0 bg-transparent p-0 shadow-none"
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
    </PopoverContent>
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
import { computed, ref, watch } from 'vue';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

defineOptions({ inheritAttrs: false });

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  historyKey: {
    type: String,
    default: 'colorPicker_presetColors',
  },
});

const isOpen = ref(false);
const presetColors = ref<string[]>([]);
const maxHistorySize = 8;
const color = ref(props.modelValue);

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

function onOpenChange(open: boolean) {
  if (open) {
    presetColors.value = getPresetColors();
    isOpen.value = true;
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
}

function getPresetColors() {
  const defaultColors = ['#000000', '#800000', '#FF0000'];
  const savedColors = localStorage.getItem(props.historyKey);

  if (!savedColors) {
    return defaultColors;
  }

  try {
    const parsedColors = JSON.parse(savedColors);
    return Array.isArray(parsedColors) ? parsedColors : defaultColors;
  } catch {
    return defaultColors;
  }
}
</script>
