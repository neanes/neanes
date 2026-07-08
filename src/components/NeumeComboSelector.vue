<template>
  <div
    ref="panelElement"
    class="neume-combo-selector-panel"
    @dragover="handlePanelDragOver"
    @drop="handlePanelDrop"
  >
    <div
      v-for="combo in displayCombos"
      :key="combo.id"
      class="row chrome-list-item"
      :class="{
        'is-dragging': draggedComboId === combo.id,
        'drop-before':
          dropTarget?.id === combo.id && dropTarget.placement === 'before',
        'drop-after':
          dropTarget?.id === combo.id && dropTarget.placement === 'after',
      }"
      @dragover="handleRowDragOver(combo, $event)"
      @drop="handleRowDrop(combo, $event)"
      @click="emit('select-neume-combo', combo)"
    >
      <Button
        size="icon"
        variant="ghost"
        class="drag-handle"
        draggable="true"
        :aria-label="
          t(($) => $.dialog.neumeCombinations.dragHandle, { ns: 'dialog' })
        "
        @click.stop
        @dragstart="handleDragStart(combo, $event)"
        @dragend="handleDragEnd"
      >
        <PhDotsSixVertical class="size-4" aria-hidden="true" />
      </Button>
      <div class="combo-preview">
        <SyllableNeumeBox
          v-for="(neume, neumeIndex) in combo.elements"
          :key="neumeIndex"
          :note="neume"
          :page-setup="pageSetup"
          class="neume"
        />
      </div>
      <div v-if="combo.source === 'user'" class="user-combo-controls">
        <PhBookmarkSimple class="user-combo-indicator" weight="fill" />
        <Button
          size="icon"
          variant="ghost"
          class="user-combo-delete"
          @click.stop="promptDelete(combo)"
        >
          <PhTrashSimple class="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>

    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{
              t(($) => $.dialog.neumeCombinations.deleteTitle, { ns: 'dialog' })
            }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t(($) => $.dialog.neumeCombinations.deleteDescription, {
                ns: 'dialog',
              })
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {{ t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </AlertDialogCancel>
          <AlertDialogAction @click="confirmDelete">
            {{ t(($) => $.dialog.neumeCombinations.delete, { ns: 'dialog' }) }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import {
  PhBookmarkSimple,
  PhDotsSixVertical,
  PhTrashSimple,
} from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import type { PropType } from 'vue';
import { onBeforeUnmount } from 'vue';
import { computed, ref } from 'vue';

import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { NeumeCombinationOrderPlacement } from '@/composables/neumeCombinationOrder';
import { useNeumeCombinations } from '@/composables/useNeumeCombinations';
import type { NeumeCombination } from '@/models/NeumeCommonCombinations';
import type { PageSetup } from '@/models/PageSetup';

const emit = defineEmits(['select-neume-combo']);
defineProps({
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const {
  allNeumeCombinations,
  deleteUserNeumeCombination,
  reorderNeumeCombination,
} = useNeumeCombinations();

const deleteDialogOpen = ref(false);
const comboPendingDelete = ref<NeumeCombination | null>(null);
const draggedComboId = ref<string | null>(null);
const panelElement = ref<HTMLElement | null>(null);
const dropTarget = ref<{
  id: string;
  placement: NeumeCombinationOrderPlacement;
} | null>(null);
const { t } = useTranslation();

const displayCombos = computed(() => allNeumeCombinations.value);

function promptDelete(combo: NeumeCombination) {
  comboPendingDelete.value = combo;
  deleteDialogOpen.value = true;
}

function confirmDelete() {
  if (comboPendingDelete.value == null) {
    return;
  }

  deleteUserNeumeCombination(comboPendingDelete.value.id);
  comboPendingDelete.value = null;
  deleteDialogOpen.value = false;
}

function handleDragStart(combo: NeumeCombination, event: DragEvent) {
  if (event.dataTransfer == null) {
    return;
  }

  draggedComboId.value = combo.id;
  dropTarget.value = null;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', combo.id);
  addGlobalDragListeners();
}

function handleRowDragOver(combo: NeumeCombination, event: DragEvent) {
  if (draggedComboId.value == null || draggedComboId.value === combo.id) {
    return;
  }

  event.preventDefault();
  dropTarget.value = {
    id: combo.id,
    placement: getDropPlacement(event, event.currentTarget),
  };
  if (event.dataTransfer != null) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleRowDrop(combo: NeumeCombination, event: DragEvent) {
  event.preventDefault();

  if (draggedComboId.value == null || draggedComboId.value === combo.id) {
    handleDragEnd();
    return;
  }

  reorderNeumeCombination(
    draggedComboId.value,
    combo.id,
    getDropPlacement(event, event.currentTarget),
  );
  handleDragEnd();
}

function handlePanelDragOver(event: DragEvent) {
  if (draggedComboId.value == null) {
    return;
  }

  const target = event.target;
  const rowElement = target instanceof Element ? target.closest('.row') : null;

  if (rowElement != null) {
    return;
  }

  const placement = resolvePanelDropPlacement(event);

  if (placement == null) {
    return;
  }

  event.preventDefault();
  dropTarget.value = {
    id: placement.combo.id,
    placement: placement.placement,
  };
  if (event.dataTransfer != null) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handlePanelDrop(event: DragEvent) {
  event.preventDefault();

  const target = event.target;
  const rowElement = target instanceof Element ? target.closest('.row') : null;

  if (rowElement != null) {
    return;
  }

  const placement = resolvePanelDropPlacement(event);

  if (draggedComboId.value == null || placement == null) {
    handleDragEnd();
    return;
  }

  reorderNeumeCombination(
    draggedComboId.value,
    placement.combo.id,
    placement.placement,
  );
  handleDragEnd();
}

function handleDragEnd() {
  draggedComboId.value = null;
  dropTarget.value = null;
  removeGlobalDragListeners();
}

function getDropPlacement(event: DragEvent, target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;

  if (element == null) {
    return 'before';
  }

  const rect = element.getBoundingClientRect();
  const midpoint = rect.top + rect.height / 2;

  return event.clientY < midpoint ? 'before' : 'after';
}

function resolvePanelDropPlacement(event: DragEvent) {
  const panel = panelElement.value;
  const combos = displayCombos.value;

  if (panel == null || combos.length === 0) {
    return null;
  }

  const firstRow = panel.querySelector('.row') as HTMLElement | null;
  const lastRow = panel.querySelector(
    '.row:last-of-type',
  ) as HTMLElement | null;

  if (
    firstRow != null &&
    event.clientY <= firstRow.getBoundingClientRect().top
  ) {
    return { combo: combos[0], placement: 'before' as const };
  }

  if (
    lastRow != null &&
    event.clientY >= lastRow.getBoundingClientRect().bottom
  ) {
    return { combo: combos.at(-1)!, placement: 'after' as const };
  }

  return null;
}

function handleWindowDragOver(event: DragEvent) {
  if (draggedComboId.value == null) {
    return;
  }

  const placement = resolveWindowDropPlacement(event);

  if (placement == null) {
    return;
  }

  event.preventDefault();
  dropTarget.value = {
    id: placement.combo.id,
    placement: placement.placement,
  };
  if (event.dataTransfer != null) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleWindowDrop(event: DragEvent) {
  if (draggedComboId.value == null) {
    return;
  }

  const placement = resolveWindowDropPlacement(event);

  if (placement == null) {
    handleDragEnd();
    return;
  }

  event.preventDefault();
  reorderNeumeCombination(
    draggedComboId.value,
    placement.combo.id,
    placement.placement,
  );
  handleDragEnd();
}

function resolveWindowDropPlacement(event: DragEvent) {
  const panel = panelElement.value;
  const combos = displayCombos.value;

  if (panel == null || combos.length === 0) {
    return null;
  }

  const panelRect = panel.getBoundingClientRect();
  const firstCombo = combos[0];
  const lastCombo = combos.at(-1);

  if (event.clientY < panelRect.top) {
    return { combo: firstCombo, placement: 'before' as const };
  }

  if (event.clientY > panelRect.bottom && lastCombo != null) {
    return { combo: lastCombo, placement: 'after' as const };
  }

  return resolvePanelDropPlacement(event);
}

function addGlobalDragListeners() {
  window.addEventListener('dragover', handleWindowDragOver);
  window.addEventListener('drop', handleWindowDrop);
}

function removeGlobalDragListeners() {
  window.removeEventListener('dragover', handleWindowDragOver);
  window.removeEventListener('drop', handleWindowDrop);
}

onBeforeUnmount(() => {
  removeGlobalDragListeners();
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume-combo-selector-panel {
  min-height: 100%;
}

.row {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
}

.row.drop-before::before,
.row.drop-after::after {
  content: '';
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  height: 2px;
  border-radius: 999px;
  background: var(--chrome-accent, currentColor);
}

.row.drop-before::before {
  top: 0;
}

.row.drop-after::after {
  bottom: 0;
}

.row.is-dragging {
  opacity: 0.55;
}

.drag-handle {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.combo-preview {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  overflow: hidden;
}

.user-combo-controls {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  justify-self: end;
  flex-shrink: 0;
}

.user-combo-indicator {
  width: 0.75rem;
  height: 0.75rem;
}

.user-combo-delete {
  width: 1.5rem;
  height: 1.5rem;
}

.neume {
  margin: 0 0.125rem;
  --zoom: 1;
}
</style>
