import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createParagraphStyleFallback,
  createParagraphStylesFromDefaults,
} from '@/models/ParagraphStyle';

import {
  PARAGRAPH_STYLE_MIXED_VALUE,
  PARAGRAPH_STYLE_NONE_VALUE,
  resolveRichTextParagraphStyleState,
  shouldSyncParagraphStyleAlignment,
} from './useRichTextStyleCommands';

describe('resolveRichTextParagraphStyleState', () => {
  const paragraphStyles = createParagraphStylesFromDefaults();
  const fallbackParagraphStyle = createParagraphStyleFallback();

  it('uses None plus the fallback style when no Neanes paragraph style is active', () => {
    const state = resolveRichTextParagraphStyleState(
      paragraphStyles,
      [],
      fallbackParagraphStyle,
    );

    expect(state.paragraphStyleValue).toBe(PARAGRAPH_STYLE_NONE_VALUE);
    expect(state.activeParagraphStyle).toBeNull();
    expect(state.resolvedActiveParagraphStyle).toEqual(fallbackParagraphStyle);
  });

  it('resolves the active Neanes paragraph style when exactly one is active', () => {
    const state = resolveRichTextParagraphStyleState(
      paragraphStyles,
      [BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics],
      fallbackParagraphStyle,
    );

    expect(state.paragraphStyleValue).toBe(BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics);
    expect(state.activeParagraphStyle?.fontFamily).toBe(
      paragraphStyles.find(
        (style) => style.id === BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      )?.overrides.fontFamily,
    );
    expect(state.resolvedActiveParagraphStyle).toEqual(
      state.activeParagraphStyle,
    );
  });

  it('uses Mixed plus the fallback style when multiple Neanes paragraph styles are active', () => {
    const state = resolveRichTextParagraphStyleState(
      paragraphStyles,
      [BUILT_IN_PARAGRAPH_STYLE_IDS.Title, BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics],
      fallbackParagraphStyle,
    );

    expect(state.paragraphStyleValue).toBe(PARAGRAPH_STYLE_MIXED_VALUE);
    expect(state.activeParagraphStyle).toBeNull();
    expect(state.resolvedActiveParagraphStyle).toEqual(fallbackParagraphStyle);
  });

  it('does not resync alignment when the style alignment already matches the selection', () => {
    expect(shouldSyncParagraphStyleAlignment('center', 'center')).toBe(false);
    expect(shouldSyncParagraphStyleAlignment('left', 'left')).toBe(false);
    expect(shouldSyncParagraphStyleAlignment(undefined, 'center')).toBe(true);
    expect(shouldSyncParagraphStyleAlignment('left', 'center')).toBe(true);
  });
});
