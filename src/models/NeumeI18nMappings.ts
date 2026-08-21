import type { SelectorParam } from 'i18next';

import {
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  ModeSign,
  Note,
  NoteIndicator,
  QuantitativeNeume,
  RootSign,
  TempoSign,
  TimeNeume,
  VocalExpressionNeume,
} from './Neumes';
import type { ScaleNote } from './Scales';
import { Scale } from './Scales';

export type ModelSelector = SelectorParam<'model'>;

export const NOTE_LABEL_SELECTORS: Record<Note | ScaleNote, ModelSelector> = {
  [Note.ZoLow]: ($) => $.model.note.zoLow,
  [Note.NiLow]: ($) => $.model.note.niLow,
  [Note.PaLow]: ($) => $.model.note.paLow,
  [Note.VouLow]: ($) => $.model.note.vouLow,
  [Note.GaLow]: ($) => $.model.note.gaLow,
  [Note.ThiLow]: ($) => $.model.note.diLow,
  [Note.KeLow]: ($) => $.model.note.keLow,
  [Note.Zo]: ($) => $.model.note.zo,
  [Note.Ni]: ($) => $.model.note.ni,
  [Note.Pa]: ($) => $.model.note.pa,
  [Note.Vou]: ($) => $.model.note.vou,
  [Note.Ga]: ($) => $.model.note.ga,
  [Note.Thi]: ($) => $.model.note.di,
  [Note.Ke]: ($) => $.model.note.ke,
  [Note.ZoHigh]: ($) => $.model.note.zoHigh,
  [Note.NiHigh]: ($) => $.model.note.niHigh,
  [Note.PaHigh]: ($) => $.model.note.paHigh,
  [Note.VouHigh]: ($) => $.model.note.vouHigh,
  [Note.GaHigh]: ($) => $.model.note.gaHigh,
  [Note.ThiHigh]: ($) => $.model.note.diHigh,
  [Note.KeHigh]: ($) => $.model.note.keHigh,
};

const SCALE_LABEL_SELECTORS: Record<Scale, ModelSelector> = {
  [Scale.Diatonic]: ($) => $.model.scale.diatonic,
  [Scale.SoftChromatic]: ($) => $.model.scale.softChromatic,
  [Scale.HardChromatic]: ($) => $.model.scale.hardChromatic,
  [Scale.EnharmonicGa]: ($) => $.model.scale.enharmonicGa,
  [Scale.EnharmonicZoHigh]: ($) => $.model.scale.enharmonicZoHigh,
  [Scale.EnharmonicVou]: ($) => $.model.scale.enharmonicVou,
  [Scale.EnharmonicZo]: ($) => $.model.scale.enharmonicZo,
  [Scale.EnharmonicVouHigh]: ($) => $.model.scale.enharmonicVouHigh,
  [Scale.Zygos]: ($) => $.model.scale.zygos,
  [Scale.Spathi]: ($) => $.model.scale.spathi,
  [Scale.SpathiGa]: ($) => $.model.scale.spathiGa,
  [Scale.Kliton]: ($) => $.model.scale.kliton,
};

