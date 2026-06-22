<template>
  <Dialog v-model:open="open">
    <DialogContent class="flex max-h-[90vh] flex-col sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.preferences.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t(($) => $.dialog.preferences.description, { ns: 'dialog' }) }}
        </DialogDescription>
      </DialogHeader>

      <form
        id="editor-preferences-form"
        class="min-h-0 flex-1 overflow-y-auto pr-1"
        @submit.prevent="submit"
      >
        <FieldGroup class="pb-1">
          <Field>
            <FieldLabel for="editor-preferences-language">
              {{ $t(($) => $.dialog.preferences.language, { ns: 'dialog' }) }}
            </FieldLabel>
            <Select v-model="languageSelectValue">
              <SelectTrigger id="editor-preferences-language" class="w-full">
                <SelectValue>
                  <span class="flex min-w-0 items-center gap-2">
                    <span
                      v-if="selectedLocale"
                      aria-hidden="true"
                      class="size-5 shrink-0 text-center"
                    >
                      {{ selectedLocale.flag }}
                    </span>
                    <span class="truncate">{{ selectedLanguageLabel }}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    :value="LANGUAGE_SYSTEM_DEFAULT_VALUE"
                    :text-value="
                      $t(($) => $.dialog.preferences.languageSystemDefault, {
                        ns: 'dialog',
                      })
                    "
                  >
                    <span class="flex items-center gap-2">
                      <span aria-hidden="true" class="size-5 shrink-0" />
                      <span>
                        {{
                          $t(
                            ($) => $.dialog.preferences.languageSystemDefault,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </span>
                    </span>
                  </SelectItem>
                  <SelectItem
                    v-for="locale in supportedLocales"
                    :key="locale.code"
                    :value="locale.code"
                    :text-value="locale.name"
                  >
                    <span class="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        class="size-5 shrink-0 text-center"
                      >
                        {{ locale.flag }}
                      </span>
                      <span>{{ locale.name }}</span>
                    </span>
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

          <Field orientation="horizontal">
            <Switch
              id="editor-preferences-enable-developer-panel"
              :model-value="form.showDeveloperPanels"
              @update:model-value="form.showDeveloperPanels = $event === true"
            />
            <FieldLabel for="editor-preferences-enable-developer-panel">
              {{
                $t(($) => $.dialog.preferences.enableDeveloperPanel, {
                  ns: 'dialog',
                })
              }}
            </FieldLabel>
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
          <PhArrowCounterClockwise />
          {{ $t(($) => $.dialog.common.useSystemDefault, { ns: 'dialog' }) }}
        </Button>
        <Button
          type="submit"
          form="editor-preferences-form"
          class="h-auto min-h-8 max-w-full whitespace-normal text-center"
        >
          <PhCheck />
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { PhArrowCounterClockwise, PhCheck } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
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
import { Switch } from '@/components/ui/switch';
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
const { t } = useTranslation();
const languageSelectValue = computed({
  get() {
    return form.value.language || LANGUAGE_SYSTEM_DEFAULT_VALUE;
  },
  set(value: string) {
    form.value.language = value === LANGUAGE_SYSTEM_DEFAULT_VALUE ? '' : value;
  },
});
const languageSystemDefaultLabel = computed(() =>
  t(($) => $.dialog.preferences.languageSystemDefault, {
    ns: 'dialog',
  }),
);
const selectedLocale = computed(() =>
  supportedLocales.find((locale) => locale.code === languageSelectValue.value),
);
const selectedLanguageLabel = computed(() => {
  if (languageSelectValue.value === LANGUAGE_SYSTEM_DEFAULT_VALUE) {
    return languageSystemDefaultLabel.value;
  }

  return selectedLocale.value?.name ?? languageSelectValue.value;
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
