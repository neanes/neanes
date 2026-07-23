export {};

declare global {
  // A single installed font face as reported by the Local Font Access API
  // (queryLocalFonts). Not yet in the TypeScript DOM lib, so declared here.
  interface FontData {
    readonly family: string;
    readonly fullName: string;
    readonly postscriptName: string;
    readonly style: string;
    blob(): Promise<Blob>;
  }

  interface Window {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, func: (...args: any[]) => void) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
    platform: string;
    queryLocalFonts?: (options?: {
      postscriptNames?: string[];
    }) => Promise<FontData[]>;
  }
}
