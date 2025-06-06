import './insertneume.css';

import { Plugin } from 'ckeditor5';

import InsertNeumeCommand, { INSERT_NEUME_COMMAND } from './insertneumecommand';
import InsertNeumeEditing from './insertneumeediting';
import InsertNeumeUI from './insertneumeui';
import {
  INSERT_NEUME_DEFAULT_ATTRIBUTES,
  INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA,
} from './insertneumeutil';
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

    editor.config.define('insertNeume', {
      lyricsDefaultFontSize: 16,
      neumeDefaultFontFamily: 'Neanes',
      defaultAttributes: INSERT_NEUME_DEFAULT_ATTRIBUTES,
      defaultAttributesMartyria: INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA,
    });

    editor.commands.add(INSERT_NEUME_COMMAND, new InsertNeumeCommand(editor));
    editor.commands.add(
      UPDATE_NEUME_ATTRIBUTES_COMMAND,
      new UpdateNeumeAttributesCommand(editor),
    );
  }
}
