<template>
  <PaneSection
    value="embedded-initial-martyria"
    :title="$t(($) => $.menu.insert.initialMartyria, { ns: 'menu' })"
  >
    <Button type="button" variant="outline" @click="emit('open-selector')">
      {{ $t(($) => $.menu.insert.initialMartyria, { ns: 'menu' }) }}
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
        @update:model-value="update({ initialMartyriaStyleId: $event })"
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

    <Field orientation="horizontal">
      <FieldLabel>{{
        $t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' })
      }}</FieldLabel>
      <Toolbar loop>
        <ButtonWithMenu
          :options="tempoMenuOptions"
          :tooltip="$t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' })"
          @select="update({ tempo: $event })"
        />
      </Toolbar>
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
import type { PropType } from 'vue';

import type { ButtonWithMenuOption } from '@/components/ButtonWithMenu.types';
import ButtonWithMenu from '@/components/ButtonWithMenu.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import InitialMartyriaStyleSelect from '@/components/InitialMartyriaStyleSelect.vue';
import InputBpm from '@/components/InputBpm.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { Toolbar } from '@/components/ui/toolbar';
import { useResolvedInitialMartyriaStyle } from '@/composables/useResolvedInitialMartyriaStyle';
import type { ModeKeyElement } from '@/models/Element';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
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
}>();

const tempoMenuOptions: ButtonWithMenuOption[] = [
  { neume: TempoSign.VeryQuick, icon: 'agogi-poli-gorgi' },
  { neume: TempoSign.Quicker, icon: 'agogi-gorgoteri' },
  { neume: TempoSign.Quick, icon: 'agogi-gorgi' },
  { neume: TempoSign.Medium, icon: 'agogi-mesi' },
  { neume: TempoSign.Moderate, icon: 'agogi-metria' },
  { neume: TempoSign.Slow, icon: 'agogi-argi' },
  { neume: TempoSign.Slower, icon: 'agogi-argoteri' },
  { neume: TempoSign.VerySlow, icon: 'agogi-poli-argi' },
];

const { primaryAppearance } = useResolvedInitialMartyriaStyle({
  element: () => props.element,
  pageSetup: () => props.pageSetup,
  paragraphStyles: () => props.paragraphStyles,
  initialMartyriaStyles: () => props.initialMartyriaStyles,
});

function update(values: Partial<ModeKeyElement>) {
  emit('update', values);
}
</script>
