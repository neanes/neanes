<template>
  <div class="text-box-toolbar">
    <div class="form-group">
      <Checkbox
        id="toolbar-text-box-inline"
        class="bg-background"
        :model-value="element.inline"
        @update:model-value="
          $emit('update', {
            inline: $event === true,
          } as Partial<RichTextBoxElement>)
        "
      />
      <Label for="toolbar-text-box-inline" class="ml-2">{{
        $t(($) => $.toolbar.common.inline, { ns: 'toolbar' })
      }}</Label>
    </div>
    <template v-if="element.inline">
      <span class="space" />
      <div class="form-group">
        <Label for="toolbar-rich-text-box-width" class="mr-2">{{
          $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
        }}</Label>
        <InputUnit
          id="toolbar-rich-text-box-width"
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
      </div>
      <span class="space" />
      <div class="form-group">
        <Label for="toolbar-rich-text-box-offset-y-top" class="mr-2">{{
          $t(($) => $.toolbar.textbox.offsetYTop, { ns: 'toolbar' })
        }}</Label>
        <InputUnit
          id="toolbar-rich-text-box-offset-y-top"
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
      </div>
      <span class="space"></span>
      <div class="form-group">
        <Label for="toolbar-rich-text-box-offset-y-bottom" class="mr-2">{{
          $t(($) => $.toolbar.textbox.offsetYBottom, { ns: 'toolbar' })
        }}</Label>
        <InputUnit
          id="toolbar-rich-text-box-offset-y-bottom"
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
      </div>
      <span class="space" />
      <div class="form-group">
        <Checkbox
          id="toolbar-text-box-center-on-page"
          class="bg-background"
          :model-value="element.centerOnPage"
          @update:model-value="
            $emit('update', {
              centerOnPage: $event === true,
            } as Partial<RichTextBoxElement>)
          "
        />
        <Label for="toolbar-text-box-center-on-page" class="ml-2">{{
          $t(($) => $.toolbar.textbox.centerOnPage, { ns: 'toolbar' })
        }}</Label>
      </div>
    </template>
    <span class="divider" />
    <Label for="toolbar-rich-text-box-margin-top" class="mr-2">{{
      $t(($) => $.toolbar.common.marginTop, { ns: 'toolbar' })
    }}</Label>
    <InputUnit
      id="toolbar-rich-text-box-margin-top"
      unit="pt"
      :min="0"
      :max="maxHeight"
      :step="0.5"
      :model-value="element.marginTop"
      :format-options="fraction1FormatOptions"
      @update:model-value="
        $emit('update', { marginTop: $event } as Partial<RichTextBoxElement>)
      "
    />
    <span class="space"></span>
    <Label for="toolbar-rich-text-box-margin-bottom" class="mr-2">{{
      $t(($) => $.toolbar.common.marginBottom, { ns: 'toolbar' })
    }}</Label>
    <InputUnit
      id="toolbar-rich-text-box-margin-bottom"
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
    <span class="divider"></span>
    <div class="form-group">
      <Checkbox
        id="toolbar-text-box-mode-change"
        class="bg-background"
        :model-value="element.modeChange"
        @update:model-value="
          $emit('update', {
            modeChange: $event === true,
          } as Partial<RichTextBoxElement>)
        "
      />
      <Label for="toolbar-text-box-mode-change" class="ml-2">{{
        $t(($) => $.toolbar.textbox.modeChange, { ns: 'toolbar' })
      }}</Label>
    </div>
    <template v-if="element.modeChange">
      <span class="space"></span>
      <div class="form-group">
        <Label
          for="toolbar-rich-text-box-mode-change-physical-note"
          class="mr-2"
          >{{ $t(($) => $.toolbar.martyria.note, { ns: 'toolbar' }) }}</Label
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
            id="toolbar-rich-text-box-mode-change-physical-note"
            class="bg-background"
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
      </div>
      <span class="space"></span>
      <div class="form-group">
        <Label for="toolbar-rich-text-box-mode-change-scale" class="mr-2">{{
          $t(($) => $.toolbar.martyria.scale, { ns: 'toolbar' })
        }}</Label>
        <Select
          :model-value="element.modeChangeScale"
          @update:model-value="
            $emit('update', {
              modeChangeScale: $event,
            } as Partial<RichTextBoxElement>)
          "
        >
          <SelectTrigger
            id="toolbar-rich-text-box-mode-change-scale"
            class="bg-background"
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
      </div>
      <span class="space"></span>
      <div class="form-group">
        <Label
          for="toolbar-rich-text-box-mode-change-virtual-note"
          class="mr-2"
          >{{
            $t(($) => $.toolbar.textbox.virtualNote, { ns: 'toolbar' })
          }}</Label
        >
        <Select
          :model-value="element.modeChangeVirtualNote || SELECT_NONE_VALUE"
          @update:model-value="onModeChangeVirtualNoteChanged"
        >
          <SelectTrigger
            id="toolbar-rich-text-box-mode-change-virtual-note"
            class="bg-background"
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
      </div>
      <span class="space"></span>
      <div class="form-group">
        <Label for="toolbar-rich-text-box-bpm" class="mr-2">{{
          $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
        }}</Label>
        <InputBpm
          id="toolbar-rich-text-box-bpm"
          :model-value="element.modeChangeBpm"
          @update:model-value="
            $emit('update', {
              modeChangeBpm: $event,
            } as Partial<RichTextBoxElement>)
          "
        />
      </div>
      <span class="space"></span>
      <div class="form-group">
        <Checkbox
          id="toolbar-rich-text-box-ignore-attractions"
          class="bg-background"
          :model-value="element.modeChangeIgnoreAttractions"
          @update:model-value="
            $emit('update', {
              modeChangeIgnoreAttractions: $event === true,
            } as Partial<RichTextBoxElement>)
          "
        />
        <Label for="toolbar-rich-text-box-ignore-attractions" class="ml-2">{{
          $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
        }}</Label>
      </div>
      <span class="space"></span>
      <div class="form-group">
        <Checkbox
          id="toolbar-rich-text-box-permanent-enharmonic-zo"
          class="bg-background"
          :model-value="element.modeChangePermanentEnharmonicZo"
          @update:model-value="
            $emit('update', {
              modeChangePermanentEnharmonicZo: $event === true,
            } as Partial<RichTextBoxElement>)
          "
        />
        <Label
          for="toolbar-rich-text-box-permanent-enharmonic-zo"
          class="ml-2"
          >{{
            $t(($) => $.toolbar.modeKey.permanentEnharmonicZo, {
              ns: 'toolbar',
            })
          }}</Label
        >
      </div>
    </template>
    <span class="divider"></span>
    <div class="form-group">
      <Checkbox
        id="toolbar-text-box-rtl"
        class="bg-background"
        :model-value="element.rtl"
        @update:model-value="
          $emit('update', {
            rtl: $event === true,
          } as Partial<RichTextBoxElement>)
        "
      />
      <Label for="toolbar-text-box-rtl" class="ml-2">{{
        $t(($) => $.toolbar.textbox.rtl, { ns: 'toolbar' })
      }}</Label>
    </div>
    <span class="divider"></span>
    <div class="form-group">
      <Checkbox
        id="toolbar-text-box-scrollable"
        class="bg-background"
        :model-value="element.scrollable"
        @update:model-value="
          $emit('update', {
            scrollable: $event === true,
          } as Partial<RichTextBoxElement>)
        "
      />
      <Label for="toolbar-text-box-scrollable" class="ml-2">{{
        $t(($) => $.toolbar.textbox.scrollable, { ns: 'toolbar' })
      }}</Label>
    </div>
    <span class="divider"></span>
    <Label for="toolbar-rich-text-box-section-name" class="mr-2">{{
      $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
    }}</Label>
    <Input
      id="toolbar-rich-text-box-section-name"
      class="w-auto bg-background"
      type="text"
      :model-value="element.sectionName ?? ''"
      @change="
        $emit('update:sectionName', ($event.target as HTMLInputElement).value)
      "
    />
  </div>
</template>

<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputBpm from '@/components/InputBpm.vue';
import InputUnit from '@/components/InputUnit.vue';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const emit = defineEmits(['update', 'update:sectionName']);

const SELECT_NONE_VALUE = '__none__';

function onModeChangeVirtualNoteChanged(value: AcceptableValue) {
  emit('update', {
    modeChangeVirtualNote: value === SELECT_NONE_VALUE ? '' : value,
  } as Partial<RichTextBoxElement>);
}

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
const maxHeight = computed(() => Unit.toPt(props.pageSetup.innerPageHeight));
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.text-box-toolbar {
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
