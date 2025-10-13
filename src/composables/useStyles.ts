import { StyleValue } from 'vue';

import { EmptyElement, NoteElement, ScoreElement } from '@/models/Element';
import { useEditorStore } from '@/stores/useEditorStore';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { withZoom } from '@/utils/withZoom';

export function useStyles() {
  const editor = useEditorStore();

  function getLyricStyle(element: NoteElement) {
    return {
      direction: editor.rtl ? 'rtl' : undefined,
      top: withZoom(element.lyricsVerticalOffset),
      paddingLeft:
        !element.isFullMelisma && element.lyricsHorizontalOffset > 0
          ? withZoom(element.lyricsHorizontalOffset)
          : undefined,
      paddingRight:
        !element.isFullMelisma && element.lyricsHorizontalOffset < 0
          ? withZoom(-element.lyricsHorizontalOffset)
          : undefined,
      fontSize: element.lyricsUseDefaultStyle
        ? withZoom(editor.score.pageSetup.lyricsDefaultFontSize)
        : withZoom(element.lyricsFontSize),
      fontFamily: element.lyricsUseDefaultStyle
        ? getFontFamilyWithFallback(
            editor.score.pageSetup.lyricsDefaultFontFamily,
            editor.score.pageSetup.neumeDefaultFontFamily,
          )
        : getFontFamilyWithFallback(
            element.lyricsFontFamily,
            editor.score.pageSetup.neumeDefaultFontFamily,
          ),
      fontWeight: element.lyricsUseDefaultStyle
        ? editor.score.pageSetup.lyricsDefaultFontWeight
        : element.lyricsFontWeight,
      fontStyle: element.lyricsUseDefaultStyle
        ? editor.score.pageSetup.lyricsDefaultFontStyle
        : element.lyricsFontStyle,
      textDecoration: element.lyricsUseDefaultStyle
        ? undefined
        : element.lyricsTextDecoration,
      color: element.lyricsUseDefaultStyle
        ? editor.score.pageSetup.lyricsDefaultColor
        : element.lyricsColor,
      webkitTextStrokeWidth: element.lyricsUseDefaultStyle
        ? withZoom(editor.score.pageSetup.lyricsDefaultStrokeWidth)
        : withZoom(element.lyricsStrokeWidth),
      lineHeight: withZoom(element.lyricsFontHeight),
      left: element.alignLeft ? 0 : undefined,
      textAlign: element.alignLeft ? 'left' : undefined,
    } as StyleValue;
  }

  function getEmptyBoxStyle(element: EmptyElement) {
    return {
      width: withZoom(element.width),
      height: withZoom(element.height),
    } as StyleValue;
  }

  function getElementStyle(element: ScoreElement) {
    return {
      left: !editor.rtl ? withZoom(element.x) : undefined,
      right: editor.rtl ? withZoom(element.x) : undefined,
      top: withZoom(element.y),
    } as StyleValue;
  }

  function getMelismaStyle(element: NoteElement) {
    return {
      width: withZoom(element.melismaWidth),
      minHeight: element.lyricsUseDefaultStyle
        ? withZoom(editor.score.pageSetup.lyricsDefaultFontSize)
        : withZoom(element.lyricsFontSize),
    } as StyleValue;
  }

  function getMelismaUnderscoreStyleOuter(element: NoteElement) {
    return {
      top: withZoom(element.melismaOffsetTop),
      height: withZoom(element.lyricsFontHeight),
      width: withZoom(element.melismaWidth),
    };
  }

  function getMelismaUnderscoreStyleInner(element: NoteElement) {
    const thickness = editor.score.pageSetup.lyricsMelismaThickness;

    const spacing = !element.isFullMelisma
      ? editor.score.pageSetup.lyricsMelismaSpacing
      : 0;

    return {
      borderBottom: `${withZoom(thickness)} solid ${
        element.lyricsUseDefaultStyle
          ? editor.score.pageSetup.lyricsDefaultColor
          : element.lyricsColor
      }`,
      left: withZoom(spacing),
      width: `calc(100% - ${withZoom(spacing)})`,
    };
  }

  function getMelismaHyphenStyle(element: NoteElement, index: number) {
    return {
      left: withZoom(element.hyphenOffsets[index]),
    } as StyleValue;
  }

  function getHeaderHorizontalRuleStyle(headerHeight: number) {
    return {
      left: withZoom(editor.score.pageSetup.leftMargin),
      top: withZoom(
        editor.score.pageSetup.headerMargin +
          headerHeight +
          editor.score.pageSetup.headerHorizontalRuleMarginTop,
      ),
      color: editor.score.pageSetup.headerHorizontalRuleColor,
      borderTopWidth: withZoom(
        editor.score.pageSetup.headerHorizontalRuleThickness,
      ),
      width: withZoom(editor.score.pageSetup.innerPageWidth),
    } as StyleValue;
  }

  function getFooterHorizontalRuleStyle(footerHeight: number) {
    return {
      left: withZoom(editor.score.pageSetup.leftMargin),
      bottom: withZoom(
        editor.score.pageSetup.footerMargin +
          footerHeight +
          editor.score.pageSetup.footerHorizontalRuleMarginBottom,
      ),
      color: editor.score.pageSetup.footerHorizontalRuleColor,
      borderTopWidth: withZoom(
        editor.score.pageSetup.footerHorizontalRuleThickness,
      ),
      width: withZoom(editor.score.pageSetup.innerPageWidth),
    } as StyleValue;
  }

  return {
    getHeaderHorizontalRuleStyle,
    getFooterHorizontalRuleStyle,
    getMelismaHyphenStyle,
    getMelismaUnderscoreStyleInner,
    getMelismaUnderscoreStyleOuter,
    getMelismaStyle,
    getLyricStyle,
    getElementStyle,
    getEmptyBoxStyle,
  };
}
