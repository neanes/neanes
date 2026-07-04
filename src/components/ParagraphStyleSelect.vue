<template>
  <Select
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="onUpdate"
    @update:open="emit('update:open', $event)"
  >
    <SelectTrigger
      :id="id"
      :class="cn('bg-background', triggerClass)"
      @mousedown="onTriggerMousedown"
    >
      <SelectValue />
    </SelectTrigger>
    <component
      :is="contentComponent"
      @close-auto-focus="onContentCloseAutoFocus"
    >
      <SelectGroup>
        <SelectItem v-if="showNoneOption" :value="PARAGRAPH_STYLE_NONE_VALUE">
          {{ noneLabel }}
        </SelectItem>
        <SelectItem
          v-if="showMixedOption"
          :value="PARAGRAPH_STYLE_MIXED_VALUE"
          disabled
        >
          {{ mixedLabel }}
        </SelectItem>
        <SelectItem
          v-for="style in paragraphStyles"
          :key="style.id"
          :value="style.id"
          :disabled="isStyleDisabled(style.id)"
          :text-value="styleDisplayName(style)"
        >
          {{ styleDisplayName(style) }}
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
  PARAGRAPH_STYLE_MIXED_VALUE,
  PARAGRAPH_STYLE_NONE_VALUE,
} from '@/composables/useRichTextStyleCommands';
import { cn } from '@/lib/utils';
import {
  getParagraphStyleDisplayName,
  type ParagraphStyle,
} from '@/models/ParagraphStyle';

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
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
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
  noneLabel: {
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
const disabledStyleIds = computed(() => new Set(props.disabledStyleIds));
const contentComponent = computed(() =>
  props.richTextPortal ? RichTextSelectContent : SelectContent,
);
const noneLabel = computed(
  () => props.noneLabel ?? t(($) => $.toolbar.common.none, { ns: 'toolbar' }),
);
const mixedLabel = computed(() =>
  t(($) => $.toolbar.common.mixed, { ns: 'toolbar' }),
);

function isStyleDisabled(styleId: string) {
  return disabledStyleIds.value.has(styleId);
}

function styleDisplayName(style: ParagraphStyle) {
  return getParagraphStyleDisplayName(style, t);
}

function onUpdate(value: AcceptableValue) {
  if (typeof value === 'string') {
    emit('update:modelValue', value);
  }
}

// In rich-text mode the selection guard owns focus: keep the editable focused
// when opening, and let the guard (not Reka Select) decide where focus goes on
// close. Elsewhere keep Reka's default behavior for ordinary form controls.
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
</script>
