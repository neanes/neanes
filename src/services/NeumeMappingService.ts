import {
  Neume,
  TimeNeume,
  QuantitativeNeume,
  Fthora,
  Accidental,
  TempoSign,
  VocalExpressionNeume,
  RootSign,
  Note,
  GorgonNeume,
  ModeSign,
  MeasureBar,
  MeasureNumber,
  NoteIndicator,
  Ison,
} from '@/models/Neumes';

import glyphnames from '@/assets/fonts/sbmufl/glyphnames.json';

export type SbmuflGlyphName = keyof typeof glyphnames;

export interface NeumeMapping {
  glyphName: SbmuflGlyphName;
  text: string;
  salt?: number;
}

// Create mapping from glyph name to codepoint
const glyphNameToCodepointMap = new Map<string, string>();

for (let glyph in glyphnames) {
  const data: { codepoint: string } = (glyphnames as any)[glyph];
  const codepoint = Number('0x' + data.codepoint.substring(2));
  glyphNameToCodepointMap.set(glyph, String.fromCodePoint(codepoint));
}

function mapNeumeToSbmufl(
  neume: Neume,
  glyphName: SbmuflGlyphName,
  salt?: number,
) {
  neumeToSbmuflGlyphMap.set(neume, {
    glyphName,
    salt,
    text: glyphNameToCodepointMap.get(glyphName)!,
  });
}

const neumeToSbmuflGlyphMap = new Map<Neume, NeumeMapping>();

