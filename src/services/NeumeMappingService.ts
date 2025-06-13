import metadata from '@/assets/fonts/neanes.metadata.json';
import glyphnames from '@/assets/fonts/sbmufl/glyphnames.json';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  Letter,
  MeasureBar,
  MeasureNumber,
  ModeSign,
  Neume,
  Note,
  NoteIndicator,
  QuantitativeNeume,
  RootSign,
  TempoSign,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';

export type SbmuflGlyphName =
  | keyof typeof glyphnames
  | keyof typeof metadata.optionalGlyphs
  | keyof typeof metadata.glyphAdvanceWidths;

export interface NeumeMapping {
  glyphName: SbmuflGlyphName;
  text: string;
  salt?: number;
}

// Create mapping from glyph name to codepoint
const glyphNameToCodepointMap = new Map<string, string>();

for (const glyph in glyphnames) {
  const data: { codepoint: string } = (glyphnames as any)[glyph];
  const codepoint = Number('0x' + data.codepoint.substring(2));
  glyphNameToCodepointMap.set(glyph, String.fromCodePoint(codepoint));
}

for (const glyph in metadata.optionalGlyphs) {
  const data: { codepoint: string } = (metadata.optionalGlyphs as any)[glyph];
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
mapNeumeToSbmufl(
  QuantitativeNeume.OligonKentimataDoubleYpsili,
  'oligonKentimataDoubleYpsili',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonKentimaDoubleYpsiliRight,
  'oligonKentimaDoubleYpsiliRight',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonKentimaDoubleYpsiliLeft,
  'oligonKentimaDoubleYpsiliLeft',
);
mapNeumeToSbmufl(QuantitativeNeume.OligonTripleYpsili, 'oligonTripleYpsili');
mapNeumeToSbmufl(
  QuantitativeNeume.OligonKentimataTripleYpsili,
  'oligonKentimataTripleYpsili',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonKentimaTripleYpsili,
  'oligonKentimaTripleYpsili',
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
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiKentimataDoubleYpsili,
  'petastiKentimataDoubleYpsili',
);
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiKentimaDoubleYpsiliRight,
  'petastiKentimaDoubleYpsiliRight',
);
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft,
  'petastiKentimaDoubleYpsiliLeft',
);
mapNeumeToSbmufl(QuantitativeNeume.PetastiTripleYpsili, 'petastiTripleYpsili');
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiKentimataTripleYpsili,
  'petastiKentimataTripleYpsili',
);
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiKentimaTripleYpsili,
  'petastiKentimaTripleYpsili',
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
mapNeumeToSbmufl(
  QuantitativeNeume.DoubleHamiliApostrofos,
  'doubleChamiliApostrofos',
);
mapNeumeToSbmufl(QuantitativeNeume.DoubleHamiliElafron, 'doubleChamiliElafron');
mapNeumeToSbmufl(
  QuantitativeNeume.DoubleHamiliElafronApostrofos,
  'doubleChamiliElafronApostrofos',
);
mapNeumeToSbmufl(QuantitativeNeume.TripleHamili, 'tripleChamili');

mapNeumeToSbmufl(QuantitativeNeume.PetastiPlusApostrophos, 'petastiApostrofos');
mapNeumeToSbmufl(QuantitativeNeume.PetastiPlusElaphron, 'petastiElafron');
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
  'petastiElafronApostrofos',
);
mapNeumeToSbmufl(QuantitativeNeume.PetastiHamili, 'petastiChamili');
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiHamiliApostrofos,
  'petastiChamiliApostrofos',
);
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiHamiliElafron,
  'petastiChamiliElafron',
);
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiHamiliElafronApostrofos,
  'petastiChamiliElafronApostrofos',
);
mapNeumeToSbmufl(QuantitativeNeume.PetastiDoubleHamili, 'petastiDoubleChamili');
mapNeumeToSbmufl(
  QuantitativeNeume.PetastiDoubleHamiliApostrofos,
  'petastiDoubleChamiliApostrofos',
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
mapNeumeToSbmufl(QuantitativeNeume.OligonPlusHyporoe, 'oligonYporroi');
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
  QuantitativeNeume.OligonKentimaMiddleKentimata,
  'oligonKentimaMiddleKentimata',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
  'oligonYpsiliLeftKentimata',
);
mapNeumeToSbmufl(
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
  'oligonYpsiliRightKentimata',
);
mapNeumeToSbmufl(QuantitativeNeume.Cross, 'stavros');
mapNeumeToSbmufl(QuantitativeNeume.Breath, 'breath');
mapNeumeToSbmufl(VocalExpressionNeume.Cross_Top, 'stavrosAbove');
mapNeumeToSbmufl(QuantitativeNeume.VareiaDotted, 'leimma1');
mapNeumeToSbmufl(QuantitativeNeume.VareiaDotted2, 'leimma2');
mapNeumeToSbmufl(QuantitativeNeume.VareiaDotted3, 'leimma3');
mapNeumeToSbmufl(QuantitativeNeume.VareiaDotted4, 'leimma4');
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
  GorgonNeume.DigorgonDottedLeft2Secondary,
  'digorgonDottedLeftSecondary',
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
  GorgonNeume.TrigorgonDottedLeft2Secondary,
  'trigorgonDottedLeftSecondary',
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
mapNeumeToSbmufl(TimeNeume.Tetrapli, 'tetrapli');
mapNeumeToSbmufl(TimeNeume.Koronis, 'koronis');

