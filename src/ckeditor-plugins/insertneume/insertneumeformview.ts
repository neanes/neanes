import {
  ButtonView,
  ColorSelectorColorPickerCancelEvent,
  ColorSelectorExecuteEvent,
  ColorSelectorView,
  createLabeledInputNumber,
  InputNumberView,
  LabeledFieldView,
  Locale,
  View,
} from 'ckeditor5';

export default class InsertNeumeFormView extends View {
  public topInput: LabeledFieldView<InputNumberView>;
  public leftInput: LabeledFieldView<InputNumberView>;
  public widthInput: LabeledFieldView<InputNumberView>;
  public fontSizeInput: LabeledFieldView<InputNumberView>;
  public colorInput: ColorSelectorView;

  constructor(locale: Locale) {
    super(locale);

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

    const widthInput = this._createNumberInput('Width (em)', (width) => {
      this.fire('change:values', {
        width: !isNaN(width) ? width : null,
      });
    });

    const fontSizeInput = this._createNumberInput(
      'Font Size (em)',
      (fontSize) => {
        this.fire('change:values', {
          fontSize: !isNaN(fontSize) ? fontSize : 1,
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

    const unshiftBUtton = this._createButton('Unshift', () => {
      this._emitUnshift();
    });

    this.topInput = topInput;
    this.leftInput = leftInput;
    this.widthInput = widthInput;
    this.colorInput = colorInput;
    this.fontSizeInput = fontSizeInput;

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: 'ck ck-reset_all',
        style: 'padding: 10px;',
      },
      children: [
        topInput,
        leftInput,
        widthInput,
        fontSizeInput,
        colorInput,
        unshiftBUtton,
      ],
    });
  }

  _emitUnshift() {
    this.fire('unshift');
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
        color: 'rgb(255, 255, 255)',
        label: 'White',
        options: { hasBorder: true },
      },
      { color: 'red', label: 'Red', options: { hasBorder: false } },
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
      if (data.source === 'colorPickerSaveButton') {
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
