<template>
  <div class="neume-keyboard">
    <div class="row row-1">
      <div class="key">q</div>
      <div class="key">w</div>
      <div class="key">e</div>
      <div class="key">r</div>
      <div class="key">t</div>
      <div class="key">y</div>
      <div class="key">u</div>
      <div class="key">i</div>
      <div class="key">o</div>
      <div class="key">p</div>
      <div class="key">[</div>
      <div class="key">]</div>
    </div>
    <div class="row row-2">
      <div class="spacer"></div>
      <div class="key">a</div>
      <div class="key">s</div>
      <div class="key">d</div>
      <div class="key">f</div>
      <div class="key">g</div>
      <div class="key">h</div>
      <div class="key">j</div>
      <div class="key">k</div>
      <div class="key">l</div>
      <div class="key">;</div>
      <div class="key">'</div>
      <div class="key enter">Enter</div>
    </div>
    <div class="row row-3">
      <div class="spacer"></div>
      <div class="spacer"></div>
      <div class="key">z</div>
      <div class="key">x</div>
      <div class="key">c</div>
      <div class="key">v</div>
      <div class="key">b</div>
      <div class="key">n</div>
      <div class="key">m</div>
      <div class="key">,</div>
      <div class="key">.</div>
      <div class="key">/</div>
      <div class="key shift">Shift</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { KeyboardMap } from '@/models/NeumeMappings';

@Component
export default class NeumeKeyboard extends Vue {
  @Prop() content!: string;

  getNeume(key: string) {
    return KeyboardMap.quantitativeNeumeKeyboardMap.get(key);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .row {
    display: flex;
    margin-bottom: 1rem;
  }

  .key {
    display: flex;
    align-items: center;
    justify-content: center;

    margin-right: 1rem;
    width: 3rem;
    height: 3rem;
    border: 1px solid grey;
  }

  .spacer {
    width: 1rem;
  }
</style>
