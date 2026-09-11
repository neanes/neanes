import type { InitialMartyriaPitchGeometry } from '@/models/InitialMartyriaPitchGeometry';
import type { InitialMartyriaSeparator } from '@/models/InitialMartyriaResolver';
import type { InitialMartyriaStackedCharactersGeometry } from '@/models/InitialMartyriaStackedCharactersGeometry';
import type {
  InitialMartyriaAppearance,
  InitialMartyriaStyleResolution,
} from '@/models/InitialMartyriaStyle';

/**
 * Everything the renderer needs to draw an initial martyria beyond the
 * scalar computed fields on the element. Computed once by the layout
 * service in unzoomed pixels; the renderer only applies zoom.
 */
export interface InitialMartyriaLayout {
  resolution: InitialMartyriaStyleResolution;
  /** The style's primary text appearance, which the ambitus punctuation uses. */
  primaryAppearance: InitialMartyriaAppearance;
  /** One entry per run in resolution.runs. */
  runs: InitialMartyriaRunLayout[];
  trailingSeparator: InitialMartyriaSeparatorLayout;
  neumeBaselineCorrection: number;
  /** The tempo and ambitus glyphs beside the signature. */
  accessory: InitialMartyriaAccessoryLayout;
  /** Set when the ambitus is drawn. */
  ambitus: InitialMartyriaAmbitusLayout | null;
}

export interface InitialMartyriaSeparatorLayout {
  kind: InitialMartyriaSeparator;
  width: number;
  /** The font a word space is set in; fixed separators have none. */
  wordSpaceFont: InitialMartyriaWordSpaceFont | null;
}

export interface InitialMartyriaWordSpaceFont {
  fontFamily: string;
  fontStyle: string;
  fontSize: number;
}

export interface InitialMartyriaRunLayout {
  separatorBefore: InitialMartyriaSeparatorLayout;
  /** The size the run's glyphs, inline text, or pitch glyphs are drawn at. */
  fontSize: number;
  /** How far the run's baseline is raised; non-zero for glyph runs only. */
  baselineShift: number;
  /** Set for stacked-character runs. */
  stackedCharacters: InitialMartyriaStackedCharactersLayout | null;
  /** Set for starting pitch runs. */
  pitch: InitialMartyriaPitchRunLayout | null;
}

export interface InitialMartyriaStackedCharactersLayout {
  geometry: InitialMartyriaStackedCharactersGeometry;
  /** CSS line-height of each row. */
  lineHeight: number;
}

export interface InitialMartyriaPitchRunLayout {
  textFontSize: number;
  /** CSS line-height of the note name text. */
  textLineHeight: number;
  primary: InitialMartyriaPitchGeometry | null;
  secondary: InitialMartyriaPitchGeometry | null;
  clusterSeparatorWidth: number;
  /** The glue between the last note and the trailing glyphs. */
  trailingGlueWidth: number;
}

export interface InitialMartyriaAccessoryLayout {
  fontSize: number;
  baselineOffset: number;
  /** Gap between the signature and the tempo glyph that follows it. */
  tempoMarginLeft: number;
}

export interface InitialMartyriaAmbitusLayout {
  /** Margin before the low note, compensating for its left ink overhang. */
  lowMarginLeft: number;
  /** Margin after the high note, compensating for its right ink overhang. */
  highMarginRight: number;
}
