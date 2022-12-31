<template>
  <div class="neume-toolbar">
    <div class="row">
      <button class="neume-button" @click="$emit('update:klasma')">
        <img src="@/assets/icons/time-klasma.svg" />
      </button>
      <div
        class="menu-container"
        @mousedown="openTimeMenu"
        @mouseleave="selectedTimeNeume = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/time-apli.svg" />
        </button>
        <div class="menu" v-if="showTimeMenu">
          <div
            class="menu-item"
            @mouseenter="selectedTimeNeume = TimeNeume.Tripli"
          >
            <img draggable="false" src="@/assets/icons/time-tripli.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedTimeNeume = TimeNeume.Dipli"
          >
            <img draggable="false" src="@/assets/icons/time-dipli.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedTimeNeume = TimeNeume.Hapli"
          >
            <img draggable="false" src="@/assets/icons/time-apli.svg" />
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
          <img draggable="false" src="@/assets/icons/time-gorgon.svg" />
        </button>
        <div class="menu" v-if="showGorgonMenu">
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.GorgonDottedRight]"
          >
            <img
              draggable="false"
              src="@/assets/icons/time-gorgon-dotted-right.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.GorgonDottedLeft]"
          >
            <img
              draggable="false"
              src="@/assets/icons/time-gorgon-dotted-left.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="
              selectedGorgon = [
                GorgonNeume.Gorgon_Top,
                GorgonNeume.Gorgon_Bottom,
              ]
            "
          >
            <img draggable="false" src="@/assets/icons/time-gorgon.svg" />
          </div>
        </div>
      </div>
      <div
        class="menu-container"
        @mousedown="openDigorgonMenu"
        @mouseleave="selectedGorgon = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/time-digorgon.svg" />
        </button>
        <div class="menu" v-if="showDigorgonMenu">
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.DigorgonDottedRight]"
          >
            <img
              draggable="false"
              src="@/assets/icons/time-digorgon-dotted-right.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.DigorgonDottedLeft2]"
          >
            <img
              draggable="false"
              src="@/assets/icons/time-digorgon-dotted-left-above.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.DigorgonDottedLeft1]"
          >
            <img
              draggable="false"
              src="@/assets/icons/time-digorgon-dotted-left-below.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.Digorgon]"
          >
            <img draggable="false" src="@/assets/icons/time-digorgon.svg" />
          </div>
        </div>
      </div>
      <div
        class="menu-container"
        @mousedown="openTrigorgonMenu"
        @mouseleave="selectedGorgon = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/time-trigorgon.svg" />
        </button>
        <div class="menu" v-if="showTrigorgonMenu">
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.TrigorgonDottedRight]"
          >
            <img
              draggable="false"
              src="@/assets/icons/time-trigorgon-dotted-right.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.TrigorgonDottedLeft2]"
          >
            <img
              draggable="false"
              src="@/assets/icons/time-trigorgon-dotted-left-above.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.TrigorgonDottedLeft1]"
          >
            <img
              draggable="false"
              src="@/assets/icons/time-trigorgon-dotted-left-below.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedGorgon = [GorgonNeume.Trigorgon]"
          >
            <img draggable="false" src="@/assets/icons/time-trigorgon.svg" />
          </div>
        </div>
      </div>

      <span class="space"></span>
      <button
        class="neume-button"
        @click="$emit('update:vareia', !element.vareia)"
      >
        <img src="@/assets/icons/quality-vareia.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:expression', VocalExpressionNeume.Homalon)"
      >
        <img src="@/assets/icons/quality-omalon.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:expression', VocalExpressionNeume.HomalonConnecting)
        "
      >
        <img src="@/assets/icons/quality-omalon-connecting.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:expression', VocalExpressionNeume.Antikenoma)"
      >
        <img src="@/assets/icons/quality-antikenoma.svg" />
      </button>
      <div
        class="menu-container"
        @mousedown="openPsifistonMenu"
        @mouseleave="selectedPsifiston = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/quality-psifiston.svg" />
        </button>
        <div class="menu" v-if="showPsifistonMenu">
          <div
            class="menu-item"
            @mouseenter="
              selectedPsifiston = VocalExpressionNeume.PsifistonSlanted
            "
          >
            <img
              draggable="false"
              src="@/assets/icons/quality-psifiston-slanted.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedPsifiston = VocalExpressionNeume.Psifiston"
          >
            <img draggable="false" src="@/assets/icons/quality-psifiston.svg" />
          </div>
        </div>
      </div>
      <button
        class="neume-button"
        @click="$emit('update:expression', VocalExpressionNeume.Heteron)"
      >
        <img src="@/assets/icons/quality-heteron.svg" />
      </button>
      <div
        class="menu-container"
        @mousedown="openHeteronConnectingMenu"
        @mouseleave="selectedHeteronConnecting = null"
      >
        <button class="neume-button">
          <img src="@/assets/icons/quality-heteron-connecting.svg" />
        </button>
        <div class="menu" v-if="showHeteronConnectingMenu">
          <div
            class="menu-item"
            @mouseenter="
              selectedHeteronConnecting =
                VocalExpressionNeume.HeteronConnectingLong
            "
          >
            <img
              draggable="false"
              src="@/assets/icons/quality-heteron-connecting-long.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="
              selectedHeteronConnecting = VocalExpressionNeume.HeteronConnecting
            "
          >
            <img
              draggable="false"
              src="@/assets/icons/quality-heteron-connecting.svg"
            />
          </div>
        </div>
      </div>
      <span class="space"></span>
      <div
        class="menu-container"
        @mousedown="openFlatMenu"
        @mouseleave="selectedFlat = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/alteration-yfesis2.svg" />
        </button>
        <div class="menu" v-if="showFlatMenu">
          <div
            class="menu-item"
            @mouseenter="selectedFlat = Accidental.Flat_8_Right"
          >
            <img
              draggable="false"
              src="@/assets/icons/alteration-yfesis8.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedFlat = Accidental.Flat_6_Right"
          >
            <img
              draggable="false"
              src="@/assets/icons/alteration-yfesis6.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedFlat = Accidental.Flat_4_Right"
          >
            <img
              draggable="false"
              src="@/assets/icons/alteration-yfesis4.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedFlat = Accidental.Flat_2_Right"
          >
            <img
              draggable="false"
              src="@/assets/icons/alteration-yfesis2.svg"
            />
          </div>
        </div>
      </div>
      <div
        class="menu-container"
        @mousedown="openSharpMenu"
        @mouseleave="selectedSharp = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/alteration-diesis2.svg" />
        </button>
        <div class="menu" v-if="showSharpMenu">
          <div
            class="menu-item"
            @mouseenter="selectedSharp = Accidental.Sharp_8_Left"
          >
            <img
              draggable="false"
              src="@/assets/icons/alteration-diesis8.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedSharp = Accidental.Sharp_6_Left"
          >
            <img
              draggable="false"
              src="@/assets/icons/alteration-diesis6.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedSharp = Accidental.Sharp_4_Left"
          >
            <img
              draggable="false"
              src="@/assets/icons/alteration-diesis4.svg"
            />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedSharp = Accidental.Sharp_2_Left"
          >
            <img
              draggable="false"
              src="@/assets/icons/alteration-diesis2.svg"
            />
          </div>
        </div>
      </div>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="$emit('update:gorgon', [GorgonNeume.Argon])"
      >
        <img src="@/assets/icons/time-argon.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:gorgon', [GorgonNeume.Hemiolion])"
      >
        <img src="@/assets/icons/time-diargon.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:gorgon', [GorgonNeume.Diargon])"
      >
        <img src="@/assets/icons/time-triargon.svg" />
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
      <div
        class="menu-container"
        @mousedown="openMeasureNumberMenu"
        @mouseleave="selectedMeasureNumber = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/measure-number-2.svg" />
        </button>
        <div class="menu" v-if="showMeasureNumberMenu">
          <div
            class="menu-item"
            @mouseenter="selectedMeasureNumber = MeasureNumber.Eight"
          >
            <img draggable="false" src="@/assets/icons/measure-number-8.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedMeasureNumber = MeasureNumber.Seven"
          >
            <img draggable="false" src="@/assets/icons/measure-number-7.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedMeasureNumber = MeasureNumber.Six"
          >
            <img draggable="false" src="@/assets/icons/measure-number-6.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedMeasureNumber = MeasureNumber.Five"
          >
            <img draggable="false" src="@/assets/icons/measure-number-5.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedMeasureNumber = MeasureNumber.Four"
          >
            <img draggable="false" src="@/assets/icons/measure-number-4.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedMeasureNumber = MeasureNumber.Three"
          >
            <img draggable="false" src="@/assets/icons/measure-number-3.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedMeasureNumber = MeasureNumber.Two"
          >
            <img draggable="false" src="@/assets/icons/measure-number-2.svg" />
          </div>
        </div>
      </div>
      <button
        class="neume-button"
        @click="$emit('update:noteIndicator', !element.noteIndicator)"
      >
        <img draggable="false" src="@/assets/icons/note-ni.svg" />
      </button>
      <div
        class="menu-container"
        @mousedown="openIsonMenu"
        @mouseleave="selectedIson = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/ison-unison.svg" />
        </button>
        <div class="menu" v-if="showIsonMenu">
          <div class="menu-item" @mouseenter="selectedIson = Ison.ZoHigh">
            <img draggable="false" src="@/assets/icons/ison-zo-high.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.Ke">
            <img draggable="false" src="@/assets/icons/ison-ke.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.Thi">
            <img draggable="false" src="@/assets/icons/ison-di.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.Ga">
            <img draggable="false" src="@/assets/icons/ison-ga.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.Vou">
            <img draggable="false" src="@/assets/icons/ison-vou.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.Pa">
            <img draggable="false" src="@/assets/icons/ison-pa.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.Ni">
            <img draggable="false" src="@/assets/icons/ison-ni.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.Zo">
            <img draggable="false" src="@/assets/icons/ison-zo.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.KeLow">
            <img draggable="false" src="@/assets/icons/ison-ke-low.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.ThiLow">
            <img draggable="false" src="@/assets/icons/ison-di-low.svg" />
          </div>
          <div class="menu-item" @mouseenter="selectedIson = Ison.Unison">
            <img draggable="false" src="@/assets/icons/ison-unison.svg" />
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.DiatonicNiLow_Top,
            Fthora.DiatonicNiLow_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.DiatonicPa_Top,
            Fthora.DiatonicPa_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-pa.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', [Fthora.DiatonicVou_Top])"
      >
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', [Fthora.DiatonicGa_Top])"
      >
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.DiatonicThi_Top,
            Fthora.DiatonicThi_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-di.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.DiatonicKe_Top,
            Fthora.DiatonicKe_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ke.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', [Fthora.DiatonicZo_Top])"
      >
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.DiatonicNiHigh_Top,
            Fthora.DiatonicNiHigh_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ni-high.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.SoftChromaticThi_Top,
            Fthora.SoftChromaticThi_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-soft-chromatic-di.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.SoftChromaticPa_Top,
            Fthora.SoftChromaticPa_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-soft-chromatic-ke.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.HardChromaticPa_Top,
            Fthora.HardChromaticPa_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-hard-chromatic-pa.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.HardChromaticThi_Top,
            Fthora.HardChromaticThi_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-hard-chromatic-di.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.Enharmonic_Top,
            Fthora.Enharmonic_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-enharmonic.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.GeneralFlat_Top,
            Fthora.GeneralFlat_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-general-flat.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [
            Fthora.GeneralSharp_Top,
            Fthora.GeneralSharp_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-general-sharp.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="$emit('update:fthora', [Fthora.Zygos_Top, Fthora.Zygos_Bottom])"
      >
        <img src="@/assets/icons/fthora-zygos.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          $emit('update:fthora', [Fthora.Kliton_Top, Fthora.Kliton_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-kliton.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', [Fthora.Spathi_Top, Fthora.Spathi_Bottom])"
      >
        <img src="@/assets/icons/fthora-spathi.svg" />
      </button>
    </div>
    <div class="row">
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
      <span class="space"></span>

      <button @click="$emit('open-syllable-positioning-dialog')">
        Positioning
      </button>
      <span class="space" />

      <div style="display: flex; align-items: center">
        <input
          id="toolbar-neume-ignore-attractions"
          type="checkbox"
          :checked="element.ignoreAttractions"
          @change="$emit('update:ignoreAttractions', $event.target.checked)"
        />
        <label for="toolbar-neume-ignore-attractions">Ignore Attractions</label>
      </div>

      <template v-if="showChromaticFthoraNote">
        <span class="space" />
        <label class="right-space">Fthora Note</label>
        <select
          :value="element.chromaticFthoraNote"
          @change="$emit('update:chromaticFthoraNote', $event.target.value)"
        >
          <option v-for="note in notes" :key="note" :value="note">
            {{ note }}
          </option>
        </select>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import InputUnit from '@/components/InputUnit.vue';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';
import { ScaleNote } from '@/models/Scales';

@Component({
  components: {
    InputUnit,
  },
})
export default class ToolbarNeume extends Vue {
  @Prop() element!: NoteElement;
  @Prop() pageSetup!: PageSetup;
  Accidental = Accidental;
  VocalExpressionNeume = VocalExpressionNeume;
  TimeNeume = TimeNeume;
  GorgonNeume = GorgonNeume;
  Fthora = Fthora;
  MeasureBar = MeasureBar;
  MeasureNumber = MeasureNumber;
  Ison = Ison;

  showFlatMenu: boolean = false;
  showSharpMenu: boolean = false;
  showGorgonMenu: boolean = false;
  showDigorgonMenu: boolean = false;
  showTrigorgonMenu: boolean = false;
  showTimeMenu: boolean = false;
  showBarLineMenu: boolean = false;
  showMeasureNumberMenu: boolean = false;
  showIsonMenu: boolean = false;
  showPsifistonMenu: boolean = false;
  showHeteronConnectingMenu: boolean = false;

  selectedFlat: Accidental | null = null;
  selectedSharp: Accidental | null = null;
  selectedGorgon: GorgonNeume[] | null = null;
  selectedTimeNeume: TimeNeume | null = null;
  selectedBarLine: MeasureBar | null = null;
  selectedMeasureNumber: MeasureNumber | null = null;
  selectedIson: Ison | null = null;
  selectedPsifiston: VocalExpressionNeume | null = null;
  selectedHeteronConnecting: VocalExpressionNeume | null = null;

  chromaticFthoras = [
    Fthora.SoftChromaticPa_Top,
    Fthora.SoftChromaticPa_Bottom,
    Fthora.SoftChromaticThi_Top,
    Fthora.SoftChromaticThi_Bottom,
    Fthora.HardChromaticPa_Top,
    Fthora.HardChromaticPa_Bottom,
    Fthora.HardChromaticThi_Top,
    Fthora.HardChromaticThi_Bottom,
  ];

  get notes() {
    if (
      this.element.fthora === Fthora.SoftChromaticThi_Top ||
      this.element.fthora === Fthora.SoftChromaticThi_Bottom
    ) {
      return [ScaleNote.Thi, ScaleNote.Vou];
    } else if (
      this.element.fthora === Fthora.SoftChromaticPa_Top ||
      this.element.fthora === Fthora.SoftChromaticPa_Bottom
    ) {
      return [ScaleNote.Ke, ScaleNote.Ga];
    } else if (
      this.element.fthora === Fthora.HardChromaticThi_Top ||
      this.element.fthora === Fthora.HardChromaticThi_Bottom
    ) {
      return [ScaleNote.Thi, ScaleNote.Vou];
    } else if (
      this.element.fthora === Fthora.HardChromaticPa_Top ||
      this.element.fthora === Fthora.HardChromaticPa_Bottom
    ) {
      return [ScaleNote.Pa, ScaleNote.Ga];
    }

    return [];
  }

  get showChromaticFthoraNote() {
    return (
      this.element.fthora != null &&
      this.chromaticFthoras.includes(this.element.fthora)
    );
  }

  beforeDestroy() {
    window.removeEventListener('mouseup', this.onFlatMouseUp);
    window.removeEventListener('mouseup', this.onSharpMouseUp);
    window.removeEventListener('mouseup', this.onGorgonMouseUp);
    window.removeEventListener('mouseup', this.onDigorgonMouseUp);
    window.removeEventListener('mouseup', this.onTrigorgonMouseUp);
    window.removeEventListener('mouseup', this.onTimeMouseUp);
    window.removeEventListener('mouseup', this.onBarLineMouseUp);
    window.removeEventListener('mouseup', this.onMeasureNumberMouseUp);
    window.removeEventListener('mouseup', this.onIsonMouseUp);
    window.removeEventListener('mouseup', this.onPsifistonMouseUp);
  }

  get spaceAfterMax() {
    return Math.round(Unit.toPt(this.pageSetup.pageWidth));
  }

  openFlatMenu() {
    this.showFlatMenu = true;
    window.addEventListener('mouseup', this.onFlatMouseUp);
  }

  onFlatMouseUp() {
    if (this.selectedFlat) {
      this.$emit('update:accidental', this.selectedFlat);
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
      this.$emit('update:accidental', this.selectedSharp);
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
      this.$emit('update:gorgon', this.selectedGorgon);
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
      this.$emit('update:gorgon', this.selectedGorgon);
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
      this.$emit('update:gorgon', this.selectedGorgon);
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
      this.$emit('update:time', this.selectedTimeNeume);
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
      this.$emit('update:measureBar', this.selectedBarLine);
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
      this.$emit('update:measureNumber', this.selectedMeasureNumber);
    }

    this.showMeasureNumberMenu = false;

    window.removeEventListener('mouseup', this.onMeasureNumberMouseUp);
  }

  openIsonMenu() {
    this.showIsonMenu = true;
    window.addEventListener('mouseup', this.onIsonMouseUp);
  }

  onIsonMouseUp() {
    if (this.selectedIson) {
      this.$emit('update:ison', this.selectedIson);
    }

    this.showIsonMenu = false;

    window.removeEventListener('mouseup', this.onIsonMouseUp);
  }

  openPsifistonMenu() {
    this.showPsifistonMenu = true;
    window.addEventListener('mouseup', this.onPsifistonMouseUp);
  }

  onPsifistonMouseUp() {
    if (this.selectedPsifiston) {
      this.$emit('update:expression', this.selectedPsifiston);
    }

    this.showPsifistonMenu = false;

    window.removeEventListener('mouseup', this.onPsifistonMouseUp);
  }

  openHeteronConnectingMenu() {
    this.showHeteronConnectingMenu = true;
    window.addEventListener('mouseup', this.onHeteronConnectingMouseUp);
  }

  onHeteronConnectingMouseUp() {
    if (this.selectedHeteronConnecting) {
      this.$emit('update:expression', this.selectedHeteronConnecting);
    }

    this.showHeteronConnectingMenu = false;

    window.removeEventListener('mouseup', this.onHeteronConnectingMouseUp);
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

.neume-button img {
  height: var(--btn-size);
  width: var(--btn-size);
}

label.right-space {
  margin-right: 0.5rem;
}

.space {
  width: 16px;
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