mapNeumeToSbmufl(QuantitativeNeume.Ison, 'ison');
mapNeumeToSbmufl(QuantitativeNeume.Oligon, 'oligon');
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusKentimaBelow,
  'oligonKentimaBelow',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusKentimaAbove,
  'oligonKentimaAbove',
);
mapNeumeToSbmufl(QuantitativeNeume.OligonPlusHypsiliRight, 'oligonYpsiliRight');
mapNeumeToSbmufl(QuantitativeNeume.OligonPlusHypsiliLeft, 'oligonYpsiliLeft');
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
  'oligonKentimaYpsiliRight',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
  'oligonKentimaYpsiliMiddle',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusDoubleHypsili,
  'oligonDoubleYpsili',
);
mapNeumeToSbmufl(QuantitativeNeume.PetastiWithIson, 'petastiIson');
mapNeumeToSbmufl(QuantitativeNeume.Petasti, 'petasti');
mapNeumeToSbmufl(QuantitativeNeume.PetastiPlusOligon, 'petastiOligon');
mapNeumeToSbmufl(QuantitativeNeume.PetastiPlusKentimaAbove, 'petastiKentima');
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiPlusHypsiliRight,
  'petastiYpsiliRight',
);
mapNeumeToSbmufl(QuantitativeNeume.PetastiPlusHypsiliLeft, 'petastiYpsiliLeft');
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
  'petastiKentimaYpsiliRight',
);
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
  'petastiKentimaYpsiliMiddle',
);
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiPlusDoubleHypsili,
  'petastiDoubleYpsili',
);
mapNeumeToSbmufl(QuantitativeNeume.Apostrophos, 'apostrofos');
mapNeumeToSbmufl(QuantitativeNeume.Elaphron, 'elafron');
mapNeumeToSbmufl(QuantitativeNeume.Apostrophos, 'apostrofos');
mapNeumeToSbmufl(
  QuantitativeNeume.ElaphronPlusApostrophos,
  'elafronApostrofos',
);
mapNeumeToSbmufl(QuantitativeNeume.Hamili, 'chamili');
mapNeumeToSbmufl(QuantitativeNeume.HamiliPlusApostrophos, 'chamiliApostrofos');
mapNeumeToSbmufl(QuantitativeNeume.HamiliPlusElaphron, 'chamiliElafron');
mapNeumeToSbmufl(
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  'chamiliElafronApostrofos',
);
mapNeumeToSbmufl(QuantitativeNeume.DoubleHamili, 'doubleChamili');
mapNeumeToSbmufl(QuantitativeNeume.PetastiPlusApostrophos, 'petastiApostrofos');
mapNeumeToSbmufl(QuantitativeNeume.PetastiPlusElaphron, 'petastiElafron');
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
  'petastiElafronApostrofos',
);
mapNeumeToSbmufl(QuantitativeNeume.OligonPlusKentemata, 'oligonKentimataAbove');
mapNeumeToSbmufl(QuantitativeNeume.KentemataPlusOligon, 'oligonKentimataBelow');
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusIsonPlusKentemata,
  'oligonIsonKentimata',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
  'oligonApostrofosKentimata',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
  'oligonYporroiKentimata',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusElaphronPlusKentemata,
  'oligonElafronKentimata',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
  'oligonElafronApostrofosKentimata',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusHamiliPlusKentemata,
  'oligonChamiliKentimata',
);
mapNeumeToSbmufl(QuantitativeNeume.RunningElaphron, 'runningElafron');
mapNeumeToSbmufl(QuantitativeNeume.Hyporoe, 'yporroi');
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiPlusRunningElaphron,
  'petastiRunningElafron',
);
mapNeumeToSbmufl(QuantitativeNeume.PetastiPlusHyporoe, 'petastiYporroi');
mapNeumeToSbmufl(QuantitativeNeume.OligonPlusIson, 'oligonIson');
mapNeumeToSbmufl(QuantitativeNeume.OligonPlusApostrophos, 'oligonApostrofos');
mapNeumeToSbmufl(QuantitativeNeume.OligonPlusElaphron, 'oligonElafron');
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
  'oligonElafronApostrofos',
);
mapNeumeToSbmufl(QuantitativeNeume.OligonPlusHamili, 'oligonChamili');
mapNeumeToSbmufl(QuantitativeNeume.Kentima, 'kentima');
mapNeumeToSbmufl(QuantitativeNeume.OligonPlusKentima, 'oligonKentimaMiddle');
mapNeumeToSbmufl(QuantitativeNeume.Kentemata, 'kentimata');
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
  'oligonRunningElafronKentimata',
);
mapNeumeToSbmufl(QuantitativeNeume.DoubleApostrophos, 'apostrofosSyndesmos');
mapNeumeToSbmufl(QuantitativeNeume.IsonPlusApostrophos, 'isonApostrofos');
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
  'oligonKentimataYpsiliLeft',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
  'oligonKentimataYpsiliRight',
);
mapNeumeToSbmufl(QuantitativeNeume.Cross, 'stavros');
mapNeumeToSbmufl(QuantitativeNeume.VareiaDotted, 'leimma1');
mapNeumeToSbmufl(GorgonNeume.Gorgon_Top, 'gorgonAbove');
mapNeumeToSbmufl(GorgonNeume.Gorgon_Bottom, 'gorgonBelow');
mapNeumeToSbmufl(GorgonNeume.Digorgon, 'digorgon');
mapNeumeToSbmufl(GorgonNeume.Trigorgon, 'trigorgon');
mapNeumeToSbmufl(GorgonNeume.GorgonDottedLeft, 'gorgonDottedLeft');
mapNeumeToSbmufl(GorgonNeume.GorgonDottedRight, 'gorgonDottedRight');
mapNeumeToSbmufl(GorgonNeume.DigorgonDottedLeft1, 'digorgonDottedLeftBelow');
mapNeumeToSbmufl(GorgonNeume.DigorgonDottedLeft2, 'digorgonDottedLeftAbove');
mapNeumeToSbmufl(GorgonNeume.DigorgonDottedRight, 'digorgonDottedRight');
mapNeumeToSbmufl(GorgonNeume.TrigorgonDottedLeft1, 'trigorgonDottedLeftBelow');
mapNeumeToSbmufl(GorgonNeume.TrigorgonDottedLeft2, 'trigorgonDottedLeftAbove');
mapNeumeToSbmufl(GorgonNeume.TrigorgonDottedRight, 'trigorgonDottedRight');
mapNeumeToSbmufl(GorgonNeume.Argon, 'argon');
mapNeumeToSbmufl(GorgonNeume.Hemiolion, 'diargon');
mapNeumeToSbmufl(GorgonNeume.Diargon, 'triargon');
mapNeumeToSbmufl(GorgonNeume.GorgonSecondary, 'gorgonSecondary');
mapNeumeToSbmufl(GorgonNeume.DigorgonSecondary, 'digorgonSecondary');
mapNeumeToSbmufl(GorgonNeume.TrigorgonSecondary, 'trigorgonSecondary');
mapNeumeToSbmufl(
  GorgonNeume.GorgonDottedLeftSecondary,
  'gorgonDottedLeftSecondary',
);
mapNeumeToSbmufl(
  GorgonNeume.GorgonDottedRightSecondary,
  'gorgonDottedRightSecondary',
);
mapNeumeToSbmufl(
  GorgonNeume.DigorgonDottedLeft1Secondary,
  'digorgonDottedLeftBelowSecondary',
);
mapNeumeToSbmufl(
  GorgonNeume.DigorgonDottedRightSecondary,
  'digorgonDottedRightSecondary',
);
mapNeumeToSbmufl(
  GorgonNeume.TrigorgonDottedLeft1Secondary,
  'trigorgonDottedLeftBelowSecondary',
);
mapNeumeToSbmufl(
  GorgonNeume.TrigorgonDottedRightSecondary,
  'trigorgonDottedRightSecondary',
);
mapNeumeToSbmufl(TimeNeume.Klasma_Top, 'klasmaAbove');
mapNeumeToSbmufl(TimeNeume.Klasma_Bottom, 'klasmaBelow');
mapNeumeToSbmufl(TimeNeume.Hapli, 'apli');
mapNeumeToSbmufl(TimeNeume.Dipli, 'dipli');
mapNeumeToSbmufl(TimeNeume.Tripli, 'tripli');

