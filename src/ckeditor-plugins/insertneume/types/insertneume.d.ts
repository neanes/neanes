import 'ckeditor5';

import { InsertNeumeDefaultAttributesType } from '../insertneumeutil';

declare module 'ckeditor5' {
  interface EditorConfig {
    insertNeume?: {
      neumeDefaultFontFamily?: string;
      defaultFontSize?: number;
      fthoraDefaultColor?: string;
      defaultAttributes?: InsertNeumeDefaultAttributesType;
      defaultAttributesMartyria?: Partial<InsertNeumeAttributes>;
    };
  }
}
