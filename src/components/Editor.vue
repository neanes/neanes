<template>
  <div class="editor">
    <FileMenuBar @scoreUpdated="onScoreUpdated"/>
    <div style="display: flex; flex:1; height: 100%">
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
    <div class="page-background" style="flex: 1">
      <div class="page"  
          v-for="(page, pageIndex) in pages" 
          :key="`page-${pageIndex}`" 
          :ref="`page-${pageIndex}`">
        <!-- <div class="mode-header red martyria">hWt</div> -->

        <div class="line"
          v-for="(line, lineIndex) in page.lines" 
          :key="`line-${lineIndex}`" 
          :ref="`line-${lineIndex}`">
            <div 
              v-for="(element, index) in line.elements" 
              :key="`element-${index}`" 
              :ref="`element-${index}`"
              class="element-box"
              :style="{left: element.x + 'px', top: element.y + 'px'}">
              <template v-if="isSyllableElement(element)">
                <div :key="`element-${getElementIndex(element) }`" 
                  :ref="`element-${getElementIndex(element)}`"
                  class="neume-box">
                  <span v-if="element.pageBreak" style="position:absolute; top: -10px;">P</span>
                  <span v-if="element.lineBreak" style="position:absolute; top: -10px;">L</span>
                  <SyllableNeumeBox 
                    class="syllable-box"
                    :note="element"
                    :ref="`syllable-box-${getElementIndex(element)}`"
                    :class="[{ selected: element == selectedElement }]"
                    @click.native="selectedElement = element"
                    ></SyllableNeumeBox>
                    <div class=lyrics-container
                      @click="selectedElement = null">
                      <ContentEditable 
                          class="lyrics"
                          :ref="`lyrics-${getElementIndex(element)}`"
                          :content="element.lyrics"
                          @click.native="selectedElement = null"
                          @blur="updateLyrics(element, $event)"></ContentEditable>
                      <div class="melisma" v-if="isMelisma(element)" :ref="`melisma-${getElementIndex(element)}`"></div>
                    </div>
                </div>
              </template>
              <template v-if="isMartyriaElement(element)">
                <div :key="`element-${getElementIndex(element)}`" 
                  :ref="`element-${getElementIndex(element)}`"
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
                <div :key="`element-${getElementIndex(element)}`" 
                  :ref="`element-${getElementIndex(element)}`"
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
                  <TextBox 
                    :key="`element-${getElementIndex(element)}`" 
                    :ref="`textbox-${getElementIndex(element)}`"
                    :element="element"
                    @click.native="selectedElement = element"
                    @scoreUpdated="onScoreUpdated">
                  </TextBox>
              </template>
              <template v-if="isStaffTextElement(element)">
                  <StaffText :key="`element-${getElementIndex(element)}`" 
                    :ref="`element-${getElementIndex(element)}`"
                    :element="element">
                  </StaffText>
              </template>
              <template v-if="isDropCapElement(element)">
                  <DropCap :key="`element-${getElementIndex(element)}`" 
                    :ref="`element-${getElementIndex(element)}`"
                    :element="element"
                    @click.native="selectedElement = element"
                    @scoreUpdated="onScoreUpdated">
                  </DropCap>
              </template>
           </div>
        </div>
    </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import { ScoreElement, MartyriaElement, NoteElement, ElementType, EmptyElement, TextBoxElement, VocalExpressionNeumeElement, QuantitativeNeumeElement, TimeNeumeElement, FthoraElement } from '@/models/Element';
import { QuantitativeNeume, TimeNeume, Note, RootSign, VocalExpressionNeume, Fthora } from '@/models/Neumes';
import { Page, Line } from '@/models/Page';
import { Score } from '@/models/Score';
import { KeyboardMap, neumeMap } from '@/models/NeumeMappings';
import { SaveService } from '@/services/SaveService';
import { LayoutService } from '@/services/LayoutService';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import NeumeSelector from '@/components/NeumeSelector.vue';
import NeumeKeyboard from '@/components/NeumeKeyboard.vue';
import ContentEditable from '@/components/ContentEditable.vue';
import FileMenuBar from '@/components/FileMenuBar.vue';
import StaffText from '@/components/StaffText.vue';
import TextBox from '@/components/TextBox.vue';
import { store } from '@/store';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import DropCap from './DropCap.vue';

@Component({
  components: {
    SyllableNeumeBox,
    MartyriaNeumeBox,
    NeumeSelector,
    NeumeKeyboard,
    ContentEditable,
    FileMenuBar,
    StaffText,
    TextBox,
    DropCap,
  }
})
export default class Editor extends Vue {
  pages: Page[] = [];
  
  get score() {
    return store.state.score;
  }

