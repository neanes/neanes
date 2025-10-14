<template>
  <div class="neume-selector-panel">
    <div class="row">
      <template v-for="(neume, index) in ascendingNeumes">
        <template v-if="neume === QuantitativeNeume.VareiaDotted">
          <div
            :key="`ascendingNeumes-${index}`"
            class="menu-container"
            @mousedown="openVareiaDottedMenu"
            @mouseleave="selectedVareiaDotted = null"
          >
            <Neume
              class="neume"
              :neume="QuantitativeNeume.VareiaDotted"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div class="menu" v-if="showVareiaDottedMenu">
              <div
                class="menu-item"
                v-for="menuItem in vareiaDottedMenuItems"
                :key="menuItem"
                @mouseenter="selectedVareiaDotted = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="menuItem"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <Neume
            class="neume"
            :key="`ascendingNeumes-${index}`"
            :neume="neume"
            :fontFamily="pageSetup.neumeDefaultFontFamily"
            :title="tooltip(neume)"
            @click="$emit('select-quantitative-neume', neume)"
          />
        </template>
      </template>
    </div>
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in ascendingNeumesWithPetasti"
        :key="`ascendingNeumesWithPetasti-${index}`"
        :neume="neume"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
        :title="tooltip(neume)"
        @click="$emit('select-quantitative-neume', neume)"
      />
    </div>
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in descendingNeumes"
        :key="`descendingNeumes-${index}`"
        :neume="neume"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
        :title="tooltip(neume)"
        @click="$emit('select-quantitative-neume', neume)"
      />
    </div>
    <div class="row">
      <template v-for="(neume, index) in combinationNeumes">
        <template
          v-if="neume === QuantitativeNeume.OligonPlusHyporoePlusKentemata"
        >
          <div
            :key="`combinationNeumes-${index}`"
            class="menu-container"
            @mousedown="openHyporoeKentemataMenu"
            @mouseleave="selectedSecondaryGorgon = null"
          >
            <Neume
              class="neume"
              :neume="QuantitativeNeume.OligonPlusHyporoePlusKentemata"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div class="menu" v-if="showHyporoeKentemataMenu">
              <div
                class="menu-item"
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusHyporoePlusKentemata"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                  v-if="menuItem.gorgon != null"
                />
              </div>
            </div>
          </div>
        </template>
        <template
          v-else-if="neume === QuantitativeNeume.OligonPlusIsonPlusKentemata"
        >
          <div
            :key="`combinationNeumes-${index}`"
            class="menu-container"
            @mousedown="openIsonKentemataMenu"
            @mouseleave="selectedSecondaryGorgon = null"
          >
            <Neume
              class="neume"
              :neume="QuantitativeNeume.OligonPlusIsonPlusKentemata"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div class="menu down" v-if="showIsonKentemataMenu">
              <div
                class="menu-item"
                v-for="menuItem in secondaryGorgonMenuItemsDown"
                :key="menuItem.gorgon as string"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusIsonPlusKentemata"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                  v-if="menuItem.gorgon != null"
                />
              </div>
            </div>
          </div>
        </template>
        <template
          v-else-if="
            neume === QuantitativeNeume.OligonPlusApostrophosPlusKentemata
          "
        >
          <div
            :key="`combinationNeumes-${index}`"
            class="menu-container"
            @mousedown="openApostrophosKentemataMenu"
            @mouseleave="selectedSecondaryGorgon = null"
          >
            <Neume
              class="neume"
              :neume="QuantitativeNeume.OligonPlusApostrophosPlusKentemata"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div class="menu" v-if="showApostrophosKentemataMenu">
              <div
                class="menu-item"
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusApostrophosPlusKentemata"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                  v-if="menuItem.gorgon != null"
                />
              </div>
            </div>
          </div>
        </template>
        <template
          v-else-if="
            neume === QuantitativeNeume.OligonPlusElaphronPlusKentemata
          "
        >
          <div
            :key="`combinationNeumes-${index}`"
            class="menu-container"
            @mousedown="openElaphronKentemataMenu"
            @mouseleave="selectedSecondaryGorgon = null"
          >
            <Neume
              class="neume"
              :neume="QuantitativeNeume.OligonPlusElaphronPlusKentemata"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div class="menu" v-if="showElaphronKentemataMenu">
              <div
                class="menu-item"
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusElaphronPlusKentemata"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                  v-if="menuItem.gorgon != null"
                />
              </div>
            </div>
          </div>
        </template>
        <template
          v-else-if="
            neume ===
            QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata
          "
        >
          <div
            :key="`combinationNeumes-${index}`"
            class="menu-container"
            @mousedown="openElaphronApostrophosKentemataMenu"
            @mouseleave="selectedSecondaryGorgon = null"
          >
            <Neume
              class="neume"
              :neume="
                QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata
              "
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div class="menu" v-if="showElaphronApostrophosKentemataMenu">
              <div
                class="menu-item"
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="
                    QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata
                  "
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                  v-if="menuItem.gorgon != null"
                />
              </div>
            </div>
          </div>
        </template>
        <template
          v-else-if="neume === QuantitativeNeume.OligonPlusHamiliPlusKentemata"
        >
          <div
            :key="`combinationNeumes-${index}`"
            class="menu-container"
            @mousedown="openHamiliKentemataMenu"
            @mouseleave="selectedSecondaryGorgon = null"
          >
            <Neume
              class="neume"
              :neume="QuantitativeNeume.OligonPlusHamiliPlusKentemata"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div class="menu" v-if="showHamiliKentemataMenu">
              <div
                class="menu-item"
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusHamiliPlusKentemata"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                  v-if="menuItem.gorgon != null"
                />
              </div>
            </div>
          </div>
        </template>
        <template
          v-else-if="
            neume === QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata
          "
        >
          <div
            :key="`combinationNeumes-${index}`"
            class="menu-container"
            @mousedown="openRunningElaphronKentemataMenu"
            @mouseleave="selectedSecondaryGorgon = null"
          >
            <Neume
              class="neume"
              :neume="QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div class="menu" v-if="showRunningElaphronKentemataMenu">
              <div
                class="menu-item"
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="
                    QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata
                  "
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                  v-if="menuItem.gorgon != null"
                />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <Neume
            class="neume"
            :key="`combinationNeumes-${index}`"
            :neume="neume"
            :fontFamily="pageSetup.neumeDefaultFontFamily"
            :title="tooltip(neume)"
            @click="$emit('select-quantitative-neume', neume)"
          />
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { GorgonNeume, QuantitativeNeume } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';

