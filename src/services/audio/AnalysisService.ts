import {
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
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
  getScaleNoteFromValue,
  getScaleNoteValue,
  getShiftWithoutFthora,
  Scale,
  ScaleNote,
} from '@/models/Scales';

import { LayoutService } from '../LayoutService';

export interface AnalysisNode {
  nodeType: NodeType;
  elementIndex: number;
}

export interface PitchNode extends AnalysisNode {
  physicalNote: ScaleNote;
  virtualNote: ScaleNote;
  scale: Scale;
}

export interface TemporalNode extends AnalysisNode {
  duration: number;
}

export enum NodeType {
  NoteAtomNode = 'NoteAtomNode',
  RestNode = 'RestNode',
  ModeKeyNode = 'ModeKeyNode',
  FthoraNode = 'FthoraNode',
  IsonNode = 'IsonNode',
  TempoNode = 'TempoNode',
}

export class NoteAtomNode implements PitchNode, TemporalNode {
  public readonly nodeType: NodeType = NodeType.NoteAtomNode;
  public elementIndex: number = 0;
  public physicalNote: ScaleNote = ScaleNote.Pa;
  public virtualNote: ScaleNote = ScaleNote.Pa;
  public scale: Scale = Scale.Diatonic;
  public duration: number = 0;
  public ignoreAttractions: boolean = false;
  public accidental: Accidental | null = null;
}

export class RestNode implements TemporalNode {
  public readonly nodeType: NodeType = NodeType.RestNode;
  public elementIndex: number = 0;
  public duration: number = 0;
}

export class ModeKeyNode implements PitchNode {
  public readonly nodeType: NodeType = NodeType.ModeKeyNode;
  public elementIndex: number = 0;
  public physicalNote: ScaleNote = ScaleNote.Pa;
  public virtualNote: ScaleNote = ScaleNote.Pa;
  public scale: Scale = Scale.Diatonic;
  public ignoreAttractions: boolean = false;
  public permanentEnharmonicZo: boolean = false;
  public legetos: boolean = false;
}

export class FthoraNode implements PitchNode {
  public readonly nodeType: NodeType = NodeType.FthoraNode;
  public elementIndex: number = 0;
  public physicalNote: ScaleNote = ScaleNote.Pa;
  public virtualNote: ScaleNote = ScaleNote.Pa;
  public scale: Scale = Scale.Diatonic;
  public fthora: Fthora = Fthora.DiatonicPa_Top;
  public chromaticFthoraNote: ScaleNote | null = null;
}

export class IsonNode implements AnalysisNode {
  public readonly nodeType: NodeType = NodeType.IsonNode;
  public elementIndex: number = 0;
  public physicalNote: ScaleNote = ScaleNote.Pa;
  public virtualNote: ScaleNote = ScaleNote.Pa;
  public unison: boolean = false;
}

export class TempoNode implements AnalysisNode {
  public readonly nodeType: NodeType = NodeType.TempoNode;
  public elementIndex: number = 0;
  public bpm: number = 0;
}

interface AnalysisWorkspace {
  nodes: AnalysisNode[];
  gorgonIndexes: GorgonIndex[];

  currentNote: number;
  currentScale: Scale;
  currentShift: number;

  generalFlat: boolean;
  generalSharp: boolean;

  chrysanthineAccidentals: boolean;
}

interface GorgonIndex {
  index: number;
  neume: GorgonNeume;
}

export class AnalysisService {
  public static analyze(
    elements: ScoreElement[],
    chrysanthineAccidentals: boolean,
  ): AnalysisNode[] {
    const workspace: AnalysisWorkspace = {
      nodes: [],
      gorgonIndexes: [],

      currentNote: 0,
      currentScale: Scale.Diatonic,
      currentShift: 0,

      generalFlat: false,
      generalSharp: false,

      chrysanthineAccidentals: chrysanthineAccidentals,
    };

    for (const element of elements) {
      if (element.elementType === ElementType.Note) {
        this.handleNote(element as NoteElement, workspace);
      } else if (element.elementType === ElementType.ModeKey) {
        this.handleModeKey(element as ModeKeyElement, workspace);
      } else if (
        element.elementType === ElementType.RichTextBox &&
        (element as RichTextBoxElement).modeChange
      ) {
        this.handleRichTextBoxAsModeKey(
          element as RichTextBoxElement,
          workspace,
        );
      } else if (element.elementType === ElementType.Martyria) {
        this.handleMartyria(element as MartyriaElement, workspace);
      } else if (element.elementType === ElementType.Tempo) {
        this.handleTempo(element as TempoElement, workspace);
      }
    }

    this.processGorgons(workspace.nodes, workspace.gorgonIndexes);

    return workspace.nodes;
  }

