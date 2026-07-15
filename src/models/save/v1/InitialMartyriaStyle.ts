export type ModeKeyMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type TerminologyField =
  | 'completeModeName'
  | 'modeWord'
  | 'plagalWord'
  | 'ordinal'
  | 'absoluteModeLabel'
  | 'fromWord';

export interface ModeTerminology {
  id: string;
  displayName: string;
  languageTag: string;
  direction: 'ltr' | 'rtl';
  numberingSystem?: string;
  values: Partial<
    Record<TerminologyField, Partial<Record<ModeKeyMode, string>>>
  >;
}

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
  visibleForModes?: ModeKeyMode[];
  appearance?: InitialMartyriaAppearance;
}

export type InitialMartyriaComponent =
  | (ComponentBase & {
      kind: 'notationGlyph';
      source: 'modeWord' | 'plagalWord' | 'graveWord' | 'traditionalModeSign';
    })
  | (ComponentBase & { kind: 'terminology'; field: TerminologyField })
  | (ComponentBase & {
      kind: 'modeNumber';
      scheme: 'absolute' | 'familyOrdinal';
    })
  | (ComponentBase & { kind: 'startingPitchCluster' })
  | (ComponentBase & {
      kind: 'literal';
      text: string;
      languageTag?: string;
      direction?: 'ltr' | 'rtl';
    })
  | (ComponentBase & {
      kind: 'stackedText';
      upper: string;
      lower: string;
      gap: number;
    });

export interface InitialMartyriaStyle {
  id: string;
  displayName: string;
  terminologyId: string | null;
  flowDirection: 'page' | 'terminology' | 'ltr' | 'rtl';
  textAppearance: InitialMartyriaAppearance;
  notationAppearance: InitialMartyriaAppearance;
  components: InitialMartyriaComponent[];
  modeOverrides?: Partial<
    Record<ModeKeyMode, { components: InitialMartyriaComponent[] }>
  >;
}
