<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="grid h-[42rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-6xl"
    >
      <DialogHeader>
        <DialogTitle>{{
          $t(($) => $.dialog.initialMartyriaStyles.root, { ns: 'dialog' })
        }}</DialogTitle>
        <DialogDescription>{{
          $t(($) => $.dialog.initialMartyriaStyles.description, {
            ns: 'dialog',
          })
        }}</DialogDescription>
      </DialogHeader>
      <div class="grid min-h-0 gap-4 sm:grid-cols-[13rem_minmax(0,1fr)_18rem]">
        <div class="flex min-h-0 flex-col gap-2">
          <ScrollArea class="min-h-0 flex-1 border"
            ><div class="p-1">
              <Button
                v-for="style in allStyles"
                :key="style.id"
                variant="ghost"
                class="w-full justify-start"
                :class="selectedStyleId === style.id && 'bg-accent'"
                @click="selectedStyleId = style.id"
                >{{ styleDisplayName(style) }}</Button
              >
            </div></ScrollArea
          >
          <div class="flex gap-1">
            <Button size="sm" variant="outline" @click="createStyle">{{
              $t(($) => $.dialog.initialMartyriaStyles.new, { ns: 'dialog' })
            }}</Button>
            <Button
              size="sm"
              variant="outline"
              :disabled="selectedStyle == null"
              @click="duplicateStyle"
              >{{
                $t(($) => $.dialog.initialMartyriaStyles.duplicate, {
                  ns: 'dialog',
                })
              }}</Button
            >
            <Button
              size="sm"
              variant="outline"
              :disabled="
                selectedCustomStyle == null || selectedStyleId === activeStyleId
              "
              @click="deleteStyle"
              >{{
                $t(($) => $.dialog.initialMartyriaStyles.delete, {
                  ns: 'dialog',
                })
              }}</Button
            >
          </div>
        </div>
        <ScrollArea class="min-h-0 border">
          <FieldGroup v-if="selectedStyle != null" class="p-4">
            <Field orientation="horizontal"
              ><FieldLabel>{{
                $t(($) => $.dialog.initialMartyriaStyles.name, { ns: 'dialog' })
              }}</FieldLabel
              ><Input
                :disabled="selectedCustomStyle == null"
                :model-value="styleDisplayName(selectedStyle)"
                @update:model-value="updateName"
            /></Field>
            <Field orientation="horizontal"
              ><FieldLabel>{{
                $t(($) => $.dialog.initialMartyriaStyles.flowDirection, {
                  ns: 'dialog',
                })
              }}</FieldLabel>
              <Select
                :disabled="selectedCustomStyle == null"
                :model-value="selectedStyle.flowDirection"
                @update:model-value="updateFlowDirection"
                ><SelectTrigger><SelectValue /></SelectTrigger
                ><SelectContent
                  ><SelectItem value="page">{{
                    $t(($) => $.dialog.initialMartyriaStyles.page, {
                      ns: 'dialog',
                    })
                  }}</SelectItem
                  ><SelectItem value="ltr">LTR</SelectItem
                  ><SelectItem value="rtl">RTL</SelectItem></SelectContent
                ></Select
              >
            </Field>
            <Field orientation="horizontal">
              <FieldLabel>{{
                $t(
                  ($) => $.dialog.initialMartyriaStyles.defaultParagraphStyle,
                  { ns: 'dialog' },
                )
              }}</FieldLabel>
              <ParagraphStyleSelect
                class="flex-1"
                trigger-class="w-full"
                :disabled="selectedCustomStyle == null"
                :model-value="selectedStyle.defaultParagraphStyleId"
                :paragraph-styles="paragraphStyles"
                @update:model-value="updateDefaultParagraphStyle"
              />
            </Field>
            <div class="rounded border bg-muted/30 p-3 text-sm">
              <div class="font-medium">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.glyphAppearance, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <div class="mt-1 text-muted-foreground">
                {{
                  $t(
                    ($) =>
                      $.dialog.initialMartyriaStyles
                        .glyphAppearanceFromPageSetup,
                    { ns: 'dialog' },
                  )
                }}
              </div>
              <div class="mt-2 flex items-center gap-2">
                <span
                  class="size-4 rounded-sm border"
                  :style="{ backgroundColor: pageSetup.modeKeyDefaultColor }"
                />
                <span>{{ pageSetup.modeKeyDefaultColor }}</span>
                <span class="text-muted-foreground">·</span>
                <span>
                  {{ $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' }) }}:
                  {{ glyphStrokeWidth }} pt
                </span>
              </div>
            </div>
            <details
              v-if="usesCustomStartingNoteText"
              class="rounded border p-2"
            >
              <summary class="cursor-pointer text-sm font-medium">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.startingNoteNames, {
                    ns: 'dialog',
                  })
                }}
              </summary>
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <Field
                  v-for="note in initialMartyriaCanonicalNotes"
                  :key="note"
                  orientation="horizontal"
                  ><FieldLabel>{{
                    $t(startingNoteLabel(note), { ns: 'model' })
                  }}</FieldLabel
                  ><Input
                    :disabled="selectedCustomStyle == null"
                    :model-value="selectedStyle.startingNoteText.names[note]"
                    @update:model-value="
                      (value) => updateStartingNoteName(note, value)
                    "
                /></Field>
                <Field orientation="horizontal"
                  ><FieldLabel>{{
                    $t(($) => $.dialog.initialMartyriaStyles.languageTag, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel
                  ><Input
                    :disabled="selectedCustomStyle == null"
                    :model-value="selectedStyle.startingNoteText.languageTag"
                    @update:model-value="updateStartingNoteLanguageTag"
                /></Field>
                <Field orientation="horizontal"
                  ><FieldLabel>{{
                    $t(($) => $.dialog.initialMartyriaStyles.writingDirection, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel
                  ><Select
                    :disabled="selectedCustomStyle == null"
                    :model-value="selectedStyle.startingNoteText.direction"
                    @update:model-value="updateStartingNoteDirection"
                    ><SelectTrigger><SelectValue /></SelectTrigger
                    ><SelectContent
                      ><SelectItem value="ltr">LTR</SelectItem
                      ><SelectItem value="rtl">RTL</SelectItem></SelectContent
                    ></Select
                  ></Field
                >
                <Button
                  size="sm"
                  variant="outline"
                  :disabled="selectedCustomStyle == null"
                  @click="resetStartingNoteNames"
                  >{{
                    $t(
                      ($) =>
                        $.dialog.initialMartyriaStyles.resetStartingNoteNames,
                      { ns: 'dialog' },
                    )
                  }}</Button
                >
              </div>
            </details>
            <Field
              ><FieldLabel>{{
                $t(($) => $.dialog.initialMartyriaStyles.components, {
                  ns: 'dialog',
                })
              }}</FieldLabel>
              <div class="space-y-2">
                <div
                  v-for="(component, index) in selectedStyle.components"
                  :key="component.id"
                  class="rounded border p-2"
                  :class="draggedComponentId === component.id && 'opacity-50'"
                  @dragover="handleComponentDragOver(component, $event)"
                  @drop="handleComponentDrop(component, $event)"
                >
                  <div class="flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      class="cursor-grab active:cursor-grabbing"
                      :disabled="selectedCustomStyle == null"
                      draggable="true"
                      :aria-label="
                        $t(
                          ($) => $.dialog.initialMartyriaStyles.dragComponent,
                          {
                            ns: 'dialog',
                          },
                        )
                      "
                      @dragstart="handleComponentDragStart(component, $event)"
                      @dragend="handleComponentDragEnd"
                      >⋮⋮</Button
                    >
                    <span class="min-w-0 flex-1 text-sm font-medium">
                      {{ componentKindLabel(component) }}
                    </span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      :disabled="selectedCustomStyle == null || index === 0"
                      @click="moveComponent(index, -1)"
                      >↑</Button
                    ><Button
                      size="icon-sm"
                      variant="ghost"
                      :disabled="
                        selectedCustomStyle == null ||
                        index === selectedStyle.components.length - 1
                      "
                      @click="moveComponent(index, 1)"
                      >↓</Button
                    ><Button
                      size="icon-sm"
                      variant="ghost"
                      :disabled="
                        selectedCustomStyle == null ||
                        selectedStyle.components.length <= 1
                      "
                      @click="removeComponent(index)"
                      >×</Button
                    >
                  </div>
                  <div v-if="isTextComponent(component)" class="mt-2 space-y-2">
                    <Input
                      v-if="component.kind === 'text'"
                      :disabled="selectedCustomStyle == null"
                      :model-value="component.content"
                      @update:model-value="
                        (value) => updateInlineText(index, value)
                      "
                    />
                    <div v-else class="space-y-2">
                      <Field
                        v-for="(_, line) in textComponentLines(component)"
                        :key="line"
                        orientation="horizontal"
                      >
                        <FieldLabel>
                          {{
                            line === 0
                              ? $t(
                                  ($) =>
                                    $.dialog.initialMartyriaStyles
                                      .stackedTopRow,
                                  { ns: 'dialog' },
                                )
                              : line === 1
                                ? $t(
                                    ($) =>
                                      $.dialog.initialMartyriaStyles
                                        .stackedBottomRow,
                                    { ns: 'dialog' },
                                  )
                                : $t(
                                    ($) =>
                                      $.dialog.initialMartyriaStyles.stackedRow,
                                    { ns: 'dialog', row: Number(line) + 1 },
                                  )
                          }}
                        </FieldLabel>
                        <Input
                          :model-value="
                            textComponentLines(component)[Number(line)]
                          "
                          @update:model-value="
                            (value) =>
                              updateStackedLine(index, Number(line), value)
                          "
                        />
                      </Field>
                    </div>
                  </div>
                  <Field
                    v-if="component.kind === 'startingNoteCluster'"
                    class="mt-2"
                    orientation="horizontal"
                  >
                    <FieldLabel>{{
                      $t(
                        ($) =>
                          $.dialog.initialMartyriaStyles.startingNoteRendering,
                        { ns: 'dialog' },
                      )
                    }}</FieldLabel>
                    <Select
                      :disabled="selectedCustomStyle == null"
                      :model-value="component.rendering"
                      @update:model-value="
                        (value) => updateStartingNoteRendering(index, value)
                      "
                    >
                      <SelectTrigger class="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neume">
                          {{
                            $t(
                              ($) =>
                                $.dialog.initialMartyriaStyles
                                  .startingNoteNeumes,
                              { ns: 'dialog' },
                            )
                          }}
                        </SelectItem>
                        <SelectItem value="customText">
                          {{
                            $t(
                              ($) =>
                                $.dialog.initialMartyriaStyles
                                  .startingNoteCustomText,
                              { ns: 'dialog' },
                            )
                          }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field
                    v-if="isCustomTextComponent(component)"
                    class="mt-2"
                    orientation="horizontal"
                  >
                    <FieldLabel>{{
                      $t(
                        ($) =>
                          $.dialog.initialMartyriaStyles.paragraphStyleOverride,
                        { ns: 'dialog' },
                      )
                    }}</FieldLabel>
                    <ParagraphStyleSelect
                      class="flex-1"
                      trigger-class="w-full"
                      :disabled="selectedCustomStyle == null"
                      :model-value="
                        component.paragraphStyleId ?? PARAGRAPH_STYLE_NONE_VALUE
                      "
                      :paragraph-styles="paragraphStyles"
                      show-none-option
                      :none-label="
                        $t(
                          ($) =>
                            $.dialog.initialMartyriaStyles
                              .useDefaultParagraphStyle,
                          { ns: 'dialog' },
                        )
                      "
                      @update:model-value="
                        (value) => updateComponentParagraphStyle(index, value)
                      "
                    />
                  </Field>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <label
                      v-for="mode in modes"
                      :key="mode"
                      class="flex items-center gap-1 text-sm"
                      ><Checkbox
                        :disabled="selectedCustomStyle == null"
                        :model-value="component.visibility.modes.includes(mode)"
                        @update:model-value="
                          (value) => updateVisibility(index, mode, value)
                        "
                      />{{ mode }}</label
                    >
                  </div>
                  <details class="mt-2 rounded border p-2">
                    <summary class="cursor-pointer text-sm">
                      {{
                        $t(
                          ($) =>
                            $.dialog.initialMartyriaStyles.variationOverrides,
                          { ns: 'dialog' },
                        )
                      }}
                    </summary>
                    <div class="mt-2 space-y-2">
                      <div
                        v-for="override in component.visibility
                          .variationOverrides"
                        :key="override.templateId"
                        class="flex items-center gap-2"
                      >
                        <span class="min-w-0 flex-1 text-sm">
                          {{ variationTemplateLabel(override.templateId) }}
                        </span>
                        <Select
                          :disabled="selectedCustomStyle == null"
                          :model-value="override.visible ? 'visible' : 'hidden'"
                          @update:model-value="
                            (value) =>
                              updateVariationVisibility(
                                index,
                                override.templateId,
                                value,
                              )
                          "
                        >
                          <SelectTrigger class="w-28"
                            ><SelectValue
                          /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="visible">{{
                              $t(
                                ($) => $.dialog.initialMartyriaStyles.visible,
                                { ns: 'dialog' },
                              )
                            }}</SelectItem>
                            <SelectItem value="hidden">{{
                              $t(($) => $.dialog.initialMartyriaStyles.hidden, {
                                ns: 'dialog',
                              })
                            }}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          :disabled="selectedCustomStyle == null"
                          :aria-label="
                            $t(
                              ($) =>
                                $.dialog.initialMartyriaStyles.removeOverride,
                              { ns: 'dialog' },
                            )
                          "
                          @click="
                            removeVariationOverride(index, override.templateId)
                          "
                          >×</Button
                        >
                      </div>
                      <Select
                        v-model="variationSelection"
                        :disabled="
                          selectedCustomStyle == null ||
                          availableVariationTemplates(component).length === 0
                        "
                        @update:model-value="
                          (value) => addVariationOverride(index, value)
                        "
                      >
                        <SelectTrigger class="w-full"
                          ><SelectValue
                            :placeholder="
                              $t(
                                ($) =>
                                  $.dialog.initialMartyriaStyles
                                    .addVariationOverride,
                                { ns: 'dialog' },
                              )
                            "
                        /></SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            v-for="template in availableVariationTemplates(
                              component,
                            )"
                            :key="template.id"
                            :value="String(template.id)"
                          >
                            {{ variationTemplateLabel(template.id) }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </details>
                </div>
              </div>
              <div class="mt-2 flex gap-2">
                <Select
                  v-model="componentKindSelection"
                  :disabled="
                    selectedCustomStyle == null ||
                    availableComponentKinds.length === 0
                  "
                  @update:model-value="addComponent"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue
                      :placeholder="
                        $t(($) => $.dialog.initialMartyriaStyles.addComponent, {
                          ns: 'dialog',
                        })
                      "
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="kind in availableComponentKinds"
                      :key="kind"
                      :value="kind"
                    >
                      {{ componentKindLabel(kind) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Field>
          </FieldGroup>
        </ScrollArea>
        <ScrollArea class="min-h-0 border">
          <div class="space-y-2 p-3">
            <p class="text-sm font-medium">
              {{
                $t(($) => $.dialog.initialMartyriaStyles.preview, {
                  ns: 'dialog',
                })
              }}
            </p>
            <div
              v-for="preview in previewTemplates"
              :key="preview.template.id"
              class="rounded border px-2 py-1"
            >
              <ModeKeyRenderer
                class="!w-auto !border-0 [--zoom:1]"
                :element="preview.element"
                :page-setup="previewPageSetup"
                :initial-martyria-styles="workingStyles"
                :paragraph-styles="paragraphStyles"
              />
              <p class="text-xs text-muted-foreground">
                {{ $t(preview.template.description, { ns: 'model' }) }}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
      <DialogFooter
        ><Button
          variant="outline"
          :disabled="selectedStyleId === activeStyleId || !stylesAreValid"
          @click="useForDocument"
          >{{
            $t(($) => $.dialog.initialMartyriaStyles.useForDocument, {
              ns: 'dialog',
            })
          }}</Button
        ><DialogClose as-child
          ><Button variant="outline">{{
            $t(($) => $.dialog.common.cancel, { ns: 'dialog' })
          }}</Button></DialogClose
        ><Button :disabled="!stylesAreValid" @click="submit">{{
          $t(($) => $.dialog.common.update, { ns: 'dialog' })
        }}</Button></DialogFooter
      >
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, ref, toRaw, watch } from 'vue';

import ModeKeyRenderer from '@/components/ModeKeyRenderer.vue';
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PARAGRAPH_STYLE_NONE_VALUE } from '@/composables/useRichTextStyleCommands';
import { ModeKeyElement } from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  builtInInitialMartyriaStyles,
  cloneInitialMartyriaStyle,
  createInitialMartyriaStartingNoteText,
  getInitialMartyriaStyleDisplayName,
  type InitialMartyriaCanonicalNote,
  initialMartyriaCanonicalNotes,
  type InitialMartyriaComponent,
  type InitialMartyriaStyle,
  type ModeKeyMode,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { getModeSignLabelSelector } from '@/models/NeumeI18nMappings';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { Unit } from '@/utils/Unit';

const props = defineProps<{
  styles: InitialMartyriaStyle[];
  pageSetup: PageSetup;
  paragraphStyles: ParagraphStyle[];
  activeStyleId?: string | null;
}>();
const emit = defineEmits<{
  update: [styles: InitialMartyriaStyle[]];
  'use-style': [id: string];
}>();
const open = defineModel<boolean>('open', { required: true });
const { t } = useTranslation();
const modes: ModeKeyMode[] = [1, 2, 3, 4, 5, 6, 7, 8];
const workingStyles = ref<InitialMartyriaStyle[]>([]);
const draggedComponentId = ref<string | null>(null);
const componentKindSelection = ref('');
const variationSelection = ref('');
const glyphStrokeWidth = computed(() =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
    Unit.toPt(props.pageSetup.modeKeyDefaultStrokeWidth),
  ),
);
const selectedStyleId = ref(
  props.activeStyleId ?? BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
);
const previewTemplates = modeKeyTemplates.map((template) => ({
  template,
  element: ModeKeyElement.createFromTemplate(template),
}));
const previewPageSetup = computed(() => {
  const pageSetup = Object.assign(
    Object.create(Object.getPrototypeOf(props.pageSetup)),
    toRaw(props.pageSetup),
  ) as PageSetup;
  pageSetup.initialMartyriaStyleId = selectedStyleId.value;
  return pageSetup;
});
const allStyles = computed(() => [
  ...builtInInitialMartyriaStyles,
  ...workingStyles.value,
]);
const selectedStyle = computed(
  () =>
    allStyles.value.find((style) => style.id === selectedStyleId.value) ??
    traditionalGreekInitialMartyriaStyle,
);
const selectedCustomStyle = computed(
  () =>
    workingStyles.value.find((style) => style.id === selectedStyleId.value) ??
    null,
);
const stylesAreValid = computed(() =>
  workingStyles.value.every(
    (style) => validateInitialMartyriaStyle(style).length === 0,
  ),
);
const usesCustomStartingNoteText = computed(() =>
  selectedStyle.value.components.some(
    (component) =>
      component.kind === 'startingNoteCluster' &&
      component.rendering === 'customText',
  ),
);
type ComponentAuthoringKind =
  | 'text'
  | 'stackedText'
  | 'ekhosGlyph'
  | 'plagalGlyph'
  | 'modeSignGlyph'
  | 'varysGlyph'
  | 'startingNoteClusterNeume'
  | 'startingNoteClusterText';
const availableComponentKinds = computed<ComponentAuthoringKind[]>(() => {
  const components = selectedStyle.value.components;
  const hasKind = (kind: InitialMartyriaComponent['kind']) =>
    components.some((component) => component.kind === kind);
  const hasStartingNoteCluster = hasKind('startingNoteCluster');
  return [
    'text',
    'stackedText',
    'ekhosGlyph',
    'plagalGlyph',
    'modeSignGlyph',
    'varysGlyph',
    ...(hasStartingNoteCluster
      ? []
      : ['startingNoteClusterNeume', 'startingNoteClusterText']),
  ].filter((kind) =>
    kind === 'text'
      ? true
      : kind === 'startingNoteClusterNeume' ||
          kind === 'startingNoteClusterText'
        ? !hasStartingNoteCluster
        : !hasKind(kind as InitialMartyriaComponent['kind']),
  ) as ComponentAuthoringKind[];
});
watch(
  () => [open.value, props.styles, props.activeStyleId] as const,
  () => {
    if (open.value) {
      const styles = props.styles.map(cloneInitialMartyriaStyle);
      workingStyles.value = styles;
      const availableIds = new Set([
        ...builtInInitialMartyriaStyles.map((style) => style.id),
        ...styles.map((style) => style.id),
      ]);
      if (
        props.activeStyleId != null &&
        availableIds.has(props.activeStyleId)
      ) {
        selectedStyleId.value = props.activeStyleId;
      } else if (!availableIds.has(selectedStyleId.value)) {
        selectedStyleId.value =
          BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1;
      }
      componentKindSelection.value = '';
      variationSelection.value = '';
      draggedComponentId.value = null;
    }
  },
  { immediate: true },
);
function updateSelected(update: (style: InitialMartyriaStyle) => void) {
  const style = workingStyles.value.find(
    (item) => item.id === selectedStyleId.value,
  );
  if (style != null) {
    update(style);
  }
}
function applyStyles() {
  if (!stylesAreValid.value) {
    return false;
  }
  emit('update', workingStyles.value.map(cloneInitialMartyriaStyle));
  return true;
}
function submit() {
  if (applyStyles()) {
    open.value = false;
  }
}
function useForDocument() {
  if (!applyStyles()) {
    return;
  }
  emit('use-style', selectedStyleId.value);
  open.value = false;
}
function createStyle() {
  const style = cloneInitialMartyriaStyle(traditionalGreekInitialMartyriaStyle);
  style.id = crypto.randomUUID();
  style.displayName = t(($) => $.dialog.initialMartyriaStyles.newStyle, {
    ns: 'dialog',
  });
  workingStyles.value.push(style);
  selectedStyleId.value = style.id;
}
function duplicateStyle() {
  const source = selectedStyle.value;
  const style = cloneInitialMartyriaStyle(source);
  style.id = crypto.randomUUID();
  style.displayName = `${styleDisplayName(source)} ${t(($) => $.dialog.initialMartyriaStyles.copy, { ns: 'dialog' })}`;
  workingStyles.value.push(style);
  selectedStyleId.value = style.id;
}
function deleteStyle() {
  workingStyles.value.splice(
    workingStyles.value.findIndex(
      (style) => style.id === selectedStyleId.value,
    ),
    1,
  );
  selectedStyleId.value =
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1;
}
function updateName(value: string | number) {
  updateSelected((style) => {
    style.displayName = String(value);
  });
}
function updateDefaultParagraphStyle(value: string) {
  updateSelected((style) => {
    style.defaultParagraphStyleId = value;
  });
}
function updateFlowDirection(value: unknown) {
  if (value === 'page' || value === 'ltr' || value === 'rtl') {
    updateSelected((style) => {
      style.flowDirection = value;
    });
  }
}
function getComponent(index: number) {
  return selectedCustomStyle.value?.components[index];
}
function textComponent(): InitialMartyriaComponent {
  return {
    id: crypto.randomUUID(),
    kind: 'text',
    content: 'Text',
    visibility: { modes: [...modes], variationOverrides: [] },
  };
}
function stackedTextComponent(): InitialMartyriaComponent {
  return {
    id: crypto.randomUUID(),
    kind: 'stackedText',
    top: 'λ',
    bottom: 'π',
    visibility: { modes: [...modes], variationOverrides: [] },
  };
}
function glyphComponent(
  kind: Extract<
    InitialMartyriaComponent['kind'],
    'ekhosGlyph' | 'plagalGlyph' | 'modeSignGlyph' | 'varysGlyph'
  >,
): InitialMartyriaComponent {
  return {
    id: crypto.randomUUID(),
    kind,
    visibility: { modes: [...modes], variationOverrides: [] },
  };
}
function startingNoteComponent(
  rendering: 'neume' | 'customText',
): InitialMartyriaComponent {
  return {
    id: crypto.randomUUID(),
    kind: 'startingNoteCluster',
    rendering,
    visibility: { modes: [...modes], variationOverrides: [] },
  };
}
function addComponent(value: unknown) {
  componentKindSelection.value = '';
  if (
    typeof value !== 'string' ||
    !availableComponentKinds.value.includes(value as ComponentAuthoringKind)
  ) {
    return;
  }
  const component =
    value === 'text'
      ? textComponent()
      : value === 'stackedText'
        ? stackedTextComponent()
        : value === 'startingNoteClusterNeume'
          ? startingNoteComponent('neume')
          : value === 'startingNoteClusterText'
            ? startingNoteComponent('customText')
            : glyphComponent(
                value as Extract<
                  InitialMartyriaComponent['kind'],
                  'ekhosGlyph' | 'plagalGlyph' | 'modeSignGlyph' | 'varysGlyph'
                >,
              );
  updateSelected((style) => style.components.push(component));
}
function moveComponent(index: number, direction: number) {
  updateSelected((style) => {
    const target = index + direction;
    [style.components[index], style.components[target]] = [
      style.components[target],
      style.components[index],
    ];
  });
}
function removeComponent(index: number) {
  updateSelected((style) => style.components.splice(index, 1));
}
function isTextComponent(
  component: InitialMartyriaComponent,
): component is Extract<
  InitialMartyriaComponent,
  { kind: 'text' | 'stackedText' }
> {
  return component.kind === 'text' || component.kind === 'stackedText';
}
function isCustomTextComponent(
  component: InitialMartyriaComponent,
): component is Extract<
  InitialMartyriaComponent,
  { kind: 'text' | 'stackedText' | 'startingNoteCluster' }
> {
  return (
    component.kind === 'text' ||
    component.kind === 'stackedText' ||
    (component.kind === 'startingNoteCluster' &&
      component.rendering === 'customText')
  );
}
function textComponentLines(component: InitialMartyriaComponent) {
  if (component.kind === 'stackedText') {
    return [component.top, component.bottom];
  }
  return [];
}
function updateInlineText(index: number, value: string | number) {
  const item = getComponent(index);
  if (item?.kind === 'text') {
    item.content = String(value);
  }
}
function updateComponentParagraphStyle(index: number, value: string) {
  const item = getComponent(index);
  if (item == null || !isCustomTextComponent(item)) {
    return;
  }
  if (value === PARAGRAPH_STYLE_NONE_VALUE) {
    delete item.paragraphStyleId;
  } else {
    item.paragraphStyleId = value;
  }
}
function updateStartingNoteRendering(index: number, value: unknown) {
  if (value !== 'neume' && value !== 'customText') {
    return;
  }
  const item = getComponent(index);
  if (item?.kind === 'startingNoteCluster') {
    item.rendering = value;
  }
}
function updateStackedLine(
  index: number,
  line: number,
  value: string | number,
) {
  const item = getComponent(index);
  if (item?.kind === 'stackedText') {
    if (line === 0) {
      item.top = String(value);
    }
    if (line === 1) {
      item.bottom = String(value);
    }
  }
}
function startingNoteLabel(note: InitialMartyriaCanonicalNote) {
  return getModeSignLabelSelector(note)!;
}
function updateStartingNoteName(
  note: InitialMartyriaCanonicalNote,
  value: string | number,
) {
  updateSelected((style) => {
    style.startingNoteText.names[note] = String(value);
  });
}
function updateStartingNoteLanguageTag(value: string | number) {
  updateSelected((style) => {
    style.startingNoteText.languageTag = String(value);
  });
}
function updateStartingNoteDirection(value: unknown) {
  if (value !== 'ltr' && value !== 'rtl') {
    return;
  }
  updateSelected((style) => {
    style.startingNoteText.direction = value;
  });
}
function resetStartingNoteNames() {
  updateSelected((style) => {
    const defaults = createInitialMartyriaStartingNoteText();
    style.startingNoteText.names = defaults.names;
    style.startingNoteText.languageTag = defaults.languageTag;
    style.startingNoteText.direction = defaults.direction;
  });
}
function updateVisibility(
  index: number,
  mode: ModeKeyMode,
  value: boolean | string,
) {
  const item = getComponent(index);
  if (item == null) {
    return;
  }
  const visible = new Set(item.visibility.modes);
  if (value === true) {
    visible.add(mode);
  } else {
    visible.delete(mode);
  }
  item.visibility.modes = [...visible].sort((a, b) => a - b) as ModeKeyMode[];
}
function availableVariationTemplates(component: InitialMartyriaComponent) {
  const existing = new Set(
    component.visibility.variationOverrides.map(
      (override) => override.templateId,
    ),
  );
  return modeKeyTemplates.filter((template) => !existing.has(template.id));
}
function variationTemplateLabel(templateId: number) {
  const template = modeKeyTemplates.find((item) => item.id === templateId);
  return template == null
    ? String(templateId)
    : `${template.id} - ${t(template.description, { ns: 'model' })}`;
}
function addVariationOverride(index: number, value: unknown) {
  variationSelection.value = '';
  const templateId = Number(value);
  if (!Number.isInteger(templateId)) {
    return;
  }
  const item = getComponent(index);
  if (
    item == null ||
    item.visibility.variationOverrides.some(
      (override) => override.templateId === templateId,
    )
  ) {
    return;
  }
  item.visibility.variationOverrides.push({ templateId, visible: true });
}
function updateVariationVisibility(
  index: number,
  templateId: number,
  value: unknown,
) {
  const item = getComponent(index);
  const override = item?.visibility.variationOverrides.find(
    (candidate) => candidate.templateId === templateId,
  );
  if (override != null && (value === 'visible' || value === 'hidden')) {
    override.visible = value === 'visible';
  }
}
function removeVariationOverride(index: number, templateId: number) {
  const item = getComponent(index);
  if (item == null) {
    return;
  }
  item.visibility.variationOverrides =
    item.visibility.variationOverrides.filter(
      (override) => override.templateId !== templateId,
    );
}
function handleComponentDragStart(
  component: InitialMartyriaComponent,
  event: DragEvent,
) {
  if (event.dataTransfer == null) {
    return;
  }
  draggedComponentId.value = component.id;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', component.id);
}
function handleComponentDragOver(
  component: InitialMartyriaComponent,
  event: DragEvent,
) {
  if (
    draggedComponentId.value == null ||
    draggedComponentId.value === component.id
  ) {
    return;
  }
  event.preventDefault();
  if (event.dataTransfer != null) {
    event.dataTransfer.dropEffect = 'move';
  }
}
function handleComponentDrop(
  component: InitialMartyriaComponent,
  event: DragEvent,
) {
  event.preventDefault();
  const draggedId = draggedComponentId.value;
  draggedComponentId.value = null;
  if (draggedId == null || draggedId === component.id) {
    return;
  }
  const target = event.currentTarget;
  const after =
    target instanceof HTMLElement &&
    event.clientY >=
      target.getBoundingClientRect().top + target.offsetHeight / 2;
  updateSelected((style) => {
    const fromIndex = style.components.findIndex(
      (item) => item.id === draggedId,
    );
    const targetIndex = style.components.findIndex(
      (item) => item.id === component.id,
    );
    if (fromIndex < 0 || targetIndex < 0) {
      return;
    }
    const [moved] = style.components.splice(fromIndex, 1);
    const adjustedTargetIndex = targetIndex - (fromIndex < targetIndex ? 1 : 0);
    const insertionIndex = adjustedTargetIndex + (after ? 1 : 0);
    style.components.splice(insertionIndex, 0, moved);
  });
}
function handleComponentDragEnd() {
  draggedComponentId.value = null;
}
function styleDisplayName(style: InitialMartyriaStyle) {
  return getInitialMartyriaStyleDisplayName(style, t);
}
function componentKindLabel(
  value: InitialMartyriaComponent | ComponentAuthoringKind,
) {
  const kind = typeof value === 'string' ? value : value.kind;
  if (typeof value !== 'string' && value.kind === 'startingNoteCluster') {
    return value.rendering === 'customText'
      ? t(($) => $.dialog.initialMartyriaStyles.startingNoteCustomText, {
          ns: 'dialog',
        })
      : t(($) => $.dialog.initialMartyriaStyles.startingNoteNeumes, {
          ns: 'dialog',
        });
  }
  if (kind === 'text') {
    return t(($) => $.dialog.initialMartyriaStyles.componentKinds.literal, {
      ns: 'dialog',
    });
  }
  if (kind === 'stackedText') {
    return t(($) => $.dialog.initialMartyriaStyles.componentKinds.stackedText, {
      ns: 'dialog',
    });
  }
  if (kind === 'startingNoteClusterNeume') {
    return t(($) => $.dialog.initialMartyriaStyles.startingNoteNeumes, {
      ns: 'dialog',
    });
  }
  if (kind === 'startingNoteClusterText') {
    return t(($) => $.dialog.initialMartyriaStyles.startingNoteCustomText, {
      ns: 'dialog',
    });
  }
  const source =
    kind === 'ekhosGlyph'
      ? 'ekhos'
      : kind === 'plagalGlyph'
        ? 'plagal'
        : kind === 'varysGlyph'
          ? 'varys'
          : 'mode-sign';
  return glyphSourceLabel(source);
}
function glyphSourceLabel(source: 'ekhos' | 'plagal' | 'varys' | 'mode-sign') {
  switch (source) {
    case 'ekhos':
      return t(($) => $.dialog.initialMartyriaGlyphSources.ekhos, {
        ns: 'dialog',
      });
    case 'plagal':
      return t(($) => $.dialog.initialMartyriaGlyphSources.plagal, {
        ns: 'dialog',
      });
    case 'varys':
      return t(($) => $.dialog.initialMartyriaGlyphSources.varys, {
        ns: 'dialog',
      });
    case 'mode-sign':
      return t(($) => $.dialog.initialMartyriaGlyphSources.modeSign, {
        ns: 'dialog',
      });
  }
}
</script>
