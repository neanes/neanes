<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[42rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.paragraphStyles.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{
            $t(($) => $.dialog.paragraphStyles.description, {
              ns: 'dialog',
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <Tabs
        v-model="selectedStyleId"
        orientation="vertical"
        class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4 overflow-hidden sm:grid-cols-[13rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)]"
      >
        <div
          class="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4 overflow-hidden"
        >
          <ScrollArea class="min-h-0">
            <TabsList
              class="h-auto w-full flex-col items-stretch justify-start p-1"
            >
              <TabsTrigger
                v-for="style in styles"
                :key="style.id"
                :value="style.id"
                class="min-h-9 w-full flex-none justify-start whitespace-normal text-left"
              >
                {{ styleDisplayName(style) }}
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <div class="flex flex-wrap items-center gap-2">
            <AppTooltip
              v-for="action in creationActions"
              :key="action.key"
              :tooltip="action.label"
            >
              <span class="inline-flex" @mousedown.prevent>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :disabled="action.disabled"
                  :aria-label="action.label"
                  @click="action.onClick"
                >
                  <component :is="action.icon" />
                </Button>
              </span>
            </AppTooltip>
            <div class="ml-auto flex items-center gap-2">
              <AppTooltip
                v-for="action in selectionActions"
                :key="action.key"
                :tooltip="action.label"
              >
                <span class="inline-flex" @mousedown.prevent>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="action.disabled"
                    :aria-label="action.label"
                    @click="action.onClick"
                  >
                    <component :is="action.icon" />
                  </Button>
                </span>
              </AppTooltip>
            </div>
          </div>
        </div>

        <TabsContent
          :key="selectedStyleId"
          :value="selectedStyleId"
          class="col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden sm:col-start-2 sm:row-start-1"
        >
          <ScrollArea class="h-full min-h-0 border">
            <FieldGroup class="p-4">
              <Field orientation="horizontal">
                <div class="min-w-0 flex-1">
                  <FieldLabel for="paragraph-styles-dialog-name">
                    {{
                      $t(($) => $.dialog.paragraphStyles.name, { ns: 'dialog' })
                    }}
                  </FieldLabel>
                </div>
                <Input
                  id="paragraph-styles-dialog-name"
                  class="ml-auto w-64 shrink-0"
                  :model-value="
                    selectedStyle == null ? '' : styleDisplayName(selectedStyle)
                  "
                  :disabled="selectedStyle?.builtIn ?? false"
                  @update:model-value="updateSelectedStyleName"
                />
              </Field>

              <Field orientation="horizontal">
                <div class="min-w-0 flex-1">
                  <FieldLabel for="paragraph-styles-dialog-parent">
                    {{
                      $t(($) => $.dialog.paragraphStyles.parentStyle, {
                        ns: 'dialog',
                      })
                    }}
                  </FieldLabel>
                </div>
                <ParagraphStyleSelect
                  id="paragraph-styles-dialog-parent"
                  :disabled="selectedStyle?.id === defaultParagraphStyleId"
                  :model-value="
                    selectedStyle?.id === defaultParagraphStyleId
                      ? PARAGRAPH_STYLE_NONE_VALUE
                      : (selectedStyle?.parentStyleId ??
                        defaultParagraphStyleId)
                  "
                  :paragraph-styles="availableParents"
                  :show-none-option="
                    selectedStyle?.id === defaultParagraphStyleId
                  "
                  :none-label="parentNoneLabel"
                  trigger-class="w-64"
                  @update:model-value="updateSelectedStyleParent"
                />
              </Field>

              <FieldSeparator />

              <ParagraphStyleOverrideRow
                :label="$t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })"
                label-for="paragraph-styles-dialog-font"
                :active="hasOverride('fontFamily')"
                :show-toggle="showOverrideToggles"
                @toggle="toggleOverride('fontFamily', $event)"
              >
                <FontCombobox
                  id="paragraph-styles-dialog-font"
                  class="ml-auto w-64 min-w-0 shrink-0"
                  :model-value="resolvedStyle.fontFamily"
                  :options="fontOptions"
                  :disabled="isOverrideDisabled('fontFamily')"
                  @update:model-value="onFontFamilyChanged"
                />
              </ParagraphStyleOverrideRow>

              <ParagraphStyleOverrideRow
                :label="$t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })"
                label-for="paragraph-styles-dialog-font-style"
                :active="hasOverride('fontStyle')"
                :show-toggle="showOverrideToggles"
                @toggle="toggleOverride('fontStyle', $event)"
              >
                <FontStyleSelect
                  id="paragraph-styles-dialog-font-style"
                  class="ml-auto w-64 min-w-0 shrink-0"
                  :model-value="resolvedStyle.fontStyle"
                  :options="fontStyleOptions"
                  :disabled="isOverrideDisabled('fontStyle')"
                  @update:model-value="
                    updateSelectedStyleOverride('fontStyle', $event)
                  "
                />
              </ParagraphStyleOverrideRow>

              <ParagraphStyleOverrideRow
                :label="$t(($) => $.dialog.pageSetup.size, { ns: 'dialog' })"
                label-for="paragraph-styles-dialog-font-size"
                :active="hasOverride('fontSize')"
                :show-toggle="showOverrideToggles"
                @toggle="toggleOverride('fontSize', $event)"
              >
                <div class="ml-auto w-40 shrink-0">
                  <InputFontSize
                    id="paragraph-styles-dialog-font-size"
                    class="w-full"
                    :model-value="resolvedStyle.fontSize"
                    :disabled="isOverrideDisabled('fontSize')"
                    @update:model-value="
                      updateSelectedStyleOverride('fontSize', $event)
                    "
                  />
                </div>
              </ParagraphStyleOverrideRow>

              <ParagraphStyleOverrideRow
                :label="
                  $t(($) => $.toolbar.common.alignment, { ns: 'toolbar' })
                "
                :active="hasOverride('alignment')"
                :show-toggle="showOverrideToggles"
                @toggle="toggleOverride('alignment', $event)"
              >
                <ToggleGroup
                  class="ml-auto shrink-0"
                  type="single"
                  variant="outline"
                  :model-value="resolvedStyle.alignment"
                  :disabled="isOverrideDisabled('alignment')"
                  @update:model-value="updateAlignmentOverride"
                >
                  <AppTooltip
                    :tooltip="
                      $t(($) => $.toolbar.common.alignLeft, { ns: 'toolbar' })
                    "
                  >
                    <ToggleGroupItem value="left">
                      <PhTextAlignLeft />
                    </ToggleGroupItem>
                  </AppTooltip>
                  <AppTooltip
                    :tooltip="
                      $t(($) => $.toolbar.common.alignCenter, {
                        ns: 'toolbar',
                      })
                    "
                  >
                    <ToggleGroupItem value="center">
                      <PhTextAlignCenter />
                    </ToggleGroupItem>
                  </AppTooltip>
                  <AppTooltip
                    :tooltip="
                      $t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })
                    "
                  >
                    <ToggleGroupItem value="right">
                      <PhTextAlignRight />
                    </ToggleGroupItem>
                  </AppTooltip>
                  <AppTooltip
                    :tooltip="
                      $t(($) => $.toolbar.common.alignJustify, {
                        ns: 'toolbar',
                      })
                    "
                  >
                    <ToggleGroupItem value="justify">
                      <PhTextAlignJustify />
                    </ToggleGroupItem>
                  </AppTooltip>
                </ToggleGroup>
              </ParagraphStyleOverrideRow>

              <ParagraphStyleOverrideRow
                :label="
                  $t(($) => $.toolbar.richTextBox.textDecorations, {
                    ns: 'toolbar',
                  })
                "
                :active="hasOverride('textDecoration')"
                :show-toggle="showOverrideToggles"
                @toggle="toggleOverride('textDecoration', $event)"
              >
                <div class="ml-auto flex shrink-0 items-center gap-2">
                  <Checkbox
                    id="paragraph-styles-dialog-underline"
                    :model-value="textDecorationCheckboxValue"
                    :disabled="isOverrideDisabled('textDecoration')"
                    @update:model-value="updateTextDecorationOverride"
                  />
                  <FieldLabel
                    for="paragraph-styles-dialog-underline"
                    class="shrink-0"
                  >
                    {{
                      $t(($) => $.toolbar.richTextBox.underline, {
                        ns: 'toolbar',
                      })
                    }}
                  </FieldLabel>
                </div>
              </ParagraphStyleOverrideRow>

              <ParagraphStyleOverrideRow
                :label="$t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })"
                :active="hasOverride('color')"
                :show-toggle="showOverrideToggles"
                @toggle="toggleOverride('color', $event)"
              >
                <div class="ml-auto shrink-0">
                  <ColorPicker
                    :model-value="resolvedStyle.color"
                    :disabled="isOverrideDisabled('color')"
                    @update:model-value="
                      updateSelectedStyleOverride('color', $event)
                    "
                  />
                </div>
              </ParagraphStyleOverrideRow>

              <ParagraphStyleOverrideRow
                :label="$t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' })"
                label-for="paragraph-styles-dialog-stroke-width"
                :active="hasOverride('strokeWidth')"
                :show-toggle="showOverrideToggles"
                @toggle="toggleOverride('strokeWidth', $event)"
              >
                <div class="ml-auto w-40 shrink-0">
                  <InputStrokeWidth
                    id="paragraph-styles-dialog-stroke-width"
                    class="w-full"
                    :model-value="resolvedStyle.strokeWidth"
                    :disabled="isOverrideDisabled('strokeWidth')"
                    @update:model-value="
                      updateSelectedStyleOverride('strokeWidth', $event)
                    "
                  />
                </div>
              </ParagraphStyleOverrideRow>

              <ParagraphStyleOverrideRow
                :label="
                  $t(($) => $.dialog.pageSetup.outlineColor, { ns: 'dialog' })
                "
                :active="hasOverride('strokeColor')"
                :show-toggle="showOverrideToggles"
                @toggle="toggleOverride('strokeColor', $event)"
              >
                <div class="ml-auto shrink-0">
                  <StrokeColorPicker
                    :model-value="resolvedStyle.strokeColor"
                    :preview-color="
                      resolvedStyle.strokeColor === 'currentcolor'
                        ? resolvedStyle.color
                        : resolvedStyle.strokeColor
                    "
                    :text-color="resolvedStyle.color"
                    :same-as-text="strokeColorSameAsText"
                    :disabled="isOverrideDisabled('strokeColor')"
                    :label="
                      $t(($) => $.dialog.pageSetup.outlineColor, {
                        ns: 'dialog',
                      })
                    "
                    :same-as-text-label="
                      $t(($) => $.dialog.pageSetup.sameAsText, { ns: 'dialog' })
                    "
                    @update:model-value="
                      updateSelectedStyleOverride('strokeColor', $event)
                    "
                  />
                </div>
              </ParagraphStyleOverrideRow>

              <ParagraphStyleOverrideRow
                :label="
                  $t(($) => $.dialog.pageSetup.lineHeight, { ns: 'dialog' })
                "
                label-for="paragraph-styles-dialog-line-height"
                :active="hasOverride('lineHeight')"
                :show-toggle="showOverrideToggles"
                @toggle="toggleOverride('lineHeight', $event)"
              >
                <div class="ml-auto w-40 shrink-0">
                  <InputUnit
                    id="paragraph-styles-dialog-line-height"
                    class="w-full"
                    unit="unitless"
                    :nullable="true"
                    :min="0"
                    :step="0.1"
                    :model-value="resolvedStyle.lineHeight"
                    :format-options="fraction2FormatOptions"
                    :disabled="isOverrideDisabled('lineHeight')"
                    placeholder="normal"
                    @update:model-value="
                      updateSelectedStyleOverride('lineHeight', $event)
                    "
                  />
                </div>
              </ParagraphStyleOverrideRow>
            </FieldGroup>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" type="button">
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
        <Button type="button" :disabled="!canSubmit" @click="submit">
          <PhCheck />
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  PhArrowCounterClockwise,
  PhCheck,
  PhCopy,
  PhPlus,
  PhTextAlignCenter,
  PhTextAlignJustify,
  PhTextAlignLeft,
  PhTextAlignRight,
  PhTextTSlash,
  PhTrash,
} from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import type { PropType } from 'vue';
import { computed, ref } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import ParagraphStyleOverrideRow from '@/components/ParagraphStyleOverrideRow.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import StrokeColorPicker from '@/components/StrokeColorPicker.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import { PARAGRAPH_STYLE_NONE_VALUE } from '@/composables/useRichTextStyleCommands';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultBuiltInParagraphStyle,
  getAvailableParagraphStyleParents,
  getParagraphStyleDisplayName,
  hasParagraphStyleOverrides,
  isBuiltInParagraphStyleId,
  isTextBoxAlignment,
  ParagraphStyle,
  type ParagraphStyleOverrides,
  pruneParentlessParagraphStyleRootFallbackOverrides,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { fontCatalog } from '@/services/FontCatalog';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';

