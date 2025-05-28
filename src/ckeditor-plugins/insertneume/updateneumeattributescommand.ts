import { Command } from 'ckeditor5';

import { NEUME_ELEMENT } from './insertneumeediting';

export const UPDATE_NEUME_ATTRIBUTES_COMMAND = 'updateNeumeAttributes';

export default class UpdateNeumeAttributesCommand extends Command {
  top: number = 0;
  left: number = 0;
  fontSize: number = 1;
  width: number | null = null;
  color: string | null = null;

  execute(attributes: { top?: number; left?: number; width?: number }) {
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
      this.fontSize = (neume.getAttribute('fontSize') as number) ?? 1;
      this.width = (neume.getAttribute('width') as number) ?? null;
      this.color = (neume.getAttribute('color') as string) ?? null;
    } else {
      this.top = 0;
      this.left = 0;
      this.fontSize = 1;
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
