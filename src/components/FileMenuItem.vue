<template>
  <div class="file-menu-item" @click="$emit('click')">
    {{ label }}
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  components: {},
  emits: ['click'],
  props: {
    label: {
      type: String,
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
.file-menu-item {
  cursor: pointer;
  padding: 0.5rem 1rem;
}

.file-menu-item:hover {
  background-color: darkgray;
}
</style>
