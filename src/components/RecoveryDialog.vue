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
        <div class="space-y-4 p-4">
          <section
            v-for="group in groupedCandidates"
            :key="group.groupKey"
            class="overflow-hidden rounded-xl border bg-card"
          >
            <div class="border-b px-4 py-3">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 space-y-1">
                  <div class="truncate font-medium">
                    {{ getGroupTitle(group) }}
                  </div>
                  <div class="text-muted-foreground text-sm">
                    {{ getGroupDescription(group) }}
                  </div>
                </div>
                <Badge variant="outline">
                  {{ group.candidates.length }}
                </Badge>
              </div>
            </div>

            <div class="divide-y">
              <label
                v-for="candidate in group.candidates"
                :key="candidate.recoveryId"
                class="flex cursor-pointer gap-3 px-4 py-3 hover:bg-muted/40"
              >
                <Checkbox
                  :model-value="isSelected(candidate.recoveryId)"
                  @update:model-value="toggleSelection(candidate.recoveryId)"
                />
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="min-w-0 truncate font-medium">
                      {{ getCandidateName(candidate) }}
                    </div>
                    <Badge variant="secondary">
                      {{ getCandidateRecordKind(candidate) }}
                    </Badge>
                    <Badge variant="outline">
                      {{ getCandidateStatus(candidate) }}
                    </Badge>
                  </div>

                  <div
                    class="grid gap-x-6 gap-y-1 text-sm text-muted-foreground md:grid-cols-2"
                  >
                    <div>
                      <span class="font-medium text-foreground">
                        {{
                          $t(($) => $.dialog.recovery.originalPath, {
                            ns: 'dialog',
                          })
                        }}:
                      </span>
                      <span class="ml-1 break-all">
                        {{ getCandidateOriginalPath(candidate) }}
                      </span>
                    </div>
                    <div>
                      <span class="font-medium text-foreground">
                        {{
                          $t(($) => $.dialog.recovery.recoveredAt, {
                            ns: 'dialog',
                          })
                        }}:
                      </span>
                      <span class="ml-1">
                        {{ getCandidateRecoveredAt(candidate) }}
                      </span>
                    </div>
                  </div>

                  <div class="text-xs text-muted-foreground">
                    {{ getCandidateStatusDetail(candidate) }}
                  </div>
                </div>
              </label>
            </div>
          </section>
        </div>
      </ScrollArea>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="secondary" @click="emitDecideLater">
          {{ $t(($) => $.dialog.recovery.decideLater, { ns: 'dialog' }) }}
        </Button>
        <Button
          variant="outline"
          :disabled="selectedRecoveryIds.length === 0"
          @click="emitDiscardSelected"
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
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, nextTick, ref, watch } from 'vue';

import { Badge } from '@/components/ui/badge';
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
import {
  getRecoveryCandidateGroupKey,
  getRecoveryCandidateSourceState,
  groupRecoveryCandidates,
  selectDefaultRecoveryCandidates,
} from '@/services/recovery/recoveryCandidates';

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
const groupedCandidates = computed(() =>
  groupRecoveryCandidates(props.candidates),
);

watch(
  () => [open.value, props.candidates],
  ([isOpen]) => {
    if (isOpen) {
      selectedRecoveryIds.value = selectDefaultRecoveryCandidates(
        props.candidates,
      ).map((candidate) => candidate.recoveryId);
    }
  },
  { immediate: true },
);

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

  const groupKey = getRecoveryCandidateGroupKey(candidate);

  selectedRecoveryIds.value = [
    ...selectedRecoveryIds.value.filter((id) => {
      const selectedCandidate = props.candidates.find(
        (item) => item.recoveryId === id,
      );

      return (
        selectedCandidate == null ||
        getRecoveryCandidateGroupKey(selectedCandidate) !== groupKey
      );
    }),
    candidate.recoveryId,
  ];
}

function getCandidateName(candidate: RecoveryCandidateArgs) {
  return candidate.filePath ?? candidate.tempFileName;
}

function getCandidateOriginalPath(candidate: RecoveryCandidateArgs) {
  return (
    candidate.filePath ?? t(($) => $.dialog.recovery.untitled, { ns: 'dialog' })
  );
}

function getCandidateStatus(candidate: RecoveryCandidateArgs) {
  const sourceState = getRecoveryCandidateSourceState(candidate);

  if (sourceState === 'missing') {
    return t(($) => $.dialog.recovery.recoverableCopy, { ns: 'dialog' });
  }

  if (sourceState === 'changed') {
    return t(($) => $.dialog.recovery.sourceChanged, { ns: 'dialog' });
  }

  return candidate.hasUnsavedChanges
    ? t(($) => $.dialog.recovery.recoveredDraft, { ns: 'dialog' })
    : t(($) => $.dialog.recovery.recoveredCopy, { ns: 'dialog' });
}

function getCandidateStatusDetail(candidate: RecoveryCandidateArgs) {
  const sourceState = getRecoveryCandidateSourceState(candidate);

  if (sourceState === 'missing') {
    return t(($) => $.dialog.recovery.originalFileMissing, { ns: 'dialog' });
  }

  if (sourceState === 'changed') {
    return t(($) => $.dialog.recovery.originalFileChanged, { ns: 'dialog' });
  }

  return candidate.hasUnsavedChanges
    ? t(($) => $.dialog.recovery.recoveredDraft, { ns: 'dialog' })
    : t(($) => $.dialog.recovery.recoveredCopy, { ns: 'dialog' });
}

function getCandidateRecordKind(candidate: RecoveryCandidateArgs) {
  return candidate.recordKind === 'current'
    ? t(($) => $.dialog.recovery.currentSnapshot, { ns: 'dialog' })
    : t(($) => $.dialog.recovery.previousSnapshot, { ns: 'dialog' });
}

function getGroupTitle(group: {
  groupKey: string;
  candidates: RecoveryCandidateArgs[];
}) {
  const candidate = group.candidates[0];

  if (candidate == null) {
    return '';
  }

  return candidate.filePath ?? candidate.tempFileName;
}

function getGroupDescription(group: {
  groupKey: string;
  candidates: RecoveryCandidateArgs[];
}) {
  if (group.candidates.length > 1) {
    return t(($) => $.dialog.recovery.groupDescription, { ns: 'dialog' });
  }

  return getCandidateStatusDetail(group.candidates[0] as RecoveryCandidateArgs);
}

function getCandidateRecoveredAt(candidate: RecoveryCandidateArgs) {
  return new Date(candidate.updatedAt).toLocaleString();
}

function emitRecoverSelected() {
  markCloseAsExplicit();
  emit('recover-selected', selectedRecoveryIds.value);
}

function emitDiscardSelected() {
  markCloseAsExplicit();
  emit('discard-selected', selectedRecoveryIds.value);
}

function emitDecideLater() {
  markCloseAsExplicit();
  emit('decide-later');
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
