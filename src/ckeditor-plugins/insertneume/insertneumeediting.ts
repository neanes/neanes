import { Plugin, toWidget } from 'ckeditor5';

export const NEUME_ELEMENT = 'neume';
export const NEUME_CLASS = 'neanes-ck-neume';
export const NEUME_CUSTOM_PROPERTY = 'neume';

export default class InsertNeumeEditing extends Plugin {
  static get pluginName() {
    return 'InsertNeumeEditing';
  }

  init() {
    this._registerNeume();
  }

  _registerNeume() {
    const editor = this.editor;

    editor.model.schema.register(NEUME_ELEMENT, {
      isInline: true,
      isObject: true,
      allowWhere: '$text',
      allowAttributes: [
        'char',
        'top',
        'left',
        'width',
        'color',
        'neumeFontSize',
      ],
    });

    editor.conversion.for('downcast').elementToElement({
      model: NEUME_ELEMENT,
      view: (modelElement, { writer }) => {
        const char = modelElement.getAttribute('char') as string;

        let style = '';

        if (modelElement.getAttribute('top') != null) {
          style += `top: ${modelElement.getAttribute('top') ?? 0}em;`;
        }

        if (modelElement.getAttribute('left') != null) {
          style += `left: ${modelElement.getAttribute('left') ?? 0}em;`;
        }

        const width = modelElement.getAttribute('width');

        if (width != null && width !== '') {
          style += `width: ${modelElement.getAttribute('width') ?? 0}em;`;
        }

        const color = modelElement.getAttribute('color');

        if (color != null && color !== '') {
          style += `color: ${modelElement.getAttribute('color')};`;
        }

        if (modelElement.getAttribute('neumeFontSize') != null) {
          style += `font-size: ${modelElement.getAttribute('neumeFontSize') ?? 1}em;`;
        }

        const element = writer.createContainerElement(
          'span',
          {
            class: NEUME_CLASS,
            style,
          },
          [writer.createText(char)],
        );

        writer.setCustomProperty(NEUME_CUSTOM_PROPERTY, true, element);

        return toWidget(element, writer);
      },
    });

    editor.conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: NEUME_CLASS,
      },
      model: (viewElement, { writer }) => {
        let char = '';
        for (const child of viewElement.getChildren()) {
          if (child.is('$text')) {
            char += child.data;
          }
        }

        const color = viewElement.getStyle('color') ?? '';

        const left = parseFloat(
          viewElement.getStyle('left')?.slice(0, -2) ?? '0',
        );

        const top = parseFloat(
          viewElement.getStyle('top')?.slice(0, -2) ?? '0',
        );

        const widthStyle = viewElement.getStyle('width');

        const width = widthStyle?.slice(0, -2) ?? '';

        const neumeFontSize = parseFloat(
          viewElement.getStyle('font-size')?.slice(0, -2) ?? '1',
        );

        return writer.createElement(NEUME_ELEMENT, {
          char,
          left,
          top,
          width,
          color,
          neumeFontSize,
        });
      },
    });

    editor.conversion.for('editingDowncast').add((dispatcher) => {
      dispatcher.on('attribute:color:neume', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);
        if (viewElement && data.attributeNewValue != '') {
          viewWriter.setStyle('color', data.attributeNewValue, viewElement);
        }
      });

      dispatcher.on('attribute:top:neume', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);

        if (viewElement) {
          viewWriter.setStyle(
            'top',
            data.attributeNewValue + 'em',
            viewElement,
          );
        }
      });

      dispatcher.on('attribute:left:neume', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);

        if (viewElement) {
          viewWriter.setStyle(
            'left',
            data.attributeNewValue + 'em',
            viewElement,
          );
        }
      });

      dispatcher.on(
        'attribute:neumeFontSize:neume',
        (evt, data, conversionApi) => {
          const viewWriter = conversionApi.writer;
          const viewElement = conversionApi.mapper.toViewElement(data.item);

          if (viewElement) {
            viewWriter.setStyle(
              'font-size',
              data.attributeNewValue + 'em',
              viewElement,
            );
          }
        },
      );

      dispatcher.on('attribute:width:neume', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);

        if (viewElement) {
          if (data.attributeNewValue != null && data.attributeNewValue !== '') {
            viewWriter.setStyle(
              'width',
              data.attributeNewValue + 'em',
              viewElement,
            );
          } else {
            viewWriter.removeStyle('width', viewElement);
          }
        }
      });
    });
  }
}