mapNeumeToSbmufl(Fthora.DiatonicNiLow_Top, 'fthoraDiatonicNiLowAbove');
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
mapNeumeToSbmufl(Fthora.GeneralSharp_TopSecondary, 'diesisGenikiSecondary');
mapNeumeToSbmufl(Fthora.GeneralSharp_TopTertiary, 'diesisGenikiTertiary');
mapNeumeToSbmufl(Fthora.GeneralFlat_Top, 'yfesisGenikiAbove');
mapNeumeToSbmufl(Fthora.GeneralFlat_TopSecondary, 'yfesisGenikiSecondary');
mapNeumeToSbmufl(Fthora.GeneralFlat_TopTertiary, 'yfesisGenikiTertiary');
mapNeumeToSbmufl(
  Fthora.DiatonicNiLow_TopSecondary,
  'fthoraDiatonicNiLowSecondary',
);
mapNeumeToSbmufl(Fthora.DiatonicPa_TopSecondary, 'fthoraDiatonicPaSecondary');
mapNeumeToSbmufl(Fthora.DiatonicVou_TopSecondary, 'fthoraDiatonicVouSecondary');
mapNeumeToSbmufl(Fthora.DiatonicGa_TopSecondary, 'fthoraDiatonicGaSecondary');
mapNeumeToSbmufl(Fthora.DiatonicThi_TopSecondary, 'fthoraDiatonicDiSecondary');
mapNeumeToSbmufl(Fthora.DiatonicKe_TopSecondary, 'fthoraDiatonicKeSecondary');
mapNeumeToSbmufl(Fthora.DiatonicZo_TopSecondary, 'fthoraDiatonicZoSecondary');
mapNeumeToSbmufl(
  Fthora.DiatonicNiHigh_TopSecondary,
  'fthoraDiatonicNiHighSecondary',
);
mapNeumeToSbmufl(
  Fthora.HardChromaticPa_TopSecondary,
  'fthoraHardChromaticPaSecondary',
);
mapNeumeToSbmufl(
  Fthora.HardChromaticThi_TopSecondary,
  'fthoraHardChromaticDiSecondary',
);
mapNeumeToSbmufl(
  Fthora.SoftChromaticThi_TopSecondary,
  'fthoraSoftChromaticDiSecondary',
);
mapNeumeToSbmufl(
  Fthora.SoftChromaticPa_TopSecondary,
  'fthoraSoftChromaticKeSecondary',
);
mapNeumeToSbmufl(Fthora.Enharmonic_TopSecondary, 'fthoraEnharmonicSecondary');
mapNeumeToSbmufl(Fthora.Zygos_TopSecondary, 'chroaZygosSecondary');
mapNeumeToSbmufl(Fthora.Kliton_TopSecondary, 'chroaKlitonSecondary');
mapNeumeToSbmufl(Fthora.Spathi_TopSecondary, 'chroaSpathiSecondary');
mapNeumeToSbmufl(
  Fthora.DiatonicNiLow_TopTertiary,
  'fthoraDiatonicNiLowTertiary',
);
mapNeumeToSbmufl(Fthora.DiatonicPa_TopTertiary, 'fthoraDiatonicPaTertiary');
mapNeumeToSbmufl(Fthora.DiatonicVou_TopTertiary, 'fthoraDiatonicVouTertiary');
mapNeumeToSbmufl(Fthora.DiatonicGa_TopTertiary, 'fthoraDiatonicGaTertiary');
mapNeumeToSbmufl(Fthora.DiatonicThi_TopTertiary, 'fthoraDiatonicDiTertiary');
mapNeumeToSbmufl(Fthora.DiatonicKe_TopTertiary, 'fthoraDiatonicKeTertiary');
mapNeumeToSbmufl(Fthora.DiatonicZo_TopTertiary, 'fthoraDiatonicZoTertiary');
mapNeumeToSbmufl(
  Fthora.DiatonicNiHigh_TopTertiary,
  'fthoraDiatonicNiHighTertiary',
);
mapNeumeToSbmufl(
  Fthora.HardChromaticPa_TopTertiary,
  'fthoraHardChromaticPaTertiary',
);
mapNeumeToSbmufl(
  Fthora.HardChromaticThi_TopTertiary,
  'fthoraHardChromaticDiTertiary',
);
mapNeumeToSbmufl(
  Fthora.SoftChromaticThi_TopTertiary,
  'fthoraSoftChromaticDiTertiary',
);
mapNeumeToSbmufl(
  Fthora.SoftChromaticPa_TopTertiary,
  'fthoraSoftChromaticKeTertiary',
);
mapNeumeToSbmufl(Fthora.Enharmonic_TopTertiary, 'fthoraEnharmonicTertiary');
mapNeumeToSbmufl(Fthora.Zygos_TopTertiary, 'chroaZygosTertiary');
mapNeumeToSbmufl(Fthora.Kliton_TopTertiary, 'chroaKlitonTertiary');
mapNeumeToSbmufl(Fthora.Spathi_TopTertiary, 'chroaSpathiTertiary');
mapNeumeToSbmufl(Fthora.DiatonicNiLow_Bottom, 'fthoraDiatonicNiLowBelow');
mapNeumeToSbmufl(Fthora.DiatonicPa_Bottom, 'fthoraDiatonicPaBelow');
mapNeumeToSbmufl(Fthora.DiatonicVou_Bottom, 'fthoraDiatonicVouBelow');
mapNeumeToSbmufl(Fthora.DiatonicGa_Bottom, 'fthoraDiatonicGaBelow');
mapNeumeToSbmufl(Fthora.DiatonicThi_Bottom, 'fthoraDiatonicDiBelow');
mapNeumeToSbmufl(Fthora.DiatonicKe_Bottom, 'fthoraDiatonicKeBelow');
mapNeumeToSbmufl(Fthora.DiatonicZo_Bottom, 'fthoraDiatonicZoBelow');
mapNeumeToSbmufl(Fthora.DiatonicNiHigh_Bottom, 'fthoraDiatonicNiHighBelow');
mapNeumeToSbmufl(Fthora.HardChromaticPa_Bottom, 'fthoraHardChromaticPaBelow');
mapNeumeToSbmufl(Fthora.HardChromaticThi_Bottom, 'fthoraHardChromaticDiBelow');
mapNeumeToSbmufl(Fthora.SoftChromaticThi_Bottom, 'fthoraSoftChromaticDiBelow');
mapNeumeToSbmufl(Fthora.SoftChromaticPa_Bottom, 'fthoraSoftChromaticKeBelow');
mapNeumeToSbmufl(Fthora.Enharmonic_Bottom, 'fthoraEnharmonicBelow');
mapNeumeToSbmufl(Fthora.Zygos_Bottom, 'chroaZygosBelow');
mapNeumeToSbmufl(Fthora.Kliton_Bottom, 'chroaKlitonBelow');
mapNeumeToSbmufl(Fthora.Spathi_Bottom, 'chroaSpathiBelow');
mapNeumeToSbmufl(Fthora.GeneralSharp_Bottom, 'diesisGenikiBelow');
mapNeumeToSbmufl(Fthora.GeneralFlat_Bottom, 'yfesisGenikiBelow');

