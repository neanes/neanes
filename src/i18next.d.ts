import 'i18next';

import { defaultNS, resources } from './i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    enableSelector: 'strict';
    resources: (typeof resources)['en'];
  }
}
