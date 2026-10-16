import { computed, type CSSProperties, type Ref, type StyleValue } from 'vue';

import {
  type DropCapElement,
  type EmptyElement,
  type NoteElement,
  type ScoreElement,
} from '@/models/Element';
import type { Page } from '@/models/Page';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type ResolvedParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import type { Score } from '@/models/Score';
import {
  type FontVerticalMetrics,
  TextMeasurementService,
} from '@/services/TextMeasurementService';
import { TATWEEL } from '@/utils/constants';
import { isDropCapElement } from '@/utils/elementTypeGuards';
import { resolveFontCss, resolveFontStyle } from '@/utils/fontStyle';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { resolvePageMargins } from '@/utils/PageMargins';
import { withZoom, withZoomOffset } from '@/utils/withZoom';

export function useScoreRendering(score: Ref<Score>, zoom: Ref<number>) {
  const rtl = computed(() => score.value.pageSetup.melkiteRtl);
  const resolvedDefaultLyricsStyle = computed(() =>
    resolveParagraphStyle(
      score.value.paragraphStyles,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    ),
  );
  function getResolvedLyricsStyle(element: NoteElement) {
    return resolveParagraphStyle(
      score.value.paragraphStyles,
      element.lyricsParagraphStyleId,
      element.getParagraphStyleOverrides(),
    );
  }
  function getResolvedMarginsForPage(page: Page) {
    return resolvePageMargins(score.value.pageSetup, page.physicalPageNumber);
  }

  function getHeaderStyle(page: Page) {
    const margins = getResolvedMarginsForPage(page);

    return {
      left: withZoom(margins.left),
      top: withZoom(score.value.pageSetup.headerMargin),
    } as StyleValue;
  }

  function getFooterStyle(page: Page) {
    const margins = getResolvedMarginsForPage(page);

    return {
      left: withZoom(margins.left),
      bottom: withZoom(score.value.pageSetup.footerMargin),
    } as StyleValue;
  }

  function getHeaderHorizontalRuleStyle(page: Page, headerHeight: number) {
    const margins = getResolvedMarginsForPage(page);

    return {
      left: withZoom(margins.left),
      top: withZoom(
        score.value.pageSetup.headerMargin +
          headerHeight +
          score.value.pageSetup.headerHorizontalRuleMarginTop,
      ),
      borderColor: score.value.pageSetup.headerHorizontalRuleColor,
      borderTopWidth: withZoom(
        score.value.pageSetup.headerHorizontalRuleThickness,
      ),
      width: withZoom(margins.contentWidth),
    } as StyleValue;
  }

  function getFooterHorizontalRuleStyle(page: Page, footerHeight: number) {
    const margins = getResolvedMarginsForPage(page);

    return {
      left: withZoom(margins.left),
      bottom: withZoom(
        score.value.pageSetup.footerMargin +
          footerHeight +
          score.value.pageSetup.footerHorizontalRuleMarginBottom,
      ),
      borderColor: score.value.pageSetup.footerHorizontalRuleColor,
      borderTopWidth: withZoom(
        score.value.pageSetup.footerHorizontalRuleThickness,
      ),
      width: withZoom(margins.contentWidth),
    } as StyleValue;
  }

  // Measuring the displayed font size avoids multiplying canvas metrics by a
  // fractional zoom. Chromium can round a rendered font baseline differently
  // from that scaled prediction, and any rounding already in the canonical
  // measurement is multiplied by the zoom, so the two can differ by more than
  // a pixel as the zoom grows. The shifts below are that residue: what the
  // browser actually does minus what scaling the canonical metrics would
  // predict. Only the residue is applied as a fixed offset, so the canonical
  // length keeps tracking --zoom.
  interface FontMetricShifts {
    canonical: FontVerticalMetrics;
    ascentShift: number;
    heightShift: number;
  }

  interface LyricMetricsCaches {
    styleShifts: Map<string, FontMetricShifts>;
    dropCapShifts: Map<string, FontMetricShifts>;
  }

  function getFontMetricShifts(
    font: string,
    displayedFont: string,
    zoomValue: number,
  ): FontMetricShifts {
    const canonical = TextMeasurementService.getCachedFontVerticalMetrics(font);
    // Not cached for the session: every zoom value would add an entry. The
    // caller's per-zoom caches already avoid repeat measurements.
    const displayed =
      TextMeasurementService.getFontVerticalMetrics(displayedFont);

    return {
      canonical,
      ascentShift: displayed.ascent - canonical.ascent * zoomValue,
      heightShift: displayed.height - canonical.height * zoomValue,
    };
  }

  // The shifts depend only on the font and the zoom, so they are resolved once
  // per distinct lyrics style instead of once per note per render. The key is
  // the style's font identity, which is cheaper to build than the CSS font
  // shorthand it resolves to.
  function getParagraphStyleMetricShifts(
    caches: LyricMetricsCaches,
    style: ResolvedParagraphStyle,
    zoomValue: number,
  ) {
    const key = `${style.fontFamily} | ${style.fontStyle} | ${style.fontSize}`;

    let shifts = caches.styleShifts.get(key);

    if (shifts == null) {
      shifts = getFontMetricShifts(
        resolveFontCss(style),
        resolveFontCss({ ...style, fontSize: style.fontSize * zoomValue }),
        zoomValue,
      );

      caches.styleShifts.set(key, shifts);
    }

    return shifts;
  }

  const displayedLyricMetricsContext = computed(() => {
    // The residues below describe what the browser does at this zoom. Print and
    // PDF render at the canonical size instead, and --zoom-residue drops them
    // there, so this does not have to anticipate the render target.
    const displayedZoom = zoom.value;
    const caches: LyricMetricsCaches = {
      styleShifts: new Map<string, FontMetricShifts>(),
      dropCapShifts: new Map<string, FontMetricShifts>(),
    };
    const defaultShifts = getParagraphStyleMetricShifts(
      caches,
      resolvedDefaultLyricsStyle.value,
      displayedZoom,
    );

    return {
      // Every lyric on the page shares one displayed baseline, no matter which
      // font it uses: the canonical baseline scaled by the zoom, plus the
      // default lyrics font's residue.
      defaultAscentShift: defaultShifts.ascentShift,
      defaultCanonicalAscent: defaultShifts.canonical.ascent,
      ...caches,
      zoom: displayedZoom,
    };
  });

  function getDisplayedLyricGeometry(
    element: NoteElement,
    resolvedLyricsStyle: ResolvedParagraphStyle,
  ) {
    const context = displayedLyricMetricsContext.value;
    const shifts = getParagraphStyleMetricShifts(
      context,
      resolvedLyricsStyle,
      context.zoom,
    );

    return {
      // A lyric in the default lyrics font cancels the two residues out, so its
      // top is exactly the uncorrected zoomed offset. Its rendered baseline
      // still moves, because the line height below drops the half-leading that
      // a purely zoomed line height would have left.
      top: withZoomOffset(
        element.lyricsVerticalOffset,
        context.defaultAscentShift - shifts.ascentShift,
      ),
      // Matching the line height to the measured font height leaves no
      // half-leading, so the baseline sits one displayed ascent below the top.
      lineHeight: withZoomOffset(shifts.canonical.height, shifts.heightShift),
    };
  }

  function getDisplayedDropCapTop(element: DropCapElement) {
    const context = displayedLyricMetricsContext.value;
    // The computed font carries the canonical size, and the zoom is fixed for
    // the whole context, so it identifies both measurements on its own.
    const font = element.computedFont;

    let shifts = context.dropCapShifts.get(font);

    if (shifts == null) {
      shifts = getFontMetricShifts(
        font,
        element.getComputedFont(element.computedFontSize * context.zoom),
        context.zoom,
      );

      context.dropCapShifts.set(font, shifts);
    }

    // The drop cap sits on the lyrics baseline, so it follows the displayed
    // lyric baseline, but the glyph moves within its own line box: its ascent
    // pushes the baseline down, and half of its height residue is taken by the
    // line box's half-leading.
    return withZoomOffset(
      element.y,
      context.defaultAscentShift - shifts.ascentShift + shifts.heightShift / 2,
    );
  }

  // The style properties the lyrics span and the leading-hyphen span share: the
  // resolved lyrics style plus the element's vertical metrics.
  function getLyricStyleBase(element: NoteElement): CSSProperties {
    const resolvedLyricsStyle = getResolvedLyricsStyle(element);
    const resolvedLyricsFont = resolveFontStyle(
      resolvedLyricsStyle.fontFamily,
      resolvedLyricsStyle.fontStyle,
    );
    const displayedGeometry = getDisplayedLyricGeometry(
      element,
      resolvedLyricsStyle,
    );

    return {
      top: displayedGeometry.top,
      fontSize: withZoom(resolvedLyricsStyle.fontSize),
      fontFamily: getFontFamilyWithFallback(
        resolvedLyricsFont.cssFontFamily,
        score.value.pageSetup.neumeDefaultFontFamily,
      ),
      fontWeight: resolvedLyricsFont.cssFontWeight,
      fontStyle: resolvedLyricsFont.cssFontStyle,
      fontVariantCaps: resolvedLyricsStyle.fontVariantCaps ?? undefined,
      fontVariantNumeric: resolvedLyricsStyle.fontVariantNumeric ?? undefined,
      fontVariantLigatures:
        resolvedLyricsStyle.fontVariantLigatures ?? undefined,
      fontVariantAlternates:
        resolvedLyricsStyle.fontVariantAlternates ?? undefined,
      textDecoration: resolvedLyricsStyle.textDecoration ?? undefined,
      color: resolvedLyricsStyle.color,
      webkitTextStrokeWidth: withZoom(resolvedLyricsStyle.strokeWidth),
      webkitTextStrokeColor: resolvedLyricsStyle.strokeColor,
      lineHeight: displayedGeometry.lineHeight,
    } as CSSProperties;
  }

  function getLyricStyle(element: NoteElement) {
    return {
      ...getLyricStyleBase(element),
      paddingLeft:
        (!element.isFullMelisma ||
          (element.melismaText && !element.melismaText.endsWith(TATWEEL))) &&
        element.lyricsHorizontalOffset > 0
          ? withZoom(element.lyricsHorizontalOffset)
          : undefined,
      paddingRight:
        (!element.isFullMelisma ||
          (element.melismaText && !element.melismaText.endsWith(TATWEEL))) &&
        element.lyricsHorizontalOffset < 0
          ? withZoom(-element.lyricsHorizontalOffset)
          : undefined,
      left: element.alignLeft
        ? withZoom(Math.min(0, element.lyricsHorizontalOffset))
        : undefined,
      textAlign: element.alignLeft ? 'left' : undefined,
    } as CSSProperties;
  }

  function getLeadingLyricHyphenStyle(element: NoteElement) {
    return {
      ...getLyricStyleBase(element),
      left: withZoom(element.leadingLyricHyphenOffset),
    } as CSSProperties;
  }

  function getEmptyBoxStyle(element: EmptyElement) {
    return {
      width: withZoom(element.width),
      height: withZoom(element.height),
    } as StyleValue;
  }

  function getElementStyle(element: ScoreElement) {
    return {
      left: !rtl.value ? withZoom(element.x) : undefined,
      right: rtl.value ? withZoom(element.x) : undefined,
      top: isDropCapElement(element)
        ? getDisplayedDropCapTop(element)
        : withZoom(element.y),
    } as StyleValue;
  }

  function getMelismaStyle(element: NoteElement) {
    const resolvedLyricsStyle = getResolvedLyricsStyle(element);

    return {
      width: withZoom(element.melismaWidth),
      minHeight: withZoom(resolvedLyricsStyle.fontSize),
    } as StyleValue;
  }

  function getMelismaUnderscoreStyleInner(element: NoteElement) {
    const thickness = score.value.pageSetup.lyricsMelismaThickness;
    const resolvedLyricsStyle = getResolvedLyricsStyle(element);

    const spacing = !element.isFullMelisma
      ? score.value.pageSetup.lyricsMelismaSpacing
      : 0;

    return {
      borderBottom: `${withZoom(thickness)} solid ${resolvedLyricsStyle.color}`,
      // A full melisma starts at the left edge of the lyrics container.
      left: element.isFullMelisma ? 0 : undefined,
      marginLeft: withZoom(spacing),
      width: withZoom(element.melismaWidth - spacing),
    };
  }

  function getMelismaHyphenStyle(element: NoteElement, index: number) {
    return {
      left: withZoom(element.hyphenOffsets[index]),
    } as StyleValue;
  }

  return {
    displayedLyricMetricsContext,
    getResolvedMarginsForPage,
    getHeaderStyle,
    getFooterStyle,
    getHeaderHorizontalRuleStyle,
    getFooterHorizontalRuleStyle,
    getLyricStyle,
    getLeadingLyricHyphenStyle,
    getEmptyBoxStyle,
    getElementStyle,
    getMelismaStyle,
    getMelismaUnderscoreStyleInner,
    getMelismaHyphenStyle,
  };
}