mapNeumeToSbmufl(Fthora.DiatonicNiLow, 'fthoraDiatonicNiLow');
mapNeumeToSbmufl(Fthora.DiatonicPa, 'fthoraDiatonicPa');
mapNeumeToSbmufl(Fthora.DiatonicVou, 'fthoraDiatonicVou');
mapNeumeToSbmufl(Fthora.DiatonicGa, 'fthoraDiatonicGa');
mapNeumeToSbmufl(Fthora.DiatonicThi, 'fthoraDiatonicDi');
mapNeumeToSbmufl(Fthora.DiatonicKe, 'fthoraDiatonicKe');
mapNeumeToSbmufl(Fthora.DiatonicZo, 'fthoraDiatonicZo');
mapNeumeToSbmufl(Fthora.DiatonicNiHigh, 'fthoraDiatonicNiHigh');
mapNeumeToSbmufl(Fthora.HardChromaticPa, 'fthoraHardChromaticPa');
mapNeumeToSbmufl(Fthora.HardChromaticThi, 'fthoraHardChromaticDi');
mapNeumeToSbmufl(Fthora.SoftChromaticThi, 'fthoraSoftChromaticDi');
mapNeumeToSbmufl(Fthora.SoftChromaticPa, 'fthoraSoftChromaticKe');
mapNeumeToSbmufl(Fthora.Enharmonic, 'fthoraEnharmonic');
mapNeumeToSbmufl(Fthora.Zygos, 'chroaZygos');
mapNeumeToSbmufl(Fthora.Kliton, 'chroaKliton');
mapNeumeToSbmufl(Fthora.Spathi, 'chroaSpathi');

