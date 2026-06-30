<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.insert.initialMartyria, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <Field orientation="horizontal">
        <Switch
          id="properties-mode-key-use-default-style"
          :model-value="element.useDefaultStyle"
          @update:model-value="
            $emit('update', {
              useDefaultStyle: $event === true,
            } as Partial<ModeKeyElement>)
          "
        />
        <FieldLabel for="properties-mode-key-use-default-style">{{
          $t(($) => $.toolbar.common.useDefaultStyle, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>

      <template v-if="!element.useDefaultStyle">
        <Field orientation="horizontal">
          <FieldLabel for="properties-mode-key-font-size">{{
            $t(($) => $.toolbar.initialMartyria.size, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputFontSize
            id="properties-mode-key-font-size"
            :model-value="element.fontSize"
            @update:model-value="
              $emit('update', { fontSize: $event } as Partial<ModeKeyElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel>{{
            $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
          }}</FieldLabel>
          <ColorPicker
            :model-value="element.color"
            @update:model-value="
              $emit('update', { color: $event } as Partial<ModeKeyElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-mode-key-outline">{{
            $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputStrokeWidth
            id="properties-mode-key-outline"
            :model-value="element.strokeWidth"
            @update:model-value="
              $emit('update', {
                strokeWidth: $event,
              } as Partial<ModeKeyElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-mode-key-height-adjustment">{{
            $t(($) => $.toolbar.initialMartyria.heightAdjustment, {
              ns: 'toolbar',
            })
          }}</FieldLabel>
          <InputUnit
            id="properties-mode-key-height-adjustment"
            unit="pt"
            :min="heightAdjustmentMin"
            :max="heightAdjustmentMax"
            :step="0.5"
            :format-options="fraction2FormatOptions"
            :model-value="element.heightAdjustment"
            @update:model-value="
              $emit('update', {
                heightAdjustment: $event,
              } as Partial<ModeKeyElement>)
            "
          />
        </Field>
      </template>

      <Field orientation="horizontal">
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

      <Field orientation="horizontal">
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

      <Field orientation="horizontal">
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

      <Field orientation="horizontal">
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
    </FieldGroup>
  </FieldSet>
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
import InputBpm from '@/components/InputBpm.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ModeKeyElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import {
  fraction1FormatOptions,
  fraction2FormatOptions,
} from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const props = defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const emit = defineEmits(['update']);

const heightAdjustmentMin = computed(
  () => -Math.round(Unit.fromPt(props.element.height)),
);
const heightAdjustmentMax = computed(() =>
  Unit.toPt(props.pageSetup.pageHeight),
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
