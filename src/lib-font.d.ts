// Minimal typings for lib-font (which ships none), covering only the surface
// the app uses: parsing a font from bytes and walking the GSUB feature list
// for stylistic-set and character-variant names.
declare module 'lib-font' {
  // The parsed featureParams shape depends on the feature: stylistic sets
  // (ssXX) carry UINameID, character variants (cvXX) carry featUiLabelNameId.
  export interface GsubFeatureParams {
    UINameID?: number;
    featUiLabelNameId?: number;
  }

  export interface GsubFeatureTable {
    featureTag: string;
    getFeatureParams(): GsubFeatureParams | undefined;
  }

  export interface GsubScriptTable {
    scriptTag: string;
  }

  export interface GsubLangSysTable {
    langSysTag: string;
  }

  export interface GsubTable {
    getSupportedScripts(): string[];
    getScriptTable(scriptTag: string): GsubScriptTable;
    getSupportedLangSys(scriptTable: GsubScriptTable): string[];
    // Undefined for a 'dflt' tag when the script has no default LangSys.
    getLangSysTable(
      scriptTable: GsubScriptTable,
      langSysTag: string,
    ): GsubLangSysTable | undefined;
    // An entry is undefined when its feature record is missing.
    getFeatures(
      langSysTable: GsubLangSysTable,
    ): Array<GsubFeatureTable | undefined>;
  }

  export interface NameRecord {
    platformID: number;
    encodingID: number;
    languageID: number;
    nameID: number;
    // Already decoded for the UTF-16 platforms (Unicode and Windows); other
    // platforms need the re-decoding name.get() applies.
    string: string;
  }

  export interface NameTable {
    nameRecords: NameRecord[];
    get(nameID: number): string | undefined;
  }

  export class Font {
    constructor(name: string, options?: { skipStyleSheet?: boolean });

    // Populated once fromDataBuffer resolves.
    opentype: {
      tables: {
        GSUB?: GsubTable;
        name: NameTable;
      };
    };

    // Rejects when the buffer is not a supported font format.
    fromDataBuffer(buffer: ArrayBuffer, filenameOrUrl: string): Promise<void>;
  }
}
