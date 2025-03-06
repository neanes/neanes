<template>
  <div class="mode-key-toolbar">
    <input
      id="toolbar-mode-key-use-default-style"
      type="checkbox"
      :checked="element.useDefaultStyle"
      @change="
        $emit(
          'update:useDefaultStyle',
          ($event.target as HTMLInputElement).checked,
        )
      "
    />
    <label for="toolbar-mode-key-use-default-style">{{
      $t('toolbar:common.useDefaultStyle')
    }}</label>
    <span class="divider" />

    <template v-if="!element.useDefaultStyle">
      <label class="right-space">{{ $t('toolbar:modeKey.size') }}</label>
      <InputFontSize
        :modelValue="element.fontSize"
        @update:modelValue="$emit('update:fontSize', $event)"
      />
      <span class="space"></span>
      <ColorPicker
        :modelValue="element.color"
        @update:modelValue="$emit('update:color', $event)"
      />
      <span class="space"></span>
    </template>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Left }"
      @click="$emit('update:alignment', TextBoxAlignment.Left)"
    >
      <img
        class="icon-btn-img"
        src="@/assets/icons/alignleft.svg"
        width="32"
        height="32"
        :title="$t('toolbar:common.alignLeft')"
      />
    </button>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Center }"
      @click="$emit('update:alignment', TextBoxAlignment.Center)"
    >
      <img
        class="icon-btn-img"
        src="@/assets/icons/aligncenter.svg"
        width="32"
        height="32"
        :title="$t('toolbar:common.alignCenter')"
      />
    </button>
    <button
      class="icon-btn"
      :class="{ selected: element.alignment === TextBoxAlignment.Right }"
      @click="$emit('update:alignment', TextBoxAlignment.Right)"
    >
      <img
        class="icon-btn-img"
        src="@/assets/icons/alignright.svg"
        width="32"
        height="32"
        :title="$t('toolbar:common.alignRight')"
      />
    </button>
    <span class="space" />
    <template v-if="!element.useDefaultStyle">
      <label class="right-space">{{ $t('toolbar:common.outline') }}</label>
      <InputStrokeWidth
        :modelValue="element.strokeWidth"
        @update:modelValue="$emit('update:strokeWidth', $event)"
      />
      <span class="space" />

      <label class="right-space">{{
        $t('toolbar:modeKey.heightAdjustment')
      }}</label>

      <InputUnit
        class="short-input"
        unit="pt"
        :min="heightAdjustmentMin"
        :max="heightAdjustmentMax"
        :step="0.5"
        :precision="2"
        :modelValue="element.heightAdjustment"
        @update:modelValue="$emit('update:heightAdjustment', $event)"
      />
      <span class="space" />
    </template>
    <ButtonWithMenu
      :options="tempoMenuOptions"
      @select="$emit('update:tempo', $event)"
    />
    <span class="space" />

    <button
      class="icon-btn"
      :class="{ selected: element.tempoAlignRight }"
      @click="$emit('update:tempoAlignRight', !element.tempoAlignRight)"
    >
      <img
        :title="$t('toolbar:modeKey.rightAlignTempo')"
        src="@/assets/icons/alignright2.svg"
        height="24"
        width="24"
        class="icon-btn-img"
      />
    </button>

    <span class="space" />

    <label class="right-space">{{ $t('toolbar:common.bpm') }}</label>
    <InputBpm
      :modelValue="element.bpm"
      @update:modelValue="$emit('update:bpm', $event)"
    />

    <span class="space" />

    <div class="form-group">
      <label class="right-space">{{ $t('toolbar:common.marginTop') }}</label>
      <InputUnit
        class="text-box-input-width"
        unit="pt"
        :min="0"
        :max="maxHeight"
        :step="0.5"
        :modelValue="element.marginTop"
        :precision="1"
        @update:modelValue="$emit('update:marginTop', $event)"
      />
    </div>
    <span class="space"></span>
    <div class="form-group">
      <label class="right-space">{{ $t('toolbar:common.marginBottom') }}</label>
      <InputUnit
        class="text-box-input-width"
        unit="pt"
        :min="0"
        :max="maxHeight"
        :step="0.5"
        :modelValue="element.marginBottom"
        :precision="1"
        @update:modelValue="$emit('update:marginBottom', $event)"
      />
    </div>

    <span class="space" />

    <div style="display: flex; align-items: center">
      <input
        id="toolbar-mode-key-ignore-attractions"
        type="checkbox"
        :checked="element.ignoreAttractions"
        @change="
          $emit(
            'update:ignoreAttractions',
            ($event.target as HTMLInputElement).checked,
          )
        "
      />
      <label for="toolbar-mode-key-ignore-attractions">{{
        $t('toolbar:common.ignoreAttractions')
      }}</label>
    </div>

    <span class="space" />

    <div style="display: flex; align-items: center">
      <input
        id="toolbar-mode-key-show-ambitus"
        type="checkbox"
        :checked="element.showAmbitus"
        @change="
          $emit(
            'update:showAmbitus',
            ($event.target as HTMLInputElement).checked,
          )
        "
      />
      <label for="toolbar-mode-key-show-ambitus">{{
        $t('toolbar:modeKey.showAmbitus')
      }}</label>
    </div>

    <span class="space" />

    <div
      v-if="element.mode === 3 || element.mode === 7"
      style="display: flex; align-items: center"
    >
      <input
        id="toolbar-mode-key-permanent-enharmonic-zo"
        type="checkbox"
        :checked="element.permanentEnharmonicZo"
        @change="
          $emit(
            'update:permanentEnharmonicZo',
            ($event.target as HTMLInputElement).checked,
          )
        "
      />
      <label for="toolbar-mode-key-permanent-enharmonic-zo">{{
        $t('toolbar:modeKey.permanentEnharmonicZo')
      }}</label>
    </div>
    <span class="space" />

    <button @click="$emit('open-mode-key-dialog')">
      {{ $t('toolbar:modeKey.changeKey') }}
    </button>

    <span class="space" />

    <div class="form-group">
      <label class="right-space">{{ $t('toolbar:common.sectionName') }}</label>
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

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ColorPicker from '@/components/ColorPicker.vue';
import InputBpm from '@/components/InputBpm.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import { ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import { TempoSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

