export class TextMeasurementService {
  private static canvas: HTMLCanvasElement | null = null;

  public static getTextWidth(text: string, font: string) {
    const canvas = this.canvas || document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
  }

  public static getTextHeight(text: string, font: string) {
    const canvas = this.canvas || document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  }

  public static getFontHeight(font: string) {
    const canvas = this.canvas || document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = font;
    const metrics = context.measureText('');
    return metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  }

  public static getFontBoundingBoxDescent(font: string) {
    const canvas = this.canvas || document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = font;
    const metrics = context.measureText('');
    return metrics.fontBoundingBoxDescent;
  }
}
