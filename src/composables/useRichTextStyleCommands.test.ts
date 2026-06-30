import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_TEXT_STYLE_IDS,
  createTextStyleFallback,
  createTextStylesFromDefaults,
} from '@/models/TextStyle';

import {
  resolveRichTextTextStyleState,
  shouldSyncTextStyleAlignment,
  TEXT_STYLE_MIXED_VALUE,
  TEXT_STYLE_NONE_VALUE,
} from './useRichTextStyleCommands';

describe('resolveRichTextTextStyleState', () => {
  const textStyles = createTextStylesFromDefaults();
  const fallbackTextStyle = createTextStyleFallback();

  it('uses None plus the fallback style when no Neanes paragraph style is active', () => {
    const state = resolveRichTextTextStyleState(
      textStyles,
      [],
      fallbackTextStyle,
    );

    expect(state.textStyleValue).toBe(TEXT_STYLE_NONE_VALUE);
    expect(state.activeTextStyle).toBeNull();
    expect(state.resolvedActiveTextStyle).toEqual(fallbackTextStyle);
  });

  it('resolves the active Neanes paragraph style when exactly one is active', () => {
    const state = resolveRichTextTextStyleState(
      textStyles,
      [BUILT_IN_TEXT_STYLE_IDS.Lyrics],
      fallbackTextStyle,
    );

    expect(state.textStyleValue).toBe(BUILT_IN_TEXT_STYLE_IDS.Lyrics);
    expect(state.activeTextStyle?.fontFamily).toBe(
      textStyles.find((style) => style.id === BUILT_IN_TEXT_STYLE_IDS.Lyrics)
        ?.overrides.fontFamily,
    );
    expect(state.resolvedActiveTextStyle).toEqual(state.activeTextStyle);
  });

  it('uses Mixed plus the fallback style when multiple Neanes paragraph styles are active', () => {
    const state = resolveRichTextTextStyleState(
      textStyles,
      [BUILT_IN_TEXT_STYLE_IDS.Title, BUILT_IN_TEXT_STYLE_IDS.Lyrics],
      fallbackTextStyle,
    );

    expect(state.textStyleValue).toBe(TEXT_STYLE_MIXED_VALUE);
    expect(state.activeTextStyle).toBeNull();
    expect(state.resolvedActiveTextStyle).toEqual(fallbackTextStyle);
  });

  it('does not resync alignment when the style alignment already matches the selection', () => {
    expect(shouldSyncTextStyleAlignment('center', 'center')).toBe(false);
    expect(shouldSyncTextStyleAlignment('left', 'left')).toBe(false);
    expect(shouldSyncTextStyleAlignment(undefined, 'center')).toBe(true);
    expect(shouldSyncTextStyleAlignment('left', 'center')).toBe(true);
  });
});
