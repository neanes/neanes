import { parseFontVariantCaps } from '@/utils/fontVariants';

export interface InkBounds {
  advanceWidth: number;
  fontAscent: number;
  fontDescent: number;
  inkAscent: number;
  inkDescent: number;
  inkLeft: number;
  inkRight: number;
  inkWidth: number;
  leftOverhang: number;
  rightOverhang: number;
}

export interface FontVerticalMetrics {
  ascent: number;
  descent: number;
  height: number;
}

// Share vertical metrics by font shorthand (including size) for the session.
// initialize() in TheEditor.vue preloads bundled faces before loading documents.
// System-font aliases are registered on demand, so this cache assumes the
// resolved face is available when first measured and does not change afterward.
const fontVerticalMetricsCache = new Map<string, FontVerticalMetrics>();

// The canvas font shorthand cannot express font-variant-caps values other
// than small-caps, so caps are applied through the context's fontVariantCaps
// property instead. The owned CSS keywords are all valid canvas values;
// anything unknown measures as normal. The other font-variant properties
// (numeric, ligatures, alternates) have no canvas equivalent, so their width
// effects are not measurable and are accepted as approximation.
function toCanvasFontVariantCaps(fontVariantCaps: string) {
  return (parseFontVariantCaps(fontVariantCaps) ??
    'normal') as CanvasFontVariantCaps;
}

export class TextMeasurementService {
  private static canvas: HTMLCanvasElement | null = null;
  private static context: CanvasRenderingContext2D | null = null;
  // The raw fontVariantCaps value last applied to the context, so the
  // near-universal all-'normal' case skips both the keyword parse and the
  // canvas state write on every measurement.
  private static appliedFontVariantCaps = 'normal';

  // IMPORTANT: The canvas context is cached and reused between calls, and
  // CanvasRenderingContext2D is stateful. Every measurement goes through
  // prepareContext, which owns the font and font-variant-caps state; any
  // other stateful property a method starts depending on (textAlign,
  // direction, transforms, etc.) must be managed here too, so results stay
  // independent of call order.
  private static prepareContext(
    font: string,
    fontVariantCaps: string = 'normal',
  ): CanvasRenderingContext2D {
    if (!this.context) {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d')!;
    }

    this.context.font = font;

    if (fontVariantCaps !== this.appliedFontVariantCaps) {
      this.context.fontVariantCaps = toCanvasFontVariantCaps(fontVariantCaps);
      this.appliedFontVariantCaps = fontVariantCaps;
    }

    return this.context;
  }

  public static getTextWidth(
    text: string,
    font: string,
    fontVariantCaps: string = 'normal',
  ) {
    const context = this.prepareContext(font, fontVariantCaps);

    const metrics = context.measureText(text);
    return metrics.width;
  }

  public static getInkBounds(text: string, font: string): InkBounds {
    const context = this.prepareContext(font);

    const metrics = context.measureText(text);
    const inkLeft = -metrics.actualBoundingBoxLeft;
    const inkRight = metrics.actualBoundingBoxRight;
    const inkWidth =
      metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;

    return {
      advanceWidth: metrics.width,
      fontAscent: metrics.fontBoundingBoxAscent,
      fontDescent: metrics.fontBoundingBoxDescent,
      inkAscent: metrics.actualBoundingBoxAscent,
      inkDescent: metrics.actualBoundingBoxDescent,
      inkLeft,
      inkRight,
      inkWidth,
      leftOverhang: Math.max(0, metrics.actualBoundingBoxLeft),
      rightOverhang: Math.max(
        0,
        metrics.actualBoundingBoxRight - metrics.width,
      ),
    };
  }

  public static getTextHeight(text: string, font: string) {
    const context = this.prepareContext(font);

    const metrics = context.measureText(text);
    return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  }

  public static getFontHeight(font: string) {
    return this.getFontVerticalMetrics(font).height;
  }

  public static getFontVerticalMetrics(font: string): FontVerticalMetrics {
    const context = this.prepareContext(font);
    const metrics = context.measureText('');
    const ascent = metrics.fontBoundingBoxAscent;
    const descent = metrics.fontBoundingBoxDescent;

    return {
      ascent,
      descent,
      height: ascent + descent,
    };
  }

  public static getFontBoundingBoxDescent(font: string) {
    return this.getFontVerticalMetrics(font).descent;
  }

  public static getFontBoundingBoxAscent(font: string) {
    return this.getFontVerticalMetrics(font).ascent;
  }

  public static getCachedFontVerticalMetrics(
    font: string,
  ): FontVerticalMetrics {
    let metrics = fontVerticalMetricsCache.get(font);

    if (metrics == null) {
      metrics = this.getFontVerticalMetrics(font);

      fontVerticalMetricsCache.set(font, metrics);
    }

    return metrics;
  }
}
