<template>
  <div class="editor">
    <FileMenuBar />
    <div class="page-background">
      <div class="page"  
          v-for="(page, index) in pages" 
          :key="`page-${index}`" 
          :ref="`page-${index}`">
        <!-- <div class="mode-header red martyria">hWt</div> -->

        <div class="line"
          v-for="(line, index) in page.lines" 
          :key="`line-${index}`" 
          :ref="`line-${index}`">
            <template v-for="(element, index) in line.elements">
              <template v-if="isSyllableElement(element)">
                <div :key="`element-${index}`" 
                  :ref="`element-${index}`"
                  class="neume-box">
                  <span v-if="element.pageBreak" style="position:absolute; top: -10px;">P</span>
                  <span v-if="element.lineBreak" style="position:absolute; top: -10px;">L</span>
                  <SyllableNeumeBox 
                    class="syllable-box"
                    :neume="element"
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
                </div>
              </template>
              <template v-if="isMartyriaElement(element)">
                <div :key="`element-${index}`" 
                  :ref="`element-${index}`"
                  class="neume-box">
                  <span v-if="element.pageBreak" style="position:absolute; top: -10px;">P</span>
                  <span v-if="element.lineBreak" style="position:absolute; top: -10px;">L</span>
                  <MartyriaNeumeBox 
                    class="marytria-neume-box"
                    :neume="element" 
                    :class="[{ selected: element == selectedElement }]"
                    @click.native="selectedElement = element"
                    ></MartyriaNeumeBox>
                  <div class="lyrics"></div>
                </div>
              </template>
              <template v-if="isEmptyElement(element)">
                <div :key="`element-${index}`" 
                  :ref="`element-${index}`"
                  class="neume-box">
                  <span v-if="element.pageBreak" style="position:absolute; top: -10px;">P</span>
                  <span v-if="element.lineBreak" style="position:absolute; top: -10px;">L</span>
                  <div
                    class="empty-neume-box"
                    :class="[{ selected: element == selectedElement }]"
                    @click="selectedElement = element"
                    ></div>
                  <div class="lyrics"></div>
                </div>
              </template>
              <template v-if="isTextBoxElement(element)">
                  <div :key="`element-${index}`" 
                  :ref="`element-${index}`"
                  :style="getElementStyle(element)"
                  class="text-box"
                      @click="selectedElement = null">
                      <ContentEditable 
                          class="text-box-content"
                          :ref="`textbox-${index}`"
                          :content="element.content"
                          @click.native="selectedElement = null"
                          @blur="updateTextBox(element, $event)"></ContentEditable>
                    </div>
              </template>
              <template v-if="isStaffTextElement(element)">
                  <StaffText :key="`element-${index}`" 
                    :ref="`element-${index}`"
                    :element="element"
                    class="staff-text">
                  </StaffText>
              </template>
            </template>
        </div>
    </div>
    </div>
    <NeumeSelector class="neume-selector"
     @select-quantitative-neume="updateQuantitativeNeume" 
     @select-time-neume="updateTimeNeume"
     @select-vocal-expression-neume="updateVocalExpressionNeume"
     @select-fthora="updateFthora"
     @select-martyria-note="updateMartyriaNote"
     @select-martyria-root-sign="updateMartyriaRootSign"
     @select-martyria-note-and-root-sign="updateMartyriaNoteAndRootSign"
     @select-page-break="updatePageBreak"
     @select-line-break="updateLineBreak"
     @select-empty="updateEmpty"></NeumeSelector>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import { ScoreElement, MartyriaElement, NoteElement, ElementType, EmptyElement, TextBoxElement } from '@/models/Element';
