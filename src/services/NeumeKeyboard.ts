import {
  Accidental,
  Fthora,
  GorgonNeume,
  Neume,
  TimeNeume,
  QuantitativeNeume,
  VocalExpressionNeume,
  MeasureNumber,
  Ison,
  NoteIndicator,
  TempoSign,
  MeasureBar,
  Note,
} from '@/models/Neumes';
import { Scale } from '@/models/Scales';
import { NeumeMappingService } from './NeumeMappingService';

interface KeyboardMapping {
  code: string;
  modifier?: string;
  shiftKey?: boolean;
  neume?: Neume;
  neumes?: Neume[];
  note?: Note;
  scale?: Scale;
  martyriaAlignmentToggle?: boolean;
  martyriaAutoToggle?: boolean;
}

export class NeumeKeyboard {
  private readonly isonKey = 'KeyA';
  private readonly modifier1 = 'KeyS';
  private readonly modifier2 = 'KeyD';
  private readonly modifier3 = 'KeyF';

  private readonly martyriaScaleKey = 'KeyZ';
  private readonly tempoKey = 'KeyX';
  private readonly martyriaConfigKey = 'KeyC';
  private readonly vocalExpressionKey = 'KeyV';

  private readonly gorgonKey = 'KeyG';
  private readonly klasmaKey = 'KeyH';

  private readonly hapliKey = 'KeyB';

  private readonly noteIndicatorKey = 'KeyQ';
  private readonly measureBarKey = 'KeyW';
  private readonly accidentalKey = 'KeyE';
  private readonly kentimataKey = 'KeyR';
  private readonly fthoraKey = 'KeyT';
  private readonly martyriaKey = 'KeyY';

  private readonly neumeKeyboardModifiers = [
    this.modifier1,
    this.modifier2,
    this.modifier3,
    this.gorgonKey,
    this.vocalExpressionKey,
    this.fthoraKey,
    this.accidentalKey,
    this.hapliKey,
    this.isonKey,
    this.noteIndicatorKey,
    this.tempoKey,
    this.kentimataKey,
    this.martyriaConfigKey,
    this.martyriaScaleKey,
  ];

  private quantitativeNeumeKeyboardMap: KeyboardMapping[] = [];
  private gorgonKeyboardMap: KeyboardMapping[] = [];
  private fthoraKeyboardMap: KeyboardMapping[] = [];
  private vocalExpressionKeyboardMap: KeyboardMapping[] = [];
  private accidentalKeyboardMap: KeyboardMapping[] = [];
  private hapliKeyboardMap: KeyboardMapping[] = [];
  private measureNumberKeyboardMap: KeyboardMapping[] = [];
  private isonKeyboardMap: KeyboardMapping[] = [];
  private noteIndicatorKeyboardMap: KeyboardMapping[] = [];
  private tempoKeyboardMap: KeyboardMapping[] = [];
  private measureBarKeyboardMap: KeyboardMapping[] = [];
  private martyriaConfigKeyboardMap: KeyboardMapping[] = [];

  constructor() {
    this.initQuantitativeNeumeKeyboardMap();
    this.initGorgonKeyboardMap();
    this.initFthoraKeyboardMap();
    this.initAccidentalKeyboardMap();
    this.initVocalExpressionKeyboardMap();
    this.initHapliKeyboardMap();
    this.initMeasureNumberKeyboardMap();
    this.initIsonKeyboardMap();
    this.initNoteIndicatorKeyboardMap();
    this.initTempoKeyboardMap();
    this.initMeasureBarKeyboardMap();
    this.initMartyriaConfigKeyboardMap();

    // this.__generateDocumentation();
  }

