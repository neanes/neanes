<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-5xl"
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
      <div class="grid min-h-0 flex-1 gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
        <div class="flex min-h-0 flex-col overflow-hidden rounded-md border">
          <div class="flex items-center gap-2 border-b p-2">
            <Button type="button" size="sm" @click="createStyle">
              {{ $t(($) => $.dialog.paragraphStyles.create, { ns: 'dialog' }) }}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              :disabled="selectedStyle == null"
              @click="cloneSelectedStyle"
            >
              {{ $t(($) => $.dialog.paragraphStyles.clone, { ns: 'dialog' }) }}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              :disabled="selectedStyle == null || selectedStyle.builtIn"
              @click="deleteSelectedStyle"
            >
              {{ $t(($) => $.dialog.paragraphStyles.delete, { ns: 'dialog' }) }}
            </Button>
          </div>
          <ScrollArea class="min-h-0 flex-1">
            <div class="grid gap-1 p-2">
              <button
                v-for="style in styles"
                :key="style.id"
                type="button"
                class="rounded-md border px-3 py-2 text-left text-sm transition-colors"
                :class="
                  style.id === selectedStyleId
                    ? 'border-primary bg-primary/10'
                    : 'border-transparent hover:bg-muted'
                "
                @click="selectedStyleId = style.id"
              >
                <div class="font-medium">{{ style.displayName }}</div>
                <div class="text-xs text-muted-foreground">
                  {{
                    style.builtIn
                      ? $t(($) => $.dialog.paragraphStyles.builtIn, {
                          ns: 'dialog',
                        })
                      : $t(($) => $.dialog.paragraphStyles.custom, {
                          ns: 'dialog',
                        })
                  }}
                </div>
              </button>
            </div>
          </ScrollArea>
        </div>

        <div
          v-if="selectedStyle != null"
          class="flex min-h-0 flex-col overflow-hidden"
        >
          <ScrollArea class="min-h-0 flex-1 rounded-md border">
            <FieldGroup class="p-4">
              <Field>
                <FieldLabel for="paragraph-style-name">
                  {{
                    $t(($) => $.dialog.paragraphStyles.name, { ns: 'dialog' })
                  }}
                </FieldLabel>
                <Input
                  id="paragraph-style-name"
                  :model-value="selectedStyle.displayName"
                  :disabled="selectedStyle.builtIn"
                  @update:model-value="updateSelectedStyleName"
                />
              </Field>

              <Field v-if="selectedStyle.id !== defaultTextStyleId">
                <FieldLabel for="paragraph-style-parent">
                  {{
                    $t(($) => $.dialog.paragraphStyles.parentStyle, {
                      ns: 'dialog',
                    })
                  }}
                </FieldLabel>
                <ParagraphStyleSelect
                  id="paragraph-style-parent"
                  :model-value="
                    selectedStyle.parentStyleId ?? defaultTextStyleId
                  "
                  :paragraph-styles="availableParents"
                  @update:model-value="updateSelectedStyleParent"
                />
              </Field>

              <div
                v-if="selectedStyle.builtIn"
                class="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
              >
                {{
                  $t(($) => $.dialog.paragraphStyles.builtInDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>

              <FieldSeparator />

              <Field>
                <div class="mb-2 flex items-center justify-between gap-3">
                  <FieldLabel>{{
                    $t(($) => $.toolbar.common.alignment, { ns: 'toolbar' })
                  }}</FieldLabel>
                  <Switch
                    :model-value="hasOverride('alignment')"
                    @update:model-value="toggleOverride('alignment', $event)"
                  />
                </div>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  :model-value="resolvedStyle.alignment"
                  :disabled="!hasOverride('alignment')"
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

              <Field>
                <div class="mb-2 flex items-center justify-between gap-3">
                  <FieldLabel for="paragraph-style-font">
                    {{ $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' }) }}
                  </FieldLabel>
                  <Switch
                    :model-value="hasOverride('fontFamily')"
                    @update:model-value="toggleOverride('fontFamily', $event)"
                  />
                </div>
                <FontCombobox
                  id="paragraph-style-font"
                  class="w-full max-w-full"
                  :model-value="resolvedStyle.fontFamily"
                  :options="fontOptions"
                  :disabled="!hasOverride('fontFamily')"
                  @update:model-value="
                    updateSelectedStyleOverride('fontFamily', $event)
                  "
                />
              </Field>

              <Field>
                <div class="mb-2 flex items-center justify-between gap-3">
                  <FieldLabel for="paragraph-style-font-style">
                    {{ $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' }) }}
                  </FieldLabel>
                  <Switch
                    :model-value="hasOverride('fontStyle')"
                    @update:model-value="toggleOverride('fontStyle', $event)"
                  />
                </div>
                <FontStyleSelect
                  id="paragraph-style-font-style"
                  class="w-full max-w-full"
                  :model-value="resolvedStyle.fontStyle"
                  :options="fontStyleOptions"
                  :disabled="!hasOverride('fontStyle')"
                  @update:model-value="
                    updateSelectedStyleOverride('fontStyle', $event)
                  "
                />
              </Field>

              <Field orientation="horizontal">
                <FieldLabel for="paragraph-style-font-size">
                  {{ $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' }) }}
                </FieldLabel>
                <div class="flex items-center gap-3">
                  <InputFontSize
                    id="paragraph-style-font-size"
                    :model-value="resolvedStyle.fontSize"
                    :disabled="!hasOverride('fontSize')"
                    @update:model-value="
                      updateSelectedStyleOverride('fontSize', $event)
                    "
                  />
                  <Switch
                    :model-value="hasOverride('fontSize')"
                    @update:model-value="toggleOverride('fontSize', $event)"
                  />
                </div>
              </Field>

              <Field orientation="horizontal">
                <FieldLabel>
                  {{ $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' }) }}
                </FieldLabel>
                <div class="flex items-center gap-3">
                  <ColorPicker
                    :model-value="resolvedStyle.color"
                    :disabled="!hasOverride('color')"
                    @update:model-value="
                      updateSelectedStyleOverride('color', $event)
                    "
                  />
                  <Switch
                    :model-value="hasOverride('color')"
                    @update:model-value="toggleOverride('color', $event)"
                  />
                </div>
              </Field>

              <Field orientation="horizontal">
                <FieldLabel for="paragraph-style-stroke-width">
                  {{ $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' }) }}
                </FieldLabel>
                <div class="flex items-center gap-3">
                  <InputStrokeWidth
                    id="paragraph-style-stroke-width"
                    :model-value="resolvedStyle.strokeWidth"
                    :disabled="!hasOverride('strokeWidth')"
                    @update:model-value="
                      updateSelectedStyleOverride('strokeWidth', $event)
                    "
                  />
                  <Switch
                    :model-value="hasOverride('strokeWidth')"
                    @update:model-value="toggleOverride('strokeWidth', $event)"
                  />
                </div>
              </Field>

              <Field orientation="horizontal">
                <FieldLabel for="paragraph-style-line-height">
                  {{
                    $t(($) => $.dialog.pageSetup.lineHeight, { ns: 'dialog' })
                  }}
                </FieldLabel>
                <div class="flex items-center gap-3">
                  <InputUnit
                    id="paragraph-style-line-height"
                    unit="unitless"
                    :nullable="true"
                    :min="0"
                    :step="0.1"
                    :model-value="resolvedStyle.lineHeight"
                    :format-options="fraction2FormatOptions"
                    :disabled="!hasOverride('lineHeight')"
                    placeholder="normal"
                    @update:model-value="
                      updateSelectedStyleOverride('lineHeight', $event)
                    "
                  />
                  <Switch
                    :model-value="hasOverride('lineHeight')"
                    @update:model-value="toggleOverride('lineHeight', $event)"
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
        <Button type="button" @click="submit">
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
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
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
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  getAvailableParagraphStyleParents,
  ParagraphStyle,
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
});

const emit = defineEmits<{
  update: [styles: ParagraphStyle[]];
}>();

const open = defineModel<boolean>('open', { required: true });

const styles = ref<ParagraphStyle[]>([]);
const selectedStyleId = ref<string>(BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText);

const defaultTextStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;

watch(
  [() => open.value, () => props.paragraphStyles],
  () => {
    if (!open.value) {
      return;
    }

    styles.value = props.paragraphStyles.map((style) => style.clone());
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
    ? resolveParagraphStyle(styles.value, defaultTextStyleId)
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

const fontOptions = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

const fontStyleOptions = computed(() =>
  fontCatalog.getStyles(resolvedStyle.value.fontFamily),
);

function hasOverride(key: keyof ParagraphStyle['overrides']) {
  return selectedStyle.value?.overrides[key] !== undefined;
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

  selectedStyle.value.displayName = String(value).trim() || 'Paragraph Style';
}

function updateSelectedStyleParent(styleId: string) {
  if (selectedStyle.value == null) {
    return;
  }

  selectedStyle.value.parentStyleId = styleId;
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
  style.displayName = getNextStyleName('Paragraph Style');
  style.parentStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
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
  selectedStyleId.value = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
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
  emit(
    'update',
    styles.value.map((style) => style.clone()),
  );
  open.value = false;
}
</script>
