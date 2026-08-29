export type PageRangeParseResult =
  | { pageNumbers: number[]; error: null }
  | { pageNumbers: null; error: 'format' | 'outOfRange' };

export function parsePageRanges(
  value: string,
  pageCount: number,
): PageRangeParseResult {
  const pageNumbers = new Set<number>();
  const parts = value.split(',');

  if (parts.length === 0 || parts.some((part) => part.trim() === '')) {
    return { pageNumbers: null, error: 'format' };
  }

  for (const part of parts) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);

    if (!match) {
      return { pageNumbers: null, error: 'format' };
    }

    const start = Number(match[1]);
    const end = match[2] == null ? start : Number(match[2]);

    if (start < 1 || end > pageCount) {
      return { pageNumbers: null, error: 'outOfRange' };
    }

    if (end < start) {
      return { pageNumbers: null, error: 'format' };
    }

    for (let pageNumber = start; pageNumber <= end; pageNumber++) {
      pageNumbers.add(pageNumber);
    }
  }

  return {
    pageNumbers: [...pageNumbers].sort((a, b) => a - b),
    error: null,
  };
}

export function normalizePageRanges(
  value: string,
  pageCount: number,
): string | null {
  const pageNumbers = new Set<number>();
  const parts = value.split(',');

  if (parts.length === 0 || parts.some((part) => part.trim() === '')) {
    return null;
  }

  for (const part of parts) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);

    if (!match) {
      return null;
    }

    const start = Number(match[1]);
    const end = match[2] == null ? start : Number(match[2]);

    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 1 ||
      end < start
    ) {
      return null;
    }

    for (
      let pageNumber = start;
      pageNumber <= Math.min(end, pageCount);
      pageNumber++
    ) {
      pageNumbers.add(pageNumber);
    }
  }

  const sortedPageNumbers = [...pageNumbers].sort((a, b) => a - b);
  const ranges: string[] = [];

  for (let index = 0; index < sortedPageNumbers.length; index++) {
    const start = sortedPageNumbers[index];
    let end = start;

    while (sortedPageNumbers[index + 1] === end + 1) {
      end = sortedPageNumbers[++index];
    }

    ranges.push(start === end ? `${start}` : `${start}-${end}`);
  }

  return ranges.join(', ');
}