interface SecondaryGorgonMenuItem {
  gorgon: GorgonNeume | null;
}

const ascendingNeumes: QuantitativeNeume[] = [
  QuantitativeNeume.Ison,
  QuantitativeNeume.Oligon,
  QuantitativeNeume.OligonPlusKentima,
  QuantitativeNeume.OligonPlusKentimaBelow,
  QuantitativeNeume.OligonPlusKentimaAbove,
  QuantitativeNeume.OligonPlusHypsiliRight,
  QuantitativeNeume.OligonPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
  QuantitativeNeume.OligonPlusDoubleHypsili,
  QuantitativeNeume.VareiaDotted,
  QuantitativeNeume.Cross,
  QuantitativeNeume.Breath,
  QuantitativeNeume.OligonKentimataDoubleYpsili,
  QuantitativeNeume.OligonKentimaDoubleYpsiliRight,
  QuantitativeNeume.OligonKentimaDoubleYpsiliLeft,
  QuantitativeNeume.OligonTripleYpsili,
  QuantitativeNeume.OligonKentimataTripleYpsili,
  QuantitativeNeume.OligonKentimaTripleYpsili,
];

const ascendingNeumesWithPetasti: QuantitativeNeume[] = [
  QuantitativeNeume.PetastiWithIson,
  QuantitativeNeume.Petasti,
  QuantitativeNeume.PetastiPlusOligon,
  QuantitativeNeume.PetastiPlusKentimaAbove,
  QuantitativeNeume.PetastiPlusHypsiliRight,
  QuantitativeNeume.PetastiPlusHypsiliLeft,
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
  QuantitativeNeume.PetastiPlusDoubleHypsili,
  QuantitativeNeume.PetastiKentimataDoubleYpsili,
  QuantitativeNeume.PetastiKentimaDoubleYpsiliRight,
  QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft,
  QuantitativeNeume.PetastiTripleYpsili,
  QuantitativeNeume.PetastiKentimataTripleYpsili,
  QuantitativeNeume.PetastiKentimaTripleYpsili,

  QuantitativeNeume.PetastiPlusApostrophos,
  QuantitativeNeume.PetastiPlusElaphron,
  QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
  QuantitativeNeume.PetastiPlusRunningElaphron,
  QuantitativeNeume.PetastiPlusHyporoe,
  QuantitativeNeume.PetastiHamili,
  QuantitativeNeume.PetastiHamiliApostrofos,
  QuantitativeNeume.PetastiHamiliElafron,
  QuantitativeNeume.PetastiHamiliElafronApostrofos,
  QuantitativeNeume.PetastiDoubleHamili,
  QuantitativeNeume.PetastiDoubleHamiliApostrofos,
];

