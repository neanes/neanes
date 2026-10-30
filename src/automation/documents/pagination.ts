import { MAX_ELEMENT_PAGE_CHARACTERS } from '../contracts/responseBudget';

// Project only requested entries, and inspect one extra candidate for nextOffset.
export function collectPage<T, R>(
  candidates: Iterable<T>,
  query: { offset: number; limit: number },
  project: (candidate: T) => R,
  entrySize: (value: R, characters: number, count: number) => number | null = (
    value,
    characters,
  ) => {
    const size = JSON.stringify(value).length + 1;
    return characters + size <= MAX_ELEMENT_PAGE_CHARACTERS ? size : null;
  },
) {
  const values: R[] = [];
  let matched = 0;
  let characters = 1000;
  for (const candidate of candidates) {
    if (matched++ < query.offset) {
      continue;
    }
    if (values.length === query.limit) {
      break;
    }
    const value = project(candidate);
    const size = entrySize(value, characters, values.length);
    if (size === null) {
      break;
    }
    characters += size;
    values.push(value);
  }
  if (query.offset > matched) {
    throw new Error('INVALID_ELEMENT_RANGE');
  }
  const next = query.offset + values.length;
  return {
    offset: query.offset,
    nextOffset: matched > next ? next : null,
    values,
  };
}
