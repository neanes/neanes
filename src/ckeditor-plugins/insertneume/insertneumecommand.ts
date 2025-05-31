import { Command } from 'ckeditor5';

import { NEUME_ELEMENT } from './insertneumeediting';
import { InsertNeumeAttributes } from './insertneumeutil';

export const INSERT_NEUME_COMMAND = 'insertNeume';

export interface InsertNeumeCommandParams {
  char: string;
  code: number;
  useDefaultStyle: boolean;
  attributes?: string[];
  defaultAttributes?: Partial<InsertNeumeAttributes>;
}

export default class InsertNeumeCommand extends Command {
  execute(attributes: InsertNeumeCommandParams) {
    const editor = this.editor;
    editor.model.change((writer) => {
      const element = writer.createElement(NEUME_ELEMENT, {
        char: attributes.char,
        ...attributes.defaultAttributes,
      } as any);
      const insertPosition = editor.model.document.selection.getFirstPosition();

      editor.model.insertContent(element, insertPosition);
      editor.focus();
    });
  }
}