const FTHORA_LABEL_SELECTORS: Record<Fthora, ModelSelector> = {
  [Fthora.DiatonicNiLow_Top]: ($) => $.model.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa_Top]: ($) => $.model.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou_Top]: ($) => $.model.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa_Top]: ($) => $.model.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi_Top]: ($) => $.model.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe_Top]: ($) => $.model.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo_Top]: ($) => $.model.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh_Top]: ($) => $.model.neume.fthora.diatonicNiHigh,
  [Fthora.SoftChromaticThi_Top]: ($) => $.model.neume.fthora.softChromaticDi,
  [Fthora.SoftChromaticPa_Top]: ($) => $.model.neume.fthora.softChromaticGa,
  [Fthora.HardChromaticPa_Top]: ($) => $.model.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi_Top]: ($) => $.model.neume.fthora.hardChromaticDi,
  [Fthora.Enharmonic_Top]: ($) => $.model.neume.fthora.enharmonic,
  [Fthora.GeneralFlat_Top]: ($) => $.model.neume.fthora.generalFlat,
  [Fthora.GeneralSharp_Top]: ($) => $.model.neume.fthora.generalSharp,
  [Fthora.Zygos_Top]: ($) => $.model.neume.fthora.zygos,
  [Fthora.Kliton_Top]: ($) => $.model.neume.fthora.kliton,
  [Fthora.Spathi_Top]: ($) => $.model.neume.fthora.spathi,
  [Fthora.DiatonicNiLow_TopSecondary]: ($) =>
    $.model.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa_TopSecondary]: ($) => $.model.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou_TopSecondary]: ($) => $.model.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa_TopSecondary]: ($) => $.model.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi_TopSecondary]: ($) => $.model.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe_TopSecondary]: ($) => $.model.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo_TopSecondary]: ($) => $.model.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh_TopSecondary]: ($) =>
    $.model.neume.fthora.diatonicNiHigh,
  [Fthora.HardChromaticPa_TopSecondary]: ($) =>
    $.model.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi_TopSecondary]: ($) =>
    $.model.neume.fthora.hardChromaticDi,
  [Fthora.SoftChromaticPa_TopSecondary]: ($) =>
    $.model.neume.fthora.softChromaticGa,
  [Fthora.SoftChromaticThi_TopSecondary]: ($) =>
    $.model.neume.fthora.softChromaticDi,
  [Fthora.Enharmonic_TopSecondary]: ($) => $.model.neume.fthora.enharmonic,
  [Fthora.Zygos_TopSecondary]: ($) => $.model.neume.fthora.zygos,
  [Fthora.Kliton_TopSecondary]: ($) => $.model.neume.fthora.kliton,
  [Fthora.Spathi_TopSecondary]: ($) => $.model.neume.fthora.spathi,
  [Fthora.DiatonicNiLow_TopTertiary]: ($) => $.model.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa_TopTertiary]: ($) => $.model.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou_TopTertiary]: ($) => $.model.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa_TopTertiary]: ($) => $.model.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi_TopTertiary]: ($) => $.model.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe_TopTertiary]: ($) => $.model.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo_TopTertiary]: ($) => $.model.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh_TopTertiary]: ($) =>
    $.model.neume.fthora.diatonicNiHigh,
  [Fthora.HardChromaticPa_TopTertiary]: ($) =>
    $.model.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi_TopTertiary]: ($) =>
    $.model.neume.fthora.hardChromaticDi,
  [Fthora.SoftChromaticPa_TopTertiary]: ($) =>
    $.model.neume.fthora.softChromaticGa,
  [Fthora.SoftChromaticThi_TopTertiary]: ($) =>
    $.model.neume.fthora.softChromaticDi,
  [Fthora.Enharmonic_TopTertiary]: ($) => $.model.neume.fthora.enharmonic,
  [Fthora.Zygos_TopTertiary]: ($) => $.model.neume.fthora.zygos,
  [Fthora.Kliton_TopTertiary]: ($) => $.model.neume.fthora.kliton,
  [Fthora.Spathi_TopTertiary]: ($) => $.model.neume.fthora.spathi,
  [Fthora.DiatonicNiLow_Bottom]: ($) => $.model.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa_Bottom]: ($) => $.model.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou_Bottom]: ($) => $.model.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa_Bottom]: ($) => $.model.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi_Bottom]: ($) => $.model.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe_Bottom]: ($) => $.model.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo_Bottom]: ($) => $.model.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh_Bottom]: ($) => $.model.neume.fthora.diatonicNiHigh,
  [Fthora.HardChromaticPa_Bottom]: ($) => $.model.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi_Bottom]: ($) => $.model.neume.fthora.hardChromaticDi,
  [Fthora.SoftChromaticPa_Bottom]: ($) => $.model.neume.fthora.softChromaticGa,
  [Fthora.SoftChromaticThi_Bottom]: ($) => $.model.neume.fthora.softChromaticDi,
  [Fthora.Enharmonic_Bottom]: ($) => $.model.neume.fthora.enharmonic,
  [Fthora.Zygos_Bottom]: ($) => $.model.neume.fthora.zygos,
  [Fthora.Kliton_Bottom]: ($) => $.model.neume.fthora.kliton,
  [Fthora.Spathi_Bottom]: ($) => $.model.neume.fthora.spathi,
  [Fthora.GeneralSharp_TopSecondary]: ($) => $.model.neume.fthora.generalSharp,
  [Fthora.GeneralSharp_TopTertiary]: ($) => $.model.neume.fthora.generalSharp,
  [Fthora.GeneralSharp_Bottom]: ($) => $.model.neume.fthora.generalSharp,
  [Fthora.GeneralFlat_TopSecondary]: ($) => $.model.neume.fthora.generalFlat,
  [Fthora.GeneralFlat_TopTertiary]: ($) => $.model.neume.fthora.generalFlat,
  [Fthora.GeneralFlat_Bottom]: ($) => $.model.neume.fthora.generalFlat,
  [Fthora.DiatonicNiLow]: ($) => $.model.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa]: ($) => $.model.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou]: ($) => $.model.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa]: ($) => $.model.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi]: ($) => $.model.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe]: ($) => $.model.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo]: ($) => $.model.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh]: ($) => $.model.neume.fthora.diatonicNiHigh,
  [Fthora.HardChromaticPa]: ($) => $.model.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi]: ($) => $.model.neume.fthora.hardChromaticDi,
  [Fthora.SoftChromaticPa]: ($) => $.model.neume.fthora.softChromaticGa,
  [Fthora.SoftChromaticThi]: ($) => $.model.neume.fthora.softChromaticDi,
  [Fthora.Enharmonic]: ($) => $.model.neume.fthora.enharmonic,
  [Fthora.Zygos]: ($) => $.model.neume.fthora.zygos,
  [Fthora.Kliton]: ($) => $.model.neume.fthora.kliton,
  [Fthora.Spathi]: ($) => $.model.neume.fthora.spathi,
};

