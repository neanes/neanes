export type FootnoteFormat = 'numbers' | 'symbols';
export type FootnoteNumbering = 'continuous' | 'section';

// Sequence IDs and their contents are persistent document settings.
export const footnoteSymbolSequences = {
  asterisks: ['*'],
  standard: ['*', '†', '‡', '§', '¶', '‖'],
} as const;
export type FootnoteSymbolSequence = keyof typeof footnoteSymbolSequences;
