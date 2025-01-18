import { Unit } from '../utils/Unit';

export type PageSize = 'A3' | 'A4' | 'A5' | 'Legal' | 'Letter' | 'Tabloid';
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
];

export class PageSetup {
  public pageSize: PageSize = 'Letter';
  public pageSizeUnit: PageSizeUnit = 'in';

  public landscape: boolean = false;

  public pageWidth = Unit.fromInch(8.5);
  public pageHeight = Unit.fromInch(11);

  public topMargin = Unit.fromInch(1);
  public bottomMargin = Unit.fromInch(1);
  public leftMargin = Unit.fromInch(1);
  public rightMargin = Unit.fromInch(1);

  public headerMargin = Unit.fromInch(0.5);
  public footerMargin = Unit.fromInch(0.5);
  public headerDifferentFirstPage = false;
  public headerDifferentOddEven = false;
  public showHeader = false;
  public showFooter = false;
  public richHeaderFooter = false;
  public firstPageNumber = 1;

  public lineHeight = Unit.fromInch(0.76);

  public melkiteRtl = false;

  public lyricsDefaultFontFamily = 'Source Serif';
  public lyricsDefaultFontSize = Unit.fromPt(12);
  public lyricsDefaultFontWeight = '400';
  public lyricsDefaultFontStyle = 'normal';
  public lyricsDefaultColor = '#000000';
  public lyricsDefaultStrokeWidth = 0;
  public lyricsVerticalOffset = -Unit.fromInch(0.05);
  public lyricsMinimumSpacing = Unit.fromInch(0.05);
  public lyricsMelismaCutoffWidth = Unit.fromPt(5);

  // These two melisma properties are currently not exposed in the UI or saved
  // as part of the byzx format.
  public lyricsMelismaSpacing = Unit.fromInch(0.025);
  public lyricsMelismaThickeness = 1;

  public get lyricsFont() {
    return `${this.lyricsDefaultFontStyle} normal ${this.lyricsDefaultFontWeight} ${this.lyricsDefaultFontSize}px "${this.lyricsDefaultFontFamily}"`;
  }

  public neumeDefaultFontFamily = 'Neanes';
  public neumeDefaultFontSize = Unit.fromPt(20);
  public neumeDefaultColor = '#000000';
  public neumeDefaultSpacing = Unit.fromInch(0.03);
  public neumeDefaultStrokeWidth = 0;

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
  public koronisDefaultColor = '#ED0000';
  public koronisDefaultStrokeWidth = 0;
  public martyriaDefaultColor = '#ED0000';
  public martyriaDefaultStrokeWidth = 0;
  public tempoDefaultColor = '#ED0000';
  public tempoDefaultStrokeWidth = 0;

  public dropCapDefaultFontFamily = 'Source Serif';
  public dropCapDefaultFontSize = Unit.fromPt(60);
  public dropCapDefaultFontWeight = '400';
  public dropCapDefaultFontStyle = 'normal';
  public dropCapDefaultColor = '#000000';
  public dropCapDefaultStrokeWidth = 0;
  public dropCapDefaultLineHeight: number | null = null;

  public textBoxDefaultFontFamily = 'Source Serif';
  public textBoxDefaultFontSize = Unit.fromPt(20);
  public textBoxDefaultFontWeight = '400';
  public textBoxDefaultFontStyle = 'normal';
  public textBoxDefaultColor = '#000000';
  public textBoxDefaultStrokeWidth = 0;
  public textBoxDefaultLineHeight: number | null = null;

  public hyphenSpacing: number = Unit.fromInch(0.75);

  public chrysanthineAccidentals: boolean = true;
  public noFthoraRestrictions: boolean = false;
  public disableGreekMelismata: boolean = false;

  public get innerPageWidth() {
    return this.pageWidth - this.leftMargin - this.rightMargin;
  }

  public get innerPageHeight() {
    return this.pageHeight - this.topMargin - this.bottomMargin;
  }
}
