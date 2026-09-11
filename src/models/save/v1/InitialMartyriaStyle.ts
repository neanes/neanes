export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  basedOn: string | undefined;
  languageId: string;
  modeIdentificationMethod: string;
  numeralKind: string;
  numeralStyle?: string;
  numberingSystem?: string;
  numeralQualifier: string;
  modeNamingScheme: string;
  transliterateNoteNames: boolean | undefined;
  paragraphStyleId: string;
  fontFamily: string | undefined;
  fontSize: number | undefined;
  fontSubfamily: string | undefined;
  color: string | undefined;
  strokeWidth: number | undefined;
  strokeColor: string | undefined;
  fontVariantCaps: string | null | undefined;
  fontVariantNumeric: string | null | undefined;
  fontVariantLigatures: string | null | undefined;
  fontVariantAlternates: string | null | undefined;
  /** Absent when Greek-script text follows the text font. */
  greekFontFamily: string | undefined;
  useOrdinalForms: boolean | undefined;
}
