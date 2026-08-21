<template>
  <div
    ref="panelElement"
    class="neume-selector-panel"
    :style="neumeSelectorStyle"
  >
    <template v-for="(row, rowIndex) in neumeRows" :key="rowIndex">
      <div
        v-for="(neume, columnIndex) in row"
        :key="`${rowIndex}-${columnIndex}-${neume ?? 'empty'}`"
        class="neume-cell"
      >
        <template v-if="neume != null">
          <div
            v-if="neume === QuantitativeNeume.VareiaDotted"
            class="menu-container"
            @mousedown="openVareiaDottedMenu"
            @mouseleave="selectedVareiaDotted = null"
          >
            <Neume
              class="neume"
              :neume="QuantitativeNeume.VareiaDotted"
              :font-family="pageSetup.neumeDefaultFontFamily"
              :tooltip="tooltip(neume)"
            />

            <div
              v-if="showVareiaDottedMenu"
              class="menu chrome-menu"
              :class="{
                down: shouldOpenMenuDown(
                  rowIndex,
                  vareiaDottedMenuItems.length,
                ),
              }"
            >
              <div
                v-for="menuItem in getVareiaDottedMenuItems(rowIndex)"
                :key="menuItem"
                class="menu-item chrome-menu-item"
                @mouseenter="selectedVareiaDotted = menuItem"
              >
                <Neume
                  class="neume"
                  :neume="menuItem"
                  :font-family="pageSetup.neumeDefaultFontFamily"
                  :tooltip="tooltip(neume)"
                />
              </div>
            </div>
          </div>
          <template
            v-else-if="
              neume === QuantitativeNeume.OligonPlusHyporoePlusKentemata
            "
          >
            <div
              class="menu-container"
              @mousedown="openHyporoeKentemataMenu"
              @mouseleave="selectedSecondaryGorgon = null"
            >
              <Neume
                class="neume"
                :neume="QuantitativeNeume.OligonPlusHyporoePlusKentemata"
                :font-family="pageSetup.neumeDefaultFontFamily"
                :tooltip="tooltip(neume)"
              />

              <div
                v-if="showHyporoeKentemataMenu"
                class="menu chrome-menu"
                :class="{
                  down: shouldOpenMenuDown(
                    rowIndex,
                    secondaryGorgonMenuItems.length,
                  ),
                }"
              >
                <div
                  v-for="menuItem in getSecondaryGorgonMenuItems(rowIndex)"
                  :key="menuItem.gorgon as string"
                  class="menu-item chrome-menu-item"
                  @mouseenter="selectedSecondaryGorgon = menuItem"
                >
                  <Neume
                    class="neume"
                    :neume="QuantitativeNeume.OligonPlusHyporoePlusKentemata"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                  <Neume
                    v-if="menuItem.gorgon != null"
                    class="neume"
                    :neume="menuItem.gorgon"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                </div>
              </div>
            </div>
          </template>
          <template
            v-else-if="neume === QuantitativeNeume.OligonPlusIsonPlusKentemata"
          >
            <div
              class="menu-container"
              @mousedown="openIsonKentemataMenu"
              @mouseleave="selectedSecondaryGorgon = null"
            >
              <Neume
                class="neume"
                :neume="QuantitativeNeume.OligonPlusIsonPlusKentemata"
                :font-family="pageSetup.neumeDefaultFontFamily"
                :tooltip="tooltip(neume)"
              />

              <div
                v-if="showIsonKentemataMenu"
                class="menu chrome-menu"
                :class="{
                  down: shouldOpenMenuDown(
                    rowIndex,
                    secondaryGorgonMenuItems.length,
                  ),
                }"
              >
                <div
                  v-for="menuItem in getSecondaryGorgonMenuItems(rowIndex)"
                  :key="menuItem.gorgon as string"
                  class="menu-item chrome-menu-item"
                  @mouseenter="selectedSecondaryGorgon = menuItem"
                >
                  <Neume
                    class="neume"
                    :neume="QuantitativeNeume.OligonPlusIsonPlusKentemata"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                  <Neume
                    v-if="menuItem.gorgon != null"
                    class="neume"
                    :neume="menuItem.gorgon"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
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
              class="menu-container"
              @mousedown="openApostrophosKentemataMenu"
              @mouseleave="selectedSecondaryGorgon = null"
            >
              <Neume
                class="neume"
                :neume="QuantitativeNeume.OligonPlusApostrophosPlusKentemata"
                :font-family="pageSetup.neumeDefaultFontFamily"
                :tooltip="tooltip(neume)"
              />

              <div
                v-if="showApostrophosKentemataMenu"
                class="menu chrome-menu"
                :class="{
                  down: shouldOpenMenuDown(
                    rowIndex,
                    secondaryGorgonMenuItems.length,
                  ),
                }"
              >
                <div
                  v-for="menuItem in getSecondaryGorgonMenuItems(rowIndex)"
                  :key="menuItem.gorgon as string"
                  class="menu-item chrome-menu-item"
                  @mouseenter="selectedSecondaryGorgon = menuItem"
                >
                  <Neume
                    class="neume"
                    :neume="
                      QuantitativeNeume.OligonPlusApostrophosPlusKentemata
                    "
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                  <Neume
                    v-if="menuItem.gorgon != null"
                    class="neume"
                    :neume="menuItem.gorgon"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
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
              class="menu-container"
              @mousedown="openElaphronKentemataMenu"
              @mouseleave="selectedSecondaryGorgon = null"
            >
              <Neume
                class="neume"
                :neume="QuantitativeNeume.OligonPlusElaphronPlusKentemata"
                :font-family="pageSetup.neumeDefaultFontFamily"
                :tooltip="tooltip(neume)"
              />

              <div
                v-if="showElaphronKentemataMenu"
                class="menu chrome-menu"
                :class="{
                  down: shouldOpenMenuDown(
                    rowIndex,
                    secondaryGorgonMenuItems.length,
                  ),
                }"
              >
                <div
                  v-for="menuItem in getSecondaryGorgonMenuItems(rowIndex)"
                  :key="menuItem.gorgon as string"
                  class="menu-item chrome-menu-item"
                  @mouseenter="selectedSecondaryGorgon = menuItem"
                >
                  <Neume
                    class="neume"
                    :neume="QuantitativeNeume.OligonPlusElaphronPlusKentemata"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                  <Neume
                    v-if="menuItem.gorgon != null"
                    class="neume"
                    :neume="menuItem.gorgon"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
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
                :tooltip="tooltip(neume)"
              />

              <div
                v-if="showElaphronApostrophosKentemataMenu"
                class="menu chrome-menu"
                :class="{
                  down: shouldOpenMenuDown(
                    rowIndex,
                    secondaryGorgonMenuItems.length,
                  ),
                }"
              >
                <div
                  v-for="menuItem in getSecondaryGorgonMenuItems(rowIndex)"
                  :key="menuItem.gorgon as string"
                  class="menu-item chrome-menu-item"
                  @mouseenter="selectedSecondaryGorgon = menuItem"
                >
                  <Neume
                    class="neume"
                    :neume="
                      QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata
                    "
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                  <Neume
                    v-if="menuItem.gorgon != null"
                    class="neume"
                    :neume="menuItem.gorgon"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                </div>
              </div>
            </div>
          </template>
          <template
            v-else-if="
              neume === QuantitativeNeume.OligonPlusHamiliPlusKentemata
            "
          >
            <div
              class="menu-container"
              @mousedown="openHamiliKentemataMenu"
              @mouseleave="selectedSecondaryGorgon = null"
            >
              <Neume
                class="neume"
                :neume="QuantitativeNeume.OligonPlusHamiliPlusKentemata"
                :font-family="pageSetup.neumeDefaultFontFamily"
                :tooltip="tooltip(neume)"
              />

              <div
                v-if="showHamiliKentemataMenu"
                class="menu chrome-menu"
                :class="{
                  down: shouldOpenMenuDown(
                    rowIndex,
                    secondaryGorgonMenuItems.length,
                  ),
                }"
              >
                <div
                  v-for="menuItem in getSecondaryGorgonMenuItems(rowIndex)"
                  :key="menuItem.gorgon as string"
                  class="menu-item chrome-menu-item"
                  @mouseenter="selectedSecondaryGorgon = menuItem"
                >
                  <Neume
                    class="neume"
                    :neume="QuantitativeNeume.OligonPlusHamiliPlusKentemata"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                  <Neume
                    v-if="menuItem.gorgon != null"
                    class="neume"
                    :neume="menuItem.gorgon"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
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
              class="menu-container"
              @mousedown="openRunningElaphronKentemataMenu"
              @mouseleave="selectedSecondaryGorgon = null"
            >
              <Neume
                class="neume"
                :neume="
                  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata
                "
                :font-family="pageSetup.neumeDefaultFontFamily"
                :tooltip="tooltip(neume)"
              />

              <div
                v-if="showRunningElaphronKentemataMenu"
                class="menu chrome-menu"
                :class="{
                  down: shouldOpenMenuDown(
                    rowIndex,
                    secondaryGorgonMenuItems.length,
                  ),
                }"
              >
                <div
                  v-for="menuItem in getSecondaryGorgonMenuItems(rowIndex)"
                  :key="menuItem.gorgon as string"
                  class="menu-item chrome-menu-item"
                  @mouseenter="selectedSecondaryGorgon = menuItem"
                >
                  <Neume
                    class="neume"
                    :neume="
                      QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata
                    "
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                  <Neume
                    v-if="menuItem.gorgon != null"
                    class="neume"
                    :neume="menuItem.gorgon"
                    :font-family="pageSetup.neumeDefaultFontFamily"
                    :tooltip="tooltip(neume)"
                  />
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <Neume
              class="neume"
              :neume="neume"
              :font-family="pageSetup.neumeDefaultFontFamily"
              :tooltip="tooltip(neume)"
              @click="$emit('select-quantitative-neume', neume)"
            />
          </template>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import type { PropType } from 'vue';
