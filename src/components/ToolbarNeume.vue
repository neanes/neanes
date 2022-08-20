<template>
  <div class="neume-toolbar">
    <div class="row">
      <button class="neume-button" @click="setKlasma()">
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
        @click="setVocalExpression(VocalExpressionNeume.Homalon)"
      >
        <img src="@/assets/icons/quality-omalon.svg" />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.HomalonConnecting)"
      >
        <img src="@/assets/icons/quality-omalon-connecting.svg" />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Antikenoma)"
      >
        <img src="@/assets/icons/quality-antikenoma.svg" />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Psifiston)"
      >
        <img src="@/assets/icons/quality-psifiston.svg" />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.Heteron)"
      >
        <img src="@/assets/icons/quality-heteron.svg" />
      </button>
      <button
        class="neume-button"
        @click="setVocalExpression(VocalExpressionNeume.HeteronConnecting)"
      >
        <img src="@/assets/icons/quality-heteron-connecting.svg" />
      </button>
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
      <button class="neume-button" @click="setGorgonNeume([GorgonNeume.Argon])">
        <img src="@/assets/icons/time-argon.svg" />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume([GorgonNeume.Hemiolion])"
      >
        <img src="@/assets/icons/time-diargon.svg" />
      </button>
      <button
        class="neume-button"
        @click="setGorgonNeume([GorgonNeume.Diargon])"
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
      <div
        class="menu-container"
        @mousedown="openNoteIndicatorMenu"
        @mouseleave="selectedNoteIndicator = null"
      >
        <button class="neume-button">
          <img draggable="false" src="@/assets/icons/note-ni.svg" />
        </button>
        <div class="menu" v-if="showNoteIndicatorMenu">
          <div
            class="menu-item"
            @mouseenter="selectedNoteIndicator = NoteIndicator.Zo"
          >
            <img draggable="false" src="@/assets/icons/note-zo.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedNoteIndicator = NoteIndicator.Ke"
          >
            <img draggable="false" src="@/assets/icons/note-ke.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedNoteIndicator = NoteIndicator.Thi"
          >
            <img draggable="false" src="@/assets/icons/note-di.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedNoteIndicator = NoteIndicator.Ga"
          >
            <img draggable="false" src="@/assets/icons/note-ga.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedNoteIndicator = NoteIndicator.Vou"
          >
            <img draggable="false" src="@/assets/icons/note-vou.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedNoteIndicator = NoteIndicator.Pa"
          >
            <img draggable="false" src="@/assets/icons/note-pa.svg" />
          </div>
          <div
            class="menu-item"
            @mouseenter="selectedNoteIndicator = NoteIndicator.Ni"
          >
            <img draggable="false" src="@/assets/icons/note-ni.svg" />
          </div>
        </div>
      </div>
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
          setFthora([Fthora.DiatonicNiLow_Top, Fthora.DiatonicNiLow_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.DiatonicPa_Top, Fthora.DiatonicPa_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-pa.svg" />
      </button>
      <button class="neume-button" @click="setFthora([Fthora.DiatonicVou_Top])">
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button class="neume-button" @click="setFthora([Fthora.DiatonicGa_Top])">
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.DiatonicThi_Top, Fthora.DiatonicThi_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-di.svg" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.DiatonicKe_Top, Fthora.DiatonicKe_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-ke.svg" />
      </button>
      <button class="neume-button" @click="setFthora([Fthora.DiatonicZo_Top])">
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([Fthora.DiatonicNiHigh_Top, Fthora.DiatonicNiHigh_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ni-high.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          setFthora([
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
          setFthora([Fthora.SoftChromaticPa_Top, Fthora.SoftChromaticPa_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-soft-chromatic-ke.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="
          setFthora([Fthora.HardChromaticPa_Top, Fthora.HardChromaticPa_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-hard-chromatic-pa.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([
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
        @click="setFthora([Fthora.Enharmonic_Top, Fthora.Enharmonic_Bottom])"
      >
        <img src="@/assets/icons/fthora-enharmonic.svg" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.GeneralFlat_Top, Fthora.GeneralFlat_Bottom])"
      >
        <img src="@/assets/icons/fthora-general-flat.svg" />
      </button>
      <button
        class="neume-button"
        @click="
          setFthora([Fthora.GeneralSharp_Top, Fthora.GeneralSharp_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-general-sharp.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="setFthora([Fthora.Zygos_Top, Fthora.Zygos_Bottom])"
      >
        <img src="@/assets/icons/fthora-zygos.svg" />
      </button>
      <button
        class="neume-button"
        @click="setFthora([Fthora.Kliton_Top, Fthora.Kliton_Bottom])"
      >
        <img src="@/assets/icons/fthora-kliton.svg" />
      </button>
      <button class="neume-button" @click="setFthora([Fthora.Spathi_Top])">
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
  NoteIndicator,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import {
  areVocalExpressionsEquivalent,
  onlyTakesTopKlasma,
  onlyTakesBottomKlasma,
  onlyTakesTopGorgon,
} from '@/models/NeumeReplacements';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

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
  NoteIndicator = NoteIndicator;
  Ison = Ison;

  showFlatMenu: boolean = false;
  showSharpMenu: boolean = false;
  showGorgonMenu: boolean = false;
  showDigorgonMenu: boolean = false;
  showTrigorgonMenu: boolean = false;
  showTimeMenu: boolean = false;
  showBarLineMenu: boolean = false;
  showMeasureNumberMenu: boolean = false;
  showNoteIndicatorMenu: boolean = false;
  showIsonMenu: boolean = false;

  selectedFlat: Accidental | null = null;
  selectedSharp: Accidental | null = null;
  selectedGorgon: GorgonNeume[] | null = null;
  selectedTimeNeume: TimeNeume | null = null;
  selectedBarLine: MeasureBar | null = null;
  selectedMeasureNumber: MeasureNumber | null = null;
  selectedNoteIndicator: NoteIndicator | null = null;
  selectedIson: Ison | null = null;

  beforeDestroy() {
    window.removeEventListener('mouseup', this.onFlatMouseUp);
    window.removeEventListener('mouseup', this.onSharpMouseUp);
    window.removeEventListener('mouseup', this.onGorgonMouseUp);
    window.removeEventListener('mouseup', this.onDigorgonMouseUp);
    window.removeEventListener('mouseup', this.onTrigorgonMouseUp);
    window.removeEventListener('mouseup', this.onTimeMouseUp);
    window.removeEventListener('mouseup', this.onBarLineMouseUp);
    window.removeEventListener('mouseup', this.onMeasureNumberMouseUp);
    window.removeEventListener('mouseup', this.onNoteIndicatorMouseUp);
    window.removeEventListener('mouseup', this.onIsonMouseUp);
  }

  get spaceAfterMax() {
    return Unit.toPt(this.pageSetup.pageWidth);
  }

  private setAccidental(neume: Accidental) {
    if (this.element.accidental != null && this.element.accidental === neume) {
      this.$emit('update:accidental', null);
    } else {
      this.$emit('update:accidental', neume);
    }
  }

  private setKlasma() {
    if (onlyTakesBottomKlasma(this.element.quantitativeNeume)) {
      if (this.element.timeNeume === TimeNeume.Klasma_Bottom) {
        this.$emit('update:time', null);
      } else {
        this.$emit('update:time', TimeNeume.Klasma_Bottom);
      }
      return;
    } else if (onlyTakesTopKlasma(this.element.quantitativeNeume)) {
      if (this.element.timeNeume === TimeNeume.Klasma_Top) {
        this.$emit('update:time', null);
      } else {
        this.$emit('update:time', TimeNeume.Klasma_Top);
      }
      return;
    } else if (this.element.timeNeume == null) {
      this.$emit('update:time', TimeNeume.Klasma_Top);
    } else if (this.element.timeNeume === TimeNeume.Klasma_Top) {
      this.$emit('update:time', TimeNeume.Klasma_Bottom);
    } else if (this.element.timeNeume === TimeNeume.Klasma_Bottom) {
      this.$emit('update:time', null);
    }
  }

  private setTimeNeume(neume: TimeNeume) {
    if (this.element.timeNeume === neume) {
      this.$emit('update:time', null);
    } else {
      this.$emit('update:time', neume);
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

      equivalent = this.element.gorgonNeume === neume;
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

  private setMeasureNumber(neume: MeasureNumber) {
    if (neume === this.element.measureNumber) {
      this.$emit('update:measureNumber', null);
    } else {
      this.$emit('update:measureNumber', neume);
    }
  }

  private setNoteIndicator(neume: NoteIndicator) {
    if (neume === this.element.noteIndicator) {
      this.$emit('update:noteIndicator', null);
    } else {
      this.$emit('update:noteIndicator', neume);
    }
  }

  private setIson(neume: Ison) {
    if (neume === this.element.ison) {
      this.$emit('update:ison', null);
    } else {
      this.$emit('update:ison', neume);
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

      equivalent = this.element.fthora === neume;
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

  openNoteIndicatorMenu() {
    this.showNoteIndicatorMenu = true;
    window.addEventListener('mouseup', this.onNoteIndicatorMouseUp);
  }

  onNoteIndicatorMouseUp() {
    if (this.selectedNoteIndicator) {
      this.setNoteIndicator(this.selectedNoteIndicator);
    }

    this.showNoteIndicatorMenu = false;

    window.removeEventListener('mouseup', this.onNoteIndicatorMouseUp);
  }

  openIsonMenu() {
    this.showIsonMenu = true;
    window.addEventListener('mouseup', this.onIsonMouseUp);
  }

  onIsonMouseUp() {
    if (this.selectedIson) {
      this.setIson(this.selectedIson);
    }

    this.showIsonMenu = false;

    window.removeEventListener('mouseup', this.onIsonMouseUp);
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
