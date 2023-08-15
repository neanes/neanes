import {
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
  TempoElement,
} from '@/models/Element';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  QuantitativeNeume,
  TempoSign,
  TimeNeume,
} from '@/models/Neumes';
import { getNeumeValue, getNoteSpread } from '@/models/NeumeValues';
import {
  getIsonValue,
  getNoteValue,
  getScaleNoteValue,
  Scale,
  ScaleNote,
} from '@/models/Scales';

export interface PlaybackSequenceEvent {
  frequency?: number;
  isonFrequency?: number;
  type: 'note' | 'rest';
  duration: number;
  transportTime: number;
  elementIndex: number;
  bpm: number;
}

export interface PlaybackOptions {
  useLegetos: boolean;
  useDefaultAttractionZo: boolean;

  frequencyDi: number;

  speed: number;

  diatonicIntervals: number[];
  softChromaticIntervals: number[];
  hardChromaticIntervals: number[];
  legetosIntervals: number[];
  zygosIntervals: number[];
  zygosLegetosIntervals: number[];
  spathiIntervals: number[];
  klitonIntervals: number[];

  alterationMoriaMap: { [key in Accidental]?: number };
  generalFlatMoria: number;
  generalSharpMoria: number;

  defaultAttractionZoMoria: number;

  volumeIson: number;
  volumeMelody: number;
}

export interface PlaybackWorkspace {
  events: PlaybackSequenceEvent[];
  gorgonIndexes: GorgonIndex[];
  elements: ScoreElement[];
  elementIndex: number;
  currentNoteElement: NoteElement | null;

  // This is used to keep track which part of a combination
  // character we are processing (i.e. oligon + kentimata)
  innerElementIndex: number;

  options: PlaybackOptions;

  frequency: number;
  isonFrequency: number;

  bpm: number;
  beat: number;

  /**
   * To move up, move up scale.intervals[intervalIndex] moria
   * To move down, move down scale.intervals[intervalIndex - 1] moria,
   * wrapping around to the end of the scale.intervals array, if necessary
   */
  intervalIndex: number;
  scale: PlaybackScale;
  legetos: boolean;
  note: number;
  noteOffset: number;

  /**
   * If true, attractions will be ignored
   */
  ignoreAttractions: boolean;

  lastAlterationMoria: number;

  // chroa
  enharmonicZo: boolean;
  enharmonicGa: boolean;
  enharmonicVou: boolean;
  generalSharp: boolean;
  generalFlat: boolean;

  permanentEnharmonicZo: boolean;
  permanentEnharmonicVou: boolean;
}

interface GorgonIndex {
  index: number;
  neume: GorgonNeume;
  beat: number;
}

export enum PlaybackScaleName {
  Diatonic,
  SoftChromatic,
  HardChromatic,
  Legetos,
  Kliton,
  Zygos,
  ZygosLegetos,
  SpathiKe,
  SpathiGa,
  Enharmonic,
}

export interface PlaybackScale {
  name: PlaybackScaleName;
  intervals: number[];
  scaleNoteMap: Map<ScaleNote, number>;
  fthoraMap: Map<Fthora, number>;
}

export class PlaybackService {
  constructor() {
    for (const [key, value] of this.scaleNoteMap) {
      this.reverseScaleNoteMap.set(value, key);
    }
  }

  computePlaybackSequence(elements: ScoreElement[], options: PlaybackOptions) {
    const defaultFrequencyDi = 196;

    const defaultBpm = 120;

    const workspace: PlaybackWorkspace = {
      events: [],
      gorgonIndexes: [],
      elements,
      elementIndex: 0,
      innerElementIndex: 0,
      currentNoteElement: null,

      options: {
        useLegetos: false,
        useDefaultAttractionZo: true,
        frequencyDi: defaultFrequencyDi,
        speed: 1,

        diatonicIntervals: [12, 10, 8],
        hardChromaticIntervals: [6, 20, 4],
        softChromaticIntervals: [8, 14, 8],
        legetosIntervals: [6, 9, 15],
        zygosIntervals: [18, 4, 16, 4],
        zygosLegetosIntervals: [18, 4, 20, 4],
        spathiIntervals: [20, 4, 4, 14],
        klitonIntervals: [14, 12, 4],

        generalFlatMoria: -6,
        generalSharpMoria: 4,

        defaultAttractionZoMoria: -4,

        volumeIson: -4,
        volumeMelody: 0,

        alterationMoriaMap: {
          [Accidental.Flat_2_Right]: -2,
          [Accidental.Flat_4_Right]: -4,
          [Accidental.Flat_6_Right]: -6,
          [Accidental.Flat_8_Right]: -8,
          [Accidental.Sharp_2_Left]: 2,
          [Accidental.Sharp_4_Left]: 4,
          [Accidental.Sharp_6_Left]: 6,
          [Accidental.Sharp_8_Left]: 8,
        },
      },

      intervalIndex: 0,
      frequency: defaultFrequencyDi,
      isonFrequency: 0,
      scale: this.diatonicScale,
      legetos: false,
      note: this.reverseScaleNoteMap.get(ScaleNote.Thi)!,
      noteOffset: 0,

      bpm: 0,
      beat: 0,

      ignoreAttractions: false,

      lastAlterationMoria: 0,

      //chroa
      enharmonicZo: false,
      enharmonicGa: false,
      enharmonicVou: false,
      generalFlat: false,
      generalSharp: false,

      permanentEnharmonicZo: false,
      permanentEnharmonicVou: false,
    };

    Object.assign(workspace.options, options);

    this.constructScales(workspace);

    workspace.bpm = defaultBpm * workspace.options.speed;
    workspace.beat = this.beatLengthFromBpm(workspace.bpm);
    workspace.isonFrequency = 0;

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      workspace.elementIndex = i;
      workspace.currentNoteElement = null;

      if (element.elementType === ElementType.Note) {
        const noteElement = element as NoteElement;

        workspace.currentNoteElement = noteElement;

        // Handle enharmonic fthores
        // Check if we are moving to a note with an enharmonic fthora
        if (noteElement.fthora != null) {
          const distance = getNeumeValue(noteElement.quantitativeNeume)!;

          const destinationNote = workspace.note + distance;

          const noteSpread = getNoteSpread(noteElement.quantitativeNeume);

          const allNotes = noteSpread.map((x) =>
            this.scaleNoteMap.get(destinationNote + x),
          );

          if (
            noteElement.fthora === Fthora.Enharmonic_Top ||
            noteElement.fthora === Fthora.Enharmonic_Bottom
          ) {
            const scaleNote = this.scaleNoteMap.get(destinationNote);

            if (allNotes.includes(ScaleNote.ZoHigh)) {
              workspace.enharmonicZo = true;
            } else if (
              allNotes.includes(ScaleNote.Ga) &&
              allNotes.includes(ScaleNote.Vou)
            ) {
              // If there is ambiguity, use the chromatic fthora note to decide
              if (noteElement.chromaticFthoraNote === ScaleNote.Ga) {
                workspace.enharmonicGa = true;
              } else if (noteElement.chromaticFthoraNote === ScaleNote.Vou) {
                workspace.enharmonicVou = true;
              } else {
                // In older scores, chromaticFthoraNote may be null.
                // In this case, assume the fthora is on Ga.
                workspace.enharmonicGa = true;
              }
            } else if (scaleNote === ScaleNote.Ga) {
              workspace.enharmonicGa = true;
            } else if (scaleNote === ScaleNote.Vou) {
              workspace.enharmonicVou = true;
            }

            workspace.generalFlat = false;
            workspace.generalSharp = false;

            this.applyFthora(
              noteElement.fthora,
              workspace,
              noteElement.chromaticFthoraNote,
              this.scaleNoteMap.get(workspace.note),
            );
          } else if (
            noteElement.fthora === Fthora.GeneralFlat_Top ||
            noteElement.fthora === Fthora.GeneralFlat_Bottom
          ) {
            workspace.generalFlat = true;
            workspace.enharmonicZo = false;
            if (workspace.scale.name !== PlaybackScaleName.Diatonic) {
              // General flat implies a switch to the diatonic scale
              this.switchToDiatonic(workspace);
            }
          } else if (
            noteElement.fthora === Fthora.GeneralSharp_Top ||
            noteElement.fthora === Fthora.GeneralSharp_Bottom
          ) {
            workspace.generalSharp = true;
            workspace.enharmonicGa = false;
            workspace.enharmonicVou = false;
            if (workspace.scale.name !== PlaybackScaleName.Diatonic) {
              // General sharp implies a switch to the diatonic scale
              this.switchToDiatonic(workspace);
            }
          } else {
            workspace.enharmonicZo = workspace.permanentEnharmonicZo;
            workspace.enharmonicGa = false;
            workspace.enharmonicVou = workspace.permanentEnharmonicVou;
            workspace.generalFlat = false;
            workspace.generalSharp = false;
          }
        }

        // Check ison
        if (noteElement.ison) {
          workspace.isonFrequency = -1;

          if (noteElement.ison !== Ison.Unison) {
            const di = workspace.scale.scaleNoteMap.get(ScaleNote.Thi)!;

            const distance =
              getIsonValue(noteElement.ison) - getScaleNoteValue(ScaleNote.Thi);

            const moria = this.moriaBetweenNotes(
              di,
              workspace.scale.intervals,
              distance,
            );

            workspace.isonFrequency = this.changeFrequency(
              workspace.options.frequencyDi,
              moria,
            );
          }
        }

        if (this.isKentimataCombo(noteElement)) {
          this.handleKentimataCombo(noteElement, workspace);
        } else if (
          noteElement.quantitativeNeume ===
          QuantitativeNeume.KentemataPlusOligon
        ) {
          this.handleKentimataOligon(noteElement, workspace);
        } else if (
          noteElement.quantitativeNeume === QuantitativeNeume.Hyporoe ||
          noteElement.quantitativeNeume === QuantitativeNeume.PetastiPlusHyporoe
        ) {
          this.handleHyporoe(noteElement, workspace);
        } else if (
          noteElement.quantitativeNeume === QuantitativeNeume.DoubleApostrophos
        ) {
          this.handleDoubleApostrophos(noteElement, workspace);
        } else if (
          noteElement.quantitativeNeume ===
          QuantitativeNeume.IsonPlusApostrophos
        ) {
          this.handleIsonApostrophos(noteElement, workspace);
        } else if (
          noteElement.quantitativeNeume === QuantitativeNeume.RunningElaphron ||
          noteElement.quantitativeNeume ===
            QuantitativeNeume.PetastiPlusRunningElaphron
        ) {
          this.handleRunningElaphron(noteElement, workspace);
        } else if (
          noteElement.quantitativeNeume ===
          QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata
        ) {
          this.handleRunningElaphronKentemata(noteElement, workspace);
        } else if (
          noteElement.quantitativeNeume ===
          QuantitativeNeume.OligonPlusHyporoePlusKentemata
        ) {
          this.handleHyporoeKentemata(noteElement, workspace);
        } else if (this.isRest(noteElement)) {
          this.handleRest(noteElement, workspace);
        } else {
          this.handleNote(noteElement, workspace);
        }

        if (
          noteElement.fthora != null &&
          noteElement.fthora !== Fthora.Enharmonic_Top &&
          noteElement.fthora !== Fthora.Enharmonic_Bottom
        ) {
          this.applyFthora(
            noteElement.fthora,
            workspace,
            noteElement.chromaticFthoraNote,
          );
        }
      } else if (element.elementType === ElementType.ModeKey) {
        this.applyModeKey(element as ModeKeyElement, workspace);
      } else if (element.elementType === ElementType.Martyria) {
        this.handleMartyria(element as MartyriaElement, workspace);
      } else if (element.elementType === ElementType.Tempo) {
        this.handleTempo(element as TempoElement, workspace);
      }
    }

