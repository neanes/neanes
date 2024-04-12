import { ScoreElement, TextBoxElement } from './Element';

export class Footer {
  public elements: ScoreElement[] = [new TextBoxElement()];

  constructor() {
    const textbox = new TextBoxElement();
    textbox.multi = true;
    this.elements = [textbox];
  }
}
