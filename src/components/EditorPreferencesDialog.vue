<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.preferences.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t(($) => $.dialog.preferences.description, { ns: 'dialog' }) }}
        </DialogDescription>
      </DialogHeader>

      <form id="editor-preferences-form" @submit.prevent="submit">
        <FieldGroup>
          <Field>
            <FieldLabel for="editor-preferences-language">
              {{ $t(($) => $.dialog.preferences.language, { ns: 'dialog' }) }}
            </FieldLabel>
            <Select v-model="languageSelectValue">
              <SelectTrigger id="editor-preferences-language" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem :value="LANGUAGE_SYSTEM_DEFAULT_VALUE">
                    {{
                      $t(($) => $.dialog.preferences.languageSystemDefault, {
                        ns: 'dialog',
                      })
                    }}
                  </SelectItem>
                  <SelectItem
                    v-for="locale in supportedLocales"
                    :key="locale.code"
                    :value="locale.code"
                  >
                    {{ locale.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              <a
                href="https://crowdin.com/project/neanes"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{
                  $t(($) => $.dialog.preferences.helpTranslate, {
                    ns: 'dialog',
                  })
                }}
                <img src="@/assets/icons/crowdin-badge.svg" alt="Crowdin" />
              </a>
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel for="editor-preferences-menu-interaction">
              {{
                $t(($) => $.dialog.preferences.menuInteraction, {
                  ns: 'dialog',
                })
              }}
            </FieldLabel>
            <Select v-model="form.buttonMenuMode">
              <SelectTrigger
                id="editor-preferences-menu-interaction"
                class="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem :value="ButtonMenuMode.Hold">
                    {{
                      $t(($) => $.dialog.preferences.menuInteractionHold, {
                        ns: 'dialog',
                      })
                    }}
                  </SelectItem>
                  <SelectItem :value="ButtonMenuMode.Click">
                    {{
                      $t(($) => $.dialog.preferences.menuInteractionClick, {
                        ns: 'dialog',
                      })
                    }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <FieldSet class="gap-2">
            <FieldLegend variant="label" class="mb-0">
              {{
                $t(($) => $.dialog.preferences.tempoDefaults, {
                  ns: 'dialog',
                })
              }}
            </FieldLegend>
            <FieldGroup class="gap-1">
              <Field
                v-for="tempo in tempoSigns"
                :key="tempo"
                orientation="horizontal"
              >
                <FieldLabel
                  :for="getTempoInputId(tempo)"
                  class="items-center gap-1.5"
                >
                  <Neume
                    aria-hidden="true"
                    :neume="tempo"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                  />
                  <span>
                    {{ $t(getTempoSignLabelSelector(tempo), { ns: 'model' }) }}
                  </span>
                </FieldLabel>
                <InputBpm
                  :id="getTempoInputId(tempo)"
                  :model-value="form.tempoDefaults[tempo]!"
                  @update:model-value="onTempoChanged(tempo, $event)"
                />
                <span>{{
                  $t(($) => $.dialog.preferences.bpm, { ns: 'dialog' })
                }}</span>
              </Field>
            </FieldGroup>
          </FieldSet>
        </FieldGroup>
      </form>

      <DialogFooter>
        <DialogClose as-child>
          <Button
            variant="outline"
            type="button"
            class="h-auto min-h-8 max-w-full whitespace-normal text-center"
          >
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
        <Button
          variant="outline"
          type="button"
          class="h-auto min-h-8 max-w-full whitespace-normal text-center"
          @click="resetToSystemDefaults"
        >
          {{ $t(($) => $.dialog.common.useSystemDefault, { ns: 'dialog' }) }}
        </Button>
        <Button
          type="submit"
          form="editor-preferences-form"
          class="h-auto min-h-8 max-w-full whitespace-normal text-center"
        >
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed, ref } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supportedLocales } from '@/i18n';
import { ButtonMenuMode, EditorPreferences } from '@/models/EditorPreferences';
import { getTempoSignLabelSelector } from '@/models/NeumeI18nMappings';
import { TempoSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';

import InputBpm from './InputBpm.vue';

const emit = defineEmits<{
  update: [form: EditorPreferences];
}>();
const props = defineProps({
  options: {
    type: Object as PropType<EditorPreferences>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});
const open = defineModel<boolean>('open', { required: true });

const form = ref(cloneEditorPreferences(props.options));
const LANGUAGE_SYSTEM_DEFAULT_VALUE = '__system_default__';
const languageSelectValue = computed({
  get() {
    return form.value.language || LANGUAGE_SYSTEM_DEFAULT_VALUE;
  },
  set(value: string) {
    form.value.language = value === LANGUAGE_SYSTEM_DEFAULT_VALUE ? '' : value;
  },
});
const tempoSigns = [
  TempoSign.VerySlow,
  TempoSign.Slower,
  TempoSign.Slow,
  TempoSign.Moderate,
  TempoSign.Medium,
  TempoSign.Quick,
  TempoSign.Quicker,
  TempoSign.VeryQuick,
];

function onTempoChanged(neume: TempoSign, bpm: number) {
  form.value.tempoDefaults[neume] = bpm;
}

function resetToSystemDefaults() {
  form.value = new EditorPreferences();
}

function getTempoInputId(tempo: TempoSign) {
  return `editor-preferences-tempo-${tempo}`;
}

function submit() {
  emit('update', form.value);
}

function cloneEditorPreferences(options: EditorPreferences) {
  return EditorPreferences.createFrom(JSON.parse(JSON.stringify(options)));
}
</script>