const props = defineProps({
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
  initialSelectedStyleId: {
    type: String,
    default: BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
  },
});

const emit = defineEmits<{
  update: [styles: ParagraphStyle[]];
}>();

const open = defineModel<boolean>('open', { required: true });
const { t } = useTranslation();

const defaultParagraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;

// The dialog is mounted per open (v-if in TheEditor), so the working copy is
// snapshotted once at setup and edited in place until Update is pressed.
const styles = ref<ParagraphStyle[]>(
  props.paragraphStyles.map((style) => style.clone()),
);
const selectedStyleId = ref<string>(
  styles.value.find((style) => style.id === props.initialSelectedStyleId)?.id ??
    styles.value[0]?.id ??
    defaultParagraphStyleId,
);

const selectedStyle = computed(
  () =>
    styles.value.find((style) => style.id === selectedStyleId.value) ?? null,
);

const resolvedStyle = computed(() =>
  resolveParagraphStyle(
    styles.value,
    selectedStyle.value?.id ?? defaultParagraphStyleId,
  ),
);

const availableParents = computed(() => {
  if (selectedStyle.value == null) {
    return [];
  }

  return getAvailableParagraphStyleParents(
    styles.value,
    selectedStyle.value.id,
  );
});

const parentNoneLabel = computed(
  () => `(${t(($) => $.toolbar.common.none, { ns: 'toolbar' })})`,
);

