import { describe, expect, it } from 'vitest';

import { serializeModeKeyAttributes } from '@/ckeditor-plugins/insertmodekey/modekeydata';
import {
  MartyriaElement,
  NoteElement,
  RichTextBoxElement,
} from '@/models/Element';
import {
  Fthora,
  Ison,
  Note,
  QuantitativeNeume,
  TempoSign,
} from '@/models/Neumes';
import { getNeumeValue } from '@/models/NeumeValues';
import {
  getNoteValue,
  getScaleNoteFromValue,
  Scale,
  ScaleNote,
} from '@/models/Scales';

import {
  AnalysisService,
  type FthoraNode,
  type IsonNode,
  type ModeKeyNode,
  NodeType,
  type TempoNode,
} from './AnalysisService';

function embeddedModeKey(scaleNote: ScaleNote, scale: Scale, bpm: number) {
  return `<span class="neanes-ck-mode-key" data-neanes-mode-key="${serializeModeKeyAttributes({ scaleNote, scale, bpm })}"></span>`;
}

describe('AnalysisService martyria fthoras', () => {
  it('targets the note reached by an attached quantitative neume', () => {
    const martyria = new MartyriaElement();
    martyria.auto = false;
    martyria.note = Note.Pa;
    martyria.alignRight = true;
    martyria.quantitativeNeume = QuantitativeNeume.OligonPlusKentimaAbove;
    martyria.quantitativeNeumeFthora = Fthora.Zygos_Top;

    const nodes = AnalysisService.analyze([martyria], false);
    const fthoraNode = nodes.find(
      (node): node is FthoraNode => node.nodeType === NodeType.FthoraNode,
    );

    expect(fthoraNode?.physicalNote).toBe(
      getScaleNoteFromValue(
        getNoteValue(martyria.note) +
          getNeumeValue(martyria.quantitativeNeume)!,
      ),
    );
  });
});

describe('AnalysisService rich text mode keys', () => {
  it('uses the last embedded key as a mode change', () => {
    const richText = new RichTextBoxElement();
    richText.index = 11;
    richText.content = `${embeddedModeKey(ScaleNote.Pa, Scale.Diatonic, 80)}${embeddedModeKey(ScaleNote.Ke, Scale.SoftChromatic, 96)}`;

    const nodes = AnalysisService.analyze([richText], false);
    const modeKey = nodes.find(
      (node): node is ModeKeyNode => node.nodeType === NodeType.ModeKeyNode,
    );
    const tempo = nodes.find(
      (node): node is TempoNode => node.nodeType === NodeType.TempoNode,
    );

    expect(modeKey).toMatchObject({
      elementIndex: 11,
      physicalNote: ScaleNote.Ke,
      scale: Scale.SoftChromatic,
    });
    expect(tempo?.bpm).toBe(96);
  });

  it('uses the explicit mode-change override instead of embedded keys', () => {
    const richText = new RichTextBoxElement();
    richText.index = 12;
    richText.content = embeddedModeKey(ScaleNote.Ke, Scale.SoftChromatic, 96);
    richText.modeChange = true;
    richText.modeChangePhysicalNote = ScaleNote.Ni;
    richText.modeChangeScale = Scale.HardChromatic;
    richText.modeChangeBpm = 72;

    const nodes = AnalysisService.analyze([richText], false);
    const modeKey = nodes.find(
      (node): node is ModeKeyNode => node.nodeType === NodeType.ModeKeyNode,
    );
    const tempo = nodes.find(
      (node): node is TempoNode => node.nodeType === NodeType.TempoNode,
    );

    expect(modeKey).toMatchObject({
      elementIndex: 12,
      physicalNote: ScaleNote.Ni,
      scale: Scale.HardChromatic,
    });
    expect(tempo?.bpm).toBe(72);
  });
});

describe('AnalysisService martyria tempos', () => {
  it.each([
    ['tempoLeft', TempoSign.Slow],
    ['tempo', TempoSign.SlowAbove],
    ['tempoRight', TempoSign.Slow],
  ] as const)('uses the default BPM for %s', (placement, sign) => {
    const martyria = new MartyriaElement();
    martyria.alignRight = true;
    martyria.index = 3;
    martyria[placement] = sign;

    const nodes = AnalysisService.analyze([martyria], false);
    const tempoNodes = nodes.filter(
      (node): node is TempoNode => node.nodeType === NodeType.TempoNode,
    );

    expect(tempoNodes).toEqual([
      { nodeType: NodeType.TempoNode, elementIndex: 3, bpm: 80 },
    ]);
  });

  it('does not change tempo for a martyria without a tempo sign', () => {
    const martyria = new MartyriaElement();
    martyria.alignRight = true;
    martyria.bpm = 60;

    const nodes = AnalysisService.analyze([martyria], false);

    expect(nodes.some((node) => node.nodeType === NodeType.TempoNode)).toBe(
      false,
    );
  });
});

describe('AnalysisService ison indicators', () => {
  it('resolves low Ga to its physical and virtual playback notes', () => {
    const note = new NoteElement();
    note.ison = Ison.GaLow;

    const nodes = AnalysisService.analyze([note], false);
    const isonNode = nodes.find(
      (node): node is IsonNode => node.nodeType === NodeType.IsonNode,
    );

    expect(isonNode?.unison).toBe(false);
    expect(isonNode?.physicalNote).toBe(ScaleNote.GaLow);
    expect(isonNode?.virtualNote).toBe(ScaleNote.GaLow);
  });
});
