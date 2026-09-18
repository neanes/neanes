import 'ckeditor5';

import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';

declare module 'ckeditor5' {
  interface EditorConfig {
    insertModeKey?: {
      pageSetup?: PageSetup;
      paragraphStyles?: ParagraphStyle[];
      initialMartyriaStyles?: InitialMartyriaStyle[];
      getPageSetup?: () => PageSetup;
      getParagraphStyles?: () => ParagraphStyle[];
      getInitialMartyriaStyles?: () => InitialMartyriaStyle[];
    };
  }
}
