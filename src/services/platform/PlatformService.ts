import { IPlatformService } from './IPlatformService';

export class PlatformService implements IPlatformService {
  public isMac = window.platform === 'darwin';
  public isWin = window.platform === 'win32';
  public isLinux = window.platform === 'linux';
}
