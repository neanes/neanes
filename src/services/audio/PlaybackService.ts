import type { ScoreElement } from '@/models/Element';
import { Accidental } from '@/models/Neumes';
import {
  getScaleNoteFromValue,
  getScaleNoteValue,
  Scale,
  ScaleNote,
} from '@/models/Scales';

import type {
  AnalysisNode,
  FthoraNode,
  IsonNode,
  ModeKeyNode,
  NoteAtomNode,
  RestNode,
  TempoNode,
} from './AnalysisService';
import { AnalysisService, NodeType } from './AnalysisService';

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
  useAgiaAttraction: boolean;

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

  agiaAttractionZoMoria: number;
  agiaAttractionKeMoria: number;

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
  virtualNote: ScaleNote;
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

  // debug
  loggingEnabled: boolean;
}

const KE_VALUE = getScaleNoteValue(ScaleNote.Ke);
const ZO_VALUE = getScaleNoteValue(ScaleNote.ZoHigh);
const NI_VALUE = getScaleNoteValue(ScaleNote.NiHigh);

/**
 * The maximum number of nodes that may be examined while deciding the
 * attraction of a single note. The attraction rules are not recursive, so this
 * only bounds how far a single scan looks; it is a performance cap, not a
 * correctness guard.
 */
const MAX_ATTRACTION_SCAN_NODES = 25;

/**
 * Where a scanned note sits relative to the zo/ke band. Ke, Zo' and Ni' are
 * consecutive scale degrees. Ni' -- zo's upper neighbor -- is tracked on its own
 * because it is zo's resolution: the melody counts as ascending past zo' only by
 * stepping into ni', not by leaping over it to pa' or higher ('above'). Likewise
 * 'below' is everything under ke. A sharpened ke is a leading tone up to zo', so
 * it shares ni's register. Every other note is one of the band notes ke/zo'.
 */
type Register = 'above' | 'below' | 'ke' | 'zo' | 'ni';

/**
 * A note encountered while scanning the melody to decide an attraction, reduced
 * to the facts the attraction rules care about: its index and its register.
 */
interface ScanNote {
  index: number;
  register: Register;
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
        useAgiaAttraction: true,
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

        agiaAttractionZoMoria: -4,
        agiaAttractionKeMoria: 5,

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
      physicalNote: ScaleNote.Thi,
      virtualNote: ScaleNote.Thi,
      legetos: false,
      chrysanthineAccidentals: chrysanthineAccidentals,

      transpositionMoria: 0,

      bpm: 0,
      beat: 0,

      ignoreAttractions: false,

      lastAlterationMoria: 0,
      lastAlterationNote: ScaleNote.Pa,

      permanentEnharmonicZo: false,

      loggingEnabled:
        import.meta.env.VITE_PLAYBACK_SERVICE_LOGGING_ENABLED === 'true',
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
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (node.nodeType === NodeType.NoteAtomNode) {
        this.handleNoteAtom(node as NoteAtomNode, nodes, i, workspace);
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

  moveTo(physicalNote: ScaleNote, workspace: PlaybackWorkspace): number {
    const { scale } = workspace;

    const intervalIndex = scale.scaleNoteMap.get(workspace.virtualNote)!;

    const distance =
      getScaleNoteValue(physicalNote) -
      getScaleNoteValue(workspace.physicalNote);

    const moria = this.moriaBetweenNotes(
      intervalIndex,
      scale.intervals,
      distance,
    );

    return this.changeFrequency(workspace.frequency, moria);
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
    nodeIndex: number,
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
        nodeIndex,
        workspace,
      );
    }

