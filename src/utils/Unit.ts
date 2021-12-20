export class Unit {
  public static FromInch(inches: number) {
    return inches * 96;
  }

  public static FromPt(points: number) {
    return (points * 96) / 72;
  }
}
