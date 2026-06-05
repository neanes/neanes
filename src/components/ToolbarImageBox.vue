<template>
  <div class="image-box-toolbar">
    <Checkbox
      id="toolbar-image-box-inline"
      class="bg-background"
      :model-value="element.inline"
      @update:model-value="
        $emit('update', {
          inline: $event === true,
        } as Partial<ImageBoxElement>)
      "
    />
    <Label for="toolbar-image-box-inline" class="ml-2">{{
      $t(($) => $.toolbar.common.inline, { ns: 'toolbar' })
    }}</Label>

    <span class="space" />

    <Checkbox
      id="toolbar-image-box-lock-aspect-ratio"
      class="bg-background"
      :model-value="element.lockAspectRatio"
      @update:model-value="
        $emit('update', {
          lockAspectRatio: $event === true,
        } as Partial<ImageBoxElement>)
      "
    />
    <Label for="toolbar-image-box-lock-aspect-ratio" class="ml-2">{{
      $t(($) => $.toolbar.imageBox.maintainAspectRatio, { ns: 'toolbar' })
    }}</Label>

    <span class="space" />

    <Label for="toolbar-image-box-width" class="mr-2">{{
      $t(($) => $.toolbar.imageBox.width, { ns: 'toolbar' })
    }}</Label>
    <InputUnit
      id="toolbar-image-box-width"
      :model-value="element.imageWidth"
      unit="unitless"
      :min="10"
      :max="pageSetup.pageWidth"
      :step="1"
      :format-options="fraction0FormatOptions"
      @update:model-value="onChangeWidth($event)"
    />

    <span class="space" />

    <Label for="toolbar-image-box-height" class="mr-2">{{
      $t(($) => $.toolbar.imageBox.height, { ns: 'toolbar' })
    }}</Label>
    <InputUnit
      id="toolbar-image-box-height"
      :model-value="element.imageHeight"
      unit="unitless"
      :min="10"
      :max="pageSetup.pageHeight"
      :step="1"
      :format-options="fraction0FormatOptions"
      @update:model-value="onChangeHeight($event)"
    />
    <template v-if="!element.inline">
      <span class="space" />
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.common.alignLeft, { ns: 'toolbar' })"
      >
        <template #default="{ ariaLabel }">
          <button
            class="icon-btn"
            :class="{ selected: element.alignment === TextBoxAlignment.Left }"
            :aria-label="ariaLabel"
            @click="
              $emit('update', {
                alignment: TextBoxAlignment.Left,
              } as Partial<ImageBoxElement>)
            "
          >
            <img src="@/assets/icons/alignleft.svg" />
          </button>
        </template>
      </AppTooltip>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.common.alignCenter, { ns: 'toolbar' })"
      >
        <template #default="{ ariaLabel }">
          <button
            class="icon-btn"
            :class="{ selected: element.alignment === TextBoxAlignment.Center }"
            :aria-label="ariaLabel"
            @click="
              $emit('update', {
                alignment: TextBoxAlignment.Center,
              } as Partial<ImageBoxElement>)
            "
          >
            <img src="@/assets/icons/aligncenter.svg" />
          </button>
        </template>
      </AppTooltip>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })"
      >
        <template #default="{ ariaLabel }">
          <button
            class="icon-btn"
            :class="{ selected: element.alignment === TextBoxAlignment.Right }"
            :aria-label="ariaLabel"
            @click="
              $emit('update', {
                alignment: TextBoxAlignment.Right,
              } as Partial<ImageBoxElement>)
            "
          >
            <img src="@/assets/icons/alignright.svg" />
          </button>
        </template>
      </AppTooltip>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ImageBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { fraction0FormatOptions } from '@/utils/numberFormatOptions';

import InputUnit from './InputUnit.vue';

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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.image-box-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  background-color: var(--color-legacy-chrome-menu-surface);

  padding: 0.25rem;

  --btn-size: 32px;
}

.icon-btn {
  box-sizing: border-box;
  height: var(--btn-size);
  width: var(--btn-size);
  appearance: auto;
  background: revert;
  border: revert;
  border-radius: revert;
  box-shadow: revert;
  font-weight: revert;

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
  outline: revert;
  padding: 0;
  transition: revert;
  user-select: none;
}

.icon-btn:hover {
  background: revert;
}

.icon-btn.selected {
  background: var(--color-legacy-chrome-selected);
}

.icon-btn img {
  height: var(--btn-icon-size, var(--btn-size));
  max-width: none;
  width: var(--btn-icon-size, var(--btn-size));
}

.icon-btn[aria-disabled='true'],
.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.divider {
  height: 32px;
  border-right: 1px solid var(--color-legacy-chrome-divider);
  margin: 0 0.5rem;
}

.space {
  width: 16px;
}
</style>
