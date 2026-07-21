<template>
  <div ref="panelRoot" class="contents">
    <PaneSection
      value="style"
      :title="$t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })"
    >
      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel :for="`${idPrefix}-paragraph-style`">{{
            $t(($) => $.toolbar.common.paragraphStyle, { ns: 'toolbar' })
          }}</FieldLabel>
          <div class="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              @click="openParagraphStylesDialog"
            >
              <PhTextAa />
              {{
                $t(($) => $.dialog.paragraphStyles.openDialog, { ns: 'dialog' })
              }}
            </Button>
            <ParagraphStyleClearButton
              :disabled="!hasParagraphStyleOverrides"
              @clear="clearParagraphStyleFormatting"
            />
          </div>
        </div>
        <ParagraphStyleSelect
          :id="`${idPrefix}-paragraph-style`"
          :model-value="paragraphStyleValue"
          :paragraph-styles="paragraphStyles"
          :disabled="!isCommandEnabled('style')"
          :disabled-style-ids="disabledParagraphStyleIds"
          show-none-option
          :show-mixed-option="
            paragraphStyleValue === PARAGRAPH_STYLE_MIXED_VALUE
          "
          rich-text-portal
          @update:model-value="onParagraphStyleChanged"
          @update:open="
            $event
              ? beginSelectionGuard(element)
              : endSelectionGuard(element, { refocus: true })
          "
        />
      </Field>

      <Field>
        <div class="flex min-h-6 items-center justify-between gap-2">
          <FieldLabel :for="`${idPrefix}-font`">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <!--
          Keep the action mounted so controls do not shift when formatting is
          removed; disable it when there is no explicit value to clear.
        -->
          <ParagraphStyleClearButton
            :disabled="
              !isCommandEnabled('fontFamily') ||
              fontFamilyValue === RICH_TEXT_DEFAULT_FONT_FAMILY
            "
            @clear="onFontFamilyChanged(RICH_TEXT_DEFAULT_FONT_FAMILY)"
          />
        </div>
        <FontCombobox
          :id="`${idPrefix}-font`"
          class="w-full max-w-full"
          :model-value="fontFamilyValue"
          :options="fontFamilyOptions"
          :selected-label-class="
            fontFamilyValue === RICH_TEXT_DEFAULT_FONT_FAMILY
              ? 'text-muted-foreground'
              : undefined
          "
          :disabled="!isCommandEnabled('fontFamily')"
          rich-text-portal
          @update:model-value="onFontFamilyChanged"
          @update:open="
            $event
              ? beginSelectionGuard(element)
              : endSelectionGuard(element, { refocus: true })
          "
        />
      </Field>

      <Field>
        <div class="flex min-h-6 items-center justify-between gap-2">
          <FieldLabel :for="`${idPrefix}-font-style`">{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <ParagraphStyleClearButton
            :disabled="
              !isCommandEnabled('fontStyle') || !fontStyleHasExplicitValue
            "
            @clear="clearFontStyleOverride"
          />
        </div>
        <FontStyleSelect
          :id="`${idPrefix}-font-style`"
          class="w-full max-w-full"
          :model-value="fontStyleValue"
          :options="fontStyleOptions"
          :disabled="fontStyleDisabled"
          rich-text-portal
          @update:model-value="onFontStyleChanged"
          @update:open="
            $event
              ? beginSelectionGuard(element)
              : endSelectionGuard(element, { refocus: true })
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.toolbar.richTextBox.textDecorations, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex flex-wrap items-center gap-1">
          <ToggleGroup
            type="single"
            variant="outline"
            :model-value="textDecorationValues[0]"
            @update:model-value="onTextDecorationValuesChanged"
          >
            <ToggleGroupItem
              value="underline"
              :aria-label="
                $t(($) => $.toolbar.richTextBox.underline, { ns: 'toolbar' })
              "
              :disabled="!isStyleToggleEnabled('underline')"
              @mousedown.prevent
            >
              <PhTextUnderline />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel :for="`${idPrefix}-font-size`">{{
          $t(($) => $.toolbar.initialMartyria.size, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex shrink-0 items-center gap-1">
          <InputFontSize
            :id="`${idPrefix}-font-size`"
            class="w-36"
            :model-value="fontSizeValue"
            :disabled="!isCommandEnabled('fontSize')"
            nullable
            :placeholder="fontSizePlaceholder"
            :default-value="resolvedActiveParagraphStyle.fontSize"
            @update:model-value="onFontSizeChanged"
            @focus-within="beginSelectionGuard(element)"
            @blur-within="endSelectionGuard(element, { refocus: false })"
          />
          <ParagraphStyleClearButton
            :disabled="!isCommandEnabled('fontSize') || fontSizeValue == null"
            @clear="onFontSizeChanged(null)"
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel :for="`${idPrefix}-font-color`">{{
          $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
        }}</FieldLabel>
        <div class="flex shrink-0 items-center gap-1">
          <ColorPicker
            :id="`${idPrefix}-font-color`"
            :model-value="fontColorValue"
            :disabled="!isCommandEnabled('fontColor')"
            rich-text-portal
            @update:model-value="onFontColorChanged"
            @update:open="
              $event
                ? beginSelectionGuard(element)
                : endSelectionGuard(element, { refocus: true })
            "
          />
          <ParagraphStyleClearButton
            :disabled="
              !isCommandEnabled('fontColor') || !fontColorHasExplicitValue
            "
            @clear="onFontColorChanged(null)"
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.toolbar.common.alignment, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <ToggleGroup
            type="single"
            variant="outline"
            :model-value="alignmentValue"
            @update:model-value="onAlignmentChanged"
          >
            <AppTooltip
              :tooltip="
                $t(($) => $.toolbar.common.alignLeft, { ns: 'toolbar' })
              "
            >
              <ToggleGroupItem
                value="left"
                :disabled="!isCommandEnabled('alignment')"
                @mousedown.prevent
              >
                <PhTextAlignLeft />
              </ToggleGroupItem>
            </AppTooltip>
            <AppTooltip
              :tooltip="
                $t(($) => $.toolbar.common.alignCenter, { ns: 'toolbar' })
              "
            >
              <ToggleGroupItem
                value="center"
                :disabled="!isCommandEnabled('alignment')"
                @mousedown.prevent
              >
                <PhTextAlignCenter />
              </ToggleGroupItem>
            </AppTooltip>
            <AppTooltip
              :tooltip="
                $t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })
              "
            >
              <ToggleGroupItem
                value="right"
                :disabled="!isCommandEnabled('alignment')"
                @mousedown.prevent
              >
                <PhTextAlignRight />
              </ToggleGroupItem>
            </AppTooltip>
            <AppTooltip
              :tooltip="
                $t(($) => $.toolbar.common.alignJustify, { ns: 'toolbar' })
              "
            >
              <ToggleGroupItem
                value="justify"
                :disabled="!isCommandEnabled('alignment')"
                @mousedown.prevent
              >
                <PhTextAlignJustify />
              </ToggleGroupItem>
            </AppTooltip>
          </ToggleGroup>
          <ParagraphStyleClearButton
            :disabled="
              !isCommandEnabled('alignment') || !alignmentHasExplicitValue
            "
            @clear="clearAlignmentOverride"
          />
        </div>
      </Field>

      <Field>
        <FieldLabel :for="`${idPrefix}-language`">
          {{ $t(($) => $.dialog.preferences.language, { ns: 'dialog' }) }}
        </FieldLabel>
        <Select
          :model-value="languageSelectValue"
          :disabled="!isCommandEnabled('textPartLanguage')"
          @update:model-value="onLanguageChanged"
          @update:open="
            $event
              ? beginSelectionGuard(element)
              : endSelectionGuard(element, { refocus: true })
          "
        >
          <SelectTrigger :id="`${idPrefix}-language`" class="w-full">
            <SelectValue
              :placeholder="
                $t(($) => $.dialog.preferences.languageSystemDefault, {
                  ns: 'dialog',
                })
              "
            />
          </SelectTrigger>
          <RichTextSelectContent>
            <SelectGroup>
              <SelectItem :value="RICH_TEXT_NO_LANGUAGE_VALUE">
                {{
                  $t(($) => $.dialog.preferences.languageSystemDefault, {
                    ns: 'dialog',
                  })
                }}
              </SelectItem>
              <SelectItem
                v-for="language in languageOptions"
                :key="language.value"
                :value="language.value"
                :text-value="language.title"
              >
                {{ language.title }}
              </SelectItem>
            </SelectGroup>
          </RichTextSelectContent>
        </Select>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.toolbar.richTextBox.position, { ns: 'toolbar' })
        }}</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          :model-value="positionValue"
          @update:model-value="onPositionValueChanged"
        >
          <ToggleGroupItem
            value="subscript"
            :aria-label="
              $t(($) => $.toolbar.richTextBox.subscript, { ns: 'toolbar' })
            "
            :disabled="!isCommandEnabled('subscript')"
            @mousedown.prevent
          >
            <PhTextSubscript />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="superscript"
            :aria-label="
              $t(($) => $.toolbar.richTextBox.superscript, { ns: 'toolbar' })
            "
            :disabled="!isCommandEnabled('superscript')"
            @mousedown.prevent
          >
            <PhTextSuperscript />
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>

      <!--
        The controls reflect the effective value (an explicit selection
        attribute, or the active paragraph style's value); a change writes an
        explicit value and clear restores style inheritance.
      -->
      <FontVariantFields
        :id-prefix="idPrefix"
        :caps="fontVariantEffectiveValue(FONT_VARIANT_CAPS)"
        :numeric="fontVariantEffectiveValue(FONT_VARIANT_NUMERIC)"
        :ligatures="fontVariantEffectiveValue(FONT_VARIANT_LIGATURES)"
        :caps-enabled="isCommandEnabled(FONT_VARIANT_CAPS)"
        :numeric-enabled="isCommandEnabled(FONT_VARIANT_NUMERIC)"
        :ligatures-enabled="isCommandEnabled(FONT_VARIANT_LIGATURES)"
        :caps-clearable="fontVariantHasExplicitValue(FONT_VARIANT_CAPS)"
        :numeric-clearable="fontVariantHasExplicitValue(FONT_VARIANT_NUMERIC)"
        :ligatures-clearable="
          fontVariantHasExplicitValue(FONT_VARIANT_LIGATURES)
        "
        @change="applyFontVariant"
        @clear="clearFontVariant"
      />
    </PaneSection>

    <PaneSection
      v-if="isNeumeSelected"
      value="neume-attributes"
      :title="
        $t(($) => $.toolbar.richTextBox.neumeAttributes, { ns: 'toolbar' })
      "
    >
      <template v-if="neumeType === 'martyria'">
        <Field>
          <FieldLabel :for="neumeFieldId('martyria-note')" @mousedown.prevent>
            {{
              $t(($) => $.toolbar.richTextBox.martyriaNote, {
                ns: 'toolbar',
              })
            }}
          </FieldLabel>
          <Select
            :model-value="neumeMartyriaNote"
            @update:model-value="onNeumeMartyriaNoteChanged"
          >
            <SelectTrigger :id="neumeFieldId('martyria-note')" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <RichTextSelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="note in martyriaNotes"
                  :key="note.key"
                  :value="note.key"
                >
                  {{ $t(note.displayName, { ns: 'model' }) }}
                </SelectItem>
              </SelectGroup>
            </RichTextSelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel
            :for="neumeFieldId('martyria-root-sign')"
            @mousedown.prevent
          >
            {{
              $t(($) => $.toolbar.richTextBox.martyriaSign, {
                ns: 'toolbar',
              })
            }}
          </FieldLabel>
          <Select
            :model-value="neumeMartyriaRootSign"
            @update:model-value="onNeumeMartyriaRootSignChanged"
          >
            <SelectTrigger
              :id="neumeFieldId('martyria-root-sign')"
              class="w-full"
            >
              <SelectValue>
                <span v-if="selectedMartyriaRootSign" class="root-sign-option">
                  <span class="root-sign-glyph" :style="neumeGlyphStyle">{{
                    selectedMartyriaRootSign.glyph
                  }}</span>
                  <span class="root-sign-name">{{
                    $t(selectedMartyriaRootSign.name, { ns: 'model' })
                  }}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <RichTextSelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="rootSign in martyriaRootSigns"
                  :key="rootSign.key"
                  :value="rootSign.key"
                  :text-value="$t(rootSign.name, { ns: 'model' })"
                >
                  <span class="root-sign-option">
                    <span class="root-sign-glyph" :style="neumeGlyphStyle">{{
                      rootSign.glyph
                    }}</span>
                    <span class="root-sign-name">{{
                      $t(rootSign.name, { ns: 'model' })
                    }}</span>
                  </span>
                </SelectItem>
              </SelectGroup>
            </RichTextSelectContent>
          </Select>
        </Field>
      </template>

      <Field orientation="horizontal">
        <Switch
          :id="neumeFieldId('align-right')"
          :model-value="neumeAlignRight"
          @mousedown.prevent
          @update:model-value="onNeumeAlignRightChanged"
        />
        <FieldLabel :for="neumeFieldId('align-right')" @mousedown.prevent>
          {{ $t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' }) }}
        </FieldLabel>
      </Field>

      <Field v-if="neumeAlignRight" orientation="horizontal">
        <FieldLabel :for="neumeFieldId('right')">{{
          $t(($) => $.dialog.common.right, { ns: 'dialog' })
        }}</FieldLabel>
        <InputUnit
          :id="neumeFieldId('right')"
          class="w-28"
          unit="unitless"
          :model-value="neumeRight"
          :step="0.05"
          :format-options="fraction3FormatOptions"
          @update:model-value="updateNeumeNumberAttribute('right', $event)"
        />
      </Field>

      <Field v-else orientation="horizontal">
        <FieldLabel :for="neumeFieldId('left')">{{
          $t(($) => $.dialog.common.left, { ns: 'dialog' })
        }}</FieldLabel>
        <InputUnit
          :id="neumeFieldId('left')"
          class="w-28"
          unit="unitless"
          :model-value="neumeLeft"
          :step="0.05"
          :format-options="fraction3FormatOptions"
          @update:model-value="updateNeumeNumberAttribute('left', $event)"
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel :for="neumeFieldId('top')">{{
          $t(($) => $.dialog.common.top, { ns: 'dialog' })
        }}</FieldLabel>
        <InputUnit
          :id="neumeFieldId('top')"
          class="w-28"
          unit="unitless"
          :model-value="neumeTop"
          :step="0.05"
          :format-options="fraction3FormatOptions"
          @update:model-value="updateNeumeNumberAttribute('top', $event)"
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel :for="neumeFieldId('width')">{{
          $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          :id="neumeFieldId('width')"
          class="w-28"
          unit="unitless"
          :nullable="true"
          :min="0"
          :model-value="neumeWidth"
          :step="0.05"
          :format-options="fraction3FormatOptions"
          placeholder="auto"
          @update:model-value="updateNeumeAttributes({ width: $event })"
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel :for="neumeFieldId('font-size')">{{
          $t(($) => $.toolbar.richTextBox.neumeFontSize, {
            ns: 'toolbar',
          })
        }}</FieldLabel>
        <InputUnit
          :id="neumeFieldId('font-size')"
          class="w-28"
          unit="unitless"
          :min="0"
          :model-value="neumeFontSize"
          :step="0.05"
          :format-options="fraction3FormatOptions"
          @update:model-value="
            updateNeumeNumberAttribute('neumeFontSize', $event, 1)
          "
        />
      </Field>

      <Field v-if="neumeType === 'plagal'" orientation="horizontal">
        <FieldLabel :for="neumeFieldId('line-height')">{{
          $t(($) => $.dialog.pageSetup.lineHeight, {
            ns: 'dialog',
          })
        }}</FieldLabel>
        <InputUnit
          :id="neumeFieldId('line-height')"
          class="w-28"
          unit="unitless"
          :min="0"
          :model-value="neumeLineHeight"
          :step="0.05"
          :format-options="fraction3FormatOptions"
          @update:model-value="
            updateNeumeNumberAttribute('neumeLineHeight', $event, 1)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel :for="neumeFieldId('kerning-left')">{{
          $t(($) => $.toolbar.richTextBox.kerningLeft, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          :id="neumeFieldId('kerning-left')"
          class="w-28"
          unit="unitless"
          :model-value="neumeKerningLeft"
          :step="0.05"
          :format-options="fraction3FormatOptions"
          @update:model-value="
            updateNeumeNumberAttribute('kerningLeft', $event)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel :for="neumeFieldId('kerning-right')">{{
          $t(($) => $.toolbar.richTextBox.kerningRight, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          :id="neumeFieldId('kerning-right')"
          class="w-28"
          unit="unitless"
          :model-value="neumeKerningRight"
          :step="0.05"
          :format-options="fraction3FormatOptions"
          @update:model-value="
            updateNeumeNumberAttribute('kerningRight', $event)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel @mousedown.prevent>{{
          $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
        }}</FieldLabel>
        <ColorPicker
          :model-value="neumeColor"
          :default-colors="neumeDefaultColors"
          history-key="richTextNeumeColorPicker_presetColors"
          rich-text-portal
          @update:model-value="updateNeumeAttributes({ color: $event })"
        />
      </Field>
    </PaneSection>
  </div>
</template>

<script setup lang="ts">
import {
  PhTextAa,
  PhTextAlignCenter,
  PhTextAlignJustify,
  PhTextAlignLeft,
  PhTextAlignRight,
  PhTextSubscript,
  PhTextSuperscript,
  PhTextUnderline,
} from '@phosphor-icons/vue';
import type { AcceptableValue } from 'reka-ui';
import { computed, ref } from 'vue';

import type { InsertNeumeType } from '@/ckeditor-plugins/insertneume/insertneumeediting';
import { UPDATE_NEUME_ATTRIBUTES_COMMAND } from '@/ckeditor-plugins/insertneume/updateneumeattributescommand';
import AppTooltip from '@/components/AppTooltip.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputUnit from '@/components/InputUnit.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import FontVariantFields from '@/components/properties/FontVariantFields.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import RichTextSelectContent from '@/components/RichTextSelectContent.vue';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  execForOwner,
  useActiveEditorForOwner,
  useEditorCommandObservableState,
} from '@/composables/useRichTextEditorRegistry';
import {
  attachFocusZone,
  beginSelectionGuard,
  endSelectionGuard,
} from '@/composables/useRichTextSelectionGuard';
import {
  PARAGRAPH_STYLE_MIXED_VALUE,
  PARAGRAPH_STYLE_NONE_VALUE,
  useRichTextStyleCommands,
} from '@/composables/useRichTextStyleCommands';
import { supportedLocales } from '@/i18n';
import type { AnnotationElement, RichTextBoxElement } from '@/models/Element';
import {
  getNoteLabelSelector,
  ROOT_SIGN_LABEL_SELECTORS,
} from '@/models/NeumeI18nMappings';
import { Note, RootSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import {
  type ParagraphStyle,
  type ResolvedParagraphStyle,
} from '@/models/ParagraphStyle';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { RICH_TEXT_DEFAULT_FONT_FAMILY } from '@/utils/fontConstants';
import {
  FONT_VARIANT_CAPS,
  FONT_VARIANT_LIGATURES,
  FONT_VARIANT_NUMERIC,
} from '@/utils/fontVariants';
import { fraction3FormatOptions } from '@/utils/numberFormatOptions';
import {
  RICH_TEXT_LANGUAGE_OPTIONS,
  RICH_TEXT_NO_LANGUAGE_VALUE,
} from '@/utils/richTextLanguage';

const props = defineProps<{
  idPrefix: string;
  element: AnnotationElement | RichTextBoxElement;
  fonts: string[];
  pageSetup: PageSetup;
  paragraphStyles: ParagraphStyle[];
  fallbackParagraphStyleId: string;
  fallbackParagraphStyle: ResolvedParagraphStyle;
}>();

const emit = defineEmits<{
  'open-paragraph-styles-dialog': [styleId: string];
}>();

const {
  fontFamilyValue,
  fontFamilyOptions,
  paragraphStyleValue,
  disabledParagraphStyleIds,
  resolvedActiveParagraphStyle,
  fontStyleValue,
  fontStyleOptions,
  fontStyleDisabled,
  textDecorationValues,
  fontSizeValue,
  fontSizePlaceholder,
  fontColorValue,
  fontColorHasExplicitValue,
  fontStyleHasExplicitValue,
  alignmentHasExplicitValue,
  hasParagraphStyleOverrides,
  alignmentValue,
  isCommandEnabled,
  isCommandActive,
  isStyleToggleEnabled,
  commandValue,
  runCommand,
  fontVariantEffectiveValue,
  fontVariantHasExplicitValue,
  applyFontVariant,
  clearFontVariant,
  onParagraphStyleChanged,
  onFontFamilyChanged,
  onFontStyleChanged,
  onFontSizeChanged,
  onFontColorChanged,
  clearFontStyleOverride,
  clearAlignmentOverride,
  onTextDecorationValuesChanged,
  onAlignmentChanged,
  clearParagraphStyleFormatting,
} = useRichTextStyleCommands(props, [
  'subscript',
  'superscript',
  'textPartLanguage',
]);

const scopedEditor = useActiveEditorForOwner(() => props.element);

// Keep the editor logically focused while focus is in this panel or the shared
// dropdown portal, and show the selection marker while a styling control is
// engaged. Neume-attribute controls rely on the focus zone alone (no marker).
const panelRoot = ref<HTMLElement | null>(null);
attachFocusZone(() => props.element, panelRoot);

const richTextLanguageFallbackNames: Record<string, string> = {
  ar: 'العربية',
};
const supportedLocaleNameByCode = new Map<string, string>(
  supportedLocales.map((locale) => [locale.code, locale.name]),
);

const languageSelectValue = computed(() => {
  const value = commandValue('textPartLanguage');

  return typeof value === 'string' ? value : RICH_TEXT_NO_LANGUAGE_VALUE;
});

const languageOptions = computed(() =>
  RICH_TEXT_LANGUAGE_OPTIONS.map((language) => ({
    ...language,
    title:
      supportedLocaleNameByCode.get(language.languageCode) ??
      richTextLanguageFallbackNames[language.languageCode] ??
      language.title,
    value: `${language.languageCode}:${language.textDirection}`,
  })),
);

const currentDialogParagraphStyleId = computed(() =>
  paragraphStyleValue.value === PARAGRAPH_STYLE_NONE_VALUE ||
  paragraphStyleValue.value === PARAGRAPH_STYLE_MIXED_VALUE
    ? props.fallbackParagraphStyleId
    : paragraphStyleValue.value,
);

const POSITION_COMMAND_NAMES = ['subscript', 'superscript'] as const;

const positionValue = computed<
  (typeof POSITION_COMMAND_NAMES)[number] | undefined
>(() =>
  POSITION_COMMAND_NAMES.find((commandName) => isCommandActive(commandName)),
);

function openParagraphStylesDialog() {
  emit('open-paragraph-styles-dialog', currentDialogParagraphStyleId.value);
}

function onLanguageChanged(value: AcceptableValue) {
  if (!isCommandEnabled('textPartLanguage')) {
    return;
  }

  if (value === RICH_TEXT_NO_LANGUAGE_VALUE) {
    runCommand('textPartLanguage', { languageCode: false });
    return;
  }

  if (typeof value !== 'string') {
    return;
  }

  const [languageCode, textDirection] = value.split(':');

  if (
    languageCode === '' ||
    (textDirection !== 'ltr' && textDirection !== 'rtl')
  ) {
    return;
  }

  runCommand('textPartLanguage', {
    languageCode,
    textDirection,
  });
}

const martyriaNotes = Object.values(Note).map((x) => ({
  key: x,
  displayName: getNoteLabelSelector(x),
}));

const MARTYRIA_ROOT_SIGNS: RootSign[] = [
  RootSign.Zo,
  RootSign.Delta,
  RootSign.Alpha,
  RootSign.Legetos,
  RootSign.Nana,
  RootSign.DeltaDotted,
  RootSign.AlphaDotted,
  RootSign.SoftChromaticSquiggle,
  RootSign.Squiggle,
  RootSign.Tilt,
  RootSign.SoftChromaticPaRootSign,
  RootSign.Zygos,
];

const martyriaRootSigns = MARTYRIA_ROOT_SIGNS.map((rootSign) => ({
  key: rootSign,
  glyph:
    NeumeMappingService.getMapping((rootSign + 'Low') as RootSign)?.text ??
    rootSign,
  name: ROOT_SIGN_LABEL_SELECTORS[rootSign],
}));

const NEUME_ATTRIBUTE_PROPERTIES = [
  'top',
  'left',
  'right',
  'alignRight',
  'kerningLeft',
  'kerningRight',
  'width',
  'neumeFontSize',
  'neumeLineHeight',
  'color',
  'neumeType',
  'martyriaNote',
  'martyriaRootSign',
] as const;

type NeumeAttributeProperty = (typeof NEUME_ATTRIBUTE_PROPERTIES)[number];
type NeumeNumberAttributeProperty =
  | 'top'
  | 'left'
  | 'right'
  | 'kerningLeft'
  | 'kerningRight'
  | 'neumeFontSize'
  | 'neumeLineHeight';

const neumeAttributeState = useEditorCommandObservableState(
  scopedEditor,
  UPDATE_NEUME_ATTRIBUTES_COMMAND,
  [...NEUME_ATTRIBUTE_PROPERTIES],
);

const isNeumeSelected = computed(
  () => neumeAttributeState.exists && neumeAttributeState.isEnabled,
);
const neumeType = computed(() =>
  toNeumeType(neumeCommandProperty('neumeType')),
);
const neumeTop = computed(() => numberCommandProperty('top', 0));
const neumeLeft = computed(() => numberCommandProperty('left', 0));
const neumeRight = computed(() => numberCommandProperty('right', 0));
const neumeKerningLeft = computed(() =>
  numberCommandProperty('kerningLeft', 0),
);
const neumeKerningRight = computed(() =>
  numberCommandProperty('kerningRight', 0),
);
const neumeFontSize = computed(() => numberCommandProperty('neumeFontSize', 1));
const neumeLineHeight = computed(() =>
  numberCommandProperty('neumeLineHeight', 1),
);
const neumeWidth = computed(() => nullableNumberCommandProperty());
const neumeColor = computed(() => {
  const value = neumeCommandProperty('color');

  return typeof value === 'string' && value !== '' ? value : '#000000';
});
const neumeDefaultColors = computed(() => [
  '#000000',
  props.pageSetup.fthoraDefaultColor,
  '#FF0000',
]);
const neumeAlignRight = computed(
  () => neumeCommandProperty('alignRight') === true,
);
const neumeMartyriaNote = computed(() => {
  const value = neumeCommandProperty('martyriaNote');

  return isNote(value) ? value : Note.Pa;
});
const neumeMartyriaRootSign = computed(() => {
  const value = neumeCommandProperty('martyriaRootSign');

  return isRootSign(value) ? value : RootSign.Alpha;
});
const neumeGlyphStyle = computed(() => ({
  fontFamily: props.pageSetup.neumeDefaultFontFamily,
}));
const selectedMartyriaRootSign = computed(() =>
  martyriaRootSigns.find(
    (rootSign) => rootSign.key === neumeMartyriaRootSign.value,
  ),
);

function updateNeumeNumberAttribute(
  attributeName: NeumeNumberAttributeProperty,
  value: number | null,
  fallback = 0,
) {
  updateNeumeAttributes({
    [attributeName]: value ?? fallback,
  });
}

function onPositionValueChanged(value: unknown) {
  const previousValue = positionValue.value;
  const nextValue = isPositionCommandName(value) ? value : undefined;

  if (previousValue === nextValue) {
    return;
  }

  if (previousValue != null) {
    runCommand(previousValue);
  }

  if (nextValue != null) {
    runCommand(nextValue);
  }
}

function updateNeumeAttributes(
  attributes: Partial<Record<NeumeAttributeProperty, unknown>>,
) {
  if (!isNeumeSelected.value) {
    return;
  }

  execForOwner(props.element, UPDATE_NEUME_ATTRIBUTES_COMMAND, attributes);
}

function neumeFieldId(fieldName: string) {
  return `${props.idPrefix}-neume-${fieldName}`;
}

function onNeumeAlignRightChanged(value: boolean | 'indeterminate') {
  updateNeumeAttributes({
    alignRight: value === true,
    left: 0,
    right: 0,
  });
}

function onNeumeMartyriaNoteChanged(value: AcceptableValue) {
  if (isNote(value)) {
    updateNeumeAttributes({
      martyriaNote: value,
    });
  }
}

function onNeumeMartyriaRootSignChanged(value: AcceptableValue) {
  if (isRootSign(value)) {
    updateNeumeAttributes({
      martyriaRootSign: value,
    });
  }
}

function neumeCommandProperty(propertyName: NeumeAttributeProperty) {
  return neumeAttributeState.properties[propertyName];
}

function numberCommandProperty(
  propertyName: NeumeNumberAttributeProperty,
  fallback: number,
) {
  const value = neumeCommandProperty(propertyName);
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumberCommandProperty() {
  const value = neumeCommandProperty('width');

  if (value == null || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function toNeumeType(value: unknown): InsertNeumeType | null {
  return value === 'single' || value === 'martyria' || value === 'plagal'
    ? value
    : null;
}

function isPositionCommandName(
  value: unknown,
): value is (typeof POSITION_COMMAND_NAMES)[number] {
  return (
    typeof value === 'string' &&
    POSITION_COMMAND_NAMES.includes(
      value as (typeof POSITION_COMMAND_NAMES)[number],
    )
  );
}

function isNote(value: unknown): value is Note {
  return (
    typeof value === 'string' && Object.values(Note).includes(value as Note)
  );
}

function isRootSign(value: unknown): value is RootSign {
  return (
    typeof value === 'string' &&
    Object.values(RootSign).includes(value as RootSign)
  );
}
</script>

<style scoped>
.root-sign-option {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}

.root-sign-glyph {
  display: inline-block;
  width: 1.75rem;
  flex: none;
  font-size: 20pt;
  line-height: 20pt;
  position: relative;
  top: -0.33em;
  text-align: center;
}

.root-sign-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
