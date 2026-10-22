import { toRaw } from 'vue';

import { ScoreElement } from '@/models/Element';
import type { Score } from '@/models/Score';

// Live score data consists of model objects and arrays. Preserve prototypes,
// undefined values and blank children that save serialization can omit.
export function cloneScoreForLayout(source: Score) {
  const copies = new WeakMap<object, object>();
  const sources = new Map<ScoreElement, ScoreElement>();
  function copy<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    const raw = toRaw(value);
    const existing = copies.get(raw);
    if (existing !== undefined) {
      return existing as T;
    }
    const result = (
      Array.isArray(raw) ? [] : Object.create(Object.getPrototypeOf(raw))
    ) as T & object;
    copies.set(raw, result);
    if (raw instanceof ScoreElement) {
      sources.set(result as unknown as ScoreElement, raw);
    }
    for (const [key, child] of Object.entries(raw)) {
      Reflect.set(result, key, copy(child));
    }
    return result;
  }
  return { score: copy(source), sources };
}
