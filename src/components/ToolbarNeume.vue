<template>
  <div class="neume-toolbar">
    <div class="row" v-if="isMultiNeume">
      <span>Neume Select</span>
      <span class="space"></span>
      <button
        v-if="hasTertiaryNeume"
        class="btnNeumeSelect"
        @click="$emit('update:innerNeume', 'Tertiary')"
        :class="{ selected: innerNeume === 'Tertiary' }"
      >
        1
      </button>
      <button
        @click="$emit('update:innerNeume', 'Secondary')"
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Secondary' }"
      >
        {{ hasTertiaryNeume ? '2' : '1' }}
      </button>
      <button
        @click="$emit('update:innerNeume', 'Primary')"
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Primary' }"
      >
        {{ hasTertiaryNeume ? '3' : '2' }}
      </button>
    </div>
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
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="digorgonMenuOptions"
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="trigorgonMenuOptions"
        @select="updateGorgon($event)"
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
        @select="updateAccidental($event)"
      />
      <ButtonWithMenu
        :options="sharpMenuOptions"
        :disabled="accidentalsDisabled"
        @select="updateAccidental($event)"
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
        :disabled="isonDisabled"
        @select="$emit('update:ison', $event)"
      />
    </div>
    <div class="row">
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        @click="
          updateFthora([Fthora.DiatonicNiLow_Top, Fthora.DiatonicNiLow_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        @click="updateFthora([Fthora.DiatonicPa_Top, Fthora.DiatonicPa_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-pa.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        @click="
          updateFthora([Fthora.DiatonicVou_Top, Fthora.DiatonicVou_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        @click="updateFthora([Fthora.DiatonicGa_Top, Fthora.DiatonicGa_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        @click="
          updateFthora([Fthora.DiatonicThi_Top, Fthora.DiatonicThi_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-di.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        @click="updateFthora([Fthora.DiatonicKe_Top, Fthora.DiatonicKe_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-ke.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        @click="updateFthora([Fthora.DiatonicZo_Top, Fthora.DiatonicZo_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        @click="
          updateFthora([
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
          updateFthora([
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
          updateFthora([
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
          updateFthora([
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
          updateFthora([
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
        @click="updateFthora([Fthora.Enharmonic_Top, Fthora.Enharmonic_Bottom])"
      >
        <img src="@/assets/icons/fthora-enharmonic.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || generalFlatDisabled"
        :title="generalFlatTitle"
        @click="
          updateFthora([Fthora.GeneralFlat_Top, Fthora.GeneralFlat_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-general-flat.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || generalSharpDisabled"
        :title="generalSharpTitle"
        @click="
          updateFthora([Fthora.GeneralSharp_Top, Fthora.GeneralSharp_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-general-sharp.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || zygosDisabled"
        :title="zygosTitle"
        @click="updateFthora([Fthora.Zygos_Top, Fthora.Zygos_Bottom])"
      >
        <img src="@/assets/icons/fthora-zygos.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || klitonDisabled"
        :title="klitonTitle"
        @click="updateFthora([Fthora.Kliton_Top, Fthora.Kliton_Bottom])"
      >
        <img src="@/assets/icons/fthora-kliton.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || spathiDisabled"
        :title="spathiTitle"
        @click="updateFthora([Fthora.Spathi_Top, Fthora.Spathi_Bottom])"
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
        :modelValue="element.spaceAfter"
        @update:modelValue="$emit('update:spaceAfter', $event)"
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
          @change="
            $emit(
              'update:ignoreAttractions',
              ($event.target as HTMLInputElement).checked,
            )
          "
        />
        <label for="toolbar-neume-ignore-attractions">Ignore Attractions</label>
      </div>

      <template v-if="showChromaticFthoraNote">
        <span class="space" />
        <label class="right-space">Fthora Note</label>
        <select
          :value="element.chromaticFthoraNote"
          @change="
            $emit(
              'update:chromaticFthoraNote',
              ($event.target as HTMLInputElement).value,
            )
          "
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
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ButtonWithMenu, {
  ButtonWithMenuOption,
} from '@/components/ButtonWithMenu.vue';
import InputUnit from '@/components/InputUnit.vue';
import { NoteElement } from '@/models/Element';
import {
  kentemataNeumes,
  takesSecondaryNeumes,
  takesTertiaryNeumes,
} from '@/models/NeumeReplacements';
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
import { ScaleNote } from '@/models/Scales';
import { Unit } from '@/utils/Unit';

@Component({
  components: { InputUnit, ButtonWithMenu },
  emits: [
    'open-syllable-positioning-dialog',
    'update:accidental',
    'update:chromaticFthoraNote',
    'update:expression',
    'update:fthora',
    'update:gorgon',
    'update:ignoreAttractions',
    'update:innerNeume',
    'update:ison',
    'update:klasma',
    'update:koronis',
    'update:measureBar',
    'update:measureNumber',
    'update:noteIndicator',
    'update:secondaryAccidental',
    'update:secondaryFthora',
    'update:secondaryGorgon',
    'update:spaceAfter',
    'update:tertiaryAccidental',
    'update:tertiaryFthora',
    'update:tie',
    'update:time',
    'update:vareia',
  ],
})
export default class ToolbarNeume extends Vue {
  @Prop() element!: NoteElement;
  @Prop() pageSetup!: PageSetup;
  @Prop() innerNeume!: string;
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
      icon: new URL('@/assets/icons/time-tetrapli.svg', import.meta.url).href,
    },
    {
      neume: TimeNeume.Tripli,
      icon: new URL('@/assets/icons/time-tripli.svg', import.meta.url).href,
    },
    {
      neume: TimeNeume.Dipli,
      icon: new URL('@/assets/icons/time-dipli.svg', import.meta.url).href,
    },
    {
      neume: TimeNeume.Hapli,
      icon: new URL('@/assets/icons/time-apli.svg', import.meta.url).href,
    },
  ];

  gorgonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: GorgonNeume.GorgonDottedRight,
      icon: new URL(
        '@/assets/icons/time-gorgon-dotted-right.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: GorgonNeume.GorgonDottedLeft,
      icon: new URL(
        '@/assets/icons/time-gorgon-dotted-left.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: [GorgonNeume.Gorgon_Top, GorgonNeume.Gorgon_Bottom],
      icon: new URL('@/assets/icons/time-gorgon.svg', import.meta.url).href,
    },
  ];

  digorgonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: GorgonNeume.DigorgonDottedRight,
      icon: new URL(
        '@/assets/icons/time-digorgon-dotted-right.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: GorgonNeume.DigorgonDottedLeft2,
      icon: new URL(
        '@/assets/icons/time-digorgon-dotted-left-above.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: GorgonNeume.DigorgonDottedLeft1,
      icon: new URL(
        '@/assets/icons/time-digorgon-dotted-left-below.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: GorgonNeume.Digorgon,
      icon: new URL('@/assets/icons/time-digorgon.svg', import.meta.url).href,
    },
  ];

  trigorgonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: GorgonNeume.TrigorgonDottedRight,
      icon: new URL(
        '@/assets/icons/time-trigorgon-dotted-right.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: GorgonNeume.TrigorgonDottedLeft2,
      icon: new URL(
        '@/assets/icons/time-trigorgon-dotted-left-above.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: GorgonNeume.TrigorgonDottedLeft1,
      icon: new URL(
        '@/assets/icons/time-trigorgon-dotted-left-below.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: GorgonNeume.Trigorgon,
      icon: new URL('@/assets/icons/time-trigorgon.svg', import.meta.url).href,
    },
  ];

  psifistonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: VocalExpressionNeume.PsifistonSlanted,
      icon: new URL(
        '@/assets/icons/quality-psifiston-slanted.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: VocalExpressionNeume.Psifiston,
      icon: new URL('@/assets/icons/quality-psifiston.svg', import.meta.url)
        .href,
    },
  ];

  heteronConnectingMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: VocalExpressionNeume.HeteronConnectingLong,
      icon: new URL(
        '@/assets/icons/quality-heteron-connecting-long.svg',
        import.meta.url,
      ).href,
    },
    {
      neume: VocalExpressionNeume.HeteronConnecting,
      icon: new URL(
        '@/assets/icons/quality-heteron-connecting.svg',
        import.meta.url,
      ).href,
    },
  ];

  flatMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: Accidental.Flat_8_Right,
      icon: new URL('@/assets/icons/alteration-yfesis8.svg', import.meta.url)
        .href,
    },
    {
      neume: Accidental.Flat_6_Right,
      icon: new URL('@/assets/icons/alteration-yfesis6.svg', import.meta.url)
        .href,
    },
    {
      neume: Accidental.Flat_4_Right,
      icon: new URL('@/assets/icons/alteration-yfesis4.svg', import.meta.url)
        .href,
    },
    {
      neume: Accidental.Flat_2_Right,
      icon: new URL('@/assets/icons/alteration-yfesis2.svg', import.meta.url)
        .href,
    },
  ];

  sharpMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: Accidental.Sharp_8_Left,
      icon: new URL('@/assets/icons/alteration-diesis8.svg', import.meta.url)
        .href,
    },
    {
      neume: Accidental.Sharp_6_Left,
      icon: new URL('@/assets/icons/alteration-diesis6.svg', import.meta.url)
        .href,
    },
    {
      neume: Accidental.Sharp_4_Left,
      icon: new URL('@/assets/icons/alteration-diesis4.svg', import.meta.url)
        .href,
    },
    {
      neume: Accidental.Sharp_2_Left,
      icon: new URL('@/assets/icons/alteration-diesis2.svg', import.meta.url)
        .href,
    },
  ];

  barlineMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: MeasureBar.MeasureBarShortTheseos,
      icon: new URL('@/assets/icons/barline-short-theseos.svg', import.meta.url)
        .href,
    },
    {
      neume: MeasureBar.MeasureBarShortDouble,
      icon: new URL('@/assets/icons/barline-short-double.svg', import.meta.url)
        .href,
    },
    {
      neume: MeasureBar.MeasureBarTop,
      icon: new URL('@/assets/icons/barline-short-single.svg', import.meta.url)
        .href,
    },
    {
      neume: MeasureBar.MeasureBarTheseos,
      icon: new URL('@/assets/icons/barline-theseos.svg', import.meta.url).href,
    },
    {
      neume: MeasureBar.MeasureBarDouble,
      icon: new URL('@/assets/icons/barline-double.svg', import.meta.url).href,
    },
    {
      neume: MeasureBar.MeasureBarRight,
      icon: new URL('@/assets/icons/barline-single.svg', import.meta.url).href,
    },
  ];

  measureNumberMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: MeasureNumber.Eight,
      icon: new URL('@/assets/icons/measure-number-8.svg', import.meta.url)
        .href,
    },
    {
      neume: MeasureNumber.Seven,
      icon: new URL('@/assets/icons/measure-number-7.svg', import.meta.url)
        .href,
    },
    {
      neume: MeasureNumber.Six,
      icon: new URL('@/assets/icons/measure-number-6.svg', import.meta.url)
        .href,
    },
    {
      neume: MeasureNumber.Five,
      icon: new URL('@/assets/icons/measure-number-5.svg', import.meta.url)
        .href,
    },
    {
      neume: MeasureNumber.Four,
      icon: new URL('@/assets/icons/measure-number-4.svg', import.meta.url)
        .href,
    },
    {
      neume: MeasureNumber.Three,
      icon: new URL('@/assets/icons/measure-number-3.svg', import.meta.url)
        .href,
    },
    {
      neume: MeasureNumber.Two,
      icon: new URL('@/assets/icons/measure-number-2.svg', import.meta.url)
        .href,
    },
  ];

  isonMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: Ison.ZoHigh,
      icon: new URL('@/assets/icons/ison-zo-high.svg', import.meta.url).href,
    },
    {
      neume: Ison.Ke,
      icon: new URL('@/assets/icons/ison-ke.svg', import.meta.url).href,
    },
    {
      neume: Ison.Thi,
      icon: new URL('@/assets/icons/ison-di.svg', import.meta.url).href,
    },
    {
      neume: Ison.Ga,
      icon: new URL('@/assets/icons/ison-ga.svg', import.meta.url).href,
    },
    {
      neume: Ison.Vou,
      icon: new URL('@/assets/icons/ison-vou.svg', import.meta.url).href,
    },
    {
      neume: Ison.Pa,
      icon: new URL('@/assets/icons/ison-pa.svg', import.meta.url).href,
    },
    {
      neume: Ison.Ni,
      icon: new URL('@/assets/icons/ison-ni.svg', import.meta.url).href,
    },
    {
      neume: Ison.Zo,
      icon: new URL('@/assets/icons/ison-zo.svg', import.meta.url).href,
    },
    {
      neume: Ison.KeLow,
      icon: new URL('@/assets/icons/ison-ke-low.svg', import.meta.url).href,
    },
    {
      neume: Ison.ThiLow,
      icon: new URL('@/assets/icons/ison-di-low.svg', import.meta.url).href,
    },
    {
      neume: Ison.Unison,
      icon: new URL('@/assets/icons/ison-unison.svg', import.meta.url).href,
    },
  ];

  get isMultiNeume() {
    return takesSecondaryNeumes(this.element.quantitativeNeume);
  }

  get hasTertiaryNeume() {
    return takesTertiaryNeumes(this.element.quantitativeNeume);
  }

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

  get showChromaticFthoraNote() {
    return (
      this.element.fthora != null &&
      this.chromaticFthoras.includes(this.element.fthora)
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

  get isonDisabled() {
    return restNeumes.includes(this.element.quantitativeNeume);
  }

  get spathiDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions &&
      !this.element.scaleNotes.includes(ScaleNote.Ke) &&
      !this.element.scaleNotes.includes(ScaleNote.Ga)
    );
  }

  get spathiTitle() {
    return this.spathiDisabled ? 'Spathi may only be placed on Ke or Ga' : '';
  }

  get klitonDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions &&
      !this.element.scaleNotes.includes(ScaleNote.Thi)
    );
  }

  get klitonTitle() {
    return this.klitonDisabled ? 'Kliton may only be placed on Thi' : '';
  }

  get zygosDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions &&
      !this.element.scaleNotes.includes(ScaleNote.Thi)
    );
  }

  get zygosTitle() {
    return this.zygosDisabled ? 'Zygos may only be placed on Thi' : '';
  }

  get enharmonicDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions &&
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
    return (
      !this.pageSetup.noFthoraRestrictions &&
      !this.element.scaleNotes.includes(ScaleNote.Ke)
    );
  }

  get generalFlatTitle() {
    return this.generalFlatDisabled
      ? 'General flat may only be placed on Ke'
      : '';
  }

  get generalSharpDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions &&
      !this.element.scaleNotes.includes(ScaleNote.Ga)
    );
  }

  get generalSharpTitle() {
    return this.generalSharpDisabled
      ? 'General sharp may only be placed on Ga'
      : '';
  }

  get noteDisplay() {
    return this.element.scaleNotes.map((x) => this.getNoteName(x)).join(' - ');
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

  updateFthora(args: string[]) {
    if (this.innerNeume === 'Secondary') {
      this.$emit('update:secondaryFthora', args[0] + this.innerNeume);
    } else if (this.innerNeume === 'Tertiary') {
      this.$emit('update:tertiaryFthora', args[0] + this.innerNeume);
    } else {
      this.$emit('update:fthora', args);
    }
  }

  updateGorgon(args: string | string[]) {
    if (this.innerNeume === 'Secondary') {
      if (Array.isArray(args)) {
        this.$emit('update:secondaryGorgon', GorgonNeume.GorgonSecondary);
      } else {
        this.$emit('update:secondaryGorgon', args + this.innerNeume);
      }
    } else {
      this.$emit('update:gorgon', args);
    }
  }

  updateAccidental(args: string) {
    if (this.innerNeume === 'Secondary' && args.startsWith('Flat')) {
      this.$emit('update:secondaryAccidental', args + this.innerNeume);
    } else if (this.innerNeume === 'Tertiary' && args.startsWith('Flat')) {
      this.$emit('update:tertiaryAccidental', args + this.innerNeume);
    } else {
      this.$emit('update:accidental', args);
    }
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
  width: 12ch;
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

.btnNeumeSelect.selected {
  background-color: var(--btn-color-selected);
}
</style>
