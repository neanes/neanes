import { Unit } from '../utils/Unit';

export enum MelismaStyle {
  Auto = 'auto',
  Western = 'western',
  Vocalic = 'vocalic',
}

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

export interface PageSizeOption {
  name: PageSize;
  height: number;
  width: number;
}

export const pageSizes: PageSizeOption[] = [
  {
    name: 'Letter',
    width: Unit.fromInch(8.5),
    height: Unit.fromInch(11),
  },
  {
    name: 'Tabloid',
    width: Unit.fromInch(11),
    height: Unit.fromInch(17),
  },
  {
    name: 'Legal',
    width: Unit.fromInch(8.5),
    height: Unit.fromInch(14),
  },
  {
    name: 'Half-Letter',
    width: Unit.fromInch(5.5),
    height: Unit.fromInch(8.5),
  },
  {
    name: 'Half-Legal',
    width: Unit.fromInch(7),
    height: Unit.fromInch(8.5),
  },
  {
    name: 'A3',
    width: Unit.fromMm(297),
    height: Unit.fromMm(420),
  },
  {
    name: 'A4',
    width: Unit.fromMm(210),
    height: Unit.fromMm(297),
  },
  {
    name: 'A5',
    width: Unit.fromMm(148),
    height: Unit.fromMm(210),
  },
  {
    name: 'Custom',
    width: 0,
    height: 0,
  },
];

export class PageSetup {
  public pageSize: PageSize = 'Letter';
  public pageSizeUnit: PageSizeUnit = 'in';

  public landscape: boolean = false;

  public pageWidth = Unit.fromInch(8.5);
  public pageHeight = Unit.fromInch(11);

  public pageWidthCustom = Unit.fromInch(8.5);
  public pageHeightCustom = Unit.fromInch(11);

  public topMargin = Unit.fromInch(1);
  public bottomMargin = Unit.fromInch(1);
  public leftMargin = Unit.fromInch(1);
  public rightMargin = Unit.fromInch(1);
  public facingPages = false;
  public direction: 'ltr' | 'rtl' = 'ltr';

  public headerMargin = Unit.fromInch(0.5);
  public footerMargin = Unit.fromInch(0.5);
  public headerDifferentFirstPage = false;
  public headerDifferentOddEven = false;
  public headerFooterDifferentChapterOpening = true;
  public showHeader = false;
  public showFooter = false;
  public richHeaderFooter = false;
  public firstPageNumber = 1;
  public numerals: 'westernArabic' | 'easternArabic' = 'westernArabic';

  public showHeaderHorizontalRule = false;
  public excludeHeaderHorizontalRuleFirstPage = false;
  public excludeHeaderHorizontalRuleEvenPage = false;
  public excludeHeaderHorizontalRuleOddPage = false;
  public excludeHeaderHorizontalRuleChapterOpening = false;
  public headerHorizontalRuleMarginTop = 0;
  public headerHorizontalRuleMarginBottom = 0;
  public headerHorizontalRuleThickness = Unit.fromPt(1);
  public headerHorizontalRuleColor = '#000000';

  public showFooterHorizontalRule = false;
  public excludeFooterHorizontalRuleFirstPage = false;
  public excludeFooterHorizontalRuleEvenPage = false;
  public excludeFooterHorizontalRuleOddPage = false;
  public excludeFooterHorizontalRuleChapterOpening = false;
  public footerHorizontalRuleMarginTop = 0;
  public footerHorizontalRuleMarginBottom = 0;
  public footerHorizontalRuleThickness = Unit.fromPt(1);
  public footerHorizontalRuleColor = '#000000';

  public lineHeight = Unit.fromInch(0.76);

  public melkiteRtl = false;

  public lyricsVerticalOffset = -Unit.fromInch(0.05);
  public lyricsMinimumSpacing = Unit.fromInch(0.05);
  public lyricsMelismaCutoffWidth = Unit.fromPt(5);

  // These properties are currently not exposed in the UI or saved as part of the byzx format.
  public lyricsMelismaSpacing = Unit.fromInch(0.025);
  public lyricsMelismaThickness = 1;

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

  public dropCapDefaultLineSpan = 1;

  public hyphenSpacing: number = Unit.fromMm(13.125);
  public minimumSyllableToHyphenClearance: number = Unit.fromMm(3.5);

  public martyriaVerticalOffset: number = Unit.fromPt(3);

  public chrysanthineAccidentals: boolean = true;
  public noFthoraRestrictions: boolean = false;
  public melismaStyle: MelismaStyle = MelismaStyle.Auto;
  public alignIsonIndicators: boolean = true;
  public ignorePunctuationWhenPositioningLyrics: boolean = true;

  public useOptionalDiatonicFthoras: boolean = false;

  public get innerPageWidth() {
    return this.pageWidth - this.leftMargin - this.rightMargin;
  }

  public get innerPageHeight() {
    return this.pageHeight - this.topMargin - this.bottomMargin;
  }
}
