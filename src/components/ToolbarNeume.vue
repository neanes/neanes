<template>
  <div class="neume-toolbar p-1">
    <div v-if="secondaryNeume" class="row">
      <span>{{
        $t(($) => $.toolbar.neume.neumeSelect, { ns: 'toolbar' })
      }}</span>
      <span class="space"></span>
      <button
        v-if="tertiaryNeume"
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Tertiary' }"
        :aria-label="$t(($) => $.toolbar.neume.neumeSelect, { ns: 'toolbar' })"
        @click="$emit('update:innerNeume', 'Tertiary')"
      >
        <Neume
          :neume="tertiaryNeume"
          :font-family="pageSetup.neumeDefaultFontFamily"
        />
      </button>
      <button
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Secondary' }"
        :aria-label="$t(($) => $.toolbar.neume.neumeSelect, { ns: 'toolbar' })"
        @click="$emit('update:innerNeume', 'Secondary')"
      >
        <Neume
          :neume="secondaryNeume"
          :font-family="pageSetup.neumeDefaultFontFamily"
        />
      </button>
      <button
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Primary' }"
        :aria-label="$t(($) => $.toolbar.neume.neumeSelect, { ns: 'toolbar' })"
        @click="$emit('update:innerNeume', 'Primary')"
      >
        <Neume
          :neume="primaryNeume!"
          :font-family="pageSetup.neumeDefaultFontFamily"
        />
      </button>
    </div>
    <Toolbar class="row h-auto w-full gap-0 border-0 p-0" loop>
      <AppTooltip :tooltip="tooltip(TimeNeume.Klasma_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="klasmaDisabled"
          @click="!klasmaDisabled && $emit('update:klasma')"
        >
          <img src="@/assets/icons/time-klasma.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ButtonWithMenu
        :options="apliMenuOptions"
        :disabled="apleDisabled"
        :tooltip="tooltip(TimeNeume.Hapli)"
        @select="$emit('update:time', $event)"
      />
      <AppTooltip :tooltip="tooltip(TimeNeume.Koronis)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="koronisDisabled"
          @click="
            !koronisDisabled && $emit('update', { koronis: !element.koronis })
          "
        >
          <img src="@/assets/icons/time-koronis.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Cross_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="stavrosDisabled"
          @click="
            !stavrosDisabled && $emit('update', { stavros: !element.stavros })
          "
        >
          <img src="@/assets/icons/time-stavros.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />

      <ButtonWithMenu
        :options="gorgonMenuOptions"
        :tooltip="tooltip(GorgonNeume.Gorgon_Top)"
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="digorgonMenuOptions"
        :tooltip="tooltip(GorgonNeume.Digorgon)"
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="trigorgonMenuOptions"
        :tooltip="tooltip(GorgonNeume.Trigorgon)"
        @select="updateGorgon($event)"
      />
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Vareia)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled && $emit('update', { vareia: !element.vareia })
          "
        >
          <img src="@/assets/icons/quality-vareia.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Homalon)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.Homalon)
          "
        >
          <img src="@/assets/icons/quality-omalon.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.HomalonConnecting)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.HomalonConnecting)
          "
        >
          <img src="@/assets/icons/quality-omalon-connecting.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Antikenoma)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.Antikenoma)
          "
        >
          <img src="@/assets/icons/quality-antikenoma.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ButtonWithMenu
        :options="psifistonMenuOptions"
        :disabled="expressionsDisabled"
        :tooltip="tooltip(VocalExpressionNeume.Psifiston)"
        @select="$emit('update:expression', $event)"
      />
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Heteron)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.Heteron)
          "
        >
          <img src="@/assets/icons/quality-heteron.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ButtonWithMenu
        :options="heteronConnectingMenuOptions"
        :disabled="expressionsDisabled"
        :tooltip="tooltip(VocalExpressionNeume.HeteronConnecting)"
        @select="$emit('update:expression', $event)"
      />
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Endofonon)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.Endofonon)
          "
        >
          <img src="@/assets/icons/quality-endofonon.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Tie.YfenBelow)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:tie', [Tie.YfenBelow, Tie.YfenAbove])
          "
        >
          <img src="@/assets/icons/tie-yfen-below.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <ButtonWithMenu
        :options="flatMenuOptions"
        :disabled="accidentalsDisabled"
        :tooltip="tooltip(Accidental.Flat_2_Right)"
        @select="updateAccidental($event)"
      />
      <ButtonWithMenu
        :options="sharpMenuOptions"
        :disabled="accidentalsDisabled"
        :tooltip="tooltip(Accidental.Sharp_2_Left)"
        @select="updateAccidental($event)"
      />
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(GorgonNeume.Argon)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="argonDisabled"
          @click="!argonDisabled && $emit('update:gorgon', [GorgonNeume.Argon])"
        >
          <img src="@/assets/icons/time-argon.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(GorgonNeume.Hemiolion)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="argonDisabled"
          @click="
            !argonDisabled && $emit('update:gorgon', [GorgonNeume.Hemiolion])
          "
        >
          <img src="@/assets/icons/time-diargon.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(GorgonNeume.Diargon)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="argonDisabled"
          @click="
            !argonDisabled && $emit('update:gorgon', [GorgonNeume.Diargon])
          "
        >
          <img src="@/assets/icons/time-triargon.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <ButtonWithMenu
        :options="barlineMenuOptions"
        :tooltip="tooltip(MeasureBar.MeasureBarRight)"
        @select="$emit('update:measureBar', $event)"
      />
      <ButtonWithMenu
        :options="measureNumberMenuOptions"
        :tooltip="tooltip(MeasureNumber.Two)"
        @select="$emit('update:measureNumber', $event)"
      />
      <AppTooltip :tooltip="tooltip(NoteIndicator.Pa)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update', { noteIndicator: !element.noteIndicator })"
        >
          <img draggable="false" src="@/assets/icons/note-ni.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ButtonWithMenu
        :options="isonMenuOptions"
        :disabled="isonDisabled"
        :tooltip="tooltip(Ison.Unison)"
        @select="$emit('update:ison', $event)"
      />
    </Toolbar>
    <Toolbar class="row h-auto w-full gap-0 border-0 p-0" loop>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicNiLow_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.DiatonicNiLow_Top,
              Fthora.DiatonicNiLow_Bottom,
            ])
          "
        >
          <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicPa_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicPa_Top, Fthora.DiatonicPa_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-diatonic-pa.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicVou_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicVou_Top, Fthora.DiatonicVou_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-diatonic-vou.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicGa_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicGa_Top, Fthora.DiatonicGa_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-diatonic-ga.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicThi_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicThi_Top, Fthora.DiatonicThi_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-diatonic-di.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicKe_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicKe_Top, Fthora.DiatonicKe_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-diatonic-ke.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicZo_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicZo_Top, Fthora.DiatonicZo_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-diatonic-zo.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicNiHigh_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.DiatonicNiHigh_Top,
              Fthora.DiatonicNiHigh_Bottom,
            ])
          "
        >
          <img src="@/assets/icons/fthora-diatonic-ni-high.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(Fthora.SoftChromaticThi_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.SoftChromaticThi_Top,
              Fthora.SoftChromaticThi_Bottom,
            ])
          "
        >
          <img src="@/assets/icons/fthora-soft-chromatic-di.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.SoftChromaticPa_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.SoftChromaticPa_Top,
              Fthora.SoftChromaticPa_Bottom,
            ])
          "
        >
          <img src="@/assets/icons/fthora-soft-chromatic-ke.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(Fthora.HardChromaticPa_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.HardChromaticPa_Top,
              Fthora.HardChromaticPa_Bottom,
            ])
          "
        >
          <img src="@/assets/icons/fthora-hard-chromatic-pa.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.HardChromaticThi_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.HardChromaticThi_Top,
              Fthora.HardChromaticThi_Bottom,
            ])
          "
        >
          <img src="@/assets/icons/fthora-hard-chromatic-di.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="enharmonicTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled || enharmonicDisabled"
          @click="
            !(fthoresDisabled || enharmonicDisabled) &&
            updateFthora([Fthora.Enharmonic_Top, Fthora.Enharmonic_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-enharmonic.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="generalFlatTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled || generalFlatDisabled"
          @click="
            !(fthoresDisabled || generalFlatDisabled) &&
            updateFthora([Fthora.GeneralFlat_Top, Fthora.GeneralFlat_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-general-flat.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="generalSharpTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled || generalSharpDisabled"
          @click="
            !(fthoresDisabled || generalSharpDisabled) &&
            updateFthora([Fthora.GeneralSharp_Top, Fthora.GeneralSharp_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-general-sharp.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="zygosTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled || zygosDisabled"
          @click="
            !(fthoresDisabled || zygosDisabled) &&
            updateFthora([Fthora.Zygos_Top, Fthora.Zygos_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-zygos.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="klitonTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled || klitonDisabled"
          @click="
            !(fthoresDisabled || klitonDisabled) &&
            updateFthora([Fthora.Kliton_Top, Fthora.Kliton_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-kliton.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="spathiTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="fthoresDisabled || spathiDisabled"
          @click="
            !(fthoresDisabled || spathiDisabled) &&
            updateFthora([Fthora.Spathi_Top, Fthora.Spathi_Bottom])
          "
        >
          <img src="@/assets/icons/fthora-spathi.svg" />
        </ToolbarButton>
      </AppTooltip>
    </Toolbar>
    <div class="row">
      <span class="space" />

      <span class="note-name">{{ noteDisplay }}</span>

      <span class="separator" />

      <Label for="toolbar-neume-space-after" class="mr-2">{{
        $t(($) => $.toolbar.common.spaceAfter, { ns: 'toolbar' })
      }}</Label>

      <InputUnit
        id="toolbar-neume-space-after"
        unit="pt"
        :min="-spaceAfterMax"
        :max="spaceAfterMax"
        :step="0.5"
        :format-options="fraction2FormatOptions"
        :model-value="element.spaceAfter"
        @update:model-value="$emit('update', { spaceAfter: $event })"
      />
      <span class="space"></span>

      <Button
        type="button"
        variant="secondary"
        @click="$emit('open-syllable-positioning-dialog')"
      >
        {{ $t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' }) }}
      </Button>
      <span class="space" />

      <Checkbox
        id="toolbar:neume-ignore-attractions"
        class="bg-background"
        :model-value="element.ignoreAttractions"
        @update:model-value="
          $emit('update', {
            ignoreAttractions: $event === true,
          } as Partial<NoteElement>)
        "
      />
      <Label for="toolbar:neume-ignore-attractions" class="ml-2">{{
        $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
      }}</Label>

      <span class="space" />

      <Label for="toolbar:neume-accepts-lyrics" class="mr-2">{{
        $t(($) => $.toolbar.neume.acceptsLyrics, { ns: 'toolbar' })
      }}</Label>
      <Select
        :model-value="element.acceptsLyrics"
        @update:model-value="
          $emit('update', {
            acceptsLyrics: $event,
          } as Partial<NoteElement>)
        "
      >
        <SelectTrigger id="toolbar:neume-accepts-lyrics" class="bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem :value="AcceptsLyricsOption.Default">
              {{
                $t(($) => $.toolbar.neume.acceptsLyricsDefault, {
                  ns: 'toolbar',
                })
              }}
            </SelectItem>
            <SelectItem :value="AcceptsLyricsOption.Yes">
              {{
                $t(($) => $.toolbar.neume.acceptsLyricsYes, { ns: 'toolbar' })
              }}
            </SelectItem>
            <SelectItem :value="AcceptsLyricsOption.No">
              {{
                $t(($) => $.toolbar.neume.acceptsLyricsNo, { ns: 'toolbar' })
              }}
            </SelectItem>
            <SelectItem :value="AcceptsLyricsOption.MelismaOnly">
              {{
                $t(($) => $.toolbar.neume.acceptsLyricsMelismaOnly, {
                  ns: 'toolbar',
                })
              }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <template v-if="showChromaticFthoraNote">
        <span class="space" />
        <Label for="toolbar-neume-fthora-note" class="mr-2">{{
          $t(($) => $.toolbar.common.fthoraNote, { ns: 'toolbar' })
        }}</Label>
        <Select
          :model-value="chromaticFthoraNote"
          @update:model-value="updateChromaticFthoraNote"
        >
          <SelectTrigger id="toolbar-neume-fthora-note" class="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="note in notes"
                :key="note.value"
                :value="note.value"
              >
                {{ $t(note.label, { ns: 'model' }) }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </template>

      <span class="space"></span>
      <Label for="toolbar-neume-section-name" class="mr-2">{{
        $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
      }}</Label>
      <Input
        id="toolbar-neume-section-name"
        class="w-auto bg-background"
        type="text"
        :model-value="element.sectionName ?? ''"
        @change="
          $emit('update:sectionName', ($event.target as HTMLInputElement).value)
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import type { AppTooltipValue } from '@/components/AppTooltip.types';
import AppTooltip from '@/components/AppTooltip.vue';
import type { ButtonWithMenuOption } from '@/components/ButtonWithMenu.types';
import ButtonWithMenu from '@/components/ButtonWithMenu.vue';
import InputUnit from '@/components/InputUnit.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/ui/toolbar';
import type { NoteElement } from '@/models/Element';
import { AcceptsLyricsOption } from '@/models/Element';
import type { ModelSelector } from '@/models/NeumeI18nMappings';
import {
  getFthoraLabelSelector,
  getGorgonNeumeLabelSelector,
  getIsonLabelSelector,
  getMeasureBarLabelSelector,
  getNoteIndicatorLabelSelector,
  getNoteLabelSelector,
  getTimeNeumeLabelSelector,
  getVocalExpressionNeumeLabelSelector,
} from '@/models/NeumeI18nMappings';
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
  NoteIndicator,
  QuantitativeNeume,
  restNeumes,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { ScaleNote } from '@/models/Scales';
import type { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

import Neume from './NeumeGlyph.vue';

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

type ChromaticFthoraNoteOption = {
  label: ModelSelector;
  value: ScaleNote;
};

type ToolbarNeumeTooltipNeume =
  | Fthora
  | TimeNeume
  | VocalExpressionNeume
  | GorgonNeume
  | MeasureBar
  | NoteIndicator
  | Ison
  | Tie.YfenBelow
  | Accidental.Flat_2_Right
  | Accidental.Sharp_2_Left
  | MeasureNumber.Two;

function enumHas<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return values.includes(value as T);
}

const fthoraValues = Object.values(Fthora);
const timeNeumeValues = Object.values(TimeNeume);
const vocalExpressionNeumeValues = Object.values(VocalExpressionNeume);
const gorgonNeumeValues = Object.values(GorgonNeume);
const measureBarValues = Object.values(MeasureBar);
const noteIndicatorValues = Object.values(NoteIndicator);
const isonValues = Object.values(Ison);

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

const props = defineProps({
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
});

const emit = defineEmits([
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
]);

const { t } = useTranslation();

const primaryNeume = computed(() =>
  getPrimaryNeume(props.element.quantitativeNeume),
);

const secondaryNeume = computed(() =>
  getSecondaryNeume(props.element.quantitativeNeume),
);

const tertiaryNeume = computed(() =>
  getTertiaryNeume(props.element.quantitativeNeume),
);

const notes = computed((): ChromaticFthoraNoteOption[] => {
  if (
    props.element.fthora === Fthora.SoftChromaticThi_Top ||
    props.element.fthora === Fthora.SoftChromaticThi_Bottom ||
    props.element.secondaryFthora === Fthora.SoftChromaticThi_TopSecondary ||
    props.element.tertiaryFthora === Fthora.SoftChromaticThi_TopTertiary
  ) {
    return [
      {
        label: getNoteLabelSelector(ScaleNote.ZoHigh),
        value: ScaleNote.ZoHigh,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Thi),
        value: ScaleNote.Thi,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Vou),
        value: ScaleNote.Vou,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ni),
        value: ScaleNote.Ni,
      },
    ];
  } else if (
    props.element.fthora === Fthora.SoftChromaticPa_Top ||
    props.element.fthora === Fthora.SoftChromaticPa_Bottom ||
    props.element.secondaryFthora === Fthora.SoftChromaticPa_TopSecondary ||
    props.element.tertiaryFthora === Fthora.SoftChromaticPa_TopTertiary
  ) {
    return [
      {
        label: getNoteLabelSelector(ScaleNote.NiHigh),
        value: ScaleNote.NiHigh,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ke),
        value: ScaleNote.Ke,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ga),
        value: ScaleNote.Ga,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Pa),
        value: ScaleNote.Pa,
      },
    ];
  } else if (
    props.element.fthora === Fthora.HardChromaticThi_Top ||
    props.element.fthora === Fthora.HardChromaticThi_Bottom ||
    props.element.secondaryFthora === Fthora.HardChromaticThi_TopSecondary ||
    props.element.tertiaryFthora === Fthora.HardChromaticThi_TopTertiary
  ) {
    return [
      {
        label: getNoteLabelSelector(ScaleNote.ZoHigh),
        value: ScaleNote.ZoHigh,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Thi),
        value: ScaleNote.Thi,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Vou),
        value: ScaleNote.Vou,
      },
    ];
  } else if (
    props.element.fthora === Fthora.HardChromaticPa_Top ||
    props.element.fthora === Fthora.HardChromaticPa_Bottom ||
    props.element.secondaryFthora === Fthora.HardChromaticPa_TopSecondary ||
    props.element.tertiaryFthora === Fthora.HardChromaticPa_TopTertiary
  ) {
    return [
      {
        label: getNoteLabelSelector(ScaleNote.NiHigh),
        value: ScaleNote.NiHigh,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ke),
        value: ScaleNote.Ke,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ga),
        value: ScaleNote.Ga,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Pa),
        value: ScaleNote.Pa,
      },
    ];
  }

  return [];
});

const showChromaticFthoraNote = computed(
  () =>
    (props.innerNeume === 'Primary' &&
      props.element.fthora != null &&
      chromaticFthoras.includes(props.element.fthora)) ||
    (props.innerNeume === 'Secondary' &&
      props.element.secondaryFthora != null &&
      chromaticFthoras.includes(props.element.secondaryFthora)) ||
    (props.innerNeume === 'Tertiary' &&
      props.element.tertiaryFthora != null &&
      chromaticFthoras.includes(props.element.tertiaryFthora)),
);

const fthoresDisabled = computed(() =>
  restNeumes.includes(props.element.quantitativeNeume),
);

const expressionsDisabled = computed(() =>
  restNeumes.includes(props.element.quantitativeNeume),
);

const accidentalsDisabled = computed(() =>
  restNeumes.includes(props.element.quantitativeNeume),
);

const klasmaDisabled = computed(
  () =>
    restNeumes.includes(props.element.quantitativeNeume) ||
    kentemataNeumes.includes(props.element.quantitativeNeume),
);

const apleDisabled = computed(
  () =>
    restNeumes.includes(props.element.quantitativeNeume) ||
    kentemataNeumes.includes(props.element.quantitativeNeume),
);

const koronisDisabled = computed(
  () =>
    restNeumes.includes(props.element.quantitativeNeume) ||
    kentemataNeumes.includes(props.element.quantitativeNeume),
);

const stavrosDisabled = computed(
  () => props.element.quantitativeNeume !== QuantitativeNeume.RunningElaphron,
);

const argonDisabled = computed(
  () =>
    props.element.quantitativeNeume !== QuantitativeNeume.KentemataPlusOligon,
);

const isonDisabled = computed(() =>
  restNeumes.includes(props.element.quantitativeNeume),
);

const spathiDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ke) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ga),
);

