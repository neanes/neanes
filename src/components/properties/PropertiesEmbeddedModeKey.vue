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

    <Field>
      <div class="mb-2 flex items-center justify-between gap-2">
        <FieldLabel for="properties-embedded-mode-key-style">{{
          $t(($) => $.dialog.initialMartyriaStyles.styleLabel, {
            ns: 'dialog',
          })
        }}</FieldLabel>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          @click="emit('open-style-dialog')"
        >
          {{
            $t(($) => $.dialog.initialMartyriaStyles.manageStyles, {
              ns: 'dialog',
            })
          }}
        </Button>
      </div>
      <InitialMartyriaStyleSelect
        id="properties-embedded-mode-key-style"
        :model-value="element.initialMartyriaStyleId"
        :initial-martyria-styles="initialMartyriaStyles"
        rich-text-portal
        @update:model-value="update({ initialMartyriaStyleId: $event })"
        @update:open="emit('update:style-selector-open', $event)"
      />
    </Field>

    <Field orientation="horizontal">
      <FieldLabel for="properties-embedded-mode-key-size">{{
        $t(($) => $.toolbar.initialMartyria.size, { ns: 'toolbar' })
      }}</FieldLabel>
      <div class="flex items-center gap-1">
        <InputFontSize
          id="properties-embedded-mode-key-size"
          :model-value="primaryAppearance.fontSize"
          @update:model-value="update({ fontSize: $event })"
        />
        <ParagraphStyleClearButton
          :disabled="element.fontSize == null"
          @clear="update({ fontSize: null })"
        />
      </div>
    </Field>

    <Field orientation="horizontal">
      <FieldLabel>{{
        $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
      }}</FieldLabel>
      <div class="flex items-center gap-1">
        <ColorPicker
          :model-value="primaryAppearance.color"
          rich-text-portal
          @update:model-value="update({ color: $event })"
        />
        <ParagraphStyleClearButton
          :disabled="element.color == null"
          @clear="update({ color: null })"
        />
      </div>
    </Field>

    <Field orientation="horizontal">
      <FieldLabel for="properties-embedded-mode-key-outline">{{
        $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
      }}</FieldLabel>
      <div class="flex items-center gap-1">
        <InputStrokeWidth
          id="properties-embedded-mode-key-outline"
          :model-value="primaryAppearance.strokeWidth"
          @update:model-value="update({ strokeWidth: $event })"
        />
        <ParagraphStyleClearButton
          :disabled="element.strokeWidth == null"
          @clear="update({ strokeWidth: null })"
        />
      </div>
    </Field>

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

import ColorPicker from '@/components/ColorPicker.vue';
import InitialMartyriaStyleSelect from '@/components/InitialMartyriaStyleSelect.vue';
import InputBpm from '@/components/InputBpm.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import NeumeIcon from '@/components/NeumeIcon.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
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
import { useResolvedInitialMartyriaStyle } from '@/composables/useResolvedInitialMartyriaStyle';
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

const { primaryAppearance } = useResolvedInitialMartyriaStyle({
  element: () => props.element,
  pageSetup: () => props.pageSetup,
  paragraphStyles: () => props.paragraphStyles,
  initialMartyriaStyles: () => props.initialMartyriaStyles,
});

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
