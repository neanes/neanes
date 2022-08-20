<template>
  <div class="martyria-toolbar">
    <div class="row">
      <button class="neume-button" @click="setFthora(Fthora.DiatonicNiLow_Top)">
        <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicPa_Top)">
        <img src="@/assets/icons/fthora-diatonic-pa.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicVou_Top)">
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicGa_Top)">
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicThi_Top)">
        <img src="@/assets/icons/fthora-diatonic-di.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicKe_Top)">
        <img src="@/assets/icons/fthora-diatonic-ke.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicZo_Top)">
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        @click="setFthora(Fthora.DiatonicNiHigh_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ni-high.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setFthora(Fthora.SoftChromaticThi_Top)"
      >
        <img src="@/assets/icons/fthora-soft-chromatic-di.svg" />
      </button>
      <button
        class="neume-button"
        @click="setFthora(Fthora.SoftChromaticPa_Top)"
      >
        <img src="@/assets/icons/fthora-soft-chromatic-ke.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setFthora(Fthora.HardChromaticPa_Top)"
      >
        <img src="@/assets/icons/fthora-hard-chromatic-pa.svg" />
      </button>
      <button
        class="neume-button"
        @click="setFthora(Fthora.HardChromaticThi_Top)"
      >
        <img src="@/assets/icons/fthora-hard-chromatic-di.svg" />
      </button>
      <span class="space"></span>
      <button class="neume-button" @click="setFthora(Fthora.Enharmonic_Top)">
        <img src="@/assets/icons/fthora-enharmonic.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.GeneralFlat_Top)">
        <img src="@/assets/icons/fthora-general-flat.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.GeneralSharp_Top)">
        <img src="@/assets/icons/fthora-general-sharp.svg" />
      </button>
      <span class="space"></span>
      <button class="neume-button" @click="setFthora(Fthora.Zygos_Top)">
        <img src="@/assets/icons/fthora-zygos.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.Kliton_Top)">
        <img src="@/assets/icons/fthora-kliton.svg" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.Spathi_Top)">
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
          type="checkbox"
          :checked="element.auto"
          @change="$emit('update:auto', $event.target.checked)"
        />
        <label>Auto</label>
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
      <label class="right-space">Space After</label>

      <InputUnit
        unit="pt"
        :min="0"
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
import { Fthora, MeasureBar, Note } from '@/models/Neumes';
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

  showBarLineMenu: boolean = false;

  selectedBarLine: MeasureBar | null = null;

  notes = Object.values(Note).map((x) => ({
    key: x,
    displayName: this.getNoteDisplayName(x),
  }));

  scales = Object.values(Scale).map((x) => ({
    key: x,
    displayName: this.getScaleDisplayName(x),
  }));

  get spaceAfterMax() {
    return Unit.toPt(this.pageSetup.pageWidth);
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

  private setFthora(neume: Fthora) {
    if (this.element.fthora === neume) {
      this.$emit('update:fthora', null);
    } else {
      this.$emit('update:fthora', neume);
    }
  }

  private setMeasureBar(neume: MeasureBar) {
    // Cycle through
    // Left
    // Right
    // Both Sides
    // None
    if (
      neume === this.element.measureBarLeft &&
      neume === this.element.measureBarRight
    ) {
      this.$emit('update:measureBar', {
        measureBarLeft: null,
        measureBarRight: null,
      });
    } else if (neume === this.element.measureBarLeft) {
      this.$emit('update:measureBar', {
        measureBarLeft: null,
        measureBarRight: neume,
      });
    } else if (neume === this.element.measureBarRight) {
      this.$emit('update:measureBar', {
        measureBarLeft: neume,
        measureBarRight: neume,
      });
    } else {
      this.$emit('update:measureBar', {
        measureBarLeft: neume,
        measureBarRight: null,
      });
    }
  }

  openBarLineMenu() {
    this.showBarLineMenu = true;
    window.addEventListener('mouseup', this.onBarLineMouseUp);
  }

  onBarLineMouseUp() {
    if (this.selectedBarLine) {
      this.setMeasureBar(this.selectedBarLine);
    }

    this.showBarLineMenu = false;

    window.removeEventListener('mouseup', this.onBarLineMouseUp);
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
