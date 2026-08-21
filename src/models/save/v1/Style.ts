import type { TextBoxAlignment } from './Element';

export class ParagraphStyle {
  public id: string = '';
  public displayName: string = '';
  public parentStyleId: string | undefined = undefined;
  public alignment: TextBoxAlignment | undefined = undefined;
  public fontFamily: string | undefined = undefined;
  public fontSize: number | undefined = undefined;
  public fontSubfamily: string | undefined = undefined;
  public color: string | undefined = undefined;
  public strokeWidth: number | undefined = undefined;
  public strokeColor: string | undefined = undefined;
  public lineHeight: number | null | undefined = undefined;
  public textDecoration: 'underline' | null | undefined = undefined;
  public fontVariantCaps: string | null | undefined = undefined;
  public fontVariantNumeric: string | null | undefined = undefined;
  public fontVariantLigatures: string | null | undefined = undefined;
  public fontVariantAlternates: string | null | undefined = undefined;
}
