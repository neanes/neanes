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
              :font-family="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div v-if="showVareiaDottedMenu" class="menu">
              <div
                v-for="menuItem in vareiaDottedMenuItems"
                :key="menuItem"
                class="menu-item"
                @mouseenter="selectedVareiaDotted = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="menuItem"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <Neume
            :key="`ascendingNeumes-${index}`"
            class="neume"
            :neume="neume"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :title="tooltip(neume)"
            @click="$emit('select-quantitative-neume', neume)"
          />
        </template>
      </template>
    </div>
    <div class="row">
      <Neume
        v-for="(neume, index) in ascendingNeumesWithPetasti"
        :key="`ascendingNeumesWithPetasti-${index}`"
        class="neume"
        :neume="neume"
        :font-family="pageSetup.neumeDefaultFontFamily"
        :title="tooltip(neume)"
        @click="$emit('select-quantitative-neume', neume)"
      />
    </div>
    <div class="row">
      <Neume
        v-for="(neume, index) in descendingNeumes"
        :key="`descendingNeumes-${index}`"
        class="neume"
        :neume="neume"
        :font-family="pageSetup.neumeDefaultFontFamily"
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
              :font-family="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div v-if="showHyporoeKentemataMenu" class="menu">
              <div
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                class="menu-item"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusHyporoePlusKentemata"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  v-if="menuItem.gorgon != null"
                  class="neume"
                  :neume="menuItem.gorgon"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
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
              :font-family="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div v-if="showIsonKentemataMenu" class="menu down">
              <div
                v-for="menuItem in secondaryGorgonMenuItemsDown"
                :key="menuItem.gorgon as string"
                class="menu-item"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusIsonPlusKentemata"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  v-if="menuItem.gorgon != null"
                  class="neume"
                  :neume="menuItem.gorgon"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
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
              :font-family="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div v-if="showApostrophosKentemataMenu" class="menu">
              <div
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                class="menu-item"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusApostrophosPlusKentemata"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  v-if="menuItem.gorgon != null"
                  class="neume"
                  :neume="menuItem.gorgon"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
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
              :font-family="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div v-if="showElaphronKentemataMenu" class="menu">
              <div
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                class="menu-item"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusElaphronPlusKentemata"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  v-if="menuItem.gorgon != null"
                  class="neume"
                  :neume="menuItem.gorgon"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
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
              :font-family="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div v-if="showElaphronApostrophosKentemataMenu" class="menu">
              <div
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                class="menu-item"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="
                    QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata
                  "
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  v-if="menuItem.gorgon != null"
                  class="neume"
                  :neume="menuItem.gorgon"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
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
              :font-family="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div v-if="showHamiliKentemataMenu" class="menu">
              <div
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                class="menu-item"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="QuantitativeNeume.OligonPlusHamiliPlusKentemata"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  v-if="menuItem.gorgon != null"
                  class="neume"
                  :neume="menuItem.gorgon"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
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
              :font-family="pageSetup.neumeDefaultFontFamily"
              :title="tooltip(neume)"
            />

            <div v-if="showRunningElaphronKentemataMenu" class="menu">
              <div
                v-for="menuItem in secondaryGorgonMenuItems"
                :key="menuItem.gorgon as string"
                class="menu-item"
                @mouseenter="selectedSecondaryGorgon = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="
                    QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata
                  "
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
                <Neume
                  v-if="menuItem.gorgon != null"
                  class="neume"
                  :neume="menuItem.gorgon"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :title="tooltip(neume)"
                />
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <Neume
            :key="`combinationNeumes-${index}`"
            class="neume"
            :neume="neume"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :title="tooltip(neume)"
            @click="$emit('select-quantitative-neume', neume)"
          />
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { PropType, ref } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { getQuantitativeNeumeLabelSelector } from '@/models/NeumeI18nMappings';
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

const props = defineProps({
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  neumeKeyboard: {
    type: Object as PropType<NeumeKeyboard>,
    required: true,
  },
});

const emit = defineEmits(['select-quantitative-neume']);
const { t } = useTranslation();

const showHyporoeKentemataMenu = ref(false);
const showIsonKentemataMenu = ref(false);
const showApostrophosKentemataMenu = ref(false);
const showElaphronKentemataMenu = ref(false);
const showElaphronApostrophosKentemataMenu = ref(false);
const showRunningElaphronKentemataMenu = ref(false);
const showHamiliKentemataMenu = ref(false);
const showVareiaDottedMenu = ref(false);
const selectedSecondaryGorgon = ref<SecondaryGorgonMenuItem | null>(null);
const selectedVareiaDotted = ref<QuantitativeNeume | null>(null);

function openHyporoeKentemataMenu() {
  showHyporoeKentemataMenu.value = true;
  window.addEventListener('mouseup', onHyporoeMouseUp);
}

