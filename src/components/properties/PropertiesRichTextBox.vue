<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.insert.richTextBox, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <Field orientation="horizontal">
        <Checkbox
          id="properties-rich-text-box-inline"
          :model-value="element.inline"
          @update:model-value="
            $emit('update', {
              inline: $event === true,
            } as Partial<RichTextBoxElement>)
          "
        />
        <FieldLabel for="properties-rich-text-box-inline">
          {{ $t(($) => $.toolbar.common.inline, { ns: 'toolbar' }) }}
        </FieldLabel>
      </Field>

      <template v-if="element.inline">
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
              $emit('update', {
                customWidth: $event,
              } as Partial<RichTextBoxElement>)
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
            @update:model-value="
              $emit('update', {
                offsetYTop: $event,
              } as Partial<RichTextBoxElement>)
            "
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
            @update:model-value="
              $emit('update', {
                offsetYBottom: $event,
              } as Partial<RichTextBoxElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="properties-rich-text-box-center-on-page"
            :model-value="element.centerOnPage"
            @update:model-value="
              $emit('update', {
                centerOnPage: $event === true,
              } as Partial<RichTextBoxElement>)
            "
          />
          <FieldLabel for="properties-rich-text-box-center-on-page">{{
            $t(($) => $.toolbar.textbox.centerOnPage, { ns: 'toolbar' })
          }}</FieldLabel>
        </Field>
      </template>

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
          @update:model-value="
            $emit('update', {
              marginTop: $event,
            } as Partial<RichTextBoxElement>)
          "
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
          @update:model-value="
            $emit('update', {
              marginBottom: $event,
            } as Partial<RichTextBoxElement>)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <Checkbox
          id="properties-rich-text-box-mode-change"
          :model-value="element.modeChange"
          @update:model-value="
            $emit('update', {
              modeChange: $event === true,
            } as Partial<RichTextBoxElement>)
          "
        />
        <FieldLabel for="properties-rich-text-box-mode-change">{{
          $t(($) => $.toolbar.textbox.modeChange, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>

      <template v-if="element.modeChange">
        <Field>
          <FieldLabel
            for="properties-rich-text-box-mode-change-physical-note"
            >{{
              $t(($) => $.toolbar.martyria.note, { ns: 'toolbar' })
            }}</FieldLabel
          >
          <Select
            :model-value="element.modeChangePhysicalNote"
            @update:model-value="
              $emit('update', {
                modeChangePhysicalNote: $event,
              } as Partial<RichTextBoxElement>)
            "
          >
            <SelectTrigger
              id="properties-rich-text-box-mode-change-physical-note"
              class="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="note in notes"
                  :key="note.key"
                  :value="note.key"
                >
                  {{ $t(note.displayName, { ns: 'model' }) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel for="properties-rich-text-box-mode-change-scale">{{
            $t(($) => $.toolbar.martyria.scale, { ns: 'toolbar' })
          }}</FieldLabel>
          <Select
            :model-value="element.modeChangeScale"
            @update:model-value="
              $emit('update', {
                modeChangeScale: $event,
              } as Partial<RichTextBoxElement>)
            "
          >
            <SelectTrigger
              id="properties-rich-text-box-mode-change-scale"
              class="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="scale in scales"
                  :key="scale.key"
                  :value="scale.key"
                >
                  {{ $t(scale.displayName, { ns: 'model' }) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
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
            <SelectContent>
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
            </SelectContent>
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
              $emit('update', {
                modeChangeBpm: $event,
              } as Partial<RichTextBoxElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="properties-rich-text-box-ignore-attractions"
            :model-value="element.modeChangeIgnoreAttractions"
            @update:model-value="
              $emit('update', {
                modeChangeIgnoreAttractions: $event === true,
              } as Partial<RichTextBoxElement>)
            "
          />
          <FieldLabel for="properties-rich-text-box-ignore-attractions">{{
            $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
          }}</FieldLabel>
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="properties-rich-text-box-permanent-enharmonic-zo"
            :model-value="element.modeChangePermanentEnharmonicZo"
            @update:model-value="
              $emit('update', {
                modeChangePermanentEnharmonicZo: $event === true,
              } as Partial<RichTextBoxElement>)
            "
          />
          <FieldLabel for="properties-rich-text-box-permanent-enharmonic-zo">{{
            $t(($) => $.toolbar.modeKey.permanentEnharmonicZo, {
              ns: 'toolbar',
            })
          }}</FieldLabel>
        </Field>
      </template>

      <Field orientation="horizontal">
        <Checkbox
          id="properties-rich-text-box-rtl"
          :model-value="element.rtl"
          @update:model-value="
            $emit('update', {
              rtl: $event === true,
            } as Partial<RichTextBoxElement>)
          "
        />
        <FieldLabel for="properties-rich-text-box-rtl">
          {{ $t(($) => $.toolbar.textbox.rtl, { ns: 'toolbar' }) }}
        </FieldLabel>
      </Field>

      <Field orientation="horizontal">
        <Checkbox
          id="properties-rich-text-box-scrollable"
          :model-value="element.scrollable"
          @update:model-value="
            $emit('update', {
              scrollable: $event === true,
            } as Partial<RichTextBoxElement>)
          "
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RichTextBoxElement } from '@/models/Element';
import {
  getNoteLabelSelector,
  getScaleLabelSelector,
} from '@/models/NeumeI18nMappings';
import type { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
import { fraction1FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

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
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const emit = defineEmits(['update']);

const SELECT_NONE_VALUE = '__none__';

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
const maxHeight = computed(() => Unit.toPt(props.pageSetup.innerPageHeight));

function onModeChangeVirtualNoteChanged(value: AcceptableValue) {
  emit('update', {
    modeChangeVirtualNote: value === SELECT_NONE_VALUE ? '' : value,
  } as Partial<RichTextBoxElement>);
}
</script>
