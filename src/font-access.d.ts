interface FontData {
  family: string;
  fullName: string;
  postscriptName: string;
  style: string;
}

interface QueryLocalFontsOptions {
  postscriptNames?: string[];
}

interface Window {
  queryLocalFonts(options?: QueryLocalFontsOptions): Promise<FontData[]>;
}
