import { Plugin, toWidget, ViewNode } from 'ckeditor5';

import { Neume, Note, RootSign } from '@/models/Neumes';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { normalizeRootSign } from '@/utils/NeumeUtils';

export const NEUME_ELEMENT = 'neume';
export const NEUME_CLASS = 'neanes-ck-neume';
export const NEUME_PLAGAL_CLASS = 'neanes-ck-neume-plagal';
export const NEUME_ALIGN_RIGHT_CLASS = 'neanes-ck-neume-align-right';
export const NEUME_CUSTOM_PROPERTY = 'neume';

export type InsertNeumeType = 'single' | 'martyria' | 'plagal';

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
        'neume',
        'top',
        'left',
        'kerningLeft',
        'kerningRight',
        'alignRight',
        'right',
        'width',
        'color',
        'neumeFontSize',
        'neumeLineHeight',
        'neumeType',
        'martyriaNote',
        'martyriaRootSign',
        'fontFamily',
        'bold',
        'italic',
      ],
    });

    editor.conversion.for('downcast').elementToElement({
      model: NEUME_ELEMENT,
      view: (modelElement, { writer }) => {
        const neumeType = modelElement.getAttribute(
          'neumeType',
        ) as InsertNeumeType;

        const neume = modelElement.getAttribute('neume') as Neume;
        const martyriaNote = modelElement.getAttribute('martyriaNote') as Note;
        const martyriaRootSign = modelElement.getAttribute(
          'martyriaRootSign',
        ) as RootSign;

        let style = '';

        if (modelElement.getAttribute('top') != null) {
          style += `top: ${modelElement.getAttribute('top') ?? 0}em;`;
        }

        const alignRight = modelElement.getAttribute('alignRight') as boolean;

        if (!alignRight && modelElement.getAttribute('left') != null) {
          style += `left: ${modelElement.getAttribute('left') ?? 0}em;`;
        }

        if (alignRight && modelElement.getAttribute('right') != null) {
          style += `right: ${modelElement.getAttribute('right') ?? 0}em;`;
        }

        if (modelElement.getAttribute('kerningLeft') != null) {
          style += `margin-left: ${modelElement.getAttribute('kerningLeft') ?? 0}em;`;
        }

        if (modelElement.getAttribute('kerningRight') != null) {
          style += `margin-right: ${modelElement.getAttribute('kerningRight') ?? 0}em;`;
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
          const fontSize = modelElement.getAttribute('neumeFontSize') as number;
          const defaultFontSize = this.editor.config.get(
            'insertNeume.defaultFontSize',
          ) as number;

          const actualFontSize = fontSize * defaultFontSize;

          style += `font-size: ${actualFontSize}px;`;

          if (neumeType === 'plagal') {
            const lineHeight = modelElement.getAttribute(
              'neumeLineHeight',
            ) as number;

            style += `line-height: ${lineHeight};`;
            style += `height: ${defaultFontSize}px;`;
          } else {
            style += `line-height: ${defaultFontSize}px;`;
          }
        }

        const attributes: Record<string, unknown> = {
          class: NEUME_CLASS,
          style,
          neumeType,
        };

        if (alignRight) {
          attributes['alignRight'] = true;
        }

        const children: ViewNode[] = [];

        switch (neumeType) {
          case 'single':
            const singleMapping = NeumeMappingService.getMapping(neume);
            const singleText = singleMapping?.text ?? '';
            children.push(writer.createText(singleText));
            attributes['neume'] = neume;

            if (singleMapping?.salt) {
              attributes.style += 'font-feature-settings: "salt";';
            }
            break;
          case 'martyria':
            const martyriaText = this._getMartyriaText(
              martyriaNote,
              martyriaRootSign,
            );
            children.push(writer.createText(martyriaText));
            attributes['martyriaNote'] = martyriaNote;
            attributes['martyriaRootSign'] = martyriaRootSign;
            break;
          case 'plagal':
            children.push(
              writer.createContainerElement('span', {}, writer.createText('λ')),
            );
            children.push(
              writer.createContainerElement('span', {}, writer.createText('π')),
            );
            attributes.class += ` ${NEUME_PLAGAL_CLASS}`;
          default:
            break;
        }

        if (alignRight) {
          attributes.class += ` ${NEUME_ALIGN_RIGHT_CLASS}`;
        }

        const element = writer.createContainerElement(
          'span',
          attributes,
          children,
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
        const neumeType = viewElement.getAttribute('neumetype');

        const neume = viewElement.getAttribute('neume');
        const martyriaNote = viewElement.getAttribute('martyrianote');
        const martyriaRootSign = viewElement.getAttribute('martyriarootsign');

        const alignRight = viewElement.getAttribute('alignright') === 'true';

        const color = viewElement.getStyle('color') ?? '';

        const left = parseFloat(
          viewElement.getStyle('left')?.slice(0, -2) ?? '0',
        );

        const right = parseFloat(
          viewElement.getStyle('right')?.slice(0, -2) ?? '0',
        );

        const kerningLeft = parseFloat(
          viewElement.getStyle('margin-left')?.slice(0, -2) ?? '0',
        );

        const kerningRight = parseFloat(
          viewElement.getStyle('margin-right')?.slice(0, -2) ?? '0',
        );

        const top = parseFloat(
          viewElement.getStyle('top')?.slice(0, -2) ?? '0',
        );

        const widthStyle = viewElement.getStyle('width');

        const width = widthStyle?.slice(0, -2) ?? '';

        const fontSizePx = parseFloat(
          viewElement.getStyle('font-size')?.slice(0, -2) ?? '16',
        );

        const defaultFontSize = this.editor.config.get(
          'insertNeume.defaultFontSize',
        ) as number;

        const neumeLineHeight =
          neumeType === 'plagal'
            ? viewElement.getStyle('line-height')
            : undefined;

        const neumeFontSize = fontSizePx / defaultFontSize;

        return writer.createElement(NEUME_ELEMENT, {
          neume,
          left,
          top,
          kerningLeft,
          kerningRight,
          alignRight,
          right,
          width,
          color,
          neumeFontSize,
          neumeLineHeight,
          neumeType,
          martyriaNote,
          martyriaRootSign,
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

      dispatcher.on('attribute:right:neume', (evt, data, conversionApi) => {
        const viewWriter = conversionApi.writer;
        const viewElement = conversionApi.mapper.toViewElement(data.item);

        if (viewElement) {
          viewWriter.setStyle(
            'right',
            data.attributeNewValue + 'em',
            viewElement,
          );
        }
      });

      dispatcher.on(
        'attribute:alignRight:neume',
        (evt, data, conversionApi) => {
          const viewWriter = conversionApi.writer;
          const viewElement = conversionApi.mapper.toViewElement(data.item);

          if (viewElement) {
            if (data.attributeNewValue === true) {
              viewWriter.setAttribute('alignRight', true, viewElement);
              viewWriter.addClass(NEUME_ALIGN_RIGHT_CLASS, viewElement);
            } else {
              viewWriter.removeClass(NEUME_ALIGN_RIGHT_CLASS, viewElement);
              viewWriter.removeAttribute('alignRight', viewElement);
            }
          }
        },
      );

      dispatcher.on(
        'attribute:kerningLeft:neume',
        (evt, data, conversionApi) => {
          const viewWriter = conversionApi.writer;
          const viewElement = conversionApi.mapper.toViewElement(data.item);

          if (viewElement) {
            viewWriter.setStyle(
              'margin-left',
              data.attributeNewValue + 'em',
              viewElement,
            );
          }
        },
      );

      dispatcher.on(
        'attribute:kerningRight:neume',
        (evt, data, conversionApi) => {
          const viewWriter = conversionApi.writer;
          const viewElement = conversionApi.mapper.toViewElement(data.item);

          if (viewElement) {
            viewWriter.setStyle(
              'margin-right',
              data.attributeNewValue + 'em',
              viewElement,
            );
          }
        },
      );

      dispatcher.on(
        'attribute:neumeFontSize:neume',
        (evt, data, conversionApi) => {
          const viewWriter = conversionApi.writer;
          const viewElement = conversionApi.mapper.toViewElement(data.item);

          if (viewElement) {
            const defaultFontSize = this.editor.config.get(
              'insertNeume.defaultFontSize',
            ) as number;

            viewWriter.setStyle(
              'font-size',
              data.attributeNewValue * defaultFontSize + 'px',
              viewElement,
            );
          }
        },
      );

      dispatcher.on(
        'attribute:neumeLineHeight:neume',
        (evt, data, conversionApi) => {
          const viewWriter = conversionApi.writer;
          const viewElement = conversionApi.mapper.toViewElement(data.item);

          if (viewElement) {
            const neumeType = data.item.getAttribute(
              'neumeType',
            ) as InsertNeumeType;

            if (neumeType === 'plagal') {
              viewWriter.setStyle(
                'line-height',
                data.attributeNewValue,
                viewElement,
              );
            }
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

      dispatcher.on(
        'attribute:martyriaNote:neume',
        (evt, data, conversionApi) => {
          const viewWriter = conversionApi.writer;
          const viewElement = conversionApi.mapper.toViewElement(data.item);

          if (viewElement && data.attributeNewValue != null) {
            const martyriaRootSign = data.item.getAttribute('martyriaRootSign');
            const martyriaNote = data.attributeNewValue;

            viewWriter.setAttribute('martyrianote', martyriaNote, viewElement);

            for (const child of Array.from(
              viewElement.getChildren(),
            ) as ViewNode[]) {
              if (child.is('$text')) {
                viewWriter.remove(child);
              }
            }

            const textNode = viewWriter.createText(
              this._getMartyriaText(martyriaNote, martyriaRootSign),
            );

            viewWriter.insert(
              viewWriter.createPositionAt(viewElement, 0),
              textNode,
            );
          }
        },
      );

      dispatcher.on(
        'attribute:martyriaRootSign:neume',
        (evt, data, conversionApi) => {
          const viewWriter = conversionApi.writer;
          const viewElement = conversionApi.mapper.toViewElement(data.item);

          if (viewElement && data.attributeNewValue != null) {
            const martyriaNote = data.item.getAttribute('martyriaNote');
            const martyriaRootSign = data.attributeNewValue;

            viewWriter.setAttribute(
              'martyriarootsign',
              martyriaRootSign,
              viewElement,
            );

            for (const child of Array.from(
              viewElement.getChildren(),
            ) as ViewNode[]) {
              if (child.is('$text')) {
                viewWriter.remove(child);
              }
            }

            const textNode = viewWriter.createText(
              this._getMartyriaText(martyriaNote, martyriaRootSign),
            );

            viewWriter.insert(
              viewWriter.createPositionAt(viewElement, 0),
              textNode,
            );
          }
        },
      );
    });
  }

  _getMartyriaText(martyriaNote: Note, martyriaRootSign: RootSign) {
    martyriaRootSign = normalizeRootSign(martyriaNote, martyriaRootSign);

    return (
      (NeumeMappingService.getMapping(martyriaNote)?.text ?? '') +
      (NeumeMappingService.getMapping(martyriaRootSign)?.text ?? '')
    );
  }
}
