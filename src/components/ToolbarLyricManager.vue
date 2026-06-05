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
        {{
          $t(($) => $.toolbar.lyricManager.assignAcceptsLyrics, {
            ns: 'toolbar',
          })
        }}
      </Button>

      <span class="close" @click="$emit('close')">&#x2715;</span>
    </div>
    <Textarea
      class="mt-1 bg-background"
      :model-value="lyrics"
      rows="5"
      dir="auto"
      @update:model-value="$emit('update:lyrics', $event)"
    />
  </div>
</template>

<script setup lang="ts">
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
  line-height: 1;
  margin-left: auto;
  padding: 0.25rem;
}

.close:hover {
  background-color: var(--color-legacy-chrome-tab-action);
}
</style>
