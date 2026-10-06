import { describe, expect, it } from 'vitest';

import { MartyriaElement } from '@/models/Element';
import { Fthora, Note, QuantitativeNeume, TempoSign } from '@/models/Neumes';
import { getNeumeValue } from '@/models/NeumeValues';
import { getNoteValue, getScaleNoteFromValue } from '@/models/Scales';

import {
  AnalysisService,
  type FthoraNode,
  NodeType,
  type TempoNode,
} from './AnalysisService';

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
