import { ScoreElement, TextBoxElement } from './Element';
import { HeaderFooterType } from './HeaderFooterType';

export class Footer {
  public type: HeaderFooterType = HeaderFooterType.Default;
  public elements: ScoreElement[] = [];
}
