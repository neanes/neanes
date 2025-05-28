import {
  ButtonView,
  createDropdown,
  ListView,
  Locale,
  View,
  ViewCollection,
} from 'ckeditor5';

import { InsertNeumeCommandParams } from './insertneumecommand';

export default class InsertNeumeView extends View {
  gridView: View;
  locale: Locale;
  grid: ViewCollection;
  onCharSelect: (char: InsertNeumeCommandParams) => void;

  constructor(
    locale: Locale,
    onCharSelect: (args: InsertNeumeCommandParams) => void,
  ) {
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

  _loadCharactersForBlock(block: CharacterBlock) {
    const characters: GridButtonParams[] = [];
    for (const range of block.ranges) {
      for (let code = range.start; code <= range.end; code++) {
        characters.push({
          char: String.fromCodePoint(code),
          attributes: range.attributes,
        });
      }
    }

    this._renderGrid(characters);
  }

  _renderGrid(characters: GridButtonParams[]) {
    this.grid.clear();

    characters.forEach(({ char, attributes }) => {
      const button = new ButtonView(this.locale);
      button.set({
        label: char,
        withText: true,
      });
      button.on('execute', () => {
        this.onCharSelect({ char, useDefaultStyle: true, attributes });
      });
      this.grid.add(button);
    });
  }
}

export interface CharacterBlock {
  name: string;
  ranges: Array<{ start: number; end: number; attributes?: string[] }>;
}

export interface GridButtonParams {
  char: string;
  attributes?: string[];
}

const CHARACTER_BLOCKS = [
  {
    name: 'Mode Keys - Common',
    ranges: [
      { start: 0xe2a0, end: 0xe2a1 }, // mode 1
      { start: 0xe2a8, end: 0xe2a8 }, // mode 2
      { start: 0xe2b0, end: 0xe2b1 }, // mode 3
      { start: 0xe2b8, end: 0xe2b9 }, // mode 4
      { start: 0xe2ba, end: 0xe2ba }, // mode 4
      { start: 0xe2c0, end: 0xe2c0 }, // mode 5
      { start: 0xe2c8, end: 0xe2c8 }, // mode 6
      { start: 0xe2d0, end: 0xe2d1 }, // mode 7
      { start: 0xe2d8, end: 0xe2d8 }, // mode 8
      { start: 0xe2f0, end: 0xe2f0 }, // plagal
      { start: 0xe190, end: 0xe19f, attributes: ['fthora'] }, // Fthores

      // { start: 0x1d0b6, end: 0x1d0b6, attributes: ['fthora'] }, // Fthores
      // { start: 0x1d0ba, end: 0x1d0bb, attributes: ['fthora'] }, // Fthores
      // { start: 0x1d0bd, end: 0x1d0bd, attributes: ['fthora'] }, // Fthores
      // { start: 0x1d0bf, end: 0x1d0c5, attributes: ['fthora'] }, // Fthores
      // { start: 0x1d0c7, end: 0x1d0cb, attributes: ['fthora'] }, // Fthores
      { start: 0xe004, end: 0xe005 }, // oligonKentimaAbove, oligonYpsiliRight
      { start: 0xe024, end: 0xe025 }, // elafron, runningElafron
      { start: 0xe120, end: 0xe127 }, // chronos
    ],
  },
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
