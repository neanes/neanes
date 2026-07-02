import type { Editor } from 'ckeditor5';
import { describe, expect, it, vi } from 'vitest';

import {
  applyRichTextLanguageToEditor,
  clearRichTextLanguage,
  getRichTextLanguage,
  getRichTextLanguageAttributes,
  hasMeaningfulRichTextEditorContent,
  hasMeaningfulRichTextHtmlContent,
  inferRichTextEditorLanguage,
  inferSharedRichTextEditorLanguage,
  setRichTextLanguage,
} from './richTextLanguage';

describe('richTextLanguage', () => {
  it('reads, writes, and serializes runtime owner language', () => {
    const owner = {};

    setRichTextLanguage(owner, 'el-"', 'ltr');

    expect(owner).toEqual({ languageCode: 'el-"', textDirection: 'ltr' });
    expect(getRichTextLanguage(owner)).toBe('el-":ltr');
    expect(getRichTextLanguageAttributes(getRichTextLanguage(owner))).toBe(
      ' lang="el-&quot;" dir="ltr"',
    );

    clearRichTextLanguage(owner);

    expect(owner).toEqual({ languageCode: null, textDirection: null });
    expect(getRichTextLanguage(owner)).toBeNull();
  });

  it('infers one language from meaningful CKEditor model text', () => {
    const editor = createEditor([
      element([
        text('  ', null),
        text('Kyrie', 'el:ltr'),
        element([text(' eleison', 'el:ltr')]),
      ]),
    ]);

    expect(hasMeaningfulRichTextEditorContent(editor)).toBe(true);
    expect(inferRichTextEditorLanguage(editor)).toBe('el:ltr');
  });

  it('detects meaningful HTML content instead of literal non-empty strings', () => {
    expect(hasMeaningfulRichTextHtmlContent('')).toBe(false);
    expect(hasMeaningfulRichTextHtmlContent('<p></p>')).toBe(false);
    expect(
      hasMeaningfulRichTextHtmlContent('<p class="neanes-style-x"></p>'),
    ).toBe(false);
    expect(hasMeaningfulRichTextHtmlContent('<p>&nbsp;</p>')).toBe(false);
    expect(hasMeaningfulRichTextHtmlContent('<p>  Kyrie  </p>')).toBe(true);
  });

  it('returns null for missing or mixed meaningful text language', () => {
    expect(
      inferRichTextEditorLanguage(
        createEditor([element([text('Hello', 'ar:rtl'), text(' plain')])]),
      ),
    ).toBeNull();

    expect(
      inferRichTextEditorLanguage(
        createEditor([
          element([text('Hello', 'ar:rtl'), text('Kyrie', 'el:ltr')]),
        ]),
      ),
    ).toBeNull();
  });

  it('infers a shared language across multiple editors', () => {
    expect(
      inferSharedRichTextEditorLanguage([
        createEditor([element([text('Hello', 'ar:rtl')])]),
        createEditor([element([text('\u00a0')])]),
      ]),
    ).toBe('ar:rtl');

    expect(
      inferSharedRichTextEditorLanguage([
        createEditor([element([text('Hello', 'ar:rtl')])]),
        createEditor([element([text('Kyrie', 'el:ltr')])]),
      ]),
    ).toBeNull();
  });

  it('applies language to CKEditor model ranges', () => {
    const root = element([text('Hello')]);
    const range = { root };
    const setAttribute = vi.fn();
    const writer = {
      createRangeIn: vi.fn(() => range),
      setAttribute,
    };
    const editor = {
      model: {
        document: {
          getRoots: () => [root],
        },
        schema: {
          getValidRanges: vi.fn((ranges) => ranges),
        },
        change: (callback: (writer: unknown) => void) => callback(writer),
      },
    } as unknown as Pick<Editor, 'model'>;

    applyRichTextLanguageToEditor(editor, 'ar', 'rtl');

    expect(writer.createRangeIn).toHaveBeenCalledWith(root);
    expect(setAttribute).toHaveBeenCalledWith('language', 'ar:rtl', range);
  });
});

function createEditor(children: ModelTestNode[]) {
  return {
    model: {
      document: {
        getRoots: () => [element(children)],
      },
    },
  } as unknown as Pick<Editor, 'model'>;
}

function element(children: ModelTestNode[]): ModelTestNode {
  return {
    getChildren: () => children.values(),
    is: (type: string) => type === 'element',
  };
}

function text(data: string, language?: string | null): ModelTestNode {
  return {
    data,
    getAttribute: (key: string) => (key === 'language' ? language : undefined),
    is: (type: string) => type === '$text',
  };
}

type ModelTestNode = {
  data?: string;
  getAttribute?: (key: string) => unknown;
  getChildren?: () => IterableIterator<ModelTestNode>;
  is: (type: string) => boolean;
};
