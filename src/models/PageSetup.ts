import { Unit } from '../utils/Unit';

export type PageSize = 'A3' | 'A4' | 'A5' | 'Legal' | 'Letter' | 'Tabloid';

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
    width: Unit.fromInch(11.69),
    height: Unit.fromInch(16.54),
  },
  {
    name: 'A4',
    width: Unit.fromInch(8.29),
    height: Unit.fromInch(11.69),
  },
  {
    name: 'A5',
    width: Unit.fromInch(5.83),
    height: Unit.fromInch(8.27),
  },
];

export class PageSetup {
  public pageSize: PageSize = 'Letter';

  public pageWidth = Unit.fromInch(8.5);
  public pageHeight = Unit.fromInch(11);

  public topMargin = Unit.fromInch(1);
  public bottomMargin = Unit.fromInch(1);
  public leftMargin = Unit.fromInch(1);
  public rightMargin = Unit.fromInch(1);

  public lineHeight = Unit.fromInch(0.75);

  public lyricsDefaultFontFamily = 'Omega';
  public lyricsDefaultFontSize = Unit.fromPt(12);
  public lyricsVerticalOffset = Unit.fromPt(30);

  public neumeDefaultFontSize = Unit.fromPt(20);
  public neumeDefaultSpacing = 3;

  public accidentalDefaultColor = '#ED0000';
  public fthoraDefaultColor = '#ED0000';
  public heteronDefaultColor = '#ED0000';
  public gorgonDefaultColor = '#ED0000';
  public measureBarDefaultColor = '#ED0000';

  public martyriaDefaultColor = '#ED0000';

  public tempoDefaultColor = '#ED0000';

  public modeKeyDefaultColor = '#ED0000';

  public dropCapDefaultFontFamily = 'Athonite';
  public dropCapDefaultFontSize = Unit.fromPt(60);
  public dropCapDefaultColor = '#000000';

  public get innerPageWidth() {
    return this.pageWidth - this.leftMargin - this.rightMargin;
  }

  public get innerPageHeight() {
    return this.pageHeight - this.topMargin - this.topMargin;
  }
}
