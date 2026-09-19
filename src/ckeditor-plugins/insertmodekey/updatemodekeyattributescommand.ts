import type { ModelElement } from 'ckeditor5';
import { Command } from 'ckeditor5';

import { ModeKeyElement } from '@/models/Element';

import { MODE_KEY_ELEMENT } from './insertmodekeyediting';
import {
  createModeKeyElementFromModel,
  getModeKeyModelAttributes,
  MODE_KEY_MODEL_ATTRIBUTES,
  type ModeKeyModelAttributes,
  toModeKeyEditorAttributes,
} from './modekeydata';

export const UPDATE_MODE_KEY_ATTRIBUTES_COMMAND = 'updateModeKeyAttributes';

export default class UpdateModeKeyAttributesCommand extends Command {
  declare element: ModeKeyElement | null;

  constructor(editor: ConstructorParameters<typeof Command>[0]) {
    super(editor);
    this.set('element', null);
  }

  override execute(element: ModeKeyElement | ModeKeyModelAttributes) {
    const selectedElement = this.findSelectedModeKey();

    if (selectedElement == null) {
      return;
    }

    const attributes = toModeKeyEditorAttributes(
      element instanceof ModeKeyElement
        ? getModeKeyModelAttributes(element)
        : element,
    );

    this.editor.model.change((writer) => {
      for (const key of MODE_KEY_MODEL_ATTRIBUTES) {
        if (!(key in attributes)) {
          continue;
        }

        const value = attributes[key];

        if (value == null) {
          writer.removeAttribute(key, selectedElement);
        } else {
          writer.setAttribute(key, value, selectedElement);
        }
      }
    });
  }

  override refresh() {
    const selectedElement = this.findSelectedModeKey();
    this.element =
      selectedElement == null
        ? null
        : createModeKeyElementFromModel(selectedElement);
    this.isEnabled = selectedElement != null;
  }

  private findSelectedModeKey(): ModelElement | null {
    const selectedElement =
      this.editor.model.document.selection.getSelectedElement();

    return selectedElement?.name === MODE_KEY_ELEMENT ? selectedElement : null;
  }
}
