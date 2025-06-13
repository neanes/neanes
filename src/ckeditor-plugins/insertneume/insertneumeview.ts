import {
  ButtonView,
  createDropdown,
  ListView,
  Locale,
  View,
  ViewCollection,
} from 'ckeditor5';

import { Neume } from '@/models/Neumes';
import { NeumeMappingService } from '@/services/NeumeMappingService';

import { InsertNeumeCommandParams } from './insertneumecommand';
import {
  CharacterBlock,
  INSERT_NEUME_CHARACTER_BLOCKS,
} from './insertneumeutil';

export default class InsertNeumeView extends View {
  gridView: View;
  locale: Locale;
  grid: ViewCollection;
  onCharSelect: (args: InsertNeumeCommandParams) => void;

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
      label: INSERT_NEUME_CHARACTER_BLOCKS[0].name,
      withText: true,
    });

    const listView = new ListView(locale);
    INSERT_NEUME_CHARACTER_BLOCKS.forEach((block) => {
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

    this._loadCharactersForBlock(INSERT_NEUME_CHARACTER_BLOCKS[0]);
  }

  _loadCharactersForBlock(block: CharacterBlock) {
    const characters: GridButtonParams[] = [];
    for (const neume of block.neumes) {
      const mapping = NeumeMappingService.getMapping(neume);
      characters.push({
        label: mapping?.text ?? '',
        salt: mapping?.salt,
        neume: neume,
      });
    }

    this._renderGrid(characters);
  }

  _renderGrid(characters: GridButtonParams[]) {
    this.grid.clear();

    characters.forEach(({ label: char, neume, salt }) => {
      const button = new ButtonView(this.locale);
      button.set({
        label: char,
        withText: true,
      });

      if (salt) {
        console.log('adding salt');
        button.set({
          class: 'salt',
        });
      }

      button.on('execute', () => {
        this.onCharSelect({
          neumeType: 'single',
          neume,
        });
      });
      this.grid.add(button);
    });
  }
}

export interface GridButtonParams {
  label: string;
  neume: Neume;
  salt?: number;
}
