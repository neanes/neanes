<template>
  <div
    class="file-menu-bar-item"
    @click.self="$emit('click')"
    @mouseenter="$emit('mouseenter')"
  >
    {{ label }}
    <div class="file-menu-item-container" v-if="isOpen">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  components: {},
  emits: ['click', 'mouseenter'],
  props: {
    label: {
      type: String,
      required: true,
    },
    isOpen: {
      type: Boolean,
      required: true,
    },
  },

  data() {
    return {};
  },

  computed: {},

  methods: {},
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.file-menu-item-container {
  position: absolute;
  left: 0;
  margin-top: 0.25rem;

  background-color: lightgray;

  width: 16rem;

  z-index: 9999;
}

.file-menu-bar-item {
  padding: 0.25rem 1rem;
  position: relative;
}

.file-menu-bar-item:hover {
  background-color: #999;
}
</style>
