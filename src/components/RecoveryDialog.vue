<template>
  <Dialog v-model:open="open">
    <DialogContent class="flex max-h-[90vh] max-w-4xl flex-col">
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.recovery.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t(($) => $.dialog.recovery.description, { ns: 'dialog' }) }}
        </DialogDescription>
      </DialogHeader>

      <ScrollArea class="min-h-0 flex-1 border">
        <div class="space-y-3 p-4">
          <label
            v-for="candidate in candidates"
            :key="candidate.recoveryId"
            class="flex cursor-pointer gap-3 rounded-lg border p-3 hover:bg-muted/40"
          >
            <Checkbox
              :model-value="isSelected(candidate.recoveryId)"
              @update:model-value="toggleSelection(candidate.recoveryId)"
            />
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <div class="font-medium">
                  {{ getCandidateName(candidate) }}
                </div>
                <div class="text-muted-foreground text-sm">
                  {{ getCandidateStatus(candidate) }}
                </div>
              </div>
              <div class="text-muted-foreground truncate text-sm">
                {{ getCandidatePath(candidate) }}
              </div>
              <div class="text-muted-foreground text-xs">
                {{ getCandidateRecoveredAt(candidate) }}
              </div>
            </div>
          </label>
        </div>
      </ScrollArea>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="secondary" @click="emitDecideLater">
          {{ $t(($) => $.dialog.recovery.decideLater, { ns: 'dialog' }) }}
        </Button>
        <Button variant="outline" @click="emitDiscardSelected">
          {{ $t(($) => $.dialog.recovery.discardSelected, { ns: 'dialog' }) }}
        </Button>
        <Button @click="emitRecoverSelected">
          {{ $t(($) => $.dialog.recovery.recoverSelected, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { ref, watch } from 'vue';

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

watch(
  () => [open.value, props.candidates],
  ([isOpen]) => {
    if (isOpen) {
      selectedRecoveryIds.value = selectDefaultCandidates(props.candidates).map(
        (candidate) => candidate.recoveryId,
      );
    }
  },
  { immediate: true },
);

function getCandidateGroupKey(candidate: RecoveryCandidateArgs) {
  return candidate.filePath ?? candidate.recoveryId;
}

function selectDefaultCandidates(candidates: RecoveryCandidateArgs[]) {
  const selectedCandidates = new Map<string, RecoveryCandidateArgs>();

  for (const candidate of candidates) {
    const groupKey = getCandidateGroupKey(candidate);
    const existingCandidate = selectedCandidates.get(groupKey);

    if (
      existingCandidate == null ||
      candidate.updatedAt > existingCandidate.updatedAt
    ) {
      selectedCandidates.set(groupKey, candidate);
    }
  }

  return [...selectedCandidates.values()];
}

function isSelected(recoveryId: string) {
  return selectedRecoveryIds.value.includes(recoveryId);
}

function toggleSelection(recoveryId: string) {
  const candidate = props.candidates.find(
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
    ...selectedRecoveryIds.value.filter((id) => {
      const selectedCandidate = props.candidates.find(
        (item) => item.recoveryId === id,
      );

      return selectedCandidate?.filePath !== candidate.filePath;
    }),
    candidate.recoveryId,
  ];
}

function getCandidateName(candidate: RecoveryCandidateArgs) {
  return candidate.filePath ?? candidate.tempFileName;
}

function getCandidatePath(candidate: RecoveryCandidateArgs) {
  return (
    candidate.filePath ?? t(($) => $.dialog.recovery.untitled, { ns: 'dialog' })
  );
}

function getCandidateStatus(candidate: RecoveryCandidateArgs) {
  if (!candidate.isUntitled && !candidate.sourceExists) {
    return t(($) => $.dialog.recovery.sourceMissing, { ns: 'dialog' });
  }

  if (!candidate.isUntitled && !candidate.sourceMatches) {
    return t(($) => $.dialog.recovery.sourceChanged, { ns: 'dialog' });
  }

  return candidate.hasUnsavedChanges
    ? t(($) => $.dialog.recovery.recoveredDraft, { ns: 'dialog' })
    : t(($) => $.dialog.recovery.recoveredCopy, { ns: 'dialog' });
}

function getCandidateRecoveredAt(candidate: RecoveryCandidateArgs) {
  return new Date(candidate.updatedAt).toLocaleString();
}

function emitRecoverSelected() {
  emit('recover-selected', selectedRecoveryIds.value);
}

function emitDiscardSelected() {
  emit('discard-selected', selectedRecoveryIds.value);
}

function emitDecideLater() {
  emit('decide-later');
}
</script>
