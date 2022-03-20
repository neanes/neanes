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
          src="@/assets/alignright2.svg"
          height="24"
          width="24"
          class="icon-btn-img"
        />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaElement } from '@/models/Element';
import { Fthora, MeasureBar } from '@/models/Neumes';
import Neume from './Neume.vue';

@Component({
  components: {
    Neume,
  },
})
export default class MartyriaToolbar extends Vue {
  @Prop() element!: MartyriaElement;
  Fthora = Fthora;
  MeasureBar = MeasureBar;

  showBarLineMenu: boolean = false;

  selectedBarLine: MeasureBar | null = null;

  private setFthora(neume: Fthora) {
    if (this.element.fthora === neume) {
      this.$emit('update:fthora', null);
    } else {
      this.$emit('update:fthora', neume);
    }
  }

  private setMeasureBar(neume: MeasureBar) {
    if (neume === this.element.measureBar) {
      this.$emit('update:measureBar', null);
    } else {
      this.$emit('update:measureBar', neume);
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

.row {
  display: flex;
  flex-wrap: wrap;
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
