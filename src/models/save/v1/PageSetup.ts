import { Unit } from '@/utils/Unit';

export type PageSize = 'A3' | 'A4' | 'A5' | 'Legal' | 'Letter' | 'Tabloid';
export type PageSizeUnit = 'pc' | 'pt' | 'cm' | 'mm' | 'in';

export class PageSetup {
  public pageSize: PageSize = 'Letter';
  public pageSizeUnit: PageSizeUnit = 'in';

  public landscape: boolean | undefined = undefined;

  public pageWidth = Unit.fromInch(8.5);
  public pageHeight = Unit.fromInch(11);
  public topMargin = Unit.fromInch(1);
  public bottomMargin = Unit.fromInch(1);
  public leftMargin = Unit.fromInch(1);
  public rightMargin = Unit.fromInch(1);

  public headerMargin = Unit.fromInch(0.5);
  public footerMargin = Unit.fromInch(0.5);
  public headerDifferentFirstPage: boolean | undefined = undefined;
  public headerDifferentOddEven: boolean | undefined = undefined;
  public showHeader: boolean | undefined = undefined;
  public showFooter: boolean | undefined = undefined;
  public richHeaderFooter: boolean | undefined = undefined;
  public firstPageNumber = 1;

  public lineHeight = Unit.fromInch(0.76);

  public melkiteRtl: boolean | undefined = false;

  public lyricsDefaultFontFamily = 'Source Serif';
  public lyricsDefaultFontSize = Unit.fromPt(12);
  public lyricsDefaultFontWeight = '400';
  public lyricsDefaultFontStyle = 'normal';
  public lyricsDefaultColor = '#000000';
  public lyricsDefaultStrokeWidth = 0;
  public lyricsVerticalOffset = -Unit.fromInch(0.05);
  public lyricsMinimumSpacing = Unit.fromInch(0.05);
  public lyricsMelismaCutoffWidth = Unit.fromPt(5);

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
  public dropCapDefaultLineHeight: number | undefined = undefined;

  public textBoxDefaultFontFamily = 'Source Serif';
  public textBoxDefaultFontSize = Unit.fromPt(20);
  public textBoxDefaultFontWeight = '400';
  public textBoxDefaultFontStyle = 'normal';
  public textBoxDefaultColor = '#000000';
  public textBoxDefaultStrokeWidth = 0;
  public textBoxDefaultLineHeight: number | undefined = undefined;

  public hyphenSpacing: number = Unit.fromInch(0.75);

  public chrysanthineAccidentals: boolean | undefined = undefined;
  public noFthoraRestrictions: boolean | undefined = undefined;
  public disableGreekMelismata: boolean | undefined = undefined;
}
