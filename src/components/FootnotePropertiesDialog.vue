<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{
          $t(($) => $.dialog.footnoteProperties.title, { ns: 'dialog' })
        }}</DialogTitle>
        <DialogDescription>{{
          $t(($) => $.dialog.footnoteProperties.description, { ns: 'dialog' })
        }}</DialogDescription>
      </DialogHeader>
      <form id="footnote-properties-form" @submit.prevent="submit">
        <FieldGroup>
          <Field>
            <FieldLabel for="footnote-marker-type">{{
              $t(($) => $.dialog.footnoteProperties.marker, { ns: 'dialog' })
            }}</FieldLabel>
            <Select v-model="type">
              <SelectTrigger id="footnote-marker-type"
                ><SelectValue
              /></SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">{{
                  $t(($) => $.dialog.footnoteProperties.automatic, {
                    ns: 'dialog',
                  })
                }}</SelectItem>
                <SelectItem value="asterisk"
                  >{{
                    $t(($) => $.dialog.footnoteProperties.asterisk, {
                      ns: 'dialog',
                    })
                  }}
                  (*)</SelectItem
                >
                <SelectItem value="dagger"
                  >{{
                    $t(($) => $.dialog.footnoteProperties.dagger, {
                      ns: 'dialog',
                    })
                  }}
                  (†)</SelectItem
                >
                <SelectItem value="doubleDagger"
                  >{{
                    $t(($) => $.dialog.footnoteProperties.doubleDagger, {
                      ns: 'dialog',
                    })
                  }}
                  (‡)</SelectItem
                >
                <SelectItem value="custom">{{
                  $t(($) => $.dialog.footnoteProperties.custom, {
                    ns: 'dialog',
                  })
                }}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field v-if="type === 'custom'">
            <FieldLabel for="footnote-custom-marker">{{
              $t(($) => $.dialog.footnoteProperties.customText, {
                ns: 'dialog',
              })
            }}</FieldLabel>
            <Input
              id="footnote-custom-marker"
              v-model="customText"
              autocomplete="off"
              :aria-invalid="!valid"
            />
            <p v-if="!valid" class="text-sm text-destructive" role="alert">
              {{
                $t(($) => $.dialog.footnoteProperties.invalid, { ns: 'dialog' })
              }}
            </p>
          </Field>
          <div class="flex justify-between gap-4 text-sm" aria-live="polite">
            <span
              >{{
                $t(($) => $.dialog.footnoteProperties.reference, {
                  ns: 'dialog',
                })
              }}:
              <sup data-testid="footnote-marker-preview">{{
                referencePreview
              }}</sup></span
            >
            <span
              >{{
                $t(($) => $.dialog.footnoteProperties.body, { ns: 'dialog' })
              }}:
              <span data-testid="footnote-body-preview">{{
                markerPreview
              }}</span></span
            >
          </div>
        </FieldGroup>
      </form>
      <DialogFooter>
        <DialogClose as-child
          ><Button variant="outline" type="button">{{
            $t(($) => $.dialog.common.cancel, { ns: 'dialog' })
          }}</Button></DialogClose
        >
        <Button
          type="submit"
          form="footnote-properties-form"
          :disabled="!valid"
          >{{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Footnote } from '@/models/Footnote';
import { footnoteMarkerText } from '@/services/FootnoteLayout';
import { normalizeFootnoteMarker } from '@/services/FootnoteMarker';

const props = defineProps<{
  footnote: Footnote;
  automaticNumber: number;
  richTextReference: boolean;
}>();
const emit = defineEmits<{ update: [marker: string | null] }>();
const open = defineModel<boolean>('open', { required: true });
const type = ref('automatic');
const customText = ref('');
const symbols: Record<string, string> = {
  asterisk: '*',
  dagger: '†',
  doubleDagger: '‡',
};
watch(
  [open, () => props.footnote],
  () => {
    if (!open.value) {
      return;
    }
    const marker = props.footnote.marker;
    type.value =
      marker === null
        ? 'automatic'
        : (Object.keys(symbols).find((key) => symbols[key] === marker) ??
          'custom');
    customText.value = marker ?? '';
  },
  { immediate: true },
);
const value = computed(() =>
  type.value === 'automatic'
    ? null
    : type.value === 'custom'
      ? customText.value
      : symbols[type.value],
);
const valid = computed(() => {
  try {
    normalizeFootnoteMarker(value.value);
    return true;
  } catch {
    return false;
  }
});
const markerPreview = computed(() =>
  valid.value
    ? (normalizeFootnoteMarker(value.value) ?? String(props.automaticNumber))
    : '',
);
const referencePreview = computed(() =>
  props.richTextReference
    ? markerPreview.value
    : footnoteMarkerText(markerPreview.value),
);
function submit() {
  if (!valid.value) {
    return;
  }
  emit('update', normalizeFootnoteMarker(value.value));
  open.value = false;
}
</script>
