import { Command } from 'ckeditor5';

import { Neume, Note, RootSign } from '@/models/Neumes';

import { InsertNeumeType, NEUME_ELEMENT } from './insertneumeediting';
import { InsertNeumeAttributes } from './insertneumeutil';

export const INSERT_NEUME_COMMAND = 'insertNeume';

export interface InsertNeumeCommandParams
  extends Partial<InsertNeumeAttributes> {
  neumeType: InsertNeumeType;
  neume?: Neume;
  martyriaNote?: Note;
  martyriaRootSign?: RootSign;
  neumeLineHeight?: number;
}

export default class InsertNeumeCommand extends Command {
  execute(attributes: InsertNeumeCommandParams) {
    const editor = this.editor;
    editor.model.change((writer) => {
      const element = writer.createElement(
        NEUME_ELEMENT,
        attributes as unknown as Record<string, unknown>,
      );
      const insertPosition = editor.model.document.selection.getFirstPosition();

      editor.model.insertContent(element, insertPosition);
      editor.focus();
    });
  }
}
