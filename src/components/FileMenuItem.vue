<template>
  <div class="file-menu-item" @click="$emit('click')">
    {{ label }}
  </div>
</template>

<script setup lang="ts">
defineEmits(['click']);
defineProps({
  label: {
    type: String,
    required: true,
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.file-menu-item {
  cursor: pointer;
  padding: 0.5rem 1rem;
}

.file-menu-item:hover {
  background-color: darkgray;
}
</style>
