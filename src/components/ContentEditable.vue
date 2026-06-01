<template>
  <!-- eslint-disable vue/no-v-html -->
  <span
    ref="span"
    class="contenteditable"
    :contenteditable="contentEditable"
    :style="style"
    @blur="onBlur"
    @focus="$emit('focus')"
    @click="$emit('click')"
    v-html="content"
  />
  <!-- eslint-enable vue/no-v-html -->
</template>

<script setup lang="ts">
import type { StyleValue } from 'vue';
import { computed, onMounted, useTemplateRef } from 'vue';

const emit = defineEmits(['click', 'focus', 'blur', 'onEditorReady']);
const props = defineProps({
  content: {
    type: String,
    required: true,
  },
  selectAllOnFocus: {
    type: Boolean,
    default: true,
  },
  editable: {
    type: Boolean,
    default: true,
  },
  plaintextOnly: {
    type: Boolean,
    default: true,
  },
  whiteSpace: {
    type: String,
    default: 'break-spaces',
  },
});

const span = useTemplateRef<HTMLElement>('span');

const contentEditable = computed(() => {
  return props.editable
    ? props.plaintextOnly
      ? 'plaintext-only'
      : 'true'
    : 'false';
});

const htmlElement = computed(() => span.value!);

const style = computed(() => {
  return {
    whiteSpace: props.whiteSpace,
  } as StyleValue;
});

onMounted(() => {
  emit('onEditorReady');
});

function getInnerText() {
  return htmlElement.value.innerText;
}

function getContent() {
  return escapeHtml(htmlElement.value.innerText);
}

function onBlur() {
  emit('blur', getContent());
}

function focus(selectAll: boolean) {
  htmlElement.value.focus();

  if (selectAll) {
    document.execCommand('selectAll', false);
  }
}

function blur() {
  htmlElement.value.blur();
}

function setInnerText(text: string) {
  htmlElement.value.innerText = text;
}

function escapeHtml(text: string) {
  const p = document.createElement('p');
  p.appendChild(document.createTextNode(text));
  return p.innerHTML;
}

defineExpose({
  blur,
  focus,
  getContent,
  getInnerText,
  htmlElement,
  setInnerText,
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.contenteditable {
  overflow-wrap: break-word;
}
</style>
