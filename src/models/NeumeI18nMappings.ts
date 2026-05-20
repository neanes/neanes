import { SelectorParam } from 'i18next';

import {
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  ModeSign,
  Neume,
  Note,
  NoteIndicator,
  QuantitativeNeume,
  RootSign,
  TempoSign,
  TimeNeume,
  VocalExpressionNeume,
} from './Neumes';
import { Scale, ScaleNote } from './Scales';

export type ModelSelector = SelectorParam<'model'>;

export const NOTE_LABEL_SELECTORS: Record<Note | ScaleNote, ModelSelector> = {
  [Note.ZoLow]: ($) => $.note.zoLow,
  [Note.NiLow]: ($) => $.note.niLow,
  [Note.PaLow]: ($) => $.note.paLow,
  [Note.VouLow]: ($) => $.note.vouLow,
  [Note.GaLow]: ($) => $.note.gaLow,
  [Note.ThiLow]: ($) => $.note.diLow,
  [Note.KeLow]: ($) => $.note.keLow,
  [Note.Zo]: ($) => $.note.zo,
  [Note.Ni]: ($) => $.note.ni,
  [Note.Pa]: ($) => $.note.pa,
  [Note.Vou]: ($) => $.note.vou,
  [Note.Ga]: ($) => $.note.ga,
  [Note.Thi]: ($) => $.note.di,
  [Note.Ke]: ($) => $.note.ke,
  [Note.ZoHigh]: ($) => $.note.zoHigh,
  [Note.NiHigh]: ($) => $.note.niHigh,
  [Note.PaHigh]: ($) => $.note.paHigh,
  [Note.VouHigh]: ($) => $.note.vouHigh,
  [Note.GaHigh]: ($) => $.note.gaHigh,
  [Note.ThiHigh]: ($) => $.note.diHigh,
  [Note.KeHigh]: ($) => $.note.keHigh,
};

const SCALE_LABEL_SELECTORS: Record<Scale, ModelSelector> = {
  [Scale.Diatonic]: ($) => $.scale.diatonic,
  [Scale.SoftChromatic]: ($) => $.scale.softChromatic,
  [Scale.HardChromatic]: ($) => $.scale.hardChromatic,
  [Scale.EnharmonicGa]: ($) => $.scale.enharmonicGa,
  [Scale.EnharmonicZoHigh]: ($) => $.scale.enharmonicZoHigh,
  [Scale.EnharmonicVou]: ($) => $.scale.enharmonicVou,
  [Scale.EnharmonicZo]: ($) => $.scale.enharmonicZo,
  [Scale.EnharmonicVouHigh]: ($) => $.scale.enharmonicVouHigh,
  [Scale.Zygos]: ($) => $.scale.zygos,
  [Scale.Spathi]: ($) => $.scale.spathi,
  [Scale.SpathiGa]: ($) => $.scale.spathiGa,
  [Scale.Kliton]: ($) => $.scale.kliton,
};

