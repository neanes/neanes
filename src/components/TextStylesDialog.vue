<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[42rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-5xl"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.textStyles.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{
            $t(($) => $.dialog.textStyles.description, {
              ns: 'dialog',
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <div
        class="grid min-h-0 gap-4 overflow-hidden md:grid-cols-[13rem_minmax(0,1fr)]"
      >
        <div
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden"
        >
          <div class="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" @click="createStyle">
              {{ $t(($) => $.dialog.textStyles.create, { ns: 'dialog' }) }}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              :disabled="selectedStyle == null"
              @click="cloneSelectedStyle"
            >
              {{ $t(($) => $.dialog.textStyles.clone, { ns: 'dialog' }) }}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              :disabled="selectedStyle == null || selectedStyle.builtIn"
              @click="deleteSelectedStyle"
            >
              {{ $t(($) => $.dialog.textStyles.delete, { ns: 'dialog' }) }}
            </Button>
          </div>

          <ScrollArea class="min-h-0">
            <div
              class="grid gap-1 rounded-lg bg-muted p-1 text-muted-foreground"
            >
              <button
                v-for="style in styles"
                :key="style.id"
                type="button"
                class="inline-flex min-h-9 w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium transition-all"
                :class="
                  style.id === selectedStyleId
                    ? 'bg-background text-foreground shadow-sm'
                    : 'hover:bg-background/60 hover:text-foreground'
                "
                @click="selectedStyleId = style.id"
              >
                <div class="font-medium">{{ style.displayName }}</div>
              </button>
            </div>
          </ScrollArea>
        </div>

        <div
          v-if="selectedStyle != null"
          class="flex min-h-0 flex-col overflow-hidden"
        >
          <ScrollArea class="h-full min-h-0 border">
            <FieldGroup class="p-4">
              <Field orientation="horizontal">
                <div class="min-w-0 flex-1">
                  <FieldLabel for="text-style-name">
                    {{ $t(($) => $.dialog.textStyles.name, { ns: 'dialog' }) }}
                  </FieldLabel>
                </div>
                <Input
                  id="text-style-name"
                  class="ml-auto w-64 shrink-0"
                  :model-value="selectedStyle.displayName"
                  :disabled="selectedStyle.builtIn"
                  @update:model-value="updateSelectedStyleName"
                />
              </Field>

              <Field
                v-if="selectedStyle.id !== defaultTextStyleId"
                orientation="horizontal"
              >
                <div class="min-w-0 flex-1">
                  <FieldLabel for="text-style-parent">
                    {{
                      $t(($) => $.dialog.textStyles.parentStyle, {
                        ns: 'dialog',
                      })
                    }}
                  </FieldLabel>
                </div>
                <TextStyleSelect
                  id="text-style-parent"
                  class="ml-auto w-40 shrink-0"
                  :model-value="
                    selectedStyle.parentStyleId ?? defaultTextStyleId
                  "
                  :text-styles="availableParents"
                  trigger-class="w-40"
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
                      $t(($) => $.toolbar.selection.justify, {
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
        </div>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" type="button">
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
        <Button type="button" :disabled="!canSubmit" @click="submit">
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  PhTextAlignCenter,
  PhTextAlignJustify,
  PhTextAlignLeft,
  PhTextAlignRight,
} from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed, ref, watch } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import TextStyleSelect from '@/components/TextStyleSelect.vue';
import { Button } from '@/components/ui/button';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  BUILT_IN_TEXT_STYLE_IDS,
  getAvailableTextStyleParents,
  resolveTextStyle,
  TextStyle,
} from '@/models/TextStyle';
import { fontCatalog } from '@/services/FontCatalog';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';

const props = defineProps({
  textStyles: {
    type: Array as PropType<TextStyle[]>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
  initialSelectedStyleId: {
    type: String,
    default: BUILT_IN_TEXT_STYLE_IDS.DefaultText,
  },
});

const emit = defineEmits<{
  update: [styles: TextStyle[]];
}>();

const open = defineModel<boolean>('open', { required: true });

const styles = ref<TextStyle[]>([]);
const selectedStyleId = ref<string>(BUILT_IN_TEXT_STYLE_IDS.DefaultText);

const defaultTextStyleId = BUILT_IN_TEXT_STYLE_IDS.DefaultText;

watch(
  [
    () => open.value,
    () => props.textStyles,
    () => props.initialSelectedStyleId,
  ],
  () => {
    if (!open.value) {
      return;
    }

    styles.value = props.textStyles.map((style) => style.clone());
    selectedStyleId.value = props.initialSelectedStyleId;
    selectedStyleId.value =
      styles.value.find((style) => style.id === selectedStyleId.value)?.id ??
      styles.value[0]?.id ??
      BUILT_IN_TEXT_STYLE_IDS.DefaultText;
  },
  { immediate: true },
);

const selectedStyle = computed(
  () =>
    styles.value.find((style) => style.id === selectedStyleId.value) ?? null,
);
const showOverrideToggles = computed(
  () => selectedStyle.value?.parentStyleId != null,
);

const resolvedStyle = computed(() =>
  selectedStyle.value == null
    ? resolveTextStyle(styles.value, defaultTextStyleId)
    : resolveTextStyle(styles.value, selectedStyle.value.id),
);

const availableParents = computed(() => {
  if (selectedStyle.value == null) {
    return [];
  }

  return getAvailableTextStyleParents(styles.value, selectedStyle.value.id);
});

const fontOptions = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

const fontStyleOptions = computed(() =>
  fontCatalog.getStyles(resolvedStyle.value.fontFamily),
);

const canSubmit = computed(() =>
  styles.value.every((style) => style.displayName.trim().length > 0),
);

function hasOverride(key: keyof TextStyle['overrides']) {
  return selectedStyle.value?.overrides[key] !== undefined;
}

function toggleOverride(key: keyof TextStyle['overrides'], value: boolean) {
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

  selectedStyle.value.parentStyleId = styleId;
}

function updateSelectedStyleOverride(
  key: keyof TextStyle['overrides'],
  value: string | number | null,
) {
  if (selectedStyle.value == null) {
    return;
  }

  (selectedStyle.value.overrides as Record<string, string | number | null>)[
    key
  ] = value;
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
  const style = new TextStyle();
  style.displayName = getNextStyleName('Text Style');
  style.parentStyleId = BUILT_IN_TEXT_STYLE_IDS.DefaultText;
  styles.value.push(style);
  selectedStyleId.value = style.id;
}

function cloneSelectedStyle() {
  if (selectedStyle.value == null) {
    return;
  }

  const clone = selectedStyle.value.clone();
  clone.id = crypto.randomUUID();
  clone.builtIn = false;
  clone.displayName = getNextStyleName(
    `${selectedStyle.value.displayName} Copy`,
  );
  styles.value.push(clone);
  selectedStyleId.value = clone.id;
}

function deleteSelectedStyle() {
  if (selectedStyle.value == null || selectedStyle.value.builtIn) {
    return;
  }

  const styleId = selectedStyle.value.id;
  const parentStyleId = selectedStyle.value.parentStyleId;
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
  selectedStyleId.value = BUILT_IN_TEXT_STYLE_IDS.DefaultText;
}

function getNextStyleName(baseName: string) {
  const existingNames = new Set(styles.value.map((style) => style.displayName));

  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let suffix = 2;

  while (existingNames.has(`${baseName} ${suffix}`)) {
    suffix++;
  }

  return `${baseName} ${suffix}`;
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
