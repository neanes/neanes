import { QuantitativeNeume } from '@/models/save/v1/Neumes';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Neume,
  VocalExpressionNeume,
} from '@/models/Neumes';

interface KeyboardMapping {
  code: string;
  modifier?: string;
  shiftKey?: boolean;
  neume?: Neume;
  neumes?: Neume[];
}

export class NeumeKeyboard {
  private readonly modifier1 = 'KeyF';
  private readonly modifier2 = 'KeyR';
  private readonly modifier3 = 'KeyT';

  private readonly martyriaKey = 'KeyY';
  private readonly gorgonKey = 'KeyG';
  private readonly klasmaKey = 'KeyH';
  private readonly vocalExpressionKey = 'KeyV';
  private readonly fthoraKey = 'KeyC';
  private readonly accidentalKey = 'KeyE';

  private readonly neumeKeyboardModifiers = [
    this.modifier1,
    this.modifier2,
    this.modifier3,
    this.gorgonKey,
    this.vocalExpressionKey,
    this.fthoraKey,
    this.accidentalKey,
  ];

  private quantitativeNeumeKeyboardMap: KeyboardMapping[] = [];
  private gorgonKeyboardMap: KeyboardMapping[] = [];
  private fthoraKeyboardMap: KeyboardMapping[] = [];
  private vocaExpressionKeyboardMap: KeyboardMapping[] = [];
  private accidentalKeyboardMap: KeyboardMapping[] = [];

  constructor() {
    this.initQuantitativeNeumeKeyboardMap();
    this.initGorgonKeyboardMap();
    this.initFthoraKeyboardMap();
    this.initAccidentalKeyboardMap();
    this.initVocalExpressionKeyboardMap();
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
      neume: QuantitativeNeume.OligonPlusHypsiliRight,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'BracketLeft',
      neume: QuantitativeNeume.OligonPlusHypsiliLeft,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'BracketRight',
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
      neume: QuantitativeNeume.PetastiPlusHypsiliRight,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'BracketLeft',
      shiftKey: true,
      neume: QuantitativeNeume.PetastiPlusHypsiliLeft,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'BracketRight',
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
      modifier: this.modifier1,
      neume: QuantitativeNeume.RunningElaphron,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.modifier2,
      neume: QuantitativeNeume.Hyporoe,
    });

    this.quantitativeNeumeKeyboardMap.push({
      code: 'KeyM',
      modifier: this.modifier3,
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

    ///////////////////////////////////
    // Descending w/ petasti
    ///////////////////////////////////
  }

  private initGorgonKeyboardMap() {
    this.gorgonKeyboardMap.push({
      code: this.gorgonKey,
      neumes: [GorgonNeume.Gorgon_Top],
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
    this.vocaExpressionKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Vareia,
    });

    this.vocaExpressionKeyboardMap.push({
      code: 'KeyK',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Psifiston,
    });

    this.vocaExpressionKeyboardMap.push({
      code: 'KeyL',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Antikenoma,
    });

    this.vocaExpressionKeyboardMap.push({
      code: 'KeyU',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Homalon,
    });

    this.vocaExpressionKeyboardMap.push({
      code: 'KeyI',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.HomalonConnecting,
    });

    this.vocaExpressionKeyboardMap.push({
      code: 'KeyN',
      modifier: this.vocalExpressionKey,
      neume: VocalExpressionNeume.Heteron,
    });

    this.vocaExpressionKeyboardMap.push({
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
      this.vocaExpressionKeyboardMap,
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
}
