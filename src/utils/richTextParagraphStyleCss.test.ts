import { describe, expect, it } from 'vitest';

import { buildRichTextNeumeCss } from './richTextParagraphStyleCss';

describe('buildRichTextNeumeCss', () => {
  it('gives rich-text neumes their own font while plagal text inherits', () => {
    expect(
      buildRichTextNeumeCss(
        '.byz---rich-text-box',
        'var(--byz-neume-font-family)',
      ),
    ).toBe(
      `.byz---rich-text-box .neanes-ck-neume{display:inline-block;position:relative;font-family:var(--byz-neume-font-family);}
.byz---rich-text-box .neanes-ck-neume-align-right{position:absolute!important;left:initial!important;}
.byz---rich-text-box .neanes-ck-neume-plagal{display:inline-flex;flex-direction:column;vertical-align:middle;align-items:center;font-family:inherit;}`,
    );
  });
});
