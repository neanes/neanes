<template>
  <FieldGroup>
    <p class="text-sm text-muted-foreground">{{ t('description') }}</p>
    <template v-if="state">
      <Field orientation="horizontal">
        <Switch
          id="agent-access-enabled"
          :model-value="state.enabled"
          :disabled="busy"
          @update:model-value="setEnabled($event === true)"
        />
        <FieldLabel for="agent-access-enabled">{{ t('allow') }}</FieldLabel>
      </Field>
      <p class="text-sm text-muted-foreground">{{ t('disableNotice') }}</p>
      <p role="status" class="text-sm">
        {{ t('status') }}: {{ t(state.status) }}
      </p>
      <p v-if="state.error" role="alert" class="text-sm text-destructive">
        {{ t('startupError') }} <span class="break-all">{{ state.error }}</span>
      </p>
      <Button
        v-if="state.enabled && state.status === 'error'"
        type="button"
        variant="outline"
        :disabled="busy"
        @click="retry"
        >{{ t('retry') }}</Button
      >
      <FieldSet>
        <FieldLegend>{{ t('connect') }}</FieldLegend>
        <FieldDescription>{{ t('connectDescription') }}</FieldDescription>
        <Button type="button" @click="copy(state.configuration)">{{
          t('copyConfiguration')
        }}</Button>
        <p class="text-sm text-muted-foreground">{{ t('runtime') }}</p>
        <p v-if="copied" role="status" class="text-sm">{{ t('copied') }}</p>
      </FieldSet>
      <details>
        <summary class="cursor-pointer text-sm">{{ t('details') }}</summary>
        <p class="mt-3 break-all text-sm">
          {{ t('endpoint') }}: {{ state.endpoint || t('unavailable') }}
        </p>
      </details>
    </template>
    <p v-if="error" role="alert" class="text-sm text-destructive">
      {{ t('failed') }}
    </p>
    <AlertDialog v-model:open="confirmDisable">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('disableTitle') }}</AlertDialogTitle>
          <AlertDialogDescription>{{
            t('disableWarning')
          }}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{{ t('cancel') }}</AlertDialogCancel>
          <AlertDialogAction @click="setEnabled(false, true)">{{
            t('disable')
          }}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </FieldGroup>
</template>
<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';

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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { useEditorServices } from '@/composables/useEditorServices';
import type dialogLabels from '@/i18n/en/dialog.json';
import type { AgentAccessState } from '@/ipc/agentAccess';
const { ipcService } = useEditorServices();
const { t: translate } = useTranslation();
type Label = keyof typeof dialogLabels.preferences.agentAccess;
const t = (key: Label) =>
  translate(($) => $.dialog.preferences.agentAccess[key], { ns: 'dialog' });
const state = ref<AgentAccessState | null>(null);
const confirmDisable = ref(false);
const busy = ref(false),
  error = ref(false),
  copied = ref(false);
async function refresh() {
  try {
    state.value = await ipcService.getAgentAccess();
    error.value = false;
  } catch {
    error.value = true;
  }
}
async function setEnabled(enabled: boolean, discardUnsavedChanges = false) {
  busy.value = true;
  try {
    const result = await ipcService.setAgentAccessEnabled(
      enabled,
      discardUnsavedChanges,
    );
    state.value = result.state;
    confirmDisable.value = result.confirmationRequired;
    error.value = false;
  } catch {
    error.value = true;
  } finally {
    busy.value = false;
  }
}
async function retry() {
  busy.value = true;
  try {
    state.value = await ipcService.retryAgentAccess();
    error.value = false;
  } catch {
    error.value = true;
  } finally {
    busy.value = false;
  }
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
  } catch {
    error.value = true;
  }
}
let timer: ReturnType<typeof setInterval>;
onMounted(() => {
  void refresh();
  timer = setInterval(() => {
    if (!busy.value) {
      void refresh();
    }
  }, 1500);
});
onBeforeUnmount(() => clearInterval(timer));
</script>
