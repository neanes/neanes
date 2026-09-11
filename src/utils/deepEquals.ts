/**
 * Structural comparison of plain data: primitives, arrays, and plain objects.
 * Unlike comparing JSON.stringify output, it allocates nothing, stops at the
 * first difference, and does not depend on the order the keys were added.
 */
export function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (
    a === null ||
    b === null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => deepEquals(value, b[index]))
    );
  }

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left);

  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key) => Object.hasOwn(right, key) && deepEquals(left[key], right[key]),
    )
  );
}