const FTHORA_LABEL_SELECTORS: Record<Fthora, ModelSelector> = {
  [Fthora.DiatonicNiLow_Top]: ($) => $.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa_Top]: ($) => $.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou_Top]: ($) => $.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa_Top]: ($) => $.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi_Top]: ($) => $.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe_Top]: ($) => $.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo_Top]: ($) => $.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh_Top]: ($) => $.neume.fthora.diatonicNiHigh,
  [Fthora.SoftChromaticThi_Top]: ($) => $.neume.fthora.softChromaticDi,
  [Fthora.SoftChromaticPa_Top]: ($) => $.neume.fthora.softChromaticGa,
  [Fthora.HardChromaticPa_Top]: ($) => $.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi_Top]: ($) => $.neume.fthora.hardChromaticDi,
  [Fthora.Enharmonic_Top]: ($) => $.neume.fthora.enharmonic,
  [Fthora.GeneralFlat_Top]: ($) => $.neume.fthora.generalFlat,
  [Fthora.GeneralSharp_Top]: ($) => $.neume.fthora.generalSharp,
  [Fthora.Zygos_Top]: ($) => $.neume.fthora.zygos,
  [Fthora.Kliton_Top]: ($) => $.neume.fthora.kliton,
  [Fthora.Spathi_Top]: ($) => $.neume.fthora.spathi,
  [Fthora.DiatonicNiLow_TopSecondary]: ($) => $.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa_TopSecondary]: ($) => $.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou_TopSecondary]: ($) => $.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa_TopSecondary]: ($) => $.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi_TopSecondary]: ($) => $.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe_TopSecondary]: ($) => $.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo_TopSecondary]: ($) => $.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh_TopSecondary]: ($) => $.neume.fthora.diatonicNiHigh,
  [Fthora.HardChromaticPa_TopSecondary]: ($) => $.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi_TopSecondary]: ($) => $.neume.fthora.hardChromaticDi,
  [Fthora.SoftChromaticPa_TopSecondary]: ($) => $.neume.fthora.softChromaticGa,
  [Fthora.SoftChromaticThi_TopSecondary]: ($) => $.neume.fthora.softChromaticDi,
  [Fthora.Enharmonic_TopSecondary]: ($) => $.neume.fthora.enharmonic,
  [Fthora.Zygos_TopSecondary]: ($) => $.neume.fthora.zygos,
  [Fthora.Kliton_TopSecondary]: ($) => $.neume.fthora.kliton,
  [Fthora.Spathi_TopSecondary]: ($) => $.neume.fthora.spathi,
  [Fthora.DiatonicNiLow_TopTertiary]: ($) => $.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa_TopTertiary]: ($) => $.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou_TopTertiary]: ($) => $.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa_TopTertiary]: ($) => $.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi_TopTertiary]: ($) => $.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe_TopTertiary]: ($) => $.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo_TopTertiary]: ($) => $.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh_TopTertiary]: ($) => $.neume.fthora.diatonicNiHigh,
  [Fthora.HardChromaticPa_TopTertiary]: ($) => $.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi_TopTertiary]: ($) => $.neume.fthora.hardChromaticDi,
  [Fthora.SoftChromaticPa_TopTertiary]: ($) => $.neume.fthora.softChromaticGa,
  [Fthora.SoftChromaticThi_TopTertiary]: ($) => $.neume.fthora.softChromaticDi,
  [Fthora.Enharmonic_TopTertiary]: ($) => $.neume.fthora.enharmonic,
  [Fthora.Zygos_TopTertiary]: ($) => $.neume.fthora.zygos,
  [Fthora.Kliton_TopTertiary]: ($) => $.neume.fthora.kliton,
  [Fthora.Spathi_TopTertiary]: ($) => $.neume.fthora.spathi,
  [Fthora.DiatonicNiLow_Bottom]: ($) => $.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa_Bottom]: ($) => $.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou_Bottom]: ($) => $.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa_Bottom]: ($) => $.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi_Bottom]: ($) => $.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe_Bottom]: ($) => $.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo_Bottom]: ($) => $.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh_Bottom]: ($) => $.neume.fthora.diatonicNiHigh,
  [Fthora.HardChromaticPa_Bottom]: ($) => $.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi_Bottom]: ($) => $.neume.fthora.hardChromaticDi,
  [Fthora.SoftChromaticPa_Bottom]: ($) => $.neume.fthora.softChromaticGa,
  [Fthora.SoftChromaticThi_Bottom]: ($) => $.neume.fthora.softChromaticDi,
  [Fthora.Enharmonic_Bottom]: ($) => $.neume.fthora.enharmonic,
  [Fthora.Zygos_Bottom]: ($) => $.neume.fthora.zygos,
  [Fthora.Kliton_Bottom]: ($) => $.neume.fthora.kliton,
  [Fthora.Spathi_Bottom]: ($) => $.neume.fthora.spathi,
  [Fthora.GeneralSharp_TopSecondary]: ($) => $.neume.fthora.generalSharp,
  [Fthora.GeneralSharp_TopTertiary]: ($) => $.neume.fthora.generalSharp,
  [Fthora.GeneralSharp_Bottom]: ($) => $.neume.fthora.generalSharp,
  [Fthora.GeneralFlat_TopSecondary]: ($) => $.neume.fthora.generalFlat,
  [Fthora.GeneralFlat_TopTertiary]: ($) => $.neume.fthora.generalFlat,
  [Fthora.GeneralFlat_Bottom]: ($) => $.neume.fthora.generalFlat,
  [Fthora.DiatonicNiLow]: ($) => $.neume.fthora.diatonicNiLow,
  [Fthora.DiatonicPa]: ($) => $.neume.fthora.diatonicPa,
  [Fthora.DiatonicVou]: ($) => $.neume.fthora.diatonicVou,
  [Fthora.DiatonicGa]: ($) => $.neume.fthora.diatonicGa,
  [Fthora.DiatonicThi]: ($) => $.neume.fthora.diatonicDi,
  [Fthora.DiatonicKe]: ($) => $.neume.fthora.diatonicKe,
  [Fthora.DiatonicZo]: ($) => $.neume.fthora.diatonicZo,
  [Fthora.DiatonicNiHigh]: ($) => $.neume.fthora.diatonicNiHigh,
  [Fthora.HardChromaticPa]: ($) => $.neume.fthora.hardChromaticPa,
  [Fthora.HardChromaticThi]: ($) => $.neume.fthora.hardChromaticDi,
  [Fthora.SoftChromaticPa]: ($) => $.neume.fthora.softChromaticGa,
  [Fthora.SoftChromaticThi]: ($) => $.neume.fthora.softChromaticDi,
  [Fthora.Enharmonic]: ($) => $.neume.fthora.enharmonic,
  [Fthora.Zygos]: ($) => $.neume.fthora.zygos,
  [Fthora.Kliton]: ($) => $.neume.fthora.kliton,
  [Fthora.Spathi]: ($) => $.neume.fthora.spathi,
};

