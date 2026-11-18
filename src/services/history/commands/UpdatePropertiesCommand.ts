import { toRaw } from 'vue';

import { StateEditCommand } from './StateEditCommand';

export interface UpdatePropertiesCommandArgs<T> {
  target: T;
  newValues: Partial<T>;
}

interface PropertyValue<T> {
  owned: boolean;
  value: T[keyof T];
}

function sameProperty<T>(left: PropertyValue<T>, right: PropertyValue<T>) {
  return (
    left.owned === right.owned &&
    Object.is(toRaw(left.value), toRaw(right.value))
  );
}

// Ordinary properties have no cascading setters. Musical editing supplies its
// own state contract through CommandFactory instead of relying on this command.
export class UpdatePropertiesCommand<T> extends StateEditCommand<
  Map<keyof T, PropertyValue<T>>
> {
  constructor({ target, newValues }: UpdatePropertiesCommandArgs<T>) {
    const keys = Object.keys(newValues) as (keyof T)[];
    let changedKeys = keys;
    const capture = () =>
      new Map(
        keys.map((key) => [
          key,
          {
            owned: Object.prototype.hasOwnProperty.call(target, key),
            value: target[key],
          },
        ]),
      );

    super({
      capture,
      apply: () => {
        const before = capture();
        for (const key of keys) {
          if (!Object.is(toRaw(target[key]), toRaw(newValues[key]))) {
            target[key] = newValues[key]!;
          }
        }
        const after = capture();
        changedKeys = keys.filter(
          (key) => !sameProperty(before.get(key)!, after.get(key)!),
        );
      },
      restore: (state) => {
        for (const key of changedKeys) {
          const property = state.get(key)!;
          if (property.owned) {
            target[key] = property.value;
          } else {
            delete target[key];
          }
        }
      },
      equals: (left, right) =>
        changedKeys.every((key) =>
          sameProperty(left.get(key)!, right.get(key)!),
        ),
    });
  }
}
