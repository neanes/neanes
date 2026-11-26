// Quotation marks from Unicode CLDR delimiters:
// [quotationStart, quotationEnd, alternateQuotationStart, alternateQuotationEnd].
const QUOTE_STYLES = {
  ar: ['”', '“', '’', '‘'],
  el: ['«', '»', '“', '”'],
  en: ['“', '”', '‘', '’'],
  id: ['“', '”', '‘', '’'],
  ro: ['„', '”', '«', '»'],
  ru: ['«', '»', '„', '“'],
} as const;

export type QuoteStyle = keyof typeof QUOTE_STYLES;

const APOSTROPHE = '’';
const OPENING_CONTEXT = /[\s([{–—]$/u;

export function quoteStyleForLanguage(
  language: string | null | undefined,
): QuoteStyle | undefined {
  const code = language?.toLowerCase().split(/[-_:]/)[0];

  return code != null && code in QUOTE_STYLES
    ? (code as QuoteStyle)
    : undefined;
}

export function getQuoteStyleExample(style: QuoteStyle) {
  const [open, close, nestedOpen, nestedClose] = QUOTE_STYLES[style];

  return `${open}…${close} ${nestedOpen}…${nestedClose}`;
}

// Returns the typographic replacement for a typed straight quote, or undefined
// when `typed` is not a straight quote. `before` is the text before the caret.
export function smartQuote(typed: string, before: string, style: QuoteStyle) {
  if (typed !== '"' && typed !== "'") {
    return undefined;
  }

  const [open, close, nestedOpen, nestedClose] = QUOTE_STYLES[style];
  const opening =
    before === '' ||
    OPENING_CONTEXT.test(before) ||
    before.endsWith(open) ||
    before.endsWith(nestedOpen);

  if (typed === '"') {
    return opening ? open : close;
  }

  if (opening) {
    return nestedOpen;
  }

  // Follows LibreOffice (tdf#123786): close an open nested quote, otherwise
  // type an apostrophe.
  // shortcut: Arabic opens nested quotes with U+2019, so an earlier apostrophe
  // in the same field reads as an open quote; track quotes if that matters.
  return before.lastIndexOf(nestedOpen) > before.lastIndexOf(nestedClose)
    ? nestedClose
    : APOSTROPHE;
}
