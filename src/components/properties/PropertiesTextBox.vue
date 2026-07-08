<template>
  <PaneAccordion
    :open-sections="openSections"
    @update:open-sections="$emit('update:open-sections', $event)"
  >
    <template #legend>{{
      $t(($) => $.menu.insert.textBox, { ns: 'menu' })
    }}</template>

    <PaneSection
      value="style"
      :title="$t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })"
    >
      <ParagraphStyleField
        id="properties-text-box-paragraph-style"
        :model-value="element.paragraphStyleId"
        :paragraph-styles="paragraphStyles"
        :has-overrides="hasParagraphStyleOverrides"
        @update:model-value="
          $emit('update', {
            paragraphStyleId: $event,
          } as Partial<TextBoxElement>)
        "
        @clear="clearParagraphStyleFormatting"
        @open-dialog="openParagraphStylesDialog"
      />

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-text-box-font">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <ParagraphStyleClearButton
            :disabled="element.fontFamily == null"
            @clear="
              $emit('update', { fontFamily: null } as Partial<TextBoxElement>)
            "
          />
        </div>
        <FontCombobox
          id="properties-text-box-font"
          class="w-full max-w-full"
          :model-value="resolvedParagraphStyle.fontFamily"
          :options="textBoxFontFamilies"
          @update:model-value="onFontFamilyChanged"
        />
      </Field>

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-text-box-font-style">{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <ParagraphStyleClearButton
            :disabled="element.fontStyle == null"
            @clear="
              $emit('update', { fontStyle: null } as Partial<TextBoxElement>)
            "
          />
        </div>
        <FontStyleSelect
          id="properties-text-box-font-style"
          class="w-full max-w-full"
          :model-value="resolvedParagraphStyle.fontStyle"
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
        <div class="flex items-center gap-1">
          <InputFontSize
            id="properties-text-box-font-size"
            :model-value="resolvedParagraphStyle.fontSize"
            @update:model-value="
              $emit('update', { fontSize: $event } as Partial<TextBoxElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.fontSize == null"
            @clear="
              $emit('update', { fontSize: null } as Partial<TextBoxElement>)
            "
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-text-box-line-height">{{
          $t(($) => $.dialog.pageSetup.lineHeight, { ns: 'dialog' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <InputUnit
            id="properties-text-box-line-height"
            unit="unitless"
            :nullable="true"
            :min="0"
            :step="0.1"
            :model-value="resolvedParagraphStyle.lineHeight"
            :format-options="fraction2FormatOptions"
            placeholder="normal"
            @update:model-value="
              $emit('update', { lineHeight: $event } as Partial<TextBoxElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.lineHeight === undefined"
            @clear="
              $emit('update', {
                lineHeight: undefined,
              } as Partial<TextBoxElement>)
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
            :model-value="resolvedParagraphStyle.color"
            @update:model-value="
              $emit('update', { color: $event } as Partial<TextBoxElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.color == null"
            @clear="$emit('update', { color: null } as Partial<TextBoxElement>)"
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
        }}</FieldLabel>
        <ToggleGroup
          type="multiple"
          variant="outline"
          :model-value="activeStyleAxisValues"
          @update:model-value="onFontStyleValuesChanged"
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
        </ToggleGroup>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.toolbar.richTextBox.textDecorations, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <ToggleGroup
            type="multiple"
            variant="outline"
            :model-value="underlineValues"
            @update:model-value="onTextDecorationValuesChanged"
          >
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <PhTextUnderline />
            </ToggleGroupItem>
          </ToggleGroup>
          <ParagraphStyleClearButton
            :disabled="element.underline == null"
            @clear="
              $emit('update', { underline: null } as Partial<TextBoxElement>)
            "
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-text-box-outline">{{
          $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <InputStrokeWidth
            id="properties-text-box-outline"
            :model-value="resolvedParagraphStyle.strokeWidth"
            @update:model-value="
              $emit('update', {
                strokeWidth: $event,
              } as Partial<TextBoxElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.strokeWidth == null"
            @clear="
              $emit('update', { strokeWidth: null } as Partial<TextBoxElement>)
            "
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.dialog.pageSetup.outlineColor, { ns: 'dialog' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <ColorPicker
            :model-value="strokeColorPickerValue"
            :disabled="strokeColorSameAsText"
            @update:model-value="
              $emit('update', {
                strokeColor: $event,
              } as Partial<TextBoxElement>)
            "
          />
          <div class="flex items-center gap-2">
            <Switch
              :model-value="strokeColorSameAsText"
              @update:model-value="onStrokeColorSameAsTextChanged"
            />
            <span class="text-sm text-muted-foreground">
              {{ $t(($) => $.dialog.pageSetup.sameAsText, { ns: 'dialog' }) }}
            </span>
          </div>
          <ParagraphStyleClearButton
            :disabled="element.strokeColor == null"
            @clear="
              $emit('update', { strokeColor: null } as Partial<TextBoxElement>)
            "
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-text-box-gap-above">{{
          $t(($) => $.toolbar.common.marginTop, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-text-box-gap-above"
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
        <FieldLabel for="properties-text-box-gap-below">{{
          $t(($) => $.toolbar.common.marginBottom, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-text-box-gap-below"
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

      <Field v-if="!element.multipanel" orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.toolbar.common.alignment, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            :model-value="currentAlignment"
            @update:model-value="onAlignmentChanged"
          >
            <AppTooltip
              :tooltip="
                $t(($) => $.toolbar.common.alignLeft, { ns: 'toolbar' })
              "
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
              :tooltip="
                $t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })
              "
            >
              <ToggleGroupItem :value="TextBoxAlignment.Right">
                <PhTextAlignRight />
              </ToggleGroupItem>
            </AppTooltip>
            <AppTooltip
              :tooltip="
                $t(($) => $.toolbar.common.alignJustify, { ns: 'toolbar' })
              "
            >
              <ToggleGroupItem :value="TextBoxAlignment.Justify">
                <PhTextAlignJustify />
              </ToggleGroupItem>
            </AppTooltip>
          </ToggleGroup>
          <ParagraphStyleClearButton
            :disabled="element.alignment == null"
            @clear="
              $emit('update', { alignment: null } as Partial<TextBoxElement>)
            "
          />
        </div>
      </Field>
    </PaneSection>

    <PaneSection
      value="positioning"
      :title="$t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' })"
    >
      <Field v-if="!element.inline" orientation="horizontal">
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

      <template v-if="!element.inline">
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
    </PaneSection>

    <PaneSection
      v-if="source === 'score'"
      value="running-marker"
      :title="$t(($) => $.toolbar.textbox.runningMarker, { ns: 'toolbar' })"
    >
      <Field>
        <FieldLabel for="properties-text-box-running-marker-role">{{
          $t(($) => $.toolbar.textbox.runningMarkerRole, {
            ns: 'toolbar',
          })
        }}</FieldLabel>
        <Select
          :model-value="element.runningMarkerRole ?? RUNNING_MARKER_NONE_VALUE"
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
    </PaneSection>
  </PaneAccordion>
</template>

<script setup lang="ts">
import {
  PhTextAlignCenter,
  PhTextAlignJustify,
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
import PaneAccordion from '@/components/pane/PaneAccordion.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import ParagraphStyleField from '@/components/properties/ParagraphStyleField.vue';
import { Field, FieldLabel } from '@/components/ui/field';
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
import { useResolvedParagraphStyle } from '@/composables/useResolvedParagraphStyle';
import type { TextBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import {
  isTextBoxAlignment,
  type ParagraphStyle,
} from '@/models/ParagraphStyle';
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
  source: {
    type: String as PropType<'score' | 'header-footer'>,
    required: true,
  },
});

const emit = defineEmits([
  'open-paragraph-styles-dialog',
  'update',
  'update:open-sections',
]);

const {
  resolvedParagraphStyle,
  underlineValues,
  hasOverrides: hasParagraphStyleOverrides,
} = useResolvedParagraphStyle(
  () => props.paragraphStyles,
  () => props.element.paragraphStyleId,
  () => props.element.getParagraphStyleOverrides(),
);

const {
  fontStyleOptions,
  activeStyleAxisValues,
  isFontStyleAxisToggleEnabled,
  applyStyleAxisToggles,
  remapStyleForFamily,
} = useFontStyleControls(
  () => resolvedParagraphStyle.value.fontFamily,
  () => resolvedParagraphStyle.value.fontStyle,
);

const currentAlignment = computed(() => resolvedParagraphStyle.value.alignment);
const strokeColorPickerValue = computed(() =>
  resolvedParagraphStyle.value.strokeColor === 'currentcolor'
    ? resolvedParagraphStyle.value.color
    : resolvedParagraphStyle.value.strokeColor,
);
const strokeColorSameAsText = computed(
  () => resolvedParagraphStyle.value.strokeColor === 'currentcolor',
);

const textBoxFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
const maxHeight = computed(() => Unit.toPt(props.pageSetup.innerPageHeight));
const RUNNING_MARKER_NONE_VALUE = '__none__';

function onFontStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  emit('update', {
    fontStyle: applyStyleAxisToggles(values),
  } as Partial<TextBoxElement>);
}

function onTextDecorationValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    underline: values.includes('underline'),
  } as Partial<TextBoxElement>);
}

function onFontFamilyChanged(fontFamily: string) {
  emit('update', {
    fontFamily,
    fontStyle: remapStyleForFamily(fontFamily),
  } as Partial<TextBoxElement>);
}

function onStrokeColorSameAsTextChanged(value: boolean | 'indeterminate') {
  if (value === true) {
    emit('update', {
      strokeColor: 'currentcolor',
    } as Partial<TextBoxElement>);
    return;
  }

  if (resolvedParagraphStyle.value.strokeColor === 'currentcolor') {
    emit('update', {
      strokeColor: resolvedParagraphStyle.value.color,
    } as Partial<TextBoxElement>);
  }
}

function clearParagraphStyleFormatting() {
  emit('update', {
    alignment: null,
    color: null,
    fontFamily: null,
    fontSize: null,
    fontStyle: null,
    lineHeight: undefined,
    underline: null,
    strokeWidth: null,
    strokeColor: null,
  } as Partial<TextBoxElement>);
}

function openParagraphStylesDialog() {
  emit('open-paragraph-styles-dialog', props.element.paragraphStyleId);
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
</script>
