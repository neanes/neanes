<template>
  <Popover :open="isOpen" @update:open="onOpenChange">
    <PopoverTrigger as-child>
      <Button
        type="button"
        variant="secondary"
        :disabled="disabled"
        :aria-label="label"
        class="chrome-button color-picker-trigger"
      >
        <span
          class="relative block size-full overflow-hidden rounded-sm"
          :style="swatchStyle"
        >
          <span
            v-if="sameAsText"
            class="absolute inset-[2px] rounded-[1px] border border-dashed border-foreground/40"
          />
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" class="chrome-menu w-auto p-0">
      <ColorPickerRoot
        v-model="pickerColor"
        class="chrome-color-picker"
        :ui="pickerUi"
        format="hex"
        :disabled="pickerDisabled"
      >
        <div class="space-y-2">
          <div class="flex items-center gap-2 px-2.5">
            <Checkbox
              :id="sameAsTextCheckboxId"
              :model-value="sameAsText"
              :disabled="sameAsTextDisabled"
              @update:model-value="onSameAsTextChanged"
            />
            <label
              :for="sameAsTextCheckboxId"
              class="text-xs text-popover-foreground"
              :class="sameAsTextDisabled ? 'opacity-50' : ''"
            >
              {{ sameAsTextLabel }}
            </label>
          </div>

          <div class="h-px chrome-separator" />

          <div
            class="space-y-2 px-2.5"
            :class="pickerDisabled ? 'pointer-events-none opacity-50' : ''"
          >
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
          </div>
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
import type { PropType } from 'vue';
import { computed, ref, useId, watch } from 'vue';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  previewColor: {
    type: String,
    required: true,
  },
  textColor: {
    type: String,
    required: true,
  },
  sameAsText: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    required: true,
  },
  sameAsTextLabel: {
    type: String,
    required: true,
  },
  historyKey: {
    type: String,
    default: 'colorPicker_presetColors',
  },
  defaultColors: {
    type: Array as PropType<string[]>,
    default: () => ['#000000', '#800000', '#FF0000'],
  },
});

const isOpen = ref(false);
const presetColors = ref<string[]>([]);
const maxHistorySize = 8;
const pickerColor = ref(props.previewColor);
const shouldCommitOnClose = ref(true);
const sameAsTextCheckboxId = useId();

const pickerDisabled = computed(() => props.disabled || props.sameAsText);

const sameAsTextDisabled = computed(() => props.disabled);

const pickerUi = {
  input: {
    group: 'chrome-color-picker-input-group',
    item: 'chrome-color-picker-input-item',
    label: 'chrome-color-picker-input-label',
    field: 'chrome-color-picker-input-field',
  },
  swatch: {
    root: 'vuelor-picker-swatch-root',
  },
};

const swatchStyle = computed(() => ({
  backgroundColor: props.previewColor,
}));

watch(
  () => props.previewColor,
  (newValue) => {
    pickerColor.value = newValue;
  },
);

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) {
      isOpen.value = false;
    }
  },
);

function onOpenChange(open: boolean) {
  if (open) {
    shouldCommitOnClose.value = true;
    presetColors.value = getPresetColors();
    pickerColor.value = props.previewColor;
    isOpen.value = true;
    return;
  }

  if (!shouldCommitOnClose.value) {
    shouldCommitOnClose.value = true;
    isOpen.value = false;
    return;
  }

  commitColor();
}

function commitColor() {
  isOpen.value = false;

  if (!pickerDisabled.value && pickerColor.value !== props.previewColor) {
    const index = presetColors.value.indexOf(pickerColor.value);

    if (index >= 0) {
      presetColors.value.splice(index, 1);
    }

    presetColors.value.unshift(pickerColor.value);
    presetColors.value = presetColors.value.slice(0, maxHistorySize);
    localStorage.setItem(props.historyKey, JSON.stringify(presetColors.value));

    emit('update:modelValue', pickerColor.value);
  }
}

function onSameAsTextChanged(value: boolean | 'indeterminate') {
  if (value === true) {
    pickerColor.value = props.textColor;
    emit('update:modelValue', 'currentcolor');
    return;
  }

  if (props.sameAsText) {
    pickerColor.value = props.textColor;
    emit('update:modelValue', props.textColor);
  }
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
