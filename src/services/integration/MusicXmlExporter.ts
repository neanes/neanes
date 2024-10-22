import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
  TempoElement,
} from '@/models/Element';
import { QuantitativeNeume } from '@/models/Neumes';
import {
  getScaleNoteFromValue,
  getScaleNoteValue,
  Scale,
  ScaleNote,
} from '@/models/Scales';
import { Score } from '@/models/Score';

import {
  AnalysisNode,
  AnalysisService,
  FthoraNode,
  ModeKeyNode,
  NodeType,
  NoteAtomNode,
} from '../audio/AnalysisService';
import {
  MusicXmlAlter,
  MusicXmlAttributes,
  MusicXmlBarline,
  MusicXmlBarStyle,
  MusicXmlClef,
  MusicXmlDot,
  MusicXmlExtend,
  MusicXmlFifths,
  MusicXmlKey,
  MusicXmlKeyAlter,
  MusicXmlKeyOctave,
  MusicXmlKeyStep,
  MusicXmlLine,
  MusicXmlLyric,
  MusicXmlMeasure,
  MusicXmlNote,
  MusicXmlPitch,
  MusicXmlPrint,
  MusicXmlSign,
  MusicXmlSound,
  MusicXmlStepType,
  MusicXmlSyllabic,
  MusicXmlText,
} from './MusicXmlModel';

interface FindNodesOutput {
  results: AnalysisNode[];
  index: number;
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

class MusicXmlExporterWorkspace {
  nodes: AnalysisNode[] = [];
  zoFlatPivotActivated: boolean = false;
  zoNaturalPivotActivated: boolean = false;
  dropCap: string = '';
  isSyllabic: boolean = false;
  scale: PlaybackScale;
  physicalNote: ScaleNote = ScaleNote.Pa;
  pitch: MusicXmlPitch = new MusicXmlPitch('C', 4);
  transpositionSemitones: number = 0;

  lastAlteration: number = 0;
  lastAlterationNote: ScaleNote = ScaleNote.Pa;

  ignoreAttractions: boolean = false;
  permanentEnharmonicZo: boolean = false;
  legetos: boolean = false;
  useLegetos: boolean = false;

  constructor(scale: PlaybackScale) {
    this.scale = scale;
  }
}

type MusicXmlExporterLogLevel = 'none' | 'info' | 'debug' | 'trace';

export class MusicXmlExporter {
  pitchOfThi: number = 0;

  logLevel: MusicXmlExporterLogLevel = 'none';

