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
        <SelectItem v-for="option in options" :key="option" :value="option">
          {{ option }}
        </SelectItem>
      </SelectGroup>
    </component>
  </Select>
</template>

<script setup lang="ts">
import type { HTMLAttributes, PropType } from 'vue';

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

const props = defineProps({
  options: {
    type: Array as PropType<string[]>,
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
