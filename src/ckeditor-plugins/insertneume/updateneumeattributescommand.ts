import { Command } from 'ckeditor5';

import { NEUME_ELEMENT } from './insertneumeediting';

export const UPDATE_NEUME_ATTRIBUTES_COMMAND = 'updateNeumeAttributes';

export default class UpdateNeumeAttributesCommand extends Command {
  top: number = 0;
  left: number = 0;
  right: number = 0;
  alignRight: boolean = false;
  kerningLeft: number = 0;
  kerningRight: number = 0;
  neumeFontSize: number = 1;
  neumeLineHeight: number = 1;
  width: number | null = null;
  color: string | null = null;

  execute(attributes: Record<string, unknown>) {
    const model = this.editor.model;

    const neumeElement = this._findSelectedNeume();

    if (!neumeElement) {
      return;
    }

    model.change((writer) => {
      for (const [key, value] of Object.entries(attributes)) {
        if (value !== undefined) {
          if (value === null) {
            writer.removeAttribute(key, neumeElement);
          } else {
            writer.setAttribute(key, value, neumeElement);
          }
        }
      }
    });
  }

  refresh() {
    const neume = this._findSelectedNeume();

    this.isEnabled = !!neume;

    if (neume) {
      this.top = (neume.getAttribute('top') as number) ?? 0;
      this.left = (neume.getAttribute('left') as number) ?? 0;
      this.right = (neume.getAttribute('right') as number) ?? 0;
      this.kerningLeft = (neume.getAttribute('kerningLeft') as number) ?? 0;
      this.kerningRight = (neume.getAttribute('kerningRight') as number) ?? 0;
      this.neumeFontSize = (neume.getAttribute('neumeFontSize') as number) ?? 1;
      this.neumeLineHeight =
        (neume.getAttribute('neumeLineHeight') as number) ?? 1;
      this.width = (neume.getAttribute('width') as number) ?? null;
      this.color = (neume.getAttribute('color') as string) ?? null;
      this.alignRight = (neume.getAttribute('alignRight') as boolean) ?? false;
    } else {
      this.top = 0;
      this.left = 0;
      this.right = 0;
      this.alignRight = false;
      this.kerningLeft = 0;
      this.kerningRight = 0;
      this.neumeFontSize = 1;
      this.neumeLineHeight = 1;
      this.width = null;
      this.color = null;
    }
  }

  _findSelectedNeume() {
    const selection = this.editor.model.document.selection;
    const selectedElement = selection.getSelectedElement();

    if (!!selectedElement && selectedElement.name === NEUME_ELEMENT) {
      return selectedElement;
    }

    return null;
  }
}
