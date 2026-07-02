import { Unit } from '@/utils/Unit';

export type PageSize =
  | 'A3'
  | 'A4'
  | 'A5'
  | 'Legal'
  | 'Letter'
  | 'Tabloid'
  | 'Half-Letter'
  | 'Half-Legal'
  | 'Custom';
export type PageSizeUnit = 'pc' | 'pt' | 'cm' | 'mm' | 'in';

export class PageSetup {
  public pageSize: PageSize = 'Letter';
  public pageSizeUnit: PageSizeUnit = 'in';

  public landscape: boolean | undefined = undefined;

  public pageWidth = Unit.fromInch(8.5);
  public pageHeight = Unit.fromInch(11);
  public pageWidthCustom: number | undefined = undefined;
  public pageHeightCustom: number | undefined = undefined;
  public topMargin = Unit.fromInch(1);
  public bottomMargin = Unit.fromInch(1);
  public leftMargin = Unit.fromInch(1);
  public rightMargin = Unit.fromInch(1);
  public facingPages: boolean | undefined = undefined;
  public direction: 'ltr' | 'rtl' | undefined = undefined;

  public headerMargin = Unit.fromInch(0.5);
  public footerMargin = Unit.fromInch(0.5);
  public headerDifferentFirstPage: boolean | undefined = undefined;
  public headerDifferentOddEven: boolean | undefined = undefined;
  public headerFooterDifferentChapterOpening: boolean | undefined = undefined;
  public showHeader: boolean | undefined = undefined;
  public showFooter: boolean | undefined = undefined;
  public richHeaderFooter: boolean | undefined = undefined;
  public firstPageNumber = 1;
  public numerals: 'westernArabic' | 'easternArabic' | undefined = undefined;

  public showHeaderHorizontalRule: boolean | undefined = undefined;
  public excludeHeaderHorizontalRuleFirstPage: boolean | undefined = undefined;
  public excludeHeaderHorizontalRuleEvenPage: boolean | undefined = undefined;
  public excludeHeaderHorizontalRuleOddPage: boolean | undefined = undefined;
  public excludeHeaderHorizontalRuleChapterOpening: boolean | undefined =
    undefined;
  public headerHorizontalRuleMarginTop: number | undefined = undefined;
  public headerHorizontalRuleMarginBottom: number | undefined = undefined;
  public headerHorizontalRuleThickness: number | undefined = undefined;
  public headerHorizontalRuleColor: string | undefined = undefined;

  public showFooterHorizontalRule: boolean | undefined = undefined;
  public excludeFooterHorizontalRuleFirstPage: boolean | undefined = undefined;
  public excludeFooterHorizontalRuleEvenPage: boolean | undefined = undefined;
  public excludeFooterHorizontalRuleOddPage: boolean | undefined = undefined;
  public excludeFooterHorizontalRuleChapterOpening: boolean | undefined =
    undefined;
  public footerHorizontalRuleMarginTop: number | undefined = undefined;
  public footerHorizontalRuleMarginBottom: number | undefined = undefined;
  public footerHorizontalRuleThickness: number | undefined = undefined;
  public footerHorizontalRuleColor: string | undefined = undefined;

  public lineHeight = Unit.fromInch(0.76);

  public melkiteRtl: boolean | undefined = false;

  public lyricsDefaultFontFamily: string | undefined = undefined;
  public lyricsDefaultFontSize: number | undefined = undefined;
  public lyricsDefaultFontSubfamily: string | undefined = undefined;
  public lyricsDefaultFontStyle: string | undefined = undefined;
  public lyricsDefaultFontWeight: string | undefined = undefined;
  public lyricsDefaultColor: string | undefined = undefined;
  public lyricsDefaultStrokeWidth: number | undefined = undefined;
  public lyricsVerticalOffset = -Unit.fromInch(0.05);
  public lyricsMinimumSpacing = Unit.fromInch(0.05);
  public lyricsMelismaCutoffWidth = Unit.fromPt(5);

