import type { LyricSetup } from '@/models/LyricSetup';

export function readContentChunk(
  value: string,
  query: { offset: number; limit: number },
) {
  // Offsets are UTF-16 code units, but chunks never split a surrogate pair.
  const splitsPair = (offset: number) =>
    offset > 0 &&
    offset < value.length &&
    value.charCodeAt(offset - 1) >= 0xd800 &&
    value.charCodeAt(offset - 1) <= 0xdbff &&
    value.charCodeAt(offset) >= 0xdc00 &&
    value.charCodeAt(offset) <= 0xdfff;
  if (query.offset > value.length || splitsPair(query.offset)) {
    throw new Error('INVALID_ELEMENT_RANGE');
  }
  let end = Math.min(query.offset + query.limit, value.length);
  if (splitsPair(end)) {
    end--;
  }
  return {
    offset: query.offset,
    nextOffset: end < value.length ? end : null,
    totalLength: value.length,
    content: value.slice(query.offset, end),
  };
}

export function readStaffLyrics(
  lyrics: LyricSetup,
  query: { offset: number; limit: number },
) {
  const { content, ...page } = readContentChunk(lyrics.text, query);
  return { ...page, text: content, locked: lyrics.locked };
}
