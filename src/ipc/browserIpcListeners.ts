import { EventBus } from '@/eventBus';

import { IpcMainChannels } from './ipcChannels';

export const initalizeBrowserIpcListeners = () => {
  // If using the browser, then we need to hook into the beforeprint event
  // to handle printing
  window.addEventListener('beforeprint', () =>
    EventBus.$emit(IpcMainChannels.FileMenuPrint),
  );
};
