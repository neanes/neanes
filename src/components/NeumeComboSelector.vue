<template>
  <div class="neume-combo-selector-panel">
    <div
      v-for="combo in displayCombos"
      :key="combo.id"
      class="row chrome-list-item"
      @click="emit('select-neume-combo', combo)"
    >
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
import { PhBookmarkSimple, PhTrashSimple } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import type { PropType } from 'vue';
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

const { allNeumeCombinations, deleteUserNeumeCombination } =
  useNeumeCombinations();

const deleteDialogOpen = ref(false);
const comboPendingDelete = ref<NeumeCombination | null>(null);
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
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
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
