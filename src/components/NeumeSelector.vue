<template>
  <div class="neume-selector-panel">
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in ascendingNeumes"
        :key="`ascendingNeumes-${index}`"
        :neume="neume"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
        @click.native="$emit('select-quantitative-neume', neume)"
      ></Neume>
    </div>
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in ascendingNeumesWithPetasti"
        :key="`ascendingNeumesWithPetasti-${index}`"
        :neume="neume"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
        @click.native="$emit('select-quantitative-neume', neume)"
      ></Neume>
    </div>
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in descendingNeumes"
        :key="`descendingNeumes-${index}`"
        :neume="neume"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
        @click.native="$emit('select-quantitative-neume', neume)"
      ></Neume>
    </div>
    <div class="row">
      <template v-for="(neume, index) in combinationNeumes">
        <template
          v-if="neume === QuantitativeNeume.OligonPlusHyporoePlusKentemata"
        >
          <div
            :key="`combinationNeumes-${index}`"
            class="menu-container"
            @mousedown="openHyporoeMenu"
            @mouseleave="selectedHyporoe = null"
          >
            <Neume
              class="neume"
              :neume="QuantitativeNeume.OligonPlusHyporoePlusKentemata"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
            />

            <div class="menu" v-if="showHyporoeMenu">
              <div
                class="menu-item"
                v-for="menuItem in hyporoeMenuItems"
                :key="menuItem.gorgon"
                @mouseenter="selectedHyporoe = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusHyporoePlusKentemata"
                  :fontFamily="pageSetup.neumeDefaultFontFamily"
                />
                <Neume
                  class="red neume"
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
            @click.native="$emit('select-quantitative-neume', neume)"
          ></Neume>
        </template>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { GorgonNeume, QuantitativeNeume } from '@/models/Neumes';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import Neume from '@/components/Neume.vue';
import { PageSetup } from '@/models/PageSetup';

interface HyporoeMenuItem {
  gorgon: GorgonNeume | null;
}

@Component({
  components: {
    SyllableNeumeBox,
    Neume,
  },
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
    QuantitativeNeume.PetastiPlusApostrophos,
    QuantitativeNeume.PetastiPlusElaphron,
    QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
    QuantitativeNeume.PetastiPlusRunningElaphron,
    QuantitativeNeume.PetastiPlusHyporoe,
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
  ];

  combinationNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.Kentemata,
    QuantitativeNeume.OligonPlusKentemata,
    QuantitativeNeume.KentemataPlusOligon,
    QuantitativeNeume.OligonPlusIsonPlusKentemata,
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

  hyporoeMenuItems: HyporoeMenuItem[] = [
    { gorgon: GorgonNeume.TrigorgonDottedLeft1Secondary },
    { gorgon: GorgonNeume.TrigorgonSecondary },
    { gorgon: GorgonNeume.DigorgonDottedLeft1Secondary },
    { gorgon: GorgonNeume.DigorgonSecondary },
    { gorgon: GorgonNeume.GorgonDottedRightSecondary },
    { gorgon: GorgonNeume.GorgonDottedLeftSecondary },
    { gorgon: GorgonNeume.GorgonSecondary },
    { gorgon: null },
  ];

  showHyporoeMenu: boolean = false;
  selectedHyporoe: HyporoeMenuItem | null = null;

  openHyporoeMenu() {
    this.showHyporoeMenu = true;
    window.addEventListener('mouseup', this.onHyporoeMouseUp);
  }

  onHyporoeMouseUp() {
    if (this.selectedHyporoe) {
      this.$emit(
        'select-quantitative-neume',
        QuantitativeNeume.OligonPlusHyporoePlusKentemata,
        this.selectedHyporoe.gorgon,
      );
    }

    this.showHyporoeMenu = false;

    window.removeEventListener('mouseup', this.onHyporoeMouseUp);
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
}

.neume:hover {
  background-color: aliceblue;
}

.menu-container {
  display: flex;
  position: relative;
  height: var(--neume-height);
}

.menu {
  position: absolute;
  z-index: 999;
  background-color: white;
  border: 1px solid black;
  box-sizing: border-box;
  bottom: 0;
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