    this.processGorgons(workspace.events, workspace.gorgonIndexes);

    // Calculate times
    let time = 0;
    let beats = 0;
    let currentBpm = defaultBpm;
    let currentBeatLength = this.beatLengthFromBpm(currentBpm);

    for (const event of workspace.events) {
      if (currentBpm != event.bpm) {
        currentBpm = event.bpm;
        currentBeatLength = this.beatLengthFromBpm(currentBpm);
      }

      time = beats * currentBeatLength;
      event.transportTime = time;
      beats += event.duration / currentBeatLength;
    }

    return workspace.events;
  }

  ////////////////////
  // Helper Methods
  ////////////////////
  changeFrequency(currentFrequency: number, moria: number) {
    return currentFrequency * Math.pow(2, moria / 72);
  }

  mod(value: number, modulus: number) {
    return ((value % modulus) + modulus) % modulus;
  }

  beatLengthFromBpm(bpm: number) {
    return (1 / bpm) * 60;
  }

  moriaBetweenNotes(
    intervalIndex: number,
    intervals: number[],
    distance: number,
  ) {
    let moria = 0;

    const abs = Math.abs(distance);
    const sign = Math.sign(distance);

    for (let i = 0; i < abs; i++) {
      const index =
        sign > 0
          ? intervalIndex
          : this.mod(intervalIndex - 1, intervals.length);

      moria += intervals[index] * sign;

      intervalIndex = this.mod(intervalIndex + sign, intervals.length);
    }

    return moria;
  }

  moveDistance(workspace: PlaybackWorkspace, distance: number) {
    if (distance === 0) {
      return;
    }

    const moria = this.moriaBetweenNotes(
      workspace.intervalIndex,
      workspace.scale.intervals,
      distance,
    );

    workspace.intervalIndex = this.mod(
      workspace.intervalIndex + distance,
      workspace.scale.intervals.length,
    );

    workspace.frequency = this.changeFrequency(workspace.frequency, moria);

    workspace.note += distance;

    // Clear the last alteration as soon as we move away
    // from the altered note
    if (distance !== 0) {
      workspace.lastAlterationMoria = 0;
    }
  }

  constructScales(workspace: PlaybackWorkspace) {
    this.diatonicScale.intervals = this.constructDiapasonScale(
      workspace.options.diatonicIntervals,
    );

    this.legetosScale.intervals = this.constructDiapasonScale(
      workspace.options.legetosIntervals,
    );

    this.hardChromaticScale.intervals = this.constructTetrachordScale(
      workspace.options.hardChromaticIntervals,
    );

    this.softChromaticScale.intervals = this.constructTetrachordScale(
      workspace.options.softChromaticIntervals,
    );

    this.zygosScale.intervals = this.constructZygosScale(
      workspace.options.zygosIntervals,
      workspace.options.diatonicIntervals,
    );

    this.zygosLegetosScale.intervals = this.constructZygosScale(
      workspace.options.zygosLegetosIntervals,
      workspace.options.diatonicIntervals,
    );

    this.klitonScale.intervals = this.constructKlitonScale(
      workspace.options.klitonIntervals,
      workspace.options.diatonicIntervals,
    );

    this.spathiKeScale.intervals = this.constructSpathiKeScale(
      workspace.options.spathiIntervals,
      workspace.options.diatonicIntervals,
    );

    this.spathiGaScale.intervals = this.constructSpathiGaScale(
      workspace.options.spathiIntervals,
      workspace.options.diatonicIntervals,
    );
  }

  constructTetrachordScale(intervals: number[]) {
    return [...intervals, 12];
  }

  constructDiapasonScale(intervals: number[]) {
    return [...intervals, 12, ...intervals];
  }

  constructZygosScale(zygosIntervals: number[], diatonicIntervals: number[]) {
    return [...zygosIntervals, ...diatonicIntervals];
  }

  constructKlitonScale(klitonIntervals: number[], diatonicIntervals: number[]) {
    return [diatonicIntervals[0], ...klitonIntervals, ...diatonicIntervals];
  }

  constructSpathiKeScale(
    spathiIntervals: number[],
    diatonicIntervals: number[],
  ) {
    return [...diatonicIntervals, ...spathiIntervals];
  }

  constructSpathiGaScale(
    spathiIntervals: number[],
    diatonicIntervals: number[],
  ) {
    return [
      diatonicIntervals[0],
      ...spathiIntervals,
      diatonicIntervals[1],
      diatonicIntervals[2],
    ];
  }

  constructEnharmonicScale(workspace: PlaybackWorkspace) {
    if (workspace.enharmonicVou) {
      return this.constructTetrachordScale([12, 12, 6]);
    } else {
      return this.constructEnharmonicScaleFromGa(workspace);
    }
  }

  constructEnharmonicScaleFromGa(workspace: PlaybackWorkspace) {
    const scale: number[] = [];

    if (workspace.enharmonicGa && workspace.enharmonicZo) {
      return [12, 12, 6];
    }

    if (workspace.enharmonicGa) {
      scale.push(12, 12, 6);
    } else {
      scale.push(...workspace.options.diatonicIntervals);
    }

    if (workspace.enharmonicZo) {
      scale.push(12, 12, 6, 12);
    } else {
      scale.push(12, ...workspace.options.diatonicIntervals);
    }

    return scale;
  }

  getScaleFromFthora(fthora: Fthora) {
    return this.scales.find(
      (x) => x.name === this.fthoraToScaleMap.get(fthora),
    );
  }

  applyFthora(
    fthora: Fthora,
    workspace: PlaybackWorkspace,
    chromaticFthoraNote: ScaleNote | null,
    note?: ScaleNote,
  ) {
    const scale = this.getScaleFromFthora(fthora);
    if (scale == null) {
      return;
    }

    workspace.scale = scale;

    if (
      workspace.options.useLegetos &&
      workspace.scale.name === PlaybackScaleName.Diatonic &&
      workspace.legetos
    ) {
      workspace.scale = this.legetosScale;
    } else if (
      workspace.options.useLegetos &&
      workspace.scale.name === PlaybackScaleName.Zygos &&
      workspace.legetos
    ) {
      workspace.scale = this.zygosLegetosScale;
    } else if (workspace.scale.name === PlaybackScaleName.Enharmonic) {
      this.enharmonicScale.intervals = this.constructEnharmonicScale(workspace);

      if (workspace.enharmonicVou) {
        this.enharmonicScale.scaleNoteMap =
          this.enharmonicZoScaleNoteToIntervalIndexMap;
        workspace.intervalIndex = this.enharmonicScale.scaleNoteMap.get(note!)!;
      } else if (workspace.enharmonicGa && workspace.enharmonicZo) {
        this.enharmonicScale.scaleNoteMap =
          this.enharmonicGaScaleNoteToIntervalIndexMap;
        workspace.intervalIndex = this.enharmonicScale.scaleNoteMap.get(note!)!;
      } else {
        this.enharmonicScale.scaleNoteMap =
          this.diatonicScaleNoteToIntervalIndexMap;
        workspace.intervalIndex = this.enharmonicScale.scaleNoteMap.get(note!)!;
      }
    } else if (
      workspace.scale.name === PlaybackScaleName.SpathiKe &&
      note === ScaleNote.Ga
    ) {
      workspace.scale = this.spathiGaScale;
    }

    if (
      chromaticFthoraNote != null &&
      (workspace.scale.name === PlaybackScaleName.SoftChromatic ||
        workspace.scale.name === PlaybackScaleName.HardChromatic)
    ) {
      workspace.intervalIndex =
        workspace.scale.scaleNoteMap.get(chromaticFthoraNote) ??
        workspace.intervalIndex;
    } else {
      workspace.intervalIndex =
        workspace.scale.fthoraMap.get(fthora) ?? workspace.intervalIndex;
    }

    // Calculate offset of the parachord
    const fthoraNote = this.fthoraToScaleNoteMap.get(fthora);

    if (fthoraNote != null) {
      workspace.noteOffset = getScaleNoteValue(fthoraNote) - workspace.note;
    } else {
      workspace.noteOffset = 0;
    }
  }

  switchToDiatonic(workspace: PlaybackWorkspace) {
    const note = this.scaleNoteMap.get(workspace.note);
    workspace.scale = this.diatonicScale;
    workspace.intervalIndex = this.diatonicScale.scaleNoteMap.get(note!)!;
  }

  applyAlterations(
    workspace: PlaybackWorkspace,
    accidental?: Accidental | null,
  ) {
    let alteredFrequency = workspace.frequency;

    if (accidental != null) {
      const alteration =
        workspace.options.alterationMoriaMap[accidental] ??
        this.alterationMap.get(accidental)!;
      alteredFrequency = this.changeFrequency(alteredFrequency, alteration);

      workspace.lastAlterationMoria = alteration;
    } else if (workspace.lastAlterationMoria !== 0) {
      alteredFrequency = this.changeFrequency(
        alteredFrequency,
        workspace.lastAlterationMoria,
      );
    }

    alteredFrequency = this.applyGeneralAlterations(
      alteredFrequency,
      workspace,
    );

    if (
      alteredFrequency === workspace.frequency &&
      !workspace.currentNoteElement?.ignoreAttractions &&
      !workspace.ignoreAttractions
    ) {
      alteredFrequency = this.applyAttractions(alteredFrequency, workspace);
    }

    return alteredFrequency;
  }

  applyGeneralAlterations(frequency: number, workspace: PlaybackWorkspace) {
    const note = this.scaleNoteMap.get(workspace.note);
    if (workspace.generalFlat && note === ScaleNote.ZoHigh) {
      frequency = this.changeFrequency(
        frequency,
        workspace.options.generalFlatMoria,
      );
    } else if (workspace.generalSharp && note === ScaleNote.Vou) {
      frequency = this.changeFrequency(
        frequency,
        workspace.options.generalSharpMoria,
      );
    }

    return frequency;
  }

  applyAttractions(frequency: number, workspace: PlaybackWorkspace) {
    const note = this.scaleNoteMap.get(workspace.note + workspace.noteOffset);

    // If melody descends after zo, flatten zo
    if (
      workspace.options.useDefaultAttractionZo &&
      !workspace.enharmonicZo &&
      (workspace.scale.name === PlaybackScaleName.Diatonic ||
        workspace.scale.name === PlaybackScaleName.Kliton ||
        workspace.scale.name === PlaybackScaleName.Zygos)
    ) {
      if (note === ScaleNote.ZoHigh && this.melodyDirection(workspace) < 0) {
        frequency = this.changeFrequency(
          frequency,
          workspace.options.defaultAttractionZoMoria,
        );
      }
    }

    return frequency;
  }

  melodyDirection(workspace: PlaybackWorkspace) {
    const currentElement = workspace.elements[
      workspace.elementIndex
    ] as NoteElement;

    // If this is the first part of a kentimata combo, then the melody
    // is clearly ascending
    if (
      workspace.innerElementIndex === 0 &&
      (this.isKentimataCombo(currentElement) ||
        currentElement.quantitativeNeume ===
          QuantitativeNeume.KentemataPlusOligon)
    ) {
      return 1;
    }

    // If this is the first part of a descending combo, then the melody
    // is clearly descending
    if (
      workspace.innerElementIndex === 0 &&
      (currentElement.quantitativeNeume ===
        QuantitativeNeume.DoubleApostrophos ||
        currentElement.quantitativeNeume ===
          QuantitativeNeume.IsonPlusApostrophos ||
        currentElement.quantitativeNeume === QuantitativeNeume.Hyporoe ||
        currentElement.quantitativeNeume === QuantitativeNeume.RunningElaphron)
    ) {
      return -1;
    }

    for (
      let i = workspace.elementIndex + 1;
      i < workspace.elements.length;
      i++
    ) {
      const element = workspace.elements[i];

      if (element.elementType !== ElementType.Note) {
        continue;
      }
      const noteElement = element as NoteElement;
      const value = getNeumeValue(noteElement.quantitativeNeume)!;

      if (value !== 0) {
        return Math.sign(value);
      }
    }

    return 0;
  }

  applyModeKey(modeKeyElement: ModeKeyElement, workspace: PlaybackWorkspace) {
    // Reset workspace flags
    workspace.legetos = false;
    workspace.lastAlterationMoria = 0;
    workspace.enharmonicGa = false;
    workspace.enharmonicVou = false;
    workspace.enharmonicZo = false;
    workspace.generalFlat = false;
    workspace.generalSharp = false;
    workspace.permanentEnharmonicZo = false;
    workspace.permanentEnharmonicVou = false;
    workspace.noteOffset = 0;
    workspace.ignoreAttractions = modeKeyElement.ignoreAttractions;

    workspace.isonFrequency = 0;

    if (modeKeyElement.scale === Scale.Diatonic) {
      workspace.scale = this.diatonicScale;

      if (
        workspace.options.useLegetos &&
        modeKeyElement.mode === 4 &&
        modeKeyElement.scale === Scale.Diatonic &&
        (modeKeyElement.scaleNote === ScaleNote.Pa ||
          modeKeyElement.scaleNote === ScaleNote.Vou)
      ) {
        workspace.scale = this.legetosScale;
        workspace.legetos = true;
      }

      if (
        modeKeyElement.permanentEnharmonicZo &&
        (modeKeyElement.mode === 3 || modeKeyElement.mode === 7)
      ) {
        workspace.enharmonicZo = true;
        workspace.permanentEnharmonicZo = true;

        workspace.scale = this.enharmonicScale;
        workspace.scale.intervals =
          this.constructEnharmonicScaleFromGa(workspace);

        this.enharmonicScale.scaleNoteMap =
          this.diatonicScaleNoteToIntervalIndexMap;
      }

      if (
        modeKeyElement.mode === 7 &&
        modeKeyElement.scaleNote === ScaleNote.Zo &&
        modeKeyElement.fthoraAboveNote === Fthora.Enharmonic_Top
      ) {
        workspace.enharmonicVou = true;
        workspace.enharmonicZo = true;
        workspace.permanentEnharmonicZo = true;
        workspace.permanentEnharmonicVou = true;

        workspace.scale = this.enharmonicScale;

        this.enharmonicScale.intervals =
          this.constructEnharmonicScale(workspace);

        this.enharmonicScale.scaleNoteMap =
          this.enharmonicZoScaleNoteToIntervalIndexMap;
      }
    } else if (modeKeyElement.scale === Scale.SoftChromatic) {
      workspace.scale = this.softChromaticScale;
    } else if (modeKeyElement.scale === Scale.HardChromatic) {
      workspace.scale = this.hardChromaticScale;
    } else if (modeKeyElement.scale === Scale.Kliton) {
      workspace.scale = this.klitonScale;
    } else if (
      modeKeyElement.scale === Scale.Spathi &&
      modeKeyElement.scaleNote === ScaleNote.Ke
    ) {
      workspace.scale = this.spathiKeScale;
    } else if (
      modeKeyElement.scale === Scale.Spathi &&
      modeKeyElement.scaleNote === ScaleNote.Ga
    ) {
      workspace.scale = this.spathiGaScale;
    }

    // TODO support mode keys with enharmonic fthora?

    const di = workspace.scale.scaleNoteMap.get(ScaleNote.Thi)!;

    const distance =
      getScaleNoteValue(modeKeyElement.scaleNote) -
      getScaleNoteValue(ScaleNote.Thi);

    workspace.intervalIndex = workspace.scale.scaleNoteMap.get(
      modeKeyElement.scaleNote,
    )!;

    workspace.note = this.reverseScaleNoteMap.get(modeKeyElement.scaleNote)!;

    if (modeKeyElement.fthora) {
      this.applyFthora(modeKeyElement.fthora, workspace, null);
    }

    const moria = this.moriaBetweenNotes(
      di,
      workspace.scale.intervals,
      distance,
    );

    workspace.frequency = this.changeFrequency(
      workspace.options.frequencyDi,
      moria,
    );

    workspace.bpm = (modeKeyElement.bpm || 120) * workspace.options.speed;
    workspace.beat = this.beatLengthFromBpm(workspace.bpm);
  }

  handleKentimataCombo(noteElement: NoteElement, workspace: PlaybackWorkspace) {
    const { events, gorgonIndexes } = workspace;

    const distance = getNeumeValue(noteElement.quantitativeNeume)!;

    // Process first note
    workspace.innerElementIndex = 0;
    const initialDistance = distance - 1;

    this.moveDistance(workspace, initialDistance);

    if (noteElement.secondaryGorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.secondaryGorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    const alteredFrequency = this.applyAlterations(workspace);

    const event: PlaybackSequenceEvent = {
      frequency: alteredFrequency,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event);

    // Process the kentimata
    workspace.innerElementIndex = 1;
    this.moveDistance(workspace, 1);

    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    // Calculate accidentals
    const alteredFrequencyKentimata = this.applyAlterations(
      workspace,
      noteElement.accidental,
    );

    const kentimataEvent: PlaybackSequenceEvent = {
      frequency: alteredFrequencyKentimata,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(kentimataEvent);
  }

  handleKentimataOligon(
    noteElement: NoteElement,
    workspace: PlaybackWorkspace,
  ) {
    const { events, gorgonIndexes } = workspace;

    // Process first note
    workspace.innerElementIndex = 0;

    const initialDistance = 1;

    this.moveDistance(workspace, initialDistance);

    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    const alteredFrequencyKentimata = this.applyAlterations(workspace);

    const kentimataEvent: PlaybackSequenceEvent = {
      frequency: alteredFrequencyKentimata,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(kentimataEvent);

    // Process the kentimata
    workspace.innerElementIndex = 1;

    let oligonDuration = 1 * workspace.beat;

    this.moveDistance(workspace, 1);

    if (noteElement.timeNeume != null) {
      oligonDuration +=
        this.timeMap.get(noteElement.timeNeume)! * workspace.beat;
    }

    // Calculate accidentals
    const alteredFrequency = this.applyAlterations(
      workspace,
      noteElement.accidental,
    );

    const oligonEvent: PlaybackSequenceEvent = {
      frequency: alteredFrequency,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: oligonDuration,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(oligonEvent);
  }

  handleHyporoe(noteElement: NoteElement, workspace: PlaybackWorkspace) {
    const { events, gorgonIndexes } = workspace;

    // Process first note
    workspace.innerElementIndex = 0;

    const initialDistance = -1;

    this.moveDistance(workspace, initialDistance);

    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    const alteredFrequency1 = this.applyAlterations(workspace);

    const event1: PlaybackSequenceEvent = {
      frequency: alteredFrequency1,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event1);

    // Process the kentimata
    workspace.innerElementIndex = 1;

    let event2Duration = 1 * workspace.beat;

    this.moveDistance(workspace, -1);

    if (noteElement.timeNeume != null) {
      event2Duration +=
        this.timeMap.get(noteElement.timeNeume)! * workspace.beat;
    }

    // Calculate accidentals
    const alteredFrequency2 = this.applyAlterations(
      workspace,
      noteElement.accidental,
    );

    const event2: PlaybackSequenceEvent = {
      frequency: alteredFrequency2,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: event2Duration,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event2);
  }

  handleHyporoeKentemata(
    noteElement: NoteElement,
    workspace: PlaybackWorkspace,
  ) {
    const { events, gorgonIndexes } = workspace;

    // Process first note
    workspace.innerElementIndex = 0;

    const initialDistance = -1;

    this.moveDistance(workspace, initialDistance);

    if (noteElement.secondaryGorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.secondaryGorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    const alteredFrequency1 = this.applyAlterations(workspace);

    const event1: PlaybackSequenceEvent = {
      frequency: alteredFrequency1,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event1);

    // Process the kentimata
    workspace.innerElementIndex = 1;

    let event2Duration = 1 * workspace.beat;

    this.moveDistance(workspace, -1);

    if (noteElement.timeNeume != null) {
      event2Duration +=
        this.timeMap.get(noteElement.timeNeume)! * workspace.beat;
    }

    // Calculate accidentals
    const alteredFrequency2 = this.applyAlterations(workspace);

    const event2: PlaybackSequenceEvent = {
      frequency: alteredFrequency2,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: event2Duration,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event2);

    // Process the kentimata
    workspace.innerElementIndex = 2;
    this.moveDistance(workspace, 1);

    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    // Calculate accidentals
    const alteredFrequencyKentimata = this.applyAlterations(
      workspace,
      noteElement.accidental,
    );

    const kentimataEvent: PlaybackSequenceEvent = {
      frequency: alteredFrequencyKentimata,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(kentimataEvent);
  }

  handleDoubleApostrophos(
    noteElement: NoteElement,
    workspace: PlaybackWorkspace,
  ) {
    const { events, gorgonIndexes } = workspace;

    // Process first apostrofos
    workspace.innerElementIndex = 0;

    const initialDistance = -1;

    this.moveDistance(workspace, initialDistance);

    if (noteElement.secondaryGorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.secondaryGorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    const alteredFrequency1 = this.applyAlterations(workspace);

    const event1: PlaybackSequenceEvent = {
      frequency: alteredFrequency1,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event1);

    // Process the second apsotrofos
    workspace.innerElementIndex = 1;

    const event2Duration = 1 * workspace.beat;

    this.moveDistance(workspace, -1);

    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    // Calculate accidentals
    const alteredFrequency2 = this.applyAlterations(
      workspace,
      noteElement.accidental,
    );

    const event2: PlaybackSequenceEvent = {
      frequency: alteredFrequency2,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: event2Duration,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event2);
  }

  handleIsonApostrophos(
    noteElement: NoteElement,
    workspace: PlaybackWorkspace,
  ) {
    const { events, gorgonIndexes } = workspace;

    // Process ison
    workspace.innerElementIndex = 0;

    const initialDistance = 0;

    this.moveDistance(workspace, initialDistance);

    if (noteElement.secondaryGorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.secondaryGorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    const alteredFrequency1 = this.applyAlterations(workspace);

    const event1: PlaybackSequenceEvent = {
      frequency: alteredFrequency1,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event1);

    // Process the apostrofos
    workspace.innerElementIndex = 1;

    const event2Duration = 1 * workspace.beat;

    this.moveDistance(workspace, -1);

    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    // Calculate accidentals
    const alteredFrequency2 = this.applyAlterations(
      workspace,
      noteElement.accidental,
    );

    const event2: PlaybackSequenceEvent = {
      frequency: alteredFrequency2,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: event2Duration,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event2);
  }

  handleRunningElaphron(
    noteElement: NoteElement,
    workspace: PlaybackWorkspace,
  ) {
    const { events, gorgonIndexes } = workspace;

    // Process first note
    workspace.innerElementIndex = 0;

    this.moveDistance(workspace, -1);

    // Add a virtual gorgon
    const gorgonIndex: GorgonIndex = {
      neume: GorgonNeume.Gorgon_Top,
      index: events.length,
      beat: workspace.beat,
    };

    gorgonIndexes.push(gorgonIndex);

    const alteredFrequency1 = this.applyAlterations(workspace);

    const event1: PlaybackSequenceEvent = {
      frequency: alteredFrequency1,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event1);

    // Process the second note
    workspace.innerElementIndex = 1;

    let event2Duration = 1 * workspace.beat;

    this.moveDistance(workspace, -1);

    if (noteElement.timeNeume != null) {
      event2Duration +=
        this.timeMap.get(noteElement.timeNeume)! * workspace.beat;
    }

    // Calculate accidentals
    const alteredFrequency2 = this.applyAlterations(
      workspace,
      noteElement.accidental,
    );

    const event2: PlaybackSequenceEvent = {
      frequency: alteredFrequency2,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: event2Duration,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event2);
  }

  handleRunningElaphronKentemata(
    noteElement: NoteElement,
    workspace: PlaybackWorkspace,
  ) {
    const { events, gorgonIndexes } = workspace;

    // Process first note
    workspace.innerElementIndex = 0;

    this.moveDistance(workspace, -1);

    // Add a virtual gorgon
    const gorgonIndex: GorgonIndex = {
      neume: GorgonNeume.Gorgon_Top,
      index: events.length,
      beat: workspace.beat,
    };

    gorgonIndexes.push(gorgonIndex);

    const alteredFrequency1 = this.applyAlterations(workspace);

    const event1: PlaybackSequenceEvent = {
      frequency: alteredFrequency1,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event1);

    // Process the second note
    workspace.innerElementIndex = 1;

    let event2Duration = 1 * workspace.beat;

    this.moveDistance(workspace, -1);

    if (noteElement.timeNeume != null) {
      event2Duration +=
        this.timeMap.get(noteElement.timeNeume)! * workspace.beat;
    }

    // Calculate accidentals
    const alteredFrequency2 = this.applyAlterations(workspace);

    const event2: PlaybackSequenceEvent = {
      frequency: alteredFrequency2,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: event2Duration,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event2);

    // Process the kentimata
    workspace.innerElementIndex = 2;
    this.moveDistance(workspace, 1);

    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    // Calculate accidentals
    const alteredFrequencyKentimata = this.applyAlterations(
      workspace,
      noteElement.accidental,
    );

    const kentimataEvent: PlaybackSequenceEvent = {
      frequency: alteredFrequencyKentimata,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: 1 * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(kentimataEvent);
  }

  handleNote(noteElement: NoteElement, workspace: PlaybackWorkspace) {
    const { events, gorgonIndexes } = workspace;

    const distance = getNeumeValue(noteElement.quantitativeNeume)!;

    workspace.innerElementIndex = 0;

    this.moveDistance(workspace, distance);

    let duration = 1 * workspace.beat;

    // Calculate time
    if (noteElement.timeNeume != null) {
      duration += this.timeMap.get(noteElement.timeNeume)! * workspace.beat;
    }

    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: events.length,
        beat: workspace.beat,
      };

      gorgonIndexes.push(gorgonIndex);
    }

    // Calculate accidentals
    const alteredFrequency = this.applyAlterations(
      workspace,
      noteElement.accidental,
    );

    const event: PlaybackSequenceEvent = {
      frequency: alteredFrequency,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    events.push(event);
  }

  handleRest(noteElement: NoteElement, workspace: PlaybackWorkspace) {
    const duration = this.restMap.get(noteElement.quantitativeNeume)!;

    const restEvent: PlaybackSequenceEvent = {
      type: 'rest',
      bpm: workspace.bpm,
      duration: duration * workspace.beat,
      transportTime: 0,
      elementIndex: workspace.elementIndex,
    };

    workspace.events.push(restEvent);
  }

  handleMartyria(
    martyriaElement: MartyriaElement,
    workspace: PlaybackWorkspace,
  ) {
    if (martyriaElement.tempo != null) {
      workspace.bpm =
        (martyriaElement.bpm ||
          this.tempoToBpmMap.get(martyriaElement.tempo)!) *
        workspace.options.speed;
      workspace.beat = this.beatLengthFromBpm(workspace.bpm);
    }

    if (martyriaElement.fthora) {
      this.applyFthora(
        martyriaElement.fthora,
        workspace,
        martyriaElement.chromaticFthoraNote,
      );
    } else if (
      workspace.scale.name === PlaybackScaleName.Enharmonic &&
      !workspace.permanentEnharmonicZo &&
      !workspace.permanentEnharmonicVou
    ) {
      // Clear the enharmonic fthora
      this.switchToDiatonic(workspace);
    }

    if (!martyriaElement.auto) {
      // TODO support martyriaElement.scale
      // if (martyriaElement.scale === Scale.Diatonic) {
      //   workspace.scale = this.diatonicScale;

      //   if (workspace.legetos) {
      //     workspace.scale = this.legetosScale;
      //   }

      //   if (workspace.permanentEnharmonicZo) {
      //     workspace.scale = this.enharmonicScale;
      //     workspace.scale.intervals =
      //       this.constructEnharmonicScaleFromGa(workspace);

      //     this.enharmonicScale.scaleNoteMap =
      //       this.diatonicScaleNoteToIntervalIndexMap;
      //   }
      // } else if (martyriaElement.scale === Scale.SoftChromatic) {
      //   workspace.scale = this.softChromaticScale;
      // } else if (martyriaElement.scale === Scale.HardChromatic) {
      //   workspace.scale = this.hardChromaticScale;
      // }

      const distance =
        getNoteValue(martyriaElement.note) -
        getScaleNoteValue(this.scaleNoteMap.get(workspace.note)!);

      this.moveDistance(workspace, distance);
    }

    workspace.enharmonicZo = workspace.permanentEnharmonicZo;
    workspace.enharmonicGa = false;
    workspace.enharmonicVou = workspace.permanentEnharmonicVou;
  }

  handleTempo(tempoElement: TempoElement, workspace: PlaybackWorkspace) {
    workspace.bpm =
      (tempoElement.bpm || this.tempoToBpmMap.get(tempoElement.neume)!) *
      workspace.options.speed;
    workspace.beat = this.beatLengthFromBpm(workspace.bpm);
  }

  isKentimataCombo(element: NoteElement) {
    // Note that this list does not contain the following special cases:
    // OligonPlusHyporoePlusKentemata
    // OligonPlusRunningElaphronPlusKentemata
    // KentemataPlusOligon
    // These are handled separately
    return [
      QuantitativeNeume.OligonPlusHamiliPlusKentemata,
      QuantitativeNeume.OligonPlusIsonPlusKentemata,
      QuantitativeNeume.OligonPlusElaphronPlusKentemata,
      QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
      QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
      QuantitativeNeume.OligonKentimaMiddleKentimata,
      QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
      QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
      QuantitativeNeume.OligonPlusKentemata,
    ].includes(element.quantitativeNeume);
  }

  isRest(element: NoteElement) {
    return [
      QuantitativeNeume.Breath,
      QuantitativeNeume.Cross,
      QuantitativeNeume.VareiaDotted,
      QuantitativeNeume.VareiaDotted2,
      QuantitativeNeume.VareiaDotted3,
      QuantitativeNeume.VareiaDotted4,
    ].includes(element.quantitativeNeume);
  }

  processGorgons(
    events: PlaybackSequenceEvent[],
    gorgonIndexes: GorgonIndex[],
  ) {
    for (const gorgon of gorgonIndexes) {
      const durations = this.gorgonMap.get(gorgon.neume)!;

      // TODO: handle the case where the user has made an
      // error and placed gorgons in a location where
      // affectedEvents.length < durations.length
      const affectedEvents = events.slice(
        gorgon.index - 1,
        gorgon.index + durations.length - 1,
      );

      for (let i = 0; i < durations.length; i++) {
        if (affectedEvents[i]) {
          affectedEvents[i].duration -= durations[i] * gorgon.beat;
        }
      }
    }
  }

  /////////////////////////
  // Maps
  /////////////////////////

  alterationMap = new Map<Accidental, number>([
    [Accidental.Flat_2_Right, -2],
    [Accidental.Flat_4_Right, -4],
    [Accidental.Flat_6_Right, -6],
    [Accidental.Flat_8_Right, -8],
    [Accidental.Sharp_2_Left, 2],
    [Accidental.Sharp_4_Left, 4],
    [Accidental.Sharp_6_Left, 6],
    [Accidental.Sharp_8_Left, 8],
  ]);

  fthoraToScaleMap = new Map<Fthora, PlaybackScaleName>([
    [Fthora.DiatonicNiLow_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicNiLow_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicPa_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicPa_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicVou_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicVou_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicGa_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicGa_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicThi_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicThi_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicKe_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicKe_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicZo_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicZo_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicNiHigh_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicNiHigh_Bottom, PlaybackScaleName.Diatonic],

    [Fthora.SoftChromaticPa_Top, PlaybackScaleName.SoftChromatic],
    [Fthora.SoftChromaticPa_Bottom, PlaybackScaleName.SoftChromatic],
    [Fthora.SoftChromaticThi_Top, PlaybackScaleName.SoftChromatic],
    [Fthora.SoftChromaticThi_Bottom, PlaybackScaleName.SoftChromatic],

    [Fthora.HardChromaticPa_Top, PlaybackScaleName.HardChromatic],
    [Fthora.HardChromaticPa_Bottom, PlaybackScaleName.HardChromatic],
    [Fthora.HardChromaticThi_Top, PlaybackScaleName.HardChromatic],
    [Fthora.HardChromaticThi_Bottom, PlaybackScaleName.HardChromatic],

    [Fthora.Kliton_Top, PlaybackScaleName.Kliton],
    [Fthora.Kliton_Bottom, PlaybackScaleName.Kliton],

    [Fthora.Zygos_Top, PlaybackScaleName.Zygos],
    [Fthora.Zygos_Bottom, PlaybackScaleName.Zygos],

    [Fthora.Spathi_Top, PlaybackScaleName.SpathiKe],
    [Fthora.Spathi_Bottom, PlaybackScaleName.SpathiKe],

    [Fthora.Enharmonic_Top, PlaybackScaleName.Enharmonic],
    [Fthora.Enharmonic_Bottom, PlaybackScaleName.Enharmonic],
  ]);

  fthoraToScaleNoteMap: Map<Fthora, ScaleNote> = new Map<Fthora, ScaleNote>([
    [Fthora.DiatonicNiLow_Top, ScaleNote.Ni],
    [Fthora.DiatonicNiLow_Bottom, ScaleNote.Ni],
    [Fthora.DiatonicPa_Top, ScaleNote.Pa],
    [Fthora.DiatonicPa_Bottom, ScaleNote.Pa],
    [Fthora.DiatonicVou_Top, ScaleNote.Vou],
    [Fthora.DiatonicVou_Bottom, ScaleNote.Vou],
    [Fthora.DiatonicGa_Top, ScaleNote.Ga],
    [Fthora.DiatonicGa_Bottom, ScaleNote.Ga],
    [Fthora.DiatonicThi_Top, ScaleNote.Thi],
    [Fthora.DiatonicThi_Bottom, ScaleNote.Thi],
    [Fthora.DiatonicKe_Top, ScaleNote.Ke],
    [Fthora.DiatonicKe_Bottom, ScaleNote.Ke],
    [Fthora.DiatonicZo_Top, ScaleNote.ZoHigh],
    [Fthora.DiatonicZo_Bottom, ScaleNote.ZoHigh],
    [Fthora.DiatonicNiHigh_Top, ScaleNote.NiHigh],
    [Fthora.DiatonicNiHigh_Bottom, ScaleNote.NiHigh],
  ]);

  gorgonMap = new Map<GorgonNeume, number[]>([
    [GorgonNeume.Gorgon_Top, [0.5, 0.5]],
    [GorgonNeume.Gorgon_Bottom, [0.5, 0.5]],
    [GorgonNeume.GorgonDottedLeft, [1 / 3, 2 / 3]],
    [GorgonNeume.GorgonDottedRight, [2 / 3, 1 / 3]],
    [GorgonNeume.Digorgon, [2 / 3, 2 / 3, 2 / 3]],
    [GorgonNeume.DigorgonDottedLeft1, [0.5, 0.75, 0.75]],
    [GorgonNeume.DigorgonDottedLeft2, [0.75, 0.5, 0.75]],
    [GorgonNeume.DigorgonDottedRight, [0.75, 0.75, 0.5]],
    [GorgonNeume.Trigorgon, [0.75, 0.75, 0.75, 0.75]],
    // TODO handle trigorgon dotted
    [GorgonNeume.TrigorgonDottedLeft1, [0.75, 0.75, 0.75, 0.75]],
    [GorgonNeume.TrigorgonDottedLeft2, [0.75, 0.75, 0.75, 0.75]],
    [GorgonNeume.TrigorgonDottedRight, [0.75, 0.75, 0.75, 0.75]],
    // Secondary
    [GorgonNeume.GorgonSecondary, [0.5, 0.5]],
    [GorgonNeume.GorgonDottedLeftSecondary, [1 / 3, 2 / 3]],
    [GorgonNeume.GorgonDottedRightSecondary, [2 / 3, 1 / 3]],
    [GorgonNeume.DigorgonSecondary, [2 / 3, 2 / 3, 2 / 3]],
    [GorgonNeume.DigorgonDottedLeft1Secondary, [0.5, 0.75, 0.75]],
    [GorgonNeume.DigorgonDottedRightSecondary, [0.75, 0.75, 0.5]],
    [GorgonNeume.TrigorgonSecondary, [0.75, 0.75, 0.75, 0.75]],
    // TODO handle trigorgon dotted
    [GorgonNeume.TrigorgonDottedLeft1Secondary, [0.75, 0.75, 0.75, 0.75]],
    [GorgonNeume.TrigorgonDottedRightSecondary, [0.75, 0.75, 0.75, 0.75]],

    [GorgonNeume.Argon, [0.5, 0.5, -1]],
    [GorgonNeume.Hemiolion, [0.5, 0.5, -2]],
    [GorgonNeume.Diargon, [0.5, 0.5, -3]],
  ]);

  restMap = new Map<QuantitativeNeume, number>([
    [QuantitativeNeume.Breath, 0],
    [QuantitativeNeume.Cross, 0],
    [QuantitativeNeume.VareiaDotted, 1],
    [QuantitativeNeume.VareiaDotted2, 2],
    [QuantitativeNeume.VareiaDotted3, 3],
    [QuantitativeNeume.VareiaDotted4, 4],
  ]);

  scaleNoteMap = new Map<number, ScaleNote>([
    [-6, ScaleNote.VouLow],
    [-5, ScaleNote.GaLow],
    [-4, ScaleNote.ThiLow],
    [-3, ScaleNote.KeLow],
    [-2, ScaleNote.Zo],
    [-1, ScaleNote.Ni],
    [0, ScaleNote.Pa],
    [1, ScaleNote.Vou],
    [2, ScaleNote.Ga],
    [3, ScaleNote.Thi],
    [4, ScaleNote.Ke],
    [5, ScaleNote.ZoHigh],
    [6, ScaleNote.NiHigh],
    [7, ScaleNote.PaHigh],
    [8, ScaleNote.VouHigh],
    [9, ScaleNote.GaHigh],
    [10, ScaleNote.ThiHigh],
    [11, ScaleNote.KeHigh],
  ]);

  reverseScaleNoteMap = new Map<ScaleNote, number>();

  timeMap = new Map<TimeNeume, number>([
    [TimeNeume.Klasma_Bottom, 1],
    [TimeNeume.Klasma_Top, 1],
    [TimeNeume.Hapli, 1],
    [TimeNeume.Dipli, 2],
    [TimeNeume.Tripli, 3],
  ]);

  tempoToBpmMap = new Map<TempoSign, number>([
    [TempoSign.VerySlow, 40], // < 56 triargon?
    [TempoSign.Slower, 56], // 56 - 80 diargon
    [TempoSign.Slow, 80], // 80 - 100 hemiolion
    [TempoSign.Moderate, 100], // 100 - 168 argon
    [TempoSign.Medium, 130], // 130 argon + gorgon
    [TempoSign.Quick, 168], // 168 - 208 gorgon
    [TempoSign.Quicker, 208], // 208+ digorgon
    [TempoSign.VeryQuick, 250], // unattested? trigorgon

    [TempoSign.VerySlowAbove, 40], // < 56 triargon?
    [TempoSign.SlowerAbove, 56], // 56 - 80 diargon
    [TempoSign.SlowAbove, 80], // 80 - 100 hemiolion
    [TempoSign.ModerateAbove, 100], // 100 - 168 argon
    [TempoSign.MediumAbove, 130], // 130 argon + gorgon
    [TempoSign.QuickAbove, 168], // 168 - 208 gorgon
    [TempoSign.QuickerAbove, 208], // 208+ digorgon
    [TempoSign.VeryQuickAbove, 250], // unattested? trigorgon
  ]);

  /////////////////////////
  // Scales
  /////////////////////////

  diatonicScaleNoteToIntervalIndexMap: Map<ScaleNote, number> = new Map<
    ScaleNote,
    number
  >([
    [ScaleNote.VouLow, 2],
    [ScaleNote.GaLow, 3],
    [ScaleNote.ThiLow, 4],
    [ScaleNote.KeLow, 5],
    [ScaleNote.Zo, 6],
    [ScaleNote.Ni, 0],
    [ScaleNote.Pa, 1],
    [ScaleNote.Vou, 2],
    [ScaleNote.Ga, 3],
    [ScaleNote.Thi, 4],
    [ScaleNote.Ke, 5],
    [ScaleNote.ZoHigh, 6],
    [ScaleNote.NiHigh, 0],
    [ScaleNote.PaHigh, 1],
    [ScaleNote.VouHigh, 2],
    [ScaleNote.GaHigh, 3],
    [ScaleNote.ThiHigh, 4],
    [ScaleNote.KeHigh, 5],
  ]);

  enharmonicZoScaleNoteToIntervalIndexMap: Map<ScaleNote, number> = new Map<
    ScaleNote,
    number
  >([
    [ScaleNote.VouLow, 0],
    [ScaleNote.GaLow, 1],
    [ScaleNote.ThiLow, 2],
    [ScaleNote.KeLow, 3],
    [ScaleNote.Zo, 0],
    [ScaleNote.Ni, 1],
    [ScaleNote.Pa, 2],
    [ScaleNote.Vou, 3],
    [ScaleNote.Ga, 0],
    [ScaleNote.Thi, 1],
    [ScaleNote.Ke, 2],
    [ScaleNote.ZoHigh, 3],
    [ScaleNote.NiHigh, 0],
    [ScaleNote.PaHigh, 1],
    [ScaleNote.VouHigh, 2],
    [ScaleNote.GaHigh, 3],
    [ScaleNote.ThiHigh, 0],
    [ScaleNote.KeHigh, 1],
  ]);

  enharmonicGaScaleNoteToIntervalIndexMap: Map<ScaleNote, number> = new Map<
    ScaleNote,
    number
  >([
    [ScaleNote.VouLow, 1],
    [ScaleNote.GaLow, 2],
    [ScaleNote.ThiLow, 0],
    [ScaleNote.KeLow, 1],
    [ScaleNote.Zo, 2],
    [ScaleNote.Ni, 0],
    [ScaleNote.Pa, 1],
    [ScaleNote.Vou, 2],
    [ScaleNote.Ga, 0],
    [ScaleNote.Thi, 1],
    [ScaleNote.Ke, 2],
    [ScaleNote.ZoHigh, 0],
    [ScaleNote.NiHigh, 1],
    [ScaleNote.PaHigh, 2],
    [ScaleNote.VouHigh, 0],
    [ScaleNote.GaHigh, 1],
    [ScaleNote.ThiHigh, 2],
    [ScaleNote.KeHigh, 0],
  ]);

  diatonicScale: PlaybackScale = {
    name: PlaybackScaleName.Diatonic,
    intervals: [12, 10, 8, 12, 12, 10, 8],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
    fthoraMap: new Map<Fthora, number>([
      [Fthora.DiatonicNiLow_Top, 0],
      [Fthora.DiatonicNiLow_Bottom, 0],
      [Fthora.DiatonicPa_Top, 1],
      [Fthora.DiatonicPa_Bottom, 1],
      [Fthora.DiatonicVou_Top, 2],
      [Fthora.DiatonicVou_Bottom, 2],
      [Fthora.DiatonicGa_Top, 3],
      [Fthora.DiatonicGa_Bottom, 3],
      [Fthora.DiatonicThi_Top, 4],
      [Fthora.DiatonicThi_Bottom, 4],
      [Fthora.DiatonicKe_Top, 5],
      [Fthora.DiatonicKe_Bottom, 5],
      [Fthora.DiatonicZo_Top, 6],
      [Fthora.DiatonicZo_Bottom, 6],
      [Fthora.DiatonicNiHigh_Top, 0],
      [Fthora.DiatonicNiHigh_Bottom, 0],
    ]),
  };

  hardChromaticScale: PlaybackScale = {
    name: PlaybackScaleName.HardChromatic,
    intervals: [6, 20, 4, 12],
    scaleNoteMap: new Map<ScaleNote, number>([
      [ScaleNote.VouLow, 2],
      [ScaleNote.GaLow, 3],
      [ScaleNote.ThiLow, 0],
      [ScaleNote.KeLow, 1],
      [ScaleNote.Zo, 2],
      [ScaleNote.Ni, 3],
      [ScaleNote.Pa, 0],
      [ScaleNote.Vou, 1],
      [ScaleNote.Ga, 2],
      [ScaleNote.Thi, 3],
      [ScaleNote.Ke, 0],
      [ScaleNote.ZoHigh, 1],
      [ScaleNote.NiHigh, 2],
      [ScaleNote.PaHigh, 3],
      [ScaleNote.VouHigh, 0],
      [ScaleNote.GaHigh, 1],
      [ScaleNote.ThiHigh, 2],
      [ScaleNote.KeHigh, 3],
    ]),
    fthoraMap: new Map<Fthora, number>([
      [Fthora.HardChromaticPa_Top, 0],
      [Fthora.HardChromaticPa_Bottom, 0],
      [Fthora.HardChromaticThi_Top, 3],
      [Fthora.HardChromaticThi_Bottom, 3],
    ]),
  };

  softChromaticScale: PlaybackScale = {
    name: PlaybackScaleName.SoftChromatic,

    intervals: [8, 14, 8, 12],
    scaleNoteMap: new Map<ScaleNote, number>([
      [ScaleNote.VouLow, 3],
      [ScaleNote.GaLow, 0],
      [ScaleNote.ThiLow, 1],
      [ScaleNote.KeLow, 2],
      [ScaleNote.Zo, 3],
      [ScaleNote.Ni, 0],
      [ScaleNote.Pa, 1],
      [ScaleNote.Vou, 2],
      [ScaleNote.Ga, 3],
      [ScaleNote.Thi, 0],
      [ScaleNote.Ke, 1],
      [ScaleNote.ZoHigh, 2],
      [ScaleNote.NiHigh, 3],
      [ScaleNote.PaHigh, 0],
      [ScaleNote.VouHigh, 1],
      [ScaleNote.GaHigh, 2],
      [ScaleNote.ThiHigh, 3],
      [ScaleNote.KeHigh, 0],
    ]),
    fthoraMap: new Map<Fthora, number>([
      [Fthora.SoftChromaticPa_Top, 3],
      [Fthora.SoftChromaticPa_Bottom, 3],
      [Fthora.SoftChromaticThi_Top, 0],
      [Fthora.SoftChromaticThi_Bottom, 0],
    ]),
  };

  legetosScale: PlaybackScale = {
    name: PlaybackScaleName.Legetos,
    intervals: [6, 9, 15, 12, 6, 9, 15],
    scaleNoteMap: new Map<ScaleNote, number>([
      [ScaleNote.VouLow, 1],
      [ScaleNote.GaLow, 2],
      [ScaleNote.ThiLow, 3],
      [ScaleNote.KeLow, 4],
      [ScaleNote.Zo, 5],
      [ScaleNote.Ni, 6],
      [ScaleNote.Pa, 0],
      [ScaleNote.Vou, 1],
      [ScaleNote.Ga, 2],
      [ScaleNote.Thi, 3],
      [ScaleNote.Ke, 4],
      [ScaleNote.ZoHigh, 5],
      [ScaleNote.NiHigh, 6],
      [ScaleNote.PaHigh, 0],
      [ScaleNote.VouHigh, 1],
      [ScaleNote.GaHigh, 2],
      [ScaleNote.ThiHigh, 3],
      [ScaleNote.KeHigh, 4],
    ]),
    fthoraMap: new Map<Fthora, number>([
      [Fthora.DiatonicNiLow_Top, 6],
      [Fthora.DiatonicNiLow_Bottom, 6],
      [Fthora.DiatonicPa_Top, 0],
      [Fthora.DiatonicPa_Bottom, 0],
      [Fthora.DiatonicVou_Top, 1],
      [Fthora.DiatonicVou_Bottom, 1],
      [Fthora.DiatonicGa_Top, 2],
      [Fthora.DiatonicGa_Bottom, 2],
      [Fthora.DiatonicThi_Top, 3],
      [Fthora.DiatonicThi_Bottom, 3],
      [Fthora.DiatonicKe_Top, 4],
      [Fthora.DiatonicKe_Bottom, 4],
      [Fthora.DiatonicZo_Top, 5],
      [Fthora.DiatonicZo_Bottom, 5],
      [Fthora.DiatonicNiHigh_Top, 6],
      [Fthora.DiatonicNiHigh_Bottom, 6],
    ]),
  };

  zygosScale: PlaybackScale = {
    name: PlaybackScaleName.Zygos,
    intervals: [18, 4, 16, 4, 12, 10, 8],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
    fthoraMap: new Map<Fthora, number>([
      [Fthora.Zygos_Top, 4],
      [Fthora.Zygos_Bottom, 4],
    ]),
  };

  zygosLegetosScale: PlaybackScale = {
    name: PlaybackScaleName.ZygosLegetos,
    intervals: [18, 4, 20, 4, 12, 6, 9],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
    fthoraMap: new Map<Fthora, number>([
      [Fthora.Zygos_Top, 4],
      [Fthora.Zygos_Bottom, 4],
    ]),
  };

  klitonScale: PlaybackScale = {
    name: PlaybackScaleName.Kliton,
    intervals: [12, 14, 12, 4, 12, 10, 8],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
    fthoraMap: new Map<Fthora, number>([
      [Fthora.Kliton_Top, 4],
      [Fthora.Kliton_Bottom, 4],
    ]),
  };

  spathiKeScale: PlaybackScale = {
    name: PlaybackScaleName.SpathiKe,
    intervals: [12, 10, 8, 20, 4, 4, 14],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
    fthoraMap: new Map<Fthora, number>([
      [Fthora.Spathi_Top, 5],
      [Fthora.Spathi_Bottom, 5],
    ]),
  };

  spathiGaScale: PlaybackScale = {
    name: PlaybackScaleName.SpathiGa,
    intervals: [12, 14, 4, 4, 20, 10, 8],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
    fthoraMap: new Map<Fthora, number>([
      [Fthora.Spathi_Top, 3],
      [Fthora.Spathi_Bottom, 3],
    ]),
  };

  // The intervals of this scale are constructed dynamically
  enharmonicScale: PlaybackScale = {
    name: PlaybackScaleName.Enharmonic,
    intervals: [12, 12, 6, 12, 12, 12, 6],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
    fthoraMap: new Map<Fthora, number>(),
  };

  scales: PlaybackScale[] = [
    this.diatonicScale,
    this.softChromaticScale,
    this.hardChromaticScale,
    this.legetosScale,
    this.zygosScale,
    this.zygosLegetosScale,
    this.klitonScale,
    this.spathiKeScale,
    this.spathiGaScale,
    this.enharmonicScale,
  ];
}
