import { describe, expect, it } from 'vitest';

import {
  AnnotationElement,
  DropCapElement,
  MartyriaElement,
  NoteElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';

import {
  findTextMatches,
  normalizeSearchText,
  searchPlainText,
  TextSearchService,
} from './TextSearchService';

const note = (lyrics: string) => Object.assign(new NoteElement(), { lyrics });

describe('shared text search', () => {
  it('matches lyric phrases across notes, drop caps and intervening notation', () => {
    const elements = [
      Object.assign(new DropCapElement(), { content: 'Κ' }),
      note('ύ'),
      new MartyriaElement(),
      note('ριε'),
    ];
    const matches = [...findTextMatches(elements, 'Κύ ριε')];
    expect(matches).toHaveLength(1);
    expect(matches[0].parts.map((part) => part.index)).toEqual([0, 1, 3]);
    expect(
      matches[0].snippet.slice(matches[0].matchStart, matches[0].matchEnd),
    ).toBe('κύριε');
  });

  it('normalizes a complete lyric run and maps composed characters to every contributor', () => {
    const drop = Object.assign(new DropCapElement(), { content: 'Α' });
    const following = note('\u0313\u0301ξιον');
    const elements = [drop, following];
    for (const caseSensitive of [false, true]) {
      for (const query of ['Ἄξιον', 'Α\u0313\u0301ξιον', 'Ἄ']) {
        const matches = [
          ...findTextMatches(elements, query, { caseSensitive }),
        ];
        expect(matches).toHaveLength(1);
        expect(matches[0].parts.map((part) => part.element)).toEqual(elements);
        expect(
          matches[0].snippet.slice(matches[0].matchStart, matches[0].matchEnd),
        ).toBe(normalizeSearchText(query, caseSensitive, true));
      }
    }
    const tail = [...findTextMatches(elements, 'ξιον')];
    expect(tail[0].parts.map((part) => part.element)).toEqual([following]);
    const service = new TextSearchService();
    expect(service.findTextInElements('Ἄξιον', elements, -1)).toBe(drop);
    expect(
      service.findTextInElements('Ἄξιον', elements, elements.length, true),
    ).toBe(drop);
  });

  it('composes marks across multiple elements after removing ignored lyric characters', () => {
    const elements = [
      note('Α '),
      note('\u0313ـ'),
      note('\u0301'),
      note('ξιον'),
    ];
    const matches = [...findTextMatches(elements, 'Ἄξιον')];
    expect(matches).toHaveLength(1);
    expect(matches[0].parts.map((part) => part.element)).toEqual(elements);
    expect(matches[0].snippet).toBe('ἄξιον');
  });

  it('normalizes Unicode and tatweel, preserves accents, and supports case sensitivity', () => {
    expect(normalizeSearchText('اـب')).toBe('اب');
    expect([
      ...findTextMatches([note('ΛΟ'), note('ΓΟΣ')], 'λόγος'),
    ]).toHaveLength(0);
    expect([
      ...findTextMatches([note('ΛΟ'), note('ΓΟΣ')], 'λογος'),
    ]).toHaveLength(1);
    expect([...findTextMatches([note('Κυ\u0301ριε')], 'κύριε')]).toHaveLength(
      1,
    );
    expect([...findTextMatches([note('Κύριε')], 'κυριε')]).toHaveLength(0);
    expect([
      ...findTextMatches([note('Κύριε')], 'κύριε', { caseSensitive: true }),
    ]).toHaveLength(0);
    expect([...findTextMatches([note('اب')], 'اـب')]).toHaveLength(1);
    expect([...findTextMatches([note('abc')], ' \tـ')]).toEqual([]);
  });

  it('extracts rich text without markup, attributes, or script/style content', () => {
    const html =
      '<p title="hidden > attribute">A<strong>B</strong>&amp;&#67;</p><p>D&nbsp;E<br>F</p><script>secret</script><style>hidden</style>';
    expect(normalizeSearchText(searchPlainText(html)).trim()).toBe(
      'ab&c d e f',
    );
    const rich = Object.assign(new RichTextBoxElement(), { content: html });
    const annotation = Object.assign(new AnnotationElement(), {
      text: '<p>Hello <b>world</b></p>',
    });
    expect([...findTextMatches([rich, annotation], 'hidden')]).toEqual([]);
    expect(
      [...findTextMatches([rich, annotation], 'hello world')][0].parts[0].field,
    ).toBe('text');
  });

  it('keeps text panels separate, searches every panel and breaks lyric runs at text boxes', () => {
    const box = Object.assign(new TextBoxElement(), {
      content: 'one',
      contentLeft: 'two',
      contentCenter: 'three',
      contentRight: 'four',
      contentBottom: 'five',
    });
    for (const text of ['one', 'two', 'three', 'four', 'five']) {
      expect([...findTextMatches([box], text)]).toHaveLength(1);
    }
    expect([...findTextMatches([box], 'onetwo')]).toEqual([]);
    expect([...findTextMatches([note('ab'), box, note('cd')], 'abcd')]).toEqual(
      [],
    );
    expect([...findTextMatches([box], 'two', { fields: ['content'] })]).toEqual(
      [],
    );
    expect([...findTextMatches([box], 'one')][0].parts[0].field).toBe(
      'content',
    );
  });

  it('returns overlapping occurrences with bounded snippets', () => {
    const box = Object.assign(new TextBoxElement(), {
      content: 'x'.repeat(1000) + 'banana' + 'y'.repeat(1000),
    });
    const matches = [...findTextMatches([box], 'ana')];
    expect(matches).toHaveLength(2);
    for (const match of matches) {
      expect(match.snippet.length).toBeLessThanOrEqual(123);
      expect(match.snippet.slice(match.matchStart, match.matchEnd)).toBe('ana');
    }
  });

  it('preserves editor forward/backward navigation and wrapping', () => {
    const elements = [note('alpha'), note('beta'), note('alpha')];
    const service = new TextSearchService();
    expect(service.findTextInElements('alpha', elements, -1)).toBe(elements[0]);
    expect(service.findTextInElements('alpha', elements, 0)).toBe(elements[2]);
    expect(service.findTextInElements('alpha', elements, 2)).toBe(elements[0]);
    expect(service.findTextInElements('alpha', elements, 2, true)).toBe(
      elements[0],
    );
    expect(service.findTextInElements('alpha', elements, 0, true)).toBe(
      elements[2],
    );
    expect(service.findTextInElements('missing', elements)).toBeNull();
    expect(service.findTextInElements('', elements)).toBeNull();
  });
});
