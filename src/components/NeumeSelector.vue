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
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
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
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon as string"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
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
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
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
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon as string"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
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
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon as string"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
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
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
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
                />
                <Neume
                  class="neume"
                  :neume="menuItem.gorgon"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
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
            @click="$emit('select-quantitative-neume', neume)"
          />
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import Neume from '@/components/Neume.vue';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import { GorgonNeume, QuantitativeNeume } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';

interface SecondaryGorgonMenuItem {
  gorgon: GorgonNeume | null;
}

@Component({
  components: { SyllableNeumeBox, Neume },
  emits: ['select-quantitative-neume'],
})
export default class NeumeSelector extends Vue {
  @Prop() pageSetup!: PageSetup;

  QuantitativeNeume = QuantitativeNeume;

  ascendingNeumes: QuantitativeNeume[] = [
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

  ascendingNeumesWithPetasti: QuantitativeNeume[] = [
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

  descendingNeumes: QuantitativeNeume[] = [
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

  combinationNeumes: QuantitativeNeume[] = [
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
    QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
    QuantitativeNeume.OligonPlusHamili,
  ];

  secondaryGorgonMenuItems: SecondaryGorgonMenuItem[] = [
    { gorgon: GorgonNeume.TrigorgonDottedLeft1Secondary },
    { gorgon: GorgonNeume.TrigorgonSecondary },
    { gorgon: GorgonNeume.DigorgonDottedLeft1Secondary },
    { gorgon: GorgonNeume.DigorgonSecondary },
    { gorgon: GorgonNeume.GorgonDottedRightSecondary },
    { gorgon: GorgonNeume.GorgonDottedLeftSecondary },
    { gorgon: GorgonNeume.GorgonSecondary },
    { gorgon: null },
  ];

  secondaryGorgonMenuItemsDown: SecondaryGorgonMenuItem[] =
    this.secondaryGorgonMenuItems.slice().reverse();

  vareiaDottedMenuItems: QuantitativeNeume[] = [
    QuantitativeNeume.VareiaDotted4,
    QuantitativeNeume.VareiaDotted3,
    QuantitativeNeume.VareiaDotted2,
    QuantitativeNeume.VareiaDotted,
  ];

  showHyporoeKentemataMenu: boolean = false;
  showIsonKentemataMenu: boolean = false;
  showApostrophosKentemataMenu: boolean = false;
  showElaphronKentemataMenu: boolean = false;
  showElaphronApostrophosKentemataMenu: boolean = false;
  showRunningElaphronKentemataMenu: boolean = false;
  showHamiliKentemataMenu: boolean = false;
  showVareiaDottedMenu: boolean = false;
  selectedSecondaryGorgon: SecondaryGorgonMenuItem | null = null;
  selectedVareiaDotted: QuantitativeNeume | null = null;

  openHyporoeKentemataMenu() {
    this.showHyporoeKentemataMenu = true;
    window.addEventListener('mouseup', this.onHyporoeMouseUp);
  }

  openIsonKentemataMenu() {
    this.showIsonKentemataMenu = true;
    window.addEventListener('mouseup', this.onIsonKentemataMouseUp);
  }

  openApostrophosKentemataMenu() {
    this.showApostrophosKentemataMenu = true;
    window.addEventListener('mouseup', this.onApostrophosKentemataMouseUp);
  }

  openElaphronKentemataMenu() {
    this.showElaphronKentemataMenu = true;
    window.addEventListener('mouseup', this.onElaphronKentemataMouseUp);
  }

  openElaphronApostrophosKentemataMenu() {
    this.showElaphronApostrophosKentemataMenu = true;
    window.addEventListener(
      'mouseup',
      this.onElaphronApostrophosKentemataMouseUp,
    );
  }

  openRunningElaphronKentemataMenu() {
    this.showRunningElaphronKentemataMenu = true;
    window.addEventListener('mouseup', this.onRunningElaphronKentemataMouseUp);
  }

  openHamiliKentemataMenu() {
    this.showHamiliKentemataMenu = true;
    window.addEventListener('mouseup', this.onHamiliKentemataMouseUp);
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  openVareiaDottedMenu() {
    this.showVareiaDottedMenu = true;
    window.addEventListener('mouseup', this.onVareiaDottedMouseUp);
  }

  onVareiaDottedMouseUp() {
    if (this.selectedVareiaDotted) {
      this.$emit('select-quantitative-neume', this.selectedVareiaDotted);
    }

    this.showVareiaDottedMenu = false;

    window.removeEventListener('mouseup', this.onVareiaDottedMouseUp);
  }
}
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
