import { Header } from './Header';

export class Headers {
  public default: Header = new Header();
  public odd: Header = new Header();
  public even: Header = new Header();
  public firstPage: Header = new Header();

  public clone() {
    const clone = new Headers();
    clone.default = this.default.clone();
    clone.odd = this.odd.clone();
    clone.even = this.even.clone();
    clone.firstPage = this.firstPage.clone();
    return clone;
  }
}
