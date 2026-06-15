<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.insert.image, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <Field orientation="horizontal">
        <Checkbox
          id="properties-image-box-inline"
          :model-value="element.inline"
          @update:model-value="
            $emit('update', {
              inline: $event === true,
            } as Partial<ImageBoxElement>)
          "
        />
        <FieldLabel for="properties-image-box-inline">
          {{ $t(($) => $.toolbar.common.inline, { ns: 'toolbar' }) }}
        </FieldLabel>
      </Field>

      <Field orientation="horizontal">
        <Checkbox
          id="properties-image-box-lock-aspect-ratio"
          :model-value="element.lockAspectRatio"
          @update:model-value="
            $emit('update', {
              lockAspectRatio: $event === true,
            } as Partial<ImageBoxElement>)
          "
        />
        <FieldLabel for="properties-image-box-lock-aspect-ratio">{{
          $t(($) => $.toolbar.imageBox.maintainAspectRatio, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-image-box-width">{{
          $t(($) => $.toolbar.imageBox.width, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-image-box-width"
          class="w-28"
          :model-value="element.imageWidth"
          unit="unitless"
          :min="10"
          :max="pageSetup.pageWidth"
          :step="1"
          :format-options="fraction0FormatOptions"
          @update:model-value="onChangeWidth($event)"
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-image-box-height">{{
          $t(($) => $.toolbar.imageBox.height, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-image-box-height"
          class="w-28"
          :model-value="element.imageHeight"
          unit="unitless"
          :min="10"
          :max="pageSetup.pageHeight"
          :step="1"
          :format-options="fraction0FormatOptions"
          @update:model-value="onChangeHeight($event)"
        />
      </Field>

      <Field v-if="!element.inline" orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.toolbar.common.alignment, { ns: 'toolbar' })
        }}</FieldLabel>
        <ToggleGroup
          type="single"
          variant="outline"
          :model-value="element.alignment"
          @update:model-value="onAlignmentChanged"
        >
          <AppTooltip
            :tooltip="$t(($) => $.toolbar.common.alignLeft, { ns: 'toolbar' })"
          >
            <ToggleGroupItem :value="TextBoxAlignment.Left">
              <PhTextAlignLeft />
            </ToggleGroupItem>
          </AppTooltip>
          <AppTooltip
            :tooltip="
              $t(($) => $.toolbar.common.alignCenter, { ns: 'toolbar' })
            "
          >
            <ToggleGroupItem :value="TextBoxAlignment.Center">
              <PhTextAlignCenter />
            </ToggleGroupItem>
          </AppTooltip>
          <AppTooltip
            :tooltip="$t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })"
          >
            <ToggleGroupItem :value="TextBoxAlignment.Right">
              <PhTextAlignRight />
            </ToggleGroupItem>
          </AppTooltip>
        </ToggleGroup>
      </Field>
    </FieldGroup>
  </FieldSet>
</template>

<script setup lang="ts">
import {
  PhTextAlignCenter,
  PhTextAlignLeft,
  PhTextAlignRight,
} from '@phosphor-icons/vue';
import type { PropType } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import InputUnit from '@/components/InputUnit.vue';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ImageBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { fraction0FormatOptions } from '@/utils/numberFormatOptions';

const props = defineProps({
  element: {
    type: Object as PropType<ImageBoxElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const emit = defineEmits(['update']);

function onAlignmentChanged(value: unknown) {
  if (isTextBoxAlignment(value)) {
    emit('update', {
      alignment: value,
    } as Partial<ImageBoxElement>);
  }
}

function isTextBoxAlignment(value: unknown): value is TextBoxAlignment {
  return Object.values(TextBoxAlignment).includes(value as TextBoxAlignment);
}

function onChangeHeight(height: number | null) {
  if (height == null) {
    return;
  }

  const aspectRatio = props.element.aspectRatio;

  let width = props.element.imageWidth;

  if (props.element.lockAspectRatio) {
    width = height * aspectRatio;
  }

  emit('update', {
    imageWidth: width,
    imageHeight: height,
  } as Partial<ImageBoxElement>);
}

function onChangeWidth(width: number | null) {
  if (width == null) {
    return;
  }

  const aspectRatio = props.element.aspectRatio;

  let height = props.element.imageHeight;

  if (props.element.lockAspectRatio) {
    height = width / aspectRatio;
  }

  emit('update', {
    imageWidth: width,
    imageHeight: height,
  } as Partial<ImageBoxElement>);
}
</script>