import { computed, onMounted, ref, watch } from 'vue';

import type { AppTooltipValue } from '@/components/AppTooltip.types';
import Neume from '@/components/NeumeGlyph.vue';
import { useResizeObserver } from '@/composables/useResizeObserver';
import { getQuantitativeNeumeLabelSelector } from '@/models/NeumeI18nMappings';
import { GorgonNeume, QuantitativeNeume } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { fontService } from '@/services/FontService';
import type { NeumeKeyboard } from '@/services/NeumeKeyboard';
import {
  NeumeMappingService,
  type SbmuflGlyphName,
} from '@/services/NeumeMappingService';

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

const ascendingPetastiNeumes: QuantitativeNeume[] = [
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
];

const descendingPetastiNeumes: QuantitativeNeume[] = [
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

const vareiaDottedMenuItemsDown = vareiaDottedMenuItems.slice().reverse();

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

const emit = defineEmits<{
  'select-quantitative-neume': [
    neume: QuantitativeNeume,
    secondaryGorgon?: GorgonNeume | null,
  ];
}>();
const { t } = useTranslation();
const { observe: observePanelResize } = useResizeObserver();

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
const panelElement = ref<HTMLElement | null>(null);
const currentColumnCount = ref(5);

const sourceMatrixColumns: QuantitativeNeume[][] = [
  ascendingNeumes,
  ascendingPetastiNeumes,
  descendingPetastiNeumes,
  descendingNeumes,
  combinationNeumes,
];

const maxColumnCount = sourceMatrixColumns.reduce(
  (sum, range) => sum + range.length,
  0,
);

const neumeSelectorStyle = computed(() => ({
  '--neume-column-count': normalizeColumnCount(
    currentColumnCount.value,
  ).toString(),
}));
const neumeRows = computed(() => getNeumeRows(currentColumnCount.value));

onMounted(() => {
  refreshColumnLayout();
});

watch(
  () => props.pageSetup.neumeDefaultFontFamily,
  () => {
    updateCurrentColumnCount();
  },
);

function refreshColumnLayout() {
  const panel = panelElement.value;

  if (!panel) {
    return;
  }

  observePanelResize(panel, () => {
    updateColumnCount(panel);
  });
  updateColumnCount(panel);
}

function updateCurrentColumnCount() {
  const panel = panelElement.value;

  if (!panel) {
    return;
  }

  updateColumnCount(panel);
}

function updateColumnCount(panel: HTMLElement) {
  panel.scrollLeft = 0;
  currentColumnCount.value = getColumnCount(panel.clientWidth);
}

function getNeumeRows(
  targetColumnCount: number,
): (QuantitativeNeume | null)[][] {
  const columnCount = normalizeColumnCount(targetColumnCount);

  return transposeColumnsToRows(fitSourceColumns(columnCount));
}

function fitSourceColumns(targetColumnCount: number) {
  const bands: QuantitativeNeume[][][] = sourceMatrixColumns.map((column) => [
    column,
  ]);

  while (bands.length > targetColumnCount) {
    let mergeIndex = 0;
    let mergeLength =
      getSourceBandNeumeCount(bands[0]) + getSourceBandNeumeCount(bands[1]);

    for (let index = 1; index < bands.length - 1; index++) {
      const length =
        getSourceBandNeumeCount(bands[index]) +
        getSourceBandNeumeCount(bands[index + 1]);

      if (length < mergeLength) {
        mergeIndex = index;
        mergeLength = length;
      }
    }

    bands.splice(mergeIndex, 2, [
      ...bands[mergeIndex],
      ...bands[mergeIndex + 1],
    ]);
  }

  // A merged column stacks its source groups top to bottom, in order.
  const columns = bands.map((band) => band.flat());

  while (columns.length < targetColumnCount) {
    let splitIndex = -1;

    for (let index = 0; index < columns.length; index++) {
      if (columns[index].length < 2) {
        continue;
      }

      if (
        splitIndex < 0 ||
        columns[index].length > columns[splitIndex].length
      ) {
        splitIndex = index;
      }
    }

    if (splitIndex < 0) {
      break;
    }

    const column = columns[splitIndex];
    const splitPoint = Math.ceil(column.length / 2);

    columns.splice(
      splitIndex,
      1,
      column.slice(0, splitPoint),
      column.slice(splitPoint),
    );
  }

  return columns;
}

function getSourceBandNeumeCount(band: QuantitativeNeume[][]) {
  return band.reduce((sum, range) => sum + range.length, 0);
}

function transposeColumnsToRows(
  columns: QuantitativeNeume[][],
): (QuantitativeNeume | null)[][] {
  const rowCount = Math.max(0, ...columns.map((column) => column.length));

  return Array.from({ length: rowCount }, (_, rowIndex) =>
    columns.map((column) =>
      rowIndex < column.length ? column[rowIndex] : null,
    ),
  );
}

function normalizeColumnCount(columnCount: number) {
  return Math.max(1, Math.min(maxColumnCount, Math.floor(columnCount)));
}

function getColumnCount(width: number) {
  const minColumnWidth = getMinColumnWidth();

  if (minColumnWidth <= 0) {
    return 1;
  }

  let columnCount = Math.max(
    1,
    Math.min(maxColumnCount, Math.floor(width / minColumnWidth)),
  );

  while (columnCount > 1 && getLayoutWidth(columnCount) > width) {
    columnCount--;
  }

  return columnCount;
}

function getLayoutWidth(columnCount: number) {
  return fitSourceColumns(columnCount).reduce(
    (sum, column) => sum + getColumnWidth(column),
    0,
  );
}

function getColumnWidth(column: QuantitativeNeume[]) {
  return Math.max(getMinColumnWidth(), ...column.map(getNeumeWidth));
}

function getNeumeWidth(neume: QuantitativeNeume) {
  const mapping = NeumeMappingService.getMapping(neume);
  const advanceWidth =
    getAdvanceWidth(
      props.pageSetup.neumeDefaultFontFamily,
      mapping.glyphName,
    ) ??
    getAdvanceWidth('Neanes', mapping.glyphName) ??
    1;

  return Math.max(getMinColumnWidth(), advanceWidth * getNeumeFontSize());
}

function getAdvanceWidth(fontFamily: string, glyphName: SbmuflGlyphName) {
  try {
    return fontService.getAdvanceWidth(fontFamily, glyphName);
  } catch {
    return undefined;
  }
}

function getMinColumnWidth() {
  return (
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 2.5
  );
}

function getNeumeFontSize() {
  return (
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 1.6
  );
}

function shouldOpenMenuDown(rowIndex: number, menuItemCount: number) {
  return rowIndex + 1 < menuItemCount;
}

function getSecondaryGorgonMenuItems(rowIndex: number) {
  return shouldOpenMenuDown(rowIndex, secondaryGorgonMenuItems.length)
    ? secondaryGorgonMenuItemsDown
    : secondaryGorgonMenuItems;
}

function getVareiaDottedMenuItems(rowIndex: number) {
  return shouldOpenMenuDown(rowIndex, vareiaDottedMenuItems.length)
    ? vareiaDottedMenuItemsDown
    : vareiaDottedMenuItems;
}

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

function tooltip(neume: QuantitativeNeume): AppTooltipValue {
  const displayName = getQuantitativeNeumeLabelSelector(neume);
  const label = t(displayName, { ns: 'model' });
  const mapping = props.neumeKeyboard.findMappingForNeume(neume);
  if (mapping) {
    return {
      label,
      shortcut: props.neumeKeyboard.generateTooltipKeys(mapping),
    };
  } else {
    return label;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume-selector-panel {
  display: grid;
  grid-auto-rows: var(--neume-height);
  grid-template-columns: repeat(
    var(--neume-column-count),
    minmax(var(--neume-height), max-content)
  );
  align-content: start;
  justify-content: start;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  color: var(--chrome-menu-foreground);

  --neume-height: 2.5rem;
}

.neume-cell {
  display: flex;
  justify-content: center;
  min-width: var(--neume-height);
  height: var(--neume-height);
}

.neume-selector-panel :deep(.neume) {
  font-size: 1.6rem;

  text-align: center;

  cursor: default;
  user-select: none;

  min-width: var(--neume-height);
  height: var(--neume-height);
}

.neume-cell > :deep(.neume) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: max-content;
}

.menu-container > :deep(.neume) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: max-content;
}

.neume-selector-panel :deep(.neume:hover) {
  background-color: var(--chrome-hover);
}

.menu :deep(.neume:hover) {
  background-color: transparent;
}

.menu-container {
  display: flex;
  position: relative;
  min-width: var(--neume-height);
  width: max-content;
  height: 100%;
}

.menu {
  position: absolute;
  z-index: 40;
  bottom: 0;
  min-width: 100%;
  width: max-content;
}

.menu.down {
  bottom: initial;
  top: 0;
}

.menu-item {
  height: var(--neume-height);
  min-width: 100%;
  width: max-content;
  padding: 3px 0;
  white-space: nowrap;
}
</style>
