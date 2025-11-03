import { Command, DropdownView, Editor, FontFamily, Plugin } from 'ckeditor5';

// Work around https://github.com/ckeditor/ckeditor5/issues/2282
export default class FontFamilyDropdown extends Plugin {
  static get pluginName() {
    return 'FontFamilyDropdown';
  }

  static get requires() {
    return [FontFamily];
  }

  init() {
    this.editor.ui.componentFactory.add('fontFamilyDropdown', () => {
      const editor: Editor = this.editor;
      const command: Command = editor.commands.get('fontFamily')!;

      // Use the original font family dropdown and modify its behavior.
      const dropdownView: DropdownView = editor.ui.componentFactory.create(
        'fontFamily',
      ) as DropdownView;

      // Show the label on the dropdown's button.
      dropdownView.buttonView.set('withText', true);

      // Bind the dropdown's button label to the font family command value.
      dropdownView.buttonView
        .bind('label')
        .to(command, 'value', (value: unknown): string => {
          const fontFamily = typeof value === 'string' ? value : undefined;
          if (fontFamily) {
            return fontFamily
              .split(',')[0]
              .trim()
              .replace(/^'(.*)'$/, '$1');
          }
          // If no value is set on the command, show the default text. Use the
          // t() method to make this string translatable.
          return editor.t('Default');
        });

      return dropdownView;
    });
  }
}