const QUANTITATIVE_NEUME_LABEL_SELECTORS: Record<
  QuantitativeNeume,
  ModelSelector
> = {
  [QuantitativeNeume.Ison]: ($) => $.neume.quantitative.ison,
  [QuantitativeNeume.Oligon]: ($) => $.neume.quantitative.oligon,
  [QuantitativeNeume.OligonPlusKentima]: ($) =>
    $.neume.quantitative.oligonWithKentima,
  [QuantitativeNeume.OligonPlusKentimaBelow]: ($) =>
    $.neume.quantitative.oligonWithKentima,
  [QuantitativeNeume.OligonPlusKentimaAbove]: ($) =>
    $.neume.quantitative.oligonWithKentima,
  [QuantitativeNeume.OligonPlusHypsiliRight]: ($) =>
    $.neume.quantitative.oligonWithYpsili,
  [QuantitativeNeume.OligonPlusHypsiliLeft]: ($) =>
    $.neume.quantitative.oligonWithYpsili,
  [QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal]: ($) =>
    $.neume.quantitative.oligonWithYpsiliAndKentima,
  [QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical]: ($) =>
    $.neume.quantitative.oligonWithYpsiliAndKentima,
  [QuantitativeNeume.OligonPlusDoubleHypsili]: ($) =>
    $.neume.quantitative.oligonWithDoubleYpsili,
  [QuantitativeNeume.OligonKentimataDoubleYpsili]: ($) =>
    $.neume.quantitative.oligonWithKentimataAndDoubleYpsili,
  [QuantitativeNeume.OligonKentimaDoubleYpsiliRight]: ($) =>
    $.neume.quantitative.oligonWithKentimaAndDoubleYpsili,
  [QuantitativeNeume.OligonKentimaDoubleYpsiliLeft]: ($) =>
    $.neume.quantitative.oligonWithKentimaAndDoubleYpsili,
  [QuantitativeNeume.OligonTripleYpsili]: ($) =>
    $.neume.quantitative.oligonWithTripleYpsili,
  [QuantitativeNeume.OligonKentimataTripleYpsili]: ($) =>
    $.neume.quantitative.oligonWithKentimataAndTripleYpsili,
  [QuantitativeNeume.OligonKentimaTripleYpsili]: ($) =>
    $.neume.quantitative.oligonWithKentimaAndTripleYpsili,
  [QuantitativeNeume.PetastiWithIson]: ($) =>
    $.neume.quantitative.petastiWithIson,
  [QuantitativeNeume.Petasti]: ($) => $.neume.quantitative.petasti,
  [QuantitativeNeume.PetastiPlusOligon]: ($) =>
    $.neume.quantitative.petastiWithOligon,
  [QuantitativeNeume.PetastiPlusKentimaAbove]: ($) =>
    $.neume.quantitative.petastiWithKentima,
  [QuantitativeNeume.PetastiPlusHypsiliRight]: ($) =>
    $.neume.quantitative.petastiWithYpsili,
  [QuantitativeNeume.PetastiPlusHypsiliLeft]: ($) =>
    $.neume.quantitative.petastiWithYpsili,
  [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal]: ($) =>
    $.neume.quantitative.petastiWithYpsiliAndKentima,
  [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical]: ($) =>
    $.neume.quantitative.petastiWithYpsiliAndKentima,
  [QuantitativeNeume.PetastiPlusDoubleHypsili]: ($) =>
    $.neume.quantitative.petastiWithDoubleYpsili,
  [QuantitativeNeume.PetastiKentimataDoubleYpsili]: ($) =>
    $.neume.quantitative.petastiWithKentimataAndDoubleYpsili,
  [QuantitativeNeume.PetastiKentimaDoubleYpsiliRight]: ($) =>
    $.neume.quantitative.petastiWithKentimaAndDoubleYpsili,
  [QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft]: ($) =>
    $.neume.quantitative.petastiWithKentimaAndDoubleYpsili,
  [QuantitativeNeume.PetastiTripleYpsili]: ($) =>
    $.neume.quantitative.petastiWithTripleYpsili,
  [QuantitativeNeume.PetastiKentimataTripleYpsili]: ($) =>
    $.neume.quantitative.petastiWithKentimataAndTripleYpsili,
  [QuantitativeNeume.PetastiKentimaTripleYpsili]: ($) =>
    $.neume.quantitative.petastiWithKentimaAndTripleYpsili,
  [QuantitativeNeume.Apostrophos]: ($) => $.neume.quantitative.apostrophos,
  [QuantitativeNeume.Elaphron]: ($) => $.neume.quantitative.elaphron,
  [QuantitativeNeume.ElaphronPlusApostrophos]: ($) =>
    $.neume.quantitative.elaphronWithApostrophos,
  [QuantitativeNeume.Hamili]: ($) => $.neume.quantitative.hamili,
  [QuantitativeNeume.HamiliPlusApostrophos]: ($) =>
    $.neume.quantitative.hamiliWithApostrophos,
  [QuantitativeNeume.HamiliPlusElaphron]: ($) =>
    $.neume.quantitative.hamiliWithElaphron,
  [QuantitativeNeume.HamiliPlusElaphronPlusApostrophos]: ($) =>
    $.neume.quantitative.hamiliWithElaphronAndApostrophos,
  [QuantitativeNeume.DoubleHamili]: ($) => $.neume.quantitative.doubleHamili,
  [QuantitativeNeume.DoubleHamiliApostrofos]: ($) =>
    $.neume.quantitative.doubleHamiliWithApostrophos,
  [QuantitativeNeume.DoubleHamiliElafron]: ($) =>
    $.neume.quantitative.doubleHamiliWithElaphron,
  [QuantitativeNeume.DoubleHamiliElafronApostrofos]: ($) =>
    $.neume.quantitative.doubleHamiliWithElaphronAndApostrophos,
  [QuantitativeNeume.TripleHamili]: ($) => $.neume.quantitative.tripleHamili,
  [QuantitativeNeume.PetastiPlusApostrophos]: ($) =>
    $.neume.quantitative.petastiWithApostrophos,
  [QuantitativeNeume.PetastiPlusElaphron]: ($) =>
    $.neume.quantitative.petastiWithElaphron,
  [QuantitativeNeume.PetastiPlusElaphronPlusApostrophos]: ($) =>
    $.neume.quantitative.petastiWithElaphronAndApostrophos,
  [QuantitativeNeume.PetastiHamili]: ($) =>
    $.neume.quantitative.petastiWithHamili,
  [QuantitativeNeume.PetastiHamiliApostrofos]: ($) =>
    $.neume.quantitative.petastiWithHamiliAndApostrophos,
  [QuantitativeNeume.PetastiHamiliElafron]: ($) =>
    $.neume.quantitative.petastiWithHamiliAndElaphron,
  [QuantitativeNeume.PetastiHamiliElafronApostrofos]: ($) =>
    $.neume.quantitative.petastiWithHamiliElaphronAndApostrophos,
  [QuantitativeNeume.PetastiDoubleHamili]: ($) =>
    $.neume.quantitative.petastiWithDoubleHamili,
  [QuantitativeNeume.PetastiDoubleHamiliApostrofos]: ($) =>
    $.neume.quantitative.petastiWithDoubleHamiliAndApostrophos,
  [QuantitativeNeume.OligonPlusKentemata]: ($) =>
    $.neume.quantitative.oligonAndKentimata,
  [QuantitativeNeume.KentemataPlusOligon]: ($) =>
    $.neume.quantitative.kentimataAndOligon,
  [QuantitativeNeume.OligonPlusIsonPlusKentemata]: ($) =>
    $.neume.quantitative.isonAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusApostrophosPlusKentemata]: ($) =>
    $.neume.quantitative.apostrophosAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusHyporoePlusKentemata]: ($) =>
    $.neume.quantitative.yporoeAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusElaphronPlusKentemata]: ($) =>
    $.neume.quantitative.elaphronAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata]: ($) =>
    $.neume.quantitative
      .elaphronWithApostrophosAndKentimataWithSupportingOligon,
  [QuantitativeNeume.OligonPlusHamiliPlusKentemata]: ($) =>
    $.neume.quantitative.hamiliAndKentimataWithSupportingOligon,
  [QuantitativeNeume.RunningElaphron]: ($) =>
    $.neume.quantitative.runningElaphron,
  [QuantitativeNeume.Hyporoe]: ($) => $.neume.quantitative.yporoe,
  [QuantitativeNeume.PetastiPlusRunningElaphron]: ($) =>
    $.neume.quantitative.petastiWithRunningElaphron,
  [QuantitativeNeume.PetastiPlusHyporoe]: ($) =>
    $.neume.quantitative.petastiWithYporoe,
  [QuantitativeNeume.OligonPlusIson]: ($) =>
    $.neume.quantitative.isonWithSupportingOligon,
  [QuantitativeNeume.OligonPlusApostrophos]: ($) =>
    $.neume.quantitative.apostrophosWithSupportingOligon,
  [QuantitativeNeume.OligonPlusElaphron]: ($) =>
    $.neume.quantitative.elaphronWithSupportingOligon,
  [QuantitativeNeume.OligonPlusHyporoe]: ($) =>
    $.neume.quantitative.yporoeWithSupportingOligon,
  [QuantitativeNeume.OligonPlusElaphronPlusApostrophos]: ($) =>
    $.neume.quantitative.elaphronWithApostrophosAndSupportingOligon,
  [QuantitativeNeume.OligonPlusHamili]: ($) =>
    $.neume.quantitative.hamiliWithSupportingOligon,
  [QuantitativeNeume.Kentima]: ($) => $.neume.quantitative.kentima,
  [QuantitativeNeume.Kentemata]: ($) => $.neume.quantitative.kentimata,
  [QuantitativeNeume.DoubleApostrophos]: ($) =>
    $.neume.quantitative.doubleApostrophos,
  [QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata]: ($) =>
    $.neume.quantitative.runningElaphronAndKentimataWithSupportingOligon,
  [QuantitativeNeume.IsonPlusApostrophos]: ($) =>
    $.neume.quantitative.isonAndApostrophos,
  [QuantitativeNeume.OligonKentimaMiddleKentimata]: ($) =>
    $.neume.quantitative.oligonWithKentimaAndKentimata,
  [QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft]: ($) =>
    $.neume.quantitative.oligonWithYpsiliAndKentimata,
  [QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight]: ($) =>
    $.neume.quantitative.oligonWithYpsiliAndKentimata,
  [QuantitativeNeume.VareiaDotted]: ($) => $.neume.quantitative.rest,
  [QuantitativeNeume.VareiaDotted2]: ($) => $.neume.quantitative.rest,
  [QuantitativeNeume.VareiaDotted3]: ($) => $.neume.quantitative.rest,
  [QuantitativeNeume.VareiaDotted4]: ($) => $.neume.quantitative.rest,
  [QuantitativeNeume.Cross]: ($) => $.neume.quantitative.cross,
  [QuantitativeNeume.Breath]: ($) => $.neume.quantitative.breath,
};

