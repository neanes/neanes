import 'ckeditor5';

import type { QuoteStyle } from '@/utils/smartQuotes';

declare module 'ckeditor5' {
  interface EditorConfig {
    // Returns the quote style to type with, or null when smart quotes are off.
    smartQuotes?: () => QuoteStyle | null;
  }
}
