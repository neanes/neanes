import {
  ButtonView,
  clickOutsideHandler,
  ContextualBalloon,
  Plugin,
} from 'ckeditor5';

import {
  INSERT_NEUME_COMMAND,
  InsertNeumeCommandParams,
} from './insertneumecommand';
import { NEUME_CUSTOM_PROPERTY } from './insertneumeediting';
import InsertNeumeFormView from './insertneumeformview';
import {
  InsertNeumeAttributeSet,
  InsertNeumeDefaultAttributesType,
} from './insertneumeutil';
import InsertNeumeView from './insertneumeview';
import { UPDATE_NEUME_ATTRIBUTES_COMMAND } from './updateneumeattributescommand';

export default class InsertNeumeUI extends Plugin {
  static get pluginName() {
    return 'InsertNeumeUI';
  }

  static get requires() {
    return [ContextualBalloon];
  }

  init() {
    const editor = this.editor;

    editor.ui.componentFactory.add('insertNeume', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        label: '\ue000',
        withText: true,
        tooltip: 'Insert Neume',
        class: 'ck-button__insert-neume',
      });

      const balloon = editor.plugins.get(ContextualBalloon);

      view.on('execute', () => {
        const gridView = new InsertNeumeView(
          locale,
          (args: InsertNeumeCommandParams) => {
            const defaultAttributesConfig = editor.config.get(
              'insertNeume.defaultAttributes',
            ) as InsertNeumeDefaultAttributesType;

            const neumeFont = editor.config.get<string>(
              'insertNeume.neumeDefaultFontFamily',
            ) as string;

            const defaultAttributeSet = defaultAttributesConfig[
              neumeFont
            ] as InsertNeumeAttributeSet[];

            args.defaultAttributes = defaultAttributeSet.find(
              (x) => x.code === args.code,
            )?.attributes;

            if (defaultAttributeSet) editor.execute(INSERT_NEUME_COMMAND, args);
            balloon.remove(gridView);
            gridView.destroy();
          },
        );

        balloon.add({
          view: gridView,
          position: {
            target: view.element!,
          },
        });
      });

      return view;
    });

    const viewDocument = this.editor.editing.view.document;

    this.listenTo(viewDocument, 'click', (evt, domEventData) => {
      const domTarget = domEventData.domTarget;

      const viewElement = editor.editing.view.domConverter.domToView(domTarget);

      const neumeElement = findNeumeElementAncestor(viewElement);

      if (neumeElement) {
        this._showFormUI(neumeElement);
      }
    });
  }

  _showFormUI(element: any) {
    const editor = this.editor;
    const balloon = editor.plugins.get(ContextualBalloon);
    const view = new InsertNeumeFormView(editor.locale);
    const command = editor.commands.get(UPDATE_NEUME_ATTRIBUTES_COMMAND);

    view.on(
      'change:values',
      (evt, { top, left, width, color, neumeFontSize }) => {
        editor.execute(UPDATE_NEUME_ATTRIBUTES_COMMAND, {
          top,
          left,
          width,
          color,
          neumeFontSize,
        });
      },
    );

    view.on('unshift', () => {
      editor.execute('unshift');
    });

    view.topInput.fieldView.bind('value').to(command as any, 'top');
    view.leftInput.fieldView.bind('value').to(command as any, 'left');
    view.kerningLeftInput.fieldView
      .bind('value')
      .to(command as any, 'kerningLeft');
    view.kerningRightInput.fieldView
      .bind('value')
      .to(command as any, 'kerningRight');
    view.widthInput.fieldView.bind('value').to(command as any, 'width');
    view.fontSizeInput.fieldView
      .bind('value')
      .to(command as any, 'neumeFontSize');
    view.colorInput.bind('selectedColor').to(command as any, 'color');

    balloon.add({
      view,
      position: {
        target: this.editor.editing.view.domConverter.mapViewToDom(element),
      },
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
}

function findNeumeElementAncestor(node: any) {
  if (isNeumeElement(node)) {
    return node;
  }

  return node.getAncestors().find((ancestor: any) => isNeumeElement(ancestor));
}

function isNeumeElement(node: any) {
  return node.is('element') && !!node.getCustomProperty(NEUME_CUSTOM_PROPERTY);
}
