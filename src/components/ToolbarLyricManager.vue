<template>
  <div class="lyric-manager-toolbar">
    <div class="lyric-manager-actions">
      <div class="lock-lyrics-control">
        <Checkbox
          id="toolbar-lyric-manager-locked"
          class="bg-background"
          :model-value="locked"
          @update:model-value="$emit('update:locked', $event === true)"
        />
        <Label for="toolbar-lyric-manager-locked" class="ml-2">{{
          $t(($) => $.toolbar.lyricManager.locked, { ns: 'toolbar' })
        }}</Label>
      </div>

      <span class="separator" />

      <Button
        type="button"
        variant="secondary"
        @click="$emit('assignAcceptsLyrics')"
      >
        <PhFloppyDisk data-icon="inline-start" />
        {{
          $t(($) => $.toolbar.lyricManager.assignAcceptsLyrics, {
            ns: 'toolbar',
          })
        }}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        class="close"
        @click="$emit('close')"
      >
        <PhX />
        <span class="sr-only">Close</span>
      </Button>
    </div>
    <Textarea
      class="mt-1 bg-background field-sizing-fixed"
      :model-value="lyrics"
      rows="5"
      dir="auto"
      @update:model-value="$emit('update:lyrics', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { PhFloppyDisk, PhX } from '@phosphor-icons/vue';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

defineEmits(['assignAcceptsLyrics', 'update:locked', 'update:lyrics', 'close']);
defineProps({
  lyrics: { type: String, required: true },
  locked: { type: Boolean, required: true },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.lyric-manager-toolbar {
  background-color: var(--color-legacy-chrome-menu-surface);

  padding: 0.25rem;
}

.lyric-manager-actions {
  display: flex;
  align-items: center;
}

.lock-lyrics-control {
  display: inline-flex;
  align-items: center;
}

.separator {
  margin: 0 16px;
  border-right: 1px solid var(--color-legacy-chrome-border);
  height: 16px;
}

.close {
  cursor: default;
  margin-left: auto;
}

.close:hover {
  background-color: var(--color-legacy-chrome-tab-action);
}
</style>
