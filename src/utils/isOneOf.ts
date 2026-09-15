/** Narrows an arbitrary value to one of a fixed set of string constants. */
export function isOneOf<T extends string>(
  values: readonly T[],
  value: unknown,
): value is T {
  return values.includes(value as T);
}
