import { EventBus } from '@/eventBus';
import { IpcMainChannels, IpcRendererChannels } from './ipcChannels';

/**
 * This file abstracts the Electron IPC Renderer from the rest of the app.
 * For example, if running as a normal web site, a file menu could be
 * implemented that uses the Event Bus to send the same events.
 */
export const initializeIpcListeners = () => {
  for (let channel of Object.values(IpcMainChannels)) {
    window.ipcRenderer.on(channel, (...args) => {
      EventBus.$emit(channel, ...args);
    });
  }

  for (let channel of Object.values(IpcRendererChannels)) {
    EventBus.$on(channel, (...args: any[]) => {
      window.ipcRenderer.send(channel, ...args);
    });
  }
};
