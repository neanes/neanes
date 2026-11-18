import { describe, expect, it } from 'vitest';

import { Page } from '@/models/Page';

import { assertVisualExportFits } from './visualExportValidation';

describe('visual export overflow validation', () => {
  it('accepts fitting pages and rejects overflow anywhere in the document', () => {
    const pages = [new Page(), new Page()];
    expect(() => assertVisualExportFits(pages)).not.toThrow();
    pages[1].footnoteOverflow = true;
    expect(() => assertVisualExportFits(pages)).toThrow('FOOTNOTE_TOO_LARGE');
    pages[1].footnoteOverflow = false;
    expect(() => assertVisualExportFits(pages)).not.toThrow();
  });
});
