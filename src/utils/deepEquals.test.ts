import { describe, expect, it } from 'vitest';

import { deepEquals } from './deepEquals';

describe('deepEquals', () => {
  it('compares primitives by value', () => {
    expect(deepEquals(1, 1)).toBe(true);
    expect(deepEquals('a', 'a')).toBe(true);
    expect(deepEquals(null, null)).toBe(true);
    expect(deepEquals(undefined, undefined)).toBe(true);
    expect(deepEquals(1, '1')).toBe(false);
    expect(deepEquals(null, undefined)).toBe(false);
    expect(deepEquals(null, {})).toBe(false);
  });

  it('compares nested objects regardless of key order', () => {
    expect(
      deepEquals(
        { a: 1, nested: { x: 'left', y: 'right' } },
        { nested: { y: 'right', x: 'left' }, a: 1 },
      ),
    ).toBe(true);
  });

  it('distinguishes a missing key from an undefined one', () => {
    expect(deepEquals({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEquals({ a: 1, b: undefined }, { a: 1, b: undefined })).toBe(
      true,
    );
  });

  it('compares arrays by position and length', () => {
    expect(deepEquals([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(deepEquals([1, 2], [2, 1])).toBe(false);
    expect(deepEquals([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEquals([], {})).toBe(false);
  });

  it('detects a difference deep in a nested structure', () => {
    expect(
      deepEquals(
        { runs: [{ appearance: { fontSize: 14.5 } }] },
        { runs: [{ appearance: { fontSize: 20 } }] },
      ),
    ).toBe(false);
  });
});
