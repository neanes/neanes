<template>
  <Select v-model="selectedValue" v-model:open="open" :disabled="disabled">
    <SelectTrigger
      :id="id"
      :class="cn('bg-background', props.class)"
      @mousedown="onTriggerMousedown"
    >
      <SelectValue :placeholder="placeholder" />
    </SelectTrigger>
    <component
      :is="richTextPortal ? RichTextSelectContent : SelectContent"
      :class="contentClass"
      @close-auto-focus="onContentCloseAutoFocus"
    >
      <SelectGroup>
        <SelectItem
          v-for="option in displayOptions"
          :key="`${fontFamily}\0${option.value}\0${option.label}`"
          :value="option.value"
          :text-value="option.label"
        >
          {{ option.label }}
        </SelectItem>
      </SelectGroup>
    </component>
  </Select>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import type { HTMLAttributes, PropType } from 'vue';
import { computed } from 'vue';

import RichTextSelectContent from '@/components/RichTextSelectContent.vue';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { fontCatalog } from '@/services/FontCatalog';

const props = defineProps({
  options: {
    type: Array as PropType<string[]>,
    required: true,
  },
  fontFamily: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: 'Style',
  },
  id: {
    type: String,
    default: undefined,
  },
  class: {
    type: [String, Array, Object] as PropType<HTMLAttributes['class']>,
    default: undefined,
  },
  contentClass: {
    type: [String, Array, Object] as PropType<HTMLAttributes['class']>,
    default: undefined,
  },
  richTextPortal: {
    type: Boolean,
    default: false,
  },
});

const selectedValue = defineModel<string>({ required: true });
const open = defineModel<boolean>('open', { default: false });
const { t } = useTranslation();

const displayOptions = computed(() =>
  props.options.map((value) => ({ value, label: optionLabel(value) })),
);

function optionLabel(option: string) {
  const resolved = fontCatalog.resolveSelectableStyle(props.fontFamily, option);
  const syntheticAxes: string[] = [];

  if (resolved.syntheticBold) {
    syntheticAxes.push(
      t(($) => $.dialog.pageSetup.syntheticBold, { ns: 'dialog' }),
    );
  }

  if (resolved.syntheticItalic) {
    syntheticAxes.push(
      t(($) => $.dialog.pageSetup.syntheticItalic, { ns: 'dialog' }),
    );
  }

  return syntheticAxes.length === 0
    ? resolved.baseStyle
    : `${resolved.baseStyle} (${syntheticAxes.join(' ')})`;
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
