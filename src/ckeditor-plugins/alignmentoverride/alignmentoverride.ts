import { Plugin } from 'ckeditor5';

import AlignmentOverrideEditing from './alignmentoverrideediting';

export default class AlignmentOverride extends Plugin {
  static get pluginName() {
    return 'AlignmentOverride';
  }

  static get requires() {
    return [AlignmentOverrideEditing];
  }
}
