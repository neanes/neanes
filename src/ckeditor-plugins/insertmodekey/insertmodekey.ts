import './insertmodekey.css';

import { Plugin } from 'ckeditor5';

import InsertModeKeyCommand, {
  INSERT_MODE_KEY_COMMAND,
} from './insertmodekeycommand';
import InsertModeKeyEditing from './insertmodekeyediting';
import UpdateModeKeyAttributesCommand, {
  UPDATE_MODE_KEY_ATTRIBUTES_COMMAND,
} from './updatemodekeyattributescommand';

export default class InsertModeKey extends Plugin {
  static get pluginName() {
    return 'InsertModeKey';
  }

  static get requires() {
    return [InsertModeKeyEditing] as const;
  }

  init() {
    this.editor.config.define('insertModeKey', {});
    this.editor.commands.add(
      INSERT_MODE_KEY_COMMAND,
      new InsertModeKeyCommand(this.editor),
    );
    this.editor.commands.add(
      UPDATE_MODE_KEY_ATTRIBUTES_COMMAND,
      new UpdateModeKeyAttributesCommand(this.editor),
    );
  }
}
