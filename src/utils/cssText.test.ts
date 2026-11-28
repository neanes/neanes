import { describe, expect, it } from 'vitest';

import { toCssText } from './cssText';

describe('toCssText', () => {
  it('writes camelCase properties as CSS declarations', () => {
    expect(
      toCssText({ left: 'calc(12px * var(--zoom, 1))', fontSize: '16px' }),
    ).toBe('left:calc(12px * var(--zoom, 1));font-size:16px;');
  });

  it('omits unset values', () => {
    expect(
      toCssText({ left: undefined, right: '4px', textAlign: undefined }),
    ).toBe('right:4px;');
    expect(toCssText({ fontVariantCaps: '' as never })).toBe('');
  });

  it('writes vendor prefixes from a leading capital', () => {
    expect(toCssText({ WebkitTextStrokeWidth: '1px' })).toBe(
      '-webkit-text-stroke-width:1px;',
    );
  });

  it('keeps custom properties and numeric values', () => {
    expect(toCssText({ '--zoom': 2, fontWeight: 700 } as never)).toBe(
      '--zoom:2;font-weight:700;',
    );
  });
});
