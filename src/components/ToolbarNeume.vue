<template>
  <div class="neume-toolbar">
    <div class="row" v-if="secondaryNeume">
      <span>{{ $t('toolbar:neume.neumeSelect') }}</span>
      <span class="space"></span>
      <button
        v-if="tertiaryNeume"
        class="btnNeumeSelect"
        @click="$emit('update:innerNeume', 'Tertiary')"
        :class="{ selected: innerNeume === 'Tertiary' }"
      >
        <Neume
          :neume="tertiaryNeume"
          :fontFamily="pageSetup.neumeDefaultFontFamily"
        />
      </button>
      <button
        @click="$emit('update:innerNeume', 'Secondary')"
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Secondary' }"
      >
        <Neume
          :neume="secondaryNeume"
          :fontFamily="pageSetup.neumeDefaultFontFamily"
        />
      </button>
      <button
        @click="$emit('update:innerNeume', 'Primary')"
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Primary' }"
      >
        <Neume
          :neume="primaryNeume!"
          :fontFamily="pageSetup.neumeDefaultFontFamily"
        />
      </button>
    </div>
    <div class="row">
      <button
        class="neume-button"
        :disabled="klasmaDisabled"
        :title="tooltip(TimeNeume.Klasma_Top)"
        @click="$emit('update:klasma')"
      >
        <img src="@/assets/icons/time-klasma.svg" />
      </button>
      <ButtonWithMenu
        :options="apliMenuOptions"
        :disabled="apleDisabled"
        :title="tooltip(TimeNeume.Hapli)"
        @select="$emit('update:time', $event)"
      />
      <button
        class="neume-button"
        :disabled="koronisDisabled"
        :title="tooltip(TimeNeume.Koronis)"
        @click="$emit('update', { koronis: !element.koronis })"
      >
        <img src="@/assets/icons/time-koronis.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="stavrosDisabled"
        :title="tooltip(VocalExpressionNeume.Cross_Top)"
        @click="$emit('update', { stavros: !element.stavros })"
      >
        <img src="@/assets/icons/time-stavros.svg" />
      </button>
      <span class="space"></span>

      <ButtonWithMenu
        :options="gorgonMenuOptions"
        :title="tooltip(GorgonNeume.Gorgon_Top)"
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="digorgonMenuOptions"
        :title="tooltip(GorgonNeume.Digorgon)"
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="trigorgonMenuOptions"
        :title="tooltip(GorgonNeume.Trigorgon)"
        @select="updateGorgon($event)"
      />
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Vareia)"
        @click="$emit('update', { vareia: !element.vareia })"
      >
        <img src="@/assets/icons/quality-vareia.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Homalon)"
        @click="$emit('update:expression', VocalExpressionNeume.Homalon)"
      >
        <img src="@/assets/icons/quality-omalon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.HomalonConnecting)"
        @click="
          $emit('update:expression', VocalExpressionNeume.HomalonConnecting)
        "
      >
        <img src="@/assets/icons/quality-omalon-connecting.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Antikenoma)"
        @click="$emit('update:expression', VocalExpressionNeume.Antikenoma)"
      >
        <img src="@/assets/icons/quality-antikenoma.svg" />
      </button>
      <ButtonWithMenu
        :options="psifistonMenuOptions"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Psifiston)"
        @select="$emit('update:expression', $event)"
      />
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Heteron)"
        @click="$emit('update:expression', VocalExpressionNeume.Heteron)"
      >
        <img src="@/assets/icons/quality-heteron.svg" />
      </button>
      <ButtonWithMenu
        :options="heteronConnectingMenuOptions"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.HeteronConnecting)"
        @select="$emit('update:expression', $event)"
      />
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Endofonon)"
        @click="$emit('update:expression', VocalExpressionNeume.Endofonon)"
      >
        <img src="@/assets/icons/quality-endofonon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(Tie.YfenBelow)"
        @click="$emit('update:tie', [Tie.YfenBelow, Tie.YfenAbove])"
      >
        <img src="@/assets/icons/tie-yfen-below.svg" />
      </button>
      <span class="space"></span>
      <ButtonWithMenu
        :options="flatMenuOptions"
        :disabled="accidentalsDisabled"
        :title="tooltip(Accidental.Flat_2_Right)"
        @select="updateAccidental($event)"
      />
      <ButtonWithMenu
        :options="sharpMenuOptions"
        :disabled="accidentalsDisabled"
        :title="tooltip(Accidental.Sharp_2_Left)"
        @select="updateAccidental($event)"
      />
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="argonDisabled"
        :title="tooltip(GorgonNeume.Argon)"
        @click="$emit('update:gorgon', [GorgonNeume.Argon])"
      >
        <img src="@/assets/icons/time-argon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="argonDisabled"
        :title="tooltip(GorgonNeume.Hemiolion)"
        @click="$emit('update:gorgon', [GorgonNeume.Hemiolion])"
      >
        <img src="@/assets/icons/time-diargon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="argonDisabled"
        :title="tooltip(GorgonNeume.Diargon)"
        @click="$emit('update:gorgon', [GorgonNeume.Diargon])"
      >
        <img src="@/assets/icons/time-triargon.svg" />
      </button>
      <span class="space"></span>
      <ButtonWithMenu
        :options="barlineMenuOptions"
        :title="tooltip(MeasureBar.MeasureBarRight)"
        @select="$emit('update:measureBar', $event)"
      />
      <ButtonWithMenu
        :options="measureNumberMenuOptions"
        :title="tooltip(MeasureNumber.Two)"
        @select="$emit('update:measureNumber', $event)"
      />
      <button
        class="neume-button"
        :title="tooltip(NoteIndicator.Pa)"
        @click="$emit('update', { noteIndicator: !element.noteIndicator })"
      >
        <img draggable="false" src="@/assets/icons/note-ni.svg" />
      </button>
      <ButtonWithMenu
        :options="isonMenuOptions"
        :disabled="isonDisabled"
        :title="tooltip(Ison.Unison)"
        @select="$emit('update:ison', $event)"
      />
    </div>
    <div class="row">
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicNiLow_Top)"
        @click="
          updateFthora([Fthora.DiatonicNiLow_Top, Fthora.DiatonicNiLow_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicPa_Top)"
        @click="updateFthora([Fthora.DiatonicPa_Top, Fthora.DiatonicPa_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-pa.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicVou_Top)"
        @click="
          updateFthora([Fthora.DiatonicVou_Top, Fthora.DiatonicVou_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicGa_Top)"
        @click="updateFthora([Fthora.DiatonicGa_Top, Fthora.DiatonicGa_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicThi_Top)"
        @click="
          updateFthora([Fthora.DiatonicThi_Top, Fthora.DiatonicThi_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-di.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicKe_Top)"
        @click="updateFthora([Fthora.DiatonicKe_Top, Fthora.DiatonicKe_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-ke.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicZo_Top)"
        @click="updateFthora([Fthora.DiatonicZo_Top, Fthora.DiatonicZo_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicNiHigh_Top)"
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
        :title="tooltip(Fthora.SoftChromaticThi_Top)"
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
        :title="tooltip(Fthora.SoftChromaticPa_Top)"
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
        :title="tooltip(Fthora.HardChromaticPa_Top)"
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
        :title="tooltip(Fthora.HardChromaticThi_Top)"
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

      <label class="right-space">{{ $t('toolbar:common.spaceAfter') }}</label>

      <InputUnit
        unit="pt"
        :min="-spaceAfterMax"
        :max="spaceAfterMax"
        :step="0.5"
        :precision="2"
        :modelValue="element.spaceAfter"
        @update:modelValue="$emit('update', { spaceAfter: $event })"
      />
      <span class="space"></span>

      <button @click="$emit('open-syllable-positioning-dialog')">
        {{ $t('toolbar:neume.positioning') }}
      </button>
      <span class="space" />

      <div style="display: flex; align-items: center">
        <input
          id="toolbar:neume-ignore-attractions"
          type="checkbox"
          :checked="element.ignoreAttractions"
          @change="
            $emit('update', {
              ignoreAttractions: ($event.target as HTMLInputElement).checked,
            } as Partial<NoteElement>)
          "
        />
        <label for="toolbar:neume-ignore-attractions">{{
          $t('toolbar:common.ignoreAttractions')
        }}</label>
      </div>

      <span class="space" />

      <div style="display: flex; align-items: center">
        <label class="right-space" for="toolbar:neume-accepts-lyrics">{{
          $t('toolbar:neume.acceptsLyrics')
        }}</label>
        <select
          id="toolbar:neume-accepts-lyrics"
          :value="element.acceptsLyrics"
          @change="
            $emit('update', {
              acceptsLyrics: ($event.target as HTMLSelectElement).value,
            } as Partial<NoteElement>)
          "
        >
          <option :value="AcceptsLyricsOption.Default">
            {{ $t('toolbar:neume.acceptsLyricsDefault') }}
          </option>
          <option :value="AcceptsLyricsOption.Yes">
            {{ $t('toolbar:neume.acceptsLyricsYes') }}
          </option>
          <option :value="AcceptsLyricsOption.No">
            {{ $t('toolbar:neume.acceptsLyricsNo') }}
          </option>
          <option :value="AcceptsLyricsOption.MelismaOnly">
            {{ $t('toolbar:neume.acceptsLyricsMelismaOnly') }}
          </option>
        </select>
      </div>

      <template v-if="showChromaticFthoraNote">
        <span class="space" />
        <label class="right-space">{{ $t('toolbar:common.fthoraNote') }}</label>
        <select
          :value="chromaticFthoraNote"
          @change="
            updateChromaticFthoraNote(($event.target as HTMLInputElement).value)
          "
        >
          <option v-for="note in notes" :key="note.value" :value="note.value">
            {{ $t(note.label) }}
          </option>
        </select>
      </template>

      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t('toolbar:common.sectionName')
        }}</label>
        <input
          type="text"
          :value="element.sectionName"
          @change="
            $emit(
              'update:sectionName',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import ButtonWithMenu, {
  ButtonWithMenuOption,
} from '@/components/ButtonWithMenu.vue';
import InputUnit from '@/components/InputUnit.vue';
import { AcceptsLyricsOption, NoteElement } from '@/models/Element';
import {
  getPrimaryNeume,
  getSecondaryNeume,
  getTertiaryNeume,
  kentemataNeumes,
} from '@/models/NeumeReplacements';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  Neume,
  NoteIndicator,
  QuantitativeNeume,
  restNeumes,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { ScaleNote } from '@/models/Scales';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { Unit } from '@/utils/Unit';

import NeumeVue from './NeumeGlyph.vue';

const chromaticFthoras = [
  Fthora.SoftChromaticPa_Top,
  Fthora.SoftChromaticPa_Bottom,
  Fthora.SoftChromaticThi_Top,
  Fthora.SoftChromaticThi_Bottom,
  Fthora.HardChromaticPa_Top,
  Fthora.HardChromaticPa_Bottom,
  Fthora.HardChromaticThi_Top,
  Fthora.HardChromaticThi_Bottom,

  Fthora.SoftChromaticPa_TopSecondary,
  Fthora.SoftChromaticThi_TopSecondary,
  Fthora.HardChromaticPa_TopSecondary,
  Fthora.HardChromaticThi_TopSecondary,

  Fthora.SoftChromaticPa_TopTertiary,
  Fthora.SoftChromaticThi_TopTertiary,
  Fthora.HardChromaticPa_TopTertiary,
  Fthora.HardChromaticThi_TopTertiary,
];

const apliMenuOptions: ButtonWithMenuOption[] = [
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

const gorgonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: GorgonNeume.GorgonDottedRight,
    icon: new URL(
      '@/assets/icons/time-gorgon-dotted-right.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: GorgonNeume.GorgonDottedLeft,
    icon: new URL('@/assets/icons/time-gorgon-dotted-left.svg', import.meta.url)
      .href,
  },
  {
    neume: [GorgonNeume.Gorgon_Top, GorgonNeume.Gorgon_Bottom],
    icon: new URL('@/assets/icons/time-gorgon.svg', import.meta.url).href,
  },
];

const digorgonMenuOptions: ButtonWithMenuOption[] = [
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

const trigorgonMenuOptions: ButtonWithMenuOption[] = [
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

const psifistonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: VocalExpressionNeume.PsifistonSlanted,
    icon: new URL(
      '@/assets/icons/quality-psifiston-slanted.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: VocalExpressionNeume.Psifiston,
    icon: new URL('@/assets/icons/quality-psifiston.svg', import.meta.url).href,
  },
];

const heteronConnectingMenuOptions: ButtonWithMenuOption[] = [
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

const flatMenuOptions: ButtonWithMenuOption[] = [
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

const sharpMenuOptions: ButtonWithMenuOption[] = [
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

const barlineMenuOptions: ButtonWithMenuOption[] = [
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

const measureNumberMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: MeasureNumber.Eight,
    icon: new URL('@/assets/icons/measure-number-8.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Seven,
    icon: new URL('@/assets/icons/measure-number-7.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Six,
    icon: new URL('@/assets/icons/measure-number-6.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Five,
    icon: new URL('@/assets/icons/measure-number-5.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Four,
    icon: new URL('@/assets/icons/measure-number-4.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Three,
    icon: new URL('@/assets/icons/measure-number-3.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Two,
    icon: new URL('@/assets/icons/measure-number-2.svg', import.meta.url).href,
  },
];

const isonMenuOptions: ButtonWithMenuOption[] = [
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

function getNoteName(note: ScaleNote) {
  if (note == null) {
    return '???';
  }

  switch (note) {
    case ScaleNote.ZoLow:
      return 'model:note.zoLow';
    case ScaleNote.NiLow:
      return 'model:note.niLow';
    case ScaleNote.PaLow:
      return 'model:note.paLow';
    case ScaleNote.VouLow:
      return 'model:note.vouLow';
    case ScaleNote.GaLow:
      return 'model:note.gaLow';
    case ScaleNote.ThiLow:
      return 'model:note.diLow';
    case ScaleNote.KeLow:
      return 'model:note.keLow';
    case ScaleNote.Zo:
      return 'model:note.zo';
    case ScaleNote.Ni:
      return 'model:note.ni';
    case ScaleNote.Pa:
      return 'model:note.pa';
    case ScaleNote.Vou:
      return 'model:note.vou';
    case ScaleNote.Ga:
      return 'model:note.ga';
    case ScaleNote.Thi:
      return 'model:note.di';
    case ScaleNote.Ke:
      return 'model:note.ke';
    case ScaleNote.ZoHigh:
      return 'model:note.zoHigh';
    case ScaleNote.NiHigh:
      return 'model:note.niHigh';
    case ScaleNote.PaHigh:
      return 'model:note.paHigh';
    case ScaleNote.VouHigh:
      return 'model:note.vouHigh';
    case ScaleNote.GaHigh:
      return 'model:note.gaHigh';
    case ScaleNote.ThiHigh:
      return 'model:note.diHigh';
    case ScaleNote.KeHigh:
      return 'model:note.keHigh';
    default:
      return note;
  }
}

function getDisplayName(neume: Neume) {
  switch (neume) {
    case TimeNeume.Klasma_Top:
      return 'model:neume.time.klasma';
    case TimeNeume.Hapli:
      return 'model:neume.time.hapli';
    case TimeNeume.Koronis:
      return 'model:neume.time.koronis';
    case VocalExpressionNeume.Cross_Top:
      return 'model:neume.quantitative.cross';
    case GorgonNeume.Gorgon_Top:
      return 'model:neume.gorgon.gorgon';
    case GorgonNeume.Digorgon:
      return 'model:neume.gorgon.digorgon';
    case GorgonNeume.Trigorgon:
      return 'model:neume.gorgon.trigorgon';
    case VocalExpressionNeume.Vareia:
      return 'model:neume.vocalExpression.vareia';
    case VocalExpressionNeume.Homalon:
      return 'model:neume.vocalExpression.homalon';
    case VocalExpressionNeume.HomalonConnecting:
      return 'model:neume.vocalExpression.connectingHomalon';
    case VocalExpressionNeume.Antikenoma:
      return 'model:neume.vocalExpression.antikenoma';
    case VocalExpressionNeume.Psifiston:
      return 'model:neume.vocalExpression.psifiston';
    case VocalExpressionNeume.Heteron:
      return 'model:neume.vocalExpression.heteron';
    case VocalExpressionNeume.HeteronConnecting:
      return 'model:neume.vocalExpression.connectingHeteron';
    case VocalExpressionNeume.Endofonon:
      return 'model:neume.vocalExpression.endofonon';
    case Tie.YfenBelow:
      return 'toolbar:neume.yfen';
    case Accidental.Flat_2_Right:
      return 'toolbar:neume.flat';
    case Accidental.Sharp_2_Left:
      return 'toolbar:neume.sharp';
    case GorgonNeume.Argon:
      return 'model:neume.gorgon.argon';
    case GorgonNeume.Hemiolion:
      return 'model:neume.gorgon.hemiolion';
    case GorgonNeume.Diargon:
      return 'model:neume.gorgon.diargon';
    case MeasureBar.MeasureBarRight:
      return 'toolbar:common.measureBar';
    case MeasureNumber.Two:
      return 'toolbar:neume.measureNumber';
    case NoteIndicator.Pa:
      return 'toolbar:neume.noteIndicator';
    case Ison.Unison:
      return 'toolbar:neume.isonIndicator';
    case Fthora.DiatonicNiLow_Top:
      return 'model:neume.fthora.diatonicNiLow';
    case Fthora.DiatonicPa_Top:
      return 'model:neume.fthora.diatonicPa';
    case Fthora.DiatonicVou_Top:
      return 'model:neume.fthora.diatonicVou';
    case Fthora.DiatonicGa_Top:
      return 'model:neume.fthora.diatonicGa';
    case Fthora.DiatonicThi_Top:
      return 'model:neume.fthora.diatonicDi';
    case Fthora.DiatonicKe_Top:
      return 'model:neume.fthora.diatonicKe';
    case Fthora.DiatonicZo_Top:
      return 'model:neume.fthora.diatonicZo';
    case Fthora.DiatonicNiHigh_Top:
      return 'model:neume.fthora.diatonicNiHigh';
    case Fthora.SoftChromaticThi_Top:
      return 'model:neume.fthora.softChromaticDi';
    case Fthora.SoftChromaticPa_Top:
      return 'model:neume.fthora.softChromaticGa';
    case Fthora.HardChromaticPa_Top:
      return 'model:neume.fthora.hardChromaticPa';
    case Fthora.HardChromaticThi_Top:
      return 'model:neume.fthora.hardChromaticDi';
    case Fthora.Enharmonic_Top:
      return 'model:neume.fthora.enharmonic';
    case Fthora.GeneralFlat_Top:
      return 'model:neume.fthora.generalFlat';
    case Fthora.GeneralSharp_Top:
      return 'model:neume.fthora.generalSharp';
    case Fthora.Zygos_Top:
      return 'model:neume.fthora.zygos';
    case Fthora.Kliton_Top:
      return 'model:neume.fthora.kliton';
    case Fthora.Spathi_Top:
      return 'model:neume.fthora.spathi';
    default:
      return neume;
  }
}

export default defineComponent({
  components: { InputUnit, ButtonWithMenu, Neume: NeumeVue },
  emits: [
    'update',
    'open-syllable-positioning-dialog',
    'update:accidental',
    'update:expression',
    'update:fthora',
    'update:gorgon',
    'update:innerNeume',
    'update:ison',
    'update:klasma',
    'update:measureBar',
    'update:measureNumber',
    'update:secondaryAccidental',
    'update:secondaryFthora',
    'update:secondaryGorgon',
    'update:sectionName',
    'update:tertiaryAccidental',
    'update:tertiaryFthora',
    'update:tie',
    'update:time',
  ],
  props: {
    element: {
      type: Object as PropType<NoteElement>,
      required: true,
    },
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
    innerNeume: {
      type: String,
      required: true,
    },
    neumeKeyboard: {
      type: Object as PropType<NeumeKeyboard>,
      required: true,
    },
  },

  data() {
    return {
      Accidental,
      GorgonNeume,
      Fthora,
      MeasureBar,
      MeasureNumber,
      NoteIndicator,
      Ison,
      Tie,
      TimeNeume,
      VocalExpressionNeume,

      AcceptsLyricsOption,

      chromaticFthoras,
      apliMenuOptions,
      gorgonMenuOptions,
      digorgonMenuOptions,
      trigorgonMenuOptions,
      sharpMenuOptions,
      flatMenuOptions,
      isonMenuOptions,
      psifistonMenuOptions,
      heteronConnectingMenuOptions,
      barlineMenuOptions,
      measureNumberMenuOptions,
    };
  },

  computed: {
    primaryNeume() {
      return getPrimaryNeume(this.element.quantitativeNeume);
    },

    secondaryNeume() {
      return getSecondaryNeume(this.element.quantitativeNeume);
    },

    tertiaryNeume() {
      return getTertiaryNeume(this.element.quantitativeNeume);
    },

    notes() {
      if (
        this.element.fthora === Fthora.SoftChromaticThi_Top ||
        this.element.fthora === Fthora.SoftChromaticThi_Bottom ||
        this.element.secondaryFthora === Fthora.SoftChromaticThi_TopSecondary ||
        this.element.tertiaryFthora === Fthora.SoftChromaticThi_TopTertiary
      ) {
        return [
          { label: 'model:note.zoHigh', value: ScaleNote.ZoHigh },
          { label: 'model:note.di', value: ScaleNote.Thi },
          { label: 'model:note.vou', value: ScaleNote.Vou },
          { label: 'model:note.ni', value: ScaleNote.Ni },
        ];
      } else if (
        this.element.fthora === Fthora.SoftChromaticPa_Top ||
        this.element.fthora === Fthora.SoftChromaticPa_Bottom ||
        this.element.secondaryFthora === Fthora.SoftChromaticPa_TopSecondary ||
        this.element.tertiaryFthora === Fthora.SoftChromaticPa_TopTertiary
      ) {
        return [
          { label: `model:note.niHigh`, value: ScaleNote.NiHigh },
          { label: 'model:note.ke', value: ScaleNote.Ke },
          { label: 'model:note.ga', value: ScaleNote.Ga },
          { label: 'model:note.pa', value: ScaleNote.Pa },
        ];
      } else if (
        this.element.fthora === Fthora.HardChromaticThi_Top ||
        this.element.fthora === Fthora.HardChromaticThi_Bottom ||
        this.element.secondaryFthora === Fthora.HardChromaticThi_TopSecondary ||
        this.element.tertiaryFthora === Fthora.HardChromaticThi_TopTertiary
      ) {
        return [
          { label: 'model:note.zoHigh', value: ScaleNote.ZoHigh },
          { label: 'model:note.di', value: ScaleNote.Thi },
          { label: 'model:note.vou', value: ScaleNote.Vou },
        ];
      } else if (
        this.element.fthora === Fthora.HardChromaticPa_Top ||
        this.element.fthora === Fthora.HardChromaticPa_Bottom ||
        this.element.secondaryFthora === Fthora.HardChromaticPa_TopSecondary ||
        this.element.tertiaryFthora === Fthora.HardChromaticPa_TopTertiary
      ) {
        return [
          { label: `model:note.niHigh`, value: ScaleNote.NiHigh },
          { label: 'model:note.ke', value: ScaleNote.Ke },
          { label: 'model:note.ga', value: ScaleNote.Ga },
          { label: 'model:note.pa', value: ScaleNote.Pa },
        ];
      }

      return [];
    },

    showChromaticFthoraNote() {
      return (
        (this.innerNeume === 'Primary' &&
          this.element.fthora != null &&
          this.chromaticFthoras.includes(this.element.fthora)) ||
        (this.innerNeume === 'Secondary' &&
          this.element.secondaryFthora != null &&
          this.chromaticFthoras.includes(this.element.secondaryFthora)) ||
        (this.innerNeume === 'Tertiary' &&
          this.element.tertiaryFthora != null &&
          this.chromaticFthoras.includes(this.element.tertiaryFthora))
      );
    },

    fthoresDisabled() {
      return restNeumes.includes(this.element.quantitativeNeume);
    },

    expressionsDisabled() {
      return restNeumes.includes(this.element.quantitativeNeume);
    },

    accidentalsDisabled() {
      return restNeumes.includes(this.element.quantitativeNeume);
    },

    klasmaDisabled() {
      return (
        restNeumes.includes(this.element.quantitativeNeume) ||
        kentemataNeumes.includes(this.element.quantitativeNeume)
      );
    },

    apleDisabled() {
      return (
        restNeumes.includes(this.element.quantitativeNeume) ||
        kentemataNeumes.includes(this.element.quantitativeNeume)
      );
    },

    koronisDisabled() {
      return (
        restNeumes.includes(this.element.quantitativeNeume) ||
        kentemataNeumes.includes(this.element.quantitativeNeume)
      );
    },

    stavrosDisabled() {
      return (
        this.element.quantitativeNeume !== QuantitativeNeume.RunningElaphron
      );
    },

    argonDisabled() {
      return (
        this.element.quantitativeNeume !== QuantitativeNeume.KentemataPlusOligon
      );
    },

    isonDisabled() {
      return restNeumes.includes(this.element.quantitativeNeume);
    },

    spathiDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.Ke) &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.Ga)
      );
    },

    spathiTitle() {
      return this.spathiDisabled
        ? this.$t('toolbar:common.spathiDisabled')
        : this.tooltip(Fthora.Spathi_Top);
    },

    klitonDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.Thi)
      );
    },

    klitonTitle() {
      return this.klitonDisabled
        ? this.$t('toolbar:common.klitonDisabled')
        : this.tooltip(Fthora.Kliton_Top);
    },

    zygosDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.Thi)
      );
    },

    zygosTitle() {
      return this.zygosDisabled
        ? this.$t('toolbar:common.zygosDisabled')
        : this.tooltip(Fthora.Zygos_Top);
    },

    enharmonicDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.Zo) &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.ZoHigh) &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.Vou) &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.VouHigh) &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.Ga)
      );
    },

    enharmonicTitle() {
      return this.enharmonicDisabled
        ? this.$t('toolbar:common.enharmonicDisabled')
        : this.tooltip(Fthora.Enharmonic_Top);
    },

    generalFlatDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.Ke)
      );
    },

    generalFlatTitle() {
      return this.generalFlatDisabled
        ? this.$t('toolbar:common.generalFlatDisabled')
        : this.tooltip(Fthora.GeneralFlat_Top);
    },

    generalSharpDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions &&
        !this.element.scaleNotesVirtual.includes(ScaleNote.Ga)
      );
    },

    generalSharpTitle() {
      return this.generalSharpDisabled
        ? this.$t('toolbar:common.generalSharpDisabled')
        : this.tooltip(Fthora.GeneralSharp_Top);
    },

    chromaticFthoraNote() {
      if (this.innerNeume === 'Secondary') {
        return this.element.secondaryChromaticFthoraNote;
      } else if (this.innerNeume === 'Tertiary') {
        return this.element.tertiaryChromaticFthoraNote;
      } else {
        return this.element.chromaticFthoraNote;
      }
    },

    noteDisplay() {
      return this.element.scaleNotes
        .map((x) => this.$t(getNoteName(x)))
        .join(' - ');
    },
    spaceAfterMax() {
      return Math.round(Unit.toPt(this.pageSetup.pageWidth));
    },
  },

  methods: {
    updateFthora(args: string[]) {
      if (this.innerNeume === 'Secondary') {
        this.$emit('update:secondaryFthora', args[0] + this.innerNeume);
      } else if (this.innerNeume === 'Tertiary') {
        this.$emit('update:tertiaryFthora', args[0] + this.innerNeume);
      } else {
        this.$emit('update:fthora', args);
      }
    },

    updateChromaticFthoraNote(note: string) {
      if (this.innerNeume === 'Secondary') {
        this.$emit('update', {
          secondaryChromaticFthoraNote: note,
        } as Partial<NoteElement>);
      } else if (this.innerNeume === 'Tertiary') {
        this.$emit('update', {
          tertiaryChromaticFthoraNote: note,
        } as Partial<NoteElement>);
      } else {
        this.$emit('update', {
          chromaticFthoraNote: note,
        } as Partial<NoteElement>);
      }
    },

    updateGorgon(args: string | string[]) {
      if (
        this.innerNeume === 'Secondary' &&
        this.element.quantitativeNeume !== QuantitativeNeume.Hyporoe
      ) {
        if (Array.isArray(args)) {
          this.$emit('update:secondaryGorgon', GorgonNeume.GorgonSecondary);
        } else {
          this.$emit('update:secondaryGorgon', args + this.innerNeume);
        }
      } else {
        this.$emit('update:gorgon', args);
      }
    },

    updateAccidental(args: string) {
      // There is some admittedly confusing logic here regarding the hyporoe.
      // Compare to handleHyporoe in the Analysis Service.

      if (this.innerNeume === 'Secondary') {
        if (
          this.element.quantitativeNeume == QuantitativeNeume.Hyporoe &&
          args.startsWith('Flat')
        ) {
          this.$emit('update:accidental', args);
        } else {
          this.$emit('update:secondaryAccidental', args + this.innerNeume);
        }
      } else if (this.innerNeume === 'Tertiary') {
        this.$emit('update:tertiaryAccidental', args + this.innerNeume);
      } else {
        if (
          this.element.quantitativeNeume == QuantitativeNeume.Hyporoe &&
          args.startsWith('Flat')
        ) {
          this.$emit('update:secondaryAccidental', args + 'Secondary');
        } else {
          this.$emit('update:accidental', args);
        }
      }
    },

    tooltip(neume: Neume) {
      const displayName = getDisplayName(neume);
      const mapping = this.neumeKeyboard.findMappingForNeume(neume);
      if (mapping) {
        return `${this.$t(displayName)} (${this.neumeKeyboard.generateTooltip(
          mapping,
        )})`;
      } else if (neume === TimeNeume.Klasma_Top) {
        return `${this.$t(
          'model:neume.time.klasma',
        )} (${this.neumeKeyboard.getKlasmaKeyTooltip()})`;
      } else if (neume === NoteIndicator.Pa) {
        return `${this.$t(
          'toolbar:neume.noteIndicator',
        )} (${this.neumeKeyboard.getNoteIndicatorKeyTooltip()})`;
      } else {
        return `${this.$t(displayName)}`;
      }
    },
  },
});
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

.btnNeumeSelect {
  font-size: 24px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btnNeumeSelect.selected {
  background-color: var(--btn-color-selected);
}
</style>