const QUANTITATIVE_NEUME_LABEL_SELECTORS: Record<
  QuantitativeNeume,
  ModelSelector
> = {
  [QuantitativeNeume.Ison]: ($) => $.model.neume.quantitative.ison,
  [QuantitativeNeume.Oligon]: ($) => $.model.neume.quantitative.oligon,
  [QuantitativeNeume.OligonPlusKentima]: ($) =>
    $.model.neume.quantitative.oligonWithKentima,
  [QuantitativeNeume.OligonPlusKentimaBelow]: ($) =>
    $.model.neume.quantitative.oligonWithKentima,
  [QuantitativeNeume.OligonPlusKentimaAbove]: ($) =>
    $.model.neume.quantitative.oligonWithKentima,
  [QuantitativeNeume.OligonPlusHypsiliRight]: ($) =>
    $.model.neume.quantitative.oligonWithYpsili,
  [QuantitativeNeume.OligonPlusHypsiliLeft]: ($) =>
    $.model.neume.quantitative.oligonWithYpsili,
  [QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal]: ($) =>
    $.model.neume.quantitative.oligonWithYpsiliAndKentima,
  [QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical]: ($) =>
    $.model.neume.quantitative.oligonWithYpsiliAndKentima,
  [QuantitativeNeume.OligonPlusDoubleHypsili]: ($) =>
    $.model.neume.quantitative.oligonWithDoubleYpsili,
  [QuantitativeNeume.OligonKentimataDoubleYpsili]: ($) =>
    $.model.neume.quantitative.oligonWithKentimataAndDoubleYpsili,
  [QuantitativeNeume.OligonKentimaDoubleYpsiliRight]: ($) =>
    $.model.neume.quantitative.oligonWithKentimaAndDoubleYpsili,
  [QuantitativeNeume.OligonKentimaDoubleYpsiliLeft]: ($) =>
    $.model.neume.quantitative.oligonWithKentimaAndDoubleYpsili,
  [QuantitativeNeume.OligonTripleYpsili]: ($) =>
    $.model.neume.quantitative.oligonWithTripleYpsili,
  [QuantitativeNeume.OligonKentimataTripleYpsili]: ($) =>
    $.model.neume.quantitative.oligonWithKentimataAndTripleYpsili,
  [QuantitativeNeume.OligonKentimaTripleYpsili]: ($) =>
    $.model.neume.quantitative.oligonWithKentimaAndTripleYpsili,
  [QuantitativeNeume.PetastiWithIson]: ($) =>
    $.model.neume.quantitative.petastiWithIson,
  [QuantitativeNeume.Petasti]: ($) => $.model.neume.quantitative.petasti,
  [QuantitativeNeume.PetastiPlusOligon]: ($) =>
    $.model.neume.quantitative.petastiWithOligon,
  [QuantitativeNeume.PetastiPlusKentimaAbove]: ($) =>
    $.model.neume.quantitative.petastiWithKentima,
  [QuantitativeNeume.PetastiPlusHypsiliRight]: ($) =>
    $.model.neume.quantitative.petastiWithYpsili,
  [QuantitativeNeume.PetastiPlusHypsiliLeft]: ($) =>
    $.model.neume.quantitative.petastiWithYpsili,
  [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal]: ($) =>
    $.model.neume.quantitative.petastiWithYpsiliAndKentima,
  [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical]: ($) =>
    $.model.neume.quantitative.petastiWithYpsiliAndKentima,
  [QuantitativeNeume.PetastiPlusDoubleHypsili]: ($) =>
    $.model.neume.quantitative.petastiWithDoubleYpsili,
  [QuantitativeNeume.PetastiKentimataDoubleYpsili]: ($) =>
    $.model.neume.quantitative.petastiWithKentimataAndDoubleYpsili,
  [QuantitativeNeume.PetastiKentimaDoubleYpsiliRight]: ($) =>
    $.model.neume.quantitative.petastiWithKentimaAndDoubleYpsili,
  [QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft]: ($) =>
    $.model.neume.quantitative.petastiWithKentimaAndDoubleYpsili,
  [QuantitativeNeume.PetastiTripleYpsili]: ($) =>
    $.model.neume.quantitative.petastiWithTripleYpsili,
  [QuantitativeNeume.PetastiKentimataTripleYpsili]: ($) =>
    $.model.neume.quantitative.petastiWithKentimataAndTripleYpsili,
  [QuantitativeNeume.PetastiKentimaTripleYpsili]: ($) =>
    $.model.neume.quantitative.petastiWithKentimaAndTripleYpsili,
  [QuantitativeNeume.Apostrophos]: ($) =>
    $.model.neume.quantitative.apostrophos,
  [QuantitativeNeume.Elaphron]: ($) => $.model.neume.quantitative.elaphron,
  [QuantitativeNeume.ElaphronPlusApostrophos]: ($) =>
    $.model.neume.quantitative.elaphronWithApostrophos,
  [QuantitativeNeume.Hamili]: ($) => $.model.neume.quantitative.hamili,
  [QuantitativeNeume.HamiliPlusApostrophos]: ($) =>
    $.model.neume.quantitative.hamiliWithApostrophos,
  [QuantitativeNeume.HamiliPlusElaphron]: ($) =>
    $.model.neume.quantitative.hamiliWithElaphron,
  [QuantitativeNeume.HamiliPlusElaphronPlusApostrophos]: ($) =>
    $.model.neume.quantitative.hamiliWithElaphronAndApostrophos,
  [QuantitativeNeume.DoubleHamili]: ($) =>
    $.model.neume.quantitative.doubleHamili,
  [QuantitativeNeume.DoubleHamiliApostrofos]: ($) =>
    $.model.neume.quantitative.doubleHamiliWithApostrophos,
  [QuantitativeNeume.DoubleHamiliElafron]: ($) =>
    $.model.neume.quantitative.doubleHamiliWithElaphron,
  [QuantitativeNeume.DoubleHamiliElafronApostrofos]: ($) =>
    $.model.neume.quantitative.doubleHamiliWithElaphronAndApostrophos,
  [QuantitativeNeume.TripleHamili]: ($) =>
    $.model.neume.quantitative.tripleHamili,
  [QuantitativeNeume.PetastiPlusApostrophos]: ($) =>
    $.model.neume.quantitative.petastiWithApostrophos,
  [QuantitativeNeume.PetastiPlusElaphron]: ($) =>
    $.model.neume.quantitative.petastiWithElaphron,
  [QuantitativeNeume.PetastiPlusElaphronPlusApostrophos]: ($) =>
    $.model.neume.quantitative.petastiWithElaphronAndApostrophos,
  [QuantitativeNeume.PetastiHamili]: ($) =>
    $.model.neume.quantitative.petastiWithHamili,
  [QuantitativeNeume.PetastiHamiliApostrofos]: ($) =>
    $.model.neume.quantitative.petastiWithHamiliAndApostrophos,
  [QuantitativeNeume.PetastiHamiliElafron]: ($) =>
    $.model.neume.quantitative.petastiWithHamiliAndElaphron,
  [QuantitativeNeume.PetastiHamiliElafronApostrofos]: ($) =>
    $.model.neume.quantitative.petastiWithHamiliElaphronAndApostrophos,
  [QuantitativeNeume.PetastiDoubleHamili]: ($) =>
    $.model.neume.quantitative.petastiWithDoubleHamili,
  [QuantitativeNeume.PetastiDoubleHamiliApostrofos]: ($) =>
    $.model.neume.quantitative.petastiWithDoubleHamiliAndApostrophos,
  [QuantitativeNeume.OligonPlusKentemata]: ($) =>
    $.model.neume.quantitative.oligonAndKentimata,
  [QuantitativeNeume.KentemataPlusOligon]: ($) =>
    $.model.neume.quantitative.kentimataAndOligon,
  [QuantitativeNeume.OligonPlusIsonPlusKentemata]: ($) =>
    $.model.neume.quantitative.isonAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusApostrophosPlusKentemata]: ($) =>
    $.model.neume.quantitative.apostrophosAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusHyporoePlusKentemata]: ($) =>
    $.model.neume.quantitative.yporoeAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusElaphronPlusKentemata]: ($) =>
    $.model.neume.quantitative.elaphronAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata]: ($) =>
    $.model.neume.quantitative
      .elaphronWithApostrophosAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusHamiliPlusKentemata]: ($) =>
    $.model.neume.quantitative.hamiliAndKentimataWithSupportingOligon,
  [QuantitativeNeume.RunningElaphron]: ($) =>
    $.model.neume.quantitative.runningElaphron,
  [QuantitativeNeume.Hyporoe]: ($) => $.model.neume.quantitative.yporoe,
  [QuantitativeNeume.PetastiPlusRunningElaphron]: ($) =>
    $.model.neume.quantitative.petastiWithRunningElaphron,
  [QuantitativeNeume.PetastiPlusHyporoe]: ($) =>
    $.model.neume.quantitative.petastiWithYporoe,
  [QuantitativeNeume.OligonPlusIson]: ($) =>
    $.model.neume.quantitative.isonWithSupportingOligon,
  [QuantitativeNeume.OligonPlusApostrophos]: ($) =>
    $.model.neume.quantitative.apostrophosWithSupportingOligon,
  [QuantitativeNeume.OligonPlusElaphron]: ($) =>
    $.model.neume.quantitative.elaphronWithSupportingOligon,
  [QuantitativeNeume.OligonPlusHyporoe]: ($) =>
    $.model.neume.quantitative.yporoeWithSupportingOligon,
  [QuantitativeNeume.OligonPlusElaphronPlusApostrophos]: ($) =>
    $.model.neume.quantitative.elaphronWithApostrophosAndSupportingOligon,
  [QuantitativeNeume.OligonPlusHamili]: ($) =>
    $.model.neume.quantitative.hamiliWithSupportingOligon,
  [QuantitativeNeume.Kentima]: ($) => $.model.neume.quantitative.kentima,
  [QuantitativeNeume.Kentemata]: ($) => $.model.neume.quantitative.kentimata,
  [QuantitativeNeume.DoubleApostrophos]: ($) =>
    $.model.neume.quantitative.doubleApostrophos,
  [QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata]: ($) =>
    $.model.neume.quantitative.runningElaphronAndKentimataWithSupportingOligon,
  [QuantitativeNeume.IsonPlusApostrophos]: ($) =>
    $.model.neume.quantitative.isonAndApostrophos,
  [QuantitativeNeume.OligonKentimaMiddleKentimata]: ($) =>
    $.model.neume.quantitative.oligonWithKentimaAndKentimata,
  [QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft]: ($) =>
    $.model.neume.quantitative.oligonWithYpsiliAndKentimata,
  [QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight]: ($) =>
    $.model.neume.quantitative.oligonWithYpsiliAndKentimata,
  [QuantitativeNeume.VareiaDotted]: ($) => $.model.neume.quantitative.rest,
  [QuantitativeNeume.VareiaDotted2]: ($) => $.model.neume.quantitative.rest,
  [QuantitativeNeume.VareiaDotted3]: ($) => $.model.neume.quantitative.rest,
  [QuantitativeNeume.VareiaDotted4]: ($) => $.model.neume.quantitative.rest,
  [QuantitativeNeume.Cross]: ($) => $.model.neume.quantitative.cross,
  [QuantitativeNeume.Breath]: ($) => $.model.neume.quantitative.breath,
};

