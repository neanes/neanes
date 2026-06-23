import type { ScoreElement } from './Element';
import { TextBoxElement } from './Element';

export class Footer {
  public elements: ScoreElement[] = [new TextBoxElement()];

  constructor() {
    const textbox = new TextBoxElement();
    textbox.multipanel = true;
    this.elements = [textbox];
  }

  public clone() {
    const clone = new Footer();
    clone.elements = this.elements.map((element) => element.clone());
    return clone;
  }
}
