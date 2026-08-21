<template>
  <div @click="$emit('select-single')"></div>
</template>

<script setup lang="ts">
defineEmits(['select-single']);
</script>

<style scoped>
.empty-neume-box {
  border: 1px dotted black;
  box-sizing: border-box;
}
</style>
