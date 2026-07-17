import type { Neume } from '@/models/Neumes';

export type ModeKeyMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface InitialMartyriaVisibility {
  modes: ModeKeyMode[];
  variationOverrides: Array<{ templateId: number; visible: boolean }>;
}

export type InitialMartyriaTextContent =
  | { layout: 'inline'; text: string }
  | { layout: 'stacked'; lines: string[]; gap: number };

export type InitialMartyriaGlyphSource =
  | { type: 'fixed'; neume: Neume }
  | { type: 'derived'; value: 'modeSign' | 'startingPitchCluster' };

export interface InitialMartyriaAppearance {
  fontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
  color?: string;
  strokeWidth?: number;
  strokeColor?: string;
  baselineShift?: number;
  offsetInline?: number;
  spacingBefore?: number;
  spacingAfter?: number;
}

interface ComponentBase {
  id: string;
  visibility: InitialMartyriaVisibility;
  appearance?: InitialMartyriaAppearance;
}
export type InitialMartyriaComponent =
  | (ComponentBase & {
      kind: 'text';
      content: InitialMartyriaTextContent;
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
    })
  | (ComponentBase & { kind: 'glyph'; source: InitialMartyriaGlyphSource });

export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  textParagraphStyleId?: string | null;
  flowDirection: 'page' | 'ltr' | 'rtl';
  textAppearance: InitialMartyriaAppearance;
  glyphAppearance: InitialMartyriaAppearance;
  components: InitialMartyriaComponent[];
}
