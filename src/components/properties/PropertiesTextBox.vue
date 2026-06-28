<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.insert.textBox, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <Field orientation="horizontal">
        <Switch
          id="properties-text-box-use-default-style"
          :model-value="element.useDefaultStyle"
          @update:model-value="
            $emit('update', {
              useDefaultStyle: $event === true,
            } as Partial<TextBoxElement>)
          "
        />
        <FieldLabel for="properties-text-box-use-default-style">{{
          $t(($) => $.toolbar.common.useDefaultStyle, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>

      <template v-if="!element.useDefaultStyle">
        <Field>
          <FieldLabel for="properties-text-box-font">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <FontCombobox
            id="properties-text-box-font"
            class="w-full max-w-full"
            :model-value="element.fontFamily"
            :options="textBoxFontFamilies"
            @update:model-value="onFontFamilyChanged"
          />
        </Field>

        <Field>
          <FieldLabel for="properties-text-box-font-style">{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <FontStyleSelect
            id="properties-text-box-font-style"
            class="w-full max-w-full"
            :model-value="element.fontStyle"
            :options="fontStyleOptions"
            :disabled="fontStyleOptions.length <= 1"
            @update:model-value="
              $emit('update', {
                fontStyle: $event,
              } as Partial<TextBoxElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-text-box-font-size">{{
            $t(($) => $.toolbar.initialMartyria.size, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputFontSize
            id="properties-text-box-font-size"
            :model-value="element.fontSize"
            @update:model-value="
              $emit('update', { fontSize: $event } as Partial<TextBoxElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-text-box-line-height">{{
            $t(($) => $.dialog.pageSetup.lineHeight, { ns: 'dialog' })
          }}</FieldLabel>
          <InputUnit
            id="properties-text-box-line-height"
            unit="unitless"
            :nullable="true"
            :min="0"
            :step="0.1"
            :model-value="element.lineHeight"
            :format-options="fraction2FormatOptions"
            placeholder="normal"
            @update:model-value="
              $emit('update', { lineHeight: $event } as Partial<TextBoxElement>)
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
              $emit('update', { color: $event } as Partial<TextBoxElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel>{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <ToggleGroup
            type="multiple"
            variant="outline"
            :model-value="styleValues"
            @update:model-value="onStyleValuesChanged"
          >
            <ToggleGroupItem
              value="bold"
              aria-label="Toggle bold"
              :disabled="!isFontStyleAxisToggleEnabled('bold')"
            >
              <PhTextB />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="italic"
              aria-label="Toggle italic"
              :disabled="!isFontStyleAxisToggleEnabled('italic')"
            >
              <PhTextItalic />
            </ToggleGroupItem>
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <PhTextUnderline />
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-text-box-outline">{{
            $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputStrokeWidth
            id="properties-text-box-outline"
            :model-value="element.strokeWidth"
            @update:model-value="
              $emit('update', {
                strokeWidth: $event,
              } as Partial<TextBoxElement>)
            "
          />
        </Field>
      </template>

      <Field v-else orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
        }}</FieldLabel>
        <ToggleGroup
          type="multiple"
          variant="outline"
          :model-value="styleValues"
          @update:model-value="onStyleValuesChanged"
        >
          <ToggleGroupItem value="underline" aria-label="Toggle underline">
            <PhTextUnderline />
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>

      <Field v-if="!element.multipanel" orientation="horizontal">
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

      <template v-if="!element.inline">
        <Field orientation="horizontal">
          <Switch
            id="properties-text-box-multipanel"
            :model-value="element.multipanel"
            @update:model-value="
              $emit('update', {
                multipanel: $event === true,
              } as Partial<TextBoxElement>)
            "
          />
          <FieldLabel for="properties-text-box-multipanel">{{
            $t(($) => $.toolbar.textbox.multipanel, { ns: 'toolbar' })
          }}</FieldLabel>
        </Field>

        <Field v-if="!element.multipanel" orientation="horizontal">
          <FieldLabel for="properties-text-box-height">{{
            $t(($) => $.toolbar.common.height, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputUnit
            id="properties-text-box-height"
            unit="pt"
            :nullable="true"
            :min="0.5"
            :max="maxWidth"
            :step="0.5"
            :model-value="element.customHeight"
            :format-options="fraction1FormatOptions"
            placeholder="auto"
            @update:model-value="
              $emit('update', {
                customHeight: $event,
              } as Partial<TextBoxElement>)
            "
          />
        </Field>
      </template>

      <template v-else>
        <Field orientation="horizontal">
          <FieldLabel for="properties-text-box-width">{{
            $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputUnit
            id="properties-text-box-width"
            unit="pt"
            :nullable="true"
            :min="0.5"
            :max="maxWidth"
            :step="0.5"
            :model-value="element.customWidth"
            :format-options="fraction1FormatOptions"
            placeholder="auto"
            @update:model-value="
              $emit('update', {
                customWidth: $event,
              } as Partial<TextBoxElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <Switch
            id="properties-text-box-fill-width"
            :model-value="element.fillWidth"
            @update:model-value="
              $emit('update', {
                fillWidth: $event === true,
              } as Partial<TextBoxElement>)
            "
          />
          <FieldLabel for="properties-text-box-fill-width">{{
            $t(($) => $.toolbar.textbox.fillWidth, { ns: 'toolbar' })
          }}</FieldLabel>
        </Field>
      </template>

      <Field orientation="horizontal">
        <FieldLabel for="properties-text-box-margin-top">{{
          $t(($) => $.toolbar.common.marginTop, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-text-box-margin-top"
          class="w-28"
          unit="pt"
          :min="-maxHeight"
          :max="maxHeight"
          :step="0.5"
          :model-value="element.marginTop"
          :format-options="fraction1FormatOptions"
          @update:model-value="
            $emit('update', { marginTop: $event } as Partial<TextBoxElement>)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-text-box-margin-bottom">{{
          $t(($) => $.toolbar.common.marginBottom, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-text-box-margin-bottom"
          class="w-28"
          unit="pt"
          :min="0"
          :max="maxHeight"
          :step="0.5"
          :model-value="element.marginBottom"
          :format-options="fraction1FormatOptions"
          @update:model-value="
            $emit('update', { marginBottom: $event } as Partial<TextBoxElement>)
          "
        />
      </Field>

      <template v-if="source === 'score'">
        <FieldSeparator />

        <FieldSet>
          <FieldLegend variant="label">{{
            $t(($) => $.toolbar.textbox.runningMarker, { ns: 'toolbar' })
          }}</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel for="properties-text-box-running-marker-role">{{
                $t(($) => $.toolbar.textbox.runningMarkerRole, {
                  ns: 'toolbar',
                })
              }}</FieldLabel>
              <Select
                :model-value="
                  element.runningMarkerRole ?? RUNNING_MARKER_NONE_VALUE
                "
                @update:model-value="onRunningMarkerRoleChanged"
              >
                <SelectTrigger id="properties-text-box-running-marker-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem :value="RUNNING_MARKER_NONE_VALUE">
                      {{ $t(($) => $.toolbar.common.none, { ns: 'toolbar' }) }}
                    </SelectItem>
                    <SelectItem value="chapter">
                      {{
                        $t(($) => $.toolbar.textbox.runningMarkerChapter, {
                          ns: 'toolbar',
                        })
                      }}
                    </SelectItem>
                    <SelectItem value="section">
                      {{
                        $t(($) => $.toolbar.textbox.runningMarkerSection, {
                          ns: 'toolbar',
                        })
                      }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel for="properties-text-box-running-marker-text">{{
                $t(($) => $.toolbar.textbox.runningMarkerText, {
                  ns: 'toolbar',
                })
              }}</FieldLabel>
              <Input
                id="properties-text-box-running-marker-text"
                :model-value="element.runningMarkerText ?? ''"
                :placeholder="
                  $t(($) => $.toolbar.textbox.runningMarkerTextPlaceholder, {
                    ns: 'toolbar',
                  })
                "
                @update:model-value="onRunningMarkerTextChanged"
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </template>
    </FieldGroup>
  </FieldSet>
</template>

<script setup lang="ts">
import {
  PhTextAlignCenter,
  PhTextAlignLeft,
  PhTextAlignRight,
  PhTextB,
  PhTextItalic,
  PhTextUnderline,
} from '@phosphor-icons/vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { TextBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { fontCatalog } from '@/services/FontCatalog';
import {
  fraction1FormatOptions,
  fraction2FormatOptions,
} from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const props = defineProps({
  element: {
    type: Object as PropType<TextBoxElement>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  source: {
    type: String as PropType<'score' | 'header-footer'>,
    required: true,
  },
});

const emit = defineEmits(['update']);

const {
  fontStyleOptions,
  activeStyleAxisValues,
  isFontStyleAxisToggleEnabled,
  applyStyleAxisToggles,
  remapStyleForFamily,
} = useFontStyleControls(
  () => props.element.fontFamily,
  () => props.element.fontStyle,
);

const styleValues = computed(() => [
  ...(props.element.useDefaultStyle ? [] : activeStyleAxisValues.value),
  ...(props.element.underline ? ['underline'] : []),
]);

const textBoxFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
const maxHeight = computed(() => Unit.toPt(props.pageSetup.innerPageHeight));
const RUNNING_MARKER_NONE_VALUE = '__none__';

function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  const update: Partial<TextBoxElement> = {
    underline: values.includes('underline'),
  };

  if (!props.element.useDefaultStyle) {
    update.fontStyle = applyStyleAxisToggles(values);
  }

  emit('update', update);
}

function onFontFamilyChanged(fontFamily: string) {
  emit('update', {
    fontFamily,
    fontStyle: remapStyleForFamily(fontFamily),
  } as Partial<TextBoxElement>);
}

function onAlignmentChanged(value: unknown) {
  if (isTextBoxAlignment(value)) {
    emit('update', {
      alignment: value,
    } as Partial<TextBoxElement>);
  }
}

function onRunningMarkerRoleChanged(value: AcceptableValue) {
  emit('update', {
    runningMarkerRole:
      value === RUNNING_MARKER_NONE_VALUE || value == null
        ? null
        : (value as TextBoxElement['runningMarkerRole']),
  } as Partial<TextBoxElement>);
}

function onRunningMarkerTextChanged(value: string | number) {
  const text = String(value);

  emit('update', {
    runningMarkerText: text.trim() === '' ? null : text,
  } as Partial<TextBoxElement>);
}

function isTextBoxAlignment(value: unknown): value is TextBoxAlignment {
  return Object.values(TextBoxAlignment).includes(value as TextBoxAlignment);
}
</script>