    return alteredFrequency;
  }

  applyAttractions(
    frequency: number,
    noteAtomNode: Readonly<NoteAtomNode>,
    nodes: AnalysisNode[],
    nodeIndex: number,
    workspace: PlaybackWorkspace,
  ) {
    const { scale } = workspace;

    // applyAlterations already gates on ignoreAttractions and on the frequency
    // being unaltered. Here we additionally require the feature to be enabled,
    // zo to not be permanently enharmonic, and both the workspace scale and the
    // note's own scale to be one that has the ke/zo' relationship. The
    // !accidental check is not redundant with the frequency-unchanged gate,
    // since an accidental can resolve to 0 moria.
    if (
      workspace.options.useAgiaAttraction &&
      !workspace.permanentEnharmonicZo &&
      (scale.name === PlaybackScaleName.Diatonic ||
        scale.name === PlaybackScaleName.Kliton ||
        scale.name === PlaybackScaleName.Zygos) &&
      !noteAtomNode.accidental &&
      (noteAtomNode.scale === Scale.Diatonic ||
        noteAtomNode.scale === Scale.Kliton ||
        noteAtomNode.scale === Scale.Zygos)
    ) {
      if (noteAtomNode.virtualNote === ScaleNote.ZoHigh) {
        if (this.zoIsFlattened(nodeIndex, nodes)) {
          frequency = this.changeFrequency(
            frequency,
            workspace.options.agiaAttractionZoMoria,
          );
        }
      } else if (noteAtomNode.virtualNote === ScaleNote.Ke) {
        if (this.keIsSharpened(nodeIndex, nodes)) {
          frequency = this.changeFrequency(
            frequency,
            workspace.options.agiaAttractionKeMoria,
          );
        }
      }
    }

    return frequency;
  }

  private register(node: NoteAtomNode): Register {
    const value = getScaleNoteValue(node.virtualNote);
    const sharp =
      node.accidental != null && node.accidental.startsWith('Sharp');

    // Ni' is zo's upper neighbor and resolution note. A sharpened ke is a leading
    // tone up to zo, so it resolves toward the same place and shares ni's register.
    if (value === NI_VALUE || (value === KE_VALUE && sharp)) {
      return 'ni';
    }
    // Anything strictly above ni' is reached from the band only by a leap.
    if (value > NI_VALUE) {
      return 'above';
    }
    if (value < KE_VALUE) {
      return 'below';
    }
    return value === ZO_VALUE ? 'zo' : 'ke';
  }

  /**
   * Walks the melody outward from `index` in the given direction, yielding each
   * note classified by its register. Non-notes (ison, tempo) are skipped, and
   * the scan stops at a phrase boundary (rest, fthora, mode key) or once the
   * lookahead cap is reached.
   */
  private *scan(
    nodes: AnalysisNode[],
    index: number,
    step: 1 | -1,
  ): Generator<ScanNote> {
    let remaining = MAX_ATTRACTION_SCAN_NODES;

    for (
      let i = index + step;
      i >= 0 && i < nodes.length && remaining > 0;
      i += step
    ) {
      remaining--;

      const node = nodes[i];

      if (
        node.nodeType === NodeType.RestNode ||
        node.nodeType === NodeType.FthoraNode ||
        node.nodeType === NodeType.ModeKeyNode
      ) {
        return;
      }

      if (node.nodeType === NodeType.NoteAtomNode) {
        yield { index: i, register: this.register(node as NoteAtomNode) };
      }
    }
  }

  /**
   * Zo is flattened when the melody settles on ke rather than ascending past zo'
   * into ni'. Attraction follows stepwise motion to a neighbor; a leap over a
   * neighbor does not count. There are two ways a zo flattens:
   *
   *  - It is an ascending peak: the melody climbed into the band from below and
   *    this zo steps straight back down to ke (see isAscendingPeak). Such a zo
   *    reads as a peak even when the line later recovers above zo, so it is flat.
   *
   *  - Looking forward, a step up into ni' settles it natural -- that is the only
   *    way to ascend past zo'. Leaving the band any other way -- down below ke, or
   *    by leaping up over ni' to pa' -- flattens it only if it had settled on ke
   *    on the way out (endedOnKe). A bare leap straight off zo' does not flatten
   *    it, and neither does a dip that recovers above the band.
   */
  private zoIsFlattened(index: number, nodes: AnalysisNode[]): boolean {
    if (this.isAscendingPeak(index, nodes)) {
      return true;
    }

    let endedOnKe = false;

    for (const n of this.scan(nodes, index, 1)) {
      // Stepping up into ni' is the only ascent past zo'; it stays natural.
      if (n.register === 'ni') {
        return false;
      }
      // Leaving the band otherwise -- down below ke, or by leaping up over ni' --
      // flattens zo only if the melody had settled on ke on its way out.
      if (n.register === 'above' || n.register === 'below') {
        return endedOnKe;
      }
      endedOnKe = n.register === 'ke';
    }

    return endedOnKe;
  }

  /**
   * A zo is an ascending peak when the melody climbs into the ke/zo band from
   * below and then steps straight back down -- the top of a rising-then-falling
   * arch. This is the approach the bare forward scan cannot see: a zo entered by
   * ascent that falls back is flat regardless of whether the line later climbs
   * past zo again, because that later climb is a separate gesture.
   *
   * The departure must step straight down to ke (a leap off zo' down past ke does
   * not flatten it) and, scanning back through the transparent band, the first
   * decisive note must be `below` -- entered by ascent. An `above` or `ni` note
   * instead means the band was entered from the upper register (ni-zo-ke-zo merely
   * ornaments a natural zo), which is not a peak.
   */
  private isAscendingPeak(index: number, nodes: AnalysisNode[]): boolean {
    const next = this.firstRegister(nodes, index, 1);

    if (next !== 'ke') {
      return false;
    }

    for (const n of this.scan(nodes, index, -1)) {
      if (n.register === 'above' || n.register === 'ni') {
        return false;
      }
      if (n.register === 'below') {
        return true;
      }
      // ke and zo are transparent: keep scanning back through the band.
    }

    return false;
  }

  private firstRegister(
    nodes: AnalysisNode[],
    index: number,
    step: 1 | -1,
  ): Register | undefined {
    for (const n of this.scan(nodes, index, step)) {
      return n.register;
    }

    return undefined;
  }

  private zoIsNatural(index: number, nodes: AnalysisNode[]): boolean {
    const node = nodes[index];

    if (node.nodeType !== NodeType.NoteAtomNode) {
      return false;
    }

    const noteNode = node as NoteAtomNode;

    // A note flagged to ignore attractions is played natural regardless of the
    // contour (applyAlterations gates the flattening on this flag), so it must
    // read as natural here too. Otherwise a neighboring ke that leads up to a
    // zo the user forced natural would wrongly fail to sharpen.
    return (
      noteNode.virtualNote === ScaleNote.ZoHigh &&
      !noteNode.accidental &&
      (noteNode.ignoreAttractions || !this.zoIsFlattened(index, nodes))
    );
  }

  /**
   * A ke is sharpened into a leading tone when it sits between a natural zo'
   * behind it and a return up into the zo'/ni' neighborhood ahead -- the melody
   * ornaments around zo' rather than resting on ke or leaping away past it.
   */
  private keIsSharpened(index: number, nodes: AnalysisNode[]): boolean {
    return (
      this.leadsToNaturalZo(nodes, index, -1) &&
      this.leadsToNaturalZo(nodes, index, 1)
    );
  }

  /**
   * Scans for the note that decides whether ke leads back toward a natural zo. A
   * note below ke breaks the line; a ke is passed over. Looking ahead, the line
   * leads back to zo only by stepping up into ni' (zo's neighbor); a leap on past
   * ni' to pa' overshoots and breaks the line. Looking behind, the upper register
   * is transparent and we must reach an actual natural zo, since that is the note
   * the ke leads back up to.
   */
  private leadsToNaturalZo(
    nodes: AnalysisNode[],
    index: number,
    step: 1 | -1,
  ): boolean {
    for (const n of this.scan(nodes, index, step)) {
      if (n.register === 'below') {
        return false;
      }
      if (n.register === 'ke') {
        continue;
      }
      if (n.register === 'ni' || n.register === 'above') {
        if (step === 1) {
          // Ahead, ke leads back to zo only by stepping up into ni'. A leap on
          // past ni' to pa' (an 'above' note) overshoots and does not.
          return n.register === 'ni';
        }
        continue;
      }
      return this.zoIsNatural(n.index, nodes); // 'zo'
    }

    return false;
  }

  handleNoteAtom(
    noteAtomNode: Readonly<NoteAtomNode>,
    nodes: AnalysisNode[],
    nodeIndex: number,
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

    workspace.frequency = this.moveTo(noteAtomNode.physicalNote, workspace);
    workspace.physicalNote = noteAtomNode.physicalNote;
    workspace.virtualNote = noteAtomNode.virtualNote;

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
      nodeIndex,
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
    if (workspace.loggingEnabled) {
      console.groupCollapsed('PlaybackService', 'mode key');
      console.log('physicalNote', modeKeyNode.physicalNote);
      console.log('virtualNote', modeKeyNode.virtualNote);
      console.log('scale', modeKeyNode.scale);
      console.log('skipScaleChange', modeKeyNode.skipScaleChange);
      console.groupEnd();
    }

    // Reset workspace flags
    workspace.legetos = modeKeyNode.legetos;
    workspace.lastAlterationMoria = 0;
    workspace.lastAlterationNote = ScaleNote.Pa;
    workspace.permanentEnharmonicZo = modeKeyNode.permanentEnharmonicZo;
    workspace.ignoreAttractions = modeKeyNode.ignoreAttractions;

    workspace.isonFrequency = 0;
    workspace.transpositionMoria = 0;

    if (!modeKeyNode.skipScaleChange) {
      workspace.scale = this.getPlaybackScale(modeKeyNode.scale, workspace);

      // Reset back to DI
      workspace.physicalNote = ScaleNote.Thi;
      workspace.virtualNote = ScaleNote.Thi;
      workspace.frequency = workspace.options.frequencyDi;

      // If the scale is Spathi, reset to KE or GA
      if (workspace.scale.name === PlaybackScaleName.SpathiKe) {
        workspace.physicalNote = ScaleNote.Ke;
        workspace.virtualNote = ScaleNote.Ke;

        const intervalIndex = this.diatonicScale.scaleNoteMap.get(
          ScaleNote.Thi,
        )!;

        const distance =
          getScaleNoteValue(ScaleNote.Ke) - getScaleNoteValue(ScaleNote.Thi);

        const moria = this.moriaBetweenNotes(
          intervalIndex,
          this.diatonicScale.intervals,
          distance,
        );

        workspace.frequency = this.changeFrequency(workspace.frequency, moria);
      } else if (workspace.scale.name === PlaybackScaleName.SpathiGa) {
        workspace.physicalNote = ScaleNote.Ga;
        workspace.virtualNote = ScaleNote.Ga;

        const intervalIndex = this.diatonicScale.scaleNoteMap.get(
          ScaleNote.Thi,
        )!;

        const distance =
          getScaleNoteValue(ScaleNote.Ga) - getScaleNoteValue(ScaleNote.Thi);

        const moria = this.moriaBetweenNotes(
          intervalIndex,
          this.diatonicScale.intervals,
          distance,
        );

        workspace.frequency = this.changeFrequency(workspace.frequency, moria);
      }

      // Move to the mode's starting note
      workspace.frequency = this.moveTo(modeKeyNode.physicalNote, workspace);

      workspace.physicalNote = modeKeyNode.physicalNote;
      workspace.virtualNote = modeKeyNode.virtualNote;
    }
  }

  handleFthora(fthoraNode: Readonly<FthoraNode>, workspace: PlaybackWorkspace) {
    if (workspace.loggingEnabled) {
      console.groupCollapsed('PlaybackService', 'fthora');
      console.log('physicalNote', fthoraNode.physicalNote);
      console.log('virtualNote', fthoraNode.virtualNote);
      console.log('scale', fthoraNode.scale);
      console.groupEnd();
    }

    const physicalNote = fthoraNode.physicalNote;
    const virtualNote = fthoraNode.virtualNote;

    const currentShift =
      getScaleNoteValue(virtualNote) - getScaleNoteValue(physicalNote);

    if (fthoraNode.physicalNote !== workspace.physicalNote) {
      const newScale = this.getPlaybackScale(fthoraNode.scale, workspace);
      const oldScale = workspace.scale;

      const distance =
        getScaleNoteValue(physicalNote) -
        getScaleNoteValue(workspace.physicalNote);

      const moria1 = this.moriaBetweenNotes(
        oldScale.scaleNoteMap.get(workspace.virtualNote)!,
        oldScale.intervals,
        distance,
      );

      const moria2 = this.moriaBetweenNotes(
        newScale.scaleNoteMap.get(
          getScaleNoteFromValue(
            getScaleNoteValue(workspace.physicalNote)! + currentShift,
          ),
        )!,
        newScale.intervals,
        distance,
      );

      if (moria1 === moria2 && oldScale.name !== newScale.name) {
        workspace.frequency = this.moveTo(fthoraNode.physicalNote, workspace);
      } else if (physicalNote != workspace.physicalNote) {
        // Reset to reference DI and move to current physical note in old scale
        workspace.frequency = workspace.options.frequencyDi;

        let pivot = ScaleNote.Thi;

        if (newScale.name === PlaybackScaleName.SpathiKe) {
          pivot = ScaleNote.Ke;

          const intervalIndex = this.diatonicScale.scaleNoteMap.get(
            ScaleNote.Thi,
          )!;

          const distance =
            getScaleNoteValue(ScaleNote.Ke) - getScaleNoteValue(ScaleNote.Thi);

          const moria = this.moriaBetweenNotes(
            intervalIndex,
            this.diatonicScale.intervals,
            distance,
          );

          workspace.frequency = this.changeFrequency(
            workspace.frequency,
            moria,
          );
        } else if (newScale.name === PlaybackScaleName.SpathiGa) {
          pivot = ScaleNote.Ga;
          const intervalIndex = this.diatonicScale.scaleNoteMap.get(
            ScaleNote.Thi,
          )!;

          const distance =
            getScaleNoteValue(ScaleNote.Ga) - getScaleNoteValue(ScaleNote.Thi);

          const moria = this.moriaBetweenNotes(
            intervalIndex,
            this.diatonicScale.intervals,
            distance,
          );

          workspace.frequency = this.changeFrequency(
            workspace.frequency,
            moria,
          );
        }

        const shiftedPivot = getScaleNoteFromValue(
          getScaleNoteValue(pivot) - currentShift,
        );

        workspace.physicalNote = pivot;
        workspace.virtualNote = pivot;
        workspace.scale = this.diatonicScale;
        workspace.frequency = this.moveTo(shiftedPivot, workspace);

        workspace.scale = newScale;
        workspace.physicalNote = shiftedPivot;
        workspace.virtualNote = pivot;
        workspace.frequency = this.moveTo(physicalNote, workspace);
      }
    }

    workspace.scale = this.getPlaybackScale(fthoraNode.scale, workspace);
    workspace.physicalNote = physicalNote;
    workspace.virtualNote = virtualNote;
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
      workspace.isonFrequency = this.moveTo(isonNode.physicalNote, workspace);
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
