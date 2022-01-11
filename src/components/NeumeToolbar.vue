<template>
  <div class="neume-toolbar">
    <div class="row">
      <button
        class="neume-button"
        @click="setTimeNeume([TimeNeume.Klasma_Top, TimeNeume.Klasma_Bottom])"
      >
        <Neume class="neume klasma-top" :neume="TimeNeume.Klasma_Top" />
      </button>
      <div
        class="menu-container"
        @mousedown="openTimeMenu"
        @mouseleave="selectedTimeNeume = null"
      >
        <button class="neume-button">
          <Neume class="neume hapli" :neume="TimeNeume.Hapli" />
        </button>
        <div class="menu" v-if="showTimeMenu">
          <div
            class="menu-item"
            v-for="menuItem in timeMenuItems"
            :key="menuItem.neumes[0]"
            @mouseenter="selectedTimeNeume = menuItem.neumes"
          >
            <Neume
              class="neume"
              :class="menuItem.className"
              :neume="menuItem.neumes[0]"
            />
          </div>
        </div>
      </div>
      <span class="space"></span>
      <div
        class="menu-container"
        @mousedown="openGorgonMenu"
        @mouseleave="selectedGorgon = null"
      >
        <button class="neume-button">
          <Neume class="red neume gorgon-top" :neume="GorgonNeume.Gorgon_Top" />
        </button>
        <div class="menu" v-if="showGorgonMenu">
          <div
            class="menu-item"
            v-for="menuItem in gorgonMenuItems"
            :key="menuItem.neumes[0]"
            @mouseenter="selectedGorgon = menuItem.neumes"
          >
            <Neume
              class="red neume"
              :class="menuItem.className"
              :neume="menuItem.neumes[0]"
            />
          </div>
        </div>
      </div>
      <div
        class="menu-container"
        @mousedown="openDigorgonMenu"
        @mouseleave="selectedGorgon = null"
      >
        <button class="neume-button">
          <Neume class="red neume digorgon" :neume="GorgonNeume.Digorgon" />
        </button>
        <div class="menu" v-if="showDigorgonMenu">
          <div
            class="menu-item"
            v-for="menuItem in digorgonMenuItems"
            :key="menuItem.neumes[0]"
            @mouseenter="selectedGorgon = menuItem.neumes"
          >
            <Neume
              class="red neume"
              :class="menuItem.className"
              :neume="menuItem.neumes[0]"
            />
          </div>
        </div>
      </div>
      <div
        class="menu-container"
        @mousedown="openTrigorgonMenu"
        @mouseleave="selectedGorgon = null"
      >
        <button class="neume-button">
          <Neume class="red neume trigorgon" :neume="GorgonNeume.Trigorgon" />
        </button>
        <div class="menu" v-if="showTrigorgonMenu">
          <div
            class="menu-item"
            v-for="menuItem in trigorgonMenuItems"
            :key="menuItem.neumes[0]"
            @mouseenter="selectedGorgon = menuItem.neumes"
          >
            <Neume
              class="red neume"
              :class="menuItem.className"
              :neume="menuItem.neumes[0]"
            />
          </div>
        </div>
      </div>

      <span class="space"></span>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Vareia)"
      >
        <Neume class="neume vareia" :neume="VocalExpressionNeume.Vareia" />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Homalon)"
      >
        <Neume
          class="neume homalon"
          :neume="VocalExpressionNeume.Homalon"
        /><span class="homalon-1">1</span>
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.HomalonConnecting)"
      >
        <Neume
          class="neume homalon"
          :neume="VocalExpressionNeume.Homalon"
        /><span class="homalon-2">2</span>
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Antikenoma)"
      >
        <Neume
          class="neume antikenoma"
          :neume="VocalExpressionNeume.Antikenoma"
        />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Psifiston)"
      >
        <Neume
          class="neume psifiston"
          :neume="VocalExpressionNeume.Psifiston"
        />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Heteron)"
      >
        <Neume
          class="red neume heteron"
          :neume="VocalExpressionNeume.Heteron"
        />
      </button>
      <span class="space"></span>
      <div
        class="menu-container"
        @mousedown="openFlatMenu"
        @mouseleave="selectedFlat = null"
      >
        <button class="neume-button">
          <Neume class="red neume flat" :neume="Accidental.Flat_2_Right" />
        </button>
        <div class="menu" v-if="showFlatMenu">
          <div
            class="menu-item"
            v-for="menuItem in flatMenuItems"
            :key="menuItem"
            @mouseenter="selectedFlat = menuItem"
          >
            <Neume class="red neume flat" :neume="menuItem" />
          </div>
        </div>
      </div>
      <div
        class="menu-container"
        @mousedown="openSharpMenu"
        @mouseleave="selectedSharp = null"
      >
        <button class="neume-button">
          <Neume class="red neume sharp" :neume="Accidental.Sharp_2_Left" />
        </button>
        <div class="menu" v-if="showSharpMenu">
          <div
            class="menu-item"
            v-for="menuItem in sharpMenuItems"
            :key="menuItem"
            @mouseenter="selectedSharp = menuItem"
          >
            <Neume class="red neume sharp" :neume="menuItem" />
          </div>
        </div>
      </div>
      <span class="space"></span>
      <button class="neume-button" @click="setGorgonNeume([GorgonNeume.Argon])">
        <Neume class="red neume argon" :neume="GorgonNeume.Argon" />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume([GorgonNeume.Hemiolion])"
      >
        <Neume class="red neume hemiolion" :neume="GorgonNeume.Hemiolion" />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume([GorgonNeume.Diargon])"
      >
        <Neume class="red neume diargon" :neume="GorgonNeume.Diargon" />
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
      <div
        class="menu-container"
        @mousedown="openMeasureNumberMenu"
        @mouseleave="selectedMeasureNumber = null"
      >
        <button class="neume-button">
          <Neume class="neume measure-number" :neume="MeasureNumber.Two" />
        </button>
        <div class="menu" v-if="showMeasureNumberMenu">
          <div
            class="menu-item"
            v-for="menuItem in measureNumberMenuItems"
            :key="menuItem.neume"
            @mouseenter="selectedMeasureNumber = menuItem.neume"
          >
            <Neume
              class="neume"
              :class="menuItem.className"
              :neume="menuItem.neume"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicNiLow_TopCenter,
            Fthora.DiatonicNiLow_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.DiatonicNiLow_TopCenter"
        />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicPa_TopCenter,
            Fthora.DiatonicPa_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicPa_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.DiatonicVou_TopCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicVou_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.DiatonicGa_TopCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicGa_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicThi_TopCenter,
            Fthora.DiatonicThi_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicThi_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicKe_TopCenter,
            Fthora.DiatonicKe_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicKe_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.DiatonicZo_TopCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.DiatonicZo_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.DiatonicNiHigh_TopCenter,
            Fthora.DiatonicNiHigh_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.DiatonicNiHigh_TopCenter"
        />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.SoftChromaticPa_TopCenter,
            Fthora.SoftChromaticPa_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.SoftChromaticPa_TopCenter"
        />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.SoftChromaticThi_TopCenter,
            Fthora.SoftChromaticThi_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.SoftChromaticThi_TopCenter"
        />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.HardChromaticPa_TopCenter,
            Fthora.HardChromaticPa_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.HardChromaticPa_TopCenter"
        />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.HardChromaticThi_TopCenter,
            Fthora.HardChromaticThi_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.HardChromaticThi_TopCenter"
        />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.GeneralFlat_TopCenter,
            Fthora.GeneralFlat_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.GeneralFlat_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.GeneralSharp_TopCenter,
            Fthora.GeneralSharp_BottomCenter,
          ])
        "
      >
        <Neume
          class="red neume fthora"
          :neume="Fthora.GeneralSharp_TopCenter"
        />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
            Fthora.Enharmonic_TopCenter,
            Fthora.Enharmonic_BottomCenter,
          ])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.Enharmonic_TopCenter" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setFthora([Fthora.Zygos_TopCenter, Fthora.Zygos_BottomCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.Zygos_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([Fthora.Kliton_TopCenter, Fthora.Kliton_BottomCenter])
        "
      >
        <Neume class="red neume fthora" :neume="Fthora.Kliton_TopCenter" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.Spathi_TopCenter])"
      >
        <Neume class="red neume fthora" :neume="Fthora.Spathi_TopCenter" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  MeasureBar,
  MeasureNumber,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import Neume from './Neume.vue';
