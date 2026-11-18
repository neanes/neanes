import { Staff } from './Score';

export class Footnote {
  public id: string = '';
  public marker: string | undefined = undefined;
  public staff: Staff = new Staff();
}