export const ROOT_SIGN_LABEL_SELECTORS: Record<RootSign, ModelSelector> = {
  [RootSign.Alpha]: ($) => $.model.neume.martyriaSign.ananes,
  [RootSign.SoftChromaticSquiggle]: ($) => $.model.neume.martyriaSign.neanes,
  [RootSign.SoftChromaticPaRootSign]: ($) =>
    $.model.neume.martyriaSign.softChromaticGa,
  [RootSign.Nana]: ($) => $.model.neume.martyriaSign.nana,
  [RootSign.Legetos]: ($) => $.model.neume.martyriaSign.legetos,
  [RootSign.DeltaDotted]: ($) => $.model.neume.martyriaSign.agia,
  [RootSign.Zygos]: ($) => $.model.neume.martyriaSign.zygos,
  [RootSign.AlphaDotted]: ($) => $.model.neume.martyriaSign.aneanes,
  [RootSign.Squiggle]: ($) => $.model.neume.martyriaSign.necheanes,
  [RootSign.Tilt]: ($) => $.model.neume.martyriaSign.nenano,
  [RootSign.Zo]: ($) => $.model.neume.martyriaSign.varys,
  [RootSign.Delta]: ($) => $.model.neume.martyriaSign.neagie,

  [RootSign.AlphaLow]: ($) => $.model.neume.martyriaSign.ananes,
  [RootSign.SoftChromaticSquiggleLow]: ($) => $.model.neume.martyriaSign.neanes,
  [RootSign.SoftChromaticPaRootSignLow]: ($) =>
    $.model.neume.martyriaSign.softChromaticGa,
  [RootSign.NanaLow]: ($) => $.model.neume.martyriaSign.nana,
  [RootSign.LegetosLow]: ($) => $.model.neume.martyriaSign.legetos,
  [RootSign.DeltaDottedLow]: ($) => $.model.neume.martyriaSign.agia,
  [RootSign.ZygosLow]: ($) => $.model.neume.martyriaSign.zygos,
  [RootSign.AlphaDottedLow]: ($) => $.model.neume.martyriaSign.aneanes,
  [RootSign.SquiggleLow]: ($) => $.model.neume.martyriaSign.necheanes,
  [RootSign.TiltLow]: ($) => $.model.neume.martyriaSign.nenano,
  [RootSign.ZoLow]: ($) => $.model.neume.martyriaSign.varys,
  [RootSign.DeltaLow]: ($) => $.model.neume.martyriaSign.neagie,
};

