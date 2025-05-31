import 'ckeditor5';

import { InsertNeumeDefaultAttributesType } from '../insertneumeutil';

declare module 'ckeditor5' {
  interface EditorConfig {
    insertNeume?: {
      neumeDefaultFontFamily?: string;
      lyricsDefaultFontSize?: number;
      fthoraDefaultColor?: string;
      defaultAttributes?: InsertNeumeDefaultAttributesType;
    };
  }
}
