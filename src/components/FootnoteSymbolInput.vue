<template>
  <div>
    <div class="flex items-center gap-1">
      <Input
        :id="id"
        v-model="text"
        class="w-28"
        autocomplete="off"
        role="spinbutton"
        :aria-valuemin="1"
        :aria-valuemax="maximum"
        :aria-valuenow="position ?? undefined"
        :aria-valuetext="text"
        :aria-invalid="position === null"
        :aria-describedby="position === null ? `${id}-error` : undefined"
        @keydown.up.prevent="step(1)"
        @keydown.down.prevent="step(-1)"
      />
      <div class="flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="h-5 w-6"
          :aria-label="
            $t(($) => $.dialog.pageSetup.nextFootnoteSymbol, { ns: 'dialog' })
          "
          :disabled="position === maximum"
          @click="step(1)"
          ><PhCaretUp
        /></Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="h-5 w-6"
          :disabled="position === 1"
          :aria-label="
            $t(($) => $.dialog.pageSetup.previousFootnoteSymbol, {
              ns: 'dialog',
            })
          "
          @click="step(-1)"
          ><PhCaretDown
        /></Button>
      </div>
    </div>
    <p
      v-if="position === null"
      :id="`${id}-error`"
      class="mt-1 text-sm text-destructive"
      role="alert"
    >
      {{
        $t(($) => $.dialog.pageSetup.invalidFootnoteSymbol, {
          ns: 'dialog',
          count: MAX_FOOTNOTE_START_SYMBOL_REPETITIONS,
        })
      }}
    </p>
  </div>
</template>
<script setup lang="ts">
import { PhCaretDown, PhCaretUp } from '@phosphor-icons/vue';
import { computed, ref, watch } from 'vue';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { FootnoteSymbolSequence } from '@/models/FootnoteNumbering';
import {
  footnoteStartMax,
  footnoteSymbol,
  footnoteSymbolPosition,
  isValidFootnoteStart,
  MAX_FOOTNOTE_START_SYMBOL_REPETITIONS,
} from '@/services/FootnoteMarker';

const props = defineProps<{ id: string; sequence: FootnoteSymbolSequence }>();
const model = defineModel<number>({ required: true });
const emit = defineEmits<{ valid: [value: boolean] }>();
const text = ref('');
const maximum = computed(() => footnoteStartMax('symbols', props.sequence));
watch(
  [model, () => props.sequence],
  () => {
    text.value = isValidFootnoteStart(model.value, 'symbols', props.sequence)
      ? footnoteSymbol(model.value, props.sequence)
      : '';
  },
  { immediate: true },
);
const position = computed(() => {
  if (text.value.trim().length > MAX_FOOTNOTE_START_SYMBOL_REPETITIONS) {
    return null;
  }
  const value = footnoteSymbolPosition(text.value, props.sequence);
  return value !== null &&
    isValidFootnoteStart(value, 'symbols', props.sequence)
    ? value
    : null;
});
watch(
  position,
  (value) => {
    emit('valid', value !== null);
    if (value !== null) {
      model.value = value;
    }
  },
  { immediate: true },
);
function step(direction: number) {
  const current =
    position.value ??
    (isValidFootnoteStart(model.value, 'symbols', props.sequence)
      ? model.value
      : 1);
  text.value = footnoteSymbol(
    Math.min(maximum.value, Math.max(1, current + direction)),
    props.sequence,
  );
}
</script>