const TIME_NEUME_LABEL_SELECTORS: Record<TimeNeume, ModelSelector> = {
  [TimeNeume.Klasma_Top]: ($) => $.model.neume.time.klasma,
  [TimeNeume.Klasma_Bottom]: ($) => $.model.neume.time.klasma,
  [TimeNeume.Hapli]: ($) => $.model.neume.time.hapli,
  [TimeNeume.Dipli]: ($) => $.model.neume.time.dipli,
  [TimeNeume.Tripli]: ($) => $.model.neume.time.tripli,
  [TimeNeume.Tetrapli]: ($) => $.model.neume.time.tetrapli,
  [TimeNeume.Koronis]: ($) => $.model.neume.time.koronis,
};

const VOCAL_EXPRESSION_NEUME_LABEL_SELECTORS: Record<
  VocalExpressionNeume,
  ModelSelector
> = {
  [VocalExpressionNeume.Cross_Top]: ($) => $.model.neume.quantitative.cross,
  [VocalExpressionNeume.Vareia]: ($) => $.model.neume.vocalExpression.vareia,
  [VocalExpressionNeume.Homalon]: ($) => $.model.neume.vocalExpression.homalon,
  [VocalExpressionNeume.HomalonConnecting]: ($) =>
    $.model.neume.vocalExpression.connectingHomalon,
  [VocalExpressionNeume.Antikenoma]: ($) =>
    $.model.neume.vocalExpression.antikenoma,
  [VocalExpressionNeume.Psifiston]: ($) =>
    $.model.neume.vocalExpression.psifiston,
  [VocalExpressionNeume.PsifistonSlanted]: ($) =>
    $.model.neume.vocalExpression.psifiston,
  [VocalExpressionNeume.Heteron]: ($) => $.model.neume.vocalExpression.heteron,
  [VocalExpressionNeume.HeteronConnecting]: ($) =>
    $.model.neume.vocalExpression.connectingHeteron,
  [VocalExpressionNeume.HeteronConnectingLong]: ($) =>
    $.model.neume.vocalExpression.connectingHeteron,
  [VocalExpressionNeume.Endofonon]: ($) =>
    $.model.neume.vocalExpression.endofonon,
};

