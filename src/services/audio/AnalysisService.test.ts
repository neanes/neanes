import { describe, expect, it } from 'vitest';

import { MartyriaElement } from '@/models/Element';
import { Fthora, Note, QuantitativeNeume } from '@/models/Neumes';
import { getNeumeValue } from '@/models/NeumeValues';
import { getNoteValue, getScaleNoteFromValue } from '@/models/Scales';

import { AnalysisService, type FthoraNode, NodeType } from './AnalysisService';

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
