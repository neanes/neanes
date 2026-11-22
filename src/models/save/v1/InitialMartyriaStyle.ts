export interface InitialMartyriaStructure {
  languageId: string;
  labelVariant?: string;
  modeIdentificationMethod: string;
  /** Absent for the sign group alone, which has no mode name. */
  numeralKind?: string;
  numeralStyle?: string;
  numberingSystem?: string;
  numeralQualifier?: string;
  modeNamingScheme?: string;
  transliterateNoteNames?: boolean;
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
