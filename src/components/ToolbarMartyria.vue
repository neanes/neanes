<template>
  <div class="martyria-toolbar">
    <div class="row">
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicNiLow_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicPa_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-pa.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicVou_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicGa_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicThi_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-di.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicKe_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ke.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicZo_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicNiHigh_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ni-high.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.SoftChromaticThi_Top)"
      >
        <img src="@/assets/icons/fthora-soft-chromatic-di.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.SoftChromaticPa_Top)"
      >
        <img src="@/assets/icons/fthora-soft-chromatic-ke.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.HardChromaticPa_Top)"
      >
        <img src="@/assets/icons/fthora-hard-chromatic-pa.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.HardChromaticThi_Top)"
      >
        <img src="@/assets/icons/fthora-hard-chromatic-di.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.Enharmonic_Top)"
      >
        <img src="@/assets/icons/fthora-enharmonic.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.GeneralFlat_Top)"
      >
        <img src="@/assets/icons/fthora-general-flat.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.GeneralSharp_Top)"
      >
        <img src="@/assets/icons/fthora-general-sharp.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.Zygos_Top)"
      >
        <img src="@/assets/icons/fthora-zygos.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.Kliton_Top)"
      >
        <img src="@/assets/icons/fthora-kliton.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.Spathi_Top)"
      >
        <img src="@/assets/icons/fthora-spathi.svg" />
      </button>
      <span class="space"></span>
      <div
        class="menu-container"
        @mousedown="openBarLineMenu"
        @mouseleave="selectedBarLine = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/barline-single.svg" />
        </button>
        <div class="menu" v-if="showBarLineMenu">
          <div
            class="menu-item"
            @mouseenter="selectedBarLine = MeasureBar.MeasureBarTop"
          >
            <img
              draggable="false"
              src="@/assets/icons/barline-short-single.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedBarLine = MeasureBar.MeasureBarRight"
          >
            <img draggable="false" src="@/assets/icons/barline-single.svg" />
          </div>
        </div>
      </div>
      <span class="space" />
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
            @mouseenter="selectedTempo = TempoSign.VeryQuickAbove"
          >
            <img draggable="false" src="@/assets/icons/agogi-poli-gorgi.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedTempo = TempoSign.QuickerAbove"
          >
            <img draggable="false" src="@/assets/icons/agogi-gorgoteri.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedTempo = TempoSign.QuickAbove"
          >
            <img draggable="false" src="@/assets/icons/agogi-gorgi.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedTempo = TempoSign.MediumAbove"
          >
            <img draggable="false" src="@/assets/icons/agogi-mesi.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedTempo = TempoSign.ModerateAbove"
          >
            <img draggable="false" src="@/assets/icons/agogi-metria.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedTempo = TempoSign.SlowAbove"
          >
            <img draggable="false" src="@/assets/icons/agogi-argi.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedTempo = TempoSign.SlowerAbove"
          >
            <img draggable="false" src="@/assets/icons/agogi-argoteri.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedTempo = TempoSign.VerySlowAbove"
          >
            <img draggable="false" src="@/assets/icons/agogi-poli-argi.svg" />
          </div>
        </div>
      </div>
      <span class="space"></span>
      <button
        class="icon-btn"
        :class="{ selected: element.alignRight }"
        @click="$emit('update:alignRight', !element.alignRight)"
      >
        <img
          title="Align martyria to the end of the line"
          src="@/assets/icons/alignright2.svg"
          height="24"
          width="24"
          class="icon-btn-img"
        />
      </button>
      <span class="space" />
      <div style="display: flex; align-items: center">
        <input
          id="toolbar-martyria-auto"
          type="checkbox"
          :checked="element.auto"
          @change="$emit('update:auto', $event.target.checked)"
        />
        <label for="toolbar-martyria-auto">Auto</label>
      </div>
      <template v-if="!element.auto">
        <span class="space" />
        <label class="right-space">Note</label>
        <select
          :value="element.note"
          @change="$emit('update:note', $event.target.value)"
        >
          <option v-for="note in notes" :key="note.key" :value="note.key">
            {{ note.displayName }}
          </option>
        </select>

        <span class="space" />
        <label class="right-space">Scale</label>
        <select
          :value="element.scale"
          @change="$emit('update:scale', $event.target.value)"
        >
          <option v-for="scale in scales" :key="scale.key" :value="scale.key">
            {{ scale.displayName }}
          </option>
        </select>
      </template>
    </div>
    <div class="row">
      <label class="right-space">BPM</label>
      <input
        type="number"
        min="5"
        max="999"
        step="1"
        :disabled="element.tempo == null"
        :value="element.bpm"
        @change="$emit('update:bpm', $event.target.value)"
      />

      <span class="space" />

      <label class="right-space">Space After</label>

      <InputUnit
        unit="pt"
        :min="-spaceAfterMax"
        :max="spaceAfterMax"
        :step="0.5"
        :precision="2"
        :value="element.spaceAfter"
        @input="$emit('update:spaceAfter', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaElement } from '@/models/Element';
