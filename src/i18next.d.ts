import 'i18next';

import { defaultNS, resources } from './i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    enableSelector: true;
    resources: (typeof resources)['en'];
  }
}
