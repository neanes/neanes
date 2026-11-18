import { describe, expect, it } from 'vitest';

import { ParagraphStyle } from '@/models/ParagraphStyle';

import {
  buildRichTextNeumeCss,
  buildRichTextParagraphStyleCss,
} from './richTextParagraphStyleCss';

describe('buildRichTextParagraphStyleCss', () => {
  it('emits resets for absent features so another workspace cannot supply them', () => {
    const style = new ParagraphStyle();
    style.id = 'body';
    style.parentStyleId = null;
    const css = buildRichTextParagraphStyleCss(
      [style],
      '.background .ck-content',
    ).replaceAll(': ', ':');
    expect(css).toContain(
      '.background .ck-content p.neanes-paragraph-style-body{',
    );
    for (const property of ['caps', 'numeric', 'ligatures', 'alternates']) {
      expect(css).toContain(`font-variant-${property}:normal;`);
    }
    expect(css).toContain('text-decoration:none;');
  });

  it('resolves parent features before emitting explicit child resets', () => {
    const parent = new ParagraphStyle();
    parent.id = 'parent';
    parent.overrides = {
      fontVariantCaps: 'all-small-caps',
      fontVariantNumeric: 'oldstyle-nums',
      fontVariantLigatures: 'discretionary-ligatures',
      fontVariantAlternates: 'historical-forms',
      textDecoration: 'underline',
    };
    const child = new ParagraphStyle();
    child.id = 'child';
    child.parentStyleId = parent.id;
    const inherited = buildRichTextParagraphStyleCss(
      [parent, child],
      '.ck-content',
    )
      .split('\n')[1]
      .replaceAll(': ', ':');
    expect(inherited).toContain('font-variant-caps:all-small-caps;');
    expect(inherited).toContain('font-variant-numeric:oldstyle-nums;');
    expect(inherited).toContain(
      'font-variant-ligatures:discretionary-ligatures;',
    );
    expect(inherited).toContain('font-variant-alternates:historical-forms;');
    expect(inherited).toContain('text-decoration:underline;');

    child.overrides = {
      fontVariantCaps: null,
      fontVariantNumeric: null,
      fontVariantLigatures: null,
      fontVariantAlternates: null,
      textDecoration: null,
    };
    const cleared = buildRichTextParagraphStyleCss(
      [parent, child],
      '.ck-content',
    )
      .split('\n')[1]
      .replaceAll(': ', ':');
    for (const property of ['caps', 'numeric', 'ligatures', 'alternates']) {
      expect(cleared).toContain(`font-variant-${property}:normal;`);
    }
    expect(cleared).toContain('text-decoration:none;');
  });
});

describe('buildRichTextNeumeCss', () => {
  it('gives rich-text neumes their own font while plagal text inherits', () => {
    expect(
      buildRichTextNeumeCss(
        '.byz---rich-text-box',
        'var(--byz-neume-font-family)',
      ),
    ).toBe(
      `.byz---rich-text-box{position:relative;}
.byz---rich-text-box .neanes-ck-neume{display:inline-block;position:relative;font-family:var(--byz-neume-font-family);}
.byz---rich-text-box .neanes-ck-neume-align-right{position:absolute!important;left:initial!important;}
.byz---rich-text-box .neanes-ck-neume-plagal{display:inline-flex;flex-direction:column;vertical-align:middle;align-items:center;font-family:inherit;}`,
    );
  });
});
