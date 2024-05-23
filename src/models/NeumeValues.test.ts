import { describe, expect, it } from 'vitest';

import { QuantitativeNeume } from './Neumes';
import { getNeumeValue } from './NeumeValues';

describe('NeumeValues', () => {
  it('should have a value for every neume', () => {
    expect(
      Object.values(QuantitativeNeume).every(
        (x) => getNeumeValue(x) !== undefined,
      ),
    ).toBe(true);
  });
});
