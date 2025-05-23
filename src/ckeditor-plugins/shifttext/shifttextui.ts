import {
  ButtonView,
  clickOutsideHandler,
  ContextualBalloon,
  createLabeledInputNumber,
  InputNumberView,
  LabeledFieldView,
  Locale,
  Observable,
  Plugin,
  View,
} from 'ckeditor5';

const SHIFT = 'shift';

export default class ShiftTextUI extends Plugin {
  static get requires() {
    return [ContextualBalloon];
  }

  init() {
    const editor = this.editor;

    editor.ui.componentFactory.add('shiftText', (locale) => {
      const command = editor.commands.get(SHIFT)!;
      const view = new ButtonView(locale);
      view.set({
        label: 'Shift Text',
        withText: true,
        //icon: shiftIcon,
        tooltip: true,
        isToggleable: true,
      });

      view.bind('isOn').to(command as Observable & { value: boolean }, 'value');

      this.listenTo(view, 'execute', () => {
        this._showUI();
      });

      return view;
    });

    const viewDocument = this.editor.editing.view.document;

    // Handle click on view document and show panel when selection is placed inside the shift element.
    // Keep panel open until selection will be inside the same shift element.
    this.listenTo(viewDocument, 'click', () => {
      const parentLink = this._getSelectedShiftElement();

      if (parentLink) {
        // Then show panel but keep focus inside editor editable.
        this._showUI();
      }
    });
  }

  _getSelectedShiftElement() {
    const view = this.editor.editing.view;
    const selection = view.document.selection;

    if (selection.isCollapsed) {
      return findShiftElementAncestor(selection.getFirstPosition()!);
    } else {
      // The range for fully selected link is usually anchored in adjacent text nodes.
      // Trim it to get closer to the actual link element.
      const range = selection.getFirstRange()!.getTrimmed();
      const startLink = findShiftElementAncestor(range.start);
      const endLink = findShiftElementAncestor(range.end);

      if (!startLink || startLink != endLink) {
        return null;
      }

      // Check if the link element is fully selected.
      if (view.createRangeIn(startLink).getTrimmed().isEqual(range)) {
        return startLink;
      } else {
        return null;
      }
    }
  }

  _showUI() {
    const editor = this.editor;
    const balloon = editor.plugins.get(ContextualBalloon);
    const view = new ShiftTextPanel(editor.locale);
    const shiftCommand = editor.commands.get(SHIFT);

    view.on('change:values', (evt, { top, left }) => {
      editor.execute(SHIFT, { top, left });
    });

    view.on('unshift', () => {
      editor.execute('unshift');
    });

    view.topInput.fieldView.bind('value').to(shiftCommand as any, 'top');
    view.leftInput.fieldView.bind('value').to(shiftCommand as any, 'left');

    balloon.add({
      view,
      position: this._getBalloonPositionData(),
    });

    clickOutsideHandler({
      emitter: view,
      activator: () => balloon.visibleView === view,
      contextElements: [view.element!],
      callback: () => {
        balloon.remove(view);
        view.destroy();

        // Force a blur on the editor so that an update is triggered
        const domRoot = editor.ui.getEditableElement();
        domRoot?.dispatchEvent(new FocusEvent('blur'));
      },
    });
  }

  _getBalloonPositionData() {
    const view = this.editor.editing.view;
    const viewDocument = view.document;
    const targetLink = this._getSelectedShiftElement();

    const target = targetLink
      ? // When selection is inside link element, then attach panel to this element.
        view.domConverter.mapViewToDom(targetLink)
      : // Otherwise attach panel to the selection.
        view.domConverter.viewRangeToDom(
          viewDocument.selection.getFirstRange()!,
        );

    return { target };
  }
}

class ShiftTextPanel extends View {
  public topInput: LabeledFieldView<InputNumberView>;
  public leftInput: LabeledFieldView<InputNumberView>;

  constructor(locale: Locale) {
    super(locale);

    const topInput = this._createInput('Top (em)', () => {
      this._emitChange();
    });

    const leftInput = this._createInput('Left (em)', () => {
      this._emitChange();
    });

    const unshiftBUtton = this._createButton('Unshift', () => {
      this._emitUnshift();
    });

    this.topInput = topInput;
    this.leftInput = leftInput;

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: 'ck ck-reset_all',
        style: 'padding: 10px;',
      },
      children: [topInput, leftInput, unshiftBUtton],
    });
  }

  _emitChange() {
    this.fire('change:values', {
      top: parseFloat(this.topInput.fieldView.element?.value ?? '0') || 0,
      left: parseFloat(this.leftInput.fieldView.element?.value ?? '0') || 0,
    });
  }

  _emitUnshift() {
    this.fire('unshift');
  }

  _createInput(labelText: string, onChange: (value: string) => void) {
    const input = new LabeledFieldView(this.locale, createLabeledInputNumber);
    input.label = labelText;
    input.fieldView.step = 0.1;
    input.fieldView.on('input', () => {
      onChange(input.fieldView.element!.value);
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

function findShiftElementAncestor(position: any) {
  return position
    .getAncestors()
    .find((ancestor: any) => isShiftElement(ancestor));
}

function isShiftElement(node: any) {
  return node.is('attributeElement') && !!node.getCustomProperty('shift');
}
