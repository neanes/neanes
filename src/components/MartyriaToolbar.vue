<template>
  <div class="martyria-toolbar">
    <div class="row">
      <button class="neume-button" @click="setFthora(Fthora.DiatonicNiLow_Top)">
        <Neume class="red neume fthora" :neume="Fthora.DiatonicNiLow_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicPa_Top)">
        <Neume class="red neume fthora" :neume="Fthora.DiatonicPa_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicVou_Top)">
        <Neume class="red neume fthora" :neume="Fthora.DiatonicVou_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicGa_Top)">
        <Neume class="red neume fthora" :neume="Fthora.DiatonicGa_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicThi_Top)">
        <Neume class="red neume fthora" :neume="Fthora.DiatonicThi_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicKe_Top)">
        <Neume class="red neume fthora" :neume="Fthora.DiatonicKe_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.DiatonicZo_Top)">
        <Neume class="red neume fthora" :neume="Fthora.DiatonicZo_Top" />
      </button>
      <button
        class="neume-button"
        @click="setFthora(Fthora.DiatonicNiHigh_Top)"
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicNiHigh_Top" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setFthora(Fthora.SoftChromaticPa_Top)"
      >
        <Neume class="red neume fthora" :neume="Fthora.SoftChromaticPa_Top" />
      </button>
      <button
        class="neume-button"
        @click="setFthora(Fthora.SoftChromaticThi_Top)"
      >
        <Neume class="red neume fthora" :neume="Fthora.SoftChromaticThi_Top" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setFthora(Fthora.HardChromaticPa_Top)"
      >
        <Neume class="red neume fthora" :neume="Fthora.HardChromaticPa_Top" />
      </button>
      <button
        class="neume-button"
        @click="setFthora(Fthora.HardChromaticThi_Top)"
      >
        <Neume class="red neume fthora" :neume="Fthora.HardChromaticThi_Top" />
      </button>
      <span class="space"></span>
      <button class="neume-button" @click="setFthora(Fthora.GeneralFlat_Top)">
        <Neume class="red neume fthora" :neume="Fthora.GeneralFlat_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.GeneralSharp_Top)">
        <Neume class="red neume fthora" :neume="Fthora.GeneralSharp_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.Enharmonic_Top)">
        <Neume class="red neume fthora" :neume="Fthora.Enharmonic_Top" />
      </button>
      <span class="space"></span>
      <button class="neume-button" @click="setFthora(Fthora.Zygos_Top)">
        <Neume class="red neume fthora" :neume="Fthora.Zygos_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.Kliton_Top)">
        <Neume class="red neume fthora" :neume="Fthora.Kliton_Top" />
      </button>
      <button class="neume-button" @click="setFthora(Fthora.Spathi_Top)">
        <Neume class="red neume fthora" :neume="Fthora.Spathi_Top" />
      </button>
      <span class="space"></span>
      <div
        class="menu-container"
        @mousedown="openBarLineMenu"
        @mouseleave="selectedBarLine = null"
      >
        <button class="neume-button">
          <Neume
            class="red neume measure-bar-right"
            :neume="MeasureBar.MeasureBarRight"
          />
        </button>
        <div class="menu" v-if="showBarLineMenu">
          <div
            class="menu-item"
            v-for="menuItem in barLineMenuItems"
            :key="menuItem.neume"
            @mouseenter="selectedBarLine = menuItem.neume"
          >
            <Neume
              class="red neume"
              :class="menuItem.className"
              :neume="menuItem.neume"
            />
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

interface BarLineMenuItem {
  neume: MeasureBar;
  className: string;
}

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

  barLineMenuItems: BarLineMenuItem[] = [
    {
      neume: MeasureBar.MeasureBarTop,
      className: 'measure-bar-top',
    },
    {
      neume: MeasureBar.MeasureBarRight,
      className: 'measure-bar-right',
    },
  ];

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

.red {
  color: red;
}

.neume {
  font-size: 25px;
}

.neume-button {
  height: var(--btn-size);
  width: var(--btn-size);

  position: relative;

  overflow: hidden;

  user-select: none;
}

.space {
  width: 16px;
}

.fthora {
  left: 18px;
}

.measure-bar-right {
  top: -10px;
}

.measure-bar-top {
  top: -5px;
  left: 17px;
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
