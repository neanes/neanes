<template>
  <div class="modal-dialog">
    <div class="overlay">
      <div class="dialog-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #00000094;
  z-index: 10000;
  transition: opacity 0.2s ease;
}

.dialog-content {
  position: relative;
  z-index: 10001;

  background-color: white;

  padding: 1.5rem;
}
</style>