const spathiTitle = computed(() =>
  spathiDisabled.value
    ? t(($) => $.toolbar.common.spathiDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Spathi_Top),
);

const klitonDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Thi),
);

const klitonTitle = computed(() =>
  klitonDisabled.value
    ? t(($) => $.toolbar.common.klitonDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Kliton_Top),
);

const zygosDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Thi),
);

const zygosTitle = computed(() =>
  zygosDisabled.value
    ? t(($) => $.toolbar.common.zygosDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Zygos_Top),
);

const enharmonicDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Zo) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.ZoHigh) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Vou) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.VouHigh) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ga),
);

const enharmonicTitle = computed(() =>
  enharmonicDisabled.value
    ? t(($) => $.toolbar.common.enharmonicDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Enharmonic_Top),
);

const generalFlatDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ke),
);

const generalFlatTitle = computed(() =>
  generalFlatDisabled.value
    ? t(($) => $.toolbar.common.generalFlatDisabled, {
        ns: 'toolbar',
      })
    : tooltip(Fthora.GeneralFlat_Top),
);

const generalSharpDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ga),
);

const generalSharpTitle = computed(() =>
  generalSharpDisabled.value
    ? t(($) => $.toolbar.common.generalSharpDisabled, {
        ns: 'toolbar',
      })
    : tooltip(Fthora.GeneralSharp_Top),
);