mapNeumeToSbmufl(Fthora.DiatonicNiLow_Top, 'fthoraDiatonicNiLowAbove'),
  mapNeumeToSbmufl(Fthora.DiatonicPa_Top, 'fthoraDiatonicPaAbove');
mapNeumeToSbmufl(Fthora.DiatonicVou_Top, 'fthoraDiatonicVouAbove');
mapNeumeToSbmufl(Fthora.DiatonicGa_Top, 'fthoraDiatonicGaAbove');
mapNeumeToSbmufl(Fthora.DiatonicThi_Top, 'fthoraDiatonicDiAbove');
mapNeumeToSbmufl(Fthora.DiatonicKe_Top, 'fthoraDiatonicKeAbove');
mapNeumeToSbmufl(Fthora.DiatonicZo_Top, 'fthoraDiatonicZoAbove');
mapNeumeToSbmufl(Fthora.DiatonicNiHigh_Top, 'fthoraDiatonicNiHighAbove');
mapNeumeToSbmufl(Fthora.HardChromaticPa_Top, 'fthoraHardChromaticPaAbove');
mapNeumeToSbmufl(Fthora.HardChromaticThi_Top, 'fthoraHardChromaticDiAbove');
mapNeumeToSbmufl(Fthora.SoftChromaticThi_Top, 'fthoraSoftChromaticDiAbove');
mapNeumeToSbmufl(Fthora.SoftChromaticPa_Top, 'fthoraSoftChromaticKeAbove');
mapNeumeToSbmufl(Fthora.Enharmonic_Top, 'fthoraEnharmonicAbove');
mapNeumeToSbmufl(Fthora.Zygos_Top, 'chroaZygosAbove');
mapNeumeToSbmufl(Fthora.Kliton_Top, 'chroaKlitonAbove');
mapNeumeToSbmufl(Fthora.Spathi_Top, 'chroaSpathiAbove');
mapNeumeToSbmufl(Fthora.GeneralSharp_Top, 'diesisGenikiAbove');
mapNeumeToSbmufl(Fthora.GeneralFlat_Top, 'yfesisGenikiAbove');
mapNeumeToSbmufl(Fthora.DiatonicNiLow_Bottom, 'fthoraDiatonicNiLowBelow');
mapNeumeToSbmufl(Fthora.DiatonicPa_Bottom, 'fthoraDiatonicPaBelow');
mapNeumeToSbmufl(Fthora.DiatonicThi_Bottom, 'fthoraDiatonicDiBelow');
mapNeumeToSbmufl(Fthora.DiatonicKe_Bottom, 'fthoraDiatonicKeBelow');
mapNeumeToSbmufl(Fthora.DiatonicNiHigh_Bottom, 'fthoraDiatonicNiHighBelow');
mapNeumeToSbmufl(Fthora.HardChromaticPa_Bottom, 'fthoraHardChromaticPaBelow');
mapNeumeToSbmufl(Fthora.HardChromaticThi_Bottom, 'fthoraHardChromaticDiBelow');
mapNeumeToSbmufl(Fthora.SoftChromaticThi_Bottom, 'fthoraSoftChromaticDiBelow');
mapNeumeToSbmufl(Fthora.SoftChromaticPa_Bottom, 'fthoraSoftChromaticKeBelow');
mapNeumeToSbmufl(Fthora.Enharmonic_Bottom, 'fthoraEnharmonicBelow');
mapNeumeToSbmufl(Fthora.Zygos_Bottom, 'chroaZygosBelow');
mapNeumeToSbmufl(Fthora.Kliton_Bottom, 'chroaKlitonBelow');
mapNeumeToSbmufl(Fthora.GeneralSharp_Bottom, 'diesisGenikiBelow');
mapNeumeToSbmufl(Fthora.GeneralFlat_Bottom, 'yfesisGenikiBelow');
mapNeumeToSbmufl(Accidental.Sharp_2_Left, 'diesis2');
mapNeumeToSbmufl(Accidental.Sharp_4_Left, 'diesis4');
mapNeumeToSbmufl(Accidental.Sharp_6_Left, 'diesis6');
mapNeumeToSbmufl(Accidental.Flat_2_Right, 'yfesis2');
mapNeumeToSbmufl(Accidental.Flat_4_Right, 'yfesis4');
mapNeumeToSbmufl(Accidental.Flat_6_Right, 'yfesis6');
mapNeumeToSbmufl(TempoSign.VerySlow, 'agogiPoliArgi');
mapNeumeToSbmufl(TempoSign.Slower, 'agogiArgoteri');
mapNeumeToSbmufl(TempoSign.Slow, 'agogiArgi');
mapNeumeToSbmufl(TempoSign.Moderate, 'agogiMetria');
mapNeumeToSbmufl(TempoSign.Medium, 'agogiMesi');
mapNeumeToSbmufl(TempoSign.Quick, 'agogiGorgi');
mapNeumeToSbmufl(TempoSign.Quicker, 'agogiGorgoteri');
mapNeumeToSbmufl(TempoSign.VeryQuick, 'agogiPoliGorgi');
mapNeumeToSbmufl(VocalExpressionNeume.Vareia, 'vareia');
mapNeumeToSbmufl(VocalExpressionNeume.HomalonConnecting, 'omalonConnecting');
mapNeumeToSbmufl(VocalExpressionNeume.Homalon, 'omalon');
mapNeumeToSbmufl(VocalExpressionNeume.Antikenoma, 'antikenoma');
mapNeumeToSbmufl(VocalExpressionNeume.Psifiston, 'psifiston');
mapNeumeToSbmufl(VocalExpressionNeume.Heteron, 'heteron');
mapNeumeToSbmufl(VocalExpressionNeume.HeteronConnecting, 'heteronConnecting');
mapNeumeToSbmufl(RootSign.Delta, 'martyriaDeltaBelow');
mapNeumeToSbmufl(RootSign.Alpha, 'martyriaAlphaBelow');
mapNeumeToSbmufl(RootSign.Legetos, 'martyriaLegetosBelow');
mapNeumeToSbmufl(RootSign.Nana, 'martyriaNanaBelow');
mapNeumeToSbmufl(RootSign.Zo, 'martyriaZoBelow');
mapNeumeToSbmufl(RootSign.Squiggle, 'martyriaHardChromaticPaBelow');
mapNeumeToSbmufl(RootSign.SquiggleLow, 'martyriaHardChromaticPaAbove');
mapNeumeToSbmufl(RootSign.Tilt, 'martyriaHardChromaticDiBelow');
mapNeumeToSbmufl(RootSign.TiltLow, 'martyriaHardChromaticDiAbove');
mapNeumeToSbmufl(
  RootSign.SoftChromaticSquiggle,
  'martyriaSoftChromaticDiBelow',
);
mapNeumeToSbmufl(
  RootSign.SoftChromaticSquiggleLow,
  'martyriaSoftChromaticDiAbove',
);
mapNeumeToSbmufl(RootSign.Zygos, 'martyriaZygosBelow');
mapNeumeToSbmufl(RootSign.DeltaDotted, 'martyriaDeltaDottedBelow');
mapNeumeToSbmufl(RootSign.AlphaDotted, 'martyriaAlphaDottedBelow');
mapNeumeToSbmufl(
  RootSign.SoftChromaticPaRootSign,
  'martyriaSoftChromaticKeBelow',
);
mapNeumeToSbmufl(
  RootSign.SoftChromaticPaRootSignLow,
  'martyriaSoftChromaticKeAbove',
);
mapNeumeToSbmufl(RootSign.AlphaLow, 'martyriaAlphaAbove');
mapNeumeToSbmufl(RootSign.DeltaLow, 'martyriaDeltaAbove');
mapNeumeToSbmufl(RootSign.NanaLow, 'martyriaNanaAbove');
mapNeumeToSbmufl(RootSign.LegetosLow, 'martyriaLegetosAbove');
mapNeumeToSbmufl(Note.VouLow, 'martyriaNoteVouLow');
mapNeumeToSbmufl(Note.GaLow, 'martyriaNoteGaLow');
mapNeumeToSbmufl(Note.ThiLow, 'martyriaNoteDiLow');
mapNeumeToSbmufl(Note.KeLow, 'martyriaNoteKeLow');
mapNeumeToSbmufl(Note.Zo, 'martyriaNoteZo');
mapNeumeToSbmufl(Note.Ni, 'martyriaNoteNi');
mapNeumeToSbmufl(Note.Pa, 'martyriaNotePa');
mapNeumeToSbmufl(Note.Vou, 'martyriaNoteVou');
mapNeumeToSbmufl(Note.Ga, 'martyriaNoteGa');
mapNeumeToSbmufl(Note.Thi, 'martyriaNoteDi');
mapNeumeToSbmufl(Note.Ke, 'martyriaNoteKe');
mapNeumeToSbmufl(Note.ZoHigh, 'martyriaNoteZoHigh');
mapNeumeToSbmufl(Note.NiHigh, 'martyriaNoteNiHigh');
mapNeumeToSbmufl(Note.PaHigh, 'martyriaNotePaHigh');
mapNeumeToSbmufl(Note.VouHigh, 'martyriaNoteVouHigh');
mapNeumeToSbmufl(Note.GaHigh, 'martyriaNoteGaHigh');
mapNeumeToSbmufl(Note.ThiHigh, 'martyriaNoteDiHigh');
mapNeumeToSbmufl(Note.KeHigh, 'martyriaNoteKeHigh');
mapNeumeToSbmufl(ModeSign.Ekhos, 'modeWordEchos');
mapNeumeToSbmufl(ModeSign.Plagal, 'modePlagal');
mapNeumeToSbmufl(ModeSign.First, 'modeAlpha');
mapNeumeToSbmufl(ModeSign.Second, 'modeBeta');
mapNeumeToSbmufl(ModeSign.Third, 'modeGamma');
mapNeumeToSbmufl(ModeSign.Fourth, 'modeDelta');
mapNeumeToSbmufl(ModeSign.FirstCapital, 'modeAlphaCapital');
mapNeumeToSbmufl(ModeSign.SecondCapital, 'modeBetaCapital');
mapNeumeToSbmufl(ModeSign.ThirdCapital, 'modeGammaCapital');
mapNeumeToSbmufl(ModeSign.FourthCapital, 'modeDeltaCapital');
mapNeumeToSbmufl(ModeSign.Varys, 'modeWordVarys');
mapNeumeToSbmufl(ModeSign.Alpha, 'modePlagalFirst');
mapNeumeToSbmufl(ModeSign.AlphaWithDeltaHat, 'modeFirst', 1);
mapNeumeToSbmufl(ModeSign.AlphaWithHypsili, 'modeFirst');
mapNeumeToSbmufl(ModeSign.SoftChromatic6, 'modePlagalSecond');
mapNeumeToSbmufl(ModeSign.SoftChromatic2, 'modeSecond');
mapNeumeToSbmufl(ModeSign.Nana, 'modeThirdNana');
mapNeumeToSbmufl(ModeSign.VarysZo, 'modeVarys');
mapNeumeToSbmufl(ModeSign.Delta, 'modePlagalFourth');
mapNeumeToSbmufl(ModeSign.DeltaWithDeltaHat, 'modeFourth', 1);
mapNeumeToSbmufl(ModeSign.DeltaWithHypsili, 'modeFourth');
mapNeumeToSbmufl(ModeSign.NanaOld, 'modeThird');
mapNeumeToSbmufl(ModeSign.Legetos, 'modeLegetos');
mapNeumeToSbmufl(ModeSign.ElaphronPlusApostrophos, 'modeRunningElafron');
mapNeumeToSbmufl(ModeSign.Elaphron, 'modeElafron');
mapNeumeToSbmufl(ModeSign.OligonPlusKentima, 'modeOligonKentimaAbove');
mapNeumeToSbmufl(ModeSign.OligonPlusHypsili, 'modeOligonYpsili');
mapNeumeToSbmufl(ModeSign.Ni, 'modeNi');
mapNeumeToSbmufl(ModeSign.Pa, 'modePa');
mapNeumeToSbmufl(ModeSign.Vou, 'modeVou');
mapNeumeToSbmufl(ModeSign.Ga, 'modeGa');
mapNeumeToSbmufl(ModeSign.Thi, 'modeDi');
mapNeumeToSbmufl(ModeSign.Ke, 'modeKe');
mapNeumeToSbmufl(ModeSign.Zo, 'modeZo');
mapNeumeToSbmufl(MeasureBar.MeasureBarRight, 'barlineSingle');
mapNeumeToSbmufl(MeasureBar.MeasureBarTop, 'barlineShortSingle');
mapNeumeToSbmufl(MeasureNumber.Two, 'measureNumber2');
mapNeumeToSbmufl(MeasureNumber.Three, 'measureNumber3');
mapNeumeToSbmufl(MeasureNumber.Four, 'measureNumber4');
mapNeumeToSbmufl(MeasureNumber.Five, 'measureNumber5');
mapNeumeToSbmufl(MeasureNumber.Six, 'measureNumber6');
mapNeumeToSbmufl(MeasureNumber.Seven, 'measureNumber7');
mapNeumeToSbmufl(MeasureNumber.Eight, 'measureNumber8');
mapNeumeToSbmufl(NoteIndicator.Ni, 'noteIndicatorNi');
mapNeumeToSbmufl(NoteIndicator.Pa, 'noteIndicatorPa');
mapNeumeToSbmufl(NoteIndicator.Vou, 'noteIndicatorVou');
mapNeumeToSbmufl(NoteIndicator.Ga, 'noteIndicatorGa');
mapNeumeToSbmufl(NoteIndicator.Thi, 'noteIndicatorDi');
mapNeumeToSbmufl(NoteIndicator.Ke, 'noteIndicatorKe');
mapNeumeToSbmufl(NoteIndicator.Zo, 'noteIndicatorZo');
mapNeumeToSbmufl(Ison.Unison, 'isonIndicatorUnison');
mapNeumeToSbmufl(Ison.ThiLow, 'isonIndicatorDiLow');
mapNeumeToSbmufl(Ison.KeLow, 'isonIndicatorKeLow');
mapNeumeToSbmufl(Ison.Zo, 'isonIndicatorZo');
mapNeumeToSbmufl(Ison.Ni, 'isonIndicatorNi');
mapNeumeToSbmufl(Ison.Pa, 'isonIndicatorPa');
mapNeumeToSbmufl(Ison.Vou, 'isonIndicatorVou');
mapNeumeToSbmufl(Ison.Ga, 'isonIndicatorGa');
mapNeumeToSbmufl(Ison.Thi, 'isonIndicatorDi');
mapNeumeToSbmufl(Ison.Ke, 'isonIndicatorKe');
mapNeumeToSbmufl(Ison.ZoHigh, 'isonIndicatorZoHigh');

export class NeumeMappingService {
  public static getMapping(neume: Neume): NeumeMapping {
    return neumeToSbmuflGlyphMap.get(neume)!;
  }
}