function openIsonKentemataMenu() {
  showIsonKentemataMenu.value = true;
  window.addEventListener('mouseup', onIsonKentemataMouseUp);
}

function openApostrophosKentemataMenu() {
  showApostrophosKentemataMenu.value = true;
  window.addEventListener('mouseup', onApostrophosKentemataMouseUp);
}

function openElaphronKentemataMenu() {
  showElaphronKentemataMenu.value = true;
  window.addEventListener('mouseup', onElaphronKentemataMouseUp);
}

function openElaphronApostrophosKentemataMenu() {
  showElaphronApostrophosKentemataMenu.value = true;
  window.addEventListener('mouseup', onElaphronApostrophosKentemataMouseUp);
}

function openRunningElaphronKentemataMenu() {
  showRunningElaphronKentemataMenu.value = true;
  window.addEventListener('mouseup', onRunningElaphronKentemataMouseUp);
}

function openHamiliKentemataMenu() {
  showHamiliKentemataMenu.value = true;
  window.addEventListener('mouseup', onHamiliKentemataMouseUp);
}

function onHyporoeMouseUp() {
  if (selectedSecondaryGorgon.value) {
    emit(
      'select-quantitative-neume',
      QuantitativeNeume.OligonPlusHyporoePlusKentemata,
      selectedSecondaryGorgon.value.gorgon,
    );
  }

  showHyporoeKentemataMenu.value = false;

  window.removeEventListener('mouseup', onHyporoeMouseUp);
}

function onIsonKentemataMouseUp() {
  if (selectedSecondaryGorgon.value) {
    emit(
      'select-quantitative-neume',
      QuantitativeNeume.OligonPlusIsonPlusKentemata,
      selectedSecondaryGorgon.value.gorgon,
    );
  }

  showIsonKentemataMenu.value = false;

  window.removeEventListener('mouseup', onIsonKentemataMouseUp);
}

function onApostrophosKentemataMouseUp() {
  if (selectedSecondaryGorgon.value) {
    emit(
      'select-quantitative-neume',
      QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
      selectedSecondaryGorgon.value.gorgon,
    );
  }

  showApostrophosKentemataMenu.value = false;

  window.removeEventListener('mouseup', onApostrophosKentemataMouseUp);
}

function onElaphronKentemataMouseUp() {
  if (selectedSecondaryGorgon.value) {
    emit(
      'select-quantitative-neume',
      QuantitativeNeume.OligonPlusElaphronPlusKentemata,
      selectedSecondaryGorgon.value.gorgon,
    );
  }

  showElaphronKentemataMenu.value = false;

  window.removeEventListener('mouseup', onElaphronKentemataMouseUp);
}

function onElaphronApostrophosKentemataMouseUp() {
  if (selectedSecondaryGorgon.value) {
    emit(
      'select-quantitative-neume',
      QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
      selectedSecondaryGorgon.value.gorgon,
    );
  }

  showElaphronApostrophosKentemataMenu.value = false;

  window.removeEventListener('mouseup', onElaphronApostrophosKentemataMouseUp);
}

function onRunningElaphronKentemataMouseUp() {
  if (selectedSecondaryGorgon.value) {
    emit(
      'select-quantitative-neume',
      QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
      selectedSecondaryGorgon.value.gorgon,
    );
  }

  showRunningElaphronKentemataMenu.value = false;

  window.removeEventListener('mouseup', onRunningElaphronKentemataMouseUp);
}

function onHamiliKentemataMouseUp() {
  if (selectedSecondaryGorgon.value) {
    emit(
      'select-quantitative-neume',
      QuantitativeNeume.OligonPlusHamiliPlusKentemata,
      selectedSecondaryGorgon.value.gorgon,
    );
  }

  showHamiliKentemataMenu.value = false;

  window.removeEventListener('mouseup', onHamiliKentemataMouseUp);
}

function openVareiaDottedMenu() {
  showVareiaDottedMenu.value = true;
  window.addEventListener('mouseup', onVareiaDottedMouseUp);
}

function onVareiaDottedMouseUp() {
  if (selectedVareiaDotted.value) {
    emit('select-quantitative-neume', selectedVareiaDotted.value);
  }

  showVareiaDottedMenu.value = false;

  window.removeEventListener('mouseup', onVareiaDottedMouseUp);
}

function tooltip(neume: QuantitativeNeume) {
  const displayName = getQuantitativeNeumeLabelSelector(neume);
  const mapping = props.neumeKeyboard.findMappingForNeume(neume);
  if (mapping) {
    return `${t(displayName, { ns: 'model' })} (${props.neumeKeyboard.generateTooltip(
      mapping,
    )})`;
  } else {
    return `${t(displayName, { ns: 'model' })}`;
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