const fontOptions = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

const { fontStyleOptions, remapStyleForFamily } = useFontStyleControls(
  () => resolvedStyle.value.fontFamily,
  () => resolvedStyle.value.fontStyle,
);

const textDecorationCheckboxValue = computed(
  () => resolvedStyle.value.textDecoration === 'underline',
);
const strokeColorSameAsText = computed(
  () => resolvedStyle.value.strokeColor === 'currentcolor',
);

const canSubmit = computed(() => {
  const names = new Set<string>();

  return styles.value.every((style) => {
    const name = styleDisplayName(style).trim();

    if (name.length === 0 || names.has(name)) {
      return false;
    }

    names.add(name);
    return true;
  });
});

const selectedStyleHasOverrides = computed(() =>
  hasParagraphStyleOverrides(selectedStyle.value?.overrides ?? {}),
);
const showOverrideToggles = computed(
  () => selectedStyle.value?.parentStyleId != null,
);

const selectedBuiltInStyleMatchesDefault = computed(() => {
  const style = selectedStyle.value;

  if (style == null || !isBuiltInParagraphStyleId(style.id)) {
    return false;
  }

  return paragraphStylesEqual(
    style,
    createDefaultBuiltInParagraphStyle(style.id),
  );
});

const selectedStyleCanResetToDefault = computed(() => {
  const style = selectedStyle.value;

  return style?.builtIn === true && !selectedBuiltInStyleMatchesDefault.value;
});
const creationActions = computed(() => [
  {
    key: 'new',
    label: t(($) => $.dialog.paragraphStyles.new, { ns: 'dialog' }),
    icon: PhPlus,
    disabled: false,
    onClick: createStyle,
  },
  {
    key: 'duplicate',
    label: t(($) => $.dialog.paragraphStyles.duplicate, { ns: 'dialog' }),
    icon: PhCopy,
    disabled: selectedStyle.value == null,
    onClick: duplicateSelectedStyle,
  },
]);

