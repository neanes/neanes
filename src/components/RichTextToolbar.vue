<template>
  <div ref="toolbarRoot" class="rich-text-toolbar w-full p-1">
    <Toolbar
      class="rich-text-toolbar-row h-auto w-full gap-0 border-0 p-0"
      loop
    >
      <AppTooltip :tooltip="$t(($) => $.menu.edit.undo, { ns: 'menu' })">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="legacy-toolbar-button"
          :disabled="!isCommandEnabled('undo')"
          @mousedown.prevent
          @click="runCommand('undo')"
        >
          <PhArrowCounterClockwise class="h-4 w-4" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="$t(($) => $.menu.edit.redo, { ns: 'menu' })">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="legacy-toolbar-button"
          :disabled="!isCommandEnabled('redo')"
          @mousedown.prevent
          @click="runCommand('redo')"
        >
          <PhArrowClockwise class="h-4 w-4" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <FontCombobox
        :model-value="fontFamilyValue"
        :options="fontFamilyOptions"
        :disabled="!isCommandEnabled('fontFamily')"
        rich-text-portal
        @update:model-value="onFontFamilyChanged"
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
        @update:model-value="onFontSizeChanged"
        @focuscapture="beginSelectionGuard(element)"
        @blurcapture="endSelectionGuard(element, { refocus: false })"
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
            class="legacy-toolbar-button"
            :disabled="!isCommandEnabled('bold')"
            @mousedown.prevent
          >
            <PhTextB class="h-4 w-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.dialog.pageSetup.italic, { ns: 'dialog' })"
        >
          <ToolbarToggleItem
            value="italic"
            class="legacy-toolbar-button"
            :disabled="!isCommandEnabled('italic')"
            @mousedown.prevent
          >
            <PhTextItalic class="h-4 w-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="
            $t(($) => $.toolbar.richTextBox.underline, { ns: 'toolbar' })
          "
        >
          <ToolbarToggleItem
            value="underline"
            class="legacy-toolbar-button"
            :disabled="!isCommandEnabled('underline')"
            @mousedown.prevent
          >
            <PhTextUnderline class="h-4 w-4" />
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
            class="legacy-toolbar-button"
            :disabled="!isCommandEnabled('alignment')"
            @mousedown.prevent
          >
            <PhTextAlignLeft class="h-4 w-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.toolbar.common.alignCenter, { ns: 'toolbar' })"
        >
          <ToolbarToggleItem
            value="center"
            class="legacy-toolbar-button"
            :disabled="!isCommandEnabled('alignment')"
            @mousedown.prevent
          >
            <PhTextAlignCenter class="h-4 w-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })"
        >
          <ToolbarToggleItem
            value="right"
            class="legacy-toolbar-button"
            :disabled="!isCommandEnabled('alignment')"
            @mousedown.prevent
          >
            <PhTextAlignRight class="h-4 w-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.toolbar.selection.justify, { ns: 'toolbar' })"
        >
          <ToolbarToggleItem
            value="justify"
            class="legacy-toolbar-button"
            :disabled="!isCommandEnabled('alignment')"
            @mousedown.prevent
          >
            <PhTextAlignJustify class="h-4 w-4" />
          </ToolbarToggleItem>
        </AppTooltip>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarToggleGroup
        type="multiple"
        variant="outline"
        :model-value="listValues"
        @update:model-value="onListValuesChanged"
      >
        <AppTooltip
          :tooltip="
            $t(($) => $.toolbar.richTextBox.bulletedList, { ns: 'toolbar' })
          "
        >
          <ToolbarToggleItem
            value="bulletedList"
            class="legacy-toolbar-button"
            :disabled="!isCommandEnabled('bulletedList')"
            @mousedown.prevent
          >
            <PhListBullets class="h-4 w-4" />
          </ToolbarToggleItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="
            $t(($) => $.toolbar.richTextBox.numberedList, { ns: 'toolbar' })
          "
        >
          <ToolbarToggleItem
            value="numberedList"
            class="legacy-toolbar-button"
            :disabled="!isCommandEnabled('numberedList')"
            @mousedown.prevent
          >
            <PhListNumbers class="h-4 w-4" />
          </ToolbarToggleItem>
        </AppTooltip>
      </ToolbarToggleGroup>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.richTextBox.outdent, { ns: 'toolbar' })"
      >
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="legacy-toolbar-button"
          :disabled="!isCommandEnabled('outdent')"
          @mousedown.prevent
          @click="runCommand('outdent')"
        >
          <PhTextOutdent class="h-4 w-4" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.richTextBox.indent, { ns: 'toolbar' })"
      >
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="legacy-toolbar-button"
          :disabled="!isCommandEnabled('indent')"
          @mousedown.prevent
          @click="runCommand('indent')"
        >
          <PhTextIndent class="h-4 w-4" />
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
            size="icon-sm"
            class="legacy-toolbar-button"
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
          size="icon-sm"
          class="legacy-toolbar-button"
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
          size="icon-sm"
          class="legacy-toolbar-button"
          :disabled="!isCommandEnabled(INSERT_NEUME_COMMAND)"
          @mousedown.prevent
          @click="insertPlagal"
        >
          <span class="plagal-toolbar-glyph">&pi;&lambda;</span>
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <RichTextToolbarItem name="link" :owner="element" />
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
  PhListBullets,
  PhListNumbers,
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
import InputFontSize from '@/components/InputFontSize.vue';
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
import { useActiveEditorForOwner } from '@/composables/useRichTextEditorRegistry';
import {
  attachFocusZone,
  beginSelectionGuard,
  endSelectionGuard,
} from '@/composables/useRichTextSelectionGuard';
import { useRichTextStyleCommands } from '@/composables/useRichTextStyleCommands';
import type { AnnotationElement, RichTextBoxElement } from '@/models/Element';
import type { Neume } from '@/models/Neumes';
import { Note, RootSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { TextMeasurementService } from '@/services/TextMeasurementService';

const EXTRA_COMMAND_NAMES = [
  'bulletedList',
  'numberedList',
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
  defaultFontSize: {
    type: Number,
    required: true,
  },
  defaultFontColor: {
    type: String,
    required: true,
  },
  defaultFontFamily: {
    type: String,
    required: true,
  },
});