export const ROOT_SIGN_LABEL_SELECTORS: Record<RootSign, ModelSelector> = {
  [RootSign.Alpha]: ($) => $.neume.rootSign.ananes,
  [RootSign.SoftChromaticSquiggle]: ($) => $.neume.rootSign.neanes,
  [RootSign.SoftChromaticPaRootSign]: ($) => $.neume.rootSign.softChromaticGa,
  [RootSign.Nana]: ($) => $.neume.rootSign.nana,
  [RootSign.Legetos]: ($) => $.neume.rootSign.legetos,
  [RootSign.DeltaDotted]: ($) => $.neume.rootSign.agia,
  [RootSign.Zygos]: ($) => $.neume.rootSign.zygos,
  [RootSign.AlphaDotted]: ($) => $.neume.rootSign.aneanes,
  [RootSign.Squiggle]: ($) => $.neume.rootSign.necheanes,
  [RootSign.Tilt]: ($) => $.neume.rootSign.nenano,
  [RootSign.Zo]: ($) => $.neume.rootSign.varys,
  [RootSign.Delta]: ($) => $.neume.rootSign.neagie,

  [RootSign.AlphaLow]: ($) => $.neume.rootSign.ananes,
  [RootSign.SoftChromaticSquiggleLow]: ($) => $.neume.rootSign.neanes,
  [RootSign.SoftChromaticPaRootSignLow]: ($) =>
    $.neume.rootSign.softChromaticGa,
  [RootSign.NanaLow]: ($) => $.neume.rootSign.nana,
  [RootSign.LegetosLow]: ($) => $.neume.rootSign.legetos,
  [RootSign.DeltaDottedLow]: ($) => $.neume.rootSign.agia,
  [RootSign.ZygosLow]: ($) => $.neume.rootSign.zygos,
  [RootSign.AlphaDottedLow]: ($) => $.neume.rootSign.aneanes,
  [RootSign.SquiggleLow]: ($) => $.neume.rootSign.necheanes,
  [RootSign.TiltLow]: ($) => $.neume.rootSign.nenano,
  [RootSign.ZoLow]: ($) => $.neume.rootSign.varys,
  [RootSign.DeltaLow]: ($) => $.neume.rootSign.neagie,
};

