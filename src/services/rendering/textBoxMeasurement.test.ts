import { describe, expect, it } from 'vitest';

import {
  NoteElement,
  RichTextBoxElement,
  type ScoreElement,
  TextBoxElement,
} from '@/models/Element';
import { Line, Page } from '@/models/Page';
import { Score } from '@/models/Score';
import { Workspace } from '@/models/Workspace';

import {
  getResizableTextBoxes,
  getTextBoxVariants,
} from './textBoxMeasurement';

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

describe('text box variants on repeated template pages', () => {
  function pagesWith(...lines: ScoreElement[][]) {
    return lines.map((elements, index) => {
      const page = new Page();
      page.physicalPageNumber = index + 1;
      const line = new Line();
      line.elements = elements;
      page.lines = [line];
      return page;
    });
  }

  function setup() {
    const workspace = new Workspace();
    const { score } = workspace;
    score.pageSetup.showHeader = true;
    const header = score.headers.default.elements[0] as TextBoxElement;
    const plain = new TextBoxElement();
    const rich = new RichTextBoxElement();
    score.staff.elements = [plain, rich];
    return { workspace, score, header, plain, rich };
  }

  function pageNumbers(
    variants: ReturnType<typeof getTextBoxVariants>,
    box: ScoreElement,
  ) {
    return [...variants.get(box as TextBoxElement)!.values()].map(
      (metadata) => metadata?.pageNumber,
    );
  }

  it('keeps one variant for each distinct tokenized content', () => {
    const { workspace, header, plain, rich } = setup();
    header.contentCenter = 'Page $p';
    const pages = pagesWith([plain], [plain], [rich]);
    const variants = getTextBoxVariants(
      workspace,
      pages,
      new Set([header, plain, rich]),
    );
    expect(pageNumbers(variants, header)).toEqual([1, 2, 3]);
    expect(new Set(variants.get(header)!.keys()).size).toBe(3);
    // Content without tokens is the same on every page.
    expect([...variants.get(plain)!.keys()]).toEqual([undefined]);
  });

  it('merges pages whose tokens produce the same content', () => {
    const { workspace, header } = setup();
    header.contentCenter = 'Pages: $n';
    const variants = getTextBoxVariants(
      workspace,
      pagesWith([], [], []),
      new Set([header]),
    );
    expect(pageNumbers(variants, header)).toEqual([1]);
    expect([...variants.get(header)!.keys()]).not.toContain(undefined);
  });

  it('tokenizes main-staff plain text boxes but not rich text boxes', () => {
    const { workspace, plain, rich } = setup();
    plain.content = 'Page $p';
    rich.content = '<p>Page $p</p>';
    const variants = getTextBoxVariants(
      workspace,
      pagesWith([plain, rich], [plain, rich]),
      new Set([plain, rich]),
    );
    expect(pageNumbers(variants, plain)).toEqual([1, 2]);
    expect([...variants.get(rich)!.entries()]).toEqual([
      [undefined, undefined],
    ]);
  });

  it('visits only targets that appear on the pages', () => {
    const { workspace, header, plain, rich } = setup();
    workspace.score.pageSetup.showHeader = false;
    const variants = getTextBoxVariants(
      workspace,
      pagesWith([plain]),
      new Set([header, rich]),
    );
    expect(variants.size).toBe(0);
  });
});
