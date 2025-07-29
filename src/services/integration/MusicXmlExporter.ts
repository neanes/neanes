import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
  TempoElement,
} from '@/models/Element';
import { MeasureBar, QuantitativeNeume } from '@/models/Neumes';
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
  IsonNode,
  ModeKeyNode,
  NodeType,
  NoteAtomNode,
  RestNode,
} from '../audio/AnalysisService';
import {
  MusicXmlAlter,
  MusicXmlAttributes,
  MusicXmlBarline,
  MusicXmlBarStyle,
  MusicXmlBeats,
  MusicXmlBeatType,
  MusicXmlClef,
  MusicXmlDivisions,
  MusicXmlDot,
  MusicXmlExtend,
  MusicXmlFifths,
  MusicXmlHarmony,
  MusicXmlKey,
  MusicXmlKeyAlter,
  MusicXmlKeyOctave,
  MusicXmlKeyStep,
  MusicXmlKind,
  MusicXmlLine,
  MusicXmlLyric,
  MusicXmlMeasure,
  MusicXmlNote,
  MusicXmlPitch,
  MusicXmlPrint,
  MusicXmlRest,
  MusicXmlRoot,
  MusicXmlRootAlter,
  MusicXmlRootStep,
  MusicXmlSign,
  MusicXmlSlur,
  MusicXmlSound,
  MusicXmlStepType,
  MusicXmlSyllabic,
  MusicXmlText,
  MusicXmlTie,
  MusicXmlTied,
  MusicXmlTime,
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

export interface DottedNote {
  type: string;
  dots: 0 | 1 | 2 | 3;
  duration: number;
}

export class MusicXmlExporterOptions {
  /** The target measure length if no barlines are present */
  measureLength: number = 8;
  /** Indicates whether the MusicXML `<time>` element should be included in the measures. */
  calculateTimeSignatures: boolean = false;
  /** Indicates whether the time signature should be printed in each measure */
  displayTimeSignatures: boolean = false;
  /** Indicates whether subdivisions should be printed in each measure */
  displayMeasureSubdivisions: boolean = false;
  /** Indicates whether Vou should be extra flat in the legetos scale */
  useLegetos: boolean = false;
}

class MusicXmlExporterWorkspace {
  /////////////////
  // State: Static
  /////////////////

  /** The list of nodes for the entire score */
  nodes: AnalysisNode[] = [];

  /////////////////
  // State: Dynamic
  /////////////////

  /** Indicates whether ZO should be attracted toward KE in the current phrase */
  zoFlatPivotActivated: boolean = false;
  /** Indicates whether KE should be attracted toward ZO in the current phrase */
  zoNaturalPivotActivated: boolean = false;
  /**  Indicates whether we are processing a hyphenated, multi-syllable phrase */
  isSyllabic: boolean = false;
  /**  Indicates whether we are processing a non-hyphenated melismatic phrase */
  isMelismatic: boolean = false;
  /**  Indicates that the next note we encounter should be placed into a new measure */
  needNewMeasure: boolean = false;

  /** Keeps track of the last drop cap text so that it may be prepended to the next note's lyrics */
  dropCap: string = '';

  /** The current scale */
  scale: PlaybackScale;
  /** The current physical note */
  physicalNote: ScaleNote = ScaleNote.Pa;
  /** The current pitch */
  pitch: MusicXmlPitch = new MusicXmlPitch('C', 4);
  /** The previous MusicXML note that was created. */
  previousNote: MusicXmlNote | null = null;
  /** The number of semitones that we are transposed. That is, when the physical note and virtual note are different. */
  transpositionSemitones: number = 0;

  /** Indicates whether we should ignore attractions */
  ignoreAttractions: boolean = false;
  /** Indicates whether Zo should be permanently flattened */
  permanentEnharmonicZo: boolean = false;
  /** Indicates whether Vou should be extra flat in the legetos scale */
  legetos: boolean = false;

  /** The number of semitones in the last alteration */
  lastAlteration: number = 0;
  /** The last note that had an alteration applied to it */
  lastAlterationNote: ScaleNote = ScaleNote.Pa;

  // Options
  options: MusicXmlExporterOptions;

  constructor(scale: PlaybackScale, options: MusicXmlExporterOptions) {
    this.scale = scale;
    this.options = options;
  }
}

type MusicXmlExporterLogLevel = 'none' | 'info' | 'debug' | 'trace';

export class MusicXmlExporter {
  pitchOfThi: number = 0;

  logLevel: MusicXmlExporterLogLevel = 'none';

  epsilon: number = 1e-6;

  // base durations in beats
  noteTypes: Map<string, number> = new Map([
    ['maxima', 32.0],
    ['long', 16.0],
    ['breve', 8.0],
    ['whole', 4.0],
    ['half', 2.0],
    ['quarter', 1.0],
    ['eighth', 0.5],
    ['16th', 0.25],
    ['32nd', 0.125],
    ['64th', 0.0625],
    ['128th', 0.03125],
    ['256th', 0.015625],
    ['512th', 0.0078125],
    ['1024th', 0.00390625],
  ]);

  dottedNotes: DottedNote[] = [];

  constructor() {
    for (const [type, duration] of this.noteTypes.entries()) {
      for (let dots = 0; dots <= 3; dots++) {
        // sum = duration * (1 + 1/2 + 1/4 + ... up to dots)
        let factor = 0;
        for (let i = 0; i <= dots; i++) {
          factor += 1 / 2 ** i;
        }
        this.dottedNotes.push({
          type,
          dots: dots as 0 | 1 | 2 | 3,
          duration: duration * factor,
        });
      }
    }
    // sort descending by duration so we can do a simple greedy search
    this.dottedNotes.sort((a, b) => b.duration - a.duration);
  }

  export(score: Score, options: MusicXmlExporterOptions) {
    const workspace = new MusicXmlExporterWorkspace(
      this.diatonicScale,
      options,
    );

    this.pitchOfThi = this.getAbsolutePitch(new MusicXmlPitch('G', 4));

    workspace.nodes = AnalysisService.analyze(
      score.staff.elements,
      score.pageSetup.chrysanthineAccidentals,
    );

    // Quantize the score to sixteenth notes. Global quantization is necessarily
    // lossy, so in the future it would be desirable to implement a
    // context-aware analysis system that could perform accurate quantization of
    // specific formulae. It would also be desirable to allow the user to
    // disable quantization/analysis and get a score that uses triplets.
    this.quantize(workspace, 0.25);

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

    let currentMeasure: MusicXmlMeasure = new MusicXmlMeasure(measureNumber++);
    currentMeasure.attributes = new MusicXmlAttributes();
    currentMeasure.attributes.clef = new MusicXmlClef(
      new MusicXmlSign('G'),
      new MusicXmlLine(2),
    );
    currentMeasure.attributes.divisions = new MusicXmlDivisions(1);
    measures.push(currentMeasure);

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
          const noteElement = element as NoteElement;

          // Determine whether the left barline should be before the first or
          // second note in the group
          const leftBarIndex = [
            QuantitativeNeume.Hyporoe,
            QuantitativeNeume.OligonPlusHyporoe,
            QuantitativeNeume.OligonPlusHyporoePlusKentemata,
            QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
            QuantitativeNeume.PetastiPlusHyporoe,
            QuantitativeNeume.PetastiPlusRunningElaphron,
            QuantitativeNeume.RunningElaphron,
          ].includes(noteElement.quantitativeNeume)
            ? 1
            : 0;

          // Build the note group
          const notes = this.buildNoteGroup(
            element as NoteElement,
            nodeGroup as NoteAtomNode[],
            workspace,
          );

          workspace.dropCap = '';
          for (let i = 0; i < notes.length; i++) {
            if (
              i == leftBarIndex &&
              (currentMeasure.notes.length >= workspace.options.measureLength ||
                (noteElement.measureBarLeft != null &&
                  currentMeasure.notes.length > 0) ||
                (workspace.needNewMeasure && currentMeasure.notes.length > 0))
            ) {
              // Cut off the measure as close to the configured measureLength
              // option as we can. If a left barline is present, end the measure
              // before processing the current note.
              if (
                noteElement.measureBarLeft &&
                [
                  MeasureBar.MeasureBarTheseos,
                  MeasureBar.MeasureBarShortTheseos,
                  MeasureBar.MeasureBarTheseosAbove,
                  MeasureBar.MeasureBarShortTheseosAbove,
                ].includes(noteElement.measureBarLeft)
              ) {
                const barline = new MusicXmlBarline();
                barline.barStyle = new MusicXmlBarStyle(
                  workspace.options.displayMeasureSubdivisions
                    ? 'dashed'
                    : 'none',
                );
                currentMeasure.contents.push(barline);
              }
              currentMeasure = new MusicXmlMeasure(measureNumber++);
              measures.push(currentMeasure);
              workspace.needNewMeasure = false;
            }
            currentMeasure.contents.push(notes[i]);
          }

          // If a right barline is present, end the measure
          // before processing the next note
          if (noteElement.measureBarRight != null) {
            workspace.needNewMeasure = true;
          }
          break;
        case ElementType.ModeKey: {
          const modeKeyElement = element as ModeKeyElement;
          const modeKeyNode = nodeGroup[0] as ModeKeyNode;

          // End the current measure
          if (currentMeasure != null && currentMeasure.notes.length > 0) {
            const barline = new MusicXmlBarline();
            barline.barStyle = new MusicXmlBarStyle('light-heavy');
            currentMeasure.contents.push(barline);

            // Create a new measure
            this.finalizeMeasure(currentMeasure);
            currentMeasure = new MusicXmlMeasure(measureNumber++);
            measures.push(currentMeasure);

            // Add a system break
            const print = new MusicXmlPrint();
            print.newSystem.value = 'yes';
            currentMeasure.contents.push(print);
          }

          // Set the key
          const key = this.buildKey(modeKeyNode, modeKeyElement);

          currentMeasure.attributes =
            currentMeasure.attributes ?? new MusicXmlAttributes();
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

          // End the measure if barlines are present
          if (
            (martyriaElement.measureBarLeft != null ||
              martyriaElement.measureBarRight != null) &&
            currentMeasure != null &&
            currentMeasure.notes.length > 0
          ) {
            this.finalizeMeasure(currentMeasure);
            currentMeasure = new MusicXmlMeasure(measureNumber++);
            measures.push(currentMeasure);
          }

          // Handle the fthora
          if (martyriaElement.fthora) {
            const fthoraNode = nodeGroup.find(
              (x) => x.nodeType === NodeType.FthoraNode,
            ) as FthoraNode;

            this.handleFthora(fthoraNode, workspace);
          }

          // Handle the tempo
          if (martyriaElement.tempo != null) {
            const sound = new MusicXmlSound();
            sound.tempo = martyriaElement.bpm;
            currentMeasure.contents.push(sound);
          }

          // If aligned right, treat this as the end of the system
          if (martyriaElement.alignRight) {
            // If the martyria is right aligned,
            // end the current measure
            const barline = new MusicXmlBarline();
            barline.barStyle = new MusicXmlBarStyle('light-light');

            if (currentMeasure.notes.length > 0) {
              currentMeasure.contents.push(barline);

              // Create a new measure
              this.finalizeMeasure(currentMeasure);
              currentMeasure = new MusicXmlMeasure(measureNumber++);
              measures.push(currentMeasure);
            } else {
              const index = measures.indexOf(currentMeasure);
              if (index > 0) {
                measures[index - 1].contents.push(barline);
              }
            }

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
          currentMeasure.contents.push(sound);
          break;
      }
    }

    // End the last measure
    // If the last measure is empty, and there is a measure before it,
    // remove the empty measure
    if (currentMeasure.notes.length === 0 && measures.length > 1) {
      measures.pop();
      currentMeasure = measures[measures.length - 1];
    }

    const barline = new MusicXmlBarline();
    barline.barStyle = new MusicXmlBarStyle('light-heavy');
    currentMeasure.contents.push(barline);

    // Finalize time signatures
    if (workspace.options.calculateTimeSignatures) {
      let lastDuration = 0;

      const printObject = workspace.options.displayTimeSignatures
        ? 'yes'
        : 'no';

      for (const measure of measures) {
        measure.attributes = measure.attributes ?? new MusicXmlAttributes();

        let duration = 0;
        measure.notes.map((x) => (duration += x.duration));

        if (duration === lastDuration) {
          // Don't waste bytes duplicating the time signature
          // if it's the same as the previous measure.
          continue;
        }

        lastDuration = duration;

        if (duration % 1 === 0) {
          measure.attributes.time = new MusicXmlTime(
            new MusicXmlBeats(duration.toString()),
            new MusicXmlBeatType('4'),
          );
          measure.attributes.time.printObject = printObject;
        } else if ((duration * 2) % 1 === 0) {
          measure.attributes.time = new MusicXmlTime(
            new MusicXmlBeats((duration * 2).toString()),
            new MusicXmlBeatType('8'),
          );
          measure.attributes.time.printObject = printObject;
        } else if ((duration * 4) % 1 === 0) {
          measure.attributes.time = new MusicXmlTime(
            new MusicXmlBeats((duration * 4).toString()),
            new MusicXmlBeatType('16'),
          );
          measure.attributes.time.printObject = printObject;
        }

        // It is possible that a user could create a measure that ends with a partial triplet,
        // but we are not handling that case.
      }
    }

    return measures;
  }

  buildNoteGroup(
    noteElement: Readonly<NoteElement>,
    nodes: readonly AnalysisNode[],
    workspace: MusicXmlExporterWorkspace,
  ) {
    const notes: Array<MusicXmlNote | MusicXmlHarmony> = [];

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
        const builtNotes = this.buildNotes(noteNode, workspace);
        notes.push(...builtNotes);
        const note = builtNotes[0];

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

            note.addNotation(new MusicXmlSlur('start'));

            // If we are in the middle of multiple syllables
            // stop the previous slur
            if (workspace.isSyllabic) {
              workspace.previousNote!.addNotation(new MusicXmlSlur('stop'));
            }

            workspace.isSyllabic = true;
          } else if (
            workspace.isSyllabic &&
            (!noteElement.isMelisma || noteElement.isMelismaStart)
          ) {
            note.lyric.syllabic = new MusicXmlSyllabic('end');
            workspace.previousNote!.addNotation(new MusicXmlSlur('stop'));
            workspace.isSyllabic = false;
          }

          // End previous melismatic slurs
          if (
            workspace.isMelismatic &&
            (!noteElement.isMelisma || noteElement.isMelismaStart)
          ) {
            workspace.previousNote!.addNotation(new MusicXmlSlur('stop'));
            workspace.isMelismatic = false;
          }

          // Write melisma extend if this is a non-hyphen melisma.
          // Note that this also applies if part of a multi-node neume.
          if (
            (noteElement.isMelisma || nodes.length > 1) &&
            !noteElement.isHyphen
          ) {
            note.lyric.extend = new MusicXmlExtend();
            note.addNotation(new MusicXmlSlur('start'));
            workspace.isMelismatic = true;
          }
        }

        workspace.previousNote = builtNotes[builtNotes.length - 1];
      } else if (node.nodeType === NodeType.FthoraNode) {
        const fthoraNode = node as FthoraNode;

        this.handleFthora(fthoraNode, workspace);
      } else if (node.nodeType === NodeType.RestNode) {
        const restNode = node as RestNode;

        notes.push(...this.buildRests(restNode));
      } else if (node.nodeType === NodeType.IsonNode) {
        const isonNode = node as IsonNode;

        if (isonNode.unison) {
          const harmony = new MusicXmlHarmony(
            new MusicXmlRoot(new MusicXmlRootStep('C')),
            new MusicXmlKind('none', 'Un.'),
          );

          notes.push(harmony);
        } else {
          const isonPitch = this.moveTo(
            isonNode.physicalNote,
            isonNode.virtualNote,
            workspace,
          );

          const step = isonPitch.step;
          const alter = isonPitch.alter?.content ?? 0;

          const harmony = new MusicXmlHarmony(
            new MusicXmlRoot(
              new MusicXmlRootStep(step),
              alter !== 0 ? new MusicXmlRootAlter(alter) : undefined,
            ),
            new MusicXmlKind('major'),
          );

          notes.push(harmony);
        }
      }
    }

    return notes;
  }

  /**
   * Convert a (possibly fractional) beat count into the minimal list of tied
   * notes (with up to 3 dots) whose sum matches. This does not attempt to
   * order the tied notes in a manner that reflects the metrical structure of
   * the measure. It is expected that the caller will sort the results once
   * measure boundaries are established.
   */
  buildNotes(
    node: Readonly<NoteAtomNode>,
    workspace: MusicXmlExporterWorkspace,
  ): MusicXmlNote[] {
    let remaining = node.duration;
    const result: MusicXmlNote[] = [];

    while (remaining > this.epsilon) {
      // find the largest variant that fits in `remaining`
      const v = this.dottedNotes.find(
        (v) => v.duration <= remaining + this.epsilon,
      );
      if (!v) {
        throw new Error(
          `Cannot fit remainder ${remaining.toFixed(2)} into any note.`,
        );
      }

      // create a note
      const note = new MusicXmlNote(v.duration, v.type);
      note.pitch = this.getPitch(node, workspace);
      if (v.dots > 0) {
        note.dot = new MusicXmlDot(v.dots);
      }
      result.push(note);
      remaining -= v.duration;
    }

    for (let i = 0; i < result.length; i++) {
      // tie each pair of two notes together
      if (i < result.length - 1) {
        result[i].tie = new MusicXmlTie('start');
        result[i].addNotation(new MusicXmlTied('start'));
      }
      if (i > 0) {
        result[i].tie = new MusicXmlTie('stop');
        result[i].addNotation(new MusicXmlTied('stop'));
      }
    }

    return result;
  }

  /**
   * Break a possibly long rest into the minimal list of dotted rest notes that
   * sum to the total duration. This does not attempt to order the rests in a
   * manner that reflects the metrical structure of the measure. It is expected
   * that the caller will sort the results once measure boundaries are
   * established.
   */
  buildRests(node: Readonly<RestNode>): MusicXmlNote[] {
    let remaining = node.duration;
    const result: MusicXmlNote[] = [];

    while (remaining > this.epsilon) {
      // find the largest variant that fits in `remaining`
      const v = this.dottedNotes.find(
        (v) => v.duration <= remaining + this.epsilon,
      );
      if (!v) {
        throw new Error(
          `Cannot fit remainder ${remaining.toFixed(2)} into any rest.`,
        );
      }

      // create a rest
      const rest = new MusicXmlNote(v.duration, v.type);
      rest.rest = new MusicXmlRest();
      if (v.dots > 0) {
        rest.dot = new MusicXmlDot(v.dots);
      }
      result.push(rest);
      remaining -= v.duration;
    }

    return result;
  }

  finalizeMeasure(measure: MusicXmlMeasure): void {
    this.fixTiedNoteOrder(measure);
    this.fixRestOrder(measure);
  }

  fixTiedNoteOrder(measure: MusicXmlMeasure): void {
    // Compute each note’s offset from the start of the measure. offsets[i] is
    // the beat‐offset of measure.notes[i]
    const notes = measure.notes; // only MusicXmlNote entries, in content order
    const offsets: number[] = [];
    let acc = 0;
    for (const n of notes) {
      offsets.push(acc);
      acc += n.duration;
    }

    // scan for adjacent tie‐start/tie‐stop pairs
    for (let i = 0; i + 1 < notes.length; i++) {
      const n1 = notes[i];
      const n2 = notes[i + 1];
      if (n1.tie?.type === 'start' && n2.tie?.type === 'stop') {
        // if n1 does NOT begin on a whole‐beat boundary, we flip
        const frac = offsets[i] - Math.floor(offsets[i]);
        if (frac > this.epsilon) {
          this.swapTiePairInMeasure(measure, n1, n2);
          // advance past the pair so we don't re‐flip
          i++;
        }
      }
    }
  }

  /**
   * Given two MusicXmlNotes n1 (start) and n2 (stop), both present in
   * measure.contents, swap their positions in that array and swap their tie
   * markers so that the first one now has a "start" tie and the second a "stop"
   * tie.
   */
  swapTiePairInMeasure(
    measure: MusicXmlMeasure,
    originalStart: MusicXmlNote,
    originalStop: MusicXmlNote,
  ) {
    const c = measure.contents as any[]; // union of all content types

    // find their indexes in contents[]
    const idx1 = c.indexOf(originalStart);
    const idx2 = c.indexOf(originalStop);
    if (idx1 < 0 || idx2 < 0) {
      return; // should not happen
    }

    // swap them
    c[idx1] = originalStop;
    c[idx2] = originalStart;

    // now re‐assign ties:
    //   the note now at idx1 (originalStop) becomes the new start,
    //   the note now at idx2 (originalStart) becomes the new stop.
    const newStart = originalStop;
    const newStop = originalStart;

    // strip any existing <tied> notation from both
    for (const nn of [newStart, newStop]) {
      if (nn.notations) {
        nn.notations.contents = nn.notations.contents.filter(
          (x) => !(x instanceof MusicXmlTied),
        );
      }
    }

    // attach the correct <tie> and <tied> markers
    newStart.tie = new MusicXmlTie('start');
    newStart.addNotation(new MusicXmlTied('start'));
    newStop.tie = new MusicXmlTie('stop');
    newStop.addNotation(new MusicXmlTied('stop'));
  }

  fixRestOrder(measure: MusicXmlMeasure): void {
    // gather only the MusicXmlNotes (including rests), and their running offsets
    const notes = measure.notes;
    const offsets: number[] = [];
    let acc = 0;
    for (const n of notes) {
      offsets.push(acc);
      acc += n.duration;
    }

    // scan for adjacent rest‐pairs
    for (let i = 0; i + 1 < notes.length; i++) {
      const r1 = notes[i];
      const r2 = notes[i + 1];
      // both must be rests, and r1 longer than r2
      if (r1.rest && r2.rest && r1.duration > r2.duration) {
        // if r1 does NOT begin on an integer beat
        const frac = offsets[i] - Math.floor(offsets[i]);
        if (frac > this.epsilon) {
          this.swapRestPairInMeasure(measure, r1, r2);
          i++; // skip past the swapped pair
        }
      }
    }
  }

  /**
   * swap two rest‐notes in measure.contents
   */
  swapRestPairInMeasure(
    measure: MusicXmlMeasure,
    r1: MusicXmlNote,
    r2: MusicXmlNote,
  ): void {
    const c = measure.contents as any[];
    const i1 = c.indexOf(r1);
    const i2 = c.indexOf(r2);
    if (i1 < 0 || i2 < 0) {
      return;
    }
    // simple swap
    c[i1] = r2;
    c[i2] = r1;
  }

  buildKey(
    node: Readonly<ModeKeyNode>,
    modeKeyElement: Readonly<ModeKeyElement>,
  ): MusicXmlKey {
    const key = new MusicXmlKey();

    // First, we handle special cases by mode key ID
    let handled = false;

    if (
      modeKeyElement.templateId === 101 ||
      modeKeyElement.templateId === 501 ||
      modeKeyElement.templateId === 506
    ) {
      // First Papadic and Plagal First from Ke should not use Bb
      handled = true;
    } else if (modeKeyElement.templateId === 103) {
      // First Soft Chromatic
      // TODO optionally allow users to transpose down to G?
      key.fifths = new MusicXmlFifths(2);
      handled = true;
    } else if (modeKeyElement.templateId === 702) {
      // Enharmonic Grave from Zo uses Bb major
      key.fifths = new MusicXmlFifths(-2);
      handled = true;
    } else if (modeKeyElement.templateId === 804) {
      // Plagal Fourth from Pa uses D major scale
      key.fifths = new MusicXmlFifths(2);
      handled = true;
    }

    if (handled) {
      return key;
    }

    // Next we fall back to considering only the scale

    if (node.scale === Scale.Diatonic) {
      key.fifths = new MusicXmlFifths(-1);
    } else if (node.scale === Scale.SoftChromatic) {
      key.fifths = new MusicXmlFifths(0);
    } else if (node.scale === Scale.HardChromatic) {
      if (node.physicalNote === ScaleNote.Vou) {
        // Handle the special case for hard chromatic from vou
        key.stepsAndAlters.push(new MusicXmlKeyStep('G'));
        key.stepsAndAlters.push(new MusicXmlKeyAlter(1));
        key.stepsAndAlters.push(new MusicXmlKeyStep('D'));
        key.stepsAndAlters.push(new MusicXmlKeyAlter(1));
        key.octaves.push(new MusicXmlKeyOctave(1, 4));
        key.octaves.push(new MusicXmlKeyOctave(2, 5));
      } else {
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
    }

    return key;
  }

  getPitch(
    node: NoteAtomNode,
    workspace: MusicXmlExporterWorkspace,
  ): MusicXmlPitch {
    const pitch = this.movePitch(
      node.physicalNote,
      node.virtualNote,
      workspace,
    );

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
      // If Vou is notated as sharp, such as in the Third Mode,
      // render this as an E natural.
      if (
        node.virtualNote === ScaleNote.Vou ||
        node.virtualNote === ScaleNote.Zo
      ) {
        return 0;
      }
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
          note.pitch!.alter = new MusicXmlAlter(-1);
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
        note.pitch!.alter = new MusicXmlAlter(1);
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

  movePitch(
    physicalNote: ScaleNote,
    virtualNote: ScaleNote,
    workspace: MusicXmlExporterWorkspace,
  ) {
    const pitch = this.moveTo(physicalNote, virtualNote, workspace);
    workspace.pitch = pitch.clone();
    workspace.physicalNote = physicalNote;
    return pitch;
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

    return newPitch;
  }

  getAbsolutePitch(pitch: MusicXmlPitch) {
    const alter = pitch.alter?.content ?? 0;

    return this.stepToValueMap.get(pitch.step)! + pitch.octave * 12 + alter;
  }

  /**
   * Quantize a list of note‐durations (in quarter‐notes) to the nearest
   * sixteenth (step = 0.25), snapping ends upward so that we never go behind
   * the beat, and preserving the streamwise beat structure.
   */
  quantize(workspace: MusicXmlExporterWorkspace, step: number) {
    const nodes = workspace.nodes.filter(
      (x) => x.nodeType === NodeType.NoteAtomNode,
    ) as NoteAtomNode[];
    const durations = nodes.map((x) => x.duration);

    // build raw cumulative offsets in beats
    const rawOffsets = durations.reduce<number[]>(
      (offs, d) => {
        offs.push(offs[offs.length - 1] + d);
        return offs;
      },
      [0],
    );

    // snap each offset upward (Math.ceil) to the grid, using a small epsilon to
    // avoid float artifacts
    const gridOffsets = rawOffsets.map(
      (o) => Math.ceil((o - this.epsilon) / step) * step,
    );

    // take differences between successive snapped offsets
    const q: number[] = [];
    for (let i = 1; i < gridOffsets.length; i++) {
      // round off any tiny floating point residue
      q.push(+(gridOffsets[i] - gridOffsets[i - 1]).toFixed(2));
    }

    // save quantized durations
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].duration = q[i];
    }
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
    intervals: [3, 1, 2, 1, 2, 2, 1],
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
}
