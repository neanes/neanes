import { Command } from 'ckeditor5';

import type { Neume, Note, RootSign } from '@/models/Neumes';

import type { InsertNeumeType } from './insertneumeediting';
import { NEUME_ELEMENT } from './insertneumeediting';
import type { InsertNeumeAttributes } from './insertneumeutil';

export const INSERT_NEUME_COMMAND = 'insertNeume';

export interface InsertNeumeCommandParams extends Partial<InsertNeumeAttributes> {
  neumeType: InsertNeumeType;
  neume?: Neume;
  martyriaNote?: Note;
  martyriaRootSign?: RootSign;
  neumeLineHeight?: number;
}

export default class InsertNeumeCommand extends Command {
  override execute(attributes: InsertNeumeCommandParams) {
    const editor = this.editor;
    editor.model.change((writer) => {
      const element = writer.createElement(
        NEUME_ELEMENT,
        attributes as unknown as Record<string, unknown>,
      );
      editor.model.insertContent(element);
      editor.focus();
    });
  }
}