  private static handleNote(
    noteElement: Readonly<NoteElement>,
    workspace: AnalysisWorkspace,
  ) {
    workspace.currentNote += getNeumeValue(noteElement.quantitativeNeume)!;
    const noteSpread: number[] = getNoteSpread(noteElement.quantitativeNeume);
    const currentNotes: number[] = noteSpread.map(
      (x) => workspace.currentNote + x,
    );

    // Create the note atom nodes for each note atom in the spread, but do not
    // append them to the node list until we determine how they should be
    // interleaved with other nodes.
    const noteAtomNodes = currentNotes.map((x, index) => {
      const noteAtomNode: NoteAtomNode = new NoteAtomNode();
      noteAtomNode.elementIndex = noteElement.index;
      noteAtomNode.physicalNote = getScaleNoteFromValue(x);
      noteAtomNode.duration = 1;
      if (noteElement.timeNeume && index === noteSpread.length - 1) {
        noteAtomNode.duration += timeMap.get(noteElement.timeNeume)!;
      }
      if (noteElement.koronis && index === noteSpread.length - 1) {
        noteAtomNode.duration *= 2;
      }
      noteAtomNode.ignoreAttractions = noteElement.ignoreAttractions;
      return noteAtomNode;
    });

    switch (noteElement.quantitativeNeume) {
      case QuantitativeNeume.OligonPlusHamiliPlusKentemata:
      case QuantitativeNeume.OligonPlusIsonPlusKentemata:
      case QuantitativeNeume.OligonPlusElaphronPlusKentemata:
      case QuantitativeNeume.OligonPlusApostrophosPlusKentemata:
      case QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata:
      case QuantitativeNeume.OligonKentimaMiddleKentimata:
      case QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft:
      case QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight:
      case QuantitativeNeume.OligonPlusKentemata:
        this.handleKentemataCombo(noteElement, noteAtomNodes, workspace);
        break;
      case QuantitativeNeume.KentemataPlusOligon:
        this.handleKentemataOligon(noteElement, noteAtomNodes, workspace);
        break;
      case QuantitativeNeume.Hyporoe:
      case QuantitativeNeume.PetastiPlusHyporoe:
      case QuantitativeNeume.OligonPlusHyporoe:
        this.handleHyporoe(noteElement, noteAtomNodes, workspace);
        break;
      case QuantitativeNeume.DoubleApostrophos:
      case QuantitativeNeume.IsonPlusApostrophos:
        this.handleApostrophosCombo(noteElement, noteAtomNodes, workspace);
        break;
      case QuantitativeNeume.RunningElaphron:
      case QuantitativeNeume.PetastiPlusRunningElaphron:
        this.handleRunningElaphron(noteElement, noteAtomNodes, workspace);
        break;
      case QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata:
        this.handleRunningElaphronKentemata(
          noteElement,
          noteAtomNodes,
          workspace,
        );
        break;
      case QuantitativeNeume.OligonPlusHyporoePlusKentemata:
        this.handleHyporoeKentemata(noteElement, noteAtomNodes, workspace);
        break;
      case QuantitativeNeume.Breath:
      case QuantitativeNeume.Cross:
      case QuantitativeNeume.VareiaDotted:
      case QuantitativeNeume.VareiaDotted2:
      case QuantitativeNeume.VareiaDotted3:
      case QuantitativeNeume.VareiaDotted4:
        this.handleRest(noteElement, workspace);
        break;
      default:
        this.handleDefault(noteElement, noteAtomNodes, workspace);
        break;
    }
  }