const {
  fontFamilyValue,
  fontFamilyOptions,
  fontSizeValue,
  fontSizePlaceholder,
  styleValues,
  alignmentValue,
  isCommandEnabled,
  isCommandActive,
  runCommand,
  onFontFamilyChanged,
  onFontSizeChanged,
  onStyleValuesChanged,
  onAlignmentChanged,
  executeChangedToggleCommands,
} = useRichTextStyleCommands(props, EXTRA_COMMAND_NAMES);

const scopedEditor = useActiveEditorForOwner(() => props.element);

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
      label: mapping?.text ?? '',
      salt: mapping?.salt,
      neume,
    };
  });
});

const neumeGlyphStyle = computed(() => ({
  fontFamily: props.pageSetup.neumeDefaultFontFamily,
}));

const listValues = computed(() =>
  ['bulletedList', 'numberedList'].filter((commandName) =>
    isCommandActive(commandName),
  ),
);

function onListValuesChanged(value: unknown) {
  executeChangedToggleCommands(
    ['bulletedList', 'numberedList'],
    listValues.value,
    value,
  );
}

function onCharacterBlockChanged(value: unknown) {
  if (typeof value === 'string') {
    selectedCharacterBlockName.value = value;
  }
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
    props.defaultFontFamily,
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
.rich-text-toolbar {
  background-color: var(--color-legacy-chrome-menu-surface);

  --rich-text-toolbar-button-size: 32px;
  --rich-text-neume-tile-size: 40px;
  --rich-text-neume-grid-gap: 4px;
}

.rich-text-toolbar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.legacy-toolbar-button {
  box-sizing: border-box;
  height: var(--rich-text-toolbar-button-size);
  width: var(--rich-text-toolbar-button-size);
  appearance: auto;
  background: revert;
  border: revert;
  border-radius: revert;
  box-shadow: revert;
  font-weight: revert;
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
  outline: revert;
  padding: 0;
  transition: revert;
  user-select: none;
}

.legacy-toolbar-button:hover {
  background: revert;
}

.legacy-toolbar-button[data-state='on'],
.legacy-toolbar-button[aria-pressed='true'] {
  background: var(--color-legacy-chrome-selected);
}

.legacy-toolbar-button[aria-disabled='true'],
.legacy-toolbar-button[data-disabled],
.legacy-toolbar-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

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
