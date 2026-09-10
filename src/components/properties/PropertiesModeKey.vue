<template>
  <PaneAccordion
    :open-sections="openSections"
    @update:open-sections="$emit('update:open-sections', $event)"
  >
    <template #legend>{{
      $t(($) => $.menu.insert.initialMartyria, { ns: 'menu' })
    }}</template>

    <PaneSection
      value="style"
      :title="$t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })"
    >
      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-mode-key-style">{{
            $t(($) => $.dialog.initialMartyriaStyles.styleLabel, {
              ns: 'dialog',
            })
          }}</FieldLabel>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            @click="$emit('open-style-dialog')"
          >
            {{
              $t(($) => $.dialog.initialMartyriaStyles.manageStyles, {
                ns: 'dialog',
              })
            }}
          </Button>
        </div>
        <InitialMartyriaStyleSelect
          id="properties-mode-key-style"
          :model-value="element.initialMartyriaStyleId"
          :initial-martyria-styles="initialMartyriaStyles"
          @update:model-value="
            $emit('update', {
              initialMartyriaStyleId: $event,
            } as Partial<ModeKeyElement>)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-mode-key-font-size">{{
          $t(($) => $.toolbar.initialMartyria.size, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <InputFontSize
            id="properties-mode-key-font-size"
            :model-value="resolvedAppearance.fontSize"
            @update:model-value="
              $emit('update', { fontSize: $event } as Partial<ModeKeyElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.fontSize == null"
            @clear="
              $emit('update', { fontSize: null } as Partial<ModeKeyElement>)
            "
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <ColorPicker
            :model-value="resolvedAppearance.color"
            @update:model-value="
              $emit('update', { color: $event } as Partial<ModeKeyElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.color == null"
            @clear="$emit('update', { color: null } as Partial<ModeKeyElement>)"
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-mode-key-outline">{{
          $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <InputStrokeWidth
            id="properties-mode-key-outline"
            :model-value="resolvedAppearance.strokeWidth"
            @update:model-value="
              $emit('update', {
                strokeWidth: $event,
              } as Partial<ModeKeyElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.strokeWidth == null"
            @clear="
              $emit('update', { strokeWidth: null } as Partial<ModeKeyElement>)
            "
          />
        </div>
      </Field>
    </PaneSection>

    <PaneSection
      value="positioning"
      :title="$t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' })"
    >
      <Field orientation="horizontal">
        <Switch
          id="properties-mode-key-inline"
          :model-value="element.inline"
          @update:model-value="
            $emit('update', {
              inline: $event === true,
            } as Partial<ModeKeyElement>)
          "
        />
        <FieldLabel for="properties-mode-key-inline">
          {{ $t(($) => $.toolbar.common.inline, { ns: 'toolbar' }) }}
        </FieldLabel>
      </Field>

      <Field v-if="!element.inline" orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.toolbar.common.alignment, { ns: 'toolbar' })
        }}</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          :model-value="element.alignment"
          @update:model-value="onAlignmentChanged"
        >
          <AppTooltip
            :tooltip="$t(($) => $.toolbar.common.alignLeft, { ns: 'toolbar' })"
          >
            <ToggleGroupItem :value="TextBoxAlignment.Left">
              <PhTextAlignLeft />
            </ToggleGroupItem>
          </AppTooltip>
          <AppTooltip
            :tooltip="
              $t(($) => $.toolbar.common.alignCenter, { ns: 'toolbar' })
            "
          >
            <ToggleGroupItem :value="TextBoxAlignment.Center">
              <PhTextAlignCenter />
            </ToggleGroupItem>
          </AppTooltip>
          <AppTooltip
            :tooltip="$t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })"
          >
            <ToggleGroupItem :value="TextBoxAlignment.Right">
              <PhTextAlignRight />
            </ToggleGroupItem>
          </AppTooltip>
        </ToggleGroup>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-mode-key-bpm">{{
          $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputBpm
          id="properties-mode-key-bpm"
          :model-value="element.bpm"
          @update:model-value="
            $emit('update', { bpm: $event } as Partial<ModeKeyElement>)
          "
        />
      </Field>

      <Field v-if="!element.inline" orientation="horizontal">
        <FieldLabel for="properties-mode-key-margin-top">{{
          $t(($) => $.toolbar.common.marginTop, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-mode-key-margin-top"
          class="w-28"
          unit="pt"
          :min="0"
          :max="maxHeight"
          :step="0.5"
          :model-value="element.marginTop"
          :format-options="fraction1FormatOptions"
          @update:model-value="
            $emit('update', { marginTop: $event } as Partial<ModeKeyElement>)
          "
        />
      </Field>

      <Field v-if="!element.inline" orientation="horizontal">
        <FieldLabel for="properties-mode-key-margin-bottom">{{
          $t(($) => $.toolbar.common.marginBottom, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-mode-key-margin-bottom"
          class="w-28"
          unit="pt"
          :min="0"
          :max="maxHeight"
          :step="0.5"
          :model-value="element.marginBottom"
          :format-options="fraction1FormatOptions"
          @update:model-value="
            $emit('update', { marginBottom: $event } as Partial<ModeKeyElement>)
          "
        />
      </Field>
    </PaneSection>

    <PaneSection
      value="initial-martyria"
      :title="$t(($) => $.menu.insert.initialMartyria, { ns: 'menu' })"
    >
      <Field v-if="!element.inline" orientation="horizontal">
        <Switch
          id="properties-mode-key-show-ambitus"
          :model-value="element.showAmbitus"
          @update:model-value="
            $emit('update', {
              showAmbitus: $event === true,
            } as Partial<ModeKeyElement>)
          "
        />
        <FieldLabel for="properties-mode-key-show-ambitus">{{
          $t(($) => $.toolbar.initialMartyria.showAmbitus, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>

      <Field orientation="horizontal">
        <Switch
          id="properties-mode-key-ignore-attractions"
          :model-value="element.ignoreAttractions"
          @update:model-value="
            $emit('update', {
              ignoreAttractions: $event === true,
            } as Partial<ModeKeyElement>)
          "
        />
        <FieldLabel for="properties-mode-key-ignore-attractions">{{
          $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>

      <Field
        v-if="element.mode === 3 || element.mode === 7"
        orientation="horizontal"
      >
        <Switch
          id="properties-mode-key-permanent-enharmonic-zo"
          :model-value="element.permanentEnharmonicZo"
          @update:model-value="
            $emit('update', {
              permanentEnharmonicZo: $event === true,
            } as Partial<ModeKeyElement>)
          "
        />
        <FieldLabel for="properties-mode-key-permanent-enharmonic-zo">{{
          $t(($) => $.toolbar.initialMartyria.permanentEnharmonicZo, {
            ns: 'toolbar',
          })
        }}</FieldLabel>
      </Field>
    </PaneSection>
  </PaneAccordion>
</template>

<script setup lang="ts">
import {
  PhTextAlignCenter,
  PhTextAlignLeft,
  PhTextAlignRight,
} from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import InitialMartyriaStyleSelect from '@/components/InitialMartyriaStyleSelect.vue';
import InputBpm from '@/components/InputBpm.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import PaneAccordion from '@/components/pane/PaneAccordion.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ModeKeyElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import {
  type InitialMartyriaStyle,
  resolveModeKeyInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { fraction1FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const props = defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
  openSections: {
    type: Array as PropType<string[]>,
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

const emit = defineEmits([
  'open-style-dialog',
  'update',
  'update:open-sections',
]);

// The controls reflect the resolved style (element overrides folded in); a
// change writes an explicit element value and clear restores inheritance.
const resolvedAppearance = computed(
  () =>
    resolveModeKeyInitialMartyriaStyle({
      element: props.element,
      pageSetup: props.pageSetup,
      paragraphStyles: props.paragraphStyles,
      initialMartyriaStyles: props.initialMartyriaStyles,
    }).mainAppearance,
);

const maxHeight = computed(() => Unit.toPt(props.pageSetup.innerPageHeight));

function onAlignmentChanged(value: unknown) {
  if (isTextBoxAlignment(value)) {
    emit('update', {
      alignment: value,
    } as Partial<ModeKeyElement>);
  }
}

function isTextBoxAlignment(value: unknown): value is TextBoxAlignment {
  return Object.values(TextBoxAlignment).includes(value as TextBoxAlignment);
}
</script>
