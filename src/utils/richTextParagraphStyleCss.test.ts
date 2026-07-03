import { describe, expect, it } from 'vitest';

import type { TextBoxAlignment } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { ParagraphStyle } from '@/models/ParagraphStyle';

import { buildRichTextParagraphStyleCss } from './richTextParagraphStyleCss';

describe('buildRichTextParagraphStyleCss', () => {
  it('projects resolved alignment and underline for rich-text paragraph styles', () => {
    const pageSetup = new PageSetup();
    const style = new ParagraphStyle();

    style.id = 'custom-style';
    style.overrides = {
      fontFamily: 'Alegreya',
      fontSize: 16,
      fontStyle: 'Bold Italic',
      color: '#abcdef',
      strokeWidth: 1.5,
      lineHeight: 1.4,
      alignment: 'right' as TextBoxAlignment,
      textDecoration: 'underline',
    };

    const css = buildRichTextParagraphStyleCss(
      [style],
      pageSetup,
      '.ck-content',
    );

    expect(css).toContain(
      '.ck-content p.neanes-style-custom-style{font-family:',
    );
    expect(css).toContain('font-weight:700;font-style:italic;font-size:16px;');
    expect(css).toContain(
      'color:#abcdef;-webkit-text-stroke-width:1.5px;line-height:1.4;',
    );
    expect(css).toContain('text-align:right;');
    expect(css).toContain('text-decoration:underline;');
  });

  it('omits paragraph text decoration when the resolved style is not underlined', () => {
    const pageSetup = new PageSetup();
    const style = new ParagraphStyle();

    style.id = 'plain-style';
    style.overrides = {
      fontFamily: 'Alegreya',
      fontSize: 16,
      fontStyle: 'Bold Italic',
      color: '#abcdef',
      strokeWidth: 1.5,
      lineHeight: 1.4,
      alignment: 'right' as TextBoxAlignment,
      textDecoration: null,
    };

    const css = buildRichTextParagraphStyleCss(
      [style],
      pageSetup,
      '.ck-content',
    );

    expect(css).not.toContain('text-decoration:underline;');
  });
});
