import {
  ButtonView,
  clickOutsideHandler,
  ContextualBalloon,
  Plugin,
} from 'ckeditor5';

import { Note, RootSign } from '@/models/Neumes';
import { TextMeasurementService } from '@/services/TextMeasurementService';

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

            const defaultAttributes = defaultAttributeSet.find(
              (x) => x.neume === args.neume,
            )?.attributes;

            if (defaultAttributes) {
              args = { ...args, ...defaultAttributes };
            }

            editor.execute(INSERT_NEUME_COMMAND, args);
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

        clickOutsideHandler({
          emitter: gridView,
          activator: () => balloon.visibleView === gridView,
          contextElements: [gridView.element!],
          callback: () => {
            balloon.remove(gridView);
            gridView.destroy();
          },
        });
      });

      return view;
    });

    editor.ui.componentFactory.add('insertMartyria', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        label: '\ue139\ue152',
        withText: true,
        tooltip: 'Insert Martyria',
        class: 'ck-button__insert-martyria',
      });

      view.on('execute', () => {
        const defaultAttributesConfig = editor.config.get(
          'insertNeume.defaultAttributesMartyria',
        ) as InsertNeumeDefaultAttributesType;

        const neumeFont = editor.config.get<string>(
          'insertNeume.neumeDefaultFontFamily',
        ) as string;

        const defaultAttributes = defaultAttributesConfig[
          neumeFont
        ] as InsertNeumeAttributeSet[];

        editor.execute(INSERT_NEUME_COMMAND, {
          neumeType: 'martyria',
          martyriaNote: Note.Pa,
          martyriaRootSign: RootSign.Alpha,
          ...defaultAttributes,
        } as InsertNeumeCommandParams);
      });

      return view;
    });

    editor.ui.componentFactory.add('insertPlagal', (locale) => {
      const view = new ButtonView(locale);
      view.set({
        label: 'πλ',
        withText: true,
        tooltip: 'Insert Plagal',
        class: 'ck-button__insert-plagal',
      });

      view.on('execute', () => {
        const neumeFont = editor.config.get<string>(
          'insertNeume.defaultFontFamily',
        ) as string;

        const piHeight = TextMeasurementService.getTextHeight(
          'π',
          `12px "${neumeFont}"`,
        );

        const fontHeight = TextMeasurementService.getFontHeight(
          `12px "${neumeFont}"`,
        );

        const adjustment = 0.2;
        const neumeLineHeight = piHeight / fontHeight + adjustment;

        editor.execute(INSERT_NEUME_COMMAND, {
          neumeType: 'plagal',
          neumeFontSize: 1,
          neumeLineHeight,
        } as InsertNeumeCommandParams);
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
    const view = new InsertNeumeFormView(editor.locale, editor.config, element);
    const command = editor.commands.get(UPDATE_NEUME_ATTRIBUTES_COMMAND);

    view.on('change:values', (evt, args) => {
      editor.execute(UPDATE_NEUME_ATTRIBUTES_COMMAND, args);
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
    view.lineHeightInput.fieldView
      .bind('value')
      .to(command as any, 'neumeLineHeight');
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
        const editorElement = editor.ui.element;

        if (editorElement) {
          editorElement.dispatchEvent(
            new FocusEvent('blur', { bubbles: true }),
          );
        }

        balloon.remove(view);
        view.destroy();
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
