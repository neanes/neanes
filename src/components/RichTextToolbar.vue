<template>
  <div ref="toolbarRoot" class="chrome-toolbar">
    <Toolbar class="chrome-toolbar-row" loop>
      <AppTooltip :tooltip="$t(($) => $.menu.edit.undo, { ns: 'menu' })">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :disabled="!isCommandEnabled('undo')"
          @mousedown.prevent
          @click="runCommand('undo')"
        >
          <PhArrowCounterClockwise class="size-4" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="$t(($) => $.menu.edit.redo, { ns: 'menu' })">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :disabled="!isCommandEnabled('redo')"
          @mousedown.prevent
          @click="runCommand('redo')"
        >
          <PhArrowClockwise class="size-4" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <template v-if="showParagraphStyleSelect">
        <ParagraphStyleSelect
          trigger-class="w-48"
          :model-value="toolbarParagraphStyleValue"
          :paragraph-styles="paragraphStyles"
          :disabled="!isCommandEnabled('style')"
          :disabled-style-ids="disabledParagraphStyleIds"
          show-none-option
          :show-mixed-option="
            paragraphStyleValue === PARAGRAPH_STYLE_MIXED_VALUE
          "
          rich-text-portal
          @update:model-value="onToolbarParagraphStyleChanged"
          @update:open="
            $event
              ? beginSelectionGuard(element)
              : endSelectionGuard(element, { refocus: true })
          "
        />
        <ToolbarSeparator />
      </template>
      <FontCombobox
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
      <FontStyleSelect
        class="w-40"
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
      <InputFontSize
        id="toolbar-rich-text-font-size"
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
      <ToolbarSeparator />
      <ToolbarToggleGroup
        type="multiple"
        variant="outline"
        :model-value="styleValues"
        @update:model-value="onStyleValuesChanged"
      >
        <AppTooltip
          :tooltip="$t(($) => $.dialog.pageSetup.bold, { ns: 'dialog' })"
        >
          <ToolbarToggleItem
            value="bold"
            class="chrome-button"
            :disabled="!isStyleToggleEnabled('bold')"
            @mousedown.prevent
          >
            <PhTextB class="size-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.dialog.pageSetup.italic, { ns: 'dialog' })"
        >
          <ToolbarToggleItem
            value="italic"
            class="chrome-button"
            :disabled="!isStyleToggleEnabled('italic')"
            @mousedown.prevent
          >
            <PhTextItalic class="size-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="
            $t(($) => $.toolbar.richTextBox.underline, { ns: 'toolbar' })
          "
        >
          <ToolbarToggleItem
            value="underline"
            class="chrome-button"
            :disabled="!isStyleToggleEnabled('underline')"
            @mousedown.prevent
          >
            <PhTextUnderline class="size-4" />
          </ToolbarToggleItem>
        </AppTooltip>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarToggleGroup
        type="single"
        variant="outline"
        :model-value="alignmentValue"
        @update:model-value="onAlignmentChanged"
      >
        <AppTooltip
          :tooltip="$t(($) => $.toolbar.common.alignLeft, { ns: 'toolbar' })"
        >
          <ToolbarToggleItem
            value="left"
            class="chrome-button"
            :disabled="!isCommandEnabled('alignment')"
            @mousedown.prevent
          >
            <PhTextAlignLeft class="size-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.toolbar.common.alignCenter, { ns: 'toolbar' })"
        >
          <ToolbarToggleItem
            value="center"
            class="chrome-button"
            :disabled="!isCommandEnabled('alignment')"
            @mousedown.prevent
          >
            <PhTextAlignCenter class="size-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })"
        >
          <ToolbarToggleItem
            value="right"
            class="chrome-button"
            :disabled="!isCommandEnabled('alignment')"
            @mousedown.prevent
          >
            <PhTextAlignRight class="size-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.toolbar.selection.justify, { ns: 'toolbar' })"
        >
          <ToolbarToggleItem
            value="justify"
            class="chrome-button"
            :disabled="!isCommandEnabled('alignment')"
            @mousedown.prevent
          >
            <PhTextAlignJustify class="size-4" />
          </ToolbarToggleItem>
        </AppTooltip>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.richTextBox.outdent, { ns: 'toolbar' })"
      >
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :disabled="!isCommandEnabled('outdent')"
          @mousedown.prevent
          @click="runCommand('outdent')"
        >
          <PhTextOutdent class="size-4" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.richTextBox.indent, { ns: 'toolbar' })"
      >
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :disabled="!isCommandEnabled('indent')"
          @mousedown.prevent
          @click="runCommand('indent')"
        >
          <PhTextIndent class="size-4" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <Popover
        :open="neumePopoverOpen"
        @update:open="neumePopoverOpen = $event"
      >
        <PopoverTrigger as-child>
          <ToolbarButton
            variant="secondary"
            class="chrome-button"
            :disabled="!isCommandEnabled(INSERT_NEUME_COMMAND)"
            :aria-label="
              $t(($) => $.toolbar.richTextBox.insertNeume, { ns: 'toolbar' })
            "
            @mousedown.prevent
          >
            <span class="neume-toolbar-glyph" :style="neumeGlyphStyle"
              >&#xe000;</span
            >
          </ToolbarButton>
        </PopoverTrigger>
        <RichTextPopoverContent
          align="start"
          class="w-[380px] p-2"
          @close-auto-focus.prevent
        >
          <div class="grid gap-2">
            <Select
              v-if="characterBlockOptions.length > 1"
              :model-value="selectedCharacterBlockName"
              @update:model-value="onCharacterBlockChanged"
            >
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <RichTextSelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="block in characterBlockOptions"
                    :key="block.name"
                    :value="block.name"
                  >
                    {{ block.name }}
                  </SelectItem>
                </SelectGroup>
              </RichTextSelectContent>
            </Select>

            <div class="neume-grid">
              <Button
                v-for="character in neumeCharacters"
                :key="character.neume"
                type="button"
                variant="outline"
                size="icon"
                class="neume-grid-button"
                :disabled="!isCommandEnabled(INSERT_NEUME_COMMAND)"
                @mousedown.prevent
                @click="insertSingleNeume(character.neume)"
              >
                <span
                  class="neume-grid-glyph"
                  :class="{ salt: character.salt != null }"
                  :style="neumeGlyphStyle"
                >
                  {{ character.label }}
                </span>
              </Button>
            </div>
          </div>
        </RichTextPopoverContent>
      </Popover>
      <AppTooltip
        :tooltip="
          $t(($) => $.toolbar.richTextBox.insertMartyria, { ns: 'toolbar' })
        "
      >
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :disabled="!isCommandEnabled(INSERT_NEUME_COMMAND)"
          @mousedown.prevent
          @click="insertMartyria"
        >
          <span class="martyria-toolbar-glyph" :style="neumeGlyphStyle"
            >&#xe139;&#xe152;</span
          >
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip
        :tooltip="
          $t(($) => $.toolbar.richTextBox.insertPlagal, { ns: 'toolbar' })
        "
      >
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :disabled="!isCommandEnabled(INSERT_NEUME_COMMAND)"
          @mousedown.prevent
          @click="insertPlagal"
        >
          <span class="plagal-toolbar-glyph">&pi;&lambda;</span>
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <RichTextToolbarItem name="bulletedList" :owner="element" />
      <RichTextToolbarItem name="numberedList" :owner="element" />
      <RichTextToolbarItem name="link" :owner="element" />
      <RichTextToolbarItem name="horizontalLine" :owner="element" />
      <RichTextToolbarItem name="uploadImage" :owner="element" />
      <RichTextToolbarItem name="insertTable" :owner="element" />
      <ToolbarSeparator />
      <RichTextToolbarItem name="findAndReplace" :owner="element" />
    </Toolbar>
  </div>
