<template>
  <div class="search-text-container" @keydown.esc="$emit('close')">
    <input
      ref="input"
      :query="query"
      @keydown.enter="
        $emit('search', { query: ($event.target as HTMLInputElement).value })
      "
      @change="$emit('update:query', ($event.target as HTMLInputElement).value)"
    />
    <button
      @click="
        $emit('search', {
          query,
          reverse: true,
        })
      "
    >
      <PhArrowUp />
    </button>
    <button @click="$emit('search', { query })">
      <PhArrowDown />
    </button>
    <button @click="$emit('close')">
      <PhX />
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

<style scoped>
.search-text-container {
  display: flex;
  justify-content: right;
  background-color: var(--muted);
}

.search-text-container button {
  border: none;
  background-color: var(--color-legacy-chrome-tab-action);
}

.search-text-container button:hover {
  background-color: var(--color-legacy-chrome-menu-surface);
}

.search-text-container button > svg {
  width: 1rem;
  height: 1rem;
}
</style>
