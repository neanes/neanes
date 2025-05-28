import { Command } from 'ckeditor5';

import { NEUME_ELEMENT } from './insertneumeediting';

export const INSERT_NEUME_COMMAND = 'insertNeume';

export interface InsertNeumeCommandParams {
  char: string;
  useDefaultStyle: boolean;
  attributes?: string[];
}

export default class InsertNeumeCommand extends Command {
  execute({ char }: InsertNeumeCommandParams) {
    const editor = this.editor;
    editor.model.change((writer) => {
      const element = writer.createElement(NEUME_ELEMENT, { char });
      //   editor.model.insertContent(element);
      const insertPosition = editor.model.document.selection.getFirstPosition();

      editor.model.insertContent(element, insertPosition);
      editor.focus();
    });
  }
}
