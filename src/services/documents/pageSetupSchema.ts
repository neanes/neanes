import { z } from 'zod';

import { NEUME_FONT_FAMILIES } from '../../utils/fontConstants';

// Persisted live settings only; derived getters and transient melisma settings are excluded.
export const pageSetupSchema = z.strictObject({
  pageSize: z.enum([
    'A3',
    'A4',
    'A5',
    'Legal',
    'Letter',
    'Tabloid',
    'Half-Letter',
    'Half-Legal',
    'Custom',
  ]),
  pageSizeUnit: z.enum(['pc', 'pt', 'cm', 'mm', 'in']),
  landscape: z.boolean(),
  pageWidth: z.number().positive(),
  pageHeight: z.number().positive(),
  pageWidthCustom: z.number().positive(),
  pageHeightCustom: z.number().positive(),
  topMargin: z.number().nonnegative(),
  bottomMargin: z.number().nonnegative(),
  leftMargin: z.number().nonnegative(),
  rightMargin: z.number().nonnegative(),
  facingPages: z.boolean(),
  direction: z.enum(['ltr', 'rtl']),
  lineHeight: z.number().positive(),
  melkiteRtl: z.boolean(),
  lyricsVerticalOffset: z.number(),
  lyricsMinimumSpacing: z.number().nonnegative(),
  lyricsMelismaCutoffWidth: z.number().nonnegative(),
  neumeDefaultFontFamily: z.string(),
  neumeDefaultFontSize: z.number().positive(),
  neumeDefaultColor: z.string(),
  neumeDefaultSpacing: z.number(),
  neumeDefaultStrokeWidth: z.number().nonnegative(),
  alternateLineDefaultFontSize: z.number().positive(),
  alternateLineDefaultColor: z.string(),
  modeKeyDefaultColor: z.string(),
  modeKeyDefaultStrokeWidth: z.number().nonnegative(),
  modeKeyDefaultFontSize: z.number().positive(),
  modeKeyDefaultHeightAdjustment: z.number(),
  accidentalDefaultColor: z.string(),
  accidentalDefaultStrokeWidth: z.number().nonnegative(),
  fthoraDefaultColor: z.string(),
  fthoraDefaultStrokeWidth: z.number().nonnegative(),
  heteronDefaultColor: z.string(),
  heteronDefaultStrokeWidth: z.number().nonnegative(),
  gorgonDefaultColor: z.string(),
  gorgonDefaultStrokeWidth: z.number().nonnegative(),
  measureBarDefaultColor: z.string(),
  measureBarDefaultStrokeWidth: z.number().nonnegative(),
  measureNumberDefaultColor: z.string(),
  measureNumberDefaultStrokeWidth: z.number().nonnegative(),
  noteIndicatorDefaultColor: z.string(),
  noteIndicatorDefaultStrokeWidth: z.number().nonnegative(),
  isonDefaultColor: z.string(),
  isonDefaultStrokeWidth: z.number().nonnegative(),
  breathDefaultColor: z.string(),
  breathDefaultStrokeWidth: z.number().nonnegative(),
  crossDefaultColor: z.string(),
  crossDefaultStrokeWidth: z.number().nonnegative(),
  koronisDefaultColor: z.string(),
  koronisDefaultStrokeWidth: z.number().nonnegative(),
  martyriaDefaultColor: z.string(),
  martyriaDefaultStrokeWidth: z.number().nonnegative(),
  tempoDefaultColor: z.string(),
  tempoDefaultStrokeWidth: z.number().nonnegative(),
  dropCapDefaultLineSpan: z.number().int().min(1),
  hyphenSpacing: z.number().nonnegative(),
  minimumSyllableToHyphenClearance: z.number().nonnegative(),
  martyriaVerticalOffset: z.number(),
  chrysanthineAccidentals: z.boolean(),
  noFthoraRestrictions: z.boolean(),
  disableGreekMelismata: z.boolean(),
  alignIsonIndicators: z.boolean(),
  ignorePunctuationWhenPositioningLyrics: z.boolean(),
  useOptionalDiatonicFthoras: z.boolean(),
});

export const headerFooterSettingsSchema = z.strictObject({
  headerMargin: z.number().nonnegative(),
  footerMargin: z.number().nonnegative(),
  headerDifferentFirstPage: z.boolean(),
  headerDifferentOddEven: z.boolean(),
  headerFooterDifferentChapterOpening: z.boolean(),
  showHeader: z.boolean(),
  showFooter: z.boolean(),
  richHeaderFooter: z.boolean(),
  firstPageNumber: z.number().int(),
  numerals: z.enum(['westernArabic', 'easternArabic']),
  showHeaderHorizontalRule: z.boolean(),
  excludeHeaderHorizontalRuleFirstPage: z.boolean(),
  excludeHeaderHorizontalRuleEvenPage: z.boolean(),
  excludeHeaderHorizontalRuleOddPage: z.boolean(),
  excludeHeaderHorizontalRuleChapterOpening: z.boolean(),
  headerHorizontalRuleMarginTop: z.number().nonnegative(),
  headerHorizontalRuleMarginBottom: z.number().nonnegative(),
  headerHorizontalRuleThickness: z.number().nonnegative(),
  headerHorizontalRuleColor: z.string(),
  showFooterHorizontalRule: z.boolean(),
  excludeFooterHorizontalRuleFirstPage: z.boolean(),
  excludeFooterHorizontalRuleEvenPage: z.boolean(),
  excludeFooterHorizontalRuleOddPage: z.boolean(),
  excludeFooterHorizontalRuleChapterOpening: z.boolean(),
  footerHorizontalRuleMarginTop: z.number().nonnegative(),
  footerHorizontalRuleMarginBottom: z.number().nonnegative(),
  footerHorizontalRuleThickness: z.number().nonnegative(),
  footerHorizontalRuleColor: z.string(),
});

export const pageSetupChangesSchema = pageSetupSchema
  .omit({ pageWidth: true, pageHeight: true })
  .extend({ neumeDefaultFontFamily: z.enum([...NEUME_FONT_FAMILIES]) })
  .partial();
export const headerFooterChangesSchema = headerFooterSettingsSchema
  .extend({ firstPageNumber: z.number().int().min(1) })
  .partial();
export type PageSetupChanges = z.infer<typeof pageSetupChangesSchema>;
export type HeaderFooterChanges = z.infer<typeof headerFooterChangesSchema>;

export function projectSettings<T extends Record<string, unknown>>(
  settings: T,
  properties?: string[],
): Partial<T> {
  return Object.fromEntries(
    Object.entries(settings).filter(
      ([key]) => properties === undefined || properties.includes(key),
    ),
  ) as Partial<T>;
}
