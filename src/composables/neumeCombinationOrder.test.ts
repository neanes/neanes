import { describe, expect, it } from 'vitest';

import {
  reorderNeumeCombinationOrderIds,
  resolveNeumeCombinationOrderIds,
} from './neumeCombinationOrder';

describe('neume combination order helpers', () => {
  it('defaults to built-ins followed by user combos when no order is saved', () => {
    expect(
      resolveNeumeCombinationOrderIds({
        builtInIds: ['built-in-a', 'built-in-b'],
        userIds: ['user-a', 'user-b'],
        storedOrder: null,
      }),
    ).toEqual(['built-in-a', 'built-in-b', 'user-a', 'user-b']);
  });

  it('allows saved order to intermix built-in and user ids', () => {
    expect(
      resolveNeumeCombinationOrderIds({
        builtInIds: ['built-in-a', 'built-in-b'],
        userIds: ['user-a', 'user-b'],
        storedOrder: ['user-b', 'built-in-a'],
      }),
    ).toEqual(['user-b', 'built-in-a', 'built-in-b', 'user-a']);
  });

  it('ignores missing and unknown ids', () => {
    expect(
      resolveNeumeCombinationOrderIds({
        builtInIds: ['built-in-a', 'built-in-b'],
        userIds: ['user-a'],
        storedOrder: ['missing', 'built-in-b', 'missing-again', 'user-a'],
      }),
    ).toEqual(['built-in-b', 'user-a', 'built-in-a']);
  });

  it('appends newly added combo ids', () => {
    expect(
      resolveNeumeCombinationOrderIds({
        builtInIds: ['built-in-a', 'built-in-b'],
        userIds: ['user-a', 'user-b', 'user-c'],
        storedOrder: ['built-in-b', 'user-a'],
      }),
    ).toEqual(['built-in-b', 'user-a', 'built-in-a', 'user-b', 'user-c']);
  });

  it('reorders items before and after targets across the list', () => {
    expect(
      reorderNeumeCombinationOrderIds(['a', 'b', 'c', 'd'], 'b', 'd', 'before'),
    ).toEqual(['a', 'c', 'b', 'd']);
    expect(
      reorderNeumeCombinationOrderIds(['a', 'b', 'c', 'd'], 'b', 'c', 'after'),
    ).toEqual(['a', 'c', 'b', 'd']);
  });

  it('treats same-row drags and end placements as no-op and append cases', () => {
    const order = ['a', 'b', 'c'];

    expect(reorderNeumeCombinationOrderIds(order, 'b', 'b', 'before')).toBe(
      order,
    );
    expect(reorderNeumeCombinationOrderIds(order, 'a', 'c', 'after')).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(reorderNeumeCombinationOrderIds(order, 'c', 'a', 'before')).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
});
