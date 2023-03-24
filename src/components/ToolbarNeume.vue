<template>
  <div class="neume-toolbar">
    <div class="row">
      <button
        class="neume-button"
        :disabled="klasmaDisabled"
        @click="$emit('update:klasma')"
      >
        <img src="@/assets/icons/time-klasma.svg" />
      </button>
      <ButtonWithMenu
        :options="apliMenuOptions"
        :disabled="apleDisabled"
        @select="$emit('update:time', $event)"
      />
      <button
        class="neume-button"
        :disabled="koronisDisabled"
        @click="$emit('update:koronis', !element.koronis)"
      >
        <img src="@/assets/icons/time-koronis.svg" />
      </button>
      <span class="space"></span>

      <ButtonWithMenu
        :options="gorgonMenuOptions"
        @select="$emit('update:gorgon', $event)"
      />
      <ButtonWithMenu
        :options="digorgonMenuOptions"
        @select="$emit('update:gorgon', $event)"
      />
      <ButtonWithMenu
        :options="trigorgonMenuOptions"
        @select="$emit('update:gorgon', $event)"
      />
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        @click="$emit('update:vareia', !element.vareia)"
      >
        <img src="@/assets/icons/quality-vareia.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        @click="$emit('update:expression', VocalExpressionNeume.Homalon)"
      >
        <img src="@/assets/icons/quality-omalon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        @click="
          $emit('update:expression', VocalExpressionNeume.HomalonConnecting)
        "
      >
        <img src="@/assets/icons/quality-omalon-connecting.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        @click="$emit('update:expression', VocalExpressionNeume.Antikenoma)"
      >
        <img src="@/assets/icons/quality-antikenoma.svg" />
      </button>
      <ButtonWithMenu
        :options="psifistonMenuOptions"
        :disabled="expressionsDisabled"
        @select="$emit('update:expression', $event)"
      />
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        @click="$emit('update:expression', VocalExpressionNeume.Heteron)"
      >
        <img src="@/assets/icons/quality-heteron.svg" />
      </button>
      <ButtonWithMenu
        :options="heteronConnectingMenuOptions"
        :disabled="expressionsDisabled"
        @select="$emit('update:expression', $event)"
      />
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        @click="$emit('update:expression', VocalExpressionNeume.Endofonon)"
      >
        <img src="@/assets/icons/quality-endofonon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        @click="$emit('update:tie', [Tie.YfenBelow, Tie.YfenAbove])"
      >
        <img src="@/assets/icons/tie-yfen-below.svg" />
      </button>
      <span class="space"></span>
      <ButtonWithMenu
        :options="flatMenuOptions"
        :disabled="accidentalsDisabled"
        @select="$emit('update:accidental', $event)"
      />
      <ButtonWithMenu
        :options="sharpMenuOptions"
        :disabled="accidentalsDisabled"
        @select="$emit('update:accidental', $event)"
      />
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="argonDisabled"
        @click="$emit('update:gorgon', [GorgonNeume.Argon])"
      >
        <img src="@/assets/icons/time-argon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="argonDisabled"
        @click="$emit('update:gorgon', [GorgonNeume.Hemiolion])"
      >
        <img src="@/assets/icons/time-diargon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="argonDisabled"
        @click="$emit('update:gorgon', [GorgonNeume.Diargon])"
      >
        <img src="@/assets/icons/time-triargon.svg" />
      </button>
      <span class="space"></span>
      <ButtonWithMenu
        :options="barlineMenuOptions"
        @select="$emit('update:measureBar', $event)"
      />
      <ButtonWithMenu
        :options="measureNumberMenuOptions"
        @select="$emit('update:measureNumber', $event)"
      />
      <button
        class="neume-button"
        @click="$emit('update:noteIndicator', !element.noteIndicator)"
      >
        <img draggable="false" src="@/assets/icons/note-ni.svg" />
      </button>
      <ButtonWithMenu
        :options="isonMenuOptions"
        @select="$emit('update:ison', $event)"
      />
    </div>
    <div class="row">
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
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
        :disabled="fthoresDisabled"
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
        :disabled="fthoresDisabled"
        @click="
          $emit('update:fthora', [
            Fthora.DiatonicVou_Top,
            Fthora.DiatonicVou_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        @click="
          $emit('update:fthora', [
            Fthora.DiatonicGa_Top,
            Fthora.DiatonicGa_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
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
        :disabled="fthoresDisabled"
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
        :disabled="fthoresDisabled"
        @click="
          $emit('update:fthora', [
            Fthora.DiatonicZo_Top,
            Fthora.DiatonicZo_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
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
        :disabled="fthoresDisabled"
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
        :disabled="fthoresDisabled"
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
        :disabled="fthoresDisabled"
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
        :disabled="fthoresDisabled"
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
        :disabled="fthoresDisabled || enharmonicDisabled"
        :title="enharmonicTitle"
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
        :disabled="fthoresDisabled || generalFlatDisabled"
        :title="generalFlatTitle"
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
        :disabled="fthoresDisabled || generalSharpDisabled"
        :title="generalSharpTitle"
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
        :disabled="fthoresDisabled || zygosDisabled"
        :title="zygosTitle"
        @click="$emit('update:fthora', [Fthora.Zygos_Top, Fthora.Zygos_Bottom])"
      >
        <img src="@/assets/icons/fthora-zygos.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || klitonDisabled"
        :title="klitonTitle"
        @click="
          $emit('update:fthora', [Fthora.Kliton_Top, Fthora.Kliton_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-kliton.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || spathiDisabled"
        :title="spathiTitle"
        @click="
          $emit('update:fthora', [Fthora.Spathi_Top, Fthora.Spathi_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-spathi.svg" />
      </button>
    </div>
    <div class="row">
      <span class="space" />

      <span class="note-name">{{ noteDisplay }}</span>

      <span class="separator" />

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
  QuantitativeNeume,
  restNeumes,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';
import { ScaleNote } from '@/models/Scales';
import ButtonWithMenu, {
  ButtonWithMenuOption,
} from '@/components/ButtonWithMenu.vue';
import { kentemataNeumes } from '@/models/NeumeReplacements';

@Component({
  components: {
    InputUnit,
    ButtonWithMenu,
  },
})
export default class ToolbarNeume extends Vue {
  @Prop() element!: NoteElement;
  @Prop() pageSetup!: PageSetup;
  VocalExpressionNeume = VocalExpressionNeume;
  GorgonNeume = GorgonNeume;
  Fthora = Fthora;
  Tie = Tie;

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

  apliMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: TimeNeume.Tetrapli,
      icon: require('@/assets/icons/time-tetrapli.svg'),
    },
    {
      neume: TimeNeume.Tripli,
      icon: require('@/assets/icons/time-tripli.svg'),
    },
    {
      neume: TimeNeume.Dipli,
      icon: require('@/assets/icons/time-dipli.svg'),
    },
    {
      neume: TimeNeume.Hapli,
      icon: require('@/assets/icons/time-apli.svg'),
    },
  ];

  gorgonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: GorgonNeume.GorgonDottedRight,
      icon: require('@/assets/icons/time-gorgon-dotted-right.svg'),
    },
    {
      neume: GorgonNeume.GorgonDottedLeft,
      icon: require('@/assets/icons/time-gorgon-dotted-left.svg'),
    },
    {
      neume: [GorgonNeume.Gorgon_Top, GorgonNeume.Gorgon_Bottom],
      icon: require('@/assets/icons/time-gorgon.svg'),
    },
  ];

  digorgonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: GorgonNeume.DigorgonDottedRight,
      icon: require('@/assets/icons/time-digorgon-dotted-right.svg'),
    },
    {
      neume: GorgonNeume.DigorgonDottedLeft2,
      icon: require('@/assets/icons/time-digorgon-dotted-left-above.svg'),
    },
    {
      neume: GorgonNeume.DigorgonDottedLeft1,
      icon: require('@/assets/icons/time-digorgon-dotted-left-below.svg'),
    },
    {
      neume: GorgonNeume.Digorgon,
      icon: require('@/assets/icons/time-digorgon.svg'),
    },
  ];

  trigorgonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: GorgonNeume.TrigorgonDottedRight,
      icon: require('@/assets/icons/time-trigorgon-dotted-right.svg'),
    },
    {
      neume: GorgonNeume.TrigorgonDottedLeft2,
      icon: require('@/assets/icons/time-trigorgon-dotted-left-above.svg'),
    },
    {
      neume: GorgonNeume.TrigorgonDottedLeft1,
      icon: require('@/assets/icons/time-trigorgon-dotted-left-below.svg'),
    },
    {
      neume: GorgonNeume.Trigorgon,
      icon: require('@/assets/icons/time-trigorgon.svg'),
    },
  ];

  psifistonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: VocalExpressionNeume.PsifistonSlanted,
      icon: require('@/assets/icons/quality-psifiston-slanted.svg'),
    },
    {
      neume: VocalExpressionNeume.Psifiston,
      icon: require('@/assets/icons/quality-psifiston.svg'),
    },
  ];

  heteronConnectingMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: VocalExpressionNeume.HeteronConnectingLong,
      icon: require('@/assets/icons/quality-heteron-connecting-long.svg'),
    },
    {
      neume: VocalExpressionNeume.HeteronConnecting,
      icon: require('@/assets/icons/quality-heteron-connecting.svg'),
    },
  ];

  flatMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: Accidental.Flat_8_Right,
      icon: require('@/assets/icons/alteration-yfesis8.svg'),
    },
    {
      neume: Accidental.Flat_6_Right,
      icon: require('@/assets/icons/alteration-yfesis6.svg'),
    },
    {
      neume: Accidental.Flat_4_Right,
      icon: require('@/assets/icons/alteration-yfesis4.svg'),
    },
    {
      neume: Accidental.Flat_2_Right,
      icon: require('@/assets/icons/alteration-yfesis2.svg'),
    },
  ];

  sharpMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: Accidental.Sharp_8_Left,
      icon: require('@/assets/icons/alteration-diesis8.svg'),
    },
    {
      neume: Accidental.Sharp_6_Left,
      icon: require('@/assets/icons/alteration-diesis6.svg'),
    },
    {
      neume: Accidental.Sharp_4_Left,
      icon: require('@/assets/icons/alteration-diesis4.svg'),
    },
    {
      neume: Accidental.Sharp_2_Left,
      icon: require('@/assets/icons/alteration-diesis2.svg'),
    },
  ];

  barlineMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: MeasureBar.MeasureBarTop,
      icon: require('@/assets/icons/barline-short-single.svg'),
    },
    {
      neume: MeasureBar.MeasureBarRight,
      icon: require('@/assets/icons/barline-single.svg'),
    },
  ];

  measureNumberMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: MeasureNumber.Eight,
      icon: require('@/assets/icons/measure-number-8.svg'),
    },
    {
      neume: MeasureNumber.Seven,
      icon: require('@/assets/icons/measure-number-7.svg'),
    },
    {
      neume: MeasureNumber.Six,
      icon: require('@/assets/icons/measure-number-6.svg'),
    },
    {
      neume: MeasureNumber.Five,
      icon: require('@/assets/icons/measure-number-5.svg'),
    },
    {
      neume: MeasureNumber.Four,
      icon: require('@/assets/icons/measure-number-4.svg'),
    },
    {
      neume: MeasureNumber.Three,
      icon: require('@/assets/icons/measure-number-3.svg'),
    },
    {
      neume: MeasureNumber.Two,
      icon: require('@/assets/icons/measure-number-2.svg'),
    },
  ];

  isonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: Ison.ZoHigh,
      icon: require('@/assets/icons/ison-zo-high.svg'),
    },
    {
      neume: Ison.Ke,
      icon: require('@/assets/icons/ison-ke.svg'),
    },
    {
      neume: Ison.Thi,
      icon: require('@/assets/icons/ison-di.svg'),
    },
    {
      neume: Ison.Ga,
      icon: require('@/assets/icons/ison-ga.svg'),
    },
    {
      neume: Ison.Vou,
      icon: require('@/assets/icons/ison-vou.svg'),
    },
    {
      neume: Ison.Pa,
      icon: require('@/assets/icons/ison-pa.svg'),
    },
    {
      neume: Ison.Ni,
      icon: require('@/assets/icons/ison-ni.svg'),
    },
    {
      neume: Ison.Zo,
      icon: require('@/assets/icons/ison-zo.svg'),
    },
    {
      neume: Ison.KeLow,
      icon: require('@/assets/icons/ison-ke-low.svg'),
    },
    {
      neume: Ison.ThiLow,
      icon: require('@/assets/icons/ison-di-low.svg'),
    },
    {
      neume: Ison.Unison,
      icon: require('@/assets/icons/ison-unison.svg'),
    },
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
    } else if (
      this.element.fthora === Fthora.Enharmonic_Top ||
      this.element.fthora === Fthora.Enharmonic_Bottom
    ) {
      return [ScaleNote.Ga, ScaleNote.Vou];
    }

    return [];
  }

  get hasAmbiguousEnharmonicFthora() {
    return (
      (this.element.fthora === Fthora.Enharmonic_Top ||
        this.element.fthora === Fthora.Enharmonic_Bottom) &&
      this.element.scaleNotes.includes(ScaleNote.Ga) &&
      this.element.scaleNotes.includes(ScaleNote.Vou)
    );
  }

  get showChromaticFthoraNote() {
    return (
      this.element.fthora != null &&
      (this.chromaticFthoras.includes(this.element.fthora) ||
        this.hasAmbiguousEnharmonicFthora)
    );
  }

  get fthoresDisabled() {
    return restNeumes.includes(this.element.quantitativeNeume);
  }

  get expressionsDisabled() {
    return restNeumes.includes(this.element.quantitativeNeume);
  }

  get accidentalsDisabled() {
    return restNeumes.includes(this.element.quantitativeNeume);
  }

  get klasmaDisabled() {
    return (
      restNeumes.includes(this.element.quantitativeNeume) ||
      kentemataNeumes.includes(this.element.quantitativeNeume)
    );
  }

  get apleDisabled() {
    return (
      restNeumes.includes(this.element.quantitativeNeume) ||
      kentemataNeumes.includes(this.element.quantitativeNeume)
    );
  }

  get koronisDisabled() {
    return (
      restNeumes.includes(this.element.quantitativeNeume) ||
      kentemataNeumes.includes(this.element.quantitativeNeume)
    );
  }

  get argonDisabled() {
    return (
      this.element.quantitativeNeume !== QuantitativeNeume.KentemataPlusOligon
    );
  }

  get spathiDisabled() {
    return (
      !this.element.scaleNotes.includes(ScaleNote.Ke) &&
      !this.element.scaleNotes.includes(ScaleNote.Ga)
    );
  }

  get spathiTitle() {
    return this.spathiDisabled ? 'Spathi may only be placed on Ke or Ga' : '';
  }

  get klitonDisabled() {
    return !this.element.scaleNotes.includes(ScaleNote.Thi);
  }

  get klitonTitle() {
    return this.klitonDisabled ? 'Kliton may only be placed on Thi' : '';
  }

  get zygosDisabled() {
    return !this.element.scaleNotes.includes(ScaleNote.Thi);
  }

  get zygosTitle() {
    return this.zygosDisabled ? 'Zygos may only be placed on Thi' : '';
  }

  get enharmonicDisabled() {
    return (
      !this.element.scaleNotes.includes(ScaleNote.Zo) &&
      !this.element.scaleNotes.includes(ScaleNote.ZoHigh) &&
      !this.element.scaleNotes.includes(ScaleNote.Vou) &&
      !this.element.scaleNotes.includes(ScaleNote.VouHigh) &&
      !this.element.scaleNotes.includes(ScaleNote.Ga)
    );
  }

  get enharmonicTitle() {
    return this.enharmonicDisabled
      ? 'Enharmonic fthora may only be placed on Ga, Zo, and Vou'
      : '';
  }

  get generalFlatDisabled() {
    return !this.element.scaleNotes.includes(ScaleNote.Ke);
  }

  get generalFlatTitle() {
    return this.generalFlatDisabled
      ? 'General flat may only be placed on Ke'
      : '';
  }

  get generalSharpDisabled() {
    return !this.element.scaleNotes.includes(ScaleNote.Ga);
  }

  get generalSharpTitle() {
    return this.generalSharpDisabled
      ? 'General sharp may only be placed on Ga'
      : '';
  }

  get noteDisplay() {
    return this.element.scaleNotes.map((x) => this.getNoteName(x)).join(' ');
  }

  getNoteName(note: ScaleNote) {
    if (note == null) {
      return '???';
    }

    switch (note) {
      case ScaleNote.VouLow:
        return 'vou';
      case ScaleNote.GaLow:
        return 'ga';
      case ScaleNote.ThiLow:
        return 'di';
      case ScaleNote.KeLow:
        return 'ke';
      case ScaleNote.Thi:
        return 'Di';
      case ScaleNote.ZoHigh:
        return "Zo'";
      case ScaleNote.NiHigh:
        return "Ni'";
      case ScaleNote.PaHigh:
        return "Pa'";
      case ScaleNote.VouHigh:
        return "Vou'";
      case ScaleNote.GaHigh:
        return "Ga'";
      case ScaleNote.ThiHigh:
        return "Di'";
      case ScaleNote.KeHigh:
        return "Ke'";
      default:
        return note;
    }
  }

  get spaceAfterMax() {
    return Math.round(Unit.toPt(this.pageSetup.pageWidth));
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

.note-name {
  width: 8ch;
  text-align: center;
}

label.right-space {
  margin-right: 0.5rem;
}

.space {
  width: 16px;
}

.separator {
  margin: 0 16px;
  border-right: 1px solid black;
  height: 16px;
}
</style>
