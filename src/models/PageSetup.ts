import { Unit } from "./Unit";

export class PageSetup {
    public pageWidth = Unit.FromInch(8.5);
    public pageHeight = Unit.FromInch(11);
    public topMargin = Unit.FromInch(1);
    public bottomMargin = Unit.FromInch(1);
    public leftMargin = Unit.FromInch(1);
    public rightMargin = Unit.FromInch(1);

    public lineHeight = Unit.FromInch(0.75);

    public lyricsDefaultFontFamily = 'Omega';
    public lyricsDefaultFontSize = 16;
    
    public neumeDefaultFontSize = 40;

    public dropCapDefaultFontFamily = 'Athonite';
    public dropCapDefaultFontSize = 80;
    public dropCapDefaultColor = 'black';

    public get innerPageWidth() {
        return this.pageWidth - this.leftMargin - this.rightMargin;
    }

    public get innerPageHeight() {
        return this.pageHeight - this.topMargin - this.topMargin;
    }
}