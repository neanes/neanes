import './fontsizedropdown.css';

import { Command, DropdownView, Editor, FontSize, Plugin } from 'ckeditor5';

// Work around https://github.com/ckeditor/ckeditor5/issues/2282
export default class FontSizeDropdown extends Plugin {
  static get pluginName() {
    return 'FontSizeDropdown';
  }

  static get requires() {
    return [FontSize];
  }

  init() {
    this.editor.ui.componentFactory.add('fontSizeDropdown', () => {
      const editor: Editor = this.editor;
      const command: Command = editor.commands.get('fontSize')!;

      // Use the original font size dropdown and modify its behavior.
      const dropdownView: DropdownView = editor.ui.componentFactory.create(
        'fontSize',
      ) as DropdownView;

      // Show the label on the dropdown's button.
      dropdownView.buttonView.set('withText', true);

      // Bind the dropdown's button label to the font size command value.
      dropdownView.buttonView
        .bind('label')
        .to(command, 'value', (value: unknown): string => {
          const fontSize = typeof value === 'string' ? value : undefined;
          if (fontSize) {
            return fontSize.replace(/pt$/, '');
          }
          // If no value is set on the command, show the default text. Use the
          // t() method to make this string translatable.
          return editor.t('Default');
        });

      return dropdownView;
    });
  }
}
