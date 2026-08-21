<template>
  <div
    class="flex justify-end chrome-toolbar-surface"
    @keydown.esc="$emit('close')"
  >
    <input
      ref="input"
      :value="query"
      @keydown.enter="
        $emit('search', { query: ($event.target as HTMLInputElement).value })
      "
      @input="$emit('update:query', ($event.target as HTMLInputElement).value)"
    />
    <button
      class="chrome-button"
      @click="
        $emit('search', {
          query,
          reverse: true,
        })
      "
    >
      <PhArrowUp class="size-4" />
    </button>
    <button class="chrome-button" @click="$emit('search', { query })">
      <PhArrowDown class="size-4" />
    </button>
    <button class="chrome-button" @click="$emit('close')">
      <PhX class="size-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { PhArrowDown, PhArrowUp, PhX } from '@phosphor-icons/vue';
import { onMounted, useTemplateRef } from 'vue';

defineEmits(['close', 'search', 'update:query']);
defineProps({
  query: {
    type: String,
    required: true,
  },
});

const input = useTemplateRef<HTMLInputElement>('input');

onMounted(() => {
  focus();
});

function focus() {
  input.value!.select();
}

defineExpose({ focus });
</script>