const GORGON_NEUME_LABEL_SELECTORS: Record<GorgonNeume, ModelSelector> = {
  [GorgonNeume.Gorgon_Top]: ($) => $.model.neume.gorgon.gorgon,
  [GorgonNeume.Gorgon_Bottom]: ($) => $.model.neume.gorgon.gorgon,
  [GorgonNeume.Digorgon]: ($) => $.model.neume.gorgon.digorgon,
  [GorgonNeume.Trigorgon]: ($) => $.model.neume.gorgon.trigorgon,
  [GorgonNeume.GorgonDottedLeft]: ($) => $.model.neume.gorgon.gorgon,
  [GorgonNeume.GorgonDottedRight]: ($) => $.model.neume.gorgon.gorgon,
  [GorgonNeume.DigorgonDottedLeft1]: ($) => $.model.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedLeft2]: ($) => $.model.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedRight]: ($) => $.model.neume.gorgon.digorgon,
  [GorgonNeume.TrigorgonDottedLeft1]: ($) => $.model.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedLeft2]: ($) => $.model.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedRight]: ($) => $.model.neume.gorgon.trigorgon,
  [GorgonNeume.GorgonSecondary]: ($) => $.model.neume.gorgon.gorgon,
  [GorgonNeume.GorgonDottedLeftSecondary]: ($) => $.model.neume.gorgon.gorgon,
  [GorgonNeume.GorgonDottedRightSecondary]: ($) => $.model.neume.gorgon.gorgon,
  [GorgonNeume.DigorgonSecondary]: ($) => $.model.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedLeft1Secondary]: ($) =>
    $.model.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedLeft2Secondary]: ($) =>
    $.model.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedRightSecondary]: ($) =>
    $.model.neume.gorgon.digorgon,
  [GorgonNeume.TrigorgonSecondary]: ($) => $.model.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedLeft1Secondary]: ($) =>
    $.model.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedLeft2Secondary]: ($) =>
    $.model.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedRightSecondary]: ($) =>
    $.model.neume.gorgon.trigorgon,
  [GorgonNeume.Argon]: ($) => $.model.neume.gorgon.argon,
  [GorgonNeume.Hemiolion]: ($) => $.model.neume.gorgon.hemiolion,
  [GorgonNeume.Diargon]: ($) => $.model.neume.gorgon.diargon,
};

