<template>
  <div class="lyric-manager-toolbar">
    <div>
      <input
        id="toolbar-lyric-manager-locked"
        type="checkbox"
        :checked="locked"
        @change="
          $emit('update:locked', ($event.target as HTMLInputElement).checked)
        "
      />
      <label for="toolbar-lyric-manager-locked">{{
        $t('toolbar:lyricManager.locked')
      }}</label>

      <span class="separator" />

      <button @click="$emit('assignAcceptsLyrics')">
        {{ $t('toolbar:lyricManager.assignAcceptsLyrics') }}
      </button>

      <span class="close" @click="$emit('close')">&#x2715;</span>
    </div>
    <textarea
      :value="lyrics"
      rows="5"
      @input="$emit('update:lyrics', ($event.target as HTMLInputElement).value)"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
defineEmits(['assignAcceptsLyrics', 'update:locked', 'update:lyrics', 'close']);
defineProps({
  lyrics: { type: String, required: true },
  locked: { type: Boolean, required: true },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.lyric-manager-toolbar {
  background-color: lightgray;

  padding: 0.25rem;
}

.separator {
  margin: 0 16px;
  border-right: 1px solid black;
  height: 16px;
}

.close {
  float: right;
  cursor: default;
}

.close:hover {
  background-color: darkgray;
}

textarea {
  width: 100%;
  margin-top: 0.25rem;
}
</style>