  public neumeDefaultFontFamily = 'Neanes';
  public neumeDefaultFontSize = Unit.fromPt(20);
  public neumeDefaultColor = '#000000';
  public neumeDefaultSpacing = 0;
  public neumeDefaultStrokeWidth = 0;

  public alternateLineDefaultFontSize = Unit.fromPt(12);
  public alternateLineDefaultColor = '#ED0000';

  public modeKeyDefaultColor = '#ED0000';
  public modeKeyDefaultStrokeWidth = 0;
  public modeKeyDefaultFontSize = Unit.fromPt(20);
  public modeKeyDefaultHeightAdjustment = 0;

  public accidentalDefaultColor = '#ED0000';
  public accidentalDefaultStrokeWidth = 0;
  public fthoraDefaultColor = '#ED0000';
  public fthoraDefaultStrokeWidth = 0;
  public heteronDefaultColor = '#ED0000';
  public heteronDefaultStrokeWidth = 0;
  public gorgonDefaultColor = '#ED0000';
  public gorgonDefaultStrokeWidth = 0;
  public measureBarDefaultColor = '#ED0000';
  public measureBarDefaultStrokeWidth = 0;
  public measureNumberDefaultColor = '#000000';
  public measureNumberDefaultStrokeWidth = 0;
  public noteIndicatorDefaultColor = '#ED0000';
  public noteIndicatorDefaultStrokeWidth = 0;
  public isonDefaultColor = '#ED0000';
  public isonDefaultStrokeWidth = 0;
  public breathDefaultColor = '#000000';
  public breathDefaultStrokeWidth = 0;
  public crossDefaultColor = '#000000';
  public crossDefaultStrokeWidth = 0;
  public koronisDefaultColor = '#ED0000';
  public koronisDefaultStrokeWidth = 0;
  public martyriaDefaultColor = '#ED0000';
  public martyriaDefaultStrokeWidth = 0;
  public tempoDefaultColor = '#ED0000';
  public tempoDefaultStrokeWidth = 0;

  public dropCapDefaultFontFamily: string | undefined = undefined;
  public dropCapDefaultFontSize: number | undefined = undefined;
  public dropCapDefaultFontSubfamily: string | undefined = undefined;
  public dropCapDefaultFontStyle: string | undefined = undefined;
  public dropCapDefaultFontWeight: string | undefined = undefined;
  public dropCapDefaultColor: string | undefined = undefined;
  public dropCapDefaultStrokeWidth: number | undefined = undefined;
  public dropCapDefaultLineHeight: number | undefined = undefined;
  public dropCapDefaultLineSpan = 1;

  // Deprecated load-only compatibility for pre-paragraph-style text boxes.
  public textBoxDefaultFontFamily: string | undefined = undefined;
  public textBoxDefaultFontSize: number | undefined = undefined;
  public textBoxDefaultFontSubfamily: string | undefined = undefined;
  public textBoxDefaultFontStyle: string | undefined = undefined;
  public textBoxDefaultFontWeight: string | undefined = undefined;
  public textBoxDefaultColor: string | undefined = undefined;
  public textBoxDefaultStrokeWidth: number | undefined = undefined;
  public textBoxDefaultLineHeight: number | undefined = undefined;

  public hyphenSpacing: number = Unit.fromMm(13.125);
  public minimumSyllableToHyphenClearance: number = Unit.fromMm(3.5);

  public martyriaVerticalOffset: number = Unit.fromPt(3);

  public chrysanthineAccidentals: boolean | undefined = undefined;
  public noFthoraRestrictions: boolean | undefined = undefined;
  public disableGreekMelismata: boolean | undefined = undefined;
  public alignIsonIndicators: boolean | undefined = undefined;
  public ignorePunctuationWhenPositioningLyrics: boolean | undefined =
    undefined;

  public useOptionalDiatonicFthoras: boolean | undefined = undefined;
}
