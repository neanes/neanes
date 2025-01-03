export class Unit {
  public static fromInch(inches: number) {
    return inches * 96;
  }

  public static toInch(pixels: number) {
    return pixels / 96;
  }

  public static fromMm(mm: number) {
    return (mm / 25.4) * 96;
  }

  public static toMm(pixels: number) {
    return (pixels / 96) * 25.4;
  }

  public static fromCm(cm: number) {
    return (cm / 2.54) * 96;
  }

  public static toCm(pixels: number) {
    return (pixels / 96) * 2.54;
  }

  public static fromPercent(percent: number) {
    return percent / 100;
  }

  public static toPercent(value: number) {
    return value * 100;
  }

  public static fromPt(points: number) {
    return (points * 96) / 72;
  }

  public static toPt(pixels: number) {
    return (pixels * 72) / 96;
  }

  public static fromPc(picas: number) {
    return (picas * 96) / 6;
  }

  public static toPc(pixels: number) {
    return (pixels * 6) / 96;
  }
}