import {
  areFthorasEquivalent,
  areGorgonsEquivalent,
  areTimeNeumesEquivalent,
  areVocalExpressionsEquivalent,
  onlyTakesTopKlasma,
  onlyTakesBottomKlasma,
  onlyTakesTopGorgon,
} from '@/models/NeumeReplacements';

interface GorgonMenuItem {
  neumes: GorgonNeume[];
  className: string;
}

interface TimeMenuItem {
  neumes: TimeNeume[];
  className: string;
}

interface BarLineMenuItem {
  neume: MeasureBar;
  className: string;
}

interface MeasureNumberMenuItem {
  neume: MeasureNumber;
  className: string;
}

@Component({
  components: {
    Neume,
  },
})
export default class NeumeToolbar extends Vue {
  @Prop() element!: NoteElement;
  Accidental = Accidental;
  VocalExpressionNeume = VocalExpressionNeume;
  TimeNeume = TimeNeume;
  GorgonNeume = GorgonNeume;
  Fthora = Fthora;
  MeasureBar = MeasureBar;
  MeasureNumber = MeasureNumber;

  showFlatMenu: boolean = false;
  showSharpMenu: boolean = false;
  showGorgonMenu: boolean = false;
  showDigorgonMenu: boolean = false;
  showTrigorgonMenu: boolean = false;
  showTimeMenu: boolean = false;
  showBarLineMenu: boolean = false;
  showMeasureNumberMenu: boolean = false;

