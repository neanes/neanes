export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  languageId: string;
  labelVariant?: string;
  modeIdentificationMethod: string;
  numeralKind: string;
  numeralStyle?: string;
  numberingSystem?: string;
  numeralQualifier: string;
  modeNamingScheme: string;
  transliterateNoteNames: boolean | undefined;
  plagalAbbreviationWithModeSign?: boolean;
  paragraphStyleId: string;
  greekParagraphStyleId: string;
  useOrdinalForms: boolean | undefined;
  lettering?: string;
}
