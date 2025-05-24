import { Plugin } from 'ckeditor5';

import ShiftTextEditing from './shifttextediting';
import ShiftTextUI from './shifttextui';

export default class ShiftText extends Plugin {
  static get pluginName() {
    return 'ShiftText';
  }

  static get requires() {
    return [ShiftTextEditing, ShiftTextUI];
  }
}
