import { Command } from 'ckeditor5';

import type { ModeKeyElement } from '@/models/Element';

import { MODE_KEY_ELEMENT } from './insertmodekeyediting';
import { getModeKeyModelAttributes } from './modekeydata';

export const INSERT_MODE_KEY_COMMAND = 'insertModeKey';

export type InsertModeKeyCommandParams = {
  element: ModeKeyElement;
};

export default class InsertModeKeyCommand extends Command {
  override refresh() {
    this.isEnabled = this.editor.model.schema.checkChild(
      this.editor.model.document.selection.focus!,
      MODE_KEY_ELEMENT,
    );
  }

  override execute({ element }: InsertModeKeyCommandParams) {
    this.editor.model.change((writer) => {
      const modelElement = writer.createElement(
        MODE_KEY_ELEMENT,
        getModeKeyModelAttributes(element),
      );

      this.editor.model.insertObject(modelElement, null, null, {
        setSelection: 'after',
      });
    });

    this.editor.editing.view.focus();
  }
}
