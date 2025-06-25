import { ScoreElement } from '@/models/Element';
import { Accidental } from '@/models/Neumes';
import {
  getScaleNoteFromValue,
  getScaleNoteValue,
  Scale,
  ScaleNote,
} from '@/models/Scales';

import {
  AnalysisNode,
  AnalysisService,
  FthoraNode,
  IsonNode,
  ModeKeyNode,
  NodeType,
  NoteAtomNode,
  RestNode,
  TempoNode,
} from './AnalysisService';

export interface PlaybackSequenceEvent {
  frequency?: number;
  isonFrequency?: number;
  type: 'note' | 'rest';
  duration: number;
  transportTime: number;
  absoluteTime: number;
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

  alterationMultipliers: number[];
  alterationMoriaMap: { [key in Accidental]?: number };

  defaultAttractionZoMoria: number;
  defaultAttractionKeMoria: number;

  volumeIson: number;
  volumeMelody: number;
}

export interface PlaybackWorkspace {
  events: PlaybackSequenceEvent[];

  options: PlaybackOptions;

  frequency: number;
  isonFrequency: number;

  bpm: number;
  beat: number;

  scale: PlaybackScale;
  physicalNote: ScaleNote;
  legetos: boolean;
  chrysanthineAccidentals: boolean;

  /*
   * If a fthora is in effect, the number of moria by which the virtual notes
   * need to be transposed to reach their physical targets.
   */
  transpositionMoria: number;

  /**
   * If true, attractions will be ignored
   */
  ignoreAttractions: boolean;

  /**
   * These fields are used to ensure that an accidental that is applied to a
   * particular note persists on that note until we move off that note, even if
   * subsequent instances of that note do not have an explicit accidental. Note
   * that the last alteration note a physical note, not a virtual note.
   */
  lastAlterationMoria: number;
  lastAlterationNote: ScaleNote;

  permanentEnharmonicZo: boolean;

  zoFlatPivotActivated: boolean;
  zoNaturalPivotActivated: boolean;

  // debug
  loggingEnabled: boolean;
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
}

