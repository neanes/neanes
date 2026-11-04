import {
  type FootnoteSymbolSequence,
  footnoteSymbolSequences,
} from '@/models/FootnoteNumbering';
import type { PageSetup } from '@/models/PageSetup';

// Bounds user-selected starts without imposing an endpoint on automatic numbering.
export const MAX_FOOTNOTE_START_NUMBER = 1_000_000;
export const MAX_FOOTNOTE_START_SYMBOL_REPETITIONS = 64;

export function footnoteStartMax(
  format: PageSetup['footnoteFormat'],
  sequence: FootnoteSymbolSequence,
) {
  return format === 'symbols'
    ? footnoteSymbolSequences[sequence].length *
        MAX_FOOTNOTE_START_SYMBOL_REPETITIONS
    : MAX_FOOTNOTE_START_NUMBER;
}

export function isValidFootnoteStart(
  position: number,
  format: PageSetup['footnoteFormat'],
  sequence: FootnoteSymbolSequence,
) {
  return (
    Number.isInteger(position) &&
    position >= 1 &&
    position <= footnoteStartMax(format, sequence)
  );
}

export function footnoteSymbol(
  position: number,
  sequence: FootnoteSymbolSequence,
) {
  const symbols = footnoteSymbolSequences[sequence];
  return symbols[(position - 1) % symbols.length].repeat(
    Math.floor((position - 1) / symbols.length) + 1,
  );
}

export function footnoteSymbolPosition(
  text: string,
  sequence: FootnoteSymbolSequence,
): number | null {
  const symbols = footnoteSymbolSequences[sequence];
  const value = text.trim();
  for (const [index, symbol] of symbols.entries()) {
    const repetitions = value.length / symbol.length;
    if (
      Number.isInteger(repetitions) &&
      repetitions > 0 &&
      symbol.repeat(repetitions) === value
    ) {
      return (repetitions - 1) * symbols.length + index + 1;
    }
  }
  return null;
}

export function automaticFootnoteMarker(position: number, setup: PageSetup) {
  return setup.footnoteFormat === 'symbols'
    ? footnoteSymbol(position, setup.footnoteSymbolSequence)
    : String(position);
}

export function footnoteFormatDefaults(format: PageSetup['footnoteFormat']) {
  return {
    footnoteFormat: format,
    footnoteNumbering:
      format === 'symbols' ? ('page' as const) : ('continuous' as const),
    firstFootnoteNumber: 1,
  };
}

export function normalizeFootnoteMarker(marker: string | null) {
  if (marker === null) {
    return null;
  }
  const text = marker.trim();
  if (
    text.length === 0 ||
    [...text].length > 16 ||
    /[\u0000-\u001f\u007f]/u.test(marker)
  ) {
    throw new Error('INVALID_FOOTNOTE_MARKER');
  }
  return text;
}
