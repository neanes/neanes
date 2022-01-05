import { getNeumeValue } from './NeumeValues';
import { QuantitativeNeume } from './Neumes';

describe('NeumeValues', () => {
  it('should have a value for every neume', () => {
    expect(
      Object.values(QuantitativeNeume).every(
        (x) => getNeumeValue(x) !== undefined,
      ),
    ).toBe(true);
  });
});
