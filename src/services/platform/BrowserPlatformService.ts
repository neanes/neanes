import { IPlatformService } from './IPlatformService';

export class BrowserPlatformService implements IPlatformService {
  public isMac = navigator.userAgent.includes('Mac');
  public isWin = navigator.userAgent.includes('Win');
  public isLinux = navigator.userAgent.includes('Linux');
}
