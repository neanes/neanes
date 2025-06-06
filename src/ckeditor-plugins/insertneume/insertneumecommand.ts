import { Command } from 'ckeditor5';

import { InsertNeumeType, NEUME_ELEMENT } from './insertneumeediting';
import { InsertNeumeAttributes } from './insertneumeutil';

export const INSERT_NEUME_COMMAND = 'insertNeume';

export interface InsertNeumeCommandParams {
  neumeType: InsertNeumeType;
  neume?: number;
  martyriaNote?: number;
  martyriaRootSign?: number;
  defaultAttributes?: Partial<InsertNeumeAttributes>;
}

export default class InsertNeumeCommand extends Command {
  execute(attributes: InsertNeumeCommandParams) {
    const editor = this.editor;
    editor.model.change((writer) => {
      const element = writer.createElement(NEUME_ELEMENT, {
        neume: attributes.neume,
        neumeType: attributes.neumeType,
        martyriaNote: attributes.martyriaNote,
        martyriaRootSign: attributes.martyriaRootSign,
        ...attributes.defaultAttributes,
      } as any);
      const insertPosition = editor.model.document.selection.getFirstPosition();

      editor.model.insertContent(element, insertPosition);
      editor.focus();
    });
  }
}