const TEMPO_SIGN_LABEL_SELECTORS: Record<TempoSign, ModelSelector> = {
  [TempoSign.VerySlow]: ($) => $.model.neume.tempoSign.verySlow,
  [TempoSign.Slower]: ($) => $.model.neume.tempoSign.slower,
  [TempoSign.Slow]: ($) => $.model.neume.tempoSign.slow,
  [TempoSign.Medium]: ($) => $.model.neume.tempoSign.medium,
  [TempoSign.Moderate]: ($) => $.model.neume.tempoSign.moderate,
  [TempoSign.Quick]: ($) => $.model.neume.tempoSign.quick,
  [TempoSign.Quicker]: ($) => $.model.neume.tempoSign.quicker,
  [TempoSign.VeryQuick]: ($) => $.model.neume.tempoSign.veryQuick,
  [TempoSign.VerySlowAbove]: ($) => $.model.neume.tempoSign.verySlow,
  [TempoSign.SlowerAbove]: ($) => $.model.neume.tempoSign.slower,
  [TempoSign.SlowAbove]: ($) => $.model.neume.tempoSign.slow,
  [TempoSign.MediumAbove]: ($) => $.model.neume.tempoSign.medium,
  [TempoSign.ModerateAbove]: ($) => $.model.neume.tempoSign.moderate,
  [TempoSign.QuickAbove]: ($) => $.model.neume.tempoSign.quick,
  [TempoSign.QuickerAbove]: ($) => $.model.neume.tempoSign.quicker,
  [TempoSign.VeryQuickAbove]: ($) => $.model.neume.tempoSign.veryQuick,
};

const MODE_SIGN_LABEL_SELECTORS: Partial<Record<ModeSign, ModelSelector>> = {
  [ModeSign.Ni]: ($) => $.model.note.ni,
  [ModeSign.Pa]: ($) => $.model.note.pa,
  [ModeSign.Vou]: ($) => $.model.note.vou,
  [ModeSign.Ga]: ($) => $.model.note.ga,
  [ModeSign.Thi]: ($) => $.model.note.di,
  [ModeSign.Ke]: ($) => $.model.note.ke,
  [ModeSign.Zo]: ($) => $.model.note.zo,
  [ModeSign.First]: ($) => $.model.mode.first,
  [ModeSign.FirstCapital]: ($) => $.model.mode.first,
  [ModeSign.Second]: ($) => $.model.mode.second,
  [ModeSign.SecondCapital]: ($) => $.model.mode.second,
  [ModeSign.Third]: ($) => $.model.mode.third,
  [ModeSign.ThirdCapital]: ($) => $.model.mode.third,
  [ModeSign.Fourth]: ($) => $.model.mode.fourth,
  [ModeSign.FourthCapital]: ($) => $.model.mode.fourth,
  [ModeSign.Varys]: ($) => $.model.mode.grave,
  [ModeSign.Alpha]: ($) => $.model.neume.martyriaSign.ananes,
  [ModeSign.Nana]: ($) => $.model.neume.martyriaSign.nana,
  [ModeSign.VarysZo]: ($) => $.model.neume.martyriaSign.varys,
  [ModeSign.Delta]: ($) => $.model.neume.martyriaSign.neagie,
  [ModeSign.NanaOld]: ($) => $.model.neume.martyriaSign.nana,
  [ModeSign.Legetos]: ($) => $.model.neume.martyriaSign.legetos,
  [ModeSign.ElaphronPlusApostrophos]: ($) =>
    $.model.neume.quantitative.elaphronWithApostrophos,
  [ModeSign.Elaphron]: ($) => $.model.neume.quantitative.elaphron,
  [ModeSign.OligonPlusKentima]: ($) =>
    $.model.neume.quantitative.oligonWithKentima,
  [ModeSign.OligonPlusHypsili]: ($) =>
    $.model.neume.quantitative.oligonWithYpsili,
};

