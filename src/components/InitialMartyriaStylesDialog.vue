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
                <Field orientation="horizontal">
                  <FieldLabel>{{
                    $t(($) => $.dialog.initialMartyriaStyles.fontFamily, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <FontCombobox
                    :model-value="
                      selectedStyle.startingNoteText.appearance.fontFamily ?? ''
                    "
                    :options="fonts"
                    :disabled="selectedCustomStyle == null"
                    @update:model-value="
                      updateStartingNoteAppearance('fontFamily', $event)
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
                    :model-value="
                      selectedStyle.startingNoteText.appearance.fontStyle ?? ''
                    "
                    :options="startingNoteFontStyleOptions"
                    :disabled="selectedCustomStyle == null"
                    @update:model-value="
                      updateStartingNoteAppearance('fontStyle', $event)
                    "
                  />
                </Field>
                <Field
                  v-for="property in [
                    'fontSize',
                    'color',
                    'strokeColor',
                    'strokeWidth',
                    'baselineShift',
                  ] as const"
                  :key="property"
                  orientation="horizontal"
                >
                  <FieldLabel>{{
                    startingNoteAppearanceLabel(property)
                  }}</FieldLabel>
                  <Input
                    :type="
                      property === 'color' || property === 'strokeColor'
                        ? 'text'
                        : 'number'
                    "
                    :disabled="selectedCustomStyle == null"
                    :model-value="
                      selectedStyle.startingNoteText.appearance[property]
                    "
                    @update:model-value="
                      updateStartingNoteAppearance(property, $event)
                    "
                  />
                </Field>
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
                    <details class="rounded border p-2">
                      <summary class="cursor-pointer text-sm">
                        {{
                          $t(($) => $.dialog.initialMartyriaStyles.appearance, {
                            ns: 'dialog',
                          })
                        }}
                      </summary>
                      <div class="mt-3 grid gap-2 sm:grid-cols-2">
                        <Field orientation="horizontal">
                          <FieldLabel>{{
                            $t(
                              ($) => $.dialog.initialMartyriaStyles.fontFamily,
                              {
                                ns: 'dialog',
                              },
                            )
                          }}</FieldLabel>
                          <FontCombobox
                            :disabled="selectedCustomStyle == null"
                            :model-value="
                              component.appearance?.fontFamily ?? ''
                            "
                            :options="fonts"
                            @update:model-value="
                              updateComponentAppearance(
                                index,
                                'fontFamily',
                                $event,
                              )
                            "
                          />
                        </Field>
                        <Field orientation="horizontal">
                          <FieldLabel>{{
                            $t(
                              ($) => $.dialog.initialMartyriaStyles.fontStyle,
                              {
                                ns: 'dialog',
                              },
                            )
                          }}</FieldLabel>
                          <FontStyleSelect
                            :disabled="selectedCustomStyle == null"
                            :model-value="component.appearance?.fontStyle ?? ''"
                            :options="componentFontStyleOptions(component)"
                            @update:model-value="
                              updateComponentAppearance(
                                index,
                                'fontStyle',
                                $event,
                              )
                            "
                          />
                        </Field>
                        <Field
                          v-for="property in componentAppearanceProperties"
                          :key="property"
                          orientation="horizontal"
                        >
                          <FieldLabel>{{
                            appearanceLabel(property)
                          }}</FieldLabel>
                          <Input
                            :disabled="selectedCustomStyle == null"
                            :type="
                              property === 'color' || property === 'strokeColor'
                                ? 'text'
                                : 'number'
                            "
                            :model-value="component.appearance?.[property]"
                            @update:model-value="
                              updateComponentAppearance(index, property, $event)
                            "
                          />
                        </Field>
                      </div>
                    </details>
                  </div>
                  <details
                    v-else-if="
                      component.kind === 'startingNoteCluster' &&
                      component.rendering === 'customText'
                    "
                    class="mt-2 rounded border p-2"
                  >
                    <summary class="cursor-pointer text-sm">
                      {{
                        $t(($) => $.dialog.initialMartyriaStyles.appearance, {
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
                          :disabled="selectedCustomStyle == null"
                          :model-value="component.appearance?.fontFamily ?? ''"
                          :options="fonts"
                          @update:model-value="
                            updateComponentAppearance(
                              index,
                              'fontFamily',
                              $event,
                            )
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
                          :disabled="selectedCustomStyle == null"
                          :model-value="component.appearance?.fontStyle ?? ''"
                          :options="componentFontStyleOptions(component)"
                          @update:model-value="
                            updateComponentAppearance(
                              index,
                              'fontStyle',
                              $event,
                            )
                          "
                        />
                      </Field>
                      <Field
                        v-for="property in componentAppearanceProperties"
                        :key="property"
                        orientation="horizontal"
                      >
                        <FieldLabel>{{ appearanceLabel(property) }}</FieldLabel>
                        <Input
                          :disabled="selectedCustomStyle == null"
                          :type="
                            property === 'color' || property === 'strokeColor'
                              ? 'text'
                              : 'number'
                          "
                          :model-value="component.appearance?.[property]"
                          @update:model-value="
                            updateComponentAppearance(index, property, $event)
                          "
                        />
                      </Field>
                    </div>
                  </details>
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
  cloneInitialMartyriaStyle,
  createInitialMartyriaStartingNoteText,
  type InitialMartyriaAppearance,
  type InitialMartyriaCanonicalNote,
  initialMartyriaCanonicalNotes,
  type InitialMartyriaComponent,
  type InitialMartyriaStartingNoteText,
  type InitialMartyriaStyle,
  type ModeKeyMode,
  resolveInitialMartyriaBaseTextAppearance,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { getModeSignLabelSelector } from '@/models/NeumeI18nMappings';
import type { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import {
  getFontStyleOptions,
  remapFontStyleForFamily,
} from '@/utils/fontStyle';

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
const componentAppearanceProperties = [
  'fontSize',
  'color',
  'strokeColor',
  'strokeWidth',
  'baselineShift',
] as const;
const workingStyles = ref<InitialMartyriaStyle[]>([]);
const draggedComponentId = ref<string | null>(null);
const componentKindSelection = ref('');
const variationSelection = ref('');
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
const paragraphTextAppearance = computed(() =>
  resolveParagraphStyle(
    props.paragraphStyles,
    selectedStyle.value.textParagraphStyleId,
  ),
);
const baseTextAppearance = computed(() =>
  resolveInitialMartyriaBaseTextAppearance(
    selectedStyle.value,
    props.paragraphStyles,
  ),
);
const { fontStyleOptions } = useFontStyleControls(
  () =>
    selectedStyle.value.textAppearance.fontFamily ??
    paragraphTextAppearance.value.fontFamily ??
    '',
  () => selectedStyle.value.textAppearance.fontStyle ?? '',
);
const { fontStyleOptions: startingNoteFontStyleOptions } = useFontStyleControls(
  () =>
    selectedStyle.value.startingNoteText.appearance.fontFamily ??
    baseTextAppearance.value.fontFamily ??
    '',
  () => selectedStyle.value.startingNoteText.appearance.fontStyle ?? '',
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
  if (stylesAreValid.value) {
    emit('update', workingStyles.value.map(cloneInitialMartyriaStyle));
  }
}
function useForDocument() {
  applyStyles();
  emit('use-style', selectedStyleId.value);
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
  const style = cloneInitialMartyriaStyle(selectedStyle.value);
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
type ComponentFontSnapshot = {
  component: Extract<
    InitialMartyriaComponent,
    { kind: 'text' | 'stackedText' | 'startingNoteCluster' }
  >;
  effectiveStyle: string;
  hadStyleOverride: boolean;
};
function isFontComponent(
  component: InitialMartyriaComponent,
): component is ComponentFontSnapshot['component'] {
  return (
    component.kind === 'text' ||
    component.kind === 'stackedText' ||
    component.kind === 'startingNoteCluster'
  );
}
function getInheritedComponentFontSettingsForStyle(
  style: InitialMartyriaStyle,
  component: ComponentFontSnapshot['component'],
) {
  const baseAppearance = resolveInitialMartyriaBaseTextAppearance(
    style,
    props.paragraphStyles,
  );
  return component.kind === 'startingNoteCluster'
    ? { ...baseAppearance, ...style.startingNoteText.appearance }
    : baseAppearance;
}
function snapshotComponentFontStyles(style: InitialMartyriaStyle) {
  return new Map(
    style.components.filter(isFontComponent).map((component) => {
      const inherited = getInheritedComponentFontSettingsForStyle(
        style,
        component,
      );
      return [
        component.id,
        {
          component,
          effectiveStyle:
            component.appearance?.fontStyle ?? inherited.fontStyle ?? '',
          hadStyleOverride: component.appearance?.fontStyle != null,
        },
      ] as const;
    }),
  );
}
function reconcileDescendantFontStyles(
  style: InitialMartyriaStyle,
  snapshots: Map<string, ComponentFontSnapshot>,
) {
  for (const component of style.components) {
    if (
      !isFontComponent(component) ||
      component.appearance?.fontFamily != null
    ) {
      continue;
    }
    const snapshot = snapshots.get(component.id);
    if (!snapshot?.hadStyleOverride) {
      continue;
    }
    const inherited = getInheritedComponentFontSettingsForStyle(
      style,
      component,
    );
    updateComponentFontStyleOverride(
      component,
      remapFontStyleForFamily(
        snapshot.effectiveStyle,
        inherited.fontFamily ?? '',
      ),
      inherited.fontStyle,
    );
  }
}
function updateTextParagraphStyle(value: string) {
  updateSelected((style) => {
    const snapshots = snapshotComponentFontStyles(style);
    const previousBaseTextAppearance = resolveInitialMartyriaBaseTextAppearance(
      style,
      props.paragraphStyles,
    );
    style.textParagraphStyleId = value;
    reconcileTextAppearanceFontStyle(style);
    reconcileStartingNoteDefaultFontStyle(style, previousBaseTextAppearance);
    reconcileDescendantFontStyles(style, snapshots);
  });
}
function updateTextAppearance(
  property: keyof InitialMartyriaAppearance,
  value: string | number,
) {
  updateSelected((style) => {
    const snapshots =
      property === 'fontFamily' ? snapshotComponentFontStyles(style) : null;
    const previousBaseTextAppearance =
      property === 'fontFamily'
        ? resolveInitialMartyriaBaseTextAppearance(style, props.paragraphStyles)
        : null;
    const input = String(value).trim();
    if (
      property === 'fontFamily' ||
      property === 'fontStyle' ||
      property === 'color' ||
      property === 'strokeColor'
    ) {
      if (input === '') {
        if (property === 'fontFamily') {
          const paragraphAppearance = resolveParagraphStyle(
            props.paragraphStyles,
            style.textParagraphStyleId,
          );
          const effectiveStyle =
            style.textAppearance.fontStyle ??
            paragraphAppearance.fontStyle ??
            '';
          delete style.textAppearance.fontFamily;
          updateDefaultFontStyle(
            style.textAppearance,
            remapFontStyleForFamily(
              effectiveStyle,
              paragraphAppearance.fontFamily ?? '',
            ),
            paragraphAppearance.fontStyle,
          );
          reconcileStartingNoteDefaultFontStyle(
            style,
            previousBaseTextAppearance!,
          );
          reconcileDescendantFontStyles(style, snapshots!);
        } else {
          delete style.textAppearance[property];
        }
      } else {
        if (property === 'fontFamily') {
          const paragraphAppearance = resolveParagraphStyle(
            props.paragraphStyles,
            style.textParagraphStyleId,
          );
          const effectiveStyle =
            style.textAppearance.fontStyle ??
            paragraphAppearance.fontStyle ??
            '';
          style.textAppearance.fontFamily = input;
          updateDefaultFontStyle(
            style.textAppearance,
            remapFontStyleForFamily(effectiveStyle, input),
            paragraphAppearance.fontStyle,
          );
          reconcileStartingNoteDefaultFontStyle(
            style,
            previousBaseTextAppearance!,
          );
          reconcileDescendantFontStyles(style, snapshots!);
        } else {
          style.textAppearance[property] = input;
        }
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
function updateDefaultFontStyle(
  appearance: InitialMartyriaAppearance,
  style: string,
  inheritedStyle: string | undefined,
) {
  if (style === inheritedStyle || style === '') {
    delete appearance.fontStyle;
  } else {
    appearance.fontStyle = style;
  }
}
function reconcileTextAppearanceFontStyle(style: InitialMartyriaStyle) {
  if (style.textAppearance.fontStyle == null) {
    return;
  }
  const paragraphAppearance = resolveParagraphStyle(
    props.paragraphStyles,
    style.textParagraphStyleId,
  );
  const effectiveFamily =
    style.textAppearance.fontFamily ?? paragraphAppearance.fontFamily ?? '';
  updateDefaultFontStyle(
    style.textAppearance,
    remapFontStyleForFamily(style.textAppearance.fontStyle, effectiveFamily),
    paragraphAppearance.fontStyle,
  );
}
function reconcileStartingNoteDefaultFontStyle(
  style: InitialMartyriaStyle,
  previousBaseTextAppearance: InitialMartyriaAppearance,
) {
  const startingAppearance = style.startingNoteText.appearance;
  if (
    startingAppearance.fontFamily != null ||
    startingAppearance.fontStyle == null
  ) {
    return;
  }
  const nextBaseTextAppearance = resolveInitialMartyriaBaseTextAppearance(
    style,
    props.paragraphStyles,
  );
  updateDefaultFontStyle(
    startingAppearance,
    remapFontStyleForFamily(
      startingAppearance.fontStyle,
      nextBaseTextAppearance.fontFamily ?? '',
    ),
    nextBaseTextAppearance.fontStyle ?? previousBaseTextAppearance.fontStyle,
  );
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
function updateComponentAppearance(
  index: number,
  property: keyof InitialMartyriaAppearance,
  value: string | number,
) {
  const item = getComponent(index);
  if (
    item == null ||
    (item.kind !== 'text' &&
      item.kind !== 'stackedText' &&
      item.kind !== 'startingNoteCluster')
  ) {
    return;
  }
  item.appearance ??= {};
  const input = String(value).trim();
  if (
    property === 'fontFamily' ||
    property === 'fontStyle' ||
    property === 'color' ||
    property === 'strokeColor'
  ) {
    if (input === '') {
      if (property === 'fontFamily') {
        const inherited = getInheritedComponentFontSettings(item);
        const effectiveStyle =
          item.appearance.fontStyle ?? inherited.fontStyle ?? '';
        delete item.appearance.fontFamily;
        updateComponentFontStyle(
          item,
          remapFontStyleForFamily(effectiveStyle, inherited.fontFamily ?? ''),
        );
      } else {
        delete item.appearance[property];
      }
    } else {
      if (property === 'fontFamily') {
        const inherited = getInheritedComponentFontSettings(item);
        const effectiveStyle =
          item.appearance.fontStyle ?? inherited.fontStyle ?? '';
        item.appearance.fontFamily = input;
        updateComponentFontStyle(
          item,
          remapFontStyleForFamily(effectiveStyle, input),
        );
      } else {
        item.appearance[property] = input;
      }
    }
    return;
  }
  const number = Number(input);
  if (input === '' || !Number.isFinite(number)) {
    delete item.appearance[property];
  } else {
    item.appearance[property] = number;
  }
}
function getInheritedComponentFontSettings(
  component: Extract<
    InitialMartyriaComponent,
    { kind: 'text' | 'stackedText' | 'startingNoteCluster' }
  >,
) {
  const baseAppearance = resolveInitialMartyriaBaseTextAppearance(
    selectedStyle.value,
    props.paragraphStyles,
  );
  return component.kind === 'startingNoteCluster'
    ? {
        ...baseAppearance,
        ...selectedStyle.value.startingNoteText.appearance,
      }
    : baseAppearance;
}
function updateComponentFontStyle(
  component: Extract<
    InitialMartyriaComponent,
    { kind: 'text' | 'stackedText' | 'startingNoteCluster' }
  >,
  style: string | undefined,
) {
  const inheritedStyle = getInheritedComponentFontSettings(component).fontStyle;
  updateComponentFontStyleOverride(component, style, inheritedStyle);
}
function updateComponentFontStyleOverride(
  component: ComponentFontSnapshot['component'],
  style: string | undefined,
  inheritedStyle: string | undefined,
) {
  if (style == null || style === inheritedStyle) {
    delete component.appearance?.fontStyle;
  } else {
    component.appearance!.fontStyle = style;
  }
}
function componentFontStyleOptions(component: InitialMartyriaComponent) {
  const inherited =
    component.kind === 'text' ||
    component.kind === 'stackedText' ||
    component.kind === 'startingNoteCluster'
      ? getInheritedComponentFontSettings(component)
      : {};
  const componentFamily =
    component.kind === 'text' ||
    component.kind === 'stackedText' ||
    component.kind === 'startingNoteCluster'
      ? component.appearance?.fontFamily
      : undefined;
  return getFontStyleOptions(componentFamily ?? inherited.fontFamily ?? '');
}
function appearanceLabel(property: keyof InitialMartyriaAppearance) {
  switch (property) {
    case 'fontSize':
      return t(
        ($) => $.dialog.initialMartyriaStyles.appearanceProperties.fontSize,
        { ns: 'dialog' },
      );
    case 'color':
      return t(($) => $.dialog.initialMartyriaStyles.color, { ns: 'dialog' });
    case 'strokeColor':
      return t(($) => $.dialog.initialMartyriaStyles.strokeColor, {
        ns: 'dialog',
      });
    case 'strokeWidth':
      return t(
        ($) => $.dialog.initialMartyriaStyles.appearanceProperties.strokeWidth,
        { ns: 'dialog' },
      );
    case 'baselineShift':
      return t(
        ($) =>
          $.dialog.initialMartyriaStyles.appearanceProperties.baselineShift,
        { ns: 'dialog' },
      );
    default:
      return property;
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
function updateStartingNoteAppearance(
  property: keyof InitialMartyriaStartingNoteText['appearance'],
  value: string | number,
) {
  updateSelected((style) => {
    const snapshots =
      property === 'fontFamily' ? snapshotComponentFontStyles(style) : null;
    const input = String(value).trim();
    if (
      property === 'fontFamily' ||
      property === 'fontStyle' ||
      property === 'color' ||
      property === 'strokeColor'
    ) {
      if (input === '') {
        if (property === 'fontFamily') {
          const baseAppearance = resolveInitialMartyriaBaseTextAppearance(
            style,
            props.paragraphStyles,
          );
          const effectiveStyle =
            style.startingNoteText.appearance.fontStyle ??
            baseAppearance.fontStyle ??
            '';
          delete style.startingNoteText.appearance.fontFamily;
          updateDefaultFontStyle(
            style.startingNoteText.appearance,
            remapFontStyleForFamily(
              effectiveStyle,
              baseAppearance.fontFamily ?? '',
            ),
            baseAppearance.fontStyle,
          );
          reconcileDescendantFontStyles(style, snapshots!);
        } else {
          delete style.startingNoteText.appearance[property];
        }
      } else {
        if (property === 'fontFamily') {
          const baseAppearance = resolveInitialMartyriaBaseTextAppearance(
            style,
            props.paragraphStyles,
          );
          const effectiveStyle =
            style.startingNoteText.appearance.fontStyle ??
            baseAppearance.fontStyle ??
            '';
          style.startingNoteText.appearance.fontFamily = input;
          updateDefaultFontStyle(
            style.startingNoteText.appearance,
            remapFontStyleForFamily(effectiveStyle, input),
            baseAppearance.fontStyle,
          );
          reconcileDescendantFontStyles(style, snapshots!);
        } else {
          style.startingNoteText.appearance[property] = input;
        }
      }
      return;
    }
    const number = Number(input);
    if (input === '' || !Number.isFinite(number)) {
      delete style.startingNoteText.appearance[property];
    } else {
      style.startingNoteText.appearance[property] = number;
    }
  });
}
function startingNoteAppearanceLabel(
  property: keyof InitialMartyriaStartingNoteText['appearance'],
) {
  switch (property) {
    case 'fontFamily':
      return t(($) => $.dialog.initialMartyriaStyles.fontFamily, {
        ns: 'dialog',
      });
    case 'fontStyle':
      return t(($) => $.dialog.initialMartyriaStyles.fontStyle, {
        ns: 'dialog',
      });
    case 'fontSize':
      return t(
        ($) => $.dialog.initialMartyriaStyles.appearanceProperties.fontSize,
        { ns: 'dialog' },
      );
    case 'color':
      return t(($) => $.dialog.initialMartyriaStyles.color, { ns: 'dialog' });
    case 'strokeColor':
      return t(($) => $.dialog.initialMartyriaStyles.strokeColor, {
        ns: 'dialog',
      });
    case 'strokeWidth':
      return t(
        ($) => $.dialog.initialMartyriaStyles.appearanceProperties.strokeWidth,
        { ns: 'dialog' },
      );
    case 'baselineShift':
      return t(
        ($) =>
          $.dialog.initialMartyriaStyles.appearanceProperties.baselineShift,
        { ns: 'dialog' },
      );
  }
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
  if (style.id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1) {
    return t(($) => $.dialog.initialMartyriaStyles.traditionalGreek, {
      ns: 'dialog',
    });
  }
  if (style.id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV2) {
    return t(($) => $.dialog.initialMartyriaStyles.traditionalGreekV2, {
      ns: 'dialog',
    });
  }
  return style.displayName;
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
