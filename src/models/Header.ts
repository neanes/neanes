import type { ScoreElement } from './Element';
import { TextBoxElement } from './Element';

export class Header {
  public elements: ScoreElement[];

  constructor() {
    const textbox = new TextBoxElement();
    textbox.multipanel = true;
    this.elements = [textbox];
  }

  public clone() {
    const clone = new Header();
    clone.elements = this.elements.map((element) => element.clone());
    return clone;
  }
}
