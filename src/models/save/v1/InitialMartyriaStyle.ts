export interface InitialMartyriaAppearanceOverrides {
  mainFontFamily?: string;
  greekFontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
  color?: string;
  strokeWidth?: number;
  fontVariantCaps?: string | null;
  fontVariantNumeric?: string | null;
  fontVariantLigatures?: string | null;
  fontVariantAlternates?: string | null;
}

export interface InitialMartyriaConfiguration {
  styleId: string;
  transliterateNoteNames?: boolean;
  appearanceOverrides?: InitialMartyriaAppearanceOverrides;
}