const descendingNeumes: QuantitativeNeume[] = [
  QuantitativeNeume.IsonPlusApostrophos,
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.RunningElaphron,
  QuantitativeNeume.DoubleApostrophos,
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Elaphron,
  QuantitativeNeume.ElaphronPlusApostrophos,
  QuantitativeNeume.Hamili,
  QuantitativeNeume.HamiliPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphron,
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  QuantitativeNeume.DoubleHamili,
  QuantitativeNeume.DoubleHamiliApostrofos,
  QuantitativeNeume.DoubleHamiliElafron,
  QuantitativeNeume.DoubleHamiliElafronApostrofos,
  QuantitativeNeume.TripleHamili,
];

const combinationNeumes: QuantitativeNeume[] = [
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.OligonPlusKentemata,
  QuantitativeNeume.KentemataPlusOligon,
  QuantitativeNeume.OligonPlusIsonPlusKentemata,
  QuantitativeNeume.OligonKentimaMiddleKentimata,
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusKentemata,
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusHamiliPlusKentemata,
  QuantitativeNeume.OligonPlusIson,
  QuantitativeNeume.OligonPlusApostrophos,
  QuantitativeNeume.OligonPlusElaphron,
  QuantitativeNeume.OligonPlusHyporoe,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
  QuantitativeNeume.OligonPlusHamili,
];

const secondaryGorgonMenuItems: SecondaryGorgonMenuItem[] = [
  { gorgon: GorgonNeume.TrigorgonDottedLeft1Secondary },
  { gorgon: GorgonNeume.TrigorgonSecondary },
  { gorgon: GorgonNeume.DigorgonDottedLeft1Secondary },
  { gorgon: GorgonNeume.DigorgonSecondary },
  { gorgon: GorgonNeume.GorgonDottedRightSecondary },
  { gorgon: GorgonNeume.GorgonDottedLeftSecondary },
  { gorgon: GorgonNeume.GorgonSecondary },
  { gorgon: null },
];

const secondaryGorgonMenuItemsDown: SecondaryGorgonMenuItem[] =
  secondaryGorgonMenuItems.slice().reverse();

const vareiaDottedMenuItems: QuantitativeNeume[] = [
  QuantitativeNeume.VareiaDotted4,
  QuantitativeNeume.VareiaDotted3,
  QuantitativeNeume.VareiaDotted2,
  QuantitativeNeume.VareiaDotted,
];