  private initQuantitativeNeumeKeyboardMap() {
    ///////////////////////////////////
    // Ascending
    ///////////////////////////////////
    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyJ',
      neume: QuantitativeNeume.Ison,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyK',
      neume: QuantitativeNeume.Oligon,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyL',
      neume: QuantitativeNeume.OligonPlusKentimaBelow,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyL',
      modifier: this.modifier1,
      neume: QuantitativeNeume.OligonPlusKentima,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Semicolon',
      neume: QuantitativeNeume.OligonPlusKentimaAbove,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Quote',
      neume: QuantitativeNeume.OligonPlusHypsiliRight,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyU',
      neume: QuantitativeNeume.OligonPlusHypsiliLeft,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyI',
      neume: QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyO',
      neume: QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyP',
      neume: QuantitativeNeume.OligonPlusDoubleHypsili,
    });

    ///////////////////////////////////
    // Ascending w/ petasti
    ///////////////////////////////////

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyJ',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiWithIson,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyK',
      shiftKey: true,
      neume: QuantitativeNeume.Petasti,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyL',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusOligon,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Semicolon',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusKentimaAbove,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Quote',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusHypsiliRight,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyU',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusHypsiliLeft,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyI',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyO',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyP',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusDoubleHypsili,
    });

    ///////////////////////////////////
    // Descending
    ///////////////////////////////////

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyN',
      neume: QuantitativeNeume.Apostrophos,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyN',
      modifier: this.modifier1,
      neume: QuantitativeNeume.IsonPlusApostrophos,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      neume: QuantitativeNeume.Elaphron,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.modifier3,
      neume: QuantitativeNeume.RunningElaphron,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.modifier2,
      neume: QuantitativeNeume.Hyporoe,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.modifier1,
      neume: QuantitativeNeume.DoubleApostrophos,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Comma',
      neume: QuantitativeNeume.ElaphronPlusApostrophos,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Period',
      neume: QuantitativeNeume.Hamili,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Slash',
      neume: QuantitativeNeume.HamiliPlusApostrophos,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Slash',
      modifier: this.modifier1,
      neume: QuantitativeNeume.HamiliPlusElaphron,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Slash',
      modifier: this.modifier2,
      neume: QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Slash',
      modifier: this.modifier3,
      neume: QuantitativeNeume.DoubleHamili,
    });

    ///////////////////////////////////
    // Descending w/ petasti
    ///////////////////////////////////
    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyN',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusApostrophos,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusElaphron,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.modifier1,
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusRunningElaphron,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.modifier2,
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusHyporoe,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Comma',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
    });

    ///////////////////////////////////
    // Kentimata
    ///////////////////////////////////
    this.quantitativeNeumeKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.Kentemata,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonPlusIsonPlusKentemata,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyK',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonPlusKentemata,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyK',
      modifier: this.kentimataKey,
      shiftKey: true,
      neume: QuantitativeNeume.KentemataPlusOligon,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyL',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonKentimaMiddleKentimata,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Quote',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyU',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyN',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonPlusElaphronPlusKentemata,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.kentimataKey,
      shiftKey: true,
      neume: QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Comma',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Period',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonPlusHamiliPlusKentemata,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Slash',
      modifier: this.kentimataKey,
      neume: QuantitativeNeume.OligonPlusHyporoePlusKentemata,
    });

    ///////////////////////////////////
    // Oligon
    ///////////////////////////////////
    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.modifier3,
      shiftKey: true,
      neume: QuantitativeNeume.OligonPlusIson,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyN',
      modifier: this.modifier3,
      shiftKey: true,
      neume: QuantitativeNeume.OligonPlusApostrophos,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.modifier3,
      shiftKey: true,
      neume: QuantitativeNeume.OligonPlusElaphron,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Comma',
      modifier: this.modifier3,
      shiftKey: true,
      neume: QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Period',
      modifier: this.modifier3,
      shiftKey: true,
      neume: QuantitativeNeume.OligonPlusHamili,
    });

    ///////////////////////////////////
    // Rests
    ///////////////////////////////////
    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.vocalExpressionKey,
      shiftKey: true,
      neume: QuantitativeNeume.VareiaDotted,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyK',
      modifier: this.vocalExpressionKey,
      shiftKey: true,
      neume: QuantitativeNeume.VareiaDotted2,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyL',
      modifier: this.vocalExpressionKey,
      shiftKey: true,
      neume: QuantitativeNeume.VareiaDotted3,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.vocalExpressionKey,
      shiftKey: true,
      neume: QuantitativeNeume.VareiaDotted4,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Equal',
      shiftKey: true,
      neume: QuantitativeNeume.Cross,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'Equal',
      neume: QuantitativeNeume.Breath,
    });
  }

  private initGorgonKeyboardMap() {
    this.gorgonKeyboardMap.push({
      code: this.gorgonKey,
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.Gorgon_Top, GorgonNeume.Gorgon_Bottom],
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.GorgonDottedLeft],
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyK',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.GorgonDottedRight],
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyL',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.Digorgon],
    });

    this.gorgonKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.DigorgonDottedLeft1],
    });

    this.gorgonKeyboardMap.push({
      code: 'Quote',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.DigorgonDottedLeft2],
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyU',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.DigorgonDottedRight],
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyI',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.Trigorgon],
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyO',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.TrigorgonDottedLeft1],
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyP',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.TrigorgonDottedLeft2],
    });

    this.gorgonKeyboardMap.push({
      code: 'BracketLeft',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.TrigorgonDottedRight],
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyN',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.Argon],
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyM',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.Hemiolion],
    });

    this.gorgonKeyboardMap.push({
      code: 'Comma',
      modifier: this.gorgonKey,
      neumes: [GorgonNeume.Diargon],
    });
  }

  private initVocalExpressionKeyboardMap() {
    this.vocalExpressionKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Vareia,
    });

    this.vocalExpressionKeyboardMap.push({
      code: 'KeyK',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Psifiston,
    });

    this.vocalExpressionKeyboardMap.push({
      code: 'KeyL',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Antikenoma,
    });

    this.vocalExpressionKeyboardMap.push({
      code: 'KeyU',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Homalon,
    });

    this.vocalExpressionKeyboardMap.push({
      code: 'KeyI',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.HomalonConnecting,
    });

    this.vocalExpressionKeyboardMap.push({
      code: 'KeyN',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Heteron,
    });

    this.vocalExpressionKeyboardMap.push({
      code: 'KeyM',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.HeteronConnecting,
    });
  }

  private initFthoraKeyboardMap() {
    this.fthoraKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.fthoraKey,
      neumes: [Fthora.DiatonicNiLow_Top, Fthora.DiatonicNiLow_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'KeyK',
      modifier: this.fthoraKey,
      neumes: [Fthora.DiatonicPa_Top, Fthora.DiatonicPa_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'KeyL',
      modifier: this.fthoraKey,
      neumes: [Fthora.DiatonicVou_Top],
    });

    this.fthoraKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.fthoraKey,
      neumes: [Fthora.DiatonicGa_Top],
    });

    this.fthoraKeyboardMap.push({
      code: 'Quote',
      modifier: this.fthoraKey,
      neumes: [Fthora.DiatonicThi_Top, Fthora.DiatonicThi_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'KeyU',
      modifier: this.fthoraKey,
      neumes: [Fthora.DiatonicKe_Top, Fthora.DiatonicKe_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'KeyI',
      modifier: this.fthoraKey,
      neumes: [Fthora.DiatonicZo_Top],
    });

    this.fthoraKeyboardMap.push({
      code: 'KeyO',
      modifier: this.fthoraKey,
      neumes: [Fthora.DiatonicNiHigh_Top, Fthora.DiatonicNiHigh_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'KeyN',
      modifier: this.fthoraKey,
      neumes: [Fthora.SoftChromaticThi_Top, Fthora.SoftChromaticThi_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'KeyM',
      modifier: this.fthoraKey,
      neumes: [Fthora.SoftChromaticPa_Top, Fthora.SoftChromaticPa_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'Comma',
      modifier: this.fthoraKey,
      neumes: [Fthora.HardChromaticPa_Top, Fthora.HardChromaticPa_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'Period',
      modifier: this.fthoraKey,
      neumes: [Fthora.HardChromaticThi_Top, Fthora.HardChromaticThi_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'KeyP',
      modifier: this.fthoraKey,
      neumes: [Fthora.Enharmonic_Top, Fthora.Enharmonic_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'BracketLeft',
      modifier: this.fthoraKey,
      neumes: [Fthora.GeneralFlat_Top, Fthora.GeneralFlat_Bottom],
    });

    this.fthoraKeyboardMap.push({
      code: 'BracketRight',
      modifier: this.fthoraKey,
      neumes: [Fthora.GeneralSharp_Top, Fthora.GeneralSharp_Bottom],
    });
  }

  private initAccidentalKeyboardMap() {
    this.accidentalKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.accidentalKey,
      neume: Accidental.Flat_2_Right,
    });

    this.accidentalKeyboardMap.push({
      code: 'KeyK',
      modifier: this.accidentalKey,
      neume: Accidental.Flat_4_Right,
    });

    this.accidentalKeyboardMap.push({
      code: 'KeyL',
      modifier: this.accidentalKey,
      neume: Accidental.Flat_6_Right,
    });

    this.accidentalKeyboardMap.push({
      code: 'KeyU',
      modifier: this.accidentalKey,
      neume: Accidental.Sharp_2_Left,
    });

    this.accidentalKeyboardMap.push({
      code: 'KeyI',
      modifier: this.accidentalKey,
      neume: Accidental.Sharp_4_Left,
    });

    this.accidentalKeyboardMap.push({
      code: 'KeyO',
      modifier: this.accidentalKey,
      neume: Accidental.Sharp_6_Left,
    });
  }

  private initHapliKeyboardMap() {
    this.hapliKeyboardMap.push({
      code: this.hapliKey,
      modifier: this.hapliKey,
      neume: TimeNeume.Hapli,
    });

    this.hapliKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.hapliKey,
      neume: TimeNeume.Dipli,
    });

    this.hapliKeyboardMap.push({
      code: 'KeyK',
      modifier: this.hapliKey,
      neume: TimeNeume.Tripli,
    });
  }

  private initMeasureNumberKeyboardMap() {
    this.measureNumberKeyboardMap.push({
      code: 'Digit2',
      neume: MeasureNumber.Two,
    });

    this.measureNumberKeyboardMap.push({
      code: 'Digit3',
      neume: MeasureNumber.Three,
    });

    this.measureNumberKeyboardMap.push({
      code: 'Digit4',
      neume: MeasureNumber.Four,
    });

    this.measureNumberKeyboardMap.push({
      code: 'Digit5',
      neume: MeasureNumber.Five,
    });

    this.measureNumberKeyboardMap.push({
      code: 'Digit6',
      neume: MeasureNumber.Six,
    });

    this.measureNumberKeyboardMap.push({
      code: 'Digit7',
      neume: MeasureNumber.Seven,
    });

    this.measureNumberKeyboardMap.push({
      code: 'Digit8',
      neume: MeasureNumber.Eight,
    });
  }

  private initIsonKeyboardMap() {
    this.isonKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.isonKey,
      neume: Ison.Ni,
    });

    this.isonKeyboardMap.push({
      code: 'KeyK',
      modifier: this.isonKey,
      neume: Ison.Pa,
    });

    this.isonKeyboardMap.push({
      code: 'KeyL',
      modifier: this.isonKey,
      neume: Ison.Vou,
    });

    this.isonKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.isonKey,
      neume: Ison.Ga,
    });

    this.isonKeyboardMap.push({
      code: 'Quote',
      modifier: this.isonKey,
      neume: Ison.Thi,
    });

    this.isonKeyboardMap.push({
      code: 'KeyU',
      modifier: this.isonKey,
      neume: Ison.Ke,
    });

    this.isonKeyboardMap.push({
      code: 'KeyI',
      modifier: this.isonKey,
      neume: Ison.ZoHigh,
    });

    this.isonKeyboardMap.push({
      code: 'KeyO',
      modifier: this.isonKey,
      neume: Ison.Unison,
    });

    this.isonKeyboardMap.push({
      code: 'KeyN',
      modifier: this.isonKey,
      neume: Ison.Zo,
    });

    this.isonKeyboardMap.push({
      code: 'KeyM',
      modifier: this.isonKey,
      neume: Ison.KeLow,
    });

    this.isonKeyboardMap.push({
      code: 'Comma',
      modifier: this.isonKey,
      neume: Ison.ThiLow,
    });
  }

  private initNoteIndicatorKeyboardMap() {
    this.noteIndicatorKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.noteIndicatorKey,
      neume: NoteIndicator.Ni,
    });

    this.noteIndicatorKeyboardMap.push({
      code: 'KeyK',
      modifier: this.noteIndicatorKey,
      neume: NoteIndicator.Pa,
    });

    this.noteIndicatorKeyboardMap.push({
      code: 'KeyL',
      modifier: this.noteIndicatorKey,
      neume: NoteIndicator.Vou,
    });

    this.noteIndicatorKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.noteIndicatorKey,
      neume: NoteIndicator.Ga,
    });

    this.noteIndicatorKeyboardMap.push({
      code: 'Quote',
      modifier: this.noteIndicatorKey,
      neume: NoteIndicator.Thi,
    });

    this.noteIndicatorKeyboardMap.push({
      code: 'KeyU',
      modifier: this.noteIndicatorKey,
      neume: NoteIndicator.Ke,
    });

    this.noteIndicatorKeyboardMap.push({
      code: 'KeyI',
      modifier: this.noteIndicatorKey,
      neume: NoteIndicator.Zo,
    });
  }

  private initMartyriaConfigKeyboardMap() {
    this.martyriaConfigKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.martyriaConfigKey,
      note: Note.Ni,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyK',
      modifier: this.martyriaConfigKey,
      note: Note.Pa,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyL',
      modifier: this.martyriaConfigKey,
      note: Note.Vou,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.martyriaConfigKey,
      note: Note.Ga,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Quote',
      modifier: this.martyriaConfigKey,
      note: Note.Thi,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyU',
      modifier: this.martyriaConfigKey,
      note: Note.Ke,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyI',
      modifier: this.martyriaConfigKey,
      note: Note.ZoHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyO',
      modifier: this.martyriaConfigKey,
      note: Note.NiHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyP',
      modifier: this.martyriaConfigKey,
      note: Note.PaHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'BracketLeft',
      modifier: this.martyriaConfigKey,
      note: Note.VouHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'BracketRight',
      modifier: this.martyriaConfigKey,
      note: Note.GaHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Digit7',
      modifier: this.martyriaConfigKey,
      note: Note.ThiHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Digit8',
      modifier: this.martyriaConfigKey,
      note: Note.KeHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyN',
      modifier: this.martyriaConfigKey,
      note: Note.Zo,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyM',
      modifier: this.martyriaConfigKey,
      note: Note.KeLow,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Comma',
      modifier: this.martyriaConfigKey,
      note: Note.ThiLow,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Period',
      modifier: this.martyriaConfigKey,
      note: Note.GaLow,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Slash',
      modifier: this.martyriaConfigKey,
      note: Note.VouLow,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyJ',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.Ni,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyK',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.Pa,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyL',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.Vou,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Semicolon',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.Ga,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Quote',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.Thi,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyU',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.Ke,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyI',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.ZoHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyO',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.NiHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyP',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.PaHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'BracketLeft',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.VouHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'BracketRight',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.GaHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Digit7',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.ThiHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Digit8',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.KeHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyN',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.Zo,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyM',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.KeLow,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Comma',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.ThiLow,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Period',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.GaLow,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Slash',
      shiftKey: true,
      martyriaAlignmentToggle: true,
      modifier: this.martyriaConfigKey,
      note: Note.VouLow,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.martyriaScaleKey,
      scale: Scale.Diatonic,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyK',
      modifier: this.martyriaScaleKey,
      scale: Scale.SoftChromatic,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyL',
      modifier: this.martyriaScaleKey,
      scale: Scale.HardChromatic,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.martyriaScaleKey,
      scale: Scale.EnharmonicGa,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'Quote',
      modifier: this.martyriaScaleKey,
      scale: Scale.EnharmonicVou,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyU',
      modifier: this.martyriaScaleKey,
      scale: Scale.EnharmonicVouHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyI',
      modifier: this.martyriaScaleKey,
      scale: Scale.EnharmonicZoHigh,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyO',
      modifier: this.martyriaScaleKey,
      scale: Scale.Zygos,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyP',
      modifier: this.martyriaScaleKey,
      scale: Scale.Spathi,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'BracketLeft',
      modifier: this.martyriaScaleKey,
      scale: Scale.Kliton,
    });

    this.martyriaConfigKeyboardMap.push({
      code: this.martyriaKey,
      modifier: this.martyriaConfigKey,
      martyriaAlignmentToggle: true,
    });

    this.martyriaConfigKeyboardMap.push({
      code: 'KeyH',
      modifier: this.martyriaConfigKey,
      martyriaAutoToggle: true,
    });
  }

  private initTempoKeyboardMap() {
    this.tempoKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.tempoKey,
      neume: TempoSign.Medium,
    });

    this.tempoKeyboardMap.push({
      code: 'KeyK',
      modifier: this.tempoKey,
      neume: TempoSign.Quick,
    });

    this.tempoKeyboardMap.push({
      code: 'KeyL',
      modifier: this.tempoKey,
      neume: TempoSign.Quicker,
    });

    this.tempoKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.tempoKey,
      neume: TempoSign.VeryQuick,
    });

    this.tempoKeyboardMap.push({
      code: 'KeyN',
      modifier: this.tempoKey,
      neume: TempoSign.Moderate,
    });

    this.tempoKeyboardMap.push({
      code: 'KeyM',
      modifier: this.tempoKey,
      neume: TempoSign.Slow,
    });

    this.tempoKeyboardMap.push({
      code: 'Comma',
      modifier: this.tempoKey,
      neume: TempoSign.Slower,
    });

    this.tempoKeyboardMap.push({
      code: 'Period',
      modifier: this.tempoKey,
      neume: TempoSign.VerySlow,
    });
  }

  private initMeasureBarKeyboardMap() {
    this.measureBarKeyboardMap.push({
      code: this.measureBarKey,
      neume: MeasureBar.MeasureBarRight,
    });

    this.measureBarKeyboardMap.push({
      code: this.measureBarKey,
      shiftKey: true,
      neume: MeasureBar.MeasureBarTop,
    });
  }

  private findMapping(
    mapping: KeyboardMapping[],
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return mapping.find(
      (x) =>
        x.code === event.code &&
        (x.shiftKey || false) == event.shiftKey &&
        x.modifier == activeModifier,
    );
  }

  private __generateDocumentation() {
    const result: string[] = [];

    result.push('| Key | Description |\n');
    result.push('| --- | ----------- |\n');
    result.push(
      `| <kbd> ${this.__formatKeyForDocs(
        this.noteIndicatorKey,
      )} </kbd> | Ison Indicators |\n`,
    );
    result.push(
      `| <kbd> ${this.__formatKeyForDocs(
        this.accidentalKey,
      )} </kbd> | Signs of Alteration |\n`,
    );
    result.push(
      `| <kbd> ${this.__formatKeyForDocs(
        this.kentimataKey,
      )} </kbd> | Kentimata |\n`,
    );
    result.push(
      `| <kbd> ${this.__formatKeyForDocs(this.fthoraKey)} </kbd> | Fthores |\n`,
    );

    result.push(
      `| <kbd> ${this.__formatKeyForDocs(
        this.isonKey,
      )} </kbd> | Ison Indicators |\n`,
    );

    result.push(
      `| <kbd> ${this.__formatKeyForDocs(
        this.modifier1,
      )} </kbd> | Quantity Modifier 1 |\n`,
    );

    result.push(
      `| <kbd> ${this.__formatKeyForDocs(
        this.modifier2,
      )} </kbd> | Quantity Modifier 2 |\n`,
    );

    result.push(
      `| <kbd> ${this.__formatKeyForDocs(
        this.modifier3,
      )} </kbd> | Quantity Modifier 3 |\n`,
    );

    result.push(
      `| <kbd> ${this.__formatKeyForDocs(this.gorgonKey)} </kbd> | Gorgons |\n`,
    );

    result.push(
      `| <kbd> ${this.__formatKeyForDocs(this.tempoKey)} </kbd> | Tempo |\n`,
    );

    result.push(
      `| <kbd> ${this.__formatKeyForDocs(
        this.vocalExpressionKey,
      )} </kbd> | Quality |\n`,
    );

    result.push(
      `| <kbd> ${this.__formatKeyForDocs(this.hapliKey)} </kbd> | Apli |\n`,
    );

    result.push('\n');

    this.__generateMappingTableForDocs(
      result,
      'Characters of Quantity',
      this.quantitativeNeumeKeyboardMap,
    );

    this.__generateMappingTableForDocs(
      result,
      'Characters of Quality',
      this.vocalExpressionKeyboardMap,
    );

    this.__generateMappingTableForDocs(
      result,
      'Characters of Temporal Augmentation',
      this.hapliKeyboardMap,
    );

    // Add klasma to previous table
    result.push(
      `| <span class="neume"> ${
        NeumeMappingService.getMapping(TimeNeume.Klasma_Top).text
      } </span> | <kbd> ${this.__formatKeyForDocs(this.klasmaKey)} </kbd> |\n`,
    );

    this.__generateMappingTableForDocs(
      result,
      'Characters of Temporal Division',
      this.gorgonKeyboardMap,
    );

    this.__generateMappingTableForDocs(
      result,
      'Characters of Tempo',
      this.tempoKeyboardMap,
    );

    result.push('## Martyria of the Notes\n\n');
    result.push('| Neume | Keyboard Shortcut |\n');
    result.push('| ----- | ----------------- |\n');
    result.push(
      `| Auto-calculated Martyria | <kbd> ${this.__formatKeyForDocs(
        this.martyriaKey,
      )} </kbd> |\n`,
    );

    this.__generateMappingTableForDocs(
      result,
      'Fthores',
      this.fthoraKeyboardMap,
    );

    this.__generateMappingTableForDocs(
      result,
      'Signs of Alteration',
      this.accidentalKeyboardMap,
    );

    this.__generateMappingTableForDocs(
      result,
      'Ison Indicators',
      this.isonKeyboardMap,
    );

    this.__generateMappingTableForDocs(
      result,
      'Note Indicators',
      this.noteIndicatorKeyboardMap,
    );

    this.__generateMappingTableForDocs(
      result,
      'Measures',
      this.measureNumberKeyboardMap.concat(this.measureBarKeyboardMap),
    );

    (window as any).keyboardDocs = result.join('');
  }

  private __generateMappingTableForDocs(
    result: string[],
    title: string,
    mappings: KeyboardMapping[],
  ) {
    result.push(`## ${title}\n\n`);
    result.push('| Neume | Keyboard Shortcut |\n');
    result.push('| ----- | ----------------- |\n');

    for (let mapping of mappings) {
      result.push('|');

      result.push(
        `<span class="neume">${
          NeumeMappingService.getMapping(mapping.neume || mapping.neumes![0])
            .text
        }</span>`,
      );
      result.push('|');

      if (mapping.shiftKey) {
        result.push('<kbd>Shift</kbd> +');
      }

      if (mapping.modifier != null && mapping.modifier !== mapping.code) {
        result.push(
          `<kbd>${this.__formatKeyForDocs(mapping.modifier)}</kbd> +`,
        );
      }

      result.push(`<kbd>${this.__formatKeyForDocs(mapping.code)}</kbd>`);
      result.push('|\n');
    }
  }

  private __formatKeyForDocs(input: string) {
    return input
      .replace('Key', '')
      .replace('Digit', '')
      .replace('Comma', ',')
      .replace('Period', '.')
      .replace('Slash', '/')
      .replace('Equal', '=')
      .replace('Semicolon', ';')
      .replace('Quote', "'")
      .replace('BracketLeft', '[')
      .replace('BracketRight', ']');
  }

  public isModifier(code: string) {
    return this.neumeKeyboardModifiers.includes(code);
  }

  public isMartyria(code: string) {
    return this.martyriaKey === code;
  }

  public isGorgon(code: string) {
    return this.gorgonKey === code;
  }

  public isKlasma(code: string) {
    return this.klasmaKey === code;
  }

  public findQuantitativeMapping(
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return this.findMapping(
      this.quantitativeNeumeKeyboardMap,
      event,
      activeModifier,
    );
  }

  public findGorgonMapping(
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return this.findMapping(this.gorgonKeyboardMap, event, activeModifier);
  }

  public findVocalExpressionMapping(
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return this.findMapping(
      this.vocalExpressionKeyboardMap,
      event,
      activeModifier,
    );
  }

  public findFthoraMapping(
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return this.findMapping(this.fthoraKeyboardMap, event, activeModifier);
  }

  public findAccidentalMapping(
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return this.findMapping(this.accidentalKeyboardMap, event, activeModifier);
  }

  public findHapliMapping(event: KeyboardEvent, activeModifier: string | null) {
    return this.findMapping(this.hapliKeyboardMap, event, activeModifier);
  }

  public findMeasureNumberMapping(
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return this.findMapping(
      this.measureNumberKeyboardMap,
      event,
      activeModifier,
    );
  }

  public findIsonMapping(event: KeyboardEvent, activeModifier: string | null) {
    return this.findMapping(this.isonKeyboardMap, event, activeModifier);
  }

  public findNoteIndicatorMapping(
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return this.findMapping(
      this.noteIndicatorKeyboardMap,
      event,
      activeModifier,
    );
  }

  public findTempoMapping(event: KeyboardEvent, activeModifier: string | null) {
    return this.findMapping(this.tempoKeyboardMap, event, activeModifier);
  }

  public findMeasureBarMapping(
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return this.findMapping(this.measureBarKeyboardMap, event, activeModifier);
  }

  public findMartyriaConfigMapping(
    event: KeyboardEvent,
    activeModifier: string | null,
  ) {
    return this.findMapping(
      this.martyriaConfigKeyboardMap,
      event,
      activeModifier,
    );
  }
}
