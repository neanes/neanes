import {
  ButtonView,
  createDropdown,
  ListView,
  Locale,
  View,
  ViewCollection,
} from 'ckeditor5';

export default class InsertNeumeView extends View {
  gridView: View;
  locale: Locale;
  grid: ViewCollection;
  onCharSelect: (char: string) => void;

  constructor(locale: Locale, onCharSelect: (char: string) => void) {
    super(locale);

    this.locale = locale;
    this.onCharSelect = onCharSelect;

    const dropdownView = createDropdown(locale);

    dropdownView.set({
      class: 'ck-dropdown__character-block',
    });

    dropdownView.buttonView.set({
      label: CHARACTER_BLOCKS[0].name,
      withText: true,
    });

    const listView = new ListView(locale);
    CHARACTER_BLOCKS.forEach((block) => {
      const item = new ButtonView(locale);
      item.set({ label: block.name, withText: true });
      item.on('execute', () => {
        dropdownView.buttonView.label = block.name;
        this._loadCharactersForBlock(block);
        dropdownView.isOpen = false;
      });
      listView.items.add(item);
    });

    dropdownView.panelView.children.add(listView);

    this.grid = new ViewCollection();

    this.gridView = new View();
    this.gridView.setTemplate({
      tag: 'div',
      attributes: { class: ['special-char-grid'] },
      children: this.grid,
    });

    this.setTemplate({
      tag: 'div',
      children: [dropdownView, this.gridView],
    });

    this._loadCharactersForBlock(CHARACTER_BLOCKS[0]);
  }

  _loadCharactersForBlock(block: any) {
    const characters = [];
    for (const range of block.ranges) {
      for (let code = range.start; code <= range.end; code++) {
        characters.push(String.fromCodePoint(code));
      }
    }

    this._renderGrid(characters);
  }

  _renderGrid(characters: string[]) {
    this.grid.clear();

    characters.forEach((char) => {
      const button = new ButtonView(this.locale);
      button.set({
        label: char,
        withText: true,
      });
      button.on('execute', () => {
        this.onCharSelect(char);
      });
      this.grid.add(button);
    });
  }
}

const CHARACTER_BLOCKS = [
  {
    name: 'SBMuFL - Base',
    ranges: [
      { start: 0xe000, end: 0xe015 },
      { start: 0xe020, end: 0xe02f },
      { start: 0xe040, end: 0xe04e },
      { start: 0xe060, end: 0xe06a },
      { start: 0xe080, end: 0xe08d },
    ],
  },
  {
    name: 'Byzantine Musical Symbols',
    ranges: [
      {
        start: 0x1d000,
        end: 0x1d0ff,
      },
    ],
  },
];
