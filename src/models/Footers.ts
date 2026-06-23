import { Footer } from './Footer';

export class Footers {
  public default: Footer = new Footer();
  public odd: Footer = new Footer();
  public even: Footer = new Footer();
  public firstPage: Footer = new Footer();

  public clone() {
    const clone = new Footers();
    clone.default = this.default.clone();
    clone.odd = this.odd.clone();
    clone.even = this.even.clone();
    clone.firstPage = this.firstPage.clone();
    return clone;
  }
}
