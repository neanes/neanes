<template>
  <PaneSection
    value="embedded-initial-martyria"
    :title="$t(($) => $.menu.insert.initialMartyria, { ns: 'menu' })"
  >
    <Button
      type="button"
      class="w-full"
      variant="outline"
      @click="emit('open-selector')"
    >
      {{
        $t(($) => $.toolbar.initialMartyria.changeInitialMartyria, {
          ns: 'toolbar',
        })
      }}
    </Button>

    <InitialMartyriaStyleFields
      :element="element"
      :paragraph-styles="paragraphStyles"
      :initial-martyria-styles="initialMartyriaStyles"
      :default-initial-martyria-style-id="defaultInitialMartyriaStyleId"
      id-prefix="properties-embedded-mode-key"
      rich-text-portal
      @update="update"
      @open-style-dialog="emit('open-style-dialog')"
      @update:style-selector-open="emit('update:style-selector-open', $event)"
    />

    <Field orientation="horizontal">
      <FieldLabel for="properties-embedded-mode-key-bpm">{{
        $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
      }}</FieldLabel>
      <InputBpm
        id="properties-embedded-mode-key-bpm"
        :model-value="element.bpm"
        @update:model-value="update({ bpm: $event })"
      />
    </Field>

    <Field>
      <FieldLabel for="properties-embedded-mode-key-tempo">{{
        $t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' })
      }}</FieldLabel>
      <Select
        :model-value="element.tempo ?? NO_TEMPO_VALUE"
        @update:model-value="onTempoChanged"
        @update:open="emit('update:tempo-selector-open', $event)"
      >
        <SelectTrigger
          id="properties-embedded-mode-key-tempo"
          class="w-full"
          @mousedown.prevent
        >
          <SelectValue>
            <span class="flex items-center gap-2">
              <NeumeIcon
                v-if="selectedTempoOption != null"
                :name="selectedTempoOption.icon"
                size="1.25rem"
              />
              <span>{{ selectedTempoLabel }}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <RichTextSelectContent @close-auto-focus.prevent>
          <SelectItem :value="NO_TEMPO_VALUE">
            {{ $t(($) => $.toolbar.common.none, { ns: 'toolbar' }) }}
          </SelectItem>
          <SelectItem
            v-for="option in tempoOptions"
            :key="option.value"
            :value="option.value"
            :text-value="
              $t(getTempoSignLabelSelector(option.value), {
                ns: 'model',
              })
            "
          >
            <NeumeIcon :name="option.icon" size="1.25rem" />
            <span>
              {{ $t(getTempoSignLabelSelector(option.value), { ns: 'model' }) }}
            </span>
          </SelectItem>
        </RichTextSelectContent>
      </Select>
    </Field>

    <Field orientation="horizontal">
      <Switch
        id="properties-embedded-mode-key-ignore-attractions"
        :model-value="element.ignoreAttractions"
        @update:model-value="update({ ignoreAttractions: $event === true })"
      />
      <FieldLabel for="properties-embedded-mode-key-ignore-attractions">{{
        $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
      }}</FieldLabel>
    </Field>

    <Field
      v-if="element.mode === 3 || element.mode === 7"
      orientation="horizontal"
    >
      <Switch
        id="properties-embedded-mode-key-permanent-enharmonic-zo"
        :model-value="element.permanentEnharmonicZo"
        @update:model-value="update({ permanentEnharmonicZo: $event === true })"
      />
      <FieldLabel for="properties-embedded-mode-key-permanent-enharmonic-zo">{{
        $t(($) => $.toolbar.initialMartyria.permanentEnharmonicZo, {
          ns: 'toolbar',
        })
      }}</FieldLabel>
    </Field>
  </PaneSection>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputBpm from '@/components/InputBpm.vue';
import NeumeIcon from '@/components/NeumeIcon.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import InitialMartyriaStyleFields from '@/components/properties/InitialMartyriaStyleFields.vue';
import RichTextSelectContent from '@/components/RichTextSelectContent.vue';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ModeKeyElement } from '@/models/Element';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import { getTempoSignLabelSelector } from '@/models/NeumeI18nMappings';
import { TempoSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';

const props = defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    required: true,
  },
  initialMartyriaStyles: {
    type: Array as PropType<InitialMartyriaStyle[]>,
    required: true,
  },
  /** The score's default style, which a mode key without a style follows. */
  defaultInitialMartyriaStyleId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  update: [values: Partial<ModeKeyElement>];
  'open-selector': [];
  'open-style-dialog': [];
  'update:style-selector-open': [value: boolean];
  'update:tempo-selector-open': [value: boolean];
}>();

const tempoOptions = [
  { value: TempoSign.VeryQuick, icon: 'agogi-poli-gorgi' },
  { value: TempoSign.Quicker, icon: 'agogi-gorgoteri' },
  { value: TempoSign.Quick, icon: 'agogi-gorgi' },
  { value: TempoSign.Medium, icon: 'agogi-mesi' },
  { value: TempoSign.Moderate, icon: 'agogi-metria' },
  { value: TempoSign.Slow, icon: 'agogi-argi' },
  { value: TempoSign.Slower, icon: 'agogi-argoteri' },
  { value: TempoSign.VerySlow, icon: 'agogi-poli-argi' },
];
const NO_TEMPO_VALUE = '__none__';
const { t } = useTranslation();

const selectedTempoOption = computed(
  () =>
    tempoOptions.find((option) => option.value === props.element.tempo) ?? null,
);
const selectedTempoLabel = computed(() =>
  selectedTempoOption.value == null
    ? t(($) => $.toolbar.common.none, { ns: 'toolbar' })
    : t(getTempoSignLabelSelector(selectedTempoOption.value.value), {
        ns: 'model',
      }),
);

function update(values: Partial<ModeKeyElement>) {
  emit('update', values);
}

function onTempoChanged(value: AcceptableValue) {
  if (value === NO_TEMPO_VALUE) {
    update({ tempo: null });
    return;
  }

  const tempo = tempoOptions.find((option) => option.value === value)?.value;

  if (tempo != null) {
    update({ tempo });
  }
}
</script>
