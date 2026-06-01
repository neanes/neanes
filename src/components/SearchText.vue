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
      <img src="@/assets/icons/arrow-up.svg" />
    </button>
    <button @click="$emit('search', { query })">
      <img src="@/assets/icons/arrow-down.svg" />
    </button>
    <button @click="$emit('close')">
      <img src="@/assets/icons/x.svg" />
    </button>
  </div>
</template>

<script setup lang="ts">
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
  background-color: #ddd;
}

.search-text-container button {
  border: none;
  background-color: darkgray;
}

.search-text-container button:hover {
  background-color: lightgray;
}

.search-text-container button img {
  width: 1rem;
  height: 1rem;
}
</style>
