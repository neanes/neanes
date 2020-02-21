<template>
  <div class="editor">
    <div class="page-background">
      <div class="page" ref="page">
        <div class="mode-header red martyria">hWt</div>

        <div class="line">
            <div 
              v-for="(element, index) in elements" 
              :key="`element-${index}`" 
              :ref="`element-${index}`"
              class="neume-box">
              <template v-if="isSyllableElement(element)">
                <SyllableNeumeBox 
                  class="syllable-box"
                  :neume="element.neume"
                  :ref="`syllable-box-${index}`"
                  :class="[{ selected: element == selectedElement }]"
                  @click.native="selectedElement = element"
                  ></SyllableNeumeBox>
                  <div class=lyrics-container
                    @click="selectedElement = null">
                    <ContentEditable 
                        class="lyrics"
                        :ref="`lyrics-${index}`"
                        :content="element.lyrics"
                        @click.native="selectedElement = null"
                        @blur="updateLyrics(element, $event)"></ContentEditable>
                    <div class="melisma" v-if="isMelisma(element)" :ref="`melisma-${index}`"></div>
                  </div>
              </template>
              <template v-if="isMartyriaElement(element)">
                <MartyriaNeumeBox 
                  class="marytria-neume-box"
                  :neume="element.neume" 
                  :class="[{ selected: element == selectedElement }]"
                  @click.native="selectedElement = element"
                  ></MartyriaNeumeBox>
                <div class="lyrics"></div>
              </template>
              <template v-if="isEmptyElement(element)">
                <div
                  class="empty-neume-box"
                  :class="[{ selected: element == selectedElement }]"
                  @click="selectedElement = element"
                  ></div>
                <div class="lyrics"></div>
              </template>
            </div>
        </div>
    </div>
    </div>
    <NeumeSelector class="neume-selector"
     @selectQuantitativeNeume="updateQuantitativeNeume" 
     @selectTimeNeume="updateTimeNeume"
     @selectVocalExpressionNeume="updateVocalExpressionNeume"
     @selectFthora="updateFthora"
     @selectMartyriaNote="updateMartyriaNote"
     @selectMartyriaRootSign="updateMartyriaRootSign"
     @selectMartyriaNoteAndRootSign="updateMartyriaNoteAndRootSign"></NeumeSelector>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Element, MartyriaElement, SyllableElement, ElementType, EmptyElement, SyllableNeume } from '@/models/Element';
import { QuantitativeNeume, TimeNeume, Note, RootSign, VocalExpressionNeume, Fthora } from '@/models/Neumes';
import { KeyboardMap } from '@/models/NeumeMappings';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import NeumeSelector from '@/components/NeumeSelector.vue';
import NeumeKeyboard from '@/components/NeumeKeyboard.vue';
import ContentEditable from '@/components/ContentEditable.vue';

@Component({
  components: {
    SyllableNeumeBox,
    MartyriaNeumeBox,
    NeumeSelector,
    NeumeKeyboard,
    ContentEditable,
  }
})
export default class Editor extends Vue {
  selectedElement: Element | null = null;

  elements: Element[] = [
    {
      type: ElementType.Syllable,
      neume: {
        quantitativeNeume: QuantitativeNeume.Ison,
        timeNeume: null,
        vocalExpressionNeume: null,
      },
      lyrics: 'The',
    } as SyllableElement,
    {
      type: ElementType.Syllable,
      neume: {
        quantitativeNeume: QuantitativeNeume.Elaphron,
        timeNeume: null,
        vocalExpressionNeume: null,
      },
      lyrics: 'sha',
    } as SyllableElement,
    {
      type: ElementType.Syllable,
      neume: {
        quantitativeNeume: QuantitativeNeume.KentemataPlusOligon,
        timeNeume: null,
        vocalExpressionNeume: null,
      },
      lyrics: '-',
    } as SyllableElement,
    {
      type: ElementType.Syllable,
      neume: {
        quantitativeNeume: QuantitativeNeume.OligonPlusKentemata,
        timeNeume: TimeNeume.Gorgon_Top,
        vocalExpressionNeume: null,
      },
      lyrics: '-',
    } as SyllableElement,
    {
      type: ElementType.Syllable,
      neume: {
        quantitativeNeume: QuantitativeNeume.Elaphron,
        timeNeume: TimeNeume.Klasma_Top,
        vocalExpressionNeume: null,
      },
      lyrics: 'dow',
    } as SyllableElement,
    {
      type: ElementType.Martyria,
      neume: {
        note: Note.Thi,
        rootSign: RootSign.SoftChromaticSquiggle,
      },
    } as MartyriaElement,
    {
      type: ElementType.Empty,
    } as EmptyElement,
  ];

