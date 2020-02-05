<template>
  <div class="neume-selector-panel">
    <div class="row">
      <div 
        class="neume" 
        v-for="(neume, index) in ascendingNeumes" 
        :key="`ascendingNeumes-${index}`"
        @click="$emit('selectQuantitativeNeume', neume)">{{getMapping(neume).text}}</div>
    </div>
    <div class="row">
      <div 
        class="neume" 
        v-for="(neume, index) in ascendingNeumesWithPetasti" 
        :key="`ascendingNeumesWithPetasti-${index}`"
        @click="$emit('selectQuantitativeNeume', neume)">{{getMapping(neume).text}}</div>
    </div>
    <div class="row">
      <div class="neume"></div>
      <div 
        class="neume" 
        v-for="(neume, index) in descendingNeumes" 
        :key="`descendingNeumes-${index}`"
        @click="$emit('selectQuantitativeNeume', neume)">{{getMapping(neume).text}}</div>
    </div>
    <div class="row">
      <div class="neume"></div>
      <div 
        class="neume" 
        v-for="(neume, index) in descendingNeumesWithPetasti" 
        :key="`descendingNeumesWithPetasti-${index}`"
        @click="$emit('selectQuantitativeNeume', neume)">{{getMapping(neume).text}}</div>
    </div>
    <div class="row">
      <div 
        class="neume" 
        v-for="(neume, index) in combinationNeumes" 
        :key="`combinationNeumes-${index}`"
        @click="$emit('selectQuantitativeNeume', neume)">{{getMapping(neume).text}}</div>
    </div>
    <div class="row">
      <div 
        class="neume" 
        v-for="(tile, index) in timeNeumes" 
        :key="`timeNeumes-${index}`"
        @click="$emit('selectTimeNeume', tile.neume)">
        <span
          v-for="(element, index) in tile.elements"
            :key="`timeNeumes-elements-${index}`"
            :style="element.style"
            >{{getMapping(element.neume).text}}</span>
      </div>
    </div>
    <div class="row">
      <div
        class="neume" 
        v-for="(tile, index) in vocalExpressionNeumes" 
        :key="`vocalExpressionNeumes-${index}`"
        @click="$emit('selectVocalExpressionNeume', tile.neume)">
          <span
            v-for="(element, index) in tile.elements"
             :key="`vocalExpressionNeumes-elements-${index}`"
             :style="element.style"
            >{{getMapping(element.neume).text}}</span>
        </div>
    </div>
    <div class="row">
      <div 
        class="neume" 
        v-for="(neume, index) in notes" 
        :key="`notes-${index}`"
        @click="$emit('selectMartyriaNote', neume)">{{getMapping(neume).text}}</div>
    </div>
    <div class="row">
      <div 
        class="neume" 
        v-for="(neume, index) in rootSigns" 
        :key="`rootSigns-${index}`"
        @click="$emit('selectMartyriaRootSign', neume)"><span class="root-sign">{{getMapping(neume).text}}</span></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Element, SyllableElement, SyllableNeume } from '@/models/Element';
import { QuantitativeNeume, TimeNeume, VocalExpressionNeume, isHighNeume, isRedNeume, Note, RootSign, Neume } from '../models/Neumes';
import { neumeMap } from '@/models/NeumeMappings';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';

@Component({
  components: {
    SyllableNeumeBox,
  }
})
export default class NeumeSelector extends Vue {
  ison: QuantitativeNeume = QuantitativeNeume.Ison;

  ascendingNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.Ison,
    QuantitativeNeume.Oligon,
    QuantitativeNeume.OligonPlusKentimaBelow,
    QuantitativeNeume.OligonPlusKentimaAbove,
    QuantitativeNeume.OligonPlusHypsiliRight,
    QuantitativeNeume.OligonPlusHypsiliLeft,
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
    QuantitativeNeume.OligonPlusDoubleHypsili,
  ];

  ascendingNeumesWithPetasti: QuantitativeNeume[] = [
      QuantitativeNeume.PetastiWithIson,
      QuantitativeNeume.Petasti,
      QuantitativeNeume.PetastiPlusKentimaBelow,
      QuantitativeNeume.PetastiPlusKentimaAbove,
      QuantitativeNeume.PetastiPlusHypsiliRight,
      QuantitativeNeume.PetastiPlusHypsiliLeft,
      QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
      QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
      QuantitativeNeume.PetastiPlusDoubleHypsili,
  ];

  descendingNeumes: QuantitativeNeume[] = [
      QuantitativeNeume.Apostrophos,
      QuantitativeNeume.Elaphron,
      QuantitativeNeume.ElaphronPlusApostrophos,
      QuantitativeNeume.Hamili,
      QuantitativeNeume.HamiliPlusApostrophos,
      QuantitativeNeume.HamiliPlusElaphron,
      QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
      QuantitativeNeume.DoubleHamili,
  ];

  descendingNeumesWithPetasti: QuantitativeNeume[] = [
    QuantitativeNeume.PetastiPlusApostrophos,
    QuantitativeNeume.PetastiPlusElaphron,
    QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
    QuantitativeNeume.RunningElaphron,
    QuantitativeNeume.Hyporoe,
  ];

  combinationNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.OligonPlusKentemata,
    QuantitativeNeume.KentemataPlusOligon,
    QuantitativeNeume.OligonPlusIsonPlusKentemata,
    QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
    QuantitativeNeume.OligonPlusElaphronPlusKentemata,
    QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
    QuantitativeNeume.OligonPlusHamiliPlusKentemata,
    QuantitativeNeume.OligonPlusKentima,
    QuantitativeNeume.Kentemata,
  ];

  timeNeumes: NeumeTile[] = [
    {
       neume: TimeNeume.Gorgon,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: TimeNeume.Gorgon,
           style: {
             color: '#ED0000',
           }
         }         
       ]
    },
    {
       neume: TimeNeume.Klasma,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: TimeNeume.Klasma,
         }         
       ]
    },
    {
       neume: null,
       elements: []
    },
  ];

  vocalExpressionNeumes: NeumeTile[] = [
    {
       neume: VocalExpressionNeume.Vareia,
       elements: [
         {
          neume: VocalExpressionNeume.Vareia,
         },
       ]
    },
    {
       neume: VocalExpressionNeume.Homalon,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: VocalExpressionNeume.Homalon,
         }         
       ]
    },
    {
       neume: VocalExpressionNeume.HomalonConnecting,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: VocalExpressionNeume.HomalonConnecting,
         }         
       ]
    },
    {
       neume: VocalExpressionNeume.Antikenoma,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: VocalExpressionNeume.Antikenoma,
         }         
       ]
    },
    {
       neume: VocalExpressionNeume.Psifiston,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: VocalExpressionNeume.Psifiston,
         }         
       ]
    },
    {
       neume: VocalExpressionNeume.Heteron,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5,
          }
         },
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: VocalExpressionNeume.Heteron,
           style: {
             color: '#ED0000',
           }
         }         
       ]
    },
    {
       neume: VocalExpressionNeume.Cross,
       elements: [
         {
           neume: VocalExpressionNeume.Cross,
         }         
       ]
    },
    {
       neume: null,
       elements: []
    },
  ];

  notes: Note[] = [
    Note.Ni,
    Note.Pa,
    Note.Vou,
    Note.Ga,
    Note.Thi,
    Note.Ke,
    Note.Zo,
  ];

  rootSigns: RootSign[] = [
    RootSign.Delta,
    RootSign.Alpha,
    RootSign.Legetos,
    RootSign.Nana,
    RootSign.Tilt,
    RootSign.Dots,
    RootSign.Zo,
    RootSign.Squiggle,
    RootSign.SoftChromaticSquiggle,
  ];

  getMapping(neume: Neume) {
    return neumeMap.get(neume)!;
  }

  isHighNeume(neume: QuantitativeNeume) {
    return isHighNeume(neume);
  }

  isRedNeume(neume: TimeNeume) {
    return isRedNeume(neume);
  }
}

interface NeumeElement {
  neume: Neume;
  style?: object;
}

interface NeumeTile {
  neume: Neume | null;
  elements: NeumeElement[];
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.neume-selector-panel {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  flex-direction: row;
}

.neume {
    font-family: Psaltica;
    font-size: 1.6rem;

    text-align: center;

    border: 0.5px solid black;
    cursor: default;

    min-width: 2.5rem;
}

/* .root-sign {
    position: relative;
    left: 1.6rem;
    top: -1.0rem;
} */

.red {
    color: #ED0000;
}

.high {
    position: relative;
    top: -0.25rem;
}
</style>
