<template>
  <Field>
    <div class="mb-2 flex items-center justify-between gap-2">
      <FieldLabel :for="id">{{
        $t(($) => $.toolbar.common.paragraphStyle, { ns: 'toolbar' })
      }}</FieldLabel>
      <div class="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          @click="$emit('open-dialog')"
        >
          <PhTextAa />
          {{ $t(($) => $.dialog.paragraphStyles.openDialog, { ns: 'dialog' }) }}
        </Button>
        <ParagraphStyleClearButton
          :disabled="!hasOverrides"
          @clear="$emit('clear')"
        />
      </div>
    </div>
    <ParagraphStyleSelect
      :id="id"
      :model-value="modelValue"
      :paragraph-styles="paragraphStyles"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </Field>
</template>

<script setup lang="ts">
import { PhTextAa } from '@phosphor-icons/vue';
import type { PropType } from 'vue';

import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import type { ParagraphStyle } from '@/models/ParagraphStyle';

defineProps({
  id: {
    type: String,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    required: true,
  },
  hasOverrides: {
    type: Boolean,
    required: true,
  },
});

defineEmits<{
  'update:modelValue': [value: string];
  clear: [];
  'open-dialog': [];
}>();
</script>
