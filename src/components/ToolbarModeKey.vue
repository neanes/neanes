<template>
  <div class="mode-key-toolbar">
    <input
      id="toolbar-mode-key-use-default-style"
      type="checkbox"
      :checked="element.useDefaultStyle"
      @change="$emit('update:useDefaultStyle', $event.target.checked)"
    />
    <label for="toolbar-mode-key-use-default-style">Use default style</label>
    <span class="divider" />

    <template v-if="!element.useDefaultStyle">
      <label class="right-space">Size</label>
      <InputFontSize
        class="drop-caps-input"
        :value="element.fontSize"
        @input="$emit('update:fontSize', $event)"
      />
      <span class="space"></span>
      <ColorPicker
        :value="element.color"
        @input="$emit('update:color', $event)"
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
        title="Align Left"
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
        title="Align Center"
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
        title="Align Right"
      />
    </button>
    <span class="space" />
    <template v-if="!element.useDefaultStyle">
      <label class="right-space">Outline</label>
      <InputStrokeWidth
        :value="element.strokeWidth"
        @input="$emit('update:strokeWidth', $event)"
      />
      <span class="space" />

      <label class="right-space">Height Adjustment</label>

      <InputUnit
        class="short-input"
        unit="pt"
        :min="heightAdjustmentMin"
        :max="heightAdjustmentMax"
        :step="0.5"
        :precision="2"
        :value="element.heightAdjustment"
        @input="$emit('update:heightAdjustment', $event)"
      />
      <span class="space" />
    </template>

    <div
      class="menu-container"
      @mousedown="openTempoMenu"
      @mouseleave="selectedTempo = null"
    >
      <button class="neume-button">
        <img draggable="false" src="@/assets/icons/agogi-poli-argi.svg" />
      </button>
      <div class="menu" v-if="showTempoMenu">
        <div
          class="menu-item"
          @mouseenter="selectedTempo = TempoSign.VeryQuick"
        >
          <img draggable="false" src="@/assets/icons/agogi-poli-gorgi.svg" />
        </div>
        <div class="menu-item" @mouseenter="selectedTempo = TempoSign.Quicker">
          <img draggable="false" src="@/assets/icons/agogi-gorgoteri.svg" />
        </div>
        <div class="menu-item" @mouseenter="selectedTempo = TempoSign.Quick">
          <img draggable="false" src="@/assets/icons/agogi-gorgi.svg" />
        </div>
        <div class="menu-item" @mouseenter="selectedTempo = TempoSign.Medium">
          <img draggable="false" src="@/assets/icons/agogi-mesi.svg" />
        </div>
        <div class="menu-item" @mouseenter="selectedTempo = TempoSign.Moderate">
          <img draggable="false" src="@/assets/icons/agogi-metria.svg" />
        </div>
        <div class="menu-item" @mouseenter="selectedTempo = TempoSign.Slow">
          <img draggable="false" src="@/assets/icons/agogi-argi.svg" />
        </div>
        <div class="menu-item" @mouseenter="selectedTempo = TempoSign.Slower">
          <img draggable="false" src="@/assets/icons/agogi-argoteri.svg" />
        </div>
        <div class="menu-item" @mouseenter="selectedTempo = TempoSign.VerySlow">
          <img draggable="false" src="@/assets/icons/agogi-poli-argi.svg" />
        </div>
      </div>
    </div>
    <span class="space" />

    <button
      class="icon-btn"
      :class="{ selected: element.tempoAlignRight }"
      @click="$emit('update:tempoAlignRight', !element.tempoAlignRight)"
    >
      <img
        title="Right-align tempo"
        src="@/assets/icons/alignright2.svg"
        height="24"
        width="24"
        class="icon-btn-img"
      />
    </button>

    <span class="space" />

    <label class="right-space">BPM</label>
    <input
      type="number"
      min="5"
      max="999"
      step="1"
      :value="element.bpm"
      @change="$emit('update:bpm', $event.target.value)"
    />

    <span class="space" />

    <div style="display: flex; align-items: center">
      <input
        id="toolbar-mode-key-ignore-attractions"
        type="checkbox"
        :checked="element.ignoreAttractions"
        @change="$emit('update:ignoreAttractions', $event.target.checked)"
      />
      <label for="toolbar-mode-key-ignore-attractions"
        >Ignore Attractions</label
      >
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
        @change="$emit('update:permanentEnharmonicZo', $event.target.checked)"
      />
      <label for="toolbar-mode-key-permanent-enharmonic-zo"
        >Permanent Enharmonic Zo</label
      >
    </div>
    <span class="space" />

    <button @click="$emit('open-mode-key-dialog')">Change Key</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { TextBoxAlignment, ModeKeyElement } from '@/models/Element';
import { Unit } from '@/utils/Unit';
import ColorPicker from '@/components/ColorPicker.vue';
import InputUnit from '@/components/InputUnit.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import { PageSetup } from '@/models/PageSetup';
import { TempoSign } from '@/models/Neumes';

@Component({
  components: { ColorPicker, InputUnit, InputFontSize, InputStrokeWidth },
})
export default class ToolbarModeKey extends Vue {
  @Prop() element!: ModeKeyElement;
  @Prop() pageSetup!: PageSetup;
  TextBoxAlignment = TextBoxAlignment;
  TempoSign = TempoSign;

  showTempoMenu: boolean = false;
  selectedTempo: TempoSign | null = null;

  private get heightAdjustmentMin() {
    return -Math.round(Unit.fromPt(this.element.height));
  }

  private get heightAdjustmentMax() {
    return Unit.toPt(this.pageSetup.pageHeight);
  }

  openTempoMenu() {
    this.showTempoMenu = true;
    window.addEventListener('mouseup', this.onTempoMouseUp);
  }

  onTempoMouseUp() {
    if (this.selectedTempo) {
      this.$emit('update:tempo', this.selectedTempo);
    }

    this.showTempoMenu = false;

    window.removeEventListener('mouseup', this.onTempoMouseUp);
  }
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
.menu-container {
  display: flex;
  position: relative;
  height: var(--btn-size);
}

.menu {
  position: absolute;
  z-index: 999;
  background-color: white;
  border: 1px solid black;
  box-sizing: border-box;
  width: var(--btn-size);
  bottom: 0;
}

.menu-item {
  height: var(--btn-size);
  width: 100%;
  padding: 3px 0;
  box-sizing: border-box;
  text-align: center;
  user-select: none;
  overflow: hidden;
  position: relative;
}

.menu-item:hover {
  background-color: aliceblue;
}
</style>
