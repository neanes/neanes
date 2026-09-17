import 'vitest';

import type { toBeDeepCloseTo } from 'jest-matcher-deep-close-to';

type DeepCloseToExpected = Parameters<typeof toBeDeepCloseTo>[1];

declare module 'vitest' {
  interface Matchers<R, T> {
    toBeDeepCloseTo: (
      expected: T & DeepCloseToExpected,
      decimals?: number,
    ) => R;
    toMatchCloseTo: (expected: T & DeepCloseToExpected, decimals?: number) => R;
  }
}