</template>

<script setup lang="ts">
import {
  PhArrowClockwise,
  PhArrowCounterClockwise,
  PhTextAlignCenter,
  PhTextAlignJustify,
  PhTextAlignLeft,
  PhTextAlignRight,
  PhTextB,
  PhTextIndent,
  PhTextItalic,
  PhTextOutdent,
  PhTextUnderline,
} from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed, ref } from 'vue';

import {
  INSERT_NEUME_COMMAND,
  type InsertNeumeCommandParams,
} from '@/ckeditor-plugins/insertneume/insertneumecommand';
import {
  INSERT_NEUME_CHARACTER_BLOCKS,
  INSERT_NEUME_DEFAULT_ATTRIBUTES,
  INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA,
  type InsertNeumeAttributes,
  type InsertNeumeAttributeSet,
} from '@/ckeditor-plugins/insertneume/insertneumeutil';
import AppTooltip from '@/components/AppTooltip.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import RichTextPopoverContent from '@/components/RichTextPopoverContent.vue';
import RichTextSelectContent from '@/components/RichTextSelectContent.vue';
import RichTextToolbarItem from '@/components/RichTextToolbarItem.vue';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from '@/components/ui/toolbar';
import { useActiveOrLastEditorForOwner } from '@/composables/useRichTextEditorRegistry';
import {
  attachFocusZone,
  beginSelectionGuard,
  endSelectionGuard,
} from '@/composables/useRichTextSelectionGuard';
import {
  PARAGRAPH_STYLE_MIXED_VALUE,
  useRichParagraphStyleCommands,
} from '@/composables/useRichTextStyleCommands';
import type { AnnotationElement, RichTextBoxElement } from '@/models/Element';
import { ElementType } from '@/models/Element';
import type { Neume } from '@/models/Neumes';
import { Note, RootSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import type {
  ParagraphStyle,
  ResolvedParagraphStyle,
} from '@/models/ParagraphStyle';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { RICH_TEXT_DEFAULT_FONT_FAMILY } from '@/utils/fontConstants';

const EXTRA_COMMAND_NAMES = [
  'outdent',
  'indent',
  'undo',
  'redo',
  INSERT_NEUME_COMMAND,
];

const props = defineProps({
  element: {
    type: Object as PropType<RichTextBoxElement | AnnotationElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    default: () => [],
  },
  fallbackParagraphStyle: {
    type: Object as PropType<ResolvedParagraphStyle>,
    required: true,
  },
});

const showParagraphStyleSelect = computed(
  () =>
    props.element.elementType === ElementType.RichTextBox ||
    props.element.elementType === ElementType.Annotation,
);

const styleCommandProps = {
  get element() {
    return props.element;
  },
  get fallbackParagraphStyle() {
    return props.fallbackParagraphStyle;
  },
  get fonts() {
    return props.fonts;
  },
  get paragraphStyles() {
    return props.paragraphStyles;
  },
  get pageSetup() {
    return props.pageSetup;
  },
};

const {
  paragraphStyleValue,
  resolvedActiveParagraphStyle,
  fontFamilyValue,
  fontFamilyOptions,
  fontStyleValue,
  fontStyleOptions,
  fontStyleDisabled,
  fontSizeValue,
  fontSizePlaceholder,
  styleValues,
  alignmentValue,
  isCommandEnabled,
  isStyleToggleEnabled,
  isParagraphStyleEnabled,
  runCommand,
  onFontFamilyChanged,
  onFontStyleChanged,
  onFontSizeChanged,
  onStyleValuesChanged,
  onAlignmentChanged,
  onParagraphStyleChanged,
} = useRichParagraphStyleCommands(styleCommandProps, EXTRA_COMMAND_NAMES);

const toolbarParagraphStyleValue = computed(() => paragraphStyleValue.value);
const disabledParagraphStyleIds = computed(() =>
  props.paragraphStyles
    .filter((style) => !isParagraphStyleEnabled(style.id))
    .map((style) => style.id),
);

const scopedEditor = useActiveOrLastEditorForOwner(() => props.element);

// Keep the editor logically focused while focus is in the toolbar or the
// shared dropdown portal, and show the selection marker while a styling control
// is engaged.
const toolbarRoot = ref<HTMLElement | null>(null);
attachFocusZone(() => props.element, toolbarRoot);

const neumePopoverOpen = ref(false);
const characterBlockOptions = INSERT_NEUME_CHARACTER_BLOCKS;
const initialCharacterBlock = characterBlockOptions[0];
const selectedCharacterBlockName = ref(initialCharacterBlock.name);

const selectedCharacterBlock = computed(
  () =>
    characterBlockOptions.find(
      (block) => block.name === selectedCharacterBlockName.value,
    ) ?? initialCharacterBlock,
);

const neumeCharacters = computed(() => {
  return selectedCharacterBlock.value.neumes.map((neume) => {
    const mapping = NeumeMappingService.getMapping(neume);

    return {
      label: mapping.text,
      salt: mapping.salt,
      neume,
    };
  });
});

const neumeGlyphStyle = computed(() => ({
  fontFamily: props.pageSetup.neumeDefaultFontFamily,
}));

function onCharacterBlockChanged(value: unknown) {
  if (typeof value === 'string') {
    selectedCharacterBlockName.value = value;
  }
}

function onToolbarParagraphStyleChanged(value: string) {
  onParagraphStyleChanged(value);
}

function insertSingleNeume(neume: Neume) {
  const defaultAttributes = getDefaultAttributesForNeume(neume);
  const args: InsertNeumeCommandParams = {
    neumeType: 'single',
    neume,
    ...defaultAttributes,
  };

  runCommand(INSERT_NEUME_COMMAND, args);
  neumePopoverOpen.value = false;
}

function insertMartyria() {
  const defaultAttributes = getDefaultMartyriaAttributes();

  runCommand(INSERT_NEUME_COMMAND, {
    neumeType: 'martyria',
    martyriaNote: Note.Pa,
    martyriaRootSign: RootSign.Alpha,
    ...defaultAttributes,
  } as InsertNeumeCommandParams);
}

function insertPlagal() {
  const neumeFont = getInsertNeumeConfigValue(
    'insertNeume.defaultFontFamily',
    props.fallbackParagraphStyle.fontFamily,
  );

  const piHeight = TextMeasurementService.getTextHeight(
    '\u03c0',
    `12px "${neumeFont}"`,
  );
  const fontHeight = TextMeasurementService.getFontHeight(
    `12px "${neumeFont}"`,
  );
  const adjustment = 0.2;
  const neumeLineHeight =
    fontHeight > 0 ? piHeight / fontHeight + adjustment : 1;

  runCommand(INSERT_NEUME_COMMAND, {
    neumeType: 'plagal',
    neumeFontSize: 1,
    neumeLineHeight,
  } as InsertNeumeCommandParams);
}

function getDefaultAttributesForNeume(neume: Neume) {
  const defaultAttributesConfig = getInsertNeumeConfigValue(
    'insertNeume.defaultAttributes',
    INSERT_NEUME_DEFAULT_ATTRIBUTES,
  );
  const neumeFont = getInsertNeumeConfigValue(
    'insertNeume.neumeDefaultFontFamily',
    props.pageSetup.neumeDefaultFontFamily,
  );
  const defaultAttributeSet = defaultAttributesConfig[neumeFont] as
    | InsertNeumeAttributeSet[]
    | undefined;

  return defaultAttributeSet?.find((x) => x.neume === neume)?.attributes ?? {};
}

function getDefaultMartyriaAttributes() {
  const defaultAttributesConfig = getInsertNeumeConfigValue(
    'insertNeume.defaultAttributesMartyria',
    INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA,
  );
  const neumeFont = getInsertNeumeConfigValue(
    'insertNeume.neumeDefaultFontFamily',
    props.pageSetup.neumeDefaultFontFamily,
  );

  return (defaultAttributesConfig[neumeFont] ??
    {}) as Partial<InsertNeumeAttributes>;
}

function getInsertNeumeConfigValue<T>(path: string, fallback: T) {
  return (scopedEditor.value?.config.get(path) as T | undefined) ?? fallback;
}
</script>

<style scoped>
.neume-toolbar-glyph,
.martyria-toolbar-glyph {
  font-size: 16pt;
  line-height: 1;
}

.martyria-toolbar-glyph {
  position: relative;
  top: -0.32em;
}

.plagal-toolbar-glyph {
  font-family: 'Source Serif', serif;
  font-size: 13px;
  line-height: 1;
}

.neume-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 4px;
  max-height: 300px;
  overflow: auto;
}

.neume-grid-button {
  height: 40px;
  width: 100%;
  overflow: visible;
}

.neume-grid-glyph {
  font-size: 16pt;
  line-height: 1;
}

.neume-grid-glyph.salt {
  font-feature-settings: 'salt';
}
</style>
