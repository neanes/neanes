import {
  ButtonView,
  ColorSelectorColorPickerCancelEvent,
  ColorSelectorExecuteEvent,
  ColorSelectorView,
  Config,
  createDropdown,
  createLabeledInputNumber,
  EditorConfig,
  Element,
  InputNumberView,
  LabeledFieldView,
  ListView,
  Locale,
  View,
  ViewCollection,
} from 'ckeditor5';
import i18next from 'i18next';

import { NOTE_LABEL_KEYS } from '@/models/NeumeI18nMappings';
import { Note, RootSign } from '@/models/Neumes';
import { NeumeMappingService } from '@/services/NeumeMappingService';

import { InsertNeumeType } from './insertneumeediting';

export default class InsertNeumeFormView extends View {
  public topInput: LabeledFieldView<InputNumberView>;
  public leftInput: LabeledFieldView<InputNumberView>;
  public kerningLeftInput: LabeledFieldView<InputNumberView>;
  public kerningRightInput: LabeledFieldView<InputNumberView>;
  public widthInput: LabeledFieldView<InputNumberView>;
  public fontSizeInput: LabeledFieldView<InputNumberView>;
  public colorInput: ColorSelectorView;
  public config: Config<EditorConfig>;

  constructor(locale: Locale, config: Config<EditorConfig>, element: Element) {
    super(locale);

    this.config = config;

    const topInput = this._createNumberInput('Top (em)', (top) => {
      this.fire('change:values', {
        top: !isNaN(top) ? top : 0,
      });
    });

    const leftInput = this._createNumberInput('Left (em)', (left) => {
      this.fire('change:values', {
        left: !isNaN(left) ? left : 0,
      });
    });

    const kerningLeftInput = this._createNumberInput(
      'Left Kerning (em)',
      (value) => {
        this.fire('change:values', {
          kerningLeft: !isNaN(value) ? value : 0,
        });
      },
    );

    const kerningRightInput = this._createNumberInput(
      'Right Kerning (em)',
      (value) => {
        this.fire('change:values', {
          kerningRight: !isNaN(value) ? value : 0,
        });
      },
    );

    const widthInput = this._createNumberInput('Width (em)', (width) => {
      this.fire('change:values', {
        width: !isNaN(width) ? width : null,
      });
    });

    const fontSizeInput = this._createNumberInput(
      'Font Size (em)',
      (neumeFontSize) => {
        this.fire('change:values', {
          neumeFontSize: !isNaN(neumeFontSize) ? neumeFontSize : 1,
        });
      },
    );

    const colorInput = this._createColorInput((color: string) => {
      this.fire('change:values', {
        color,
      });
    });

    widthInput.fieldView.min = 0;
    widthInput.fieldView.placeholder = 'auto';

    fontSizeInput.fieldView.min = 0;
    fontSizeInput.fieldView.placeholder = '1';

    this.topInput = topInput;
    this.leftInput = leftInput;
    this.kerningLeftInput = kerningLeftInput;
    this.kerningRightInput = kerningRightInput;
    this.widthInput = widthInput;
    this.colorInput = colorInput;
    this.fontSizeInput = fontSizeInput;

    const children: View[] = [
      topInput,
      leftInput,
      kerningLeftInput,
      kerningRightInput,
      fontSizeInput,
      colorInput,
    ];

    const neumeType = element.getAttribute('neumeType') as InsertNeumeType;

    if (neumeType === 'martyria') {
      const martyriaNote = element.getAttribute('martyriaNote') as Note;
      const martyriaRootSign = element.getAttribute(
        'martyriaRootSign',
      ) as RootSign;

      const noteOptions = Object.entries(NOTE_LABEL_KEYS).map(
        ([key, value]) => ({
          label: i18next.t(value),
          value: key,
        }),
      );

      const martyriaNoteDropdown = this._createGridDropdown(
        i18next.t(martyriaNote),
        ['martyria-note-grid'],
        noteOptions,
        (martyriaNote: string) => {
          this.fire('change:values', {
            martyriaNote,
          });
        },
      );

      martyriaNoteDropdown.set({
        class: 'ck-dropdown__martyria-note',
      });

      const rootSignOptions = ROOT_SIGNS.map((key) => ({
        label: NeumeMappingService.getMapping((key + 'Low') as RootSign).text,
        value: key,
      }));

      const martyriaRootSignDropdown = this._createGridDropdown(
        NeumeMappingService.getMapping((martyriaRootSign + 'Low') as RootSign)
          .text,
        ['martyria-root-sign-grid'],
        rootSignOptions,
        (martyriaRootSign: string) => {
          this.fire('change:values', {
            martyriaRootSign,
          });
        },
      );

      martyriaRootSignDropdown.set({
        class: 'ck-dropdown__martyria-root-sign',
      });

      children.unshift(martyriaRootSignDropdown);
      children.unshift(martyriaNoteDropdown);
    }

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: 'ck ck-reset_all',
        style: 'padding: 10px;',
      },
      children,
    });
  }

  _createNumberInput(labelText: string, onChange: (value: number) => void) {
    const input = new LabeledFieldView(this.locale, createLabeledInputNumber);
    input.label = labelText;
    input.fieldView.step = 0.1;
    input.fieldView.on('input', () => {
      onChange(input.fieldView.element!.valueAsNumber);
    });

    return input;
  }

  _createColorInput(onChange: (value: string) => void) {
    const colorDefinitions = [
      { color: '#000', label: 'Black', options: { hasBorder: false } },
      {
        color: this.config.get('insertNeume.fthoraDefaultColor')!,
        label: 'Fthora',
        options: { hasBorder: false },
      },
    ];

    const input = new ColorSelectorView(this.locale!, {
      colors: colorDefinitions,
      colorPickerLabel: 'Color',
      columns: 5,
      removeButtonLabel: 'Remove color',
      documentColorsLabel: 'Document colors',
      documentColorsCount: 4,
      colorPickerViewConfig: {
        format: 'hsl',
      },
    });
    input.on('colorSelected', (event, { color }) => {
      onChange(color);
    });

    input.appendUI();
    input.selectedColor = 'red';
    input.updateSelectedColors();

    input.on<ColorSelectorExecuteEvent>('execute', (evt, data) => {
      if (
        data.source === 'colorPickerSaveButton' ||
        data.source === 'staticColorsGrid'
      ) {
        onChange(data.value);
        input.showColorGridsFragment();
        input.updateSelectedColors();
      }
    });

    input.on<ColorSelectorColorPickerCancelEvent>('colorPicker:cancel', () => {
      input.showColorGridsFragment();
    });

    return input;
  }

  _createDropdown(
    label: string,
    options: Array<{ label: string; value: string }>,
    onChange: (optionText: string) => void,
  ) {
    const dropdownView = createDropdown(this.locale);
    dropdownView.buttonView.set({
      label,
      withText: true,
    });

    const listView = new ListView(this.locale);
    options.forEach(({ label, value }) => {
      const button = new ButtonView(this.locale);
      button.set({ label, withText: true });
      button.on('execute', () => {
        onChange(value);
        dropdownView.buttonView.label = label;
        dropdownView.isOpen = false;
      });
      listView.items.add(button);
    });

    dropdownView.panelView.children.add(listView);

    return dropdownView;
  }

  _createGridDropdown(
    label: string,
    classes: string[],
    options: Array<{ label: string; value: string }>,
    onChange: (optionText: string) => void,
  ) {
    const dropdownView = createDropdown(this.locale);
    dropdownView.buttonView.set({
      label,
      withText: true,
    });

    const grid = new ViewCollection();
    options.forEach(({ label, value }) => {
      const button = new ButtonView(this.locale);
      button.set({ label, withText: true });
      button.on('execute', () => {
        onChange(value);
        dropdownView.buttonView.label = label;
        dropdownView.isOpen = false;
      });
      grid.add(button);
    });

    const gridView = new View();
    gridView.setTemplate({
      tag: 'div',
      attributes: { class: classes },
      children: grid,
    });

    dropdownView.panelView.children.add(gridView);

    return dropdownView;
  }

  _createButton(label: string, onExecute: () => void) {
    const button = new ButtonView(this.locale);

    button.set({
      label,
      withText: true,
      //icon,
      tooltip: true,
    });

    button.on('execute', onExecute);

    return button;
  }
}

const ROOT_SIGNS: RootSign[] = [
  RootSign.Zo,
  RootSign.Delta,
  RootSign.Alpha,
  RootSign.Legetos,
  RootSign.Nana,
  RootSign.DeltaDotted,
  RootSign.AlphaDotted,
  RootSign.SoftChromaticSquiggle,
  RootSign.Squiggle,
  RootSign.Tilt,
  RootSign.SoftChromaticPaRootSign,
  RootSign.Zygos,
];
