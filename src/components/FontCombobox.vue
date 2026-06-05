<template>
  <Combobox
    v-model="selectedValue"
    :disabled="disabled"
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
          <ChevronsUpDown class="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxList :class="listClass">
      <ComboboxInput
        :placeholder="placeholder"
        auto-focus
        :display-value="getDisplayValue"
      />
      <ComboboxEmpty>{{ emptyText }}</ComboboxEmpty>
      <ComboboxViewport>
        <ComboboxGroup>
          <ComboboxItem
            v-for="option in normalizedOptions"
            :key="option.value"
            :value="option.value"
            :text-value="option.label"
          >
            <span class="truncate">{{ option.label }}</span>
            <ComboboxItemIndicator>
              <Check class="size-4" />
            </ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxGroup>
      </ComboboxViewport>
    </ComboboxList>
  </Combobox>
</template>

<script setup lang="ts">
import { Check, ChevronsUpDown } from '@lucide/vue';
import type { HTMLAttributes, PropType } from 'vue';
import { computed } from 'vue';

import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxList,
  ComboboxTrigger,
  ComboboxViewport,
} from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

export type FontComboboxOption = string | { label: string; value: string };

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

const normalizedOptions = computed(() =>
  props.options.map((option) =>
    typeof option === 'string'
      ? { label: option, value: option }
      : { label: option.label, value: option.value },
  ),
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
  return (
    normalizedOptions.value.find((option) => option.value === value)?.label ??
    value
  );
}
</script>