const selectionActions = computed(() => [
  {
    key: 'reset',
    label: t(($) => $.dialog.paragraphStyles.resetStyleToDefault, {
      ns: 'dialog',
    }),
    icon: PhArrowCounterClockwise,
    disabled: !selectedStyleCanResetToDefault.value,
    onClick: resetSelectedStyleToDefault,
  },
  {
    key: 'clear',
    label: t(($) => $.dialog.paragraphStyles.clearFormatting, {
      ns: 'dialog',
    }),
    icon: PhTextTSlash,
    disabled: !selectedStyleHasOverrides.value,
    onClick: clearSelectedStyleFormatting,
  },
  {
    key: 'delete',
    label: t(($) => $.dialog.paragraphStyles.delete, { ns: 'dialog' }),
    icon: PhTrash,
    disabled: selectedStyle.value == null || selectedStyle.value.builtIn,
    onClick: deleteSelectedStyle,
  },
]);

function hasOverride(key: keyof ParagraphStyle['overrides']) {
  return selectedStyle.value?.overrides[key] !== undefined;
}

function isOverrideDisabled(key: keyof ParagraphStyle['overrides']) {
  return showOverrideToggles.value && !hasOverride(key);
}

function styleDisplayName(style: ParagraphStyle) {
  return getParagraphStyleDisplayName(style, t);
}