  selectedFlat: Accidental | null = null;
  selectedSharp: Accidental | null = null;
  selectedGorgon: GorgonNeume[] | null = null;
  selectedTimeNeume: TimeNeume[] | null = null;
  selectedBarLine: MeasureBar | null = null;
  selectedMeasureNumber: MeasureNumber | null = null;

  flatMenuItems: Accidental[] = [
    Accidental.Flat_6_Right,
    Accidental.Flat_4_Right,
    Accidental.Flat_2_Right,
  ];

  sharpMenuItems: Accidental[] = [
    Accidental.Sharp_6_Left,
    Accidental.Sharp_4_Left,
    Accidental.Sharp_2_Left,
  ];

  measureNumberMenuItems: MeasureNumberMenuItem[] = [
    { neume: MeasureNumber.Eight, className: 'measure-number-center' },
    { neume: MeasureNumber.Seven, className: 'measure-number-center' },
    { neume: MeasureNumber.Six, className: 'measure-number-center' },
    { neume: MeasureNumber.Five, className: 'measure-number' },
    { neume: MeasureNumber.Four, className: 'measure-number' },
    { neume: MeasureNumber.Three, className: 'measure-number' },
    { neume: MeasureNumber.Two, className: 'measure-number' },
  ];

  gorgonMenuItems: GorgonMenuItem[] = [
    {
      neumes: [GorgonNeume.GorgonDottedLeft_Right],
      className: 'gorgon-dotted-left',
    },
    {
      neumes: [GorgonNeume.GorgonDottedRight_Right],
      className: 'gorgon-dotted-right',
    },
    {
      neumes: [GorgonNeume.Gorgon_Top, GorgonNeume.Gorgon_Bottom],
      className: 'gorgon-top',
    },
  ];

  digorgonMenuItems: GorgonMenuItem[] = [
    {
      neumes: [GorgonNeume.DigorgonDottedRight],
      className: 'digorgon',
    },
    {
      neumes: [GorgonNeume.DigorgonDottedLeft2],
      className: 'digorgon',
    },
    {
      neumes: [GorgonNeume.DigorgonDottedLeft1],
      className: 'digorgon',
    },
    {
      neumes: [GorgonNeume.Digorgon],
      className: 'digorgon',
    },
  ];

  trigorgonMenuItems: GorgonMenuItem[] = [
    {
      neumes: [GorgonNeume.TrigorgonDottedRight],
      className: 'trigorgon',
    },
    {
      neumes: [GorgonNeume.TrigorgonDottedLeft2],
      className: 'trigorgon',
    },
    {
      neumes: [GorgonNeume.TrigorgonDottedLeft1],
      className: 'trigorgon',
    },
    {
      neumes: [GorgonNeume.Trigorgon],
      className: 'trigorgon',
    },
  ];