import { Fthora, MeasureBar, Note, TempoSign } from '@/models/Neumes';
import InputUnit from './InputUnit.vue';
import { Scale } from '@/models/Scales';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

@Component({
  components: {
    InputUnit,
  },
})
export default class ToolbarMartyria extends Vue {
  @Prop() element!: MartyriaElement;
  @Prop() pageSetup!: PageSetup;
  Fthora = Fthora;
  MeasureBar = MeasureBar;
  Note = Note;
  TempoSign = TempoSign;

  showBarLineMenu: boolean = false;
  showTempoMenu: boolean = false;

  selectedBarLine: MeasureBar | null = null;
  selectedTempo: TempoSign | null = null;

  notes = Object.values(Note).map((x) => ({
    key: x,
    displayName: this.getNoteDisplayName(x),
  }));

  scales = Object.values(Scale).map((x) => ({
    key: x,
    displayName: this.getScaleDisplayName(x),
  }));

  get spaceAfterMax() {
    return Math.round(Unit.toPt(this.pageSetup.pageWidth));
  }

  private getNoteDisplayName(note: Note) {
    if (note.includes('High')) {
      return note.replace('High', ' (High)');
    } else if (note.includes('Low')) {
      return note.replace('Low', ' (Low)');
    }

    return note;
  }

  private getScaleDisplayName(scale: Scale) {
    switch (scale) {
      case Scale.SoftChromatic:
        return 'Soft Chromatic';
      case Scale.HardChromatic:
        return 'Hard Chromatic';
      case Scale.EnharmonicGa:
        return 'Enharmonic from Ga';
      case Scale.EnharmonicZoHigh:
        return 'Enharmonic from High Zo';
      case Scale.EnharmonicVou:
        return 'Enharmonic from Vou';
      case Scale.EnharmonicVouHigh:
        return 'Enharmonic from High Vou';
      default:
        return scale;
    }
  }

  openBarLineMenu() {
    this.showBarLineMenu = true;
    window.addEventListener('mouseup', this.onBarLineMouseUp);
  }

  onBarLineMouseUp() {
    if (this.selectedBarLine) {
      this.$emit('update:measureBar', this.selectedBarLine);
    }

    this.showBarLineMenu = false;

    window.removeEventListener('mouseup', this.onBarLineMouseUp);
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
.martyria-toolbar {
  background-color: lightgray;

  padding: 0.25rem;

  --btn-size: 32px;
}

label.right-space {
  margin-right: 0.5rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
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

.space {
  width: 16px;
}

.icon-btn {
  height: var(--btn-size);
  width: var(--btn-size);
  padding: 0;

  user-select: none;
}

.icon-btn.selected {
  background-color: var(--btn-color-selected);
}

.icon-btn-img {
  vertical-align: middle;
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
