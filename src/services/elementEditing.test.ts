import { describe, expect, it } from 'vitest';

import { MartyriaElement, NoteElement } from '@/models/Element';
import { Fthora, QuantitativeNeume } from '@/models/Neumes';
import { ScaleNote } from '@/models/Scales';
import {
  CommandFactory,
  CommandService,
} from '@/services/history/CommandService';

import { getFthoraChange, getMartyriaAlignmentChange } from './elementEditing';

const families = [
  {
    fthoras: [
      Fthora.SoftChromaticPa_Top,
      Fthora.SoftChromaticPa_Bottom,
      Fthora.SoftChromaticPa_TopSecondary,
      Fthora.SoftChromaticPa_TopTertiary,
    ],
    note: ScaleNote.Ga,
  },
  {
    fthoras: [
      Fthora.HardChromaticPa_Top,
      Fthora.HardChromaticPa_Bottom,
      Fthora.HardChromaticPa_TopSecondary,
      Fthora.HardChromaticPa_TopTertiary,
    ],
    note: ScaleNote.Pa,
  },
  {
    fthoras: [
      Fthora.SoftChromaticThi_Top,
      Fthora.SoftChromaticThi_Bottom,
      Fthora.SoftChromaticThi_TopSecondary,
      Fthora.SoftChromaticThi_TopTertiary,
    ],
    note: ScaleNote.Thi,
  },
  {
    fthoras: [
      Fthora.HardChromaticThi_Top,
      Fthora.HardChromaticThi_Bottom,
      Fthora.HardChromaticThi_TopSecondary,
      Fthora.HardChromaticThi_TopTertiary,
    ],
    note: ScaleNote.Thi,
  },
];

describe('musical editing rules', () => {
  it.each(families)(
    'sets the default interpretation for $fthoras',
    ({ fthoras, note }) => {
      const [top, bottom, secondary, tertiary] = fthoras;
      for (const fthora of [top, bottom]) {
        expect(getFthoraChange('fthora', fthora)).toEqual({
          fthora,
          chromaticFthoraNote: note,
        });
      }
      expect(getFthoraChange('secondaryFthora', secondary)).toEqual({
        secondaryFthora: secondary,
        secondaryChromaticFthoraNote: note,
      });
      expect(getFthoraChange('tertiaryFthora', tertiary)).toEqual({
        tertiaryFthora: tertiary,
        tertiaryChromaticFthoraNote: note,
      });
      for (const fthora of fthoras) {
        expect(getFthoraChange('quantitativeNeumeFthora', fthora)).toEqual({
          quantitativeNeumeFthora: fthora,
          quantitativeNeumeChromaticFthoraNote: note,
        });
      }
    },
  );

  it.each([
    null,
    Fthora.DiatonicPa_Top,
    Fthora.Enharmonic_Top,
    Fthora.Zygos_Top,
    Fthora.Kliton_Top,
    Fthora.Spathi_Top,
    Fthora.GeneralSharp_Top,
    Fthora.GeneralFlat_Top,
  ])('clears the chromatic interpretation when selecting %s', (fthora) => {
    expect(getFthoraChange('fthora', fthora)).toEqual({
      fthora,
      chromaticFthoraNote: null,
    });
  });

  it('clears each secondary interpretation together with its fthora', () => {
    expect(getFthoraChange('secondaryFthora', null)).toEqual({
      secondaryFthora: null,
      secondaryChromaticFthoraNote: null,
    });
    expect(getFthoraChange('tertiaryFthora', null)).toEqual({
      tertiaryFthora: null,
      tertiaryChromaticFthoraNote: null,
    });
    expect(getFthoraChange('quantitativeNeumeFthora', null)).toEqual({
      quantitativeNeumeFthora: null,
      quantitativeNeumeChromaticFthoraNote: null,
    });
  });

  it('keeps fthora and interpretation changes together through undo and redo', () => {
    const note = new NoteElement();
    note.fthora = Fthora.HardChromaticPa_Top;
    note.chromaticFthoraNote = ScaleNote.Ni;
    note.secondaryFthora = Fthora.SoftChromaticThi_TopSecondary;
    note.secondaryChromaticFthoraNote = ScaleNote.Ke;
    const commands = new CommandService();
    const factory = new CommandFactory<NoteElement>();
    commands.execute(
      factory.create('update-properties', {
        target: note,
        newValues: getFthoraChange(
          'secondaryFthora',
          Fthora.SoftChromaticPa_TopSecondary,
        ),
      }),
    );
    expect(note.secondaryChromaticFthoraNote).toBe(ScaleNote.Ga);
    expect(note.fthora).toBe(Fthora.HardChromaticPa_Top);
    expect(note.chromaticFthoraNote).toBe(ScaleNote.Ni);
    commands.undo();
    expect(note.secondaryFthora).toBe(Fthora.SoftChromaticThi_TopSecondary);
    expect(note.secondaryChromaticFthoraNote).toBe(ScaleNote.Ke);
    commands.redo();
    expect(note.secondaryFthora).toBe(Fthora.SoftChromaticPa_TopSecondary);
    expect(note.secondaryChromaticFthoraNote).toBe(ScaleNote.Ga);
  });

  it.each([false, true])(
    'clears the attached neume on alignment change to %s, with undo/redo',
    (alignRight) => {
      const martyria = new MartyriaElement();
      martyria.alignRight = !alignRight;
      martyria.quantitativeNeume = QuantitativeNeume.Oligon;
      const commands = new CommandService();
      commands.execute(
        new CommandFactory<MartyriaElement>().create('update-properties', {
          target: martyria,
          newValues: getMartyriaAlignmentChange(
            martyria.alignRight,
            alignRight,
          ),
        }),
      );
      expect(martyria.alignRight).toBe(alignRight);
      expect(martyria.quantitativeNeume).toBeNull();
      commands.undo();
      expect(martyria.alignRight).toBe(!alignRight);
      expect(martyria.quantitativeNeume).toBe(QuantitativeNeume.Oligon);
      commands.redo();
      expect(martyria.alignRight).toBe(alignRight);
      expect(martyria.quantitativeNeume).toBeNull();
    },
  );

  it.each([false, true])(
    'preserves the attached neume when alignment is already %s',
    (alignRight) => {
      const martyria = new MartyriaElement();
      martyria.alignRight = alignRight;
      martyria.quantitativeNeume = QuantitativeNeume.Oligon;
      Object.assign(
        martyria,
        getMartyriaAlignmentChange(martyria.alignRight, alignRight),
      );
      expect(martyria.quantitativeNeume).toBe(QuantitativeNeume.Oligon);
    },
  );
});
