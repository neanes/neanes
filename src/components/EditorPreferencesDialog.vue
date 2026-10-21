<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[42rem] max-h-[calc(100dvh-2rem)] flex flex-col sm:max-w-3xl"
    >
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
        class="min-h-0 flex-1 overflow-hidden"
        @submit.prevent
      >
        <Tabs
          v-model="section"
          orientation="vertical"
          class="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 sm:grid-cols-[13rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)]"
        >
          <ScrollArea class="min-h-0"
            ><TabsList
              class="h-auto w-full flex-col items-stretch justify-start p-1"
            >
              <TabsTrigger
                v-for="item in sections"
                :key="item"
                :value="item"
                class="min-h-9 w-full justify-start whitespace-normal text-left"
                >{{
                  $t(($) => $.dialog.preferences.sections[item], {
                    ns: 'dialog',
                  })
                }}</TabsTrigger
              >
            </TabsList></ScrollArea
          >
          <TabsContent :value="section" class="min-h-0 overflow-hidden"
            ><ScrollArea class="h-full border"
              ><FieldGroup class="p-4">
                <Field v-if="section === 'general'">
                  <FieldLabel for="editor-preferences-language">
                    {{
                      $t(($) => $.dialog.preferences.language, { ns: 'dialog' })
                    }}
                  </FieldLabel>
                  <Select v-model="languageSelectValue">
                    <SelectTrigger
                      id="editor-preferences-language"
                      class="w-full"
                    >
                      <SelectValue>
                        <span class="flex min-w-0 items-center gap-2">
                          <span
                            v-if="selectedLocale"
                            aria-hidden="true"
                            class="size-5 shrink-0 text-center"
                          >
                            {{ selectedLocale.flag }}
                          </span>
                          <span class="truncate">{{
                            selectedLanguageLabel
                          }}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          :value="LANGUAGE_SYSTEM_DEFAULT_VALUE"
                          :text-value="
                            $t(
                              ($) => $.dialog.preferences.languageSystemDefault,
                              {
                                ns: 'dialog',
                              },
                            )
                          "
                        >
                          <span class="flex items-center gap-2">
                            <span aria-hidden="true" class="size-5 shrink-0" />
                            <span>
                              {{
                                $t(
                                  ($) =>
                                    $.dialog.preferences.languageSystemDefault,
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
                    </a>
                  </FieldDescription>
                </Field>

                <Field v-if="section === 'appearance'">
                  <FieldLabel id="editor-preferences-color-mode-label">
                    {{
                      $t(($) => $.dialog.preferences.colorMode, {
                        ns: 'dialog',
                      })
                    }}
                  </FieldLabel>
                  <ToggleGroup
                    id="editor-preferences-color-mode"
                    type="single"
                    variant="outline"
                    class="grid w-full grid-cols-3"
                    :model-value="colorModeValue"
                    aria-labelledby="editor-preferences-color-mode-label"
                    @update:model-value="onColorModeChanged"
                  >
                    <ToggleGroupItem
                      value="light"
                      class="min-w-0 justify-center"
                    >
                      <PhSun data-icon="inline-start" />
                      <span class="min-w-0 truncate">
                        {{
                          $t(($) => $.dialog.preferences.colorModeLight, {
                            ns: 'dialog',
                          })
                        }}
                      </span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="dark"
                      class="min-w-0 justify-center"
                    >
                      <PhMoon data-icon="inline-start" />
                      <span class="min-w-0 truncate">
                        {{
                          $t(($) => $.dialog.preferences.colorModeDark, {
                            ns: 'dialog',
                          })
                        }}
                      </span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="auto"
                      class="min-w-0 justify-center"
                    >
                      <PhDesktop data-icon="inline-start" />
                      <span class="min-w-0 truncate">
                        {{
                          $t(($) => $.dialog.preferences.colorModeSystem, {
                            ns: 'dialog',
                          })
                        }}
                      </span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <Field v-if="section === 'general'">
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
                      <SelectValue>{{ menuInteractionLabel }}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem :value="ButtonMenuMode.Hold">
                          {{
                            $t(
                              ($) => $.dialog.preferences.menuInteractionHold,
                              {
                                ns: 'dialog',
                              },
                            )
                          }}
                        </SelectItem>
                        <SelectItem :value="ButtonMenuMode.Click">
                          {{
                            $t(
                              ($) => $.dialog.preferences.menuInteractionClick,
                              {
                                ns: 'dialog',
                              },
                            )
                          }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field v-if="section === 'advanced'" orientation="horizontal">
                  <Switch
                    id="editor-preferences-enable-developer-panel"
                    :model-value="form.showDeveloperPanels"
                    @update:model-value="
                      form.showDeveloperPanels = $event === true
                    "
                  />
                  <FieldLabel for="editor-preferences-enable-developer-panel">
                    {{
                      $t(($) => $.dialog.preferences.enableDeveloperPanel, {
                        ns: 'dialog',
                      })
                    }}
                  </FieldLabel>
                </Field>

                <FieldSet v-if="section === 'editing'" class="gap-2">
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
                          {{
                            $t(getTempoSignLabelSelector(tempo), {
                              ns: 'model',
                            })
                          }}
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
              </FieldGroup></ScrollArea
            ></TabsContent
          >
        </Tabs>
      </form>

      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          class="h-auto min-h-8 max-w-full whitespace-normal text-center"
          @click="resetToSystemDefaults"
          ><PhArrowCounterClockwise />{{
            $t(($) => $.dialog.common.useSystemDefault, { ns: 'dialog' })
          }}</Button
        >
        <DialogClose as-child
          ><Button
            type="button"
            class="h-auto min-h-8 max-w-full whitespace-normal text-center"
            >{{
              $t(($) => $.dialog.preferences.close, { ns: 'dialog' })
            }}</Button
          ></DialogClose
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  PhArrowCounterClockwise,
  PhDesktop,
  PhMoon,
  PhSun,
} from '@phosphor-icons/vue';
import type { BasicColorSchema } from '@vueuse/core';
import { useColorMode } from '@vueuse/core';
import { useTranslation } from 'i18next-vue';
import type { PropType } from 'vue';
import { computed, ref, watch } from 'vue';

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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supportedLocales } from '@/i18n';
import { ButtonMenuMode, EditorPreferences } from '@/models/EditorPreferences';
import { getTempoSignLabelSelector } from '@/models/NeumeI18nMappings';
import { TempoSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';

import InputBpm from './InputBpm.vue';

const sections = ['general', 'appearance', 'editing', 'advanced'] as const;
const section = ref<(typeof sections)[number]>('general');

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
const colorMode = useColorMode();
const colorModeValue = ref<BasicColorSchema>(colorMode.store.value);
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
const menuInteractionLabel = computed(() =>
  t(
    form.value.buttonMenuMode === ButtonMenuMode.Hold
      ? ($) => $.dialog.preferences.menuInteractionHold
      : ($) => $.dialog.preferences.menuInteractionClick,
    { ns: 'dialog' },
  ),
);
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

function onColorModeChanged(value: unknown) {
  if (value === 'light' || value === 'dark' || value === 'auto') {
    colorModeValue.value = value;
  }
}

function resetToSystemDefaults() {
  const defaults = new EditorPreferences();
  if (section.value === 'general') {
    form.value.language = defaults.language;
    form.value.buttonMenuMode = defaults.buttonMenuMode;
  } else if (section.value === 'appearance') {
    colorModeValue.value = 'auto';
  } else if (section.value === 'editing') {
    form.value.tempoDefaults = defaults.tempoDefaults;
  } else if (section.value === 'advanced') {
    form.value.showDeveloperPanels = defaults.showDeveloperPanels;
  }
}

function getTempoInputId(tempo: TempoSign) {
  return `editor-preferences-tempo-${tempo}`;
}

watch(
  form,
  () => {
    if (open.value) {
      emit('update', cloneEditorPreferences(form.value));
    }
  },
  { deep: true },
);
watch(colorModeValue, (value) => {
  if (open.value) {
    colorMode.store.value = value;
  }
});

watch(open, (isOpen) => {
  if (isOpen) {
    form.value = cloneEditorPreferences(props.options);
    colorModeValue.value = colorMode.store.value;
  }
});

function cloneEditorPreferences(options: EditorPreferences) {
  return EditorPreferences.createFrom(JSON.parse(JSON.stringify(options)));
}
</script>
