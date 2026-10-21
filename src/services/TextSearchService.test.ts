import { describe, expect, it } from 'vitest';

import {
  DropCapElement,
  MartyriaElement,
  NoteElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';

import { TextSearchService } from './TextSearchService';

const service = new TextSearchService();
const note = (lyrics: string) => Object.assign(new NoteElement(), { lyrics });

const boxTypes = [TextBoxElement, RichTextBoxElement];

describe('editor text search', () => {
  it('finds lyric phrases across drop caps, notes and intervening notation', () => {
    const elements = [
      Object.assign(new DropCapElement(), { content: 'Κ' }),
      note('ύ'),
      new MartyriaElement(),
      note('ριε'),
    ];
    expect(service.findTextInElements('Κύ ριε', elements, -1)).toBe(
      elements[0],
    );
    expect(
      service.findTextInElements('Κύριε', elements, elements.length, true),
    ).toBe(elements[0]);
    expect(service.findTextInElements('ριε', elements, -1)).toBe(elements[3]);
  });

  it('composes Greek characters split across multiple elements and ignored characters', () => {
    const elements = [
      Object.assign(new DropCapElement(), { content: 'Α ' }),
      note('\u0313ـ'),
      note('\u0301'),
      note('ξιον'),
    ];
    for (const query of ['Ἄξιον', 'Α\u0313\u0301ξιον', 'Ἄ']) {
      expect(service.findTextInElements(query, elements, -1)).toBe(elements[0]);
      expect(
        service.findTextInElements(query, elements, elements.length, true),
      ).toBe(elements[0]);
    }
    expect(service.findTextInElements('ξιον', elements, -1)).toBe(elements[3]);
  });

  it('matches composed/decomposed text and final sigma without discarding accents', () => {
    const elements = [note('Κυ\u0301ριε'), note('ΛΟ'), note('ΓΟΣ')];
    expect(service.findTextInElements('κύριε', elements, -1)).toBe(elements[0]);
    expect(service.findTextInElements('κυριε', elements, -1)).toBeNull();
    expect(service.findTextInElements('λογος', elements, -1)).toBe(elements[1]);
    expect(service.findTextInElements('λόγος', elements, -1)).toBeNull();
    expect(service.findTextInElements('اب', [note('اـب')], -1)).not.toBeNull();
    expect(service.findTextInElements('اـب', [note('اب')], -1)).not.toBeNull();
  });

  it('decodes escaped lyrics and drop caps before joining them', () => {
    const elements = [
      Object.assign(new DropCapElement(), { content: '&lt;' }),
      note('A&amp;B&gt;'),
    ];
    expect(service.findTextInElements('<A&B>', elements, -1)).toBe(elements[0]);
    expect(service.findTextInElements('amp;', elements, -1)).toBeNull();
  });

  it.each(boxTypes)(
    'searches displayed HTML text in %s, excluding attributes and script/style data',
    (Box) => {
      const box = Object.assign(new Box(), {
        content:
          '<p title="hidden > attribute">A<strong>B</strong>&amp;&#67;</p><p>D&nbsp;E<br>F</p><script>secret</script><style>hidden</style>',
      });
      for (const query of ['AB&C', 'D E F', 'c d', 'D\nE']) {
        expect(service.findTextInElements(query, [box], -1)).toBe(box);
      }
      for (const query of ['hidden', 'secret', 'strong', 'amp;', 'CD', 'DE']) {
        expect(service.findTextInElements(query, [box], -1)).toBeNull();
      }
    },
  );

  it.each(boxTypes)(
    'searches only active panels and keeps each panel separate in %s',
    (Box) => {
      const box = Object.assign(new Box(), {
        content: 'body',
        contentBottom: 'bottom',
        contentLeft: 'left',
        contentCenter: 'center',
        contentRight: 'right',
      });
      expect(service.findTextInElements('bottom', [box], -1)).toBeNull();
      expect(service.findTextInElements('left', [box], -1)).toBeNull();
      box.inline = true;
      expect(service.findTextInElements('bottom', [box], -1)).toBe(box);
      expect(service.findTextInElements('bodybottom', [box], -1)).toBeNull();
      box.multipanel = true;
      for (const query of ['left', 'center', 'right']) {
        expect(service.findTextInElements(query, [box], -1)).toBe(box);
      }
      for (const query of ['body', 'bottom', 'leftcenter']) {
        expect(service.findTextInElements(query, [box], -1)).toBeNull();
      }
    },
  );

  it('does not join lyrics across text boxes, including empty ones', () => {
    for (const Box of boxTypes) {
      const elements = [note('ab'), new Box(), note('cd')];
      expect(service.findTextInElements('abcd', elements, -1)).toBeNull();
    }
  });

  it('navigates forward/backward and wraps using the matching start element', () => {
    const elements = [note('alpha'), note('beta'), note('alpha')];
    expect(service.findTextInElements('alpha', elements, -1)).toBe(elements[0]);
    expect(service.findTextInElements('alpha', elements, 0)).toBe(elements[2]);
    expect(service.findTextInElements('alpha', elements, 2)).toBe(elements[0]);
    expect(service.findTextInElements('alpha', elements, 2, true)).toBe(
      elements[0],
    );
    expect(service.findTextInElements('alpha', elements, 0, true)).toBe(
      elements[2],
    );
    expect(service.findTextInElements('alphabeta', elements, 2, true)).toBe(
      elements[0],
    );
    expect(service.findTextInElements('missing', elements)).toBeNull();
  });

  it('handles overlapping matches, repeated matches in one element, and single-match wrapping', () => {
    const elements = [note('ban'), note('ana'), note('banana')];
    expect(service.findTextInElements('ana', elements, -1)).toBe(elements[0]);
    expect(service.findTextInElements('ana', elements, 0)).toBe(elements[1]);
    expect(service.findTextInElements('ana', elements, 1)).toBe(elements[2]);
    expect(service.findTextInElements('ana', elements, 2, true)).toBe(
      elements[1],
    );
    const single = [note('banana')];
    expect(service.findTextInElements('ana', single, 0)).toBe(single[0]);
    expect(service.findTextInElements('ana', single, 0, true)).toBe(single[0]);
  });

  it('returns no match for empty documents or empty/ignored-only queries', () => {
    for (const query of ['', ' ', '\t\n', 'ـ', ' \tـ']) {
      expect(service.findTextInElements(query, [note('abc')])).toBeNull();
    }
    expect(service.findTextInElements('abc', [])).toBeNull();
  });
});
