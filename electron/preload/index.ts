import { contextBridge, ipcRenderer } from 'electron';

import {
  IpcMainChannels,
  IpcRendererChannels,
} from '../../src/ipc/ipcChannels';

// Expose ipcRenderer to the client
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel: IpcRendererChannels, ...args: any[]) => {
    const validChannels = Object.values(IpcRendererChannels);
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel: IpcMainChannels, func: (...args: any[]) => void) => {
    const validChannels = Object.values(IpcMainChannels);
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  invoke: (channel: IpcRendererChannels, ...args: any[]) => {
    const validChannels = Object.values(IpcRendererChannels);
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
});

// Expose platform
contextBridge.exposeInMainWorld('platform', process.platform);
