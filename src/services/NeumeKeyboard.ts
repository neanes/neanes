import { QuantitativeNeume } from '@/models/save/v1/Neumes';
import { GorgonNeume, Neume } from '@/models/Neumes';

interface KeyboardMapping {
  code: string;
  modifier?: string;
  shiftKey?: boolean;
  neume: Neume;
}

export class NeumeKeyboard {
  private readonly modifier1 = 'KeyF';
  private readonly modifier2 = 'KeyR';
  private readonly modifier3 = 'KeyT';

  private readonly martyriaKey = 'KeyY';
  private readonly gorgonKey = 'KeyG';
  private readonly klasmaKey = 'KeyH';

  private readonly neumeKeyboardModifiers = [
    this.modifier1,
    this.modifier2,
    this.modifier3,
    this.gorgonKey,
  ];

  private quantitativeNeumeKeyboardMap: KeyboardMapping[] = [];
  private gorgonKeyboardMap: KeyboardMapping[] = [];

  constructor() {
    this.initQuantitativeNeumeKeyboardMap();
    this.initGorgonKeyboardMap();
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
      neume: GorgonNeume.Gorgon_Top,
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyJ',
      modifier: this.gorgonKey,
      neume: GorgonNeume.GorgonDottedLeft,
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyK',
      modifier: this.gorgonKey,
      neume: GorgonNeume.GorgonDottedRight,
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyL',
      modifier: this.gorgonKey,
      neume: GorgonNeume.Digorgon,
    });

    this.gorgonKeyboardMap.push({
      code: 'Semicolon',
      modifier: this.gorgonKey,
      neume: GorgonNeume.DigorgonDottedLeft1,
    });

    this.gorgonKeyboardMap.push({
      code: 'Quote',
      modifier: this.gorgonKey,
      neume: GorgonNeume.DigorgonDottedLeft2,
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyU',
      modifier: this.gorgonKey,
      neume: GorgonNeume.DigorgonDottedRight,
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyI',
      modifier: this.gorgonKey,
      neume: GorgonNeume.Trigorgon,
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyO',
      modifier: this.gorgonKey,
      neume: GorgonNeume.TrigorgonDottedLeft1,
    });

    this.gorgonKeyboardMap.push({
      code: 'KeyP',
      modifier: this.gorgonKey,
      neume: GorgonNeume.TrigorgonDottedLeft2,
    });

    this.gorgonKeyboardMap.push({
      code: 'BracketLeft',
      modifier: this.gorgonKey,
      neume: GorgonNeume.TrigorgonDottedRight,
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
}