  private static handleKentemataCombo(
    noteElement: Readonly<NoteElement>,
    noteAtomNodes: NoteAtomNode[],
    workspace: AnalysisWorkspace,
  ) {
    // Note that this function does not contain the following special cases:
    //   - OligonPlusHyporoePlusKentemata
    //   - OligonPlusRunningElaphronPlusKentemata
    //   - KentemataPlusOligon
    // These are handled separately.
    if (noteAtomNodes.length !== 2) {
      throw new Error('Unexpected length: ' + noteAtomNodes.length);
    }

    // Sharp applies to the first note of the spread
    if (noteElement.accidental && noteElement.accidental.startsWith('Sharp')) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Secondary accidental applies to the first note of the spread
    if (noteElement.secondaryAccidental) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.secondaryAccidental,
      );
    }
    // Bottom fthora applies to the first note of the spread
    if (noteElement.fthora && noteElement.fthora.endsWith('_Bottom')) {
      this.handleFthora(
        noteAtomNodes[0].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Secondary fthora applies to the first note of the spread
    if (noteElement.secondaryFthora) {
      this.handleFthora(
        noteAtomNodes[0].physicalNote,
        noteElement.secondaryFthora,
        noteElement.secondaryChromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Ison applies to the first note of the spread
    this.handleIson(noteElement, workspace);

    // Secondary gorgon applies to the first note of the spread
    if (noteElement.secondaryGorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.secondaryGorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[0], workspace);

    // Flat applies to the second note of the spread
    if (noteElement.accidental && noteElement.accidental.startsWith('Flat')) {
      noteAtomNodes[1].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Top fthora applies to the second note of the spread
    if (noteElement.fthora && noteElement.fthora.endsWith('_Top')) {
      this.handleFthora(
        noteAtomNodes[1].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Gorgon applies to the kentemata
    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[1], workspace);
  }

  private static handleKentemataOligon(
    noteElement: Readonly<NoteElement>,
    noteAtomNodes: NoteAtomNode[],
    workspace: AnalysisWorkspace,
  ) {
    if (noteAtomNodes.length !== 2) {
      throw new Error('Unexpected length: ' + noteAtomNodes.length);
    }

    // Sharp applies to the kentemata
    if (noteElement.accidental && noteElement.accidental.startsWith('Sharp')) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Secondary flat applies to the kentemata
    if (
      noteElement.secondaryAccidental &&
      noteElement.secondaryAccidental.startsWith('Flat')
    ) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.secondaryAccidental,
      );
    }
    // Gorgon applies to the kentemata
    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[0], workspace);

    // Flat applies to the oligon
    if (noteElement.accidental && noteElement.accidental.startsWith('Flat')) {
      noteAtomNodes[1].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Secondary sharp applies to the oligon
    if (
      noteElement.secondaryAccidental &&
      noteElement.secondaryAccidental.startsWith('Sharp')
    ) {
      noteAtomNodes[1].accidental = this.normalizeAccidental(
        noteElement.secondaryAccidental,
      );
    }
    // Fthora applies to the oligon
    if (noteElement.fthora) {
      this.handleFthora(
        noteAtomNodes[1].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Ison applies to the oligon
    this.handleIson(noteElement, workspace);

    this.finalizeNoteAtomNode(noteAtomNodes[1], workspace);
  }

  private static handleHyporoe(
    noteElement: Readonly<NoteElement>,
    noteAtomNodes: NoteAtomNode[],
    workspace: AnalysisWorkspace,
  ) {
    if (noteAtomNodes.length !== 2) {
      throw new Error('Unexpected length: ' + noteAtomNodes.length);
    }

    // Flat applies to the first note of the spread
    if (noteElement.accidental && noteElement.accidental.startsWith('Flat')) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Secondary sharp applies to the first note of the spread
    if (
      noteElement.secondaryAccidental &&
      noteElement.secondaryAccidental.startsWith('Sharp')
    ) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.secondaryAccidental,
      );
    }
    // Top fthora applies to the first note of the spread
    if (noteElement.fthora && noteElement.fthora.endsWith('_Top')) {
      this.handleFthora(
        noteAtomNodes[0].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Gorgon applies to the first note of the spread
    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[0], workspace);

    // Sharp applies to the second note of the spread
    if (noteElement.accidental && noteElement.accidental.startsWith('Sharp')) {
      noteAtomNodes[1].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Secondary flat applies to the second note of the spread
    if (
      noteElement.secondaryAccidental &&
      noteElement.secondaryAccidental.startsWith('Flat')
    ) {
      noteAtomNodes[1].accidental = this.normalizeAccidental(
        noteElement.secondaryAccidental,
      );
    }
    // Bottom fthora applies to the second note of the spread
    if (noteElement.fthora && noteElement.fthora.endsWith('_Bottom')) {
      this.handleFthora(
        noteAtomNodes[1].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Ison applies to the second note of the spread
    this.handleIson(noteElement, workspace);

    this.finalizeNoteAtomNode(noteAtomNodes[1], workspace);
  }

  private static handleApostrophosCombo(
    noteElement: Readonly<NoteElement>,
    noteAtomNodes: NoteAtomNode[],
    workspace: AnalysisWorkspace,
  ) {
    if (noteAtomNodes.length !== 2) {
      throw new Error('Unexpected length: ' + noteAtomNodes.length);
    }

    // Sharp applies to the first note of the spread
    if (noteElement.accidental && noteElement.accidental.startsWith('Sharp')) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Fthora applies to the first note of the spread
    if (noteElement.fthora) {
      this.handleFthora(
        noteAtomNodes[0].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Ison applies to the first note of the spread
    this.handleIson(noteElement, workspace);

    // Secondary gorgon applies to the first note of the spread
    if (noteElement.secondaryGorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.secondaryGorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[0], workspace);

    // Flat applies to the second note of the spread
    if (noteElement.accidental && noteElement.accidental.startsWith('Flat')) {
      noteAtomNodes[1].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Gorgon applies to the second note of the spread
    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[1], workspace);
  }

  private static handleRunningElaphron(
    noteElement: Readonly<NoteElement>,
    noteAtomNodes: NoteAtomNode[],
    workspace: AnalysisWorkspace,
  ) {
    if (noteAtomNodes.length !== 2) {
      throw new Error('Unexpected length: ' + noteAtomNodes.length);
    }

    // Secondary accidental applies to the first note of the spread
    if (noteElement.secondaryAccidental) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.secondaryAccidental,
      );
    }
    // Secondary fthora applies to the first note of the spread
    if (noteElement.secondaryFthora) {
      this.handleFthora(
        noteAtomNodes[0].physicalNote,
        noteElement.secondaryFthora,
        noteElement.secondaryChromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Add a virtual gorgon to the first note of the spread
    const gorgonIndex: GorgonIndex = {
      neume: GorgonNeume.Gorgon_Top,
      index: workspace.nodes.length,
    };
    workspace.gorgonIndexes.push(gorgonIndex);
    this.finalizeNoteAtomNode(noteAtomNodes[0], workspace);

    // Accidental applies to the second note of the spread
    if (noteElement.accidental) {
      noteAtomNodes[1].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Fthora applies to the second note of the spread
    if (noteElement.fthora) {
      this.handleFthora(
        noteAtomNodes[1].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Ison applies to the second note of the spread
    this.handleIson(noteElement, workspace);

    this.finalizeNoteAtomNode(noteAtomNodes[1], workspace);
  }

  private static handleRunningElaphronKentemata(
    noteElement: Readonly<NoteElement>,
    noteAtomNodes: NoteAtomNode[],
    workspace: AnalysisWorkspace,
  ) {
    if (noteAtomNodes.length !== 3) {
      throw new Error('Unexpected length: ' + noteAtomNodes.length);
    }

    // Tertiary accidental applies to the first note of the spread
    if (noteElement.tertiaryAccidental) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.tertiaryAccidental,
      );
    }
    // Tertiary fthora applies to the first note of the spread
    if (noteElement.tertiaryFthora) {
      this.handleFthora(
        noteAtomNodes[0].physicalNote,
        noteElement.tertiaryFthora,
        noteElement.tertiaryChromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Add a virtual gorgon to the first note of the spread
    const gorgonIndex: GorgonIndex = {
      neume: GorgonNeume.Gorgon_Top,
      index: workspace.nodes.length,
    };
    workspace.gorgonIndexes.push(gorgonIndex);
    this.finalizeNoteAtomNode(noteAtomNodes[0], workspace);

    // Secondary accidental applies to the second note of the spread
    if (noteElement.secondaryAccidental) {
      noteAtomNodes[1].accidental = this.normalizeAccidental(
        noteElement.secondaryAccidental,
      );
    }
    // Secondary fthora applies to the second note of the spread
    if (noteElement.secondaryFthora) {
      this.handleFthora(
        noteAtomNodes[1].physicalNote,
        noteElement.secondaryFthora,
        noteElement.secondaryChromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Ison applies to the second note of the spread
    this.handleIson(noteElement, workspace);

    this.finalizeNoteAtomNode(noteAtomNodes[1], workspace);

    // Accidental applies to the third note of the spread
    if (noteElement.accidental) {
      noteAtomNodes[2].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Fthora applies to the third note of the spread
    if (noteElement.fthora) {
      this.handleFthora(
        noteAtomNodes[2].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Gorgon applies to the third note of the spread
    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[2], workspace);
  }

  private static handleHyporoeKentemata(
    noteElement: Readonly<NoteElement>,
    noteAtomNodes: NoteAtomNode[],
    workspace: AnalysisWorkspace,
  ) {
    if (noteAtomNodes.length !== 3) {
      throw new Error('Unexpected length: ' + noteAtomNodes.length);
    }

    // Secondary accidental applies to the first note of the spread
    if (noteElement.secondaryAccidental) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.secondaryAccidental,
      );
    }
    // Secondary fthora applies to the first note of the spread
    if (noteElement.secondaryFthora) {
      this.handleFthora(
        noteAtomNodes[0].physicalNote,
        noteElement.secondaryFthora,
        noteElement.secondaryChromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Secondary gorgon applies to the first note of the spread
    if (noteElement.secondaryGorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.secondaryGorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[0], workspace);

    this.finalizeNoteAtomNode(noteAtomNodes[1], workspace);
    // Ison applies to the second note of the spread
    this.handleIson(noteElement, workspace);

    // Accidental applies to the third note of the spread
    if (noteElement.accidental) {
      noteAtomNodes[2].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    // Fthora applies to the third note of the spread
    if (noteElement.fthora) {
      this.handleFthora(
        noteAtomNodes[2].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    // Gorgon applies to the third note of the spread
    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[2], workspace);
  }

  private static handleDefault(
    noteElement: Readonly<NoteElement>,
    noteAtomNodes: NoteAtomNode[],
    workspace: AnalysisWorkspace,
  ) {
    if (noteAtomNodes.length !== 1) {
      throw new Error('Unexpected length: ' + noteAtomNodes.length);
    }

    if (noteElement.accidental) {
      noteAtomNodes[0].accidental = this.normalizeAccidental(
        noteElement.accidental,
      );
    }
    if (noteElement.fthora) {
      this.handleFthora(
        noteAtomNodes[0].physicalNote,
        noteElement.fthora,
        noteElement.chromaticFthoraNote,
        noteElement.index,
        workspace,
      );
    }
    this.handleIson(noteElement, workspace);

    if (noteElement.gorgonNeume) {
      const gorgonIndex: GorgonIndex = {
        neume: noteElement.gorgonNeume,
        index: workspace.nodes.length,
      };
      workspace.gorgonIndexes.push(gorgonIndex);
    }
    this.finalizeNoteAtomNode(noteAtomNodes[0], workspace);
  }

  private static handleIson(
    noteElement: Readonly<NoteElement>,
    workspace: AnalysisWorkspace,
  ) {
    if (noteElement.ison) {
      const isonNode: IsonNode = new IsonNode();
      isonNode.elementIndex = noteElement.index;
      isonNode.unison = noteElement.ison === Ison.Unison;
      if (!isonNode.unison) {
        isonNode.physicalNote = getScaleNoteFromValue(
          getIsonValue(noteElement.ison),
        );
        isonNode.virtualNote = getScaleNoteFromValue(
          getScaleNoteValue(isonNode.physicalNote) + workspace.currentShift,
        );
      }
      workspace.nodes.push(isonNode);
    }
  }

  private static finalizeNoteAtomNode(
    noteAtomNode: NoteAtomNode,
    workspace: AnalysisWorkspace,
  ) {
    noteAtomNode.virtualNote = getScaleNoteFromValue(
      getScaleNoteValue(noteAtomNode.physicalNote) + workspace.currentShift,
    );
    noteAtomNode.scale = workspace.currentScale;

    // Apply general alterations
    if (
      workspace.generalFlat &&
      noteAtomNode.virtualNote === ScaleNote.ZoHigh &&
      !noteAtomNode.accidental
    ) {
      noteAtomNode.accidental = workspace.chrysanthineAccidentals
        ? Accidental.Flat_2_Right
        : Accidental.Flat_6_Right;
    } else if (
      workspace.generalSharp &&
      noteAtomNode.virtualNote === ScaleNote.Vou &&
      !noteAtomNode.accidental
    ) {
      noteAtomNode.accidental = workspace.chrysanthineAccidentals
        ? Accidental.Sharp_2_Left
        : Accidental.Sharp_4_Left;
    }

    workspace.nodes.push(noteAtomNode);
  }

  private static handleRest(
    noteElement: Readonly<NoteElement>,
    workspace: AnalysisWorkspace,
  ) {
    const restNode: RestNode = new RestNode();
    restNode.elementIndex = noteElement.index;
    restNode.duration = restMap.get(noteElement.quantitativeNeume)!;
    workspace.nodes.push(restNode);
  }

  private static handleModeKey(
    modeKeyElement: Readonly<ModeKeyElement>,
    workspace: AnalysisWorkspace,
  ) {
    // Reset workspace flags
    workspace.currentNote = getScaleNoteValue(modeKeyElement.scaleNote);
    workspace.currentScale = modeKeyElement.scale;
    workspace.currentShift = 0;
    workspace.generalFlat = false;
    workspace.generalSharp = false;

    const modeKeyNode: ModeKeyNode = new ModeKeyNode();
    modeKeyNode.elementIndex = modeKeyElement.index;
    modeKeyNode.physicalNote = getScaleNoteFromValue(workspace.currentNote);
    modeKeyNode.virtualNote = getScaleNoteFromValue(
      workspace.currentNote + workspace.currentShift,
    );
    modeKeyNode.scale = workspace.currentScale;
    modeKeyNode.ignoreAttractions = modeKeyElement.ignoreAttractions;
    modeKeyNode.permanentEnharmonicZo = modeKeyElement.permanentEnharmonicZo;
    if (
      modeKeyElement.mode === 4 &&
      modeKeyElement.scale === Scale.Diatonic &&
      (modeKeyElement.scaleNote === ScaleNote.Pa ||
        modeKeyElement.scaleNote === ScaleNote.Vou)
    ) {
      modeKeyNode.legetos = true;
    }
    workspace.nodes.push(modeKeyNode);

    if (modeKeyElement.fthora) {
      this.handleFthora(
        modeKeyNode.physicalNote,
        modeKeyElement.fthora,
        null,
        modeKeyElement.index,
        workspace,
      );
    }

    const tempoNode: TempoNode = new TempoNode();
    tempoNode.elementIndex = modeKeyElement.index;
    tempoNode.bpm = modeKeyElement.bpm ?? 120;
    workspace.nodes.push(tempoNode);
  }

  private static handleRichTextBoxAsModeKey(
    modeKeyElement: Readonly<RichTextBoxElement>,
    workspace: AnalysisWorkspace,
  ) {
    // Reset workspace flags
    workspace.currentNote = getScaleNoteValue(
      modeKeyElement.modeChangePhysicalNote,
    );
    workspace.currentScale = modeKeyElement.modeChangeScale;
    workspace.currentShift = 0;

    if (modeKeyElement.modeChangeVirtualNote) {
      workspace.currentShift = getShiftWithoutFthora(
        workspace.currentNote,
        getScaleNoteValue(modeKeyElement.modeChangeVirtualNote),
        workspace.currentScale,
      );
    }

    workspace.generalFlat = false;
    workspace.generalSharp = false;

    const modeKeyNode: ModeKeyNode = new ModeKeyNode();
    modeKeyNode.elementIndex = modeKeyElement.index;
    modeKeyNode.physicalNote = getScaleNoteFromValue(workspace.currentNote);
    modeKeyNode.virtualNote = getScaleNoteFromValue(
      workspace.currentNote + workspace.currentShift,
    );
    modeKeyNode.scale = workspace.currentScale;
    modeKeyNode.ignoreAttractions = modeKeyElement.modeChangeIgnoreAttractions;
    modeKeyNode.permanentEnharmonicZo =
      modeKeyElement.modeChangePermanentEnharmonicZo;

    // TODO support this somehow, maybe with a legetos flag?
    // if (
    //   modeKeyElement.mode === 4 &&
    //   modeKeyElement.modeChangeScale === Scale.Diatonic &&
    //   (modeKeyElement.modeChangePhysicalNote === ScaleNote.Pa ||
    //     modeKeyElement.modeChangePhysicalNote === ScaleNote.Vou)
    // ) {
    //   modeKeyNode.legetos = true;
    // }

    workspace.nodes.push(modeKeyNode);

    const tempoNode: TempoNode = new TempoNode();
    tempoNode.elementIndex = modeKeyElement.index;
    tempoNode.bpm = modeKeyElement.modeChangeBpm ?? 120;
    workspace.nodes.push(tempoNode);
  }

  private static handleFthora(
    physicalNote: ScaleNote,
    fthora: Fthora,
    chromaticFthoraNote: ScaleNote | null,
    index: number,
    workspace: AnalysisWorkspace,
  ) {
    workspace.currentScale =
      LayoutService.getScaleFromFthora(
        fthora,
        getScaleNoteValue(physicalNote),
      ) || workspace.currentScale;

    if (fthora.startsWith('GeneralFlat')) {
      workspace.generalFlat = true;
      workspace.generalSharp = false;

      // General flat/sharp implies a switch to the diatonic scale
      workspace.currentScale = Scale.Diatonic;
    } else if (fthora.startsWith('GeneralSharp')) {
      workspace.generalFlat = false;
      workspace.generalSharp = true;

      // General flat/sharp implies a switch to the diatonic scale
      workspace.currentScale = Scale.Diatonic;
    } else {
      workspace.generalFlat = false;
      workspace.generalSharp = false;
    }

    workspace.currentShift = LayoutService.getShift(
      getScaleNoteValue(physicalNote),
      getScaleNoteValue(physicalNote) + workspace.currentShift,
      workspace.currentScale,
      fthora,
      chromaticFthoraNote,
    );

    const fthoraNode: FthoraNode = new FthoraNode();
    fthoraNode.elementIndex = index;
    fthoraNode.physicalNote = physicalNote;
    fthoraNode.virtualNote = getScaleNoteFromValue(
      getScaleNoteValue(physicalNote) + workspace.currentShift,
    );
    fthoraNode.scale = workspace.currentScale;
    fthoraNode.fthora = fthora;
    fthoraNode.chromaticFthoraNote = chromaticFthoraNote;
    workspace.nodes.push(fthoraNode);
  }

  private static handleMartyria(
    martyriaElement: Readonly<MartyriaElement>,
    workspace: AnalysisWorkspace,
  ) {
    if (!martyriaElement.auto) {
      workspace.currentNote = getNoteValue(martyriaElement.note);
      workspace.currentScale = martyriaElement.scale;
      workspace.currentShift = 0;
    }

    if (martyriaElement.fthora) {
      this.handleFthora(
        getScaleNoteFromValue(workspace.currentNote),
        martyriaElement.fthora,
        null,
        martyriaElement.index,
        workspace,
      );
    }

    if (martyriaElement.tempo) {
      const tempoNode: TempoNode = new TempoNode();
      tempoNode.elementIndex = martyriaElement.index;
      tempoNode.bpm =
        martyriaElement.bpm || tempoToBpmMap.get(martyriaElement.tempo)!;
      workspace.nodes.push(tempoNode);
    }
  }

  private static handleTempo(
    tempoElement: Readonly<TempoElement>,
    workspace: AnalysisWorkspace,
  ) {
    const tempoNode: TempoNode = new TempoNode();
    tempoNode.elementIndex = tempoElement.index;
    tempoNode.bpm = tempoElement.bpm || tempoToBpmMap.get(tempoElement.neume)!;
    workspace.nodes.push(tempoNode);
  }

  private static processGorgons(
    nodes: AnalysisNode[],
    gorgonIndexes: GorgonIndex[],
  ) {
    for (const gorgon of gorgonIndexes) {
      if (gorgon.index < 0) {
        throw new Error('Gorgon index must be positive: ' + gorgon.index);
      }
      const durations = gorgonMap.get(gorgon.neume)!.slice();
      let cur = gorgon.index - 1;

      // Rewind until we reach the first temporal node or the head node.
      while (
        cur > -1 &&
        nodes[cur].nodeType !== NodeType.NoteAtomNode &&
        nodes[cur].nodeType !== NodeType.RestNode
      ) {
        cur -= 1;
      }

      // If the piece starts with a gorgon, skip the first duration.
      if (cur === -1) {
        durations.shift();
        cur += 1;
      }

      for (let i = 0; i < durations.length; i++) {
        // Advance until we reach the next temporal node.
        while (
          nodes[cur].nodeType !== NodeType.NoteAtomNode &&
          nodes[cur].nodeType !== NodeType.RestNode
        ) {
          cur += 1;
        }

        // Apply the gorgon.
        const affectedNode = nodes[cur] as TemporalNode;
        affectedNode.duration -= durations[i];
        cur += 1;
      }
    }
  }

  private static normalizeAccidental(accidental: Accidental): Accidental {
    switch (accidental) {
      case Accidental.Sharp_2_LeftSecondary:
      case Accidental.Sharp_2_LeftTertiary:
        return Accidental.Sharp_2_Left;
      case Accidental.Sharp_4_LeftSecondary:
      case Accidental.Sharp_4_LeftTertiary:
        return Accidental.Sharp_4_Left;
      case Accidental.Sharp_6_LeftSecondary:
      case Accidental.Sharp_6_LeftTertiary:
        return Accidental.Sharp_6_Left;
      case Accidental.Sharp_8_LeftSecondary:
      case Accidental.Sharp_8_LeftTertiary:
        return Accidental.Sharp_8_Left;
      case Accidental.Flat_2_RightSecondary:
      case Accidental.Flat_2_RightTertiary:
        return Accidental.Flat_2_Right;
      case Accidental.Flat_4_RightSecondary:
      case Accidental.Flat_4_RightTertiary:
        return Accidental.Flat_4_Right;
      case Accidental.Flat_6_RightSecondary:
      case Accidental.Flat_6_RightTertiary:
        return Accidental.Flat_6_Right;
      case Accidental.Flat_8_RightSecondary:
      case Accidental.Flat_8_RightTertiary:
        return Accidental.Flat_8_Right;
      default:
        return accidental;
    }
  }
}

const timeMap = new Map<TimeNeume, number>([
  [TimeNeume.Klasma_Bottom, 1],
  [TimeNeume.Klasma_Top, 1],
  [TimeNeume.Hapli, 1],
  [TimeNeume.Dipli, 2],
  [TimeNeume.Tripli, 3],
  [TimeNeume.Tetrapli, 4],
]);

const restMap = new Map<QuantitativeNeume, number>([
  [QuantitativeNeume.Breath, 0],
  [QuantitativeNeume.Cross, 0],
  [QuantitativeNeume.VareiaDotted, 1],
  [QuantitativeNeume.VareiaDotted2, 2],
  [QuantitativeNeume.VareiaDotted3, 3],
  [QuantitativeNeume.VareiaDotted4, 4],
]);

const gorgonMap = new Map<GorgonNeume, number[]>([
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

const tempoToBpmMap = new Map<TempoSign, number>([
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
