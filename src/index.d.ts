import { IpcRenderer } from 'electron';

declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, data: any) => void;
      on: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}
