import { ScoreElement, TextBoxElement } from './Element';

export class Header {
  public elements: ScoreElement[];

  constructor() {
    const textbox = new TextBoxElement();
    textbox.multipanel = true;
    this.elements = [textbox];
  }
}
