import { Unit } from "../utils/Unit";

export class PageSetup {
    public pageWidth = Unit.FromInch(8.5);
    public pageHeight = Unit.FromInch(11);
    public topMargin = Unit.FromInch(1);
    public bottomMargin = Unit.FromInch(1);
    public leftMargin = Unit.FromInch(1);
    public rightMargin = Unit.FromInch(1);

    public lineHeight = Unit.FromInch(0.75);

    public lyricsDefaultFontFamily = 'Omega';
    public lyricsDefaultFontSize = Unit.FromPt(12);
    public lyricsVerticalOffset = Unit.FromPt(30);

    public neumeDefaultFontSize = Unit.FromPt(20);

    public martyriaDefaultColor = '#ED0000';

    public dropCapDefaultFontFamily = 'Athonite';
    public dropCapDefaultFontSize = Unit.FromPt(60);
    public dropCapDefaultColor = 'black';

    public get innerPageWidth() {
        return this.pageWidth - this.leftMargin - this.rightMargin;
    }

    public get innerPageHeight() {
        return this.pageHeight - this.topMargin - this.topMargin;
    }
}