export default defineComponent({
  components: { Neume },
  emits: ['select-quantitative-neume'],
  props: {
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
    neumeKeyboard: {
      type: Object as PropType<NeumeKeyboard>,
      required: true,
    },
  },

  data() {
    return {
      QuantitativeNeume,

      ascendingNeumes,
      descendingNeumes,
      ascendingNeumesWithPetasti,
      combinationNeumes,
      vareiaDottedMenuItems,
      secondaryGorgonMenuItems,
      secondaryGorgonMenuItemsDown,

      showHyporoeKentemataMenu: false,
      showIsonKentemataMenu: false,
      showApostrophosKentemataMenu: false,
      showElaphronKentemataMenu: false,
      showElaphronApostrophosKentemataMenu: false,
      showRunningElaphronKentemataMenu: false,
      showHamiliKentemataMenu: false,
      showVareiaDottedMenu: false,
      selectedSecondaryGorgon: null as SecondaryGorgonMenuItem | null,
      selectedVareiaDotted: null as QuantitativeNeume | null,
    };
  },

  computed: {},

  methods: {
    openHyporoeKentemataMenu() {
      this.showHyporoeKentemataMenu = true;
      window.addEventListener('mouseup', this.onHyporoeMouseUp);
    },

    openIsonKentemataMenu() {
      this.showIsonKentemataMenu = true;
      window.addEventListener('mouseup', this.onIsonKentemataMouseUp);
    },

    openApostrophosKentemataMenu() {
      this.showApostrophosKentemataMenu = true;
      window.addEventListener('mouseup', this.onApostrophosKentemataMouseUp);
    },

    openElaphronKentemataMenu() {
      this.showElaphronKentemataMenu = true;
      window.addEventListener('mouseup', this.onElaphronKentemataMouseUp);
    },

    openElaphronApostrophosKentemataMenu() {
      this.showElaphronApostrophosKentemataMenu = true;
      window.addEventListener(
        'mouseup',
        this.onElaphronApostrophosKentemataMouseUp,
      );
    },

    openRunningElaphronKentemataMenu() {
      this.showRunningElaphronKentemataMenu = true;
      window.addEventListener(
        'mouseup',
        this.onRunningElaphronKentemataMouseUp,
      );
    },

    openHamiliKentemataMenu() {
      this.showHamiliKentemataMenu = true;
      window.addEventListener('mouseup', this.onHamiliKentemataMouseUp);
    },

    onHyporoeMouseUp() {
      if (this.selectedSecondaryGorgon) {
        this.$emit(
          'select-quantitative-neume',
          QuantitativeNeume.OligonPlusHyporoePlusKentemata,
          this.selectedSecondaryGorgon.gorgon,
        );
      }

      this.showHyporoeKentemataMenu = false;

      window.removeEventListener('mouseup', this.onHyporoeMouseUp);
    },

    onIsonKentemataMouseUp() {
      if (this.selectedSecondaryGorgon) {
        this.$emit(
          'select-quantitative-neume',
          QuantitativeNeume.OligonPlusIsonPlusKentemata,
          this.selectedSecondaryGorgon.gorgon,
        );
      }

      this.showIsonKentemataMenu = false;

      window.removeEventListener('mouseup', this.onIsonKentemataMouseUp);
    },

    onApostrophosKentemataMouseUp() {
      if (this.selectedSecondaryGorgon) {
        this.$emit(
          'select-quantitative-neume',
          QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
          this.selectedSecondaryGorgon.gorgon,
        );
      }

      this.showApostrophosKentemataMenu = false;

      window.removeEventListener('mouseup', this.onApostrophosKentemataMouseUp);
    },

    onElaphronKentemataMouseUp() {
      if (this.selectedSecondaryGorgon) {
        this.$emit(
          'select-quantitative-neume',
          QuantitativeNeume.OligonPlusElaphronPlusKentemata,
          this.selectedSecondaryGorgon.gorgon,
        );
      }

      this.showElaphronKentemataMenu = false;

      window.removeEventListener('mouseup', this.onElaphronKentemataMouseUp);
    },

    onElaphronApostrophosKentemataMouseUp() {
      if (this.selectedSecondaryGorgon) {
        this.$emit(
          'select-quantitative-neume',
          QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
          this.selectedSecondaryGorgon.gorgon,
        );
      }

      this.showElaphronApostrophosKentemataMenu = false;

      window.removeEventListener(
        'mouseup',
        this.onElaphronApostrophosKentemataMouseUp,
      );
    },

    onRunningElaphronKentemataMouseUp() {
      if (this.selectedSecondaryGorgon) {
        this.$emit(
          'select-quantitative-neume',
          QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
          this.selectedSecondaryGorgon.gorgon,
        );
      }

      this.showRunningElaphronKentemataMenu = false;

      window.removeEventListener(
        'mouseup',
        this.onRunningElaphronKentemataMouseUp,
      );
    },

    onHamiliKentemataMouseUp() {
      if (this.selectedSecondaryGorgon) {
        this.$emit(
          'select-quantitative-neume',
          QuantitativeNeume.OligonPlusHamiliPlusKentemata,
          this.selectedSecondaryGorgon.gorgon,
        );
      }

      this.showHamiliKentemataMenu = false;

      window.removeEventListener('mouseup', this.onHamiliKentemataMouseUp);
    },

    openVareiaDottedMenu() {
      this.showVareiaDottedMenu = true;
      window.addEventListener('mouseup', this.onVareiaDottedMouseUp);
    },

    onVareiaDottedMouseUp() {
      if (this.selectedVareiaDotted) {
        this.$emit('select-quantitative-neume', this.selectedVareiaDotted);
      }

      this.showVareiaDottedMenu = false;

      window.removeEventListener('mouseup', this.onVareiaDottedMouseUp);
    },

    tooltip(neume: QuantitativeNeume) {
      const displayName = this.getDisplayName(neume);
      const mapping = this.neumeKeyboard.findMappingForNeume(neume);
      if (mapping) {
        return `${this.$t(displayName)} (${this.neumeKeyboard.generateTooltip(
          mapping,
        )})`;
      } else {
        return `${this.$t(displayName)}`;
      }
    },

    getDisplayName(neume: QuantitativeNeume) {
      switch (neume) {
        case QuantitativeNeume.Ison:
          return 'model:neume.quantitative.ison';
        case QuantitativeNeume.Oligon:
          return 'model:neume.quantitative.oligon';
        case QuantitativeNeume.OligonPlusKentima:
        case QuantitativeNeume.OligonPlusKentimaBelow:
        case QuantitativeNeume.OligonPlusKentimaAbove:
          return 'model:neume.quantitative.oligonWithKentima';
        case QuantitativeNeume.OligonPlusHypsiliRight:
        case QuantitativeNeume.OligonPlusHypsiliLeft:
          return 'model:neume.quantitative.oligonWithYpsili';
        case QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal:
        case QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical:
          return 'model:neume.quantitative.oligonWithYpsiliAndKentima';
        case QuantitativeNeume.OligonPlusDoubleHypsili:
          return 'model:neume.quantitative.oligonWithDoubleYpsili';
        case QuantitativeNeume.OligonKentimataDoubleYpsili:
          return 'model:neume.quantitative.oligonWithKentimataAndDoubleYpsili';
        case QuantitativeNeume.OligonKentimaDoubleYpsiliRight:
        case QuantitativeNeume.OligonKentimaDoubleYpsiliLeft:
          return 'model:neume.quantitative.oligonWithKentimaAndDoubleYpsili';
        case QuantitativeNeume.OligonTripleYpsili:
          return 'model:neume.quantitative.oligonWithTripleYpsili';
        case QuantitativeNeume.OligonKentimataTripleYpsili:
          return 'model:neume.quantitative.oligonWithKentimataAndTripleYpsili';
        case QuantitativeNeume.OligonKentimaTripleYpsili:
          return 'model:neume.quantitative.oligonWithKentimaAndTripleYpsili';
        case QuantitativeNeume.PetastiWithIson:
          return 'model:neume.quantitative.petastiWithIson';
        case QuantitativeNeume.Petasti:
          return 'model:neume.quantitative.petasti';
        case QuantitativeNeume.PetastiPlusOligon:
          return 'model:neume.quantitative.petastiWithOligon';
        case QuantitativeNeume.PetastiPlusKentimaAbove:
          return 'model:neume.quantitative.petastiWithKentima';
        case QuantitativeNeume.PetastiPlusHypsiliRight:
        case QuantitativeNeume.PetastiPlusHypsiliLeft:
          return 'model:neume.quantitative.petastiWithYpsili';
        case QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal:
        case QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical:
          return 'model:neume.quantitative.petastiWithYpsiliAndKentima';
        case QuantitativeNeume.PetastiPlusDoubleHypsili:
          return 'model:neume.quantitative.petastiWithDoubleYpsili';
        case QuantitativeNeume.PetastiKentimataDoubleYpsili:
          return 'model:neume.quantitative.petastiWithKentimataAndDoubleYpsili';
        case QuantitativeNeume.PetastiKentimaDoubleYpsiliRight:
        case QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft:
          return 'model:neume.quantitative.petastiWithKentimaAndDoubleYpsili';
        case QuantitativeNeume.PetastiTripleYpsili:
          return 'model:neume.quantitative.petastiWithTripleYpsili';
        case QuantitativeNeume.PetastiKentimataTripleYpsili:
          return 'model:neume.quantitative.petastiWithKentimataAndTripleYpsili';
        case QuantitativeNeume.PetastiKentimaTripleYpsili:
          return 'model:neume.quantitative.petastiWithKentimaAndTripleYpsili';
        case QuantitativeNeume.Apostrophos:
          return 'model:neume.quantitative.apostrophos';
        case QuantitativeNeume.Elaphron:
          return 'model:neume.quantitative.elaphron';
        case QuantitativeNeume.ElaphronPlusApostrophos:
          return 'model:neume.quantitative.elaphronWithApostrophos';
        case QuantitativeNeume.Hamili:
          return 'model:neume.quantitative.hamili';
        case QuantitativeNeume.HamiliPlusApostrophos:
          return 'model:neume.quantitative.hamiliWithApostrophos';
        case QuantitativeNeume.HamiliPlusElaphron:
          return 'model:neume.quantitative.hamiliWithElaphron';
        case QuantitativeNeume.HamiliPlusElaphronPlusApostrophos:
          return 'model:neume.quantitative.hamiliWithElaphronAndApostrophos';
        case QuantitativeNeume.DoubleHamili:
          return 'model:neume.quantitative.doubleHamili';
        case QuantitativeNeume.DoubleHamiliApostrofos:
          return 'model:neume.quantitative.doubleHamiliWithApostrophos';
        case QuantitativeNeume.DoubleHamiliElafron:
          return 'model:neume.quantitative.doubleHamiliWithElaphron';
        case QuantitativeNeume.DoubleHamiliElafronApostrofos:
          return 'model:neume.quantitative.doubleHamiliWithElaphronAndApostrophos';
        case QuantitativeNeume.TripleHamili:
          return 'model:neume.quantitative.tripleHamili';
        case QuantitativeNeume.PetastiPlusApostrophos:
          return 'model:neume.quantitative.petastiWithApostrophos';
        case QuantitativeNeume.PetastiPlusElaphron:
          return 'model:neume.quantitative.petastiWithElaphron';
        case QuantitativeNeume.PetastiPlusElaphronPlusApostrophos:
          return 'model:neume.quantitative.petastiWithElaphronAndApostrophos';
        case QuantitativeNeume.PetastiHamili:
          return 'model:neume.quantitative.petastiWithHamili';
        case QuantitativeNeume.PetastiHamiliApostrofos:
          return 'model:neume.quantitative.petastiWithHamiliAndApostrophos';
        case QuantitativeNeume.PetastiHamiliElafron:
          return 'model:neume.quantitative.petastiWithHamiliAndElaphron';
        case QuantitativeNeume.PetastiHamiliElafronApostrofos:
          return 'model:neume.quantitative.petastiWithHamiliElaphronAndApostrophos';
        case QuantitativeNeume.PetastiDoubleHamili:
          return 'model:neume.quantitative.petastiWithDoubleHamili';
        case QuantitativeNeume.PetastiDoubleHamiliApostrofos:
          return 'model:neume.quantitative.petastiWithDoubleHamiliAndApostrophos';
        case QuantitativeNeume.OligonPlusKentemata:
          return 'model:neume.quantitative.oligonAndKentimata';
        case QuantitativeNeume.KentemataPlusOligon:
          return 'model:neume.quantitative.kentimataAndOligon';
        case QuantitativeNeume.OligonPlusIsonPlusKentemata:
          return 'model:neume.quantitative.isonAndKentimataWithSupportingOligon';
        case QuantitativeNeume.OligonPlusApostrophosPlusKentemata:
          return 'model:neume.quantitative.apostrophosAndKentimataWithSupportingOligon';
        case QuantitativeNeume.OligonPlusHyporoePlusKentemata:
          return 'model:neume.quantitative.yporoeAndKentimataWithSupportingOligon';
        case QuantitativeNeume.OligonPlusElaphronPlusKentemata:
          return 'model:neume.quantitative.elaphronAndKentimataWithSupportingOligon';
        case QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata:
          return 'model:neume.quantitative.elaphronWithApostrophosAndKentimataWithSupportingOligon';
        case QuantitativeNeume.OligonPlusHamiliPlusKentemata:
          return 'model:neume.quantitative.hamiliAndKentimataWithSupportingOligon';
        case QuantitativeNeume.RunningElaphron:
          return 'model:neume.quantitative.runningElaphron';
        case QuantitativeNeume.Hyporoe:
          return 'model:neume.quantitative.yporoe';
        case QuantitativeNeume.PetastiPlusRunningElaphron:
          return 'model:neume.quantitative.petastiWithRunningElaphron';
        case QuantitativeNeume.PetastiPlusHyporoe:
          return 'model:neume.quantitative.petastiWithYporoe';
        case QuantitativeNeume.OligonPlusIson:
          return 'model:neume.quantitative.isonWithSupportingOligon';
        case QuantitativeNeume.OligonPlusApostrophos:
          return 'model:neume.quantitative.apostrophosWithSupportingOligon';
        case QuantitativeNeume.OligonPlusElaphron:
          return 'model:neume.quantitative.elaphronWithSupportingOligon';
        case QuantitativeNeume.OligonPlusHyporoe:
          return 'model:neume.quantitative.yporoeWithSupportingOligon';
        case QuantitativeNeume.OligonPlusElaphronPlusApostrophos:
          return 'model:neume.quantitative.elaphronWithApostrophosAndSupportingOligon';
        case QuantitativeNeume.OligonPlusHamili:
          return 'model:neume.quantitative.hamiliWithSupportingOligon';
        case QuantitativeNeume.Kentima:
          return 'model:neume.quantitative.kentima';
        case QuantitativeNeume.Kentemata:
          return 'model:neume.quantitative.kentimata';
        case QuantitativeNeume.DoubleApostrophos:
          return 'model:neume.quantitative.doubleApostrophos';
        case QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata:
          return 'model:neume.quantitative.runningElaphronAndKentimataWithSupportingOligon';
        case QuantitativeNeume.IsonPlusApostrophos:
          return 'model:neume.quantitative.isonAndApostrophos';
        case QuantitativeNeume.OligonKentimaMiddleKentimata:
          return 'model:neume.quantitative.oligonWithKentimaAndKentimata';
        case QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft:
        case QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight:
          return 'model:neume.quantitative.oligonWithYpsiliAndKentimata';
        case QuantitativeNeume.VareiaDotted:
        case QuantitativeNeume.VareiaDotted2:
        case QuantitativeNeume.VareiaDotted3:
        case QuantitativeNeume.VareiaDotted4:
          return 'model:neume.quantitative.rest';
        case QuantitativeNeume.Cross:
          return 'model:neume.quantitative.cross';
        case QuantitativeNeume.Breath:
          return 'model:neume.quantitative.breath';
      }
    },
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume-selector-panel {
  display: flex;

  --neume-height: 2.5rem;
}

.row {
  display: flex;
  flex-direction: column;
}

.neume {
  font-size: 1.6rem;

  text-align: center;

  cursor: default;
  user-select: none;

  min-width: var(--neume-height);
  height: var(--neume-height);
  width: 100%;
}

.neume:hover {
  background-color: aliceblue;
}

.menu-container {
  display: flex;
  position: relative;
  height: var(--neume-height);
  width: 100%;
}

.menu {
  position: absolute;
  z-index: 999;
  background-color: white;
  border: 1px solid black;
  box-sizing: border-box;
  bottom: 0;
  width: 100%;
}

.menu.down {
  bottom: initial;
  top: 0;
}

.menu-item {
  height: var(--neume-height);
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
