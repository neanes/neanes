<template>
  <span
    class="contenteditable"
    :contenteditable="contentEditable"
    :style="style"
    @blur="onBlur"
    @focus="$emit('focus')"
    @click="$emit('click')"
    v-html="content"
  />
</template>

<script lang="ts">
import { defineComponent, StyleValue } from 'vue';

export default defineComponent({
  components: {},
  emits: ['click', 'focus', 'blur', 'onEditorReady'],
  props: {
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
  },

  data() {
    return {};
  },

  mounted() {
    this.$emit('onEditorReady');
  },

  computed: {
    contentEditable() {
      return this.editable
        ? this.plaintextOnly
          ? 'plaintext-only'
          : 'true'
        : 'false';
    },

    htmlElement() {
      return this.$el as HTMLElement;
    },

    style() {
      return {
        whiteSpace: this.whiteSpace,
      } as StyleValue;
    },
  },

  methods: {
    getInnerText() {
      return this.htmlElement.innerText;
    },

    getContent() {
      return this.escapeHtml(this.htmlElement.innerText);
    },

    onBlur() {
      this.$emit('blur', this.getContent());
    },

    focus(selectAll: boolean) {
      this.htmlElement.focus();

      if (selectAll) {
        document.execCommand('selectAll', false);
      }
    },

    blur() {
      this.htmlElement.blur();
    },

    setInnerText(text: string) {
      this.htmlElement.innerText = text;
    },

    escapeHtml(text: string) {
      const p = document.createElement('p');
      p.appendChild(document.createTextNode(text));
      return p.innerHTML;
    },
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.contenteditable {
  overflow-wrap: break-word;
}
</style>
