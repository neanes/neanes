import {
  DropCapElement,
  ElementType,
  NoteElement,
  ScoreElement,
} from '@/models/Element';

export class TextSearchService {
  findTextInElements(
    q: string,
    elements: ScoreElement[],
    index: number = 0,
    reverse: boolean = false,
  ): ScoreElement | null {
    q = q.replace(/\s+/g, '').toLowerCase();

    if (q === '') {
      return null;
    }

    const start = reverse ? elements.length - index + 1 : index + 1;

    for (let i = start; i < elements.length; i++) {
      const currentElement = reverse
        ? elements.at(elements.length - i)!
        : elements.at(i)!;

      const text = this.getElementText(currentElement);

      if (text != '' && (q.includes(text) || text.includes(q))) {
        let run = '';

        for (let j = i; j < elements.length; j++) {
          const nextElement = reverse
            ? elements.at(elements.length - j)!
            : elements.at(j)!;

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

    if (reverse && index !== elements.length) {
      return this.findTextInElements(q, elements, elements.length, reverse);
    } else if (!reverse && index !== 0) {
      return this.findTextInElements(q, elements, 0, reverse);
    }

    return null;
  }

  private getElementText(element: ScoreElement) {
    let text = '';

    if (element.elementType === ElementType.Note) {
      text = (element as NoteElement).lyrics.toLowerCase();
    } else if (element.elementType === ElementType.DropCap) {
      text = (element as DropCapElement).content.toLowerCase();
    }

    return text;
  }
}
