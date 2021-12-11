<template>
  <div class="neume-selector-panel">
    <ul class="nav">
      <li @click="selectedTab='Basic'">Basic</li>
      <li @click="selectedTab='Fthora'">Phthorai</li>
      <li @click="selectedTab='Martytria'">Martyria</li>
      <li @click="selectedTab='Layout'">Layout</li>
    </ul>
    <div class="tab" v-if="selectedTab == 'Basic'">
      <div class="row">
        <Neume 
          class="neume" 
          v-for="(neume, index) in ascendingNeumes" 
          :key="`ascendingNeumes-${index}`"
          :neume="neume"
          @click.native="$emit('select-quantitative-neume', neume)"></Neume>
      </div>
      <div class="row">
        <Neume 
          class="neume" 
          v-for="(neume, index) in ascendingNeumesWithPetasti" 
          :key="`ascendingNeumesWithPetasti-${index}`"
          :neume="neume"
          @click.native="$emit('select-quantitative-neume', neume)"></Neume>
      </div>
      <div class="row">
        <div class="neume"></div>
        <Neume 
          class="neume" 
          v-for="(neume, index) in descendingNeumes" 
          :key="`descendingNeumes-${index}`"
          :neume="neume"
          @click.native="$emit('select-quantitative-neume', neume)"></Neume>
      </div>
      <div class="row">
        <div class="neume"></div>
        <Neume 
          class="neume" 
          v-for="(neume, index) in descendingNeumesWithPetasti" 
          :key="`descendingNeumesWithPetasti-${index}`"
          :neume="neume"
          @click.native="$emit('select-quantitative-neume', neume)"></Neume>
      </div>
      <div class="row">
        <Neume 
          class="neume" 
          v-for="(neume, index) in combinationNeumes" 
          :key="`combinationNeumes-${index}`"
          :neume="neume"
          @click.native="$emit('select-quantitative-neume', neume)"></Neume>
      </div>
      <div class="row">
        <div 
          class="neume" 
          v-for="(tile, index) in timeNeumes" 
          :key="`timeNeumes-${index}`"
          @click="$emit('select-time-neume', tile.neume)">
          <Neume
            v-for="(element, index) in tile.elements"
              :key="`timeNeumes-elements-${index}`"
              :neume="element.neume"
              :style="element.style"
              ></Neume>
        </div>
        <div 
          class="neume" 
          v-for="(tile, index) in gorgonNeumes" 
          :key="`gorgonNeumes-${index}`"
          @click="$emit('select-gorgon-neume', tile.neume)">
          <Neume
            v-for="(element, index) in tile.elements"
              :key="`gorgonNeumes-elements-${index}`"
              :neume="element.neume"
              :style="element.style"
              ></Neume>
        </div>
      </div>
      <div class="row">
        <div
          class="neume" 
          v-for="(tile, index) in vocalExpressionNeumes" 
          :key="`vocalExpressionNeumes-${index}`"
          @click="$emit('select-vocal-expression-neume', tile.neume)">
            <Neume
              v-for="(element, index) in tile.elements"
              :key="`vocalExpressionNeumes-elements-${index}`"
              :style="element.style"
              :neume="element.neume"
              ></Neume>
          </div>
      </div>
      <div class="row">
        <Neume 
          class="neume" 
          v-for="(neume, index) in breathNeumes" 
          :key="`breathNeumes-${index}`"
          :neume="neume"
          @click.native="$emit('select-quantitative-neume', neume)"></Neume>
      </div>
    </div>
    <div class="tab" v-if="selectedTab == 'Martytria'">
      <div class="row">
        <div 
          class="neume" 
          v-for="(neume, index) in commonMartyriaDiatonic" 
          :key="`commonMartyriaDiatonic-${index}`"
          @click="$emit('select-martyria-note-and-root-sign', neume.note, neume.rootSign, neume.apostrophe)">
            <Neume :neume="neume.note"></Neume>
            <Neume :neume="neume.rootSign"></Neume>
            <Neume v-if="neume.apostrophe" neume="Apostrophe"></Neume>
            </div>
      </div>
      <div class="row">
        <div class="neume"></div>
        <div 
          class="neume" 
          v-for="(neume, index) in commonMartyriaHardChromatic" 
          :key="`commonMartyriaHardChromatic-${index}`"
          @click="$emit('select-martyria-note-and-root-sign', neume.note, neume.rootSign, neume.apostrophe)">
            <Neume :neume="neume.note"></Neume>
            <Neume :neume="neume.rootSign"></Neume>
            <Neume v-if="neume.apostrophe" neume="Apostrophe"></Neume>
        </div>
      </div>
      <div class="row">
        <div 
          class="neume" 
          v-for="(neume, index) in commonMartyriaSoftChromatic" 
          :key="`commonMartyriaSoftChromatic-${index}`"
          @click="$emit('select-martyria-note-and-root-sign', neume.note, neume.rootSign, neume.apostrophe)">
            <Neume :neume="neume.note"></Neume>
            <Neume :neume="neume.rootSign"></Neume>
            <Neume v-if="neume.apostrophe" neume="Apostrophe"></Neume>
            </div>
      </div>
      <div class="row">
        <Neume 
          class="neume" 
          v-for="(neume, index) in notes" 
          :key="`notes-${index}`"
          :neume="neume"
          @click.native="$emit('select-martyria-note', neume)"></Neume>
      </div>
      <div class="row">
        <div 
          class="neume" 
          v-for="(neume, index) in rootSigns" 
          :key="`rootSigns-${index}`"
          @click="$emit('select-martyria-root-sign', neume)"><Neume class="root-sign" :neume="neume"></Neume></div>
      </div>
    </div>
    <div class="tab" v-if="selectedTab == 'Fthora'">
      <div class="row">
        <div 
          class="neume" 
          v-for="(tile, index) in fthorasRowOne" 
          :key="`fthorasRowOne-${index}`"
          @click="$emit('select-fthora', tile.neume)">
          <Neume
            v-for="(element, index) in tile.elements"
              :key="`fthoras-elements-${index}`"
              :style="element.style"
              :neume="element.neume"
              ></Neume>
        </div>
      </div>
      <div class="row">
        <div 
          class="neume" 
          v-for="(tile, index) in fthorasRowTwo" 
          :key="`fthorasRowTwo-${index}`"
          @click="$emit('select-fthora', tile.neume)">
          <Neume
            v-for="(element, index) in tile.elements"
              :key="`fthoras-elements-${index}`"
              :style="element.style"
              :neume="element.neume"
              ></Neume>
        </div>
      </div>
      <div class="row">
        <div 
          class="neume" 
          v-for="(tile, index) in fthorasRowThree" 
          :key="`fthorasRowThree-${index}`"
          @click="$emit('select-fthora', tile.neume)">
          <Neume
            v-for="(element, index) in tile.elements"
              :key="`fthoras-elements-${index}`"
              :style="element.style"
              :neume="element.neume"
              ></Neume>
        </div>
      </div>
    </div>
    <div class="tab" v-if="selectedTab == 'Layout'">
      <div class="row">
        <div @click="$emit('select-page-break')">Page Break</div>
        <div @click="$emit('select-line-break')">Line Break</div>
        <div @click="$emit('select-empty')">Empty</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ScoreElement, NoteElement } from '@/models/Element';
