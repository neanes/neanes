import { parseFontVariantCaps } from '@/utils/fontVariants';

export interface InkBounds {
  advanceWidth: number;
  inkLeft: number;
  inkRight: number;
  inkWidth: number;
  leftOverhang: number;
  rightOverhang: number;
}

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
    const context = this.prepareContext(font);

    const metrics = context.measureText('');
    return metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  }

  public static getFontBoundingBoxDescent(font: string) {
    const context = this.prepareContext(font);

    const metrics = context.measureText('');
    return metrics.fontBoundingBoxDescent;
  }

  public static getFontBoundingBoxAscent(font: string) {
    const context = this.prepareContext(font);

    const metrics = context.measureText('');
    return metrics.fontBoundingBoxAscent;
  }
}
