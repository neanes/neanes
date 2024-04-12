import { ScoreElement, TextBoxElement } from './Element';

export class Header {
  public elements: ScoreElement[];

  constructor() {
    const textbox = new TextBoxElement();
    textbox.multi = true;
    this.elements = [textbox];
  }
}
