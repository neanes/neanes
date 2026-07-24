import type { ModeSign } from '@/models/Neumes';

export type ModeKeyMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface InitialMartyriaVisibility {
  modes: ModeKeyMode[];
  variationOverrides: Array<{ templateId: number; visible: boolean }>;
}

export type InitialMartyriaCanonicalNote =
  | ModeSign.Ni
  | ModeSign.Pa
  | ModeSign.Vou
  | ModeSign.Ga
  | ModeSign.Thi
  | ModeSign.Ke
  | ModeSign.Zo;

export interface InitialMartyriaStartingNoteText {
  names: Record<InitialMartyriaCanonicalNote, string>;
  languageTag?: string;
  direction?: 'ltr' | 'rtl';
}

interface ComponentBase {
  id: string;
  visibility: InitialMartyriaVisibility;
}
export type InitialMartyriaComponent =
  | (ComponentBase & {
      kind: 'text';
      content: string;
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
      paragraphStyleId?: string;
    })
  | (ComponentBase & {
      kind: 'stackedText';
      top: string;
      bottom: string;
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
      paragraphStyleId?: string;
    })
  | (ComponentBase & {
      kind: 'ekhosGlyph' | 'plagalGlyph' | 'modeSignGlyph' | 'varysGlyph';
    })
  | (ComponentBase & {
      kind: 'startingNoteCluster';
      rendering: 'neume' | 'customText';
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
      paragraphStyleId?: string;
    });

export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  defaultParagraphStyleId: string;
  flowDirection: 'page' | 'ltr' | 'rtl';
  startingNoteText?: InitialMartyriaStartingNoteText;
  components: InitialMartyriaComponent[];
}