  timeMenuItems: TimeMenuItem[] = [
    {
      neumes: [TimeNeume.Tripli],
      className: 'tripli',
    },
    {
      neumes: [TimeNeume.Dipli],
      className: 'dipli',
    },
    {
      neumes: [TimeNeume.Hapli],
      className: 'hapli',
    },
  ];

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

  beforeDestroy() {
    window.removeEventListener('mouseup', this.onFlatMouseUp);
    window.removeEventListener('mouseup', this.onSharpMouseUp);
    window.removeEventListener('mouseup', this.onGorgonMouseUp);
    window.removeEventListener('mouseup', this.onDigorgonMouseUp);
    window.removeEventListener('mouseup', this.onTrigorgonMouseUp);
    window.removeEventListener('mouseup', this.onTimeMouseUp);
    window.removeEventListener('mouseup', this.onBarLineMouseUp);
  }

  private setAccidental(neume: Accidental) {
    if (this.element.accidental != null && this.element.accidental === neume) {
      this.$emit('update:accidental', null);
    } else {
      this.$emit('update:accidental', neume);
    }
  }

  private setTimeNeume(neumes: TimeNeume[]) {
    let equivalent = false;

    for (let neume of neumes) {
      if (
        neume === TimeNeume.Klasma_Top &&
        onlyTakesBottomKlasma(this.element.quantitativeNeume)
      ) {
        continue;
      }

      if (
        neume === TimeNeume.Klasma_Bottom &&
        onlyTakesTopKlasma(this.element.quantitativeNeume)
      ) {
        continue;
      }

      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        this.$emit('update:time', neume);
        return;
      }

      equivalent =
        this.element.timeNeume != null &&
        areTimeNeumesEquivalent(neume, this.element.timeNeume);
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // time neumes. Otherwise set time neume to the first neume
    // in the cycle.
    if (equivalent) {
      this.$emit('update:time', null);
    } else {
      this.$emit('update:time', neumes[0]);
    }
  }

  private setGorgonNeume(neumes: GorgonNeume[]) {
    let equivalent = false;

    for (let neume of neumes) {
      if (
        neume === GorgonNeume.Gorgon_Bottom &&
        onlyTakesTopGorgon(this.element.quantitativeNeume)
      ) {
        continue;
      }

      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        this.$emit('update:gorgon', neume);
        return;
      }

      equivalent =
        this.element.gorgonNeume != null &&
        areGorgonsEquivalent(neume, this.element.gorgonNeume);
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // gorgon neumes. Otherwise set gorgon to the first neume
    // in the cycle.
    if (equivalent) {
      this.$emit('update:gorgon', null);
    } else {
      this.$emit('update:gorgon', neumes[0]);
    }
  }

  private setVocalExpression(neume: VocalExpressionNeume) {
    if (
      this.element.vocalExpressionNeume != null &&
      areVocalExpressionsEquivalent(neume, this.element.vocalExpressionNeume)
    ) {
      this.$emit('update:expression', null);
    } else {
      this.$emit('update:expression', neume);
    }
  }

  private setMeasureBar(neume: MeasureBar) {
    if (neume === this.element.measureBar) {
      this.$emit('update:measureBar', null);
    } else {
      this.$emit('update:measureBar', neume);
    }
  }

  private setMeasureNumber(neume: MeasureNumber) {
    if (neume === this.element.measureNumber) {
      this.$emit('update:measureNumber', null);
    } else {
      this.$emit('update:measureNumber', neume);
    }
  }

  private setFthora(neumes: Fthora[]) {
    let equivalent = false;

    for (let neume of neumes) {
      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        this.$emit('update:fthora', neume);
        return;
      }

      equivalent =
        this.element.fthora != null &&
        areFthorasEquivalent(neume, this.element.fthora);
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // fthora neumes. Otherwise set fthora to the first neume
    // in the cycle.
    if (equivalent) {
      this.$emit('update:fthora', null);
    } else {
      this.$emit('update:fthora', neumes[0]);
    }
  }

  openFlatMenu() {
    this.showFlatMenu = true;
    window.addEventListener('mouseup', this.onFlatMouseUp);
  }

