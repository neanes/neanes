import { ScoreElement, TextBoxElement } from './Element';
import { HeaderFooterType } from './HeaderFooterType';

export class Header {
  public type: HeaderFooterType = HeaderFooterType.Default;
  public elements: ScoreElement[] = [new TextBoxElement()];
}