export class PlaybackService {
  computePlaybackSequence(
    elements: ScoreElement[],
    options: PlaybackOptions,
    chrysanthineAccidentals: boolean,
  ) {
    const defaultFrequencyDi = 196;

    const defaultBpm = 120;

    const workspace: PlaybackWorkspace = {
      events: [],

      options: {
        useLegetos: false,
        useDefaultAttractionZo: true,
        frequencyDi: defaultFrequencyDi,
        speed: 1,

        diatonicIntervals: [12, 10, 8],
        hardChromaticIntervals: [6, 20, 4],
        softChromaticIntervals: [8, 14, 8],
        legetosIntervals: [8, 10, 12],
        zygosIntervals: [18, 4, 16, 4],
        zygosLegetosIntervals: [18, 4, 20, 4],
        spathiIntervals: [20, 4, 4, 14],
        klitonIntervals: [14, 12, 4],

        defaultAttractionZoMoria: -4,
        defaultAttractionKeMoria: 5,

        volumeIson: -4,
        volumeMelody: 0,

        alterationMultipliers: [0.5, 0.25, 0.75],

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

      frequency: defaultFrequencyDi,
      isonFrequency: 0,
      scale: this.diatonicScale,
      physicalNote: ScaleNote.Pa,
      legetos: false,
      chrysanthineAccidentals: chrysanthineAccidentals,

      transpositionMoria: 0,

      bpm: 0,
      beat: 0,

      ignoreAttractions: false,

      lastAlterationMoria: 0,
      lastAlterationNote: ScaleNote.Pa,

      permanentEnharmonicZo: false,

      zoFlatPivotActivated: false,
      zoNaturalPivotActivated: false,

      loggingEnabled: true,
    };

    Object.assign(workspace.options, options);

    this.constructScales(workspace);

    workspace.bpm = defaultBpm * workspace.options.speed;
    workspace.beat = this.beatLengthFromBpm(workspace.bpm);
    workspace.isonFrequency = 0;

    const nodes: AnalysisNode[] = AnalysisService.analyze(
      elements,
      chrysanthineAccidentals,
    );
    for (const node of nodes) {
      if (node.nodeType === NodeType.NoteAtomNode) {
        this.handleNoteAtom(node as NoteAtomNode, nodes, workspace);
      } else if (node.nodeType === NodeType.RestNode) {
        this.handleRest(node as RestNode, workspace);
      } else if (node.nodeType === NodeType.ModeKeyNode) {
        this.handleModeKey(node as ModeKeyNode, workspace);
      } else if (node.nodeType === NodeType.FthoraNode) {
        this.handleFthora(node as FthoraNode, workspace);
      } else if (node.nodeType === NodeType.IsonNode) {
        this.handleIson(node as IsonNode, workspace);
      } else if (node.nodeType === NodeType.TempoNode) {
        this.handleTempo(node as TempoNode, workspace);
      }
    }

    // Calculate times
    let time = 0;
    let absoluteTime = 0;
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

      event.absoluteTime = absoluteTime;
      absoluteTime += event.duration;
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

  moriaBetweenFrequencies(f1: number, f2: number) {
    return Math.round(72 * Math.log2(f2 / f1));
  }

  /**
   * To move up, move up scale.intervals[intervalIndex] moria
   * To move down, move down scale.intervals[intervalIndex - 1] moria,
   * wrapping around to the end of the scale.intervals array, if necessary
   */
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

  moveTo(scaleNote: ScaleNote, workspace: PlaybackWorkspace): number {
    const { scale } = workspace;

    const pivot = ScaleNote.Thi;

    const intervalIndex = scale.scaleNoteMap.get(pivot)!;

    const distance = getScaleNoteValue(scaleNote) - getScaleNoteValue(pivot);

    let moria = this.moriaBetweenNotes(
      intervalIndex,
      scale.intervals,
      distance,
    );

    moria += this.moriaBetweenNotes(
      this.diatonicScale.scaleNoteMap.get(ScaleNote.Thi)!,
      this.diatonicScale.intervals,
      getScaleNoteValue(pivot) - getScaleNoteValue(ScaleNote.Thi),
    );

    moria += workspace.transpositionMoria;

    return this.changeFrequency(workspace.options.frequencyDi, moria);
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

  constructEnharmonicScale(scale: Scale, workspace: PlaybackWorkspace) {
    if (scale === Scale.EnharmonicZo || scale === Scale.EnharmonicVou) {
      return this.constructTetrachordScale([12, 12, 6]);
    } else {
      return this.constructEnharmonicScaleFromGa(scale, workspace);
    }
  }

  constructEnharmonicScaleFromGa(scale: Scale, workspace: PlaybackWorkspace) {
    const result: number[] = [];

    if (scale === Scale.EnharmonicGa || scale === Scale.EnharmonicVouHigh) {
      return [12, 12, 6];
    }

    result.push(...workspace.options.diatonicIntervals);

    if (scale === Scale.EnharmonicZoHigh || workspace.permanentEnharmonicZo) {
      result.push(12, 12, 6, 12);
    } else {
      result.push(12, ...workspace.options.diatonicIntervals);
    }

    return result;
  }

  applyAlterations(
    noteAtomNode: Readonly<NoteAtomNode>,
    nodes: AnalysisNode[],
    workspace: PlaybackWorkspace,
  ) {
    let alteredFrequency = workspace.frequency;

    if (noteAtomNode.accidental) {
      let alteration = 0;
      if (workspace.chrysanthineAccidentals) {
        const moria = this.moriaBetweenNotes(
          workspace.scale.scaleNoteMap.get(noteAtomNode.virtualNote)!,
          workspace.scale.intervals,
          this.alterationMap.get(noteAtomNode.accidental)! < 0 ? -1 : 1,
        );
        switch (noteAtomNode.accidental) {
          case Accidental.Sharp_2_Left:
          case Accidental.Flat_2_Right:
            alteration = Math.round(
              moria * workspace.options.alterationMultipliers[0],
            );
            break;
          case Accidental.Sharp_4_Left:
          case Accidental.Flat_4_Right:
            alteration = Math.round(
              moria * workspace.options.alterationMultipliers[1],
            );
            break;
          case Accidental.Sharp_6_Left:
          case Accidental.Flat_6_Right:
            alteration = Math.round(
              moria * workspace.options.alterationMultipliers[2],
            );
            break;
          // Accidentals with three crossbeams are undefined in the Chrysanthine
          // system.
        }
      } else {
        alteration =
          workspace.options.alterationMoriaMap[noteAtomNode.accidental] ??
          this.alterationMap.get(noteAtomNode.accidental)!;
      }
      alteredFrequency = this.changeFrequency(alteredFrequency, alteration);

      workspace.lastAlterationMoria = alteration;
      workspace.lastAlterationNote = noteAtomNode.physicalNote;
    } else if (
      workspace.lastAlterationMoria !== 0 &&
      workspace.lastAlterationNote === noteAtomNode.physicalNote
    ) {
      alteredFrequency = this.changeFrequency(
        alteredFrequency,
        workspace.lastAlterationMoria,
      );
    }

    if (
      alteredFrequency === workspace.frequency &&
      !noteAtomNode.ignoreAttractions &&
      !workspace.ignoreAttractions
    ) {
      alteredFrequency = this.applyAttractions(
        alteredFrequency,
        noteAtomNode,
        nodes,
        workspace,
      );
    }

    return alteredFrequency;
  }

  applyAttractions(
    frequency: number,
    noteAtomNode: Readonly<NoteAtomNode>,
    nodes: AnalysisNode[],
    workspace: PlaybackWorkspace,
  ) {
    const { scale } = workspace;

    // If melody descends after zo, flatten zo
    if (
      workspace.options.useDefaultAttractionZo &&
      !workspace.permanentEnharmonicZo &&
      (scale.name === PlaybackScaleName.Diatonic ||
        scale.name === PlaybackScaleName.Kliton ||
        scale.name === PlaybackScaleName.Zygos)
    ) {
      if (noteAtomNode.virtualNote === ScaleNote.ZoHigh) {
        // If we are not in a pivot, check to see if we need to pivot
        if (!workspace.zoFlatPivotActivated) {
          this.setPivots(noteAtomNode, nodes, workspace);
        }

        // If we are in a pivot, then flatten zo
        if (workspace.zoFlatPivotActivated) {
          frequency = this.changeFrequency(
            frequency,
            workspace.options.defaultAttractionZoMoria,
          );
        }
      } else {
        // Clear zo flat pivot
        workspace.zoFlatPivotActivated = false;
      }

      // Check whether ke is attracted toward zo
      if (
        noteAtomNode.virtualNote === ScaleNote.Ke &&
        workspace.zoNaturalPivotActivated
      ) {
        frequency = this.changeFrequency(
          frequency,
          workspace.options.defaultAttractionKeMoria,
        );
      }

      // Clear the zo natural pivot if we descend below ke
      if (
        getScaleNoteValue(noteAtomNode.virtualNote) <
        getScaleNoteValue(ScaleNote.Ke)
      ) {
        workspace.zoNaturalPivotActivated = false;
      }
    }

    return frequency;
  }

  setPivots(
    noteAtomNode: Readonly<NoteAtomNode>,
    nodes: AnalysisNode[],
    workspace: PlaybackWorkspace,
  ) {
    const index: number = nodes.indexOf(noteAtomNode);

    for (let i = index + 1; i < nodes.length; i++) {
      const nextNoteAtomNode = nodes[i] as NoteAtomNode;

      const next: number = getScaleNoteValue(nextNoteAtomNode.virtualNote);

      if (next <= getScaleNoteValue(ScaleNote.Ke)) {
        workspace.zoFlatPivotActivated = true;
        workspace.zoNaturalPivotActivated = false;
        return;
      }

      // TODO this is too simplistic. Disabling for now.
      // if (next >= getScaleNoteValue(ScaleNote.ZoHigh)) {
      //   workspace.zoNaturalPivotActivated = true;
      // }

      if (next > getScaleNoteValue(ScaleNote.ZoHigh)) {
        return;
      }
    }
  }

  handleNoteAtom(
    noteAtomNode: Readonly<NoteAtomNode>,
    nodes: AnalysisNode[],
    workspace: PlaybackWorkspace,
  ) {
    const { events } = workspace;

    if (workspace.loggingEnabled) {
      console.groupCollapsed('PlaybackService', 'noteAtom');
      console.log('physicalNote', noteAtomNode.physicalNote);
      console.log('virtualNote', noteAtomNode.virtualNote);
      console.log('scale', noteAtomNode.scale);
      console.log('duration', noteAtomNode.duration);
      console.log('ignoreAttractions', noteAtomNode.ignoreAttractions);
      console.log('accidental', noteAtomNode.accidental);
      console.groupEnd();
    }

    workspace.frequency = this.moveTo(noteAtomNode.virtualNote, workspace);
    workspace.physicalNote = noteAtomNode.physicalNote;

    if (
      workspace.lastAlterationMoria !== 0 &&
      workspace.lastAlterationNote !== noteAtomNode.physicalNote
    ) {
      // Clear the last alteration as soon as we move away
      // from the altered note
      workspace.lastAlterationMoria = 0;
      workspace.lastAlterationNote = ScaleNote.Pa;
    }

    // Calculate accidentals
    const alteredFrequency = this.applyAlterations(
      noteAtomNode,
      nodes,
      workspace,
    );

    const event: PlaybackSequenceEvent = {
      frequency: alteredFrequency,
      isonFrequency: workspace.isonFrequency,
      type: 'note',
      bpm: workspace.bpm,
      duration: noteAtomNode.duration * workspace.beat,
      transportTime: 0,
      absoluteTime: 0,
      elementIndex: noteAtomNode.elementIndex,
    };

    events.push(event);
  }

  handleRest(restNode: Readonly<RestNode>, workspace: PlaybackWorkspace) {
    const { events } = workspace;

    if (workspace.loggingEnabled) {
      console.groupCollapsed('PlaybackService', 'rest');
      console.log('duration', restNode.duration);
      console.groupEnd();
    }

    const restEvent: PlaybackSequenceEvent = {
      type: 'rest',
      bpm: workspace.bpm,
      duration: restNode.duration * workspace.beat,
      transportTime: 0,
      absoluteTime: 0,
      elementIndex: restNode.elementIndex,
    };

    events.push(restEvent);
  }

  handleModeKey(
    modeKeyNode: Readonly<ModeKeyNode>,
    workspace: PlaybackWorkspace,
  ) {
    // Reset workspace flags
    workspace.legetos = modeKeyNode.legetos;
    workspace.lastAlterationMoria = 0;
    workspace.lastAlterationNote = ScaleNote.Pa;
    workspace.permanentEnharmonicZo = modeKeyNode.permanentEnharmonicZo;
    workspace.ignoreAttractions = modeKeyNode.ignoreAttractions;

    workspace.isonFrequency = 0;
    workspace.transpositionMoria = 0;

    workspace.scale = this.getPlaybackScale(modeKeyNode.scale, workspace);

    workspace.frequency = this.moveTo(modeKeyNode.virtualNote, workspace);
    workspace.physicalNote = modeKeyNode.physicalNote;
  }

  handleFthora(fthoraNode: Readonly<FthoraNode>, workspace: PlaybackWorkspace) {
    if (workspace.loggingEnabled) {
      console.groupCollapsed('PlaybackService', 'fthora');
      console.log('physicalNote', fthoraNode.physicalNote);
      console.log('virtualNote', fthoraNode.virtualNote);
      console.log('scale', fthoraNode.scale);
      console.groupEnd();
    }

    let physicalNote = fthoraNode.physicalNote;
    let virtualNote = fthoraNode.virtualNote;

    // In the case of the enharmonic fthora,
    // we must consider the the notes BEFORE the
    // the note is changed.
    if (
      fthoraNode.scale === Scale.EnharmonicZoHigh ||
      fthoraNode.scale === Scale.EnharmonicZo ||
      fthoraNode.scale === Scale.EnharmonicVou ||
      fthoraNode.scale === Scale.EnharmonicVouHigh
    ) {
      // Example: workspace is on THI and
      // EnharmonicZoHigh fthora is on KE, Virtual Note = Zo

      // Use the current physical note, BEFORE the jump
      // Ex: physical note = THI
      physicalNote = workspace.physicalNote;

      // Determine the distance between the current physical note
      // and the next physical note
      // Ex: enharmonic shift = THI - KE = -1
      const enharmonicShift =
        getScaleNoteValue(workspace.physicalNote) -
        getScaleNoteValue(fthoraNode.physicalNote);

      // The virtual note is the virtual note of the current physical note
      // in the new enharmonic scale
      // Ex: virtual note = ZO - 1 = KE
      virtualNote = getScaleNoteFromValue(
        getScaleNoteValue(fthoraNode.virtualNote) + enharmonicShift,
      );

      // Ex: So finally, we have physical note THI and virtual note KE,
      // and we are ready to move to physical note KE, virtual note ZO

      if (workspace.loggingEnabled) {
        console.group('handleFthora: enharmonic special case');
        console.log('physicalNote', physicalNote);
        console.log('virtualNote', virtualNote);
        console.log('enharmonicShift', enharmonicShift);
        console.groupEnd();
      }
    }

    const currentShift =
      getScaleNoteValue(virtualNote) - getScaleNoteValue(physicalNote);
    if (currentShift) {
      // Compute distance from the current frequency to the referecnce frequency of Di
      const moria = this.moriaBetweenFrequencies(
        workspace.options.frequencyDi,
        workspace.frequency,
      );
      if (workspace.loggingEnabled) {
        console.log(
          'Moria from physical note ' +
            physicalNote +
            ' to Di in the old scale',
          moria,
        );
      }

      // Scale change
      workspace.scale = this.getPlaybackScale(fthoraNode.scale, workspace);

      // Compute distance from Di to virtual note in the new scale
      const moria2 = this.moriaBetweenNotes(
        workspace.scale.scaleNoteMap.get(virtualNote)!,
        workspace.scale.intervals,
        getScaleNoteValue(ScaleNote.Thi) - getScaleNoteValue(virtualNote),
      );
      if (workspace.loggingEnabled) {
        console.log(
          'Moria from virtual note ' + virtualNote + ' to Di in the new scale',
          moria2,
        );
      }

      workspace.transpositionMoria = moria + moria2;
      if (workspace.loggingEnabled) {
        console.log('Entering transposition', workspace.transpositionMoria);
      }
    } else {
      workspace.scale = this.getPlaybackScale(fthoraNode.scale, workspace);

      const intervalIndex = workspace.scale.scaleNoteMap.get(
        workspace.physicalNote,
      )!;

      const distance =
        getScaleNoteValue(ScaleNote.Thi) -
        getScaleNoteValue(workspace.physicalNote);

      const moria = this.moriaBetweenNotes(
        intervalIndex,
        workspace.scale.intervals,
        distance,
      );

      console.log(distance, moria);

      const frequencyDiNew = this.changeFrequency(workspace.frequency, moria);

      workspace.transpositionMoria = this.moriaBetweenFrequencies(
        workspace.options.frequencyDi,
        frequencyDiNew,
      );

      if (workspace.loggingEnabled && workspace.transpositionMoria != 0) {
        console.log(
          'Moria from scale Di to refrence Di',
          workspace.transpositionMoria,
        );
      }
    }
  }

  getPlaybackScale(scale: Scale, workspace: PlaybackWorkspace): PlaybackScale {
    let playbackScale: PlaybackScale;

    switch (scale) {
      case Scale.Diatonic:
        playbackScale =
          workspace.options.useLegetos && workspace.legetos
            ? this.legetosScale
            : this.diatonicScale;
        break;
      case Scale.SoftChromatic:
        playbackScale = this.softChromaticScale;
        break;
      case Scale.HardChromatic:
        playbackScale = this.hardChromaticScale;
        break;
      case Scale.EnharmonicGa:
      case Scale.EnharmonicZo:
      case Scale.EnharmonicZoHigh:
      case Scale.EnharmonicVou:
      case Scale.EnharmonicVouHigh:
        playbackScale = this.enharmonicScale;
        break;
      case Scale.Zygos:
        playbackScale =
          workspace.options.useLegetos && workspace.legetos
            ? this.zygosLegetosScale
            : this.zygosScale;
        break;
      case Scale.Spathi:
        playbackScale = this.spathiKeScale;
        break;
      case Scale.SpathiGa:
        playbackScale = this.spathiGaScale;
        break;
      case Scale.Kliton:
        playbackScale = this.klitonScale;
        break;
    }

    if (workspace.permanentEnharmonicZo) {
      playbackScale = this.enharmonicScale;
    }

    if (playbackScale.name === PlaybackScaleName.Enharmonic) {
      this.enharmonicScale.intervals = this.constructEnharmonicScale(
        scale,
        workspace,
      );
      if (scale === Scale.EnharmonicZo || scale === Scale.EnharmonicVou) {
        this.enharmonicScale.scaleNoteMap =
          this.enharmonicZoScaleNoteToIntervalIndexMap;
      } else if (
        scale === Scale.EnharmonicGa ||
        scale === Scale.EnharmonicVouHigh
      ) {
        this.enharmonicScale.scaleNoteMap =
          this.enharmonicGaScaleNoteToIntervalIndexMap;
      } else {
        this.enharmonicScale.scaleNoteMap =
          this.diatonicScaleNoteToIntervalIndexMap;
      }
    }

    return playbackScale;
  }

  handleIson(isonNode: Readonly<IsonNode>, workspace: PlaybackWorkspace) {
    if (workspace.loggingEnabled) {
      console.groupCollapsed('PlaybackService', 'ison');
      if (isonNode.unison) {
        console.log('unison');
      } else {
        console.log('physicalNote', isonNode.physicalNote);
        console.log('virtualNote', isonNode.virtualNote);
      }
      console.groupEnd();
    }

    workspace.isonFrequency = -1;

    if (!isonNode.unison) {
      workspace.isonFrequency = this.moveTo(isonNode.virtualNote, workspace);
    }
  }

  handleTempo(tempoNode: Readonly<TempoNode>, workspace: PlaybackWorkspace) {
    if (workspace.loggingEnabled) {
      console.groupCollapsed('PlaybackService', 'tempo');
      console.log('bpm', tempoNode.bpm);
      console.groupEnd();
    }

    workspace.bpm = tempoNode.bpm * workspace.options.speed;
    workspace.beat = this.beatLengthFromBpm(workspace.bpm);
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

  /////////////////////////
  // Scales
  /////////////////////////

  diatonicScaleNoteToIntervalIndexMap: Map<ScaleNote, number> = new Map<
    ScaleNote,
    number
  >([
    [ScaleNote.ZoLow, 6],
    [ScaleNote.NiLow, 0],
    [ScaleNote.PaLow, 1],
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
    [ScaleNote.ZoLow, 1],
    [ScaleNote.NiLow, 2],
    [ScaleNote.PaLow, 3],
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
    [ScaleNote.ZoLow, 1],
    [ScaleNote.NiLow, 2],
    [ScaleNote.PaLow, 0],
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
  };

  hardChromaticScale: PlaybackScale = {
    name: PlaybackScaleName.HardChromatic,
    intervals: [6, 20, 4, 12],
    scaleNoteMap: new Map<ScaleNote, number>([
      [ScaleNote.ZoLow, 3],
      [ScaleNote.NiLow, 0],
      [ScaleNote.PaLow, 1],
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
  };

  softChromaticScale: PlaybackScale = {
    name: PlaybackScaleName.SoftChromatic,

    intervals: [8, 14, 8, 12],
    scaleNoteMap: new Map<ScaleNote, number>([
      [ScaleNote.ZoLow, 0],
      [ScaleNote.NiLow, 1],
      [ScaleNote.PaLow, 2],
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
  };

  legetosScale: PlaybackScale = {
    name: PlaybackScaleName.Legetos,
    intervals: [8, 10, 12, 12, 8, 10, 12],
    scaleNoteMap: new Map<ScaleNote, number>([
      [ScaleNote.ZoLow, 5],
      [ScaleNote.NiLow, 6],
      [ScaleNote.PaLow, 0],
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
  };

  zygosScale: PlaybackScale = {
    name: PlaybackScaleName.Zygos,
    intervals: [18, 4, 16, 4, 12, 10, 8],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  zygosLegetosScale: PlaybackScale = {
    name: PlaybackScaleName.ZygosLegetos,
    intervals: [18, 4, 20, 4, 12, 6, 9],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  klitonScale: PlaybackScale = {
    name: PlaybackScaleName.Kliton,
    intervals: [12, 14, 12, 4, 12, 10, 8],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  spathiKeScale: PlaybackScale = {
    name: PlaybackScaleName.SpathiKe,
    intervals: [12, 10, 8, 20, 4, 4, 14],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  spathiGaScale: PlaybackScale = {
    name: PlaybackScaleName.SpathiGa,
    intervals: [12, 14, 4, 4, 20, 10, 8],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  // The intervals of this scale are constructed dynamically
  enharmonicScale: PlaybackScale = {
    name: PlaybackScaleName.Enharmonic,
    intervals: [12, 12, 6, 12, 12, 12, 6],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };
}