const NEUME_LABEL_SELECTORS: Partial<Record<string, ModelSelector>> = {
  ...FTHORA_LABEL_SELECTORS,
  ...QUANTITATIVE_NEUME_LABEL_SELECTORS,
  ...NOTE_LABEL_SELECTORS,
  ...ROOT_SIGN_LABEL_SELECTORS,
  [TimeNeume.Klasma_Top]: ($) => $.neume.time.klasma,
  [TimeNeume.Klasma_Bottom]: ($) => $.neume.time.klasma,
  [TimeNeume.Hapli]: ($) => $.neume.time.hapli,
  [TimeNeume.Dipli]: ($) => $.neume.time.dipli,
  [TimeNeume.Tripli]: ($) => $.neume.time.tripli,
  [TimeNeume.Tetrapli]: ($) => $.neume.time.tetrapli,
  [TimeNeume.Koronis]: ($) => $.neume.time.koronis,
  [VocalExpressionNeume.Cross_Top]: ($) => $.neume.quantitative.cross,
  [GorgonNeume.Gorgon_Top]: ($) => $.neume.gorgon.gorgon,
  [GorgonNeume.Gorgon_Bottom]: ($) => $.neume.gorgon.gorgon,
  [GorgonNeume.Digorgon]: ($) => $.neume.gorgon.digorgon,
  [GorgonNeume.Trigorgon]: ($) => $.neume.gorgon.trigorgon,
  [GorgonNeume.GorgonDottedLeft]: ($) => $.neume.gorgon.gorgon,
  [GorgonNeume.GorgonDottedRight]: ($) => $.neume.gorgon.gorgon,
  [GorgonNeume.DigorgonDottedLeft1]: ($) => $.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedLeft2]: ($) => $.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedRight]: ($) => $.neume.gorgon.digorgon,
  [GorgonNeume.TrigorgonDottedLeft1]: ($) => $.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedLeft2]: ($) => $.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedRight]: ($) => $.neume.gorgon.trigorgon,
  [GorgonNeume.GorgonSecondary]: ($) => $.neume.gorgon.gorgon,
  [GorgonNeume.GorgonDottedLeftSecondary]: ($) => $.neume.gorgon.gorgon,
  [GorgonNeume.GorgonDottedRightSecondary]: ($) => $.neume.gorgon.gorgon,
  [GorgonNeume.DigorgonSecondary]: ($) => $.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedLeft1Secondary]: ($) => $.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedLeft2Secondary]: ($) => $.neume.gorgon.digorgon,
  [GorgonNeume.DigorgonDottedRightSecondary]: ($) => $.neume.gorgon.digorgon,
  [GorgonNeume.TrigorgonSecondary]: ($) => $.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedLeft1Secondary]: ($) => $.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedLeft2Secondary]: ($) => $.neume.gorgon.trigorgon,
  [GorgonNeume.TrigorgonDottedRightSecondary]: ($) => $.neume.gorgon.trigorgon,
  [GorgonNeume.Argon]: ($) => $.neume.gorgon.argon,
  [GorgonNeume.Hemiolion]: ($) => $.neume.gorgon.hemiolion,
  [GorgonNeume.Diargon]: ($) => $.neume.gorgon.diargon,
  [VocalExpressionNeume.Vareia]: ($) => $.neume.vocalExpression.vareia,
  [VocalExpressionNeume.Homalon]: ($) => $.neume.vocalExpression.homalon,
  [VocalExpressionNeume.HomalonConnecting]: ($) =>
    $.neume.vocalExpression.connectingHomalon,
  [VocalExpressionNeume.Antikenoma]: ($) => $.neume.vocalExpression.antikenoma,
  [VocalExpressionNeume.Psifiston]: ($) => $.neume.vocalExpression.psifiston,
  [VocalExpressionNeume.PsifistonSlanted]: ($) =>
    $.neume.vocalExpression.psifiston,
  [VocalExpressionNeume.Heteron]: ($) => $.neume.vocalExpression.heteron,
  [VocalExpressionNeume.HeteronConnecting]: ($) =>
    $.neume.vocalExpression.connectingHeteron,
  [VocalExpressionNeume.HeteronConnectingLong]: ($) =>
    $.neume.vocalExpression.connectingHeteron,
  [VocalExpressionNeume.Endofonon]: ($) => $.neume.vocalExpression.endofonon,
  [TempoSign.VerySlow]: ($) => $.neume.tempoSign.verySlow,
  [TempoSign.Slower]: ($) => $.neume.tempoSign.slower,
  [TempoSign.Slow]: ($) => $.neume.tempoSign.slow,
  [TempoSign.Medium]: ($) => $.neume.tempoSign.medium,
  [TempoSign.Moderate]: ($) => $.neume.tempoSign.moderate,
  [TempoSign.Quick]: ($) => $.neume.tempoSign.quick,
  [TempoSign.Quicker]: ($) => $.neume.tempoSign.quicker,
  [TempoSign.VeryQuick]: ($) => $.neume.tempoSign.veryQuick,
  [TempoSign.VerySlowAbove]: ($) => $.neume.tempoSign.verySlow,
  [TempoSign.SlowerAbove]: ($) => $.neume.tempoSign.slower,
  [TempoSign.SlowAbove]: ($) => $.neume.tempoSign.slow,
  [TempoSign.MediumAbove]: ($) => $.neume.tempoSign.medium,
  [TempoSign.ModerateAbove]: ($) => $.neume.tempoSign.moderate,
  [TempoSign.QuickAbove]: ($) => $.neume.tempoSign.quick,
  [TempoSign.QuickerAbove]: ($) => $.neume.tempoSign.quicker,
  [TempoSign.VeryQuickAbove]: ($) => $.neume.tempoSign.veryQuick,
  [ModeSign.Ni]: ($) => $.note.ni,
  [ModeSign.Pa]: ($) => $.note.pa,
  [ModeSign.Vou]: ($) => $.note.vou,
  [ModeSign.Ga]: ($) => $.note.ga,
  [ModeSign.Thi]: ($) => $.note.di,
  [ModeSign.Ke]: ($) => $.note.ke,
  [ModeSign.Zo]: ($) => $.note.zo,
  [ModeSign.First]: ($) => $.mode.first,
  [ModeSign.FirstCapital]: ($) => $.mode.first,
  [ModeSign.Second]: ($) => $.mode.second,
  [ModeSign.SecondCapital]: ($) => $.mode.second,
  [ModeSign.Third]: ($) => $.mode.third,
  [ModeSign.ThirdCapital]: ($) => $.mode.third,
  [ModeSign.Fourth]: ($) => $.mode.fourth,
  [ModeSign.FourthCapital]: ($) => $.mode.fourth,
  [ModeSign.Varys]: ($) => $.mode.grave,
  [ModeSign.Alpha]: ($) => $.neume.rootSign.ananes,
  [ModeSign.Nana]: ($) => $.neume.rootSign.nana,
  [ModeSign.VarysZo]: ($) => $.neume.rootSign.varys,
  [ModeSign.Delta]: ($) => $.neume.rootSign.neagie,
  [ModeSign.NanaOld]: ($) => $.neume.rootSign.nana,
  [ModeSign.Legetos]: ($) => $.neume.rootSign.legetos,
  [ModeSign.ElaphronPlusApostrophos]: ($) =>
    $.neume.quantitative.elaphronWithApostrophos,
  [ModeSign.Elaphron]: ($) => $.neume.quantitative.elaphron,
  [ModeSign.OligonPlusKentima]: ($) => $.neume.quantitative.oligonWithKentima,
  [ModeSign.OligonPlusHypsili]: ($) => $.neume.quantitative.oligonWithYpsili,
  [MeasureBar.MeasureBarRight]: ($) => $.neume.measureBar.right,
  [MeasureBar.MeasureBarTop]: ($) => $.neume.measureBar.top,
  [MeasureBar.MeasureBarDouble]: ($) => $.neume.measureBar.double,
  [MeasureBar.MeasureBarShortDouble]: ($) => $.neume.measureBar.shortDouble,
  [MeasureBar.MeasureBarTheseos]: ($) => $.neume.measureBar.theseos,
  [MeasureBar.MeasureBarShortTheseos]: ($) => $.neume.measureBar.shortTheseos,
  [MeasureBar.MeasureBarRightAbove]: ($) => $.neume.measureBar.right,
  [MeasureBar.MeasureBarTopAbove]: ($) => $.neume.measureBar.top,
  [MeasureBar.MeasureBarDoubleAbove]: ($) => $.neume.measureBar.double,
  [MeasureBar.MeasureBarShortDoubleAbove]: ($) =>
    $.neume.measureBar.shortDouble,
  [MeasureBar.MeasureBarTheseosAbove]: ($) => $.neume.measureBar.theseos,
  [MeasureBar.MeasureBarShortTheseosAbove]: ($) =>
    $.neume.measureBar.shortTheseos,
  [NoteIndicator.Ni]: ($) => $.note.ni,
  [NoteIndicator.Pa]: ($) => $.note.pa,
  [NoteIndicator.Vou]: ($) => $.note.vou,
  [NoteIndicator.Ga]: ($) => $.note.ga,
  [NoteIndicator.Thi]: ($) => $.note.di,
  [NoteIndicator.Ke]: ($) => $.note.ke,
  [NoteIndicator.Zo]: ($) => $.note.zo,
  [Ison.Unison]: ($) => $.neume.quantitative.ison,
  [Ison.ThiLow]: ($) => $.note.diLow,
  [Ison.KeLow]: ($) => $.note.keLow,
  [Ison.Zo]: ($) => $.note.zo,
  [Ison.Ni]: ($) => $.note.ni,
  [Ison.Pa]: ($) => $.note.pa,
  [Ison.Vou]: ($) => $.note.vou,
  [Ison.Ga]: ($) => $.note.ga,
  [Ison.Thi]: ($) => $.note.di,
  [Ison.Ke]: ($) => $.note.ke,
  [Ison.ZoHigh]: ($) => $.note.zoHigh,
};

export function getNoteLabelSelector(note: Note | ScaleNote) {
  return NOTE_LABEL_SELECTORS[note];
}

export function getScaleLabelSelector(scale: Scale) {
  return SCALE_LABEL_SELECTORS[scale];
}

export function getFthoraLabelSelector(neume: Neume) {
  return FTHORA_LABEL_SELECTORS[neume as Fthora] ?? null;
}

export function getQuantitativeNeumeLabelSelector(neume: QuantitativeNeume) {
  return QUANTITATIVE_NEUME_LABEL_SELECTORS[neume];
}

export function getNeumeLabelSelector(neume: Neume) {
  return NEUME_LABEL_SELECTORS[neume] ?? null;
}