  created() {
    this.load();
  }

  mounted() {
    window.addEventListener('keydown', this.onKeydown);

    Vue.nextTick(() => {
      setTimeout(this.addMelismas, 50);
    });
  }

  destroyed() {
    window.removeEventListener('keydown', this.onKeydown);
  }

  updated() {
    Vue.nextTick(this.addMelismas);
  }

  // addMelismas() {
  //   document.querySelectorAll('.melisma').forEach(e => e.remove());

  //   for (let i = 0; i < this.elements.length; i++) {
  //     let element = this.elements[i];

  //     if (element.type === ElementType.Syllable) {
  //       let syllableElement = element as SyllableElement;

  //       if (syllableElement.lyrics.charAt(syllableElement.lyrics.length - 1) === '_') {
  //         let nextElement = this.elements[i+1];
  //         if (nextElement.type === ElementType.Syllable) {
  //           let nextSyllableElement = nextElement as SyllableElement;

  //           if (nextSyllableElement.lyrics === '_') {
  //             let box1 = (this.$refs[`element-${i}`]as HTMLElement[])[0];
  //             let box2 = (this.$refs[`element-${i+1}`]as HTMLElement[])[0];

  //             let melisma = document.createElement('div');
  //             melisma.className = 'melisma';
  //             melisma.style.width = (box2.offsetLeft + - box1.offsetLeft + 1) + 'px'; 
  //             melisma.style.position = 'absolute';
  //             melisma.style.left = (box1.offsetLeft + box1.offsetWidth - 1) + 'px';
  //             melisma.style.top = (box1.offsetTop + box1.offsetHeight - 8) + 'px';
  //             melisma.style.borderBottom = '1px solid black';
  //             (this.$refs.page as HTMLElement).appendChild(melisma);
  //           }            
  //         }
  //       }
  //     }
  //   }
  // }

  isMelisma(element: SyllableElement) {
    const index = this.elements.indexOf(element);

    if(element.lyrics.charAt(element.lyrics.length - 1) === '_') {
      let nextElement = this.elements[index + 1] as SyllableElement;

      return nextElement && nextElement.lyrics === '_';
    }

    return false;
  }

  addMelismas() {
    const syllableElements = this.elements.filter(x => x.type === ElementType.Syllable) as SyllableElement[];

    for (let element of syllableElements) {
      if (this.isMelisma(element)) {
        const index = this.elements.indexOf(element);
      
        let box1 = (this.$refs[`element-${index}`] as HTMLElement[])[0];
        let box2 = (this.$refs[`element-${index+1}`] as HTMLElement[])[0];
        let melisma = (this.$refs[`melisma-${index}`] as HTMLElement[])[0];
        let lyrics = (this.$refs[`lyrics-${index}`] as Vue[])[0].$el as HTMLElement;

        melisma.style.top = (box1.offsetTop + box1.offsetHeight - 8) + 'px';
        melisma.style.width = (box2.offsetLeft + box2.offsetWidth - lyrics.offsetLeft - lyrics.offsetWidth + 1) + 'px';
        melisma.style.left = (lyrics.offsetLeft + lyrics.offsetWidth - 1) + 'px';
      }
    }
  }

