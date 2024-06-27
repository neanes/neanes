import {
  DropCapElement,
  ElementType,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TextBoxElement,
} from '@/models/Element';
import { TATWEEL } from '@/utils/constants';

export class TextSearchService {
  findTextInElements(
    q: string,
    elements: ScoreElement[],
    index: number = 0,
    reverse: boolean = false,
  ): ScoreElement | null {
    q = q.replace(/\s+/g, '').toLowerCase().replaceAll(TATWEEL, '');

    if (q === '') {
      return null;
    }

    const start = reverse ? elements.length - index + 1 : index + 1;

    for (let i = start; i < elements.length; i++) {
      const currentElement = reverse
        ? elements.at(elements.length - i - 1)
        : elements.at(i);

      if (currentElement == null) {
        continue;
      }

      const text = this.getElementText(currentElement);

      if (text != '' && (q.includes(text) || text.includes(q))) {
        let run = '';

        for (let j = i; j < elements.length; j++) {
          const nextElement = reverse
            ? elements.at(elements.length - 1 - j)
            : elements.at(j);

          if (nextElement == null) {
            continue;
          }

          const text = this.getElementText(nextElement);

          if (text != '') {
            if (reverse) {
              run = text + run;
            } else {
              run += text;
            }

            if (run.includes(q)) {
              return reverse ? nextElement : currentElement;
            }

            if (!q.includes(run)) {
              break;
            }
          }
        }
      }
    }

    if (reverse && index !== elements.length + 1) {
      return this.findTextInElements(q, elements, elements.length + 1, reverse);
    } else if (!reverse && index !== -1) {
      return this.findTextInElements(q, elements, -1, reverse);
    }

    return null;
  }

  private getElementText(element: ScoreElement) {
    let text = '';

    if (element.elementType === ElementType.Note) {
      text = (element as NoteElement).lyrics;
    } else if (element.elementType === ElementType.DropCap) {
      text = (element as DropCapElement).content;
    } else if (element.elementType === ElementType.TextBox) {
      text = (element as TextBoxElement).content;
    } else if (element.elementType === ElementType.RichTextBox) {
      text = (element as RichTextBoxElement).content;
    }

    return text.toLowerCase().replaceAll(TATWEEL, '');
  }
}
