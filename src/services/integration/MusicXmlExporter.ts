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
  TemporalNode,
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
  /**  Indicates whether we are processing a triplet */
  isTriplet: boolean = false;
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
              ((currentMeasure.notes.length >=
                workspace.options.measureLength &&
                !workspace.isTriplet) ||
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

        workspace.previousNote = note;
      } else if (node.nodeType === NodeType.FthoraNode) {
        const fthoraNode = node as FthoraNode;

        this.handleFthora(fthoraNode, workspace);
      } else if (node.nodeType === NodeType.RestNode) {
        const restNode = node as RestNode;

        const rest = this.buildRest(restNode);
        notes.push(rest);
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

  buildNote(
    node: Readonly<NoteAtomNode>,
    workspace: MusicXmlExporterWorkspace,
  ): MusicXmlNote {
    const duration = this.getDuration(node, workspace);

    const note = new MusicXmlNote(duration, this.getType(duration));

    note.pitch = this.getPitch(node, workspace);
    note.dot = this.getDot(node);

    return note;
  }

  buildRest(node: Readonly<RestNode>): MusicXmlNote {
    const note = new MusicXmlNote(node.duration, this.getType(node.duration));

    note.rest = new MusicXmlRest();
    note.dot = this.getDot(node);

    return note;
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

  getDuration(node: TemporalNode, workspace: MusicXmlExporterWorkspace) {
    const rounded = node.duration.toFixed(2);

    let duration = node.duration;

    // Digorgon is interpreted as 1/2 + 1/4 + 1/4
    // This is primarily because it is easier for singers to sight sing,
    // and is a convention used in St Anthony's Divine Music Project
    // TODO support true triplets as a configurable option

    switch (rounded) {
      case '0.33':
        duration = workspace.isTriplet ? 0.25 : 0.5;
        workspace.isTriplet = true;
        break;
      case '0.67':
        // Round dotted gorgon to eighth note
        duration = 0.5;
        break;
    }

    if (!rounded.endsWith('.33')) {
      workspace.isTriplet = false;
    }

    return duration;
  }

  getType(duration: number) {
    let type = '';

    switch (duration) {
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

  getDot(node: TemporalNode) {
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
