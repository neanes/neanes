export class Unit {
  public static fromInch(inches: number) {
    return inches * 96;
  }

  public static toInch(pixels: number) {
    return pixels / 96;
  }

  public static fromPt(points: number) {
    return (points * 96) / 72;
  }

  public static toPt(points: number) {
    return (points * 72) / 96;
  }
}
