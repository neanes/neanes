export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  languageId: string;
  modeIdentificationMethod: string;
  numeralKind: string;
  numeralStyle?: string;
  numberingSystem?: string;
  numeralQualifier: string;
  modeNamingScheme: string;
  transliterateNoteNames: boolean | undefined;
  paragraphStyleId: string;
  greekParagraphStyleId: string;
  useOrdinalForms: boolean | undefined;
  lettering?: string;
}
