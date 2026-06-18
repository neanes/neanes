export interface InkBounds {
  advanceWidth: number;
  inkLeft: number;
  inkRight: number;
  inkWidth: number;
  leftOverhang: number;
  rightOverhang: number;
}

export class TextMeasurementService {
  private static canvas: HTMLCanvasElement | null = null;
  private static context: CanvasRenderingContext2D | null = null;

  // IMPORTANT: The canvas context is cached and reused between calls.
  // CanvasRenderingContext2D is stateful, so every method that uses this
  // context must explicitly set all properties it depends on (e.g. font,
  // textAlign, direction, transforms, etc.) before measuring or drawing.
  // Otherwise state from a previous call may affect later results.
  private static getContext(): CanvasRenderingContext2D {
    if (!this.context) {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d')!;
    }

    return this.context;
  }

  public static getTextWidth(text: string, font: string) {
    const context = this.getContext();

    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }

  public static getInkBounds(text: string, font: string): InkBounds {
    const context = this.getContext();

    context.font = font;
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
    const context = this.getContext();

    context.font = font;
    const metrics = context.measureText(text);
    return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  }

  public static getFontHeight(font: string) {
    const context = this.getContext();

    context.font = font;
    const metrics = context.measureText('');
    return metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  }

  public static getFontBoundingBoxDescent(font: string) {
    const context = this.getContext();

    context.font = font;
    const metrics = context.measureText('');
    return metrics.fontBoundingBoxDescent;
  }

  public static getFontBoundingBoxAscent(font: string) {
    const context = this.getContext();

    context.font = font;
    const metrics = context.measureText('');
    return metrics.fontBoundingBoxAscent;
  }
}
