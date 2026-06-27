<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.insert.richTextBox, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <PropertiesRichTextStyle
        id-prefix="properties-rich-text-box"
        :element="element"
        :fonts="fonts"
        :page-setup="pageSetup"
        :default-font-color="
          element.inline
            ? pageSetup.lyricsDefaultColor
            : pageSetup.textBoxDefaultColor
        "
        :default-font-size="
          element.inline
            ? pageSetup.lyricsDefaultFontSize
            : pageSetup.textBoxDefaultFontSize
        "
        :default-font-family="
          element.inline
            ? pageSetup.lyricsDefaultFontFamily
            : pageSetup.textBoxDefaultFontFamily
        "
      />

      <FieldSeparator />

      <Field orientation="horizontal">
        <Switch
          id="properties-rich-text-box-inline"
          :model-value="element.inline"
          @update:model-value="updateBooleanProperty('inline', $event)"
        />
        <FieldLabel for="properties-rich-text-box-inline">
          {{ $t(($) => $.toolbar.common.inline, { ns: 'toolbar' }) }}
        </FieldLabel>
      </Field>

      <FieldGroup v-if="element.inline">
        <Field orientation="horizontal">
          <FieldLabel for="properties-rich-text-box-width">{{
            $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputUnit
            id="properties-rich-text-box-width"
            unit="pt"
            :nullable="true"
            :min="0.5"
            :max="maxWidth"
            :step="0.5"
            :model-value="element.customWidth"
            :format-options="fraction1FormatOptions"
            placeholder="fill"
            @update:model-value="
              updateElement({
                customWidth: $event,
              })
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-rich-text-box-offset-y-top">{{
            $t(($) => $.toolbar.textbox.offsetYTop, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputUnit
            id="properties-rich-text-box-offset-y-top"
            class="w-28"
            unit="pt"
            :min="-maxHeight"
            :max="maxHeight"
            :step="0.5"
            :model-value="element.offsetYTop"
            :format-options="fraction1FormatOptions"
            @update:model-value="updateNumberProperty('offsetYTop', $event)"
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-rich-text-box-offset-y-bottom">{{
            $t(($) => $.toolbar.textbox.offsetYBottom, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputUnit
            id="properties-rich-text-box-offset-y-bottom"
            class="w-28"
            unit="pt"
            :min="-maxHeight"
            :max="maxHeight"
            :step="0.5"
            :model-value="element.offsetYBottom"
            :format-options="fraction1FormatOptions"
            @update:model-value="updateNumberProperty('offsetYBottom', $event)"
          />
        </Field>

        <Field orientation="horizontal">
          <Switch
            id="properties-rich-text-box-center-on-page"
            :model-value="element.centerOnPage"
            @update:model-value="updateBooleanProperty('centerOnPage', $event)"
          />
          <FieldLabel for="properties-rich-text-box-center-on-page">{{
            $t(($) => $.toolbar.textbox.centerOnPage, { ns: 'toolbar' })
          }}</FieldLabel>
        </Field>
      </FieldGroup>

      <Field orientation="horizontal">
        <FieldLabel for="properties-rich-text-box-margin-top">{{
          $t(($) => $.toolbar.common.marginTop, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-rich-text-box-margin-top"
          class="w-28"
          unit="pt"
          :min="0"
          :max="maxHeight"
          :step="0.5"
          :model-value="element.marginTop"
          :format-options="fraction1FormatOptions"
          @update:model-value="updateNumberProperty('marginTop', $event)"
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-rich-text-box-margin-bottom">{{
          $t(($) => $.toolbar.common.marginBottom, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-rich-text-box-margin-bottom"
          class="w-28"
          unit="pt"
          :min="0"
          :max="maxHeight"
          :step="0.5"
          :model-value="element.marginBottom"
          :format-options="fraction1FormatOptions"
          @update:model-value="updateNumberProperty('marginBottom', $event)"
        />
      </Field>

      <FieldSeparator />

      <Field orientation="horizontal">
        <Switch
          id="properties-rich-text-box-mode-change"
          :model-value="element.modeChange"
          @update:model-value="updateBooleanProperty('modeChange', $event)"
        />
        <FieldLabel for="properties-rich-text-box-mode-change">{{
          $t(($) => $.toolbar.textbox.modeChange, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>

      <FieldGroup v-if="element.modeChange">
        <Field>
          <FieldLabel
            for="properties-rich-text-box-mode-change-physical-note"
            >{{
              $t(($) => $.toolbar.martyria.note, { ns: 'toolbar' })
            }}</FieldLabel
          >
          <Select
            :model-value="element.modeChangePhysicalNote"
            @update:model-value="onModeChangePhysicalNoteChanged"
          >
            <SelectTrigger
              id="properties-rich-text-box-mode-change-physical-note"
              class="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <RichTextSelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="note in notes"
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
          <FieldLabel for="properties-rich-text-box-mode-change-scale">{{
            $t(($) => $.toolbar.martyria.scale, { ns: 'toolbar' })
          }}</FieldLabel>
          <Select
            :model-value="element.modeChangeScale"
            @update:model-value="onModeChangeScaleChanged"
          >
            <SelectTrigger
              id="properties-rich-text-box-mode-change-scale"
              class="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <RichTextSelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="scale in scales"
                  :key="scale.key"
                  :value="scale.key"
                >
                  {{ $t(scale.displayName, { ns: 'model' }) }}
                </SelectItem>
              </SelectGroup>
            </RichTextSelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel for="properties-rich-text-box-mode-change-virtual-note">{{
            $t(($) => $.toolbar.textbox.virtualNote, { ns: 'toolbar' })
          }}</FieldLabel>
          <Select
            :model-value="element.modeChangeVirtualNote || SELECT_NONE_VALUE"
            @update:model-value="onModeChangeVirtualNoteChanged"
          >
            <SelectTrigger
              id="properties-rich-text-box-mode-change-virtual-note"
              class="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <RichTextSelectContent>
              <SelectGroup>
                <SelectItem :value="SELECT_NONE_VALUE">
                  {{ $t(($) => $.toolbar.common.none, { ns: 'toolbar' }) }}
                </SelectItem>
                <SelectItem
                  v-for="note in notes"
                  :key="note.key"
                  :value="note.key"
                >
                  {{ $t(note.displayName, { ns: 'model' }) }}
                </SelectItem>
              </SelectGroup>
            </RichTextSelectContent>
          </Select>
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-rich-text-box-bpm">{{
            $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputBpm
            id="properties-rich-text-box-bpm"
            :model-value="element.modeChangeBpm"
            @update:model-value="
              updateElement({
                modeChangeBpm: $event,
              })
            "
          />
        </Field>

        <Field orientation="horizontal">
          <Switch
            id="properties-rich-text-box-ignore-attractions"
            :model-value="element.modeChangeIgnoreAttractions"
            @update:model-value="
              updateBooleanProperty('modeChangeIgnoreAttractions', $event)
            "
          />
          <FieldLabel for="properties-rich-text-box-ignore-attractions">{{
            $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
          }}</FieldLabel>
        </Field>

        <Field orientation="horizontal">
          <Switch
            id="properties-rich-text-box-permanent-enharmonic-zo"
            :model-value="element.modeChangePermanentEnharmonicZo"
            @update:model-value="
              updateBooleanProperty('modeChangePermanentEnharmonicZo', $event)
            "
          />
          <FieldLabel for="properties-rich-text-box-permanent-enharmonic-zo">{{
            $t(($) => $.toolbar.initialMartyria.permanentEnharmonicZo, {
              ns: 'toolbar',
            })
          }}</FieldLabel>
        </Field>
      </FieldGroup>

      <template v-if="source === 'score'">
        <FieldSeparator />

        <FieldSet>
          <FieldLegend variant="label">{{
            $t(($) => $.toolbar.textbox.runningMarker, { ns: 'toolbar' })
          }}</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel for="properties-rich-text-box-running-marker-role">{{
                $t(($) => $.toolbar.textbox.runningMarkerRole, {
                  ns: 'toolbar',
                })
              }}</FieldLabel>
              <Select
                :model-value="
                  element.runningMarkerRole ?? RUNNING_MARKER_NONE_VALUE
                "
                @update:model-value="onRunningMarkerRoleChanged"
              >
                <SelectTrigger
                  id="properties-rich-text-box-running-marker-role"
                >
                  <SelectValue />
                </SelectTrigger>
                <RichTextSelectContent>
                  <SelectGroup>
                    <SelectItem :value="RUNNING_MARKER_NONE_VALUE">
                      {{ $t(($) => $.toolbar.common.none, { ns: 'toolbar' }) }}
                    </SelectItem>
                    <SelectItem value="chapter">
                      {{
                        $t(($) => $.toolbar.textbox.runningMarkerChapter, {
                          ns: 'toolbar',
                        })
                      }}
                    </SelectItem>
                    <SelectItem value="section">
                      {{
                        $t(($) => $.toolbar.textbox.runningMarkerSection, {
                          ns: 'toolbar',
                        })
                      }}
                    </SelectItem>
                  </SelectGroup>
                </RichTextSelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel for="properties-rich-text-box-running-marker-text">{{
                $t(($) => $.toolbar.textbox.runningMarkerText, {
                  ns: 'toolbar',
                })
              }}</FieldLabel>
              <Input
                id="properties-rich-text-box-running-marker-text"
                :model-value="element.runningMarkerText ?? ''"
                :placeholder="
                  $t(($) => $.toolbar.textbox.runningMarkerTextPlaceholder, {
                    ns: 'toolbar',
                  })
                "
                @update:model-value="onRunningMarkerTextChanged"
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </template>

      <FieldSeparator />

      <Field orientation="horizontal">
        <Switch
          id="properties-rich-text-box-scrollable"
          :model-value="element.scrollable"
          @update:model-value="updateBooleanProperty('scrollable', $event)"
        />
        <FieldLabel for="properties-rich-text-box-scrollable">{{
          $t(($) => $.toolbar.textbox.scrollable, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>
    </FieldGroup>
  </FieldSet>
</template>

<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputBpm from '@/components/InputBpm.vue';
import InputUnit from '@/components/InputUnit.vue';
import RichTextSelectContent from '@/components/RichTextSelectContent.vue';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { RichTextBoxElement } from '@/models/Element';
import {
  getNoteLabelSelector,
  getScaleLabelSelector,
} from '@/models/NeumeI18nMappings';
import type { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
import { fraction1FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

import PropertiesRichTextStyle from './PropertiesRichTextStyle.vue';

type BooleanRichTextBoxProperty = {
  [K in keyof RichTextBoxElement]: RichTextBoxElement[K] extends boolean
    ? K
    : never;
}[keyof RichTextBoxElement];
type NumberRichTextBoxProperty = {
  [K in keyof RichTextBoxElement]: RichTextBoxElement[K] extends number
    ? K
    : never;
}[keyof RichTextBoxElement];

const notes = Object.values(ScaleNote).map((x) => ({
  key: x,
  displayName: getNoteLabelSelector(x),
}));

const scales = Object.values(Scale).map((x) => ({
  key: x,
  displayName: getScaleLabelSelector(x),
}));

const props = defineProps({
  element: {
    type: Object as PropType<RichTextBoxElement>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  source: {
    type: String as PropType<'score' | 'header-footer'>,
    required: true,
  },
});

const emit = defineEmits<{
  update: [value: Partial<RichTextBoxElement>];
}>();

const SELECT_NONE_VALUE = '__none__';
const RUNNING_MARKER_NONE_VALUE = '__none__';

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
const maxHeight = computed(() => Unit.toPt(props.pageSetup.innerPageHeight));

function updateElement(value: Partial<RichTextBoxElement>) {
  emit('update', value);
}

function updateBooleanProperty(
  propertyName: BooleanRichTextBoxProperty,
  value: boolean | 'indeterminate',
) {
  updateElement({
    [propertyName]: value === true,
  } as Partial<RichTextBoxElement>);
}

function updateNumberProperty(
  propertyName: NumberRichTextBoxProperty,
  value: number | null,
) {
  if (value == null) {
    return;
  }

  updateElement({
    [propertyName]: value,
  } as Partial<RichTextBoxElement>);
}

function onModeChangePhysicalNoteChanged(value: AcceptableValue) {
  if (isScaleNote(value)) {
    updateElement({
      modeChangePhysicalNote: value,
    });
  }
}

function onModeChangeScaleChanged(value: AcceptableValue) {
  if (isScale(value)) {
    updateElement({
      modeChangeScale: value,
    });
  }
}

function onModeChangeVirtualNoteChanged(value: AcceptableValue) {
  if (value === SELECT_NONE_VALUE) {
    updateElement({
      modeChangeVirtualNote: null,
    });
  } else if (isScaleNote(value)) {
    updateElement({
      modeChangeVirtualNote: value,
    });
  }
}

function onRunningMarkerRoleChanged(value: AcceptableValue) {
  updateElement({
    runningMarkerRole:
      value === RUNNING_MARKER_NONE_VALUE || value == null
        ? null
        : (value as RichTextBoxElement['runningMarkerRole']),
  });
}

function onRunningMarkerTextChanged(value: string | number) {
  const text = String(value);

  updateElement({
    runningMarkerText: text.trim() === '' ? null : text,
  });
}

function isScale(value: unknown): value is Scale {
  return (
    typeof value === 'string' && Object.values(Scale).includes(value as Scale)
  );
}

function isScaleNote(value: unknown): value is ScaleNote {
  return (
    typeof value === 'string' &&
    Object.values(ScaleNote).includes(value as ScaleNote)
  );
}
</script>
