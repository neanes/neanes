import { Plugin } from 'ckeditor5';

import {
  FONT_STYLE_TOGGLE_BOLD,
  FONT_STYLE_TOGGLE_ITALIC,
} from './fontstylecommand';
import FontStyleEditing from './fontstyleediting';

export default class FontStyle extends Plugin {
  static get pluginName() {
    return 'FontStyle';
  }

  static get requires() {
    return [FontStyleEditing];
  }

  init() {
    const editor = this.editor;
    const t = editor.t;

    // Bold/Italic are no longer their own attributes; CTRL+B / CTRL+I toggle the
    // corresponding axis of the current font style instead.
    editor.keystrokes.set('CTRL+B', (_data, cancel) => {
      editor.execute(FONT_STYLE_TOGGLE_BOLD);
      cancel();
    });

    editor.keystrokes.set('CTRL+I', (_data, cancel) => {
      editor.execute(FONT_STYLE_TOGGLE_ITALIC);
      cancel();
    });

    // Register the keystrokes with the accessibility database, mirroring the
    // built-in Bold/Italic plugins so they surface in the Accessibility help
    // dialog if it is ever added to the build.
    editor.accessibility.addKeystrokeInfos({
      keystrokes: [
        { label: t('Bold text'), keystroke: 'CTRL+B' },
        { label: t('Italic text'), keystroke: 'CTRL+I' },
      ],
    });
  }
}
