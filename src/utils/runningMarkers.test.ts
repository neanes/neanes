import { describe, expect, it } from 'vitest';

import { RichTextBoxElement, TextBoxElement } from '@/models/Element';
import { Line, Page } from '@/models/Page';

import {
  resolveRunningMarkerPageMetadata,
  resolveRunningMarkerText,
} from './runningMarkers';

function createPage(...elements: Array<TextBoxElement | RichTextBoxElement>) {
  const page = new Page();
  const line = new Line();
  line.elements = elements;
  page.lines = [line];
  return page;
}

describe('running markers', () => {
  it('resolves markers across pages with inheritance and chapter openings', () => {
    const section = new RichTextBoxElement();
    section.runningMarkerRole = 'section';
    section.content = '<p>  Section <strong>1</strong> </p>';

    const chapterOne = new TextBoxElement();
    chapterOne.runningMarkerRole = 'chapter';
    chapterOne.content = 'Ignored chapter text';
    chapterOne.runningMarkerText = 'Chapter 1';

    const firstSectionOnPageWins = new TextBoxElement();
    firstSectionOnPageWins.runningMarkerRole = 'section';
    firstSectionOnPageWins.content = 'Section A';

    const ignoredSecondSection = new TextBoxElement();
    ignoredSecondSection.runningMarkerRole = 'section';
    ignoredSecondSection.content = 'Section A2';

    const sameChapter = new TextBoxElement();
    sameChapter.runningMarkerRole = 'chapter';
    sameChapter.content = 'Chapter 1';

    const sectionB = new TextBoxElement();
    sectionB.runningMarkerRole = 'section';
    sectionB.content = 'Section B';

    const chapterTwo = new TextBoxElement();
    chapterTwo.runningMarkerRole = 'chapter';
    chapterTwo.content = 'Chapter 2';

    const chapterTwoIgnored = new TextBoxElement();
    chapterTwoIgnored.runningMarkerRole = 'chapter';
    chapterTwoIgnored.content = 'Chapter 2B';

    const metadata = resolveRunningMarkerPageMetadata([
      createPage(),
      createPage(section),
      createPage(chapterOne, firstSectionOnPageWins, ignoredSecondSection),
      createPage(sameChapter, sectionB),
      createPage(chapterTwo, chapterTwoIgnored),
    ]);

    expect(metadata).toEqual([
      { chapter: '', section: '', isChapterOpening: false },
      { chapter: '', section: 'Section 1', isChapterOpening: false },
      { chapter: 'Chapter 1', section: 'Section A', isChapterOpening: true },
      { chapter: 'Chapter 1', section: 'Section B', isChapterOpening: false },
      { chapter: 'Chapter 2', section: '', isChapterOpening: true },
    ]);
  });

  it('uses override text when present and visible text when blank', () => {
    const textBox = new TextBoxElement();
    textBox.runningMarkerRole = 'chapter';
    textBox.multipanel = true;
    textBox.contentLeft = '  Left ';
    textBox.contentCenter = 'Center';
    textBox.contentRight = '  ';

    expect(resolveRunningMarkerText(textBox)).toBe('Left Center');

    textBox.runningMarkerText = '  Override Title  ';
    expect(resolveRunningMarkerText(textBox)).toBe('Override Title');
  });

  it('preserves separators between rich-text blocks and line breaks', () => {
    const richTextBox = new RichTextBoxElement();
    richTextBox.runningMarkerRole = 'chapter';
    richTextBox.content =
      '<p>Chapter</p><p>One<br>Part A</p><div>Appendix</div>';

    expect(resolveRunningMarkerText(richTextBox)).toBe(
      'Chapter One Part A Appendix',
    );
  });
});
