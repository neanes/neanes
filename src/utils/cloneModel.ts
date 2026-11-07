import { toRaw } from 'vue';

// Model graphs contain ordinary objects and arrays. Preserve prototypes,
// backing fields, undefined values, and blank nested children.
export function cloneModel<T>(
  source: T,
  onCopy?: (source: object, copy: object) => void,
): T {
  const copies = new WeakMap<object, object>();
  function copy<Value>(value: Value): Value {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    const raw = toRaw(value);
    const existing = copies.get(raw);
    if (existing !== undefined) {
      return existing as Value;
    }
    const result = (
      Array.isArray(raw) ? [] : Object.create(Object.getPrototypeOf(raw))
    ) as Value & object;
    copies.set(raw, result);
    onCopy?.(raw, result);
    for (const [key, child] of Object.entries(raw)) {
      Reflect.set(result, key, copy(child));
    }
    return result;
  }
  return copy(source);
}
