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
                {{ getParagraphStyleDisplayName(style) }}
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <div class="flex flex-wrap items-center gap-2">
            <AppTooltip
              :tooltip="
                $t(($) => $.dialog.paragraphStyles.new, { ns: 'dialog' })
              "
            >
              <span class="inline-flex" @mousedown.prevent>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="
                    $t(($) => $.dialog.paragraphStyles.new, { ns: 'dialog' })
                  "
                  @click="createStyle"
                >
                  <PhPlus />
                </Button>
              </span>
            </AppTooltip>
            <AppTooltip
              :tooltip="
                $t(($) => $.dialog.paragraphStyles.duplicate, { ns: 'dialog' })
              "
            >
              <span class="inline-flex" @mousedown.prevent>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :disabled="selectedStyle == null"
                  :aria-label="
                    $t(($) => $.dialog.paragraphStyles.duplicate, {
                      ns: 'dialog',
                    })
                  "
                  @click="duplicateSelectedStyle"
                >
                  <PhCopy />
                </Button>
              </span>
            </AppTooltip>
            <div class="ml-auto flex items-center gap-2">
              <AppTooltip :tooltip="resetStyleToDefaultLabel">
                <span class="inline-flex" @mousedown.prevent>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="!selectedStyleCanResetToDefault"
                    :aria-label="resetStyleToDefaultLabel"
                    @click="resetSelectedStyleToDefault"
                  >
                    <PhArrowCounterClockwise />
                  </Button>
                </span>
              </AppTooltip>
              <AppTooltip :tooltip="clearFormattingLabel">
                <span class="inline-flex" @mousedown.prevent>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="!selectedStyleCanClearFormatting"
                    :aria-label="clearFormattingLabel"
                    @click="clearSelectedStyleFormatting"
                  >
                    <PhTextTSlash />
                  </Button>
                </span>
              </AppTooltip>
              <AppTooltip
                :tooltip="
                  $t(($) => $.dialog.paragraphStyles.delete, { ns: 'dialog' })
                "
              >
                <span class="inline-flex" @mousedown.prevent>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="selectedStyle == null || selectedStyle.builtIn"
                    :aria-label="
                      $t(($) => $.dialog.paragraphStyles.delete, {
                        ns: 'dialog',
                      })
                    "
                    @click="deleteSelectedStyle"
                  >
                    <PhTrash />
                  </Button>
                </span>
              </AppTooltip>
            </div>
          </div>
        </div>

        <TabsContent
          v-for="style in styles"
          :key="style.id"
          :value="style.id"
          class="col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden sm:col-start-2 sm:row-start-1"
        >
          <ScrollArea class="h-full min-h-0 border">
            <FieldGroup class="p-4">
              <Field orientation="horizontal">
                <div class="min-w-0 flex-1">
                  <FieldLabel for="text-style-name">
                    {{
                      $t(($) => $.dialog.paragraphStyles.name, { ns: 'dialog' })
                    }}
                  </FieldLabel>
                </div>
                <Input
                  id="text-style-name"
                  class="ml-auto w-64 shrink-0"
                  :model-value="
                    selectedStyle == null
                      ? ''
                      : getParagraphStyleDisplayName(selectedStyle)
                  "
                  :disabled="selectedStyle?.builtIn ?? false"
                  @update:model-value="updateSelectedStyleName"
                />
              </Field>

              <Field orientation="horizontal">
                <div class="min-w-0 flex-1">
                  <FieldLabel for="text-style-parent">
                    {{
                      $t(($) => $.dialog.paragraphStyles.parentStyle, {
                        ns: 'dialog',
                      })
                    }}
                  </FieldLabel>
                </div>
                <ParagraphStyleSelect
                  id="text-style-parent"
                  class="ml-auto w-64 shrink-0"
                  :disabled="selectedStyle?.id === defaultParagraphStyleId"
                  :model-value="
                    selectedStyle?.parentStyleId ?? PARAGRAPH_STYLE_NONE_VALUE
                  "
                  :paragraph-styles="availableParents"
                  :show-none-option="true"
                  :none-label="parentNoneLabel"
                  trigger-class="w-64"
                  @update:model-value="updateSelectedStyleParent"
                />
              </Field>

              <FieldSeparator />

              <Field orientation="horizontal">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <Switch
                    v-if="showOverrideToggles"
                    :model-value="hasOverride('fontFamily')"
                    @update:model-value="toggleOverride('fontFamily', $event)"
                  />
                  <FieldLabel for="text-style-font" class="shrink-0">
                    {{ $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' }) }}
                  </FieldLabel>
                </div>
                <FontCombobox
                  id="text-style-font"
                  class="ml-auto w-64 min-w-0 shrink-0"
                  :model-value="resolvedStyle.fontFamily"
                  :options="fontOptions"
                  :disabled="
                    showOverrideToggles ? !hasOverride('fontFamily') : false
                  "
                  @update:model-value="
                    updateSelectedStyleOverride('fontFamily', $event)
                  "
                />
              </Field>

              <Field orientation="horizontal">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <Switch
                    v-if="showOverrideToggles"
                    :model-value="hasOverride('fontStyle')"
                    @update:model-value="toggleOverride('fontStyle', $event)"
                  />
                  <FieldLabel for="text-style-font-style" class="shrink-0">
                    {{ $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' }) }}
                  </FieldLabel>
                </div>
                <FontStyleSelect
                  id="text-style-font-style"
                  class="ml-auto w-64 min-w-0 shrink-0"
                  :model-value="resolvedStyle.fontStyle"
                  :options="fontStyleOptions"
                  :disabled="
                    showOverrideToggles ? !hasOverride('fontStyle') : false
                  "
                  @update:model-value="
                    updateSelectedStyleOverride('fontStyle', $event)
                  "
                />
              </Field>

              <Field orientation="horizontal">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <Switch
                    v-if="showOverrideToggles"
                    :model-value="hasOverride('fontSize')"
                    @update:model-value="toggleOverride('fontSize', $event)"
                  />
                  <FieldLabel for="text-style-font-size" class="shrink-0">
                    {{ $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' }) }}
                  </FieldLabel>
                </div>
                <div class="ml-auto w-40 shrink-0">
                  <InputFontSize
                    id="text-style-font-size"
                    class="w-full"
                    :model-value="resolvedStyle.fontSize"
                    :disabled="
                      showOverrideToggles ? !hasOverride('fontSize') : false
                    "
                    @update:model-value="
                      updateSelectedStyleOverride('fontSize', $event)
                    "
                  />
                </div>
              </Field>

              <Field orientation="horizontal">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <Switch
                    v-if="showOverrideToggles"
                    :model-value="hasOverride('alignment')"
                    @update:model-value="toggleOverride('alignment', $event)"
                  />
                  <FieldLabel class="min-w-0">{{
                    $t(($) => $.toolbar.common.alignment, { ns: 'toolbar' })
                  }}</FieldLabel>
                </div>
                <ToggleGroup
                  class="ml-auto shrink-0"
                  type="single"
                  variant="outline"
                  :model-value="resolvedStyle.alignment"
                  :disabled="
                    showOverrideToggles ? !hasOverride('alignment') : false
                  "
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
              </Field>

              <Field orientation="horizontal">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <Switch
                    v-if="showOverrideToggles"
                    :model-value="hasOverride('textDecoration')"
                    @update:model-value="
                      toggleOverride('textDecoration', $event)
                    "
                  />
                  <FieldLabel class="shrink-0">{{
                    $t(($) => $.toolbar.richTextBox.textDecorations, {
                      ns: 'toolbar',
                    })
                  }}</FieldLabel>
                </div>
                <div class="ml-auto flex shrink-0 items-center gap-2">
                  <Checkbox
                    id="text-style-underline"
                    :model-value="textDecorationCheckboxValue"
                    :disabled="
                      showOverrideToggles
                        ? !hasOverride('textDecoration')
                        : false
                    "
                    @update:model-value="updateTextDecorationOverride"
                  />
                  <FieldLabel for="text-style-underline" class="shrink-0">
                    {{
                      $t(($) => $.toolbar.richTextBox.underline, {
                        ns: 'toolbar',
                      })
                    }}
                  </FieldLabel>
                </div>
              </Field>

              <Field orientation="horizontal">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <Switch
                    v-if="showOverrideToggles"
                    :model-value="hasOverride('color')"
                    @update:model-value="toggleOverride('color', $event)"
                  />
                  <FieldLabel class="shrink-0">
                    {{ $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' }) }}
                  </FieldLabel>
                </div>
                <div class="ml-auto shrink-0">
                  <ColorPicker
                    :model-value="resolvedStyle.color"
                    :disabled="
                      showOverrideToggles ? !hasOverride('color') : false
                    "
                    @update:model-value="
                      updateSelectedStyleOverride('color', $event)
                    "
                  />
                </div>
              </Field>

              <Field orientation="horizontal">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <Switch
                    v-if="showOverrideToggles"
                    :model-value="hasOverride('strokeWidth')"
                    @update:model-value="toggleOverride('strokeWidth', $event)"
                  />
                  <FieldLabel for="text-style-stroke-width" class="shrink-0">
                    {{
                      $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' })
                    }}
                  </FieldLabel>
                </div>
                <div class="ml-auto w-40 shrink-0">
                  <InputStrokeWidth
                    id="text-style-stroke-width"
                    class="w-full"
                    :model-value="resolvedStyle.strokeWidth"
                    :disabled="
                      showOverrideToggles ? !hasOverride('strokeWidth') : false
                    "
                    @update:model-value="
                      updateSelectedStyleOverride('strokeWidth', $event)
                    "
                  />
                </div>
              </Field>

              <Field orientation="horizontal">
                <div class="flex min-w-0 flex-1 items-center gap-3">
                  <Switch
                    v-if="showOverrideToggles"
                    :model-value="hasOverride('lineHeight')"
                    @update:model-value="toggleOverride('lineHeight', $event)"
                  />
                  <FieldLabel for="text-style-line-height" class="shrink-0">
                    {{
                      $t(($) => $.dialog.pageSetup.lineHeight, { ns: 'dialog' })
                    }}
                  </FieldLabel>
                </div>
                <div class="ml-auto w-40 shrink-0">
                  <InputUnit
                    id="text-style-line-height"
                    class="w-full"
                    unit="unitless"
                    :nullable="true"
                    :min="0"
                    :step="0.1"
                    :model-value="resolvedStyle.lineHeight"
                    :format-options="fraction2FormatOptions"
                    :disabled="
                      showOverrideToggles ? !hasOverride('lineHeight') : false
                    "
                    placeholder="normal"
                    @update:model-value="
                      updateSelectedStyleOverride('lineHeight', $event)
                    "
                  />
                </div>
              </Field>
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
import { computed, ref, watch } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PARAGRAPH_STYLE_NONE_VALUE } from '@/composables/useRichTextStyleCommands';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type BuiltInParagraphStyleId,
  createDefaultBuiltInParagraphStyle,
  getAvailableParagraphStyleParents,
  getBuiltInParagraphStyleNameSelector,
  ParagraphStyle,
  type ParagraphStyleOverrides,
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

const styles = ref<ParagraphStyle[]>([]);
const selectedStyleId = ref<string>(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText);

const defaultParagraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;

watch(
  [
    () => open.value,
    () => props.paragraphStyles,
    () => props.initialSelectedStyleId,
  ],
  () => {
    if (!open.value) {
      return;
    }

    styles.value = props.paragraphStyles.map((style) => style.clone());
    selectedStyleId.value = props.initialSelectedStyleId;
    selectedStyleId.value =
      styles.value.find((style) => style.id === selectedStyleId.value)?.id ??
      styles.value[0]?.id ??
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
  },
  { immediate: true },
);

const selectedStyle = computed(
  () =>
    styles.value.find((style) => style.id === selectedStyleId.value) ?? null,
);

const resolvedStyle = computed(() =>
  selectedStyle.value == null
    ? resolveParagraphStyle(styles.value, defaultParagraphStyleId)
    : resolveParagraphStyle(styles.value, selectedStyle.value.id),
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

const fontStyleOptions = computed(() =>
  fontCatalog.getStyles(resolvedStyle.value.fontFamily),
);

const textDecorationCheckboxValue = computed(() => {
  if (selectedStyle.value?.overrides.textDecoration !== undefined) {
    return selectedStyle.value.overrides.textDecoration === 'underline';
  }

  return resolvedStyle.value.textDecoration === 'underline';
});

const canSubmit = computed(() =>
  styles.value.every((style) => style.displayName.trim().length > 0),
);

const selectedStyleHasOverrides = computed(
  () => Object.keys(selectedStyle.value?.overrides ?? {}).length > 0,
);
const selectedStyleCanClearFormatting = computed(
  () => selectedStyle.value != null && selectedStyleHasOverrides.value,
);
const showOverrideToggles = computed(
  () =>
    selectedStyle.value?.parentStyleId != null ||
    selectedStyleCanClearFormatting.value,
);

const selectedBuiltInStyleMatchesDefault = computed(() => {
  const style = selectedStyle.value;

  if (style == null || style.builtIn !== true) {
    return false;
  }

  return paragraphStylesEqual(
    style,
    createDefaultBuiltInParagraphStyle(style.id as BuiltInParagraphStyleId),
  );
});

const selectedStyleCanResetToDefault = computed(
  () =>
    selectedStyle.value?.builtIn === true &&
    !selectedBuiltInStyleMatchesDefault.value,
);
const clearFormattingLabel = computed(() =>
  t(($) => $.dialog.paragraphStyles.clearFormatting, {
    ns: 'dialog',
  }),
);
const resetStyleToDefaultLabel = computed(() =>
  t(($) => $.dialog.paragraphStyles.resetStyleToDefault, {
    ns: 'dialog',
  }),
);

function hasOverride(key: keyof ParagraphStyle['overrides']) {
  return selectedStyle.value?.overrides[key] !== undefined;
}

function getParagraphStyleDisplayName(style: ParagraphStyle) {
  const selector = getBuiltInParagraphStyleNameSelector(style.id);

  return selector == null ? style.displayName : t(selector, { ns: 'dialog' });
}

function toggleOverride(
  key: keyof ParagraphStyle['overrides'],
  value: boolean,
) {
  if (selectedStyle.value == null) {
    return;
  }

  if (value) {
    const resolved = resolvedStyle.value;
    (selectedStyle.value.overrides as Record<string, string | number | null>)[
      key
    ] = resolved[key as keyof typeof resolved] as string | number | null;
  } else {
    delete selectedStyle.value.overrides[key];
  }
}

function updateSelectedStyleName(value: string | number) {
  if (selectedStyle.value == null || selectedStyle.value.builtIn) {
    return;
  }

  selectedStyle.value.displayName = String(value).trim();
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
}

function updateTextDecorationOverride(value: boolean | 'indeterminate') {
  updateSelectedStyleOverride(
    'textDecoration',
    value === true ? 'underline' : null,
  );
}

function clearSelectedStyleFormatting() {
  const style = selectedStyle.value;

  if (style == null || !selectedStyleCanClearFormatting.value) {
    return;
  }

  style.overrides = {};
}

function resetSelectedStyleToDefault() {
  const style = selectedStyle.value;

  if (style == null || !selectedStyleCanResetToDefault.value) {
    return;
  }

  const index = styles.value.findIndex(
    (candidate) => candidate.id === style.id,
  );

  if (index === -1) {
    return;
  }

  styles.value[index] = createDefaultBuiltInParagraphStyle(
    style.id as BuiltInParagraphStyleId,
  );
}

function updateAlignmentOverride(value: unknown) {
  if (
    value === 'left' ||
    value === 'center' ||
    value === 'right' ||
    value === 'justify'
  ) {
    updateSelectedStyleOverride('alignment', value);
  }
}

function createStyle() {
  const style = new ParagraphStyle();
  style.displayName = getNextStyleName(
    t(($) => $.dialog.paragraphStyles.newStyleName, { ns: 'dialog' }),
  );
  style.parentStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
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
  clone.builtIn = false;
  clone.displayName = getNextStyleName(
    t(($) => $.dialog.paragraphStyles.copyStyleName, {
      ns: 'dialog',
      name: getParagraphStyleDisplayName(style),
    }),
  );
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
  styles.value = styles.value
    .filter((style) => style.id !== styleId)
    .map((style) => {
      if (style.parentStyleId !== styleId) {
        return style;
      }

      const updated = style.clone();
      updated.parentStyleId = parentStyleId;
      return updated;
    });
  selectedStyleId.value = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
}

function getNextStyleName(baseName: string) {
  const existingNames = new Set(
    styles.value.map((style) => getParagraphStyleDisplayName(style)),
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
    a.builtIn === b.builtIn &&
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

function submit() {
  if (!canSubmit.value) {
    return;
  }

  emit(
    'update',
    styles.value.map((style) => style.clone()),
  );
  open.value = false;
}
</script>