mapNeumeToSbmufl(Accidental.Sharp_2_Left, 'diesis2');
mapNeumeToSbmufl(Accidental.Sharp_4_Left, 'diesis4');
mapNeumeToSbmufl(Accidental.Sharp_6_Left, 'diesis6');
mapNeumeToSbmufl(Accidental.Sharp_8_Left, 'diesis8');
mapNeumeToSbmufl(Accidental.Sharp_2_LeftSecondary, 'diesis2Secondary');
mapNeumeToSbmufl(Accidental.Sharp_4_LeftSecondary, 'diesis4Secondary');
mapNeumeToSbmufl(Accidental.Sharp_6_LeftSecondary, 'diesis6Secondary');
mapNeumeToSbmufl(Accidental.Sharp_8_LeftSecondary, 'diesis8Secondary');
mapNeumeToSbmufl(Accidental.Sharp_2_LeftTertiary, 'diesis2Tertiary');
mapNeumeToSbmufl(Accidental.Sharp_4_LeftTertiary, 'diesis4Tertiary');
mapNeumeToSbmufl(Accidental.Sharp_6_LeftTertiary, 'diesis6Tertiary');
mapNeumeToSbmufl(Accidental.Sharp_8_LeftTertiary, 'diesis8Tertiary');
mapNeumeToSbmufl(Accidental.Flat_2_Right, 'yfesis2');
mapNeumeToSbmufl(Accidental.Flat_4_Right, 'yfesis4');
mapNeumeToSbmufl(Accidental.Flat_6_Right, 'yfesis6');
mapNeumeToSbmufl(Accidental.Flat_8_Right, 'yfesis8');
mapNeumeToSbmufl(Accidental.Flat_2_RightSecondary, 'yfesis2Secondary');
mapNeumeToSbmufl(Accidental.Flat_4_RightSecondary, 'yfesis4Secondary');
mapNeumeToSbmufl(Accidental.Flat_6_RightSecondary, 'yfesis6Secondary');
mapNeumeToSbmufl(Accidental.Flat_8_RightSecondary, 'yfesis8Secondary');
mapNeumeToSbmufl(Accidental.Flat_2_RightTertiary, 'yfesis2Tertiary');
mapNeumeToSbmufl(Accidental.Flat_4_RightTertiary, 'yfesis4Tertiary');
mapNeumeToSbmufl(Accidental.Flat_6_RightTertiary, 'yfesis6Tertiary');
mapNeumeToSbmufl(Accidental.Flat_8_RightTertiary, 'yfesis8Tertiary');
mapNeumeToSbmufl(TempoSign.VerySlow, 'agogiPoliArgi');
mapNeumeToSbmufl(TempoSign.Slower, 'agogiArgoteri');
mapNeumeToSbmufl(TempoSign.Slow, 'agogiArgi');
mapNeumeToSbmufl(TempoSign.Moderate, 'agogiMetria');
mapNeumeToSbmufl(TempoSign.Medium, 'agogiMesi');
mapNeumeToSbmufl(TempoSign.Quick, 'agogiGorgi');
mapNeumeToSbmufl(TempoSign.Quicker, 'agogiGorgoteri');
mapNeumeToSbmufl(TempoSign.VeryQuick, 'agogiPoliGorgi');
mapNeumeToSbmufl(TempoSign.VerySlowAbove, 'agogiPoliArgiAbove');
mapNeumeToSbmufl(TempoSign.SlowerAbove, 'agogiArgoteriAbove');
mapNeumeToSbmufl(TempoSign.SlowAbove, 'agogiArgiAbove');
mapNeumeToSbmufl(TempoSign.ModerateAbove, 'agogiMetriaAbove');
mapNeumeToSbmufl(TempoSign.MediumAbove, 'agogiMesiAbove');
mapNeumeToSbmufl(TempoSign.QuickAbove, 'agogiGorgiAbove');
mapNeumeToSbmufl(TempoSign.QuickerAbove, 'agogiGorgoteriAbove');
mapNeumeToSbmufl(TempoSign.VeryQuickAbove, 'agogiPoliGorgiAbove');
mapNeumeToSbmufl(VocalExpressionNeume.Vareia, 'vareia');
mapNeumeToSbmufl(VocalExpressionNeume.HomalonConnecting, 'omalonConnecting');
mapNeumeToSbmufl(VocalExpressionNeume.Homalon, 'omalon');
mapNeumeToSbmufl(VocalExpressionNeume.Antikenoma, 'antikenoma');
mapNeumeToSbmufl(VocalExpressionNeume.Psifiston, 'psifiston');
mapNeumeToSbmufl(VocalExpressionNeume.PsifistonSlanted, 'psifiston.salt01');
mapNeumeToSbmufl(VocalExpressionNeume.Heteron, 'heteron');
mapNeumeToSbmufl(VocalExpressionNeume.HeteronConnecting, 'heteronConnecting');
mapNeumeToSbmufl(
  VocalExpressionNeume.HeteronConnectingLong,
  'heteronConnecting.salt01',
);
mapNeumeToSbmufl(VocalExpressionNeume.Endofonon, 'endofonon');

