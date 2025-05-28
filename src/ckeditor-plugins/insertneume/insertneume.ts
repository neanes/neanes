import './insertneume.css';

import { Plugin } from 'ckeditor5';

import InsertNeumeCommand, { INSERT_NEUME_COMMAND } from './insertneumecommand';
import InsertNeumeEditing from './insertneumeediting';
import InsertNeumeUI from './insertneumeui';
import UpdateNeumeAttributesCommand, {
  UPDATE_NEUME_ATTRIBUTES_COMMAND,
} from './updateneumeattributescommand';

export default class InsertNeume extends Plugin {
  static get pluginName() {
    return 'InsertNeume';
  }

  static get requires() {
    return [InsertNeumeEditing, InsertNeumeUI];
  }

  init() {
    const editor = this.editor;

    // editor.config.define('insertNeume', {
    //   fthoraDefaultStyle: {
    //     color: 'inherit',
    //     fontSize: 'inherit',
    //   },
    // });

    editor.commands.add(INSERT_NEUME_COMMAND, new InsertNeumeCommand(editor));
    editor.commands.add(
      UPDATE_NEUME_ATTRIBUTES_COMMAND,
      new UpdateNeumeAttributesCommand(editor),
    );
  }
}
