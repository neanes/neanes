<template>
  <Combobox
    v-model="selectedValue"
    v-model:open="open"
    :disabled="disabled"
    ignore-filter
    reset-search-term-on-select
    open-on-click
    open-on-focus
  >
    <ComboboxAnchor :class="anchorClass">
      <ComboboxTrigger as-child>
        <Button
          :id="id"
          type="button"
          variant="outline"
          :disabled="disabled"
          :class="triggerClass"
        >
          <span class="truncate">{{ selectedLabel }}</span>
          <PhCaretUpDown class="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxList :class="listClass">
      <ComboboxInput
        v-model="searchTerm"
        :placeholder="placeholder"
        auto-focus
        :display-value="getDisplayValue"
      />
      <div
        v-if="filteredOptions.length === 0"
        class="text-muted-foreground flex w-full justify-center py-2 text-center text-xs"
      >
        {{ emptyText }}
      </div>
      <ComboboxViewport v-else>
        <ComboboxVirtualizer
          v-slot="{ option }"
          :options="filteredOptionValues"
          :estimate-size="32"
          :overscan="8"
          :text-content="getDisplayValue"
        >
          <ComboboxItem
            :key="option"
            :value="option"
            :text-value="getDisplayValue(option)"
          >
            <span
              class="truncate"
              :style="{ fontFamily: getOptionFontFamily(option) }"
            >
              {{ getDisplayValue(option) }}
            </span>
            <ComboboxItemIndicator>
              <PhCheck class="size-4" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxVirtualizer>
      </ComboboxViewport>
    </ComboboxList>
  </Combobox>
</template>

<script setup lang="ts">
import { PhCaretUpDown, PhCheck } from '@phosphor-icons/vue';
import type { HTMLAttributes, PropType } from 'vue';
import { computed, ref, watch } from 'vue';

import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxAnchor,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
  ComboboxViewport,
  ComboboxVirtualizer,
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

export type FontComboboxOption = string | { label: string; value: string };

type NormalizedFontComboboxOption = {
  label: string;
  value: string;
  fontFamily: string;
  searchText: string;
};

const props = defineProps({
  id: {
    type: String,
    default: undefined,
  },
  options: {
    type: Array as PropType<FontComboboxOption[]>,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: 'Search fonts...',
  },
  emptyText: {
    type: String,
    default: 'No fonts found.',
  },
  class: {
    type: [String, Array, Object] as PropType<HTMLAttributes['class']>,
    default: undefined,
  },
  triggerClass: {
    type: [String, Array, Object] as PropType<HTMLAttributes['class']>,
    default: undefined,
  },
  listClass: {
    type: [String, Array, Object] as PropType<HTMLAttributes['class']>,
    default: undefined,
  },
});

const selectedValue = defineModel<string>({ required: true });
const open = ref(false);
const searchTerm = ref('');

watch(open, (isOpen) => {
  if (isOpen) {
    searchTerm.value = '';
  }
});

const normalizedOptions = computed<NormalizedFontComboboxOption[]>(() =>
  props.options.map((option) => {
    const normalized =
      typeof option === 'string'
        ? { label: option, value: option }
        : { label: option.label, value: option.value };

    return {
      ...normalized,
      fontFamily: createFontFamily(normalized.value),
      searchText: `${normalized.label} ${normalized.value}`.toLowerCase(),
    };
  }),
);

const filteredOptions = computed(() => {
  const query = searchTerm.value.trim().toLowerCase();

  if (query === '') {
    return normalizedOptions.value;
  }

  return normalizedOptions.value.filter((option) =>
    option.searchText.includes(query),
  );
});

const filteredOptionValues = computed(() =>
  filteredOptions.value.map((option) => option.value),
);

const optionByValue = computed(
  () =>
    new Map(normalizedOptions.value.map((option) => [option.value, option])),
);

const selectedLabel = computed(
  () =>
    normalizedOptions.value.find(
      (option) => option.value === selectedValue.value,
    )?.label ?? selectedValue.value,
);

const anchorClass = computed(() => cn('w-72', props.class));

const triggerClass = computed(() =>
  cn('w-full justify-between bg-background', props.triggerClass),
);

const listClass = computed(() => cn(props.listClass));

function getDisplayValue(value: string) {
  return optionByValue.value.get(value)?.label ?? value;
}

function getOptionFontFamily(value: string) {
  return optionByValue.value.get(value)!.fontFamily;
}

function createFontFamily(value: string) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}", sans-serif`;
}
</script>
