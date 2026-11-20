export interface InitialMartyriaStructure {
  languageId: string;
  labelVariant?: string;
  modeIdentificationMethod: string;
  numeralKind: string;
  numeralStyle?: string;
  numberingSystem?: string;
  numeralQualifier: string;
  modeNamingScheme: string;
  transliterateNoteNames?: boolean;
  plagalAbbreviationWithModeSign?: boolean;
}

export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  structure: InitialMartyriaStructure;
  paragraphStyleId: string;
  greekParagraphStyleId: string;
  useOrdinalForms?: boolean;
  lettering?: string;
}
