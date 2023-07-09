import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcRendererChannels,
  IpcMainChannels,
} from '../../src/ipc/ipcChannels';

// Expose ipcRenderer to the client
contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, ...args) => {
    const validChannels = Object.values(IpcRendererChannels);
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, func) => {
    const validChannels = Object.values(IpcMainChannels);
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  invoke: (channel, ...args) => {
    const validChannels = Object.values(IpcRendererChannels);
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
  },
});

// Expose platform
contextBridge.exposeInMainWorld('platform', process.platform);