mapNeumeToSbmufl(RootSign.Delta, 'martyriaDeltaBelow');
mapNeumeToSbmufl(RootSign.Alpha, 'martyriaAlphaBelow');
mapNeumeToSbmufl(RootSign.Legetos, 'martyriaLegetosBelow');
mapNeumeToSbmufl(RootSign.Nana, 'martyriaNanaBelow');
mapNeumeToSbmufl(RootSign.Zo, 'martyriaZoBelow');
mapNeumeToSbmufl(RootSign.ZoLow, 'martyriaZoAbove');
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
mapNeumeToSbmufl(RootSign.ZygosLow, 'martyriaZygosAbove');
mapNeumeToSbmufl(RootSign.DeltaDotted, 'martyriaDeltaDottedBelow');
mapNeumeToSbmufl(RootSign.DeltaDottedLow, 'martyriaDeltaDottedAbove');
mapNeumeToSbmufl(RootSign.AlphaDotted, 'martyriaAlphaDottedBelow');
mapNeumeToSbmufl(RootSign.AlphaDottedLow, 'martyriaAlphaDottedAbove');
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
mapNeumeToSbmufl(Note.ZoLow, 'martyriaNoteZoLow');
mapNeumeToSbmufl(Note.NiLow, 'martyriaNoteNiLow');
mapNeumeToSbmufl(Note.PaLow, 'martyriaNotePaLow');
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
mapNeumeToSbmufl(MeasureBar.MeasureBarDouble, 'barlineDouble');
mapNeumeToSbmufl(MeasureBar.MeasureBarShortDouble, 'barlineShortDouble');
mapNeumeToSbmufl(MeasureBar.MeasureBarTheseos, 'barlineTheseos');
mapNeumeToSbmufl(MeasureBar.MeasureBarShortTheseos, 'barlineShortTheseos');
mapNeumeToSbmufl(MeasureBar.MeasureBarRightAbove, 'barlineSingleAbove');
mapNeumeToSbmufl(MeasureBar.MeasureBarTopAbove, 'barlineShortSingleAbove');
mapNeumeToSbmufl(MeasureBar.MeasureBarDoubleAbove, 'barlineDoubleAbove');
mapNeumeToSbmufl(
  MeasureBar.MeasureBarShortDoubleAbove,
  'barlineShortDoubleAbove',
);
mapNeumeToSbmufl(MeasureBar.MeasureBarTheseosAbove, 'barlineTheseosAbove');
mapNeumeToSbmufl(
  MeasureBar.MeasureBarShortTheseosAbove,
  'barlineShortTheseosAbove',
);
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

mapNeumeToSbmufl(Tie.YfenAbove, 'yfenAbove');
mapNeumeToSbmufl(Tie.YfenBelow, 'yfenBelow');

mapNeumeToSbmufl(Letter.Gorthmikon, 'gorthmikon');
mapNeumeToSbmufl(Letter.Pelastikon, 'pelastikon');

export class NeumeMappingService {
  public static getMapping(neume: Neume): NeumeMapping {
    return neumeToSbmuflGlyphMap.get(neume)!;
  }
}