import { QuantitativeNeume, TimeNeume, VocalExpressionNeume, isHighNeume, isRedNeume, Note, RootSign, Fthora, Neume as NeumeType, GorgonNeume } from '@/models/Neumes';
import { neumeMap } from '@/models/NeumeMappings';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import Neume from '@/components/Neume.vue';

@Component({
  components: {
    SyllableNeumeBox,
    Neume,
  }
})
export default class NeumeSelector extends Vue {
  selectedTab: string = "Basic";
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

  breathNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.VareiaDotted,
    QuantitativeNeume.Cross,
  ];

  timeNeumes: NeumeTile[] = [
    {
       neume: TimeNeume.Klasma_Top,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: TimeNeume.Klasma_Top,
         }         
       ]
    },
    {
       neume: TimeNeume.Klasma_Bottom,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: TimeNeume.Klasma_Bottom,
         }         
       ]
    },
    {
       neume: TimeNeume.Hapli,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: TimeNeume.Hapli,
         }         
       ]
    },
    {
       neume: TimeNeume.Dipli,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: TimeNeume.Dipli,
         }         
       ]
    },
    {
       neume: TimeNeume.Tripli,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: TimeNeume.Tripli,
         }         
       ]
    },
    {
       neume: null,
       elements: []
    },
  ];

  gorgonNeumes: NeumeTile[] = [
    {
       neume: GorgonNeume.Gorgon_Top,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: GorgonNeume.Gorgon_Top,
           style: {
             color: '#ED0000',
           }
         }         
       ]
    },
    {
       neume: GorgonNeume.Gorgon_Bottom,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: GorgonNeume.Gorgon_Bottom,
           style: {
             color: '#ED0000',
           }
         }         
       ]
    },
    {
       neume: GorgonNeume.Digorgon,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: GorgonNeume.Digorgon,
           style: {
             color: '#ED0000',
           }
         }         
       ]
    },
    {
       neume: GorgonNeume.Trigorgon,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: GorgonNeume.Trigorgon,
           style: {
             color: '#ED0000',
           }
         }         
       ]
    },
    {
       neume: GorgonNeume.GorgonDottedLeft,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: GorgonNeume.GorgonDottedLeft,
           style: {
             color: '#ED0000',
           }
         }         
       ]
    },
    {
       neume: GorgonNeume.GorgonDottedRight,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: GorgonNeume.GorgonDottedRight,
           style: {
             color: '#ED0000',
           }
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

  commonMartyriaDiatonic: NeumeTileMartyria[] = [
    {
       note: Note.Ni,
       rootSign: RootSign.Delta,
    },
    {
       note: Note.Pa,
       rootSign: RootSign.Alpha,
    },
    {
       note: Note.Vou,
       rootSign: RootSign.Legetos,
    },
    {
       note: Note.Ga,
       rootSign: RootSign.Nana,
    },
    {
       note: Note.Thi,
       rootSign: RootSign.DeltaDotted,
    },
    {
       note: Note.Ke,
       rootSign: RootSign.AlphaDotted,
    },
    {
       note: Note.Zo,
       rootSign: RootSign.Legetos,
       apostrophe: true,
    },
    {
       note: Note.Ni,
       rootSign: RootSign.Delta,
       apostrophe: true,
    },
  ];

  commonMartyriaHardChromatic: NeumeTileMartyria[] = [
    {
       note: Note.Pa,
       rootSign: RootSign.Squiggle,
    },
    {
       note: Note.Vou,
       rootSign: RootSign.Tilt,
    },
    {
       note: Note.Ga,
       rootSign: RootSign.Squiggle,
    },
    {
       note: Note.Thi,
       rootSign: RootSign.Tilt,
    },
    {
       note: Note.Ke,
       rootSign: RootSign.Squiggle,
    },
    {
       note: Note.Zo,
       rootSign: RootSign.Tilt,
       apostrophe: true,
    },
    {
       note: Note.Ni,
       rootSign: RootSign.Squiggle,
       apostrophe: true,
    },
    {
       note: Note.Pa,
       rootSign: RootSign.Tilt,
       apostrophe: true,
    },
  ];

  commonMartyriaSoftChromatic: NeumeTileMartyria[] = [
    {
       note: Note.Ni,
       rootSign: RootSign.SoftChromaticSquiggle,
    },
    {
       note: Note.Pa,
       rootSign: RootSign.SoftChromaticPaRootSign,
    },
    {
       note: Note.Vou,
       rootSign: RootSign.SoftChromaticSquiggle,
    },
    {
       note: Note.Ga,
       rootSign: RootSign.SoftChromaticPaRootSign,
    },
    {
       note: Note.Thi,
       rootSign: RootSign.SoftChromaticSquiggle,
    },
    {
       note: Note.Ke,
       rootSign: RootSign.SoftChromaticPaRootSign,
    },
    {
       note: Note.Zo,
       rootSign: RootSign.SoftChromaticSquiggle,
       apostrophe: true,
    },
    {
       note: Note.Ni,
       rootSign: RootSign.SoftChromaticPaRootSign,
       apostrophe: true,
    },
  ];

  fthorasRowOne: NeumeTile[] = [
    this.generateFthoraTile(Fthora.DiatonicNiLow_TopCenter),
    this.generateFthoraTile(Fthora.DiatonicNiLow_BottomCenter),
    this.generateFthoraTile(Fthora.DiatonicPa_TopCenter),
    this.generateFthoraTile(Fthora.DiatonicPa_BottomCenter),
    this.generateFthoraTile(Fthora.DiatonicVou_TopCenter),
    this.generateFthoraTile(Fthora.DiatonicGa_TopCenter),
    this.generateFthoraTile(Fthora.DiatonicThi_TopCenter),
    this.generateFthoraTile(Fthora.DiatonicThi_BottomCenter),
    this.generateFthoraTile(Fthora.DiatonicKe_TopCenter),
    this.generateFthoraTile(Fthora.DiatonicKe_BottomCenter),
    this.generateFthoraTile(Fthora.DiatonicZo_TopCenter),
    this.generateFthoraTile(Fthora.DiatonicNiHigh_TopCenter),
    this.generateFthoraTile(Fthora.DiatonicNiHigh_BottomCenter),
    {
       neume: null,
       elements: []
    },
  ];

fthorasRowTwo: NeumeTile[] = [
    this.generateFthoraTile(Fthora.SoftChromaticPa_TopCenter),
    this.generateFthoraTile(Fthora.SoftChromaticPa_BottomCenter),
    this.generateFthoraTile(Fthora.SoftChromaticThi_TopCenter),
    this.generateFthoraTile(Fthora.SoftChromaticThi_BottomCenter),
    this.generateFthoraTile(Fthora.HardChromaticPa_TopCenter),
    this.generateFthoraTile(Fthora.HardChromaticPa_BottomCenter),
    this.generateFthoraTile(Fthora.HardChromaticThi_TopCenter),
    this.generateFthoraTile(Fthora.HardChromaticThi_BottomCenter),
    this.generateFthoraTile(Fthora.Enharmonic_TopCenter),
    this.generateFthoraTile(Fthora.Enharmonic_BottomCenter),
  ];

fthorasRowThree: NeumeTile[] = [
    this.generateFthoraTile(Fthora.Zygos_TopCenter),
    this.generateFthoraTile(Fthora.Zygos_BottomCenter),
    this.generateFthoraTile(Fthora.Kliton_TopCenter),
    this.generateFthoraTile(Fthora.Kliton_BottomCenter),
    this.generateFthoraTile(Fthora.Spathi_TopCenter),
  ];

  isHighNeume(neume: QuantitativeNeume) {
    return isHighNeume(neume);
  }

  isRedNeume(neume: TimeNeume) {
    return isRedNeume(neume);
  }

  generateFthoraTile(fthora: Fthora) {
    return {
       neume: fthora,
       elements: [
         {
          neume: QuantitativeNeume.Ison,
          style: {
            opacity: 0.5
          }
         },
         {
           neume: fthora,
           style: {
             color: '#ED0000',
           }
         }         
       ]
    }
  }
}

interface NeumeElement {
  neume: NeumeType;
  style?: object;
}

interface NeumeTile {
  neume: NeumeType | null;
  elements: NeumeElement[];
}

interface NeumeTileMartyria {
  note: Note | null;
  rootSign: RootSign | null;
  apostrophe?: boolean;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.neume-selector-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav {
  list-style-type: none;
}

  .nav li {
    display: inline-block;
    margin-right: 2rem;
    cursor: pointer;
  }

.tab {
  display: flex;
}

.row {
  display: flex;
  flex-direction: column;
}

.neume {
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
