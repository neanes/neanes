import { describe, expect, it } from 'vitest';

import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  Neume,
  Note,
  QuantitativeNeume,
  TempoSign,
  TimeNeume,
  VocalExpressionNeume,
} from '../models/Neumes';
import { NeumeKeyboard } from './NeumeKeyboard';

describe('NeumeKeyboard', () => {
  it('should have a mapping for every neume that is not in the list of exceptions', () => {
    const exceptions: Neume[] = [
      Note.NiLow,
      Note.PaLow,
      Note.ZoLow,
      QuantitativeNeume.Kentima,
      QuantitativeNeume.OligonKentimataDoubleYpsili,
      QuantitativeNeume.OligonKentimaDoubleYpsiliRight,
      QuantitativeNeume.OligonKentimaDoubleYpsiliLeft,
      QuantitativeNeume.OligonTripleYpsili,
      QuantitativeNeume.OligonKentimataTripleYpsili,
      QuantitativeNeume.OligonKentimaTripleYpsili,
      QuantitativeNeume.PetastiKentimataDoubleYpsili,
      QuantitativeNeume.PetastiKentimaDoubleYpsiliRight,
      QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft,
      QuantitativeNeume.PetastiTripleYpsili,
      QuantitativeNeume.PetastiKentimataTripleYpsili,
      QuantitativeNeume.PetastiKentimaTripleYpsili,
      QuantitativeNeume.DoubleHamiliApostrofos,
      QuantitativeNeume.DoubleHamiliElafron,
      QuantitativeNeume.DoubleHamiliElafronApostrofos,
      QuantitativeNeume.TripleHamili,
      QuantitativeNeume.PetastiHamili,
      QuantitativeNeume.PetastiHamiliApostrofos,
      QuantitativeNeume.PetastiHamiliElafron,
      QuantitativeNeume.PetastiHamiliElafronApostrofos,
      QuantitativeNeume.PetastiDoubleHamili,
      QuantitativeNeume.PetastiDoubleHamiliApostrofos,
      TimeNeume.Klasma_Top,
      TimeNeume.Klasma_Bottom,
      GorgonNeume.GorgonSecondary,
      GorgonNeume.DigorgonSecondary,
      GorgonNeume.TrigorgonSecondary,
      GorgonNeume.GorgonDottedLeftSecondary,
      GorgonNeume.GorgonDottedRightSecondary,
      GorgonNeume.DigorgonDottedLeft1Secondary,
      GorgonNeume.DigorgonDottedLeft2Secondary,
      GorgonNeume.DigorgonDottedRightSecondary,
      GorgonNeume.TrigorgonDottedLeft1Secondary,
      GorgonNeume.TrigorgonDottedLeft2Secondary,
      GorgonNeume.TrigorgonDottedRightSecondary,
      Accidental.Sharp_2_LeftSecondary,
      Accidental.Sharp_4_LeftSecondary,
      Accidental.Sharp_6_LeftSecondary,
      Accidental.Sharp_8_LeftSecondary,
      Accidental.Sharp_2_LeftTertiary,
      Accidental.Sharp_4_LeftTertiary,
      Accidental.Sharp_6_LeftTertiary,
      Accidental.Sharp_8_LeftTertiary,
      Accidental.Flat_2_RightSecondary,
      Accidental.Flat_4_RightSecondary,
      Accidental.Flat_6_RightSecondary,
      Accidental.Flat_8_RightSecondary,
      Accidental.Flat_2_RightTertiary,
      Accidental.Flat_4_RightTertiary,
      Accidental.Flat_6_RightTertiary,
      Accidental.Flat_8_RightTertiary,
      Fthora.DiatonicNiLow_TopSecondary,
      Fthora.DiatonicPa_TopSecondary,
      Fthora.DiatonicVou_TopSecondary,
      Fthora.DiatonicGa_TopSecondary,
      Fthora.DiatonicThi_TopSecondary,
      Fthora.DiatonicKe_TopSecondary,
      Fthora.DiatonicZo_TopSecondary,
      Fthora.DiatonicNiHigh_TopSecondary,
      Fthora.HardChromaticPa_TopSecondary,
      Fthora.HardChromaticThi_TopSecondary,
      Fthora.SoftChromaticPa_TopSecondary,
      Fthora.SoftChromaticThi_TopSecondary,
      Fthora.Enharmonic_TopSecondary,
      Fthora.Zygos_TopSecondary,
      Fthora.Kliton_TopSecondary,
      Fthora.Spathi_TopSecondary,
      Fthora.DiatonicNiLow_TopTertiary,
      Fthora.DiatonicPa_TopTertiary,
      Fthora.DiatonicVou_TopTertiary,
      Fthora.DiatonicGa_TopTertiary,
      Fthora.DiatonicThi_TopTertiary,
      Fthora.DiatonicKe_TopTertiary,
      Fthora.DiatonicZo_TopTertiary,
      Fthora.DiatonicNiHigh_TopTertiary,
      Fthora.HardChromaticPa_TopTertiary,
      Fthora.HardChromaticThi_TopTertiary,
      Fthora.SoftChromaticPa_TopTertiary,
      Fthora.SoftChromaticThi_TopTertiary,
      Fthora.Enharmonic_TopTertiary,
      Fthora.Zygos_TopTertiary,
      Fthora.Kliton_TopTertiary,
      Fthora.Spathi_TopTertiary,
      Fthora.GeneralFlat_TopSecondary,
      Fthora.GeneralFlat_TopTertiary,
      Fthora.GeneralSharp_TopSecondary,
      Fthora.GeneralSharp_TopTertiary,
      Fthora.DiatonicNiLow,
      Fthora.DiatonicPa,
      Fthora.DiatonicVou,
      Fthora.DiatonicGa,
      Fthora.DiatonicThi,
      Fthora.DiatonicKe,
      Fthora.DiatonicZo,
      Fthora.DiatonicNiHigh,
      Fthora.HardChromaticPa,
      Fthora.HardChromaticThi,
      Fthora.SoftChromaticPa,
      Fthora.SoftChromaticThi,
      Fthora.Enharmonic,
      Fthora.Zygos,
      Fthora.Kliton,
      Fthora.Spathi,
      MeasureBar.MeasureBarDoubleAbove,
      MeasureBar.MeasureBarRightAbove,
      MeasureBar.MeasureBarShortDoubleAbove,
      MeasureBar.MeasureBarShortTheseosAbove,
      MeasureBar.MeasureBarTheseosAbove,
      MeasureBar.MeasureBarTopAbove,
      VocalExpressionNeume.Cross_Top,
    ];

    const keyboard = new NeumeKeyboard();

    Object.values(QuantitativeNeume)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(TimeNeume)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(GorgonNeume)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neumes).toContain(x);
      });

    Object.values(VocalExpressionNeume)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(Fthora)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        if (keyboard.findMappingForNeume(x)?.neumes == null) {
          console.log(x);
        }
        expect(keyboard.findMappingForNeume(x)?.neumes).toContain(x);
      });

    Object.values(Accidental)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(TempoSign)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(MeasureBar)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(MeasureNumber)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(Ison)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(Note)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.note).toBe(x);
      });
  });
});
