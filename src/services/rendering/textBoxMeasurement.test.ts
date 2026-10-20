import { describe, expect, it } from 'vitest';

import {
  NoteElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';
import { Score } from '@/models/Score';

import { getResizableTextBoxes } from './textBoxMeasurement';

describe('workspace text box measurement targets', () => {
  it('includes body and every header/footer variant, while excluding inline and fixed-height boxes', () => {
    const score = new Score();
    score.pageSetup.showHeader = true;
    score.pageSetup.showFooter = true;
    const body = new RichTextBoxElement();
    const plain = new TextBoxElement();
    const fixed = new TextBoxElement();
    fixed.customHeight = 100;
    const inline = new RichTextBoxElement();
    inline.inline = true;
    const inlinePlain = new TextBoxElement();
    inlinePlain.inline = true;
    score.staff.elements = [
      body,
      plain,
      fixed,
      inline,
      inlinePlain,
      new NoteElement(),
    ];
    const targets = getResizableTextBoxes(score);
    expect(targets).toContain(body);
    expect(targets).toContain(plain);
    expect(targets).not.toContain(fixed);
    expect(targets).not.toContain(inline);
    expect(targets).not.toContain(inlinePlain);
    for (const element of score.headersAndFooters) {
      expect(targets).toContain(element);
    }
  });
  it('does not measure disabled header/footer containers that layout does not process', () => {
    const score = new Score();
    score.staff.elements = [];
    expect(getResizableTextBoxes(score)).toEqual([]);
  });
});