import { QuantitativeNeume, TimeNeume, Note, RootSign, VocalExpressionNeume, Fthora } from '@/models/Neumes';
import { Page, Line } from '@/models/Page';
import { Score, ScoreVersion } from '@/models/Score';
import { KeyboardMap } from '@/models/NeumeMappings';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import NeumeSelector from '@/components/NeumeSelector.vue';
import NeumeKeyboard from '@/components/NeumeKeyboard.vue';
import ContentEditable from '@/components/ContentEditable.vue';
import FileMenuBar from '@/components/FileMenuBar.vue';
import StaffText from '@/components/StaffText.vue';
import { store } from '@/store';

@Component({
  components: {
    SyllableNeumeBox,
    MartyriaNeumeBox,
    NeumeSelector,
    NeumeKeyboard,
    ContentEditable,
    FileMenuBar,
    StaffText,
  }
})
export default class Editor extends Vue {
  pages: Page[] = [];
  
  get score() {
    return store.state.score;
  }

  get elements() {
    return store.getters.elements;
  }

  get selectedElement() {
    return store.state.selectedElement;
  }

  set selectedElement(element: ScoreElement | null) {
    store.mutations.setSelectedElement(element);
  }

  created() {
    this.load();
  }

  mounted() {
    window.addEventListener('keydown', this.onKeydown);

    Vue.nextTick(() => {
      setTimeout(this.addMelismas, 50);
    });
  }

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown);
  }

  updated() {
    Vue.nextTick(this.addMelismas);
  }

  // addMelismas() {
  //   document.querySelectorAll('.melisma').forEach(e => e.remove());

  //   for (let i = 0; i < this.score.elements.length; i++) {
  //     let element = this.score.elements[i];

  //     if (element.type === ElementType.Syllable) {
  //       let syllableElement = element as SyllableElement;

  //       if (syllableElement.lyrics.charAt(syllableElement.lyrics.length - 1) === '_') {
  //         let nextElement = this.score.elements[i+1];
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

  isMelisma(element: NoteElement) {
    const index = this.elements.indexOf(element);

    if(element.lyrics.charAt(element.lyrics.length - 1) === '_') {
      let nextElement = this.elements[index + 1] as NoteElement;

      return nextElement && nextElement.lyrics === '_';
    }

    return false;
  }

  addMelismas() {
    const syllableElements = this.elements.filter(x => x.elementType === ElementType.Note) as NoteElement[];

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
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Note) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }
      
      (this.selectedElement as NoteElement).quantitativeNeume = neume;

      //this.moveRight();

      this.save();
    }
  }

  updateTimeNeume(neume: TimeNeume | null) {
    if(this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Note) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as NoteElement).timeNeume = neume;
      //this.moveRight();

      this.save();
    }
  }

  updateFthora(neume: Fthora | null) {
    if(this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Note) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as NoteElement).fthora = neume;
      //this.moveRight();

      this.save();
    }
  }

  updateVocalExpressionNeume(neume: VocalExpressionNeume) {
    if(this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Note) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as NoteElement).vocalExpressionNeume = neume;

      this.moveRight();

      this.save();
    }
  }

  updateMartyriaNote(neume: Note) {
    if(this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      (this.selectedElement as MartyriaElement).note = neume;

      this.save();
    }
  }

  updateMartyriaRootSign(neume: RootSign) {
    if(this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      (this.selectedElement as MartyriaElement).rootSign = neume;

      this.save();
    }
  }

  updateMartyriaNoteAndRootSign(note: Note, rootSign: RootSign, apostrophe: boolean | undefined) {
    if(this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      (this.selectedElement as MartyriaElement).note = note;
      (this.selectedElement as MartyriaElement).rootSign = rootSign;
      (this.selectedElement as MartyriaElement).apostrophe = apostrophe || false;

      this.save();
    }
  }

  updatePageBreak() {
    if(this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index !== this.elements.length - 1) {
        this.selectedElement.pageBreak = !this.selectedElement.pageBreak;
        this.save();
      }
    }
  }

  updateLineBreak() {
    if(this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index !== this.elements.length - 1) {
        this.selectedElement.lineBreak = !this.selectedElement.lineBreak;
        this.save();
      }
    }
  }

  updateEmpty() {
    if(this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Empty) {
        this.selectedElement = this.switchToEmptyElement(this.selectedElement);
      }

      this.save();
    }
  }

  switchToMartyria(element: ScoreElement) {
      const index = this.elements.indexOf(element);

      const newElement = new MartyriaElement();
      newElement.pageBreak = element.pageBreak;
      newElement.lineBreak = element.lineBreak;

      this.elements.splice(index, 1, newElement);

      return newElement;
  }

  switchToSyllable(element: ScoreElement) {
      const index = this.elements.indexOf(element);

      const newElement = new NoteElement();
      newElement.pageBreak = element.pageBreak;
      newElement.lineBreak = element.lineBreak;

      this.elements.splice(index, 1, newElement);
      
      return newElement;
  }

  switchToEmptyElement(element: ScoreElement) {
      const index = this.elements.indexOf(element);

      const newElement = new EmptyElement();
      newElement.pageBreak = element.pageBreak;
      newElement.lineBreak = element.lineBreak;

      this.elements.splice(index, 1, newElement);

      return newElement;
  }

  addEmptyElement() {
    this.elements.push(new EmptyElement());
  }

  isSyllableElement(element: ScoreElement) {
    return element.elementType == ElementType.Note;
  }

  isMartyriaElement(element: ScoreElement) {
    return element.elementType == ElementType.Martyria;
  }

  isEmptyElement(element: ScoreElement) {
    return element.elementType == ElementType.Empty;
  }

  isTextBoxElement(element: ScoreElement) {
    return element.elementType == ElementType.TextBox;
  }
  
  isStaffTextElement(element: ScoreElement) {
    return element.elementType == ElementType.StaffText;
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
        let syllableElement = this.selectedElement as NoteElement;
        if (syllableElement.timeNeume) {
          syllableElement.timeNeume = null
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
    else if (event.code == 'Delete') {
      const index = this.elements.indexOf(this.selectedElement);

      if (this.selectedElement && index !== this.elements.length - 1) {
        this.moveLeft();

        if (index > -1) {
          this.elements.splice(index, 1);
          this.save();
        }
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
    localStorage.setItem('score', JSON.stringify(this.score));
    this.pages = this.processPages();
  }

  load() {
    const scoreString = localStorage.getItem('score');

    if (scoreString) {
      const score: Score = JSON.parse(scoreString);

      if (score.version === ScoreVersion) {
        store.mutations.setScore(score);
      }
      else {
        store.mutations.setScore(new Score());
      }
    } 
    else {
      store.mutations.setScore(new Score());
    }

    //this.score.elements = this.generateTestFile();

    this.pages = this.processPages();
  }

  updateLyrics(element: NoteElement, lyrics: string) {
    element.lyrics = lyrics;
    this.save();
  }

  updateTextBox(element: TextBoxElement, content: string) {
    element.content = content;
    this.save();
  }

  getElementStyle(element: ScoreElement) {
    if (element.elementType === ElementType.TextBox) {
      const textbox = element as TextBoxElement;

      return {
        height: textbox.height + 'px'
      };
    }
  }

  processPages() {
    const pageHeightPx = 1056 - 96 - 96;

    const lineHeightPx = 82;
    const lineWidthPx = 816 - 96 - 96;

    const neumeElementWidthPx = 39;
    const elementHeightPx = 82;
    const pages: Page[] = [];

    let page: Page = { 
      lines: [],
    };

    let line: Line = {
      elements: []
    };

    page.lines.push(line);
    pages.push(page);

    let currentPageHeightPx = 0;
    let currentLineWidthPx = 0;
    let lineCount = 1;

    let index = 0;
    let lastElementWasLineBreak = false;
    let lastElementWasPageBreak = false;

    for (let element of this.elements) {
      let elementWidthPx = neumeElementWidthPx;

      if (element.elementType === ElementType.TextBox) {
        elementWidthPx = lineWidthPx;
      }

      if (element.elementType === ElementType.StaffText) {
        line.elements.push(element);
        continue;
      }

      if (currentLineWidthPx + elementWidthPx > lineWidthPx || lastElementWasLineBreak) {
        line = { 
          elements: [],
        };

        page.lines.push(line);
        lineCount++;

        // Calculate the current page height
        currentPageHeightPx = 0;
        
        for (let line of page.lines) {
          if (line.elements.some(x => x.elementType === ElementType.TextBox)) {
            const textbox = line.elements.find(x => x.elementType === ElementType.TextBox) as TextBoxElement;
            currentPageHeightPx += textbox.height;
          }
          else {
            currentPageHeightPx += lineHeightPx;
          }
        }

        currentLineWidthPx = 0;
      }
      
      if (currentPageHeightPx > pageHeightPx || lastElementWasPageBreak) {    
        page = { 
          lines: [],
        };

        line = { 
          elements: [],
        };
        
        page.lines.push(line);
        pages.push(page);

        lineCount = 1;
        currentPageHeightPx = 0;
        currentLineWidthPx = 0;
      }

      currentLineWidthPx += elementWidthPx;
      line.elements.push(element);

      lastElementWasLineBreak = element.lineBreak;
      lastElementWasPageBreak = element.pageBreak;

      index++;
    }

    return pages;
  }

  @Watch('score', {deep: true}) 
  onScoreUpdated() {
    this.pages = this.processPages();
  }

  // generateTestFile() {
  //   const elements: Element[] = [];

  //   let counter = 1;

  //   for (let quantitativeNeume in QuantitativeNeume) {
  //     const syllableElement: SyllableElement = {
  //       neume: {
  //         quantitativeNeume: quantitativeNeume as QuantitativeNeume,
  //         timeNeume: null,
  //         vocalExpressionNeume: null,
  //         fthora: null,
  //       },
  //       lyrics: (counter++).toString(),
  //       type: ElementType.Syllable,
  //     }

  //     elements.push(syllableElement);

  //     for (let fthora in Fthora) {
  //       const syllableElement: SyllableElement = {
  //         neume: {
  //           quantitativeNeume: quantitativeNeume as QuantitativeNeume,
  //           timeNeume: null,
  //           vocalExpressionNeume: null,
  //           fthora: fthora as Fthora,
  //         },
  //         lyrics: (counter++).toString(),
  //         type: ElementType.Syllable,
  //       }

  //       elements.push(syllableElement);
  //     }

  //     // for (let neume in Fthora) {
        
  //     // }

  //   }

  //   return elements;
  // }
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

    width: 39px;
    height: 82px;

    position: relative;

    /* margin-right: 0.25rem; */
}

.empty-neume-box {
  width: 39px;
  height: 82px;
  border: 1px dotted black;
  box-sizing: border-box;
}

.page-background {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 4rem;
  background-color: #ddd;

  overflow: auto;
  flex: 1;
}

.page {
    margin-bottom: 20px;

    background-color: white;
    min-width: 624px;
    max-width: 624px;
    width: 624px;
    height: 864px;
    min-height: 864px;
    max-height: 864px;
    padding: 96px;
    overflow: hidden;

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

 .text-box {
   width: 624px;
   border: 1px dotted black;
   box-sizing: border-box;
 }

 .text-box-content {
   height: 100%;
   width: 100%;
   display: block;
 }

@media print {
  body * {
    visibility: hidden;
  }

  .page, .page * {
    visibility: visible;
  }

  .page-background {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    padding: 0;
  }

  .page {
    width: auto;
    height: auto;
    margin-bottom: 0;
    padding: 0;
    width: 816px;
    height: 864px;
  }

  .empty-neume-box {
    visibility: hidden;
  }
}
</style>
