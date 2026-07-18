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
                :model-value="selectedStyle.displayName"
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
                $t(($) => $.dialog.initialMartyriaStyles.paragraphStyle, {
                  ns: 'dialog',
                })
              }}</FieldLabel>
              <ParagraphStyleSelect
                class="flex-1"
                trigger-class="w-full"
                :disabled="selectedCustomStyle == null"
                :model-value="
                  selectedStyle.textParagraphStyleId ??
                  BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText
                "
                :paragraph-styles="paragraphStyles"
                @update:model-value="updateTextParagraphStyle"
              />
            </Field>
            <details class="rounded border p-2">
              <summary class="cursor-pointer text-sm font-medium">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.textDefaults, {
                    ns: 'dialog',
                  })
                }}
              </summary>
              <div class="mt-3 grid gap-2 sm:grid-cols-2">
                <Field orientation="horizontal">
                  <FieldLabel>{{
                    $t(($) => $.dialog.initialMartyriaStyles.fontFamily, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <FontCombobox
                    :model-value="selectedStyle.textAppearance.fontFamily ?? ''"
                    :options="fonts"
                    @update:model-value="
                      updateTextAppearance('fontFamily', $event)
                    "
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel>{{
                    $t(($) => $.dialog.initialMartyriaStyles.fontStyle, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <FontStyleSelect
                    :model-value="selectedStyle.textAppearance.fontStyle ?? ''"
                    :options="fontStyleOptions"
                    @update:model-value="
                      updateTextAppearance('fontStyle', $event)
                    "
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel>{{
                    $t(
                      ($) =>
                        $.dialog.initialMartyriaStyles.appearanceProperties
                          .fontSize,
                      { ns: 'dialog' },
                    )
                  }}</FieldLabel>
                  <Input
                    type="number"
                    :model-value="selectedStyle.textAppearance.fontSize"
                    @update:model-value="
                      updateTextAppearance('fontSize', $event)
                    "
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel>{{
                    $t(($) => $.dialog.initialMartyriaStyles.color, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <Input
                    :model-value="selectedStyle.textAppearance.color"
                    @update:model-value="updateTextAppearance('color', $event)"
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel>{{
                    $t(($) => $.dialog.initialMartyriaStyles.strokeColor, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <Input
                    :model-value="selectedStyle.textAppearance.strokeColor"
                    @update:model-value="
                      updateTextAppearance('strokeColor', $event)
                    "
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel>{{
                    $t(
                      ($) =>
                        $.dialog.initialMartyriaStyles.appearanceProperties
                          .strokeWidth,
                      { ns: 'dialog' },
                    )
                  }}</FieldLabel>
                  <Input
                    type="number"
                    :model-value="selectedStyle.textAppearance.strokeWidth"
                    @update:model-value="
                      updateTextAppearance('strokeWidth', $event)
                    "
                  />
                </Field>
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
                >
                  <div class="flex items-center gap-2">
                    <Select
                      :disabled="selectedCustomStyle == null"
                      :model-value="component.kind"
                      @update:model-value="
                        (value) => updateComponentKind(index, value)
                      "
                      ><SelectTrigger class="w-28"
                        ><SelectValue /></SelectTrigger
                      ><SelectContent
                        ><SelectItem value="text">{{
                          $t(($) => $.dialog.initialMartyriaStyles.text, {
                            ns: 'dialog',
                          })
                        }}</SelectItem
                        ><SelectItem value="glyph">{{
                          $t(($) => $.dialog.initialMartyriaStyles.glyph, {
                            ns: 'dialog',
                          })
                        }}</SelectItem></SelectContent
                      ></Select
                    >
                    <span
                      v-if="component.kind === 'text'"
                      class="min-w-0 flex-1 text-sm"
                      >{{ componentSummary(component) }}</span
                    >
                    <span v-else class="flex-1" aria-hidden="true" />
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
                  <div v-if="component.kind === 'text'" class="mt-2 space-y-2">
                    <Select
                      :disabled="selectedCustomStyle == null"
                      :model-value="component.content.layout"
                      @update:model-value="
                        (value) => updateTextLayout(index, value)
                      "
                      ><SelectTrigger><SelectValue /></SelectTrigger
                      ><SelectContent
                        ><SelectItem value="inline">{{
                          $t(($) => $.dialog.initialMartyriaStyles.inline, {
                            ns: 'dialog',
                          })
                        }}</SelectItem
                        ><SelectItem value="stacked">{{
                          $t(($) => $.dialog.initialMartyriaStyles.stacked, {
                            ns: 'dialog',
                          })
                        }}</SelectItem></SelectContent
                      ></Select
                    ><Input
                      v-if="component.content.layout === 'inline'"
                      :model-value="component.content.text"
                      @update:model-value="
                        (value) => updateInlineText(index, value)
                      "
                    />
                    <div v-else class="flex gap-2">
                      <Input
                        v-for="(_, line) in component.content.lines"
                        :key="line"
                        :model-value="component.content.lines[line]"
                        @update:model-value="
                          (value) => updateStackedLine(index, line, value)
                        "
                      />
                    </div>
                  </div>
                  <div v-else class="mt-2">
                    <Select
                      :disabled="selectedCustomStyle == null"
                      :model-value="glyphSourceOption(component)"
                      @update:model-value="
                        (value) => updateGlyphSource(index, value)
                      "
                      ><SelectTrigger><SelectValue /></SelectTrigger
                      ><SelectContent
                        ><SelectItem value="ekhos">{{
                          glyphSourceLabel('ekhos')
                        }}</SelectItem
                        ><SelectItem value="plagal">{{
                          glyphSourceLabel('plagal')
                        }}</SelectItem
                        ><SelectItem value="varys">{{
                          glyphSourceLabel('varys')
                        }}</SelectItem
                        ><SelectItem value="mode-sign">{{
                          glyphSourceLabel('mode-sign')
                        }}</SelectItem
                        ><SelectItem value="starting-pitch-cluster">{{
                          glyphSourceLabel('starting-pitch-cluster')
                        }}</SelectItem></SelectContent
                      ></Select
                    >
                  </div>
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
                </div>
              </div>
              <div class="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  :disabled="selectedCustomStyle == null"
                  @click="addComponent('text')"
                  >{{
                    $t(($) => $.dialog.initialMartyriaStyles.addText, {
                      ns: 'dialog',
                    })
                  }}</Button
                ><Button
                  size="sm"
                  variant="outline"
                  :disabled="selectedCustomStyle == null"
                  @click="addComponent('glyph')"
                  >{{
                    $t(($) => $.dialog.initialMartyriaStyles.addGlyph, {
                      ns: 'dialog',
                    })
                  }}</Button
                >
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
              <ModeKey
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
        ><Button :disabled="!stylesAreValid" @click="applyStyles">{{
          $t(($) => $.dialog.common.update, { ns: 'dialog' })
        }}</Button></DialogFooter
      >
    </DialogContent>
  </Dialog>
</template>
<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, ref, toRaw, watch } from 'vue';

import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import ModeKey from '@/components/ModeKey.vue';
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
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import { ModeKeyElement } from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  builtInInitialMartyriaStyles,
  type InitialMartyriaAppearance,
  type InitialMartyriaComponent,
  type InitialMartyriaStyle,
  type ModeKeyMode,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type ParagraphStyle,
} from '@/models/ParagraphStyle';

const props = defineProps<{
  styles: InitialMartyriaStyle[];
  pageSetup: PageSetup;
  fonts: string[];
  paragraphStyles: ParagraphStyle[];
  activeStyleId?: string;
}>();
const emit = defineEmits<{
  update: [styles: InitialMartyriaStyle[]];
  'use-style': [id: string];
}>();
const open = defineModel<boolean>('open', { required: true });
const { t } = useTranslation();
const modes: ModeKeyMode[] = [1, 2, 3, 4, 5, 6, 7, 8];
const workingStyles = ref<InitialMartyriaStyle[]>([]);
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
const { fontStyleOptions } = useFontStyleControls(
  () => selectedStyle.value.textAppearance.fontFamily ?? '',
  () => selectedStyle.value.textAppearance.fontStyle ?? '',
);
const stylesAreValid = computed(() =>
  workingStyles.value.every(
    (style) => validateInitialMartyriaStyle(style).length === 0,
  ),
);
watch(
  () => [open.value, props.styles] as const,
  () => {
    if (open.value) {
      workingStyles.value = structuredClone(toRaw(props.styles));
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
  if (stylesAreValid.value) {
    emit('update', structuredClone(toRaw(workingStyles.value)));
  }
}
function useForDocument() {
  applyStyles();
  emit('use-style', selectedStyleId.value);
}
function createStyle() {
  const style = structuredClone(traditionalGreekInitialMartyriaStyle);
  style.id = crypto.randomUUID();
  style.displayName = t(($) => $.dialog.initialMartyriaStyles.newStyle, {
    ns: 'dialog',
  });
  workingStyles.value.push(style);
  selectedStyleId.value = style.id;
}
function duplicateStyle() {
  const style = structuredClone(selectedStyle.value);
  style.id = crypto.randomUUID();
  style.displayName = `${style.displayName} ${t(($) => $.dialog.initialMartyriaStyles.copy, { ns: 'dialog' })}`;
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
function updateTextParagraphStyle(value: string) {
  updateSelected((style) => {
    style.textParagraphStyleId = value;
  });
}
function updateTextAppearance(
  property: keyof InitialMartyriaAppearance,
  value: string | number,
) {
  updateSelected((style) => {
    const input = String(value).trim();
    if (
      property === 'fontFamily' ||
      property === 'fontStyle' ||
      property === 'color' ||
      property === 'strokeColor'
    ) {
      if (input === '') {
        delete style.textAppearance[property];
      } else {
        style.textAppearance[property] = input;
      }
      return;
    }
    const number = Number(input);
    if (input === '' || !Number.isFinite(number)) {
      delete style.textAppearance[property];
    } else {
      style.textAppearance[property] = number;
    }
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
function updateComponentKind(index: number, value: unknown) {
  if (value === 'text') {
    replaceComponent(index, textComponent());
  } else if (value === 'glyph') {
    replaceComponent(index, glyphComponent());
  }
}
function replaceComponent(
  index: number,
  replacement: InitialMartyriaComponent,
) {
  updateSelected((style) => {
    replacement.id = style.components[index].id;
    style.components.splice(index, 1, replacement);
  });
}
function textComponent(): InitialMartyriaComponent {
  return {
    id: crypto.randomUUID(),
    kind: 'text',
    content: { layout: 'inline', text: 'Text' },
    visibility: { modes: [...modes], variationOverrides: [] },
  };
}
function glyphComponent(): InitialMartyriaComponent {
  return {
    id: crypto.randomUUID(),
    kind: 'glyph',
    source: { type: 'derived', value: 'modeSign' },
    visibility: { modes: [...modes], variationOverrides: [] },
  };
}
function addComponent(kind: 'text' | 'glyph') {
  updateSelected((style) =>
    style.components.push(kind === 'text' ? textComponent() : glyphComponent()),
  );
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
function updateTextLayout(index: number, value: unknown) {
  const item = getComponent(index);
  if (item?.kind !== 'text') {
    return;
  }
  item.content =
    value === 'stacked'
      ? { layout: 'stacked', lines: ['π', 'λ'], gap: 0 }
      : { layout: 'inline', text: 'Text' };
}
function updateInlineText(index: number, value: string | number) {
  const item = getComponent(index);
  if (item?.kind === 'text' && item.content.layout === 'inline') {
    item.content.text = String(value);
  }
}
function updateStackedLine(
  index: number,
  line: number,
  value: string | number,
) {
  const item = getComponent(index);
  if (item?.kind === 'text' && item.content.layout === 'stacked') {
    item.content.lines[line] = String(value);
  }
}
function updateGlyphSource(index: number, value: unknown) {
  const item = getComponent(index);
  if (item?.kind !== 'glyph') {
    return;
  }

  switch (value) {
    case 'ekhos':
      item.source = { type: 'fixed', neume: ModeSign.Ekhos };
      break;
    case 'plagal':
      item.source = { type: 'fixed', neume: ModeSign.Plagal };
      break;
    case 'varys':
      item.source = { type: 'fixed', neume: ModeSign.Varys };
      break;
    case 'mode-sign':
      item.source = { type: 'derived', value: 'modeSign' };
      break;
    case 'starting-pitch-cluster':
      item.source = { type: 'derived', value: 'startingPitchCluster' };
      break;
  }
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
function styleDisplayName(style: InitialMartyriaStyle) {
  return style.id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1
    ? t(($) => $.dialog.initialMartyriaStyles.traditionalGreek, {
        ns: 'dialog',
      })
    : style.displayName;
}
function componentSummary(component: InitialMartyriaComponent) {
  if (component.kind === 'text') {
    return component.content.layout === 'inline'
      ? component.content.text
      : component.content.lines.join(' / ');
  }

  const source = glyphSourceOption(component);
  return source == null && component.source.type === 'fixed'
    ? String(component.source.neume)
    : glyphSourceLabel(source!);
}
function glyphSourceOption(
  component: Extract<InitialMartyriaComponent, { kind: 'glyph' }>,
) {
  if (component.source.type === 'fixed') {
    if (component.source.neume === ModeSign.Ekhos) {
      return 'ekhos';
    }
    if (component.source.neume === ModeSign.Plagal) {
      return 'plagal';
    }
    if (component.source.neume === ModeSign.Varys) {
      return 'varys';
    }
    return undefined;
  }

  return component.source.value === 'startingPitchCluster'
    ? 'starting-pitch-cluster'
    : 'mode-sign';
}
function glyphSourceLabel(
  source: 'ekhos' | 'plagal' | 'varys' | 'mode-sign' | 'starting-pitch-cluster',
) {
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
    case 'starting-pitch-cluster':
      return t(
        ($) => $.dialog.initialMartyriaGlyphSources.startingNoteCluster,
        {
          ns: 'dialog',
        },
      );
  }
}
</script>
