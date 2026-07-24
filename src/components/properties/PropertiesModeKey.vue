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
        <FieldLabel for="properties-mode-key-style">{{
          $t(($) => $.dialog.initialMartyriaStyles.styleLabel, {
            ns: 'dialog',
          })
        }}</FieldLabel>
        <Select v-model="modeKeyStyleValue">
          <SelectTrigger id="properties-mode-key-style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="inheritStyleValue">
              {{
                $t(($) => $.dialog.initialMartyriaStyles.documentDefault, {
                  ns: 'dialog',
                })
              }}
            </SelectItem>
            <SelectItem :value="standardStyleValue">
              {{
                $t(($) => $.dialog.initialMartyriaStyles.standard, {
                  ns: 'dialog',
                })
              }}
            </SelectItem>
            <SelectItem
              v-for="style in availableInitialMartyriaStyles"
              :key="style.id"
              :value="style.id"
            >
              {{ initialMartyriaStyleDisplayName(style) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <template v-if="usesStandardModeKey">
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
      </template>
    </PaneSection>

    <PaneSection
      value="positioning"
      :title="$t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' })"
    >
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
    </PaneSection>

    <PaneSection
      value="initial-martyria"
      :title="$t(($) => $.menu.insert.initialMartyria, { ns: 'menu' })"
    >
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
import { useTranslation } from 'i18next-vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import InputBpm from '@/components/InputBpm.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import PaneAccordion from '@/components/pane/PaneAccordion.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ModeKeyElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import {
  builtInInitialMartyriaStyles,
  getInitialMartyriaStyleDisplayName,
  type InitialMartyriaStyle,
  resolveInitialMartyriaStyleSelection,
} from '@/models/InitialMartyriaStyle';
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
  openSections: {
    type: Array as PropType<string[]>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  initialMartyriaStyles: {
    type: Array as PropType<InitialMartyriaStyle[]>,
    required: true,
  },
});

const { t } = useTranslation();
const emit = defineEmits(['update', 'update:open-sections']);

const inheritStyleValue = '__inherit__';
const standardStyleValue = '__standard__';
const availableInitialMartyriaStyles = computed(() => [
  ...builtInInitialMartyriaStyles,
  ...props.initialMartyriaStyles,
]);

function initialMartyriaStyleDisplayName(style: InitialMartyriaStyle) {
  return getInitialMartyriaStyleDisplayName(style, t);
}
const styleSelection = computed(() =>
  resolveInitialMartyriaStyleSelection({
    elementStyleId: props.element.initialMartyriaStyleId,
    pageStyleId: props.pageSetup.initialMartyriaStyleId,
    styles: props.initialMartyriaStyles,
  }),
);
const usesStandardModeKey = computed(
  () => styleSelection.value.kind === 'standard',
);
const modeKeyStyleValue = computed({
  get: () =>
    props.element.initialMartyriaStyleId === undefined
      ? inheritStyleValue
      : (props.element.initialMartyriaStyleId ?? standardStyleValue),
  set: (value: string) => {
    emit('update', {
      initialMartyriaStyleId:
        value === inheritStyleValue
          ? undefined
          : value === standardStyleValue
            ? null
            : value,
    } as Partial<ModeKeyElement>);
  },
});

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