const chromaticFthoraNote = computed(() => {
  if (props.innerNeume === 'Secondary') {
    return props.element.secondaryChromaticFthoraNote;
  } else if (props.innerNeume === 'Tertiary') {
    return props.element.tertiaryChromaticFthoraNote;
  } else {
    return props.element.chromaticFthoraNote;
  }
});

const noteDisplay = computed(() =>
  props.element.scaleNotes
    .map((x) => t(getNoteLabelSelector(x), { ns: 'model' }))
    .join(' - '),
);

const spaceAfterMax = computed(() =>
  Math.round(Unit.toPt(props.pageSetup.pageWidth)),
);

function translateNeumeDisplayName(neume: ToolbarNeumeTooltipNeume) {
  switch (neume) {
    case Tie.YfenBelow:
      return t(($) => $.toolbar.neume.yfen, { ns: 'toolbar' });
    case Accidental.Flat_2_Right:
      return t(($) => $.toolbar.neume.flat, { ns: 'toolbar' });
    case Accidental.Sharp_2_Left:
      return t(($) => $.toolbar.neume.sharp, { ns: 'toolbar' });
    case MeasureBar.MeasureBarRight:
      return t(($) => $.toolbar.common.measureBar, { ns: 'toolbar' });
    case MeasureNumber.Two:
      return t(($) => $.toolbar.neume.measureNumber, {
        ns: 'toolbar',
      });
    case NoteIndicator.Pa:
      return t(($) => $.toolbar.neume.noteIndicator, {
        ns: 'toolbar',
      });
    case Ison.Unison:
      return t(($) => $.toolbar.neume.isonIndicator, {
        ns: 'toolbar',
      });
  }

  if (enumHas(fthoraValues, neume)) {
    return t(getFthoraLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(timeNeumeValues, neume)) {
    return t(getTimeNeumeLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(vocalExpressionNeumeValues, neume)) {
    return t(getVocalExpressionNeumeLabelSelector(neume), {
      ns: 'model',
    });
  }

  if (enumHas(gorgonNeumeValues, neume)) {
    return t(getGorgonNeumeLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(measureBarValues, neume)) {
    return t(getMeasureBarLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(noteIndicatorValues, neume)) {
    return t(getNoteIndicatorLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(isonValues, neume)) {
    const displayName = getIsonLabelSelector(neume);
    return displayName == null
      ? String(neume)
      : t(displayName, { ns: 'model' });
  }

  return String(neume);
}

function updateFthora(args: string[]) {
  if (props.innerNeume === 'Secondary') {
    emit('update:secondaryFthora', args[0] + props.innerNeume);
  } else if (props.innerNeume === 'Tertiary') {
    emit('update:tertiaryFthora', args[0] + props.innerNeume);
  } else {
    emit('update:fthora', args);
  }
}

function updateChromaticFthoraNote(value: AcceptableValue) {
  if (typeof value !== 'string') {
    return;
  }

  const note = value;

  if (props.innerNeume === 'Secondary') {
    emit('update', {
      secondaryChromaticFthoraNote: note,
    } as Partial<NoteElement>);
  } else if (props.innerNeume === 'Tertiary') {
    emit('update', {
      tertiaryChromaticFthoraNote: note,
    } as Partial<NoteElement>);
  } else {
    emit('update', {
      chromaticFthoraNote: note,
    } as Partial<NoteElement>);
  }
}

function updateGorgon(args: string | string[]) {
  if (
    props.innerNeume === 'Secondary' &&
    props.element.quantitativeNeume !== QuantitativeNeume.Hyporoe
  ) {
    if (Array.isArray(args)) {
      emit('update:secondaryGorgon', GorgonNeume.GorgonSecondary);
    } else {
      emit('update:secondaryGorgon', args + props.innerNeume);
    }
  } else {
    emit('update:gorgon', args);
  }
}

function updateAccidental(args: string) {
  // There is some admittedly confusing logic here regarding the hyporoe.
  // Compare to handleHyporoe in the Analysis Service.

  if (props.innerNeume === 'Secondary') {
    if (
      props.element.quantitativeNeume == QuantitativeNeume.Hyporoe &&
      args.startsWith('Flat')
    ) {
      emit('update:accidental', args);
    } else {
      emit('update:secondaryAccidental', args + props.innerNeume);
    }
  } else if (props.innerNeume === 'Tertiary') {
    emit('update:tertiaryAccidental', args + props.innerNeume);
  } else {
    if (
      props.element.quantitativeNeume == QuantitativeNeume.Hyporoe &&
      args.startsWith('Flat')
    ) {
      emit('update:secondaryAccidental', args + 'Secondary');
    } else {
      emit('update:accidental', args);
    }
  }
}

function tooltip(neume: ToolbarNeumeTooltipNeume): AppTooltipValue {
  const label = translateNeumeDisplayName(neume);
  const mapping = props.neumeKeyboard.findMappingForNeume(neume);
  if (mapping) {
    return {
      label,
      shortcut: props.neumeKeyboard.generateTooltipKeys(mapping),
    };
  } else if (neume === TimeNeume.Klasma_Top) {
    return { label, shortcut: props.neumeKeyboard.getKlasmaKeyTooltipKeys() };
  } else if (neume === NoteIndicator.Pa) {
    return {
      label,
      shortcut: props.neumeKeyboard.getNoteIndicatorKeyTooltipKeys(),
    };
  } else {
    return label;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume-toolbar {
  background-color: var(--color-legacy-chrome-menu-surface);

  --btn-size: 32px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.neume-button,
:deep(.menu-container > .neume-button),
.btnNeumeSelect {
  box-sizing: border-box;
  height: var(--btn-size);
  width: var(--btn-size);
  appearance: auto;
  background: revert;
  border: revert;
  border-radius: revert;
  box-shadow: revert;
  font-weight: revert;

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
  outline: revert;
  padding: 0;
  transition: revert;

  user-select: none;
}

.neume-button:hover,
:deep(.menu-container > .neume-button:hover),
.btnNeumeSelect:hover {
  background: revert;
}

.neume-button > img,
.neume-button > svg,
:deep(.menu-container > .neume-button > img),
:deep(.menu-container > .neume-button > svg) {
  height: var(--btn-size);
  max-width: none;
  width: var(--btn-size);
}

.neume-button[aria-disabled='true'],
:deep(.menu-container > .neume-button:disabled),
.btnNeumeSelect[aria-disabled='true'],
.btnNeumeSelect:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btnNeumeSelect {
  font-size: 24px;
}

.btnNeumeSelect.selected {
  background: var(--color-legacy-chrome-selected);
}

.note-name {
  width: 12ch;
  text-align: center;
}

.space {
  width: 16px;
}

.separator {
  margin: 0 16px;
  border-right: 1px solid var(--color-legacy-chrome-border);
  height: 16px;
}
</style>
