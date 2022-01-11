import { Unit } from '@/utils/Unit';

export type PageSize = 'A3' | 'A4' | 'A5' | 'Legal' | 'Letter' | 'Tabloid';
export type PageSizeUnit = 'mm' | 'in';

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

  public lineHeight = Unit.fromInch(0.75);

  public lyricsDefaultFontFamily = 'Omega';
  public lyricsDefaultFontSize = Unit.fromPt(12);
  public lyricsDefaultColor = '#000000';
  public lyricsVerticalOffset = Unit.fromPt(30);

  public neumeDefaultFontSize = Unit.fromPt(20);
  public neumeDefaultColor = '#000000';
  public neumeDefaultSpacing = 3;

  public accidentalDefaultColor = '#ED0000';
  public fthoraDefaultColor = '#ED0000';
  public gorgonDefaultColor = '#ED0000';
  public heteronDefaultColor = '#ED0000';
  public measureBarDefaultColor = '#ED0000';
  public measureNumberDefaultColor = '#000000';

  public tempoDefaultColor = '#ED0000';

  public martyriaDefaultColor = '#ED0000';

  public modeKeyDefaultColor = '#ED0000';

  public dropCapDefaultFontFamily = 'Athonite';
  public dropCapDefaultFontSize = Unit.fromPt(60);
  public dropCapDefaultColor = '#000000';

  public hyphenSpacing: number = Unit.fromInch(0.75);
}