  updateQuantitativeNeume(neume: QuantitativeNeume) {
    if(this.selectedElement) {
      if (this.selectedElement.type == ElementType.Empty) {
        this.addEmptyElement();
      }

      if (this.selectedElement.type != ElementType.Syllable) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }
      
      (this.selectedElement as SyllableElement).neume.quantitativeNeume = neume;

      //this.moveRight();

      this.save();
    }
  }

  updateTimeNeume(neume: TimeNeume | null) {
    if(this.selectedElement) {
      if (this.selectedElement.type == ElementType.Empty) {
        this.addEmptyElement();
      }

      if (this.selectedElement.type != ElementType.Syllable) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as SyllableElement).neume.timeNeume = neume;
      //this.moveRight();

      this.save();
    }
  }

  updateFthora(neume: Fthora | null) {
    if(this.selectedElement) {
      if (this.selectedElement.type == ElementType.Empty) {
        this.addEmptyElement();
      }

      if (this.selectedElement.type != ElementType.Syllable) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as SyllableElement).neume.fthora = neume;
      //this.moveRight();

      this.save();
    }
  }

  updateVocalExpressionNeume(neume: VocalExpressionNeume) {
    if(this.selectedElement) {
      if (this.selectedElement.type == ElementType.Empty) {
        this.addEmptyElement();
      }

      if (this.selectedElement.type != ElementType.Syllable) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as SyllableElement).neume.vocalExpressionNeume = neume;

      this.moveRight();

      this.save();
    }
  }

  updateMartyriaNote(neume: Note) {
    if(this.selectedElement) {
      if (this.selectedElement.type == ElementType.Empty) {
        this.addEmptyElement();
      }

      if (this.selectedElement.type != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      (this.selectedElement as MartyriaElement).neume.note = neume;

      this.save();
    }
  }

  updateMartyriaRootSign(neume: RootSign) {
    if(this.selectedElement) {
      if (this.selectedElement.type == ElementType.Empty) {
        this.addEmptyElement();
      }

      if (this.selectedElement.type != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      (this.selectedElement as MartyriaElement).neume.rootSign = neume;

      this.save();
    }
  }

  updateMartyriaNoteAndRootSign(note: Note, rootSign: RootSign, apostrophe: boolean | undefined) {
    if(this.selectedElement) {
      if (this.selectedElement.type == ElementType.Empty) {
        this.addEmptyElement();
      }

      if (this.selectedElement.type != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      (this.selectedElement as MartyriaElement).neume.note = note;
      (this.selectedElement as MartyriaElement).neume.rootSign = rootSign;
      (this.selectedElement as MartyriaElement).neume.apostrophe = apostrophe || false;

      this.save();
    }
  }

  switchToMartyria(element: Element) {
      const index = this.elements.indexOf(element);

      this.elements[index] = {
        type: ElementType.Martyria,
        neume: {
          note: Note.Pa,
          rootSign: RootSign.Alpha
        },
      } as MartyriaElement;

      return this.elements[index];
  }

  switchToSyllable(element: Element) {
      const index = this.elements.indexOf(element);

      this.elements[index] = {
        type: ElementType.Syllable,
        neume: {
          quantitativeNeume: QuantitativeNeume.Ison,
          timeNeume: null,
          vocalExpressionNeume: null,
          fthora: null,
        },
        lyrics: ''
      } as SyllableElement;

      return this.elements[index];
  }

  switchToEmptyElement(element: Element) {
      const index = this.elements.indexOf(element);

      this.elements[index] = {
        type: ElementType.Empty,
      } as EmptyElement;

      return this.elements[index];
  }

  addEmptyElement() {
    this.elements.push({
      type: ElementType.Empty,
    } as EmptyElement);
  }

  isSyllableElement(element: Element) {
    return element.type == ElementType.Syllable;
  }

  isMartyriaElement(element: Element) {
    return element.type == ElementType.Martyria;
  }

  isEmptyElement(element: Element) {
    return element.type == ElementType.Empty;
  }

  onKeydown(event: KeyboardEvent) {
    if (this.selectedElement == null) {
      return;
    }

    event.preventDefault();

    if (event.code == 'ArrowLeft') {
      this.moveLeft();
      return;
    }
    else if (event.code == 'ArrowRight' || event.code == 'Space') {
      this.moveRight();
      return;
    }
    else if (event.code == 'Backspace') {
      if (this.isSyllableElement(this.selectedElement)) {
        let syllableElement = this.selectedElement as SyllableElement;
        if (syllableElement.neume.timeNeume) {
          syllableElement.neume.timeNeume = null
        }
        else {
          this.selectedElement = this.switchToEmptyElement(this.selectedElement);
          this.moveLeft();
        }
      }
      else {
        this.selectedElement = this.switchToEmptyElement(this.selectedElement);
        this.moveLeft();
      }
    }

    if (event.shiftKey) {
      const quantitativeNeume = KeyboardMap.quantitativeNeumeKeyboardMap_Shift.get(event.code);

      if (quantitativeNeume) {
        this.updateQuantitativeNeume(quantitativeNeume);
        return;
      }
    }
    else {
      const quantitativeNeume = KeyboardMap.quantitativeNeumeKeyboardMap.get(event.code);

      if (quantitativeNeume) {
        this.updateQuantitativeNeume(quantitativeNeume);
        return;
      }

      const timeNeume = KeyboardMap.timeNeumeKeyboardMap.get(event.code);

      if (timeNeume) {
        this.updateTimeNeume(timeNeume);
        return;
      }
    }
  }

  moveLeft() {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index - 1 >= 0) {
        this.selectedElement = this.elements[index - 1];
      }
    }
  }

  moveRight() {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index >= 0 && index + 1 < this.elements.length) {
        this.selectedElement = this.elements[index + 1];
      }
    }
  }

  save() {
    localStorage.setItem('score', JSON.stringify(this.elements));
  }

  load() {
    const score = localStorage.getItem('score');

    if (score) {
      this.elements = JSON.parse(score);
    }

    // this.elements = this.generateTestFile();
  }

  updateLyrics(element: SyllableElement, lyrics: string) {
    element.lyrics = lyrics;
    this.save();
  }

  generateTestFile() {
    const elements: Element[] = [];

    let counter = 1;

    for (let quantitativeNeume in QuantitativeNeume) {
      const syllableElement: SyllableElement = {
        neume: {
          quantitativeNeume: quantitativeNeume as QuantitativeNeume,
          timeNeume: null,
          vocalExpressionNeume: null,
          fthora: null,
        },
        lyrics: (counter++).toString(),
        type: ElementType.Syllable,
      }

      elements.push(syllableElement);

      for (let fthora in Fthora) {
        const syllableElement: SyllableElement = {
          neume: {
            quantitativeNeume: quantitativeNeume as QuantitativeNeume,
            timeNeume: null,
            vocalExpressionNeume: null,
            fthora: fthora as Fthora,
          },
          lyrics: (counter++).toString(),
          type: ElementType.Syllable,
        }

        elements.push(syllableElement);
      }

      // for (let neume in Fthora) {
        
      // }

    }

    return elements;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.lyrics {
    font-family: Omega;
    min-height: 1.6rem;
    min-width: 1rem;
    text-align: center;
    position: relative;
}

.red {
    color: #ED0000;
}

.selected {
  background-color: palegoldenrod;
}

.line {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
}

.neume-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    margin-right: 0.25rem;
}

.empty-neume-box {
  width: 2.5rem;
  height: 2.5rem;
  border: 1px dotted black;
}

.page-background {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 4rem;
  background-color: #ddd;

  overflow: hidden;
  flex: 1;
}

.page {
    background-color: white;
    min-width: 816px;
    max-width: 816px;
    width: 816px;
    /* height: 1056px; */
    padding: 96px;
    overflow: auto;

    position: relative;
}

.editor {
  display: flex;
  flex-direction: column;

  flex: 1;

  height: 100%;
}

.neume-selector {
  overflow: auto;
  height: 50vh;
}

.martyria {
    font-family: EzSpecial2;
}

.mode-header {
    font-size: 1.75rem;
    text-align: center;
}

.lyrics-container {
  min-height: 1.6rem;
  min-width: 1rem;
}

.melisma {
  position: absolute;
  top: 18px;
  border-bottom: 1px solid black;
}

.neume {
  height: 3.5rem;  
 }

@media print {
  body * {
    visibility: hidden;
  }

  .page, .page * {
    visibility: visible;
  }

  .page {
    position: absolute;
    left: 0;
    top: 0;
    /* width: 100vw;
    height: 100vh; */
  }

  .empty-neume-box {
    visibility: hidden;
  }
}
</style>