  onFlatMouseUp() {
    if (this.selectedFlat) {
      this.setAccidental(this.selectedFlat);
    }

    this.showFlatMenu = false;

    window.removeEventListener('mouseup', this.onFlatMouseUp);
  }

  openSharpMenu() {
    this.showSharpMenu = true;
    window.addEventListener('mouseup', this.onSharpMouseUp);
  }

  onSharpMouseUp() {
    if (this.selectedSharp) {
      this.setAccidental(this.selectedSharp);
    }

    this.showSharpMenu = false;

    window.removeEventListener('mouseup', this.onSharpMouseUp);
  }

  openGorgonMenu() {
    this.showGorgonMenu = true;
    window.addEventListener('mouseup', this.onGorgonMouseUp);
  }

  onGorgonMouseUp() {
    if (this.selectedGorgon) {
      this.setGorgonNeume(this.selectedGorgon);
    }

    this.showGorgonMenu = false;

    window.removeEventListener('mouseup', this.onGorgonMouseUp);
  }

  openDigorgonMenu() {
    this.showDigorgonMenu = true;
    window.addEventListener('mouseup', this.onDigorgonMouseUp);
  }

  onDigorgonMouseUp() {
    if (this.selectedGorgon) {
      this.setGorgonNeume(this.selectedGorgon);
    }

    this.showDigorgonMenu = false;

    window.removeEventListener('mouseup', this.onDigorgonMouseUp);
  }

  openTrigorgonMenu() {
    this.showTrigorgonMenu = true;
    window.addEventListener('mouseup', this.onTrigorgonMouseUp);
  }

  onTrigorgonMouseUp() {
    if (this.selectedGorgon) {
      this.setGorgonNeume(this.selectedGorgon);
    }

    this.showTrigorgonMenu = false;

    window.removeEventListener('mouseup', this.onTrigorgonMouseUp);
  }

  openTimeMenu() {
    this.showTimeMenu = true;
    window.addEventListener('mouseup', this.onTimeMouseUp);
  }

  onTimeMouseUp() {
    if (this.selectedTimeNeume) {
      this.setTimeNeume(this.selectedTimeNeume);
    }

    this.showTimeMenu = false;

    window.removeEventListener('mouseup', this.onTimeMouseUp);
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

  openMeasureNumberMenu() {
    this.showMeasureNumberMenu = true;
    window.addEventListener('mouseup', this.onMeasureNumberMouseUp);
  }

  onMeasureNumberMouseUp() {
    if (this.selectedMeasureNumber) {
      this.setMeasureNumber(this.selectedMeasureNumber);
    }

    this.showMeasureNumberMenu = false;

    window.removeEventListener('mouseup', this.onMeasureNumberMouseUp);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume-toolbar {
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
}

.space {
  width: 16px;
}

.sharp {
  top: -23px;
  left: 24px;
}

.flat {
  top: 2px;
  left: 2px;
}

.vareia {
  top: -10px;
}

.homalon {
  top: -15px;
  left: 10px;
  font-size: 22px;
}

.homalon-1,
.homalon-2 {
  position: absolute;
  top: 17px;
  left: 10px;
  font-size: 12px;
}

.antikenoma {
  top: -12px;
  left: 14px;
  font-size: 20px;
}

.psifiston {
  top: -10px;
  left: 13px;
  font-size: 18px;
}

.heteron {
  top: -15px;
  left: 35px;
  font-size: 20px;
}

.klasma-top {
  top: -2px;
  left: 18px;
}

.hapli {
  top: -19px;
  left: 19px;
}

.dipli {
  top: -19px;
  left: 16px;
}

.tripli {
  top: -22px;
  left: 18px;
}

.gorgon-top {
  top: -2px;
  left: 18px;
}

.gorgon-dotted-left {
  top: -2px;
  left: 11px;
}

.gorgon-dotted-right {
  top: -4px;
  left: 10px;
}

.digorgon {
  left: 13px;
}

.trigorgon {
  left: 10px;
}

.fthora {
  left: 18px;
}

.argon,
.hemiolion,
.diargon {
  left: 20px;
}

.measure-bar-right {
  top: -10px;
}

.measure-bar-top {
  top: -5px;
  left: 17px;
}

.measure-number {
  top: -7px;
  left: 28px;
}

.measure-number-center {
  top: -7px;
  left: 16px;
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