const MEASURE_BAR_LABEL_SELECTORS: Record<MeasureBar, ModelSelector> = {
  [MeasureBar.MeasureBarRight]: ($) => $.model.neume.measureBar.right,
  [MeasureBar.MeasureBarTop]: ($) => $.model.neume.measureBar.top,
  [MeasureBar.MeasureBarDouble]: ($) => $.model.neume.measureBar.double,
  [MeasureBar.MeasureBarShortDouble]: ($) =>
    $.model.neume.measureBar.shortDouble,
  [MeasureBar.MeasureBarTheseos]: ($) => $.model.neume.measureBar.theseos,
  [MeasureBar.MeasureBarShortTheseos]: ($) =>
    $.model.neume.measureBar.shortTheseos,
  [MeasureBar.MeasureBarRightAbove]: ($) => $.model.neume.measureBar.right,
  [MeasureBar.MeasureBarTopAbove]: ($) => $.model.neume.measureBar.top,
  [MeasureBar.MeasureBarDoubleAbove]: ($) => $.model.neume.measureBar.double,
  [MeasureBar.MeasureBarShortDoubleAbove]: ($) =>
    $.model.neume.measureBar.shortDouble,
  [MeasureBar.MeasureBarTheseosAbove]: ($) => $.model.neume.measureBar.theseos,
  [MeasureBar.MeasureBarShortTheseosAbove]: ($) =>
    $.model.neume.measureBar.shortTheseos,
};

const NOTE_INDICATOR_LABEL_SELECTORS: Record<NoteIndicator, ModelSelector> = {
  [NoteIndicator.Ni]: ($) => $.model.note.ni,
  [NoteIndicator.Pa]: ($) => $.model.note.pa,
  [NoteIndicator.Vou]: ($) => $.model.note.vou,
  [NoteIndicator.Ga]: ($) => $.model.note.ga,
  [NoteIndicator.Thi]: ($) => $.model.note.di,
  [NoteIndicator.Ke]: ($) => $.model.note.ke,
  [NoteIndicator.Zo]: ($) => $.model.note.zo,
};

const ISON_LABEL_SELECTORS: Partial<Record<Ison, ModelSelector>> = {
  [Ison.ThiLow]: ($) => $.model.note.diLow,
  [Ison.KeLow]: ($) => $.model.note.keLow,
  [Ison.Zo]: ($) => $.model.note.zo,
  [Ison.Ni]: ($) => $.model.note.ni,
  [Ison.Pa]: ($) => $.model.note.pa,
  [Ison.Vou]: ($) => $.model.note.vou,
  [Ison.Ga]: ($) => $.model.note.ga,
  [Ison.Thi]: ($) => $.model.note.di,
  [Ison.Ke]: ($) => $.model.note.ke,
  [Ison.ZoHigh]: ($) => $.model.note.zoHigh,
};

export function getNoteLabelSelector(note: Note | ScaleNote): ModelSelector {
  return NOTE_LABEL_SELECTORS[note];
}

export function getScaleLabelSelector(scale: Scale): ModelSelector {
  return SCALE_LABEL_SELECTORS[scale];
}

export function getFthoraLabelSelector(fthora: Fthora): ModelSelector {
  return FTHORA_LABEL_SELECTORS[fthora];
}

export function getQuantitativeNeumeLabelSelector(
  neume: QuantitativeNeume,
): ModelSelector {
  return QUANTITATIVE_NEUME_LABEL_SELECTORS[neume];
}

export function getTimeNeumeLabelSelector(neume: TimeNeume): ModelSelector {
  return TIME_NEUME_LABEL_SELECTORS[neume];
}

export function getVocalExpressionNeumeLabelSelector(
  neume: VocalExpressionNeume,
): ModelSelector {
  return VOCAL_EXPRESSION_NEUME_LABEL_SELECTORS[neume];
}

export function getGorgonNeumeLabelSelector(neume: GorgonNeume): ModelSelector {
  return GORGON_NEUME_LABEL_SELECTORS[neume];
}

export function getTempoSignLabelSelector(neume: TempoSign): ModelSelector {
  return TEMPO_SIGN_LABEL_SELECTORS[neume];
}

export function getModeSignLabelSelector(
  neume: ModeSign,
): ModelSelector | null {
  return MODE_SIGN_LABEL_SELECTORS[neume] ?? null;
}

export function getMeasureBarLabelSelector(neume: MeasureBar): ModelSelector {
  return MEASURE_BAR_LABEL_SELECTORS[neume];
}

export function getNoteIndicatorLabelSelector(
  neume: NoteIndicator,
): ModelSelector {
  return NOTE_INDICATOR_LABEL_SELECTORS[neume];
}

export function getIsonLabelSelector(neume: Ison): ModelSelector | null {
  return ISON_LABEL_SELECTORS[neume] ?? null;
}
