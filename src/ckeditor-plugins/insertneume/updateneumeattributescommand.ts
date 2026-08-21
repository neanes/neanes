import type { Editor } from 'ckeditor5';
import { Command } from 'ckeditor5';

import type { Note, RootSign } from '@/models/Neumes';

import type { InsertNeumeType } from './insertneumeediting';
import { NEUME_ELEMENT } from './insertneumeediting';

export const UPDATE_NEUME_ATTRIBUTES_COMMAND = 'updateNeumeAttributes';

const DEFAULT_OBSERVABLE_VALUES = {
  top: 0,
  left: 0,
  right: 0,
  alignRight: false,
  kerningLeft: 0,
  kerningRight: 0,
  neumeFontSize: 1,
  neumeLineHeight: 1,
  width: null,
  color: null,
  neumeType: null,
  martyriaNote: null,
  martyriaRootSign: null,
};

export default class UpdateNeumeAttributesCommand extends Command {
  declare top: number;
  declare left: number;
  declare right: number;
  declare alignRight: boolean;
  declare kerningLeft: number;
  declare kerningRight: number;
  declare neumeFontSize: number;
  declare neumeLineHeight: number;
  declare width: number | null;
  declare color: string | null;
  declare neumeType: InsertNeumeType | null;
  declare martyriaNote: Note | null;
  declare martyriaRootSign: RootSign | null;

  constructor(editor: Editor) {
    super(editor);
    this.set(DEFAULT_OBSERVABLE_VALUES);
  }

  override execute(attributes: Record<string, unknown>) {
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

  override refresh() {
    const neume = this._findSelectedNeume();

    if (neume) {
      this.top = coerceNumber(neume.getAttribute('top'), 0);
      this.left = coerceNumber(neume.getAttribute('left'), 0);
      this.right = coerceNumber(neume.getAttribute('right'), 0);
      this.kerningLeft = coerceNumber(neume.getAttribute('kerningLeft'), 0);
      this.kerningRight = coerceNumber(neume.getAttribute('kerningRight'), 0);
      this.neumeFontSize = coerceNumber(neume.getAttribute('neumeFontSize'), 1);
      this.neumeLineHeight = coerceNumber(
        neume.getAttribute('neumeLineHeight'),
        1,
      );
      this.width = coerceNullableNumber(neume.getAttribute('width'));
      this.color = (neume.getAttribute('color') as string) || null;
      this.alignRight = (neume.getAttribute('alignRight') as boolean) ?? false;
      this.neumeType =
        (neume.getAttribute('neumeType') as InsertNeumeType | undefined) ??
        null;
      this.martyriaNote =
        (neume.getAttribute('martyriaNote') as Note | undefined) ?? null;
      this.martyriaRootSign =
        (neume.getAttribute('martyriaRootSign') as RootSign | undefined) ??
        null;
      this.isEnabled = true;
    } else {
      Object.assign(this, DEFAULT_OBSERVABLE_VALUES);
      this.isEnabled = false;
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

function coerceNumber(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function coerceNullableNumber(value: unknown) {
  if (value == null || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}
