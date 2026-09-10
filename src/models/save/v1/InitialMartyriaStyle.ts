export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  basedOn: string | undefined;
  languageId: string;
  modeIdentificationMethod: string;
  numeralKind: string;
  numeralStyle: string;
  numberingSystem?: string;
  numeralQualifier: string;
  modeNamingScheme: string;
  transliterateNoteNames: boolean | undefined;
  flowDirection: string | undefined;
  mainFontFamily: string;
  greekFontFamily: string;
  fontStyle: string;
  fontSize: number;
  color: string;
  strokeWidth: number;
  fontVariantCaps: string | null | undefined;
  fontVariantNumeric: string | null | undefined;
  fontVariantLigatures: string | null | undefined;
  fontVariantAlternates: string | null | undefined;
}
