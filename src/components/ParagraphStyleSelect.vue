<template>
  <Select
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="onUpdate"
    @update:open="emit('update:open', $event)"
  >
    <SelectTrigger :id="id" :class="cn('bg-background', triggerClass)">
      <SelectValue />
    </SelectTrigger>
    <component :is="contentComponent">
      <SelectGroup>
        <SelectItem v-if="showNoneOption" :value="noneValue">
          {{ noneLabel }}
        </SelectItem>
        <SelectItem v-if="showMixedOption" :value="mixedValue" disabled>
          {{ mixedLabel }}
        </SelectItem>
        <SelectItem
          v-for="style in textStyles"
          :key="style.id"
          :value="style.id"
          :disabled="isStyleDisabled(style.id)"
          :text-value="style.displayName"
        >
          {{ style.displayName }}
        </SelectItem>
      </SelectGroup>
    </component>
  </Select>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import {
  TEXT_STYLE_MIXED_VALUE,
  TEXT_STYLE_NONE_VALUE,
} from '@/composables/useRichTextStyleCommands';
import { cn } from '@/lib/utils';
import type { TextStyle } from '@/models/TextStyle';

import RichTextSelectContent from './RichTextSelectContent.vue';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const props = defineProps({
  id: {
    type: String,
    default: undefined,
  },
  modelValue: {
    type: String,
    required: true,
  },
  textStyles: {
    type: Array as PropType<TextStyle[]>,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  disabledStyleIds: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  showNoneOption: {
    type: Boolean,
    default: false,
  },
  showMixedOption: {
    type: Boolean,
    default: false,
  },
  noneValue: {
    type: String,
    default: TEXT_STYLE_NONE_VALUE,
  },
  mixedValue: {
    type: String,
    default: TEXT_STYLE_MIXED_VALUE,
  },
  noneLabel: {
    type: String,
    default: undefined,
  },
  mixedLabel: {
    type: String,
    default: undefined,
  },
  richTextPortal: {
    type: Boolean,
    default: false,
  },
  triggerClass: {
    type: String,
    default: 'w-full',
  },
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();
const textStyles = computed(() => props.textStyles);
const disabledStyleIds = computed(() => new Set(props.disabledStyleIds));
const contentComponent = computed(() =>
  props.richTextPortal ? RichTextSelectContent : SelectContent,
);
const noneLabel = computed(
  () => props.noneLabel ?? t(($) => $.toolbar.common.none, { ns: 'toolbar' }),
);
const mixedLabel = computed(
  () => props.mixedLabel ?? t(($) => $.toolbar.common.mixed, { ns: 'toolbar' }),
);

function isStyleDisabled(styleId: string) {
  return disabledStyleIds.value.has(styleId);
}

function onUpdate(value: AcceptableValue) {
  if (typeof value === 'string') {
    emit('update:modelValue', value);
  }
}
</script>
