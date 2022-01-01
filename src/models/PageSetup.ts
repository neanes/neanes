import { Unit } from '../utils/Unit';

export class PageSetup {
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
