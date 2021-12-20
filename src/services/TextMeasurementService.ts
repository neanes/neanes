export class TextMeasurementService {
  private static canvas: HTMLCanvasElement | null = null;

  public static getTextWidth(text: string, font: string) {
    let canvas = this.canvas || document.createElement('canvas');
    let context = canvas.getContext('2d')!;
    context.font = font;
    let metrics = context.measureText(text);
    return metrics.width;
  }

  public static getTextHeight(text: string, font: string) {
    let canvas = this.canvas || document.createElement('canvas');
    let context = canvas.getContext('2d')!;
    context.font = font;
    let metrics = context.measureText(text);
    return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
  }

  public static getFontHeight(font: string) {
    let canvas = this.canvas || document.createElement('canvas');
    let context = canvas.getContext('2d')!;
    context.font = font;
    let metrics = context.measureText('');
    return metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
  }

  public static getFontBoundingBoxDescent(text: string, font: string) {
    let canvas = this.canvas || document.createElement('canvas');
    let context = canvas.getContext('2d')!;
    context.font = font;
    let metrics = context.measureText(text);
    return metrics.fontBoundingBoxDescent;
  }
}
