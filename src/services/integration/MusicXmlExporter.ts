import {
  DropCapElement,
  ElementType,
  MartyriaElement,
  NoteElement,
  ScoreElement,
} from '@/models/Element';
import { QuantitativeNeume } from '@/models/Neumes';
import { getScaleNoteValue, Scale, ScaleNote } from '@/models/Scales';
import { Score } from '@/models/Score';

import {
  AnalysisNode,
  AnalysisService,
  ModeKeyNode,
  NoteAtomNode,
} from '../audio/AnalysisService';
import {
  MusicXmlAlter,
  MusicXmlAttributes,
  MusicXmlBarline,
  MusicXmlBarStyle,
  MusicXmlClef,
  MusicXmlExtend,
  MusicXmlFifths,
  MusicXmlKey,
  MusicXmlLine,
  MusicXmlLyric,
  MusicXmlMeasure,
  MusicXmlNote,
  MusicXmlPitch,
  MusicXmlPrint,
  MusicXmlSign,
  MusicXmlSyllabic,
  MusicXmlText,
} from './MusicXmlModel';

interface FindNodesOutput {
  results: AnalysisNode[];
  index: number;
}

class MusicXmlExporterWorkspace {
  nodes: AnalysisNode[] = [];
  zoFlatPivotActivated: boolean = false;
  zoNaturalPivotActivated: boolean = false;
  dropCap: string = '';
  isSyllabic: boolean = false;
}

export class MusicXmlExporter {
  export(score: Score) {
    const workspace = new MusicXmlExporterWorkspace();

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

          const notes = this.buildNoteGroup(
            element as NoteElement,
            nodeGroup as NoteAtomNode[],
            workspace,
          );

          workspace.dropCap = '';

          currentMeasure.contents.push(...notes);
          break;
        case ElementType.ModeKey: {
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
          const key = this.buildKey(nodeGroup[0] as ModeKeyNode);

          currentMeasure.attributes = new MusicXmlAttributes();
          currentMeasure.attributes.clef = new MusicXmlClef(
            new MusicXmlSign('G'),
            new MusicXmlLine(2),
          );
          currentMeasure.attributes.key = key;
          break;
        }
        case ElementType.Martyria: {
          const martyriaElement = element as MartyriaElement;
          // If the martyria is right aligned,
          if (martyriaElement.alignRight) {
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
      }

      // Naively, we put as close to four notes in each measure as we can.
      // TODO if the score contains barlines, use those instead.
      if (currentMeasure != null && currentMeasure.contents.length >= 4) {
        currentMeasure = new MusicXmlMeasure(measureNumber++);
        measures.push(currentMeasure);
      }
    }

    // End the last measure
    if (currentMeasure != null) {
      const barline = new MusicXmlBarline();
      barline.barStyle = new MusicXmlBarStyle('light-heavy');
      currentMeasure.contents.push(barline);
    }

    return measures;
  }

  buildNoteGroup(
    noteElement: Readonly<NoteElement>,
    nodes: readonly NoteAtomNode[],
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

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      const note = this.buildNote(node);
      notes.push(note);

      if (note.pitch.alter === undefined) {
        this.applyAttractions(node, note, workspace);
      }

      if (
        i === lyricsIndex &&
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
    }

    return notes;
  }

  buildNote(node: Readonly<NoteAtomNode>): MusicXmlNote {
    const note = new MusicXmlNote(
      this.getPitch(node)!,
      node.duration,
      this.getType(node),
    );

    return note;
  }

  buildKey(node: Readonly<ModeKeyNode>): MusicXmlKey {
    const key = new MusicXmlKey();

    if (node.scale === Scale.Diatonic) {
      key.fifths = new MusicXmlFifths(-1);
    } else if (node.scale === Scale.SoftChromatic) {
      key.fifths = new MusicXmlFifths(0);
    }

    return key;
  }

  getPitch(node: NoteAtomNode): MusicXmlPitch {
    // TODO this needs to take into account scales
    const pitch = this.scaleNoteToPitchMap.get(node.physicalNote)!;

    pitch.alter = this.getAlter(node);

    return pitch;
  }

  getAlter(node: NoteAtomNode): MusicXmlAlter | undefined {
    // We do not consider microtones here.
    if (node.accidental == null) {
      return undefined;
    } else if (node.accidental.startsWith('Flat')) {
      return new MusicXmlAlter(-1);
    } else if (node.accidental.startsWith('Sharp')) {
      return new MusicXmlAlter(1);
    }

    // TODO keep track of last alterations
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
      case 0.5:
        type = 'eighth';
        break;
      case 1:
        type = 'quarter';
        break;
      case 2:
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

  private scaleNoteToPitchMap: Map<ScaleNote, MusicXmlPitch> = new Map<
    ScaleNote,
    MusicXmlPitch
  >([
    [ScaleNote.ZoLow, new MusicXmlPitch('B', 2)],
    [ScaleNote.NiLow, new MusicXmlPitch('C', 3)],
    [ScaleNote.PaLow, new MusicXmlPitch('D', 3)],
    [ScaleNote.VouLow, new MusicXmlPitch('E', 3)],
    [ScaleNote.GaLow, new MusicXmlPitch('F', 3)],
    [ScaleNote.ThiLow, new MusicXmlPitch('G', 3)],
    [ScaleNote.KeLow, new MusicXmlPitch('A', 3)],
    [ScaleNote.Zo, new MusicXmlPitch('B', 3)],
    [ScaleNote.Ni, new MusicXmlPitch('C', 4)],
    [ScaleNote.Pa, new MusicXmlPitch('D', 4)],
    [ScaleNote.Vou, new MusicXmlPitch('E', 4)],
    [ScaleNote.Ga, new MusicXmlPitch('F', 4)],
    [ScaleNote.Thi, new MusicXmlPitch('G', 4)],
    [ScaleNote.Ke, new MusicXmlPitch('A', 4)],
    [ScaleNote.ZoHigh, new MusicXmlPitch('B', 4)],
    [ScaleNote.NiHigh, new MusicXmlPitch('C', 5)],
    [ScaleNote.PaHigh, new MusicXmlPitch('D', 5)],
    [ScaleNote.VouHigh, new MusicXmlPitch('E', 5)],
    [ScaleNote.GaHigh, new MusicXmlPitch('F', 5)],
    [ScaleNote.ThiHigh, new MusicXmlPitch('G', 5)],
    [ScaleNote.KeHigh, new MusicXmlPitch('A', 5)],
  ]);

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
