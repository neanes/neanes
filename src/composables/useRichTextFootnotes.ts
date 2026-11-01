import type { Editor } from 'ckeditor5';
import type { InjectionKey } from 'vue';

import type {
  RichTextBoxContentKey,
  RichTextBoxElement,
} from '@/models/Element';
export interface RichTextFootnoteController {
  supports(owner: object): owner is RichTextBoxElement;
  insert(owner: RichTextBoxElement, editor: Editor): void;
  changed(
    owner: RichTextBoxElement,
    key: RichTextBoxContentKey,
    html: string,
  ): void;
  navigate(id: string): void;
  copy(id: string): string;
  paste(owner: RichTextBoxElement, payload: string): string;
  reject(owner?: object): void;
}

export const richTextFootnoteControllerKey: InjectionKey<RichTextFootnoteController> =
  Symbol('richTextFootnotes');
