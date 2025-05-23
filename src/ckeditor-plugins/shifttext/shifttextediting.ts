import { Plugin, ViewElement } from 'ckeditor5';

import ShiftCommand from './shiftcommand';
import UnshiftCommand from './unshiftcommand';

const SHIFT = 'shift';
const UNSHIFT = 'unshift';

export default class ShiftTextEditing extends Plugin {
  init() {
    const editor = this.editor;

    editor.model.schema.extend('$text', { allowAttributes: SHIFT });
    editor.model.schema.setAttributeProperties(SHIFT, {
      isFormatting: true,
      copyOnReplace: true,
    });

    // Conversion from a model attribute to a view element
    editor.conversion.for('downcast').attributeToElement({
      model: SHIFT,

      // Callback function provides access to the model attribute value
      // and the DowncastWriter
      view: (modelAttributeValue, conversionApi) => {
        const { writer } = conversionApi;

        const element = writer.createAttributeElement('span', {
          style: `position: relative; left: ${modelAttributeValue?.left ?? 0}em; top: ${modelAttributeValue?.top ?? 0}em;`,
        });

        writer.setCustomProperty('shift', true, element);
        return element;
      },
    });

    // Conversion from a view element to a model attribute
    editor.conversion.for('upcast').elementToAttribute({
      view: {
        name: 'span',
        styles: { position: 'relative' },
      },
      model: {
        key: SHIFT,

        // Callback function provides access to the view element
        value: (viewElement: ViewElement) => {
          // Remove the `em` unit from the value
          const left = parseFloat(
            viewElement.getStyle('left')?.slice(0, -2) ?? '0',
          );

          const top = parseFloat(
            viewElement.getStyle('top')?.slice(0, -2) ?? '0',
          );
          return { left, top };
        },
      },
    });

    editor.commands.add(SHIFT, new ShiftCommand(editor));
    editor.commands.add(UNSHIFT, new UnshiftCommand(editor));
  }
}
