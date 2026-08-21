<template>
  <div class="flex size-full min-h-0 flex-col overflow-hidden p-3">
    <FieldSet class="min-h-0 flex-1 overflow-hidden">
      <FieldLegend class="sr-only">{{
        $t(($) => $.menu.view.lyrics, { ns: 'menu' })
      }}</FieldLegend>
      <FieldGroup class="min-h-0 flex-1 overflow-hidden">
        <Field orientation="horizontal">
          <Switch
            id="lyrics-pane-locked"
            :model-value="locked"
            @update:model-value="emit('update:locked', $event === true)"
          />
          <FieldLabel for="lyrics-pane-locked">{{
            $t(($) => $.toolbar.lyricManager.locked, { ns: 'toolbar' })
          }}</FieldLabel>
        </Field>

        <Button
          type="button"
          variant="secondary"
          @click="emit('assign-accepts-lyrics')"
        >
          <PhFloppyDisk data-icon="inline-start" />
          {{
            $t(($) => $.toolbar.lyricManager.assignAcceptsLyrics, {
              ns: 'toolbar',
            })
          }}
        </Button>

        <Field class="min-h-0 flex-1 overflow-hidden">
          <FieldLabel for="lyrics-pane-text">{{
            $t(($) => $.menu.view.lyrics, { ns: 'menu' })
          }}</FieldLabel>
          <Textarea
            id="lyrics-pane-text"
            class="field-sizing-fixed h-auto min-h-0 flex-1 resize-none overflow-auto"
            :model-value="lyrics"
            dir="auto"
            rows="8"
            @focus="emit('activate-staff-lyrics')"
            @update:model-value="emit('update:lyrics', String($event))"
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  </div>
</template>

<script setup lang="ts">
import { PhFloppyDisk } from '@phosphor-icons/vue';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

defineProps({
  locked: {
    type: Boolean,
    required: true,
  },
  lyrics: {
    type: String,
    required: true,
  },
});

const emit = defineEmits([
  'activate-staff-lyrics',
  'assign-accepts-lyrics',
  'update:locked',
  'update:lyrics',
]);
</script>