function toggleOverride(
  key: keyof ParagraphStyle['overrides'],
  value: boolean,
) {
  if (selectedStyle.value == null) {
    return;
  }

  if (value) {
    updateSelectedStyleOverride(
      key,
      resolvedStyle.value[key] as string | number | null,
    );
  } else {
    delete selectedStyle.value.overrides[key];
  }
}

function updateSelectedStyleName(value: string | number) {
  if (selectedStyle.value == null || selectedStyle.value.builtIn) {
    return;
  }

  selectedStyle.value.displayName = String(value);
}

function updateSelectedStyleParent(styleId: string) {
  if (selectedStyle.value == null) {
    return;
  }

  selectedStyle.value.parentStyleId =
    styleId === PARAGRAPH_STYLE_NONE_VALUE ? null : styleId;
}

function updateSelectedStyleOverride(
  key: keyof ParagraphStyle['overrides'],
  value: string | number | null,
) {
  if (selectedStyle.value == null) {
    return;
  }

  (selectedStyle.value.overrides as Record<string, string | number | null>)[
    key
  ] = value;
  pruneParentlessParagraphStyleRootFallbackOverrides(selectedStyle.value);
}

function onFontFamilyChanged(fontFamily: string) {
  const fontStyle = remapStyleForFamily(fontFamily);

  updateSelectedStyleOverride('fontFamily', fontFamily);
  updateSelectedStyleOverride('fontStyle', fontStyle);
}

function updateTextDecorationOverride(value: boolean | 'indeterminate') {
  updateSelectedStyleOverride(
    'textDecoration',
    value === true ? 'underline' : null,
  );
}

