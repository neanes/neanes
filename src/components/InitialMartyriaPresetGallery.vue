<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="grid h-[42rem] max-h-[calc(100dvh-4rem)] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-[60rem]"
      @close-auto-focus="emit('close-auto-focus', $event)"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.initialMartyriaStyles.addStyleTitle, { ns }) }}
        </DialogTitle>
        <DialogDescription>
          {{
            $t(($) => $.dialog.initialMartyriaStyles.addStyleDescription, {
              ns,
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex items-center gap-3">
        <FieldLabel for="initial-martyria-preset-language" class="flex-none">
          {{ $t(($) => $.dialog.initialMartyriaStyles.language, { ns }) }}
        </FieldLabel>
        <Select v-model="languageFilter">
          <SelectTrigger id="initial-martyria-preset-language" class="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL_LANGUAGES">
              {{
                $t(($) => $.dialog.initialMartyriaStyles.allLanguages, { ns })
              }}
            </SelectItem>
            <SelectItem
              v-for="languageId in orderedLanguageIds"
              :key="languageId"
              :value="languageId"
            >
              {{ getInitialMartyriaLanguageName(t, languageId) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea class="min-h-0 border">
        <div class="space-y-4 p-3">
          <section
            v-for="group in groups"
            :key="group.key"
            :aria-label="group.label"
          >
            <p
              class="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
            >
              {{ group.label }}
            </p>
            <div
              class="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-1.5"
            >
              <InitialMartyriaStyleTile
                v-for="preset in group.presets"
                :key="preset.id"
                :martyria-style="preset"
                :paragraph-styles="paragraphStyles"
                :page-setup="pageSetup"
                :template-id="sampleTemplateId"
                :selected="false"
                :caption="getInitialMartyriaStyleDisplayName(preset, t)"
                :max-font-size="22"
                @select="choose(preset)"
              />
            </div>
          </section>
        </div>
      </ScrollArea>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="outline">
            {{ $t(($) => $.dialog.common.cancel, { ns }) }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, ref } from 'vue';

import InitialMartyriaStyleTile from '@/components/InitialMartyriaStyleTile.vue';
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
import { FieldLabel } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type BuiltInInitialMartyriaStyle,
  builtInInitialMartyriaStyles,
  getInitialMartyriaStyleDisplayName,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  INITIAL_MARTYRIA_LETTERINGS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { getInitialMartyriaLanguageName } from '@/utils/initialMartyriaLabels';

import {
  getSampleTemplateId,
  PLAGAL_SAMPLE_MODE,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

/**
 * A window offering the built-in styles as presets to start a new style
 * from, on top of the styles dialog. Each is
 * shown as it renders, grouped by the language it is written in, with the
 * neume font first since it belongs to no language of its own.
 */
const props = defineProps<{
  paragraphStyles: ParagraphStyle[];
  pageSetup: PageSetup;
  /** The language listed first, normally the UI language. */
  preferredLanguageId: InitialMartyriaLanguageId;
}>();

const emit = defineEmits<{
  select: [preset: BuiltInInitialMartyriaStyle];
  'close-auto-focus': [event: Event];
}>();

const open = defineModel<boolean>('open', { required: true });

/*
 * The tiles stay clickable while the dialog animates closed, so a
 * double-click would otherwise add the preset twice. Only the first choice
 * after the gallery opens counts.
 */
function choose(preset: BuiltInInitialMartyriaStyle) {
  if (!open.value) {
    return;
  }
  emit('select', preset);
  open.value = false;
}

const { t } = useTranslation();

const ALL_LANGUAGES = 'all';
const languageFilter = ref<string>(ALL_LANGUAGES);

const sampleTemplateId = getSampleTemplateId(PLAGAL_SAMPLE_MODE);

const orderedLanguageIds = computed(() => [
  props.preferredLanguageId,
  ...initialMartyriaLanguageIds.filter(
    (languageId) => languageId !== props.preferredLanguageId,
  ),
]);

function usesNeumeFont(preset: BuiltInInitialMartyriaStyle) {
  return preset.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont;
}

const groups = computed(() => {
  const result: {
    key: string;
    label: string;
    presets: BuiltInInitialMartyriaStyle[];
  }[] = [];

  if (languageFilter.value === ALL_LANGUAGES) {
    result.push({
      key: 'neume-font',
      label: t(($) => $.dialog.initialMartyriaStyles.neumeFontPresets, { ns }),
      presets: builtInInitialMartyriaStyles.filter(usesNeumeFont),
    });
  }

  for (const languageId of orderedLanguageIds.value) {
    if (
      languageFilter.value !== ALL_LANGUAGES &&
      languageFilter.value !== languageId
    ) {
      continue;
    }
    result.push({
      key: languageId,
      label: getInitialMartyriaLanguageName(t, languageId),
      presets: builtInInitialMartyriaStyles.filter(
        (preset) =>
          !usesNeumeFont(preset) && preset.structure.languageId === languageId,
      ),
    });
  }

  return result.filter((group) => group.presets.length > 0);
});
</script>
