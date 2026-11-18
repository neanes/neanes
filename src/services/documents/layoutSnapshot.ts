import { ScoreElement } from '@/models/Element';
import type { Score } from '@/models/Score';
import { cloneModel } from '@/utils/cloneModel';

// Live score data consists of model objects and arrays. Preserve prototypes,
// undefined values and blank children that save serialization can omit.
export function cloneScoreForLayout(source: Score) {
  const sources = new Map<ScoreElement, ScoreElement>();
  const score = cloneModel(source, (raw, result) => {
    if (raw instanceof ScoreElement) {
      sources.set(result as unknown as ScoreElement, raw);
    }
  });
  return { score, sources };
}
