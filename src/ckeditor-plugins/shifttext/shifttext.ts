import { Plugin } from 'ckeditor5';

import ShiftTextEditing from './shifttextediting';
import ShiftTextUI from './shifttextui';

export default class Abbreviation extends Plugin {
  static get requires() {
    return [ShiftTextEditing, ShiftTextUI];
  }
}
