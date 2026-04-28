import 'ckeditor5';

import {
  InsertNeumeDefaultAttributesMartyriaType,
  InsertNeumeDefaultAttributesType,
} from '../insertneumeutil';

declare module 'ckeditor5' {
  interface EditorConfig {
    insertNeume?: {
      neumeDefaultFontFamily?: string;
      defaultFontFamily?: string;
      defaultFontSize?: number;
      fthoraDefaultColor?: string;
      defaultAttributes?: InsertNeumeDefaultAttributesType;
      defaultAttributesMartyria?: InsertNeumeDefaultAttributesMartyriaType;
    };
  }
}
