<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{
          t(($) => $.dialog.mcpSetup.title, { ns: 'dialog' })
        }}</DialogTitle>
        <DialogDescription>{{
          t(($) => $.dialog.mcpSetup.description, { ns: 'dialog' })
        }}</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel for="mcp-client">{{
              t(($) => $.dialog.mcpSetup.client, { ns: 'dialog' })
            }}</FieldLabel>
            <NativeSelect id="mcp-client" v-model="client" class="w-full">
              <NativeSelectOption value="codex">Codex</NativeSelectOption>
              <NativeSelectOption value="claude"
                >Claude Code</NativeSelectOption
              >
              <NativeSelectOption value="other">{{
                t(($) => $.dialog.mcpSetup.otherClient, { ns: 'dialog' })
              }}</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field v-if="client !== 'other'">
            <FieldLabel for="mcp-format">{{
              t(($) => $.dialog.mcpSetup.format, { ns: 'dialog' })
            }}</FieldLabel>
            <NativeSelect id="mcp-format" v-model="format" class="w-full">
              <NativeSelectOption value="command">{{
                t(($) => $.dialog.mcpSetup.terminalCommand, { ns: 'dialog' })
              }}</NativeSelectOption>
              <NativeSelectOption value="configuration">{{
                t(($) => $.dialog.mcpSetup.configuration, { ns: 'dialog' })
              }}</NativeSelectOption>
            </NativeSelect>
          </Field>
        </div>

        <p class="text-sm text-muted-foreground">{{ instructions }}</p>
        <Field v-if="launch">
          <FieldLabel for="mcp-snippet">{{ snippetLabel }}</FieldLabel>
          <Textarea
            id="mcp-snippet"
            :model-value="snippet"
            readonly
            spellcheck="false"
            class="max-h-64 min-h-28 resize-y font-mono break-all"
          />
        </Field>
        <p v-if="loadFailed" role="alert" class="text-sm text-destructive">
          {{ t(($) => $.dialog.mcpSetup.loadFailed, { ns: 'dialog' }) }}
        </p>
        <div class="flex items-center gap-3">
          <Button :disabled="!launch" type="button" @click="copySnippet"
            ><PhCopy />{{ copyLabel }}</Button
          >
          <p
            role="status"
            class="text-sm"
            :class="
              copyState === 'failed'
                ? 'text-destructive'
                : 'text-muted-foreground'
            "
          >
            {{ copyStatus }}
          </p>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ t(($) => $.dialog.mcpSetup.reconnect, { ns: 'dialog' }) }}
        </p>
        <details class="text-sm">
          <summary class="cursor-pointer font-medium">
            {{ t(($) => $.dialog.mcpSetup.accessTitle, { ns: 'dialog' }) }}
          </summary>
          <p class="mt-2 leading-6 text-muted-foreground">
            {{
              t(($) => $.dialog.mcpSetup.accessDescription, { ns: 'dialog' })
            }}
          </p>
        </details>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" as-child>
          <a :href="documentationUrl" target="_blank" rel="noopener noreferrer"
            ><PhBookOpen />{{
              t(($) => $.dialog.mcpSetup.documentation, { ns: 'dialog' })
            }}</a
          >
        </Button>
        <DialogClose as-child
          ><Button variant="outline" type="button">{{
            t(($) => $.dialog.about.close, { ns: 'dialog' })
          }}</Button></DialogClose
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { PhBookOpen, PhCopy } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed, onMounted, ref, watch } from 'vue';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useEditorServices } from '@/composables/useEditorServices';
import type { McpLaunchConfiguration } from '@/ipc/ipcChannels';
import {
  createMcpSetupSnippet,
  type McpClient,
  type McpSetupFormat,
} from '@/services/integration/mcpSetup';

const open = defineModel<boolean>('open', { required: true });
const { t } = useTranslation();
const { ipcService, platformService } = useEditorServices();
const client = ref<McpClient>('codex');
const format = ref<McpSetupFormat>('command');
const launch = ref<McpLaunchConfiguration | null>(null);
const loadFailed = ref(false);
const copyState = ref<'idle' | 'copied' | 'failed'>('idle');
const documentationUrl = new URL(
  'agent-access.html',
  import.meta.env.VITE_GUIDE_URL,
).href;
const isCommand = computed(
  () => client.value !== 'other' && format.value === 'command',
);
const snippet = computed(() =>
  launch.value
    ? createMcpSetupSnippet(
        launch.value,
        client.value,
        format.value,
        platformService.isWin,
      )
    : '',
);
const snippetLabel = computed(() =>
  isCommand.value
    ? platformService.isWin
      ? 'PowerShell'
      : platformService.isMac
        ? 'macOS'
        : 'Linux'
    : client.value === 'codex'
      ? 'TOML'
      : 'JSON',
);
const instructions = computed(() =>
  isCommand.value
    ? t(($) => $.dialog.mcpSetup.commandInstructions, { ns: 'dialog' })
    : client.value === 'codex'
      ? t(($) => $.dialog.mcpSetup.tomlInstructions, { ns: 'dialog' })
      : client.value === 'claude'
        ? t(($) => $.dialog.mcpSetup.claudeJsonInstructions, { ns: 'dialog' })
        : t(($) => $.dialog.mcpSetup.jsonInstructions, { ns: 'dialog' }),
);
const copyLabel = computed(() =>
  isCommand.value
    ? t(($) => $.dialog.mcpSetup.copyCommand, { ns: 'dialog' })
    : client.value === 'codex'
      ? t(($) => $.dialog.mcpSetup.copyToml, { ns: 'dialog' })
      : t(($) => $.dialog.mcpSetup.copyJson, { ns: 'dialog' }),
);
const copyStatus = computed(() =>
  copyState.value === 'copied'
    ? t(($) => $.dialog.mcpSetup.copied, { ns: 'dialog' })
    : copyState.value === 'failed'
      ? t(($) => $.dialog.mcpSetup.copyFailed, { ns: 'dialog' })
      : '',
);
watch(snippet, () => {
  copyState.value = 'idle';
});
onMounted(async () => {
  try {
    launch.value = await ipcService.getMcpLaunchConfiguration();
    loadFailed.value = launch.value === null;
  } catch {
    loadFailed.value = true;
  }
});
async function copySnippet() {
  const text = snippet.value;
  try {
    await navigator.clipboard.writeText(text);
    if (text === snippet.value) {
      copyState.value = 'copied';
    }
  } catch {
    if (text === snippet.value) {
      copyState.value = 'failed';
    }
  }
}
</script>
