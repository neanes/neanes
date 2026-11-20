<template>
  <Select
    :model-value="selectValue"
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
      <SelectItem :value="DOCUMENT_DEFAULT_VALUE">
        {{
          $t(($) => $.dialog.initialMartyriaStyles.documentDefaultNamed, {
            ns: 'dialog',
            name: getInitialMartyriaStyleDisplayName(defaultStyle, t),
          })
        }}
      </SelectItem>
      <SelectSeparator />
      <SelectItem
        v-for="style in initialMartyriaStyles"
        :key="style.id"
        :value="style.id"
      >
        {{ getInitialMartyriaStyleDisplayName(style, t) }}
      </SelectItem>
    </component>
  </Select>
</template>

<script setup lang="ts">
import { cn } from 'cn';
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import RichTextSelectContent from '@/components/RichTextSelectContent.vue';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getInitialMartyriaStyleDisplayName,
  getInitialMartyriaStyleOrDefault,
} from '@/models/InitialMartyriaBuiltInStyles';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';

const props = defineProps({
  id: {
    type: String,
    default: undefined,
  },
  /** The element's own style; null follows the score's style. */
  modelValue: {
    type: String as PropType<string | null>,
    default: null,
  },
  /** The score's own styles. */
  initialMartyriaStyles: {
    type: Array as PropType<InitialMartyriaStyle[]>,
    required: true,
  },
  /** The score's default style, which a mode key without a style follows. */
  defaultStyleId: {
    type: String,
    required: true,
  },
  triggerClass: {
    type: String,
    default: 'w-full',
  },
  richTextPortal: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'update:open': [value: boolean];
}>();

const { t } = useTranslation();

const DOCUMENT_DEFAULT_VALUE = '__document-default__';

const selectValue = computed(() => props.modelValue ?? DOCUMENT_DEFAULT_VALUE);
const contentComponent = computed(() =>
  props.richTextPortal ? RichTextSelectContent : SelectContent,
);

// Built-in styles are presets in the styles dialog, not styles a mode key
// can name, so only the score's own styles are offered.
const defaultStyle = computed(() =>
  getInitialMartyriaStyleOrDefault(
    props.initialMartyriaStyles,
    props.defaultStyleId,
  ),
);

function onUpdate(value: AcceptableValue) {
  if (typeof value === 'string') {
    emit('update:modelValue', value === DOCUMENT_DEFAULT_VALUE ? null : value);
  }
}

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
