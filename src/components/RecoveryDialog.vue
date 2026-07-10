<template>
  <Dialog v-model:open="open">
    <DialogContent class="flex max-h-[90vh] flex-col sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.recovery.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t(($) => $.dialog.recovery.description, { ns: 'dialog' }) }}
        </DialogDescription>
      </DialogHeader>

      <ScrollArea class="min-h-0 flex-1 border">
        <div class="divide-y">
          <label
            v-for="candidate in displayedCandidates"
            :key="candidate.recoveryId"
            class="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/40"
          >
            <Checkbox
              :model-value="isSelected(candidate.recoveryId)"
              @update:model-value="toggleSelection(candidate.recoveryId)"
            />
            <div class="min-w-0 flex-1 truncate font-medium">
              {{ getCandidateTitle(candidate) }}
            </div>
          </label>
        </div>
      </ScrollArea>

      <DialogFooter class="w-full !flex-row flex-wrap !justify-end gap-2">
        <Button variant="secondary" @click="emitDecideLater">
          {{ $t(($) => $.dialog.recovery.notNow, { ns: 'dialog' }) }}
        </Button>
        <Button
          variant="destructive"
          :disabled="selectedRecoveryIds.length === 0"
          @click="discardConfirmOpen = true"
        >
          {{ $t(($) => $.dialog.recovery.discardSelected, { ns: 'dialog' }) }}
        </Button>
        <Button
          :disabled="selectedRecoveryIds.length === 0"
          @click="emitRecoverSelected"
        >
          {{ $t(($) => $.dialog.recovery.recoverSelected, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AlertDialog v-model:open="discardConfirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ discardConfirmTitle }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ discardConfirmDescription }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
        </AlertDialogCancel>
        <AlertDialogAction @click="emitDiscardSelected">
          {{ $t(($) => $.dialog.recovery.discardSelected, { ns: 'dialog' }) }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, nextTick, ref, watch } from 'vue';

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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { RecoveryCandidateArgs } from '@/ipc/ipcChannels';
import { selectDefaultRecoveryCandidates } from '@/services/recovery/recoveryCandidates';

const open = defineModel<boolean>('open', { required: true });

const props = defineProps<{
  candidates: RecoveryCandidateArgs[];
}>();

const emit = defineEmits<{
  (event: 'recover-selected', candidateIds: string[]): void;
  (event: 'discard-selected', candidateIds: string[]): void;
  (event: 'decide-later'): void;
}>();

const { t } = useTranslation();
const selectedRecoveryIds = ref<string[]>([]);
const discardConfirmOpen = ref(false);
const displayedCandidates = computed(() =>
  selectDefaultRecoveryCandidates(props.candidates).sort(
    (left, right) => right.updatedAt - left.updatedAt,
  ),
);
const discardConfirmTitle = computed(() =>
  t(($) => $.dialog.recovery.discardConfirmTitle, { ns: 'dialog' }),
);
const discardConfirmDescription = computed(() =>
  t(($) => $.dialog.recovery.discardConfirmDescription, { ns: 'dialog' }),
);

watch(
  () => [open.value, props.candidates],
  ([isOpen]) => {
    if (isOpen) {
      selectedRecoveryIds.value = displayedCandidates.value.map(
        (candidate) => candidate.recoveryId,
      );
    }
  },
  { immediate: true },
);

function isSelected(recoveryId: string) {
  return selectedRecoveryIds.value.includes(recoveryId);
}

function toggleSelection(recoveryId: string) {
  const candidate = displayedCandidates.value.find(
    (item) => item.recoveryId === recoveryId,
  );

  if (candidate == null) {
    return;
  }

  if (isSelected(recoveryId)) {
    selectedRecoveryIds.value = selectedRecoveryIds.value.filter(
      (id) => id !== recoveryId,
    );
    return;
  }

  selectedRecoveryIds.value = [
    ...selectedRecoveryIds.value,
    candidate.recoveryId,
  ];
}

function getCandidateTitle(candidate: RecoveryCandidateArgs) {
  const fileName =
    candidate.filePath?.split(/[\\/]/).pop() ?? candidate.tempFileName;

  return fileName;
}

function emitRecoverSelected() {
  emit('recover-selected', selectedRecoveryIds.value);
}

function emitDecideLater() {
  markCloseAsExplicit();
  emit('decide-later');
}

function emitDiscardSelected() {
  discardConfirmOpen.value = false;
  emit('discard-selected', selectedRecoveryIds.value);
}

const explicitCloseRequested = ref(false);

watch(open, (isOpen, wasOpen) => {
  if (wasOpen && !isOpen) {
    if (!explicitCloseRequested.value) {
      emit('decide-later');
    }

    explicitCloseRequested.value = false;
  }
});

function markCloseAsExplicit() {
  explicitCloseRequested.value = true;
  void nextTick(() => {
    if (open.value) {
      explicitCloseRequested.value = false;
    }
  });
}
</script>