function clearSelectedStyleFormatting() {
  const style = selectedStyle.value;

  if (style == null || !selectedStyleHasOverrides.value) {
    return;
  }

  style.overrides = {};
}

function resetSelectedStyleToDefault() {
  const style = selectedStyle.value;

  if (
    style == null ||
    !selectedStyleCanResetToDefault.value ||
    !isBuiltInParagraphStyleId(style.id)
  ) {
    return;
  }

  const index = styles.value.findIndex(
    (candidate) => candidate.id === style.id,
  );

  if (index === -1) {
    return;
  }

  styles.value[index] = createDefaultBuiltInParagraphStyle(style.id);
}

function updateAlignmentOverride(value: unknown) {
  if (isTextBoxAlignment(value)) {
    updateSelectedStyleOverride('alignment', value);
  }
}

function createStyle() {
  const style = new ParagraphStyle();
  style.displayName = getNextStyleName(
    t(($) => $.dialog.paragraphStyles.newStyleName, { ns: 'dialog' }),
  );
  style.parentStyleId = defaultParagraphStyleId;
  styles.value.push(style);
  selectedStyleId.value = style.id;
}

function duplicateSelectedStyle() {
  const style = selectedStyle.value;

  if (style == null) {
    return;
  }

  const clone = style.clone();
  clone.id = crypto.randomUUID();
  clone.displayName = getNextStyleName(
    t(($) => $.dialog.paragraphStyles.copyStyleName, {
      ns: 'dialog',
      name: styleDisplayName(style),
    }),
  );
  if (style.id === defaultParagraphStyleId) {
    clone.parentStyleId = defaultParagraphStyleId;
  }
  styles.value.push(clone);
  selectedStyleId.value = clone.id;
}

function deleteSelectedStyle() {
  const style = selectedStyle.value;

  if (style == null || style.builtIn) {
    return;
  }

  const styleId = style.id;
  const parentStyleId = style.parentStyleId;
  const fallbackParentStyleId = parentStyleId ?? defaultParagraphStyleId;
  styles.value = styles.value
    .filter((style) => style.id !== styleId)
    .map((style) => {
      if (style.parentStyleId !== styleId) {
        return style;
      }

      const updated = style.clone();
      updated.parentStyleId = fallbackParentStyleId;
      return updated;
    });
  selectedStyleId.value = defaultParagraphStyleId;
}

function getNextStyleName(baseName: string) {
  const existingNames = new Set(
    styles.value.map((style) => styleDisplayName(style)),
  );

  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let suffix = 2;

  while (existingNames.has(`${baseName} ${suffix}`)) {
    suffix++;
  }

  return `${baseName} ${suffix}`;
}

function paragraphStylesEqual(a: ParagraphStyle, b: ParagraphStyle) {
  return (
    a.id === b.id &&
    a.displayName === b.displayName &&
    a.parentStyleId === b.parentStyleId &&
    paragraphStyleOverridesEqual(a.overrides, b.overrides)
  );
}

function paragraphStyleOverridesEqual(
  a: ParagraphStyleOverrides,
  b: ParagraphStyleOverrides,
) {
  const keys = new Set([
    ...(Object.keys(a) as Array<keyof ParagraphStyleOverrides>),
    ...(Object.keys(b) as Array<keyof ParagraphStyleOverrides>),
  ]);

  for (const key of keys) {
    if (a[key] !== b[key]) {
      return false;
    }
  }

  return true;
}

function prepareParagraphStyleForSubmit(style: ParagraphStyle) {
  const updated = style.clone();

  if (!updated.builtIn) {
    updated.displayName = updated.displayName.trim();
    if (updated.parentStyleId == null) {
      updated.parentStyleId = defaultParagraphStyleId;
    }
  }

  pruneParentlessParagraphStyleRootFallbackOverrides(updated);

  return updated;
}

function submit() {
  if (!canSubmit.value) {
    return;
  }

  emit('update', styles.value.map(prepareParagraphStyleForSubmit));
  open.value = false;
}
</script>