import ButtonWithMenu, { ButtonWithMenuOption } from './ButtonWithMenu.vue';

@Component({
  components: {
    ColorPicker,
    InputUnit,
    InputBpm,
    InputFontSize,
    InputStrokeWidth,
    ButtonWithMenu,
  },
  emits: [
    'open-mode-key-dialog',
    'update:alignment',
    'update:bpm',
    'update:color',
    'update:fontSize',
    'update:heightAdjustment',
    'update:ignoreAttractions',
    'update:marginBottom',
    'update:marginTop',
    'update:permanentEnharmonicZo',
    'update:sectionName',
    'update:showAmbitus',
    'update:strokeWidth',
    'update:tempo',
    'update:tempoAlignRight',
    'update:useDefaultStyle',
  ],
})
export default class ToolbarModeKey extends Vue {
  @Prop() element!: ModeKeyElement;
  @Prop() pageSetup!: PageSetup;
  TextBoxAlignment = TextBoxAlignment;

  get heightAdjustmentMin() {
    return -Math.round(Unit.fromPt(this.element.height));
  }

  get heightAdjustmentMax() {
    return Unit.toPt(this.pageSetup.pageHeight);
  }

  get maxHeight() {
    return Unit.toPt(this.pageSetup.innerPageHeight);
  }

  tempoMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: TempoSign.VeryQuick,
      icon: new URL('@/assets/icons/agogi-poli-gorgi.svg', import.meta.url)
        .href,
    },
    {
      neume: TempoSign.Quicker,
      icon: new URL('@/assets/icons/agogi-gorgoteri.svg', import.meta.url).href,
    },
    {
      neume: TempoSign.Quick,
      icon: new URL('@/assets/icons/agogi-gorgi.svg', import.meta.url).href,
    },
    {
      neume: TempoSign.Medium,
      icon: new URL('@/assets/icons/agogi-mesi.svg', import.meta.url).href,
    },
    {
      neume: TempoSign.Moderate,
      icon: new URL('@/assets/icons/agogi-metria.svg', import.meta.url).href,
    },
    {
      neume: TempoSign.Slow,
      icon: new URL('@/assets/icons/agogi-argi.svg', import.meta.url).href,
    },
    {
      neume: TempoSign.Slower,
      icon: new URL('@/assets/icons/agogi-argoteri.svg', import.meta.url).href,
    },
    {
      neume: TempoSign.VerySlow,
      icon: new URL('@/assets/icons/agogi-poli-argi.svg', import.meta.url).href,
    },
  ];
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mode-key-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  background-color: lightgray;

  padding: 0.25rem;

  --btn-size: 32px;
}

.neume-button {
  height: var(--btn-size);
  width: var(--btn-size);

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  user-select: none;
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

.space {
  width: 16px;
}

label.right-space {
  margin-right: 0.5rem;
}

.divider {
  height: 32px;
  border-right: 1px solid #666;
  margin: 0 0.5rem;
}

.short-input {
  width: 4rem;
}
</style>
