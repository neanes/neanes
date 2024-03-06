import { ElementType, NoteElement, ScoreElement } from '@/models/Element';

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

      if (
        currentElement.elementType === ElementType.Note &&
        (currentElement as NoteElement).lyrics.trim() !== '' &&
        (q.includes((currentElement as NoteElement).lyrics.toLowerCase()) ||
          (currentElement as NoteElement).lyrics.toLowerCase().includes(q))
      ) {
        let run = '';

        for (let j = i; j < elements.length; j++) {
          const nextElement = reverse
            ? (elements.at(elements.length - j) as NoteElement)!
            : elements.at(j)!;

          if (nextElement.elementType === ElementType.Note) {
            const noteElement = nextElement as NoteElement;

            if (reverse) {
              run = noteElement.lyrics.toLowerCase() + run;
            } else {
              run += noteElement.lyrics.toLowerCase();
            }

            if (run.includes(q)) {
              return currentElement;
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
}
