<template>
  <div class="text-box-toolbar">
    <div class="form-group">
      <input
        id="toolbar-text-box-inline"
        type="checkbox"
        :checked="element.inline"
        @change="
          $emit('update', {
            inline: ($event.target as HTMLInputElement).checked,
          } as Partial<RichTextBoxElement>)
        "
      />
      <label for="toolbar-text-box-inline">{{
        $t(($) => $.toolbar.common.inline, { ns: 'toolbar' })
      }}</label>
    </div>
    <template v-if="element.inline">
      <span class="space" />
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
        }}</label>
        <InputUnit
          class="text-box-input-width"
          unit="pt"
          :nullable="true"
          :min="0.5"
          :max="maxWidth"
          :step="0.5"
          :model-value="element.customWidth"
          :precision="1"
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
        <label class="right-space">{{
          $t(($) => $.toolbar.textbox.offsetYTop, { ns: 'toolbar' })
        }}</label>
        <InputUnit
          class="text-box-input-width"
          unit="pt"
          :min="-maxHeight"
          :max="maxHeight"
          :step="0.5"
          :model-value="element.offsetYTop"
          :precision="1"
          @update:model-value="
            $emit('update', {
              offsetYTop: $event,
            } as Partial<RichTextBoxElement>)
          "
        />
      </div>
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.textbox.offsetYBottom, { ns: 'toolbar' })
        }}</label>
        <InputUnit
          class="text-box-input-width"
          unit="pt"
          :min="-maxHeight"
          :max="maxHeight"
          :step="0.5"
          :model-value="element.offsetYBottom"
          :precision="1"
          @update:model-value="
            $emit('update', {
              offsetYBottom: $event,
            } as Partial<RichTextBoxElement>)
          "
        />
      </div>
      <span class="space" />
      <div class="form-group">
        <input
          id="toolbar-text-box-center-on-page"
          type="checkbox"
          :checked="element.centerOnPage"
          @change="
            $emit('update', {
              centerOnPage: ($event.target as HTMLInputElement).checked,
            } as Partial<RichTextBoxElement>)
          "
        />
        <label for="toolbar-text-box-center-on-page">{{
          $t(($) => $.toolbar.textbox.centerOnPage, { ns: 'toolbar' })
        }}</label>
      </div>
    </template>
    <span class="divider" />
    <div class="form-group">
      <label class="right-space">{{
        $t(($) => $.toolbar.common.marginTop, { ns: 'toolbar' })
      }}</label>
      <InputUnit
        class="text-box-input-width"
        unit="pt"
        :min="0"
        :max="maxHeight"
        :step="0.5"
        :model-value="element.marginTop"
        :precision="1"
        @update:model-value="
          $emit('update', { marginTop: $event } as Partial<RichTextBoxElement>)
        "
      />
    </div>
    <span class="space"></span>
    <div class="form-group">
      <label class="right-space">{{
        $t(($) => $.toolbar.common.marginBottom, { ns: 'toolbar' })
      }}</label>
      <InputUnit
        class="text-box-input-width"
        unit="pt"
        :min="0"
        :max="maxHeight"
        :step="0.5"
        :model-value="element.marginBottom"
        :precision="1"
        @update:model-value="
          $emit('update', {
            marginBottom: $event,
          } as Partial<RichTextBoxElement>)
        "
      />
    </div>
    <span class="divider"></span>
    <div class="form-group">
      <input
        id="toolbar-text-box-mode-change"
        type="checkbox"
        :checked="element.modeChange"
        @change="
          $emit('update', {
            modeChange: ($event.target as HTMLInputElement).checked,
          } as Partial<RichTextBoxElement>)
        "
      />
      <label for="toolbar-text-box-mode-change">{{
        $t(($) => $.toolbar.textbox.modeChange, { ns: 'toolbar' })
      }}</label>
    </div>
    <template v-if="element.modeChange">
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.martyria.note, { ns: 'toolbar' })
        }}</label>
        <select
          :value="element.modeChangePhysicalNote"
          @change="
            $emit('update', {
              modeChangePhysicalNote: ($event.target as HTMLInputElement).value,
            } as Partial<RichTextBoxElement>)
          "
        >
          <option v-for="note in notes" :key="note.key" :value="note.key">
            {{ $t(note.displayName, { ns: 'model' }) }}
          </option>
        </select>
      </div>
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.martyria.scale, { ns: 'toolbar' })
        }}</label>
        <select
          :value="element.modeChangeScale"
          @change="
            $emit('update', {
              modeChangeScale: ($event.target as HTMLInputElement).value,
            } as Partial<RichTextBoxElement>)
          "
        >
          <option v-for="scale in scales" :key="scale.key" :value="scale.key">
            {{ $t(scale.displayName, { ns: 'model' }) }}
          </option>
        </select>
      </div>
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.textbox.virtualNote, { ns: 'toolbar' })
        }}</label>
        <select
          :value="element.modeChangeVirtualNote"
          @change="
            $emit('update', {
              modeChangeVirtualNote: ($event.target as HTMLInputElement).value,
            } as Partial<RichTextBoxElement>)
          "
        >
          <option value="">
            {{ $t(($) => $.toolbar.common.none, { ns: 'toolbar' }) }}
          </option>
          <option v-for="note in notes" :key="note.key" :value="note.key">
            {{ $t(note.displayName, { ns: 'model' }) }}
          </option>
        </select>
      </div>
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
        }}</label>
        <InputBpm
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
        <input
          id="toolbar-rich-text-box-ignore-attractions"
          type="checkbox"
          :checked="element.modeChangeIgnoreAttractions"
          @change="
            $emit('update', {
              modeChangeIgnoreAttractions: ($event.target as HTMLInputElement)
                .checked,
            } as Partial<RichTextBoxElement>)
          "
        />
        <label for="toolbar-rich-text-box-ignore-attractions">{{
          $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
        }}</label>
      </div>
      <span class="space"></span>
      <div class="form-group">
        <input
          id="toolbar-rich-text-box-permanent-enharmonic-zo"
          type="checkbox"
          :checked="element.modeChangePermanentEnharmonicZo"
          @change="
            $emit('update', {
              modeChangePermanentEnharmonicZo: (
                $event.target as HTMLInputElement
              ).checked,
            } as Partial<RichTextBoxElement>)
          "
        />
        <label for="toolbar-rich-text-box-permanent-enharmonic-zo">{{
          $t(($) => $.toolbar.modeKey.permanentEnharmonicZo, { ns: 'toolbar' })
        }}</label>
      </div>
    </template>
    <span class="divider"></span>
    <div class="form-group">
      <input
        id="toolbar-text-box-rtl"
        type="checkbox"
        :checked="element.rtl"
        @change="
          $emit('update', {
            rtl: ($event.target as HTMLInputElement).checked,
          } as Partial<RichTextBoxElement>)
        "
      />
      <label for="toolbar-text-box-rtl">{{
        $t(($) => $.toolbar.textbox.rtl, { ns: 'toolbar' })
      }}</label>
    </div>
    <span class="divider"></span>
    <div class="form-group">
      <input
        id="toolbar-text-box-scrollable"
        type="checkbox"
        :checked="element.scrollable"
        @change="
          $emit('update', {
            scrollable: ($event.target as HTMLInputElement).checked,
          } as Partial<RichTextBoxElement>)
        "
      />
      <label for="toolbar-text-box-scrollable">{{
        $t(($) => $.toolbar.textbox.scrollable, { ns: 'toolbar' })
      }}</label>
    </div>
    <span class="divider"></span>
    <div class="form-group">
      <label class="right-space">{{
        $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
      }}</label>
      <input
        type="text"
        :value="element.sectionName"
        @change="
          $emit('update:sectionName', ($event.target as HTMLInputElement).value)
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputBpm from '@/components/InputBpm.vue';
import InputUnit from '@/components/InputUnit.vue';
import type { RichTextBoxElement } from '@/models/Element';
import {
  getNoteLabelSelector,
  getScaleLabelSelector,
} from '@/models/NeumeI18nMappings';
import type { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
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

defineEmits(['update', 'update:sectionName']);

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
const maxHeight = computed(() => Unit.toPt(props.pageSetup.innerPageHeight));
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.text-box-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  background-color: lightgray;

  padding: 0.25rem;
}

.icon-btn {
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.selected {
  background-color: var(--btn-color-selected);
}

label.right-space {
  margin-right: 0.5rem;
}

.divider {
  height: 32px;
  border-right: 1px solid #666;
  margin: 0 0.5rem;
}

.space {
  width: 16px;
}

.text-box-input-width {
  width: 8ch;
}
</style>