  export(score: Score) {
    const workspace = new MusicXmlExporterWorkspace(this.diatonicScale);

    this.pitchOfThi = this.getAbsolutePitch(new MusicXmlPitch('G', 4));

    workspace.nodes = AnalysisService.analyze(
      score.staff.elements,
      score.pageSetup.chrysanthineAccidentals,
    );

    const measures = this.buildMeasures(score.staff.elements, workspace);

    let measureContents = '';

    measures.forEach((x) => (measureContents += x.toXml()));

    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    ${measureContents}
  </part>
</score-partwise>
`;

    return xml;
  }

  buildMeasures(
    elements: ScoreElement[],
    workspace: MusicXmlExporterWorkspace,
  ): MusicXmlMeasure[] {
    const measures: MusicXmlMeasure[] = [];

    let measureNumber = 1;
    let lastIndex = 0;

    let currentMeasure: MusicXmlMeasure | null = null;

    for (const element of elements) {
      const findResults = this.findNodes(
        workspace.nodes,
        element.index,
        lastIndex,
      );
      const nodeGroup = findResults.results;
      lastIndex = findResults.index;

      switch (element.elementType) {
        case ElementType.Note:
          // Make sure we have a measure.
          // We expect all scores to start with a mode key, so this
          // should never happen. But just in case...
          if (currentMeasure == null) {
            // Create a default measure.
            currentMeasure = new MusicXmlMeasure(measureNumber++);
            currentMeasure.attributes = new MusicXmlAttributes();
            currentMeasure.attributes.clef = new MusicXmlClef(
              new MusicXmlSign('G'),
              new MusicXmlLine(2),
            );
            measures.push(currentMeasure);
          }

          // Naively, we put as close to four notes in each measure as we can.
          // TODO if the score contains barlines, use those instead.
          if (
            currentMeasure.contents.filter((x) => x.tag === 'note').length >= 4
          ) {
            currentMeasure = new MusicXmlMeasure(measureNumber++);
            measures.push(currentMeasure);
          }

          // Build the note group
          const notes = this.buildNoteGroup(
            element as NoteElement,
            nodeGroup as NoteAtomNode[],
            workspace,
          );

          workspace.dropCap = '';

          currentMeasure.contents.push(...notes);
          break;
        case ElementType.ModeKey: {
          const modeKeyElement = element as ModeKeyElement;
          const modeKeyNode = nodeGroup[0] as ModeKeyNode;

          // End the current measure
          if (currentMeasure != null) {
            const barline = new MusicXmlBarline();
            barline.barStyle = new MusicXmlBarStyle('light-heavy');
            currentMeasure.contents.push(barline);
          }

          // Create a new measure
          currentMeasure = new MusicXmlMeasure(measureNumber++);
          measures.push(currentMeasure);

          // Add a system break
          const print = new MusicXmlPrint();
          print.newSystem.value = 'yes';
          currentMeasure.contents.push(print);

          // Set the key
          const key = this.buildKey(modeKeyNode);

          currentMeasure.attributes = new MusicXmlAttributes();
          currentMeasure.attributes.clef = new MusicXmlClef(
            new MusicXmlSign('G'),
            new MusicXmlLine(2),
          );
          currentMeasure.attributes.key = key;

          // Set the tempo
          const sound = new MusicXmlSound();
          sound.tempo = modeKeyElement.bpm;
          currentMeasure.contents.push(sound);

          // Reset workspace flags
          workspace.legetos = modeKeyNode.legetos;
          workspace.lastAlteration = 0;
          workspace.lastAlterationNote = ScaleNote.Pa;
          workspace.permanentEnharmonicZo = modeKeyNode.permanentEnharmonicZo;
          workspace.ignoreAttractions = modeKeyNode.ignoreAttractions;

          workspace.pitch = new MusicXmlPitch('G', 4);
          workspace.physicalNote = ScaleNote.Thi;

          if (modeKeyElement.fthora) {
            const fthoraNode = nodeGroup.find(
              (x) => x.nodeType === NodeType.FthoraNode,
            ) as FthoraNode;

            this.handleFthora(fthoraNode, workspace);
          } else {
            workspace.scale = this.getPlaybackScale(
              modeKeyNode.scale,
              workspace,
            );
          }

          break;
        }
        case ElementType.Martyria: {
          const martyriaElement = element as MartyriaElement;

          // Handle the fthora
          if (martyriaElement.fthora) {
            const fthoraNode = nodeGroup.find(
              (x) => x.nodeType === NodeType.FthoraNode,
            ) as FthoraNode;

            this.handleFthora(fthoraNode, workspace);
          }

          // Handle the tempo
          if (martyriaElement.tempo != null) {
            if (currentMeasure == null) {
              // Create a default measure.
              currentMeasure = new MusicXmlMeasure(measureNumber++);
              currentMeasure.attributes = new MusicXmlAttributes();
              currentMeasure.attributes.clef = new MusicXmlClef(
                new MusicXmlSign('G'),
                new MusicXmlLine(2),
              );
              measures.push(currentMeasure);
            }

            const sound = new MusicXmlSound();
            sound.tempo = martyriaElement.bpm;
            currentMeasure.contents.push(sound);
          }

          // If aligned right, treat this as the end of the system
          if (martyriaElement.alignRight) {
            // If the martyria is right aligned,
            // end the current measure
            if (currentMeasure != null) {
              const barline = new MusicXmlBarline();
              barline.barStyle = new MusicXmlBarStyle('light-light');
              currentMeasure.contents.push(barline);
            }

            // Create a new measure
            currentMeasure = new MusicXmlMeasure(measureNumber++);
            measures.push(currentMeasure);

            // Add a system break
            const print = new MusicXmlPrint();
            print.newSystem.value = 'yes';
            currentMeasure.contents.push(print);
          }
          break;
        }
        case ElementType.DropCap:
          const dropCapElement = element as DropCapElement;
          workspace.dropCap = dropCapElement.content;
          break;
        case ElementType.Tempo:
          const tempoElement = element as TempoElement;
          const sound = new MusicXmlSound();
          sound.tempo = tempoElement.bpm;

          // Make sure we have a measure.
          // We expect all scores to start with a mode key, so this
          // should never happen. But just in case...
          if (currentMeasure == null) {
            // Create a default measure.
            currentMeasure = new MusicXmlMeasure(measureNumber++);
            currentMeasure.attributes = new MusicXmlAttributes();
            currentMeasure.attributes.clef = new MusicXmlClef(
              new MusicXmlSign('G'),
              new MusicXmlLine(2),
            );
            measures.push(currentMeasure);
          }

          currentMeasure.contents.push(sound);
          break;
      }
    }

    // End the last measure
    if (currentMeasure != null) {
      // If the last measure is empty, and there is a measure before it,
      // remove the empty measure
      if (
        currentMeasure.contents.filter((x) => x.tag === 'note').length === 0 &&
        measures.length > 1
      ) {
        measures.pop();
        currentMeasure = measures[measures.length - 1];
      }

      const barline = new MusicXmlBarline();
      barline.barStyle = new MusicXmlBarStyle('light-heavy');
      currentMeasure.contents.push(barline);
    }

    return measures;
  }

  buildNoteGroup(
    noteElement: Readonly<NoteElement>,
    nodes: readonly AnalysisNode[],
    workspace: MusicXmlExporterWorkspace,
  ) {
    const notes: MusicXmlNote[] = [];

    let lyricsIndex = 0;

    if (
      noteElement.quantitativeNeume === QuantitativeNeume.RunningElaphron ||
      noteElement.quantitativeNeume ===
        QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata ||
      noteElement.quantitativeNeume ===
        QuantitativeNeume.PetastiPlusRunningElaphron
    ) {
      lyricsIndex = 1;
    }

    const noteNodes = nodes.filter((x) => x.nodeType === NodeType.NoteAtomNode);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      if (node.nodeType === NodeType.NoteAtomNode) {
        const noteNode = node as NoteAtomNode;
        const note = this.buildNote(noteNode, workspace);
        notes.push(note);

        if (
          !noteNode.accidental &&
          !noteNode.ignoreAttractions &&
          !workspace.ignoreAttractions
        ) {
          this.applyAttractions(noteNode, note, workspace);
        }

        if (
          noteNodes.indexOf(node) === lyricsIndex &&
          (noteElement.lyrics !== '' || workspace.dropCap !== '')
        ) {
          note.lyric = new MusicXmlLyric(
            new MusicXmlText(workspace.dropCap + noteElement.lyrics),
          );

          if (noteElement.isMelismaStart && noteElement.isHyphen) {
            note.lyric.syllabic = workspace.isSyllabic
              ? new MusicXmlSyllabic('middle')
              : new MusicXmlSyllabic('begin');
            workspace.isSyllabic = true;
          } else if (
            workspace.isSyllabic &&
            (!noteElement.isMelisma || noteElement.isMelismaStart)
          ) {
            note.lyric.syllabic = new MusicXmlSyllabic('end');
            workspace.isSyllabic = false;
          }

          // Write melisma extend if this is a non-hyphen melisma.
          // Note that this also applies if part of a multi-node neume.
          if (
            (noteElement.isMelisma || nodes.length > 1) &&
            !noteElement.isHyphen
          ) {
            note.lyric.extend = new MusicXmlExtend();
          }
        }
      } else if (node.nodeType === NodeType.FthoraNode) {
        const fthoraNode = node as FthoraNode;

        this.handleFthora(fthoraNode, workspace);
      }
      // TODO handle rests, ison
    }

    return notes;
  }

  buildNote(
    node: Readonly<NoteAtomNode>,
    workspace: MusicXmlExporterWorkspace,
  ): MusicXmlNote {
    const note = new MusicXmlNote(
      this.getPitch(node, workspace)!,
      node.duration,
      this.getType(node),
    );

    note.dot = this.getDot(node);

    return note;
  }

  buildKey(node: Readonly<ModeKeyNode>): MusicXmlKey {
    const key = new MusicXmlKey();

    if (node.scale === Scale.Diatonic) {
      key.fifths = new MusicXmlFifths(-1);
    } else if (node.scale === Scale.SoftChromatic) {
      key.fifths = new MusicXmlFifths(0);
    } else if (node.scale === Scale.HardChromatic) {
      key.stepsAndAlters.push(new MusicXmlKeyStep('B'));
      key.stepsAndAlters.push(new MusicXmlKeyAlter(-1));
      key.stepsAndAlters.push(new MusicXmlKeyStep('E'));
      key.stepsAndAlters.push(new MusicXmlKeyAlter(-1));
      key.stepsAndAlters.push(new MusicXmlKeyStep('F'));
      key.stepsAndAlters.push(new MusicXmlKeyAlter(1));
      key.stepsAndAlters.push(new MusicXmlKeyStep('C'));
      key.stepsAndAlters.push(new MusicXmlKeyAlter(1));
      key.octaves.push(new MusicXmlKeyOctave(1, 4));
      key.octaves.push(new MusicXmlKeyOctave(2, 5));
      key.octaves.push(new MusicXmlKeyOctave(3, 5));
      key.octaves.push(new MusicXmlKeyOctave(4, 5));
    }

    return key;
  }

  getPitch(
    node: NoteAtomNode,
    workspace: MusicXmlExporterWorkspace,
  ): MusicXmlPitch {
    const pitch = this.moveTo(node.physicalNote, node.virtualNote, workspace);

    const alter = this.getAlter(node);

    if (alter !== 0) {
      if (pitch.alter) {
        pitch.alter.content += alter;
      } else {
        pitch.alter = new MusicXmlAlter(alter);
      }

      workspace.lastAlteration = alter;
      workspace.lastAlterationNote = node.physicalNote;
    } else if (
      workspace.lastAlteration !== 0 &&
      workspace.lastAlterationNote === node.physicalNote
    ) {
      if (pitch.alter) {
        pitch.alter.content += workspace.lastAlteration;
      } else {
        pitch.alter = new MusicXmlAlter(workspace.lastAlteration);
      }
    } else if (
      workspace.lastAlteration !== 0 &&
      workspace.lastAlterationNote !== node.physicalNote
    ) {
      // Clear the last alteration as soon as we move away
      // from the altered note
      workspace.lastAlteration = 0;
      workspace.lastAlterationNote = ScaleNote.Pa;
    }

    return pitch;
  }

  getAlter(node: NoteAtomNode) {
    // We do not consider microtones here.
    if (node.accidental == null) {
      return 0;
    } else if (node.accidental.startsWith('Flat')) {
      return -1;
    } else if (node.accidental.startsWith('Sharp')) {
      return 1;
    }

    return 0;
  }

  handleFthora(node: FthoraNode, workspace: MusicXmlExporterWorkspace) {
    // const transposition =
    //   getScaleNoteValue(node.physicalNote) -
    //   getScaleNoteValue(node.virtualNote);

    let physicalNote = node.physicalNote;
    let virtualNote = node.virtualNote;

    // In the case of the enharmonic fthora,
    // we must consider the the notes BEFORE the
    // the note is changed.
    if (
      node.scale === Scale.EnharmonicZoHigh ||
      node.scale === Scale.EnharmonicZo ||
      node.scale === Scale.EnharmonicVou ||
      node.scale === Scale.EnharmonicVouHigh
    ) {
      physicalNote = workspace.physicalNote;

      const enharmonicShift =
        getScaleNoteValue(workspace.physicalNote) -
        getScaleNoteValue(node.physicalNote);
      virtualNote = getScaleNoteFromValue(
        getScaleNoteValue(node.virtualNote) + enharmonicShift,
      );

      if (this.logLevel === 'trace') {
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
      // Compute distance from physical note to Di in the old scale
      const semitones1 = this.semitonesBetweenNotes(
        workspace.scale.scaleNoteMap.get(ScaleNote.Thi)!,
        workspace.scale.intervals,
        getScaleNoteValue(physicalNote) - getScaleNoteValue(ScaleNote.Thi),
      );

      // Scale change
      workspace.scale = this.getPlaybackScale(node.scale, workspace);

      // Compute distance from Di to virtual note in the new scale
      const semitones2 = this.semitonesBetweenNotes(
        workspace.scale.scaleNoteMap.get(virtualNote)!,
        workspace.scale.intervals,
        getScaleNoteValue(ScaleNote.Thi) - getScaleNoteValue(virtualNote),
      );

      workspace.transpositionSemitones = semitones1 + semitones2;

      if (this.logLevel === 'debug') {
        console.log('Entering transposition', workspace.transpositionSemitones);
      }
    } else {
      workspace.scale = this.getPlaybackScale(node.scale, workspace);

      workspace.transpositionSemitones = 0;
    }
  }

  applyAttractions(
    node: NoteAtomNode,
    note: MusicXmlNote,
    workspace: MusicXmlExporterWorkspace,
  ) {
    // If melody descends after zo, flatten zo
    if (
      node.scale === Scale.Diatonic ||
      node.scale === Scale.Kliton ||
      node.scale === Scale.Zygos
    ) {
      if (node.virtualNote === ScaleNote.ZoHigh) {
        // If we are not in a pivot, check to see if we need to pivot
        if (!workspace.zoFlatPivotActivated) {
          this.setPivots(node, workspace);
        }

        // If we are in a pivot, then flatten zo
        if (workspace.zoFlatPivotActivated) {
          note.pitch.alter = new MusicXmlAlter(-1);
        }
      } else {
        // Clear zo flat pivot
        workspace.zoFlatPivotActivated = false;
      }

      // Check whether ke is attracted toward zo
      if (
        node.virtualNote === ScaleNote.Ke &&
        workspace.zoNaturalPivotActivated
      ) {
        note.pitch.alter = new MusicXmlAlter(1);
      }

      // Clear the zo natural pivot if we descend below ke
      if (
        getScaleNoteValue(node.virtualNote) < getScaleNoteValue(ScaleNote.Ke)
      ) {
        workspace.zoNaturalPivotActivated = false;
      }
    }
  }

  setPivots(
    noteAtomNode: Readonly<NoteAtomNode>,
    workspace: MusicXmlExporterWorkspace,
  ) {
    const index: number = workspace.nodes.indexOf(noteAtomNode);

    for (let i = index + 1; i < workspace.nodes.length; i++) {
      const nextNoteAtomNode = workspace.nodes[i] as NoteAtomNode;

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

  getType(node: NoteAtomNode) {
    let type = '';

    switch (node.duration) {
      case 0.25:
        type = '16th';
        break;
      case 0.5:
        type = 'eighth';
        break;
      case 1:
      case 1.5:
        type = 'quarter';
        break;
      case 2:
      case 3:
        type = 'half';
        break;
      case 4:
        type = 'whole';
        break;
      default:
        type = 'quarter';
    }

    return type;
  }

  getDot(node: NoteAtomNode) {
    const dots = [1.5, 3];

    return dots.includes(node.duration) ? new MusicXmlDot() : undefined;
  }

  findNodes(
    nodes: readonly AnalysisNode[],
    elementIndex: number,
    startIndex: number,
  ): FindNodesOutput {
    const results: AnalysisNode[] = [];

    let i = startIndex;

    for (i = startIndex; i < nodes.length; i++) {
      if (nodes[i].elementIndex === elementIndex) {
        results.push(nodes[i]);
      }

      if (nodes[i].elementIndex > elementIndex) {
        break;
      }
    }

    return { results, index: i };
  }

  getPlaybackScale(
    scale: Scale,
    workspace: MusicXmlExporterWorkspace,
  ): PlaybackScale {
    let playbackScale: PlaybackScale;

    switch (scale) {
      case Scale.Diatonic:
        playbackScale =
          workspace.useLegetos && workspace.legetos
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
          workspace.useLegetos && workspace.legetos
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

  /**
   * To move up, move up scale.intervals[intervalIndex] semitones
   * To move down, move down scale.intervals[intervalIndex - 1] semitones,
   * wrapping around to the end of the scale.intervals array, if necessary
   */
  semitonesBetweenNotes(
    intervalIndex: number,
    intervals: number[],
    distance: number,
  ) {
    let semitones = 0;

    const abs = Math.abs(distance);
    const sign = Math.sign(distance);

    for (let i = 0; i < abs; i++) {
      const index =
        sign > 0
          ? intervalIndex
          : this.mod(intervalIndex - 1, intervals.length);

      semitones += intervals[index] * sign;

      intervalIndex = this.mod(intervalIndex + sign, intervals.length);
    }

    return semitones;
  }

  mod(value: number, modulus: number) {
    return ((value % modulus) + modulus) % modulus;
  }

  moveTo(
    physicalNote: ScaleNote,
    virtualNote: ScaleNote,
    workspace: MusicXmlExporterWorkspace,
  ) {
    const { scale } = workspace;

    let pivot: ScaleNote;
    if (scale.name === PlaybackScaleName.SpathiGa) {
      pivot = ScaleNote.Ga;
    } else if (scale.name === PlaybackScaleName.SpathiKe) {
      pivot = ScaleNote.Ke;
    } else {
      pivot = ScaleNote.Thi;
    }

    const intervalIndex = scale.scaleNoteMap.get(pivot)!;

    const distance = getScaleNoteValue(virtualNote) - getScaleNoteValue(pivot);

    let semitones = this.semitonesBetweenNotes(
      intervalIndex,
      scale.intervals,
      distance,
    );

    semitones += this.semitonesBetweenNotes(
      this.diatonicScale.scaleNoteMap.get(ScaleNote.Thi)!,
      this.diatonicScale.intervals,
      getScaleNoteValue(pivot) - getScaleNoteValue(ScaleNote.Thi),
    );

    semitones += workspace.transpositionSemitones;

    const physicalDistance =
      getScaleNoteValue(physicalNote) -
      getScaleNoteValue(workspace.physicalNote);
    const currentPitch = workspace.pitch;

    const newAbsolutePitch = this.pitchOfThi + semitones;

    let currentStep = currentPitch.step;
    let currentOctave = currentPitch.octave;

    const direction = Math.sign(physicalDistance);

    for (let i = 0; i < Math.abs(physicalDistance); i++) {
      if (direction === 1 && currentStep === 'B') {
        currentOctave = currentOctave + 1;
      } else if (direction === -1 && currentStep === 'C') {
        currentOctave = currentOctave - 1;
      }

      currentStep =
        direction === 1
          ? this.getNextStep(currentStep)
          : this.getPreviousStep(currentStep);
    }

    const newPitch = new MusicXmlPitch(currentStep, currentOctave);

    const newAlter = newAbsolutePitch - this.getAbsolutePitch(newPitch);

    if (newAlter !== 0) {
      newPitch.alter = new MusicXmlAlter(newAlter);
    }

    workspace.pitch = newPitch;
    workspace.physicalNote = physicalNote;

    return newPitch.clone();
  }

  getAbsolutePitch(pitch: MusicXmlPitch) {
    const alter = pitch.alter?.content ?? 0;

    return this.stepToValueMap.get(pitch.step)! + pitch.octave * 12 + alter;
  }

  getNextStep(step: MusicXmlStepType) {
    switch (step) {
      case 'A':
        return 'B';
      case 'B':
        return 'C';
      case 'C':
        return 'D';
      case 'D':
        return 'E';
      case 'E':
        return 'F';
      case 'F':
        return 'G';
      case 'G':
        return 'A';
    }
  }

  getPreviousStep(step: MusicXmlStepType) {
    switch (step) {
      case 'A':
        return 'G';
      case 'G':
        return 'F';
      case 'F':
        return 'E';
      case 'E':
        return 'D';
      case 'D':
        return 'C';
      case 'C':
        return 'B';
      case 'B':
        return 'A';
    }
  }

  stepToValueMap = new Map<MusicXmlStepType, number>([
    ['C', 0],
    ['D', 2],
    ['E', 4],
    ['F', 5],
    ['G', 7],
    ['A', 9],
    ['B', 11],
  ]);

  constructTetrachordScale(intervals: number[]) {
    return [...intervals, 2];
  }

  constructEnharmonicScale(scale: Scale, workspace: MusicXmlExporterWorkspace) {
    if (scale === Scale.EnharmonicZo || scale === Scale.EnharmonicVou) {
      return this.constructTetrachordScale([2, 2, 1]);
    } else {
      return this.constructEnharmonicScaleFromGa(scale, workspace);
    }
  }

  constructEnharmonicScaleFromGa(
    scale: Scale,
    workspace: MusicXmlExporterWorkspace,
  ) {
    const result: number[] = [];

    if (scale === Scale.EnharmonicGa || scale === Scale.EnharmonicVouHigh) {
      return [2, 2, 1];
    }

    result.push(...[2, 2, 1]);

    if (scale === Scale.EnharmonicZoHigh || workspace.permanentEnharmonicZo) {
      result.push(2, 2, 1, 2);
    } else {
      result.push(2, ...[2, 2, 1]);
    }

    return result;
  }

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
    intervals: [2, 2, 1, 2, 2, 2, 1],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  hardChromaticScale: PlaybackScale = {
    name: PlaybackScaleName.HardChromatic,
    intervals: [1, 3, 1, 2],
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

    intervals: [2, 2, 1, 2],
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
    intervals: [1, 2, 2, 2, 1, 2, 2],
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
    intervals: [3, 1, 3, 1, 2, 2, 1],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  zygosLegetosScale: PlaybackScale = {
    name: PlaybackScaleName.ZygosLegetos,
    intervals: [3, 1, 3, 1, 2, 1, 1],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  klitonScale: PlaybackScale = {
    name: PlaybackScaleName.Kliton,
    intervals: [2, 2, 2, 1, 2, 2, 1],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  spathiKeScale: PlaybackScale = {
    name: PlaybackScaleName.SpathiKe,
    intervals: [2, 2, 1, 3, 1, 1, 2],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  spathiGaScale: PlaybackScale = {
    name: PlaybackScaleName.SpathiGa,
    intervals: [2, 2, 1, 1, 3, 2, 1],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  // The intervals of this scale are constructed dynamically
  enharmonicScale: PlaybackScale = {
    name: PlaybackScaleName.Enharmonic,
    intervals: [2, 2, 1, 2, 2, 2, 1],
    scaleNoteMap: this.diatonicScaleNoteToIntervalIndexMap,
  };

  /*
    <?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC
    "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>
*/
}
