<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.documentProperties.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{
            $t(($) => $.dialog.documentProperties.description, {
              ns: 'dialog',
            })
          }}
        </DialogDescription>
      </DialogHeader>
      <form id="document-properties-form" @submit.prevent="submit">
        <FieldGroup>
          <Field>
            <FieldLabel for="document-properties-title">
              {{
                $t(($) => $.dialog.documentProperties.title, { ns: 'dialog' })
              }}
            </FieldLabel>
            <Input
              id="document-properties-title"
              v-model="form.title"
              autocomplete="off"
            />
          </Field>

          <Field>
            <FieldLabel for="document-properties-author">
              {{
                $t(($) => $.dialog.documentProperties.author, { ns: 'dialog' })
              }}
            </FieldLabel>
            <Input
              id="document-properties-author"
              v-model="form.author"
              autocomplete="off"
            />
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" type="button">
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
        <Button type="submit" form="document-properties-form">
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { reactive, watch } from 'vue';

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
import type { DocumentProperties } from '@/models/Score';

const props = defineProps({
  documentProperties: {
    type: Object as PropType<DocumentProperties>,
    required: true,
  },
});

const emit = defineEmits<{
  update: [documentProperties: DocumentProperties];
}>();

const open = defineModel<boolean>('open', { required: true });

const form = reactive({
  title: '',
  author: '',
});

watch(
  [() => open.value, () => props.documentProperties],
  () => {
    if (!open.value) {
      return;
    }

    form.title = props.documentProperties.title;
    form.author = props.documentProperties.author;
  },
  { immediate: true },
);

function submit() {
  emit('update', {
    title: form.title.trim(),
    author: form.author.trim(),
  });
  open.value = false;
}
</script>