  get pageSetup() {
    return store.state.pageSetup;
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

  async created() {
    const fontLoader = (document as any).fonts;

    await Promise.all([
      fontLoader.load('1rem Athonite'), 
      fontLoader.load('1rem Omega'), 
      fontLoader.load('1rem Psaltica'),
      fontLoader.load('1rem EzSpecial1'),
      fontLoader.load('1rem EzSpecial2'),
      fontLoader.load('1rem EzFthora'),
      fontLoader.ready
    ]);

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
    Vue.nextTick(() => {
      if (store.state.elementToFocus != null) {
        const index = this.elements.indexOf(store.state.elementToFocus);
        (this.$refs[`element-${index}`] as any)[0].focus();
        store.mutations.setElementToFocus(null);
      }
    });
  }

  getElementIndex(element: ScoreElement) {
    return this.elements.indexOf(element);
  }

  isMelisma(element: NoteElement) {
    return this.isIntermediateMelisma(element) || this.isFinalMelisma(element);
  }

  isIntermediateMelisma(element: NoteElement) {
    const index = this.elements.indexOf(element);

    if(element.isMelisma) {
      let nextElement = this.elements[index + 1] as NoteElement;

      return nextElement && nextElement.isMelisma && !nextElement.isMelismaStart;
    }

    return false;
  }

  // Checks whether the element is the final melisma in a sequence
  isFinalMelisma(element: NoteElement) {
    const index = this.elements.indexOf(element);

    if(element.isMelisma) {
      let nextElement = this.elements[index + 1] as NoteElement;

      return nextElement && (!nextElement.isMelisma || nextElement.isMelismaStart);
    }

    return false;
  }

  private widthOfUnderscore: number | null = null;

  addMelismas() {
    const syllableElements = this.elements.filter(x => x.elementType === ElementType.Note) as NoteElement[];

    for (let element of syllableElements) {
      if (this.isIntermediateMelisma(element)) {
        const index = this.elements.indexOf(element);

        let melisma = (this.$refs[`melisma-${index}`] as HTMLElement[])[0];
        let lyrics1 = (this.$refs[`lyrics-${index}`] as Vue[])[0].$el as HTMLElement;
        let lyrics2 = (this.$refs[`lyrics-${index+1}`] as Vue[])[0].$el as HTMLElement;

        let widthOfUnderscore = this.widthOfUnderscore || TextMeasurementService.getTextWidth('_', '1rem Omega');

        let lyrics1Rect = lyrics1.getBoundingClientRect();
        let lyrics2Rect = lyrics2.getBoundingClientRect();

        // Stretch from the end of the lyrics in the current element 
        // to the end of the lyrics in the next element
        let width = lyrics2Rect.left - lyrics1Rect.right;
        
        let numberOfUnderScoresNeeded = width > 0 ? Math.ceil(width / widthOfUnderscore) : 1;

        melisma.innerText = '';

        for (let i = 0; i < numberOfUnderScoresNeeded; i++) {
          melisma.innerText += '_';
        }
      }
      else if (this.isFinalMelisma(element)) {
        const index = this.elements.indexOf(element);

        let melisma = (this.$refs[`melisma-${index}`] as HTMLElement[])[0];
        let box = (this.$refs[`element-${index}`] as HTMLElement[])[0];
        let lyrics = (this.$refs[`lyrics-${index}`] as Vue[])[0].$el as HTMLElement;

        let widthOfUnderscore = this.widthOfUnderscore || TextMeasurementService.getTextWidth('_', '1rem Omega');

        let boxRect = box.getBoundingClientRect();
        let lyricsRect = lyrics.getBoundingClientRect();

        // Stretch from the end of the lyrics to the end of the neume
        let width = boxRect.right - lyricsRect.right;

        let numberOfUnderScoresNeeded = Math.floor(width / widthOfUnderscore);

        melisma.innerText = '';

        for (let i = 0; i < numberOfUnderScoresNeeded; i++) {
          melisma.innerText += '_';
        }
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
      
      (this.selectedElement as NoteElement).quantitativeNeume = new QuantitativeNeumeElement(neume);

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

      (this.selectedElement as NoteElement).setTimeNeume(neume);
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

      (this.selectedElement as NoteElement).fthora = neume != null ? new FthoraElement(neume) : null;
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

      (this.selectedElement as NoteElement).setVocalExpressionNeume(neume);

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

  isDropCapElement(element: ScoreElement) {
    return element.elementType == ElementType.DropCap;
  }

  onKeydown(event: KeyboardEvent) {
    if (this.selectedElement == null 
      || this.selectedElement.elementType === ElementType.StaffText
      || this.selectedElement.elementType === ElementType.TextBox
      || this.selectedElement.elementType === ElementType.DropCap) {
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
          this.save();
        }
      }
      else {
        this.selectedElement = this.switchToEmptyElement(this.selectedElement);
        this.moveLeft();
        this.save();
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
    localStorage.setItem('score', JSON.stringify(SaveService.SaveScoreToJson(this.score)));
    this.pages = LayoutService.processPages(this.elements, this.pageSetup);
  }

  load() {
    const scoreString = localStorage.getItem('score');

    if (scoreString) {
      const score: Score = SaveService.LoadScoreFromJson(JSON.parse(scoreString));

      store.mutations.setScore(score);
    } 
    else {
      store.mutations.setScore(new Score());
    }

    //this.score.elements = this.generateTestFile();

    this.pages = LayoutService.processPages(this.elements, this.pageSetup);
  }

  updateLyrics(element: NoteElement, lyrics: string) {
    // Nothing changed. No further processing is necessary.
    if (element.lyrics === lyrics) {
      return;
    }

    if (lyrics === '_') {
      element.isMelisma = true;
      element.isMelismaStart = false;
      element.lyrics = '';
    }
    else if (lyrics.endsWith('_')) {
      element.isMelisma = true;
      element.isMelismaStart = true;
      element.lyrics = lyrics.slice(0, -1);
    }
    else {
      element.isMelisma = false;
      element.isMelismaStart = false;
      element.lyrics = lyrics;
    }

    this.save();
  }

  updateTextBox(element: TextBoxElement, content: string) {
    element.content = content;
    this.save();
  }

  onScoreUpdated() {
    this.save();
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

.element-box {
    position: absolute;
}

.neume-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    /* width: 39px;  */
    /* height: 82px; */

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
  text-align: center;
}

.melisma {
  font-family: Omega;
  position: absolute;
  display: inline;
}

.neume {
  display: flex;
  height: 2.5rem;
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
    height: 1056px;
    min-width: 816px;
    max-width: 816px;
    min-height: 1056px;
    max-height: 1056px;
  }

  .empty-neume-box {
    visibility: hidden;
  }

  .text-box-container {
    border: none;
  }
}
</style>
