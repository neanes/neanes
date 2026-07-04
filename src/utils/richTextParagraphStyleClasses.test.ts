// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { rewriteRichTextParagraphStyleClasses } from './richTextParagraphStyleClasses';

describe('rewriteRichTextParagraphStyleClasses', () => {
  it('leaves empty html unchanged', () => {
    expect(rewriteRichTextParagraphStyleClasses('', () => 'default-text')).toBe(
      '',
    );
  });

  it('preserves valid style classes and unrelated classes while replacing missing ones once', () => {
    const html =
      '<p class="lead neanes-style-valid neanes-style-missing">Hello</p>';

    expect(
      rewriteRichTextParagraphStyleClasses(html, (styleId) =>
        styleId === 'missing' ? 'fallback' : null,
      ),
    ).toBe(
      '<p class="lead neanes-style-valid neanes-style-fallback">Hello</p>',
    );
  });

  it('does not rewrite escaped literal html text that only looks like a class attribute', () => {
    const html = '<p>&lt;span class="neanes-style-old"&gt;</p>';

    expect(rewriteRichTextParagraphStyleClasses(html, () => 'fallback')).toBe(
      html,
    );
  });

  it('returns the original html when no class rewrite is needed', () => {
    const html = '<p class="lead">A &amp; B</p>';

    expect(rewriteRichTextParagraphStyleClasses(html, () => 'fallback')).toBe(
      html,
    );
  });
});
