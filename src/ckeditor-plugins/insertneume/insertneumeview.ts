import { ButtonView, Locale, View } from 'ckeditor5';

export default class InsertNeumeView extends View {
  constructor(
    locale: Locale,
    characters: string[],
    onCharSelect: (char: string) => void,
  ) {
    super(locale);

    this.setTemplate({
      tag: 'div',
      attributes: { class: ['special-char-grid'] },
      children: characters.map((char) => {
        const charView = new ButtonView(locale);
        charView.set({
          label: char,
          withText: true,
          tooltip: false,
        });

        charView.on('execute', () => onCharSelect(char));
        return charView;
      }),
    });
  }
}
