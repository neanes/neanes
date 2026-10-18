<template>
  <FieldGroup>
    <p class="text-sm text-muted-foreground">{{ t('description') }}</p>
    <template v-if="state">
      <p role="status" class="text-sm">
        {{ t('status') }}: {{ t(state.status) }}
      </p>
      <p v-if="state.error" role="alert" class="text-sm text-destructive">
        {{ t('startupError') }} <span class="break-all">{{ state.error }}</span>
      </p>
      <Button
        v-if="state.status === 'error'"
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
  </FieldGroup>
</template>
<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { Button } from '@/components/ui/button';
import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { useEditorServices } from '@/composables/useEditorServices';
import type dialogLabels from '@/i18n/en/dialog.json';
import type { AgentAccessState } from '@/ipc/agentAccess';
const { ipcService } = useEditorServices();
const { t: translate } = useTranslation();
type Label = keyof typeof dialogLabels.preferences.agentAccess;
const t = (key: Label) =>
  translate(($) => $.dialog.preferences.agentAccess[key], { ns: 'dialog' });
const state = ref<AgentAccessState | null>(null);
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